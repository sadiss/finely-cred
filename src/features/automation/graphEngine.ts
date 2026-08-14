/**
 * Per-enrollment graph-executing workflow runner (Phase 2 — real server-side
 * execution engine, client-side implementation).
 *
 * Runs entirely client-side (ticked from src/lib/platformCron.ts, matching the
 * existing architecture — see src/automation/agentRunner.ts for flat
 * interval-rule execution and src/features/crm/sequences/runCrmSequenceEngine.ts
 * for the closest prior art of a per-enrollment step runner). automation-runner
 * (Supabase Edge Function) already has its own DB-backed interval-rule sweep
 * (processAutomationRulesFromDb.ts) for `trigger: interval` rules; this engine
 * complements it by walking the *visual flow graph* (wait / branch / goal
 * nodes) per enrollment, which the interval sweep does not do. Automation
 * rules built from the flow canvas (AutomationStudioShell.tsx) keep working
 * with either engine — flowGraphToRulePatch() still derives the flat
 * trigger/conditions/actions used by agentRunner.ts / automationEventBridge.ts
 * for immediate-fire rules; this engine is for rules whose flow contains
 * wait/branch/goal nodes and therefore need real multi-step traversal over time.
 */
import type {
  AutomationActionV2,
  AutomationEnrollment,
  AutomationFlowGraph,
  AutomationFlowNode,
  AutomationRule,
} from '../../domain/automationStudio';
import { ruleToFlowGraph } from './automationFlowModel';
import {
  createAutomationEnrollment,
  getAutomationRule,
  listAutomationEnrollments,
  listAutomationRules,
  upsertAutomationEnrollment,
} from '../../data/automationStudioRepo';
import type { CrmRecord } from '../../domain/crmRecords';
import { crmRecordDisplayName } from '../../domain/crmRecords';
import { getCrmRecord, setCrmRecordStage } from '../../data/crmRecordsRepo';
import { addProspectNote } from '../../data/crmProspectsRepo';
import { addLeadNote, getLeadOp, upsertLeadOp } from '../../data/leadOpsRepo';
import { enrollCrmRecordInSequence } from '../../data/crmSequencesRepo';
import { createTask } from '../../data/tasksRepo';
import { createNotification } from '../../data/notificationsRepo';
import {
  checkSuppression,
  isOverFrequencyCap,
  recordSendForFrequencyCap,
  resolveFrequencyCapKey,
} from '../../data/commsSuppressionRepo';
import { sendEmail, sendSms } from '../../lib/commsDeliveryClient';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { logAgentAction } from '../../lib/agentAuditLog';

const AGENT_ID = 'automation-graph-engine';
const MAX_ATTEMPTS = 5;
/** Guard against a badly-authored graph (cycle with no wait/goal) looping forever within one tick. */
const MAX_HOPS_PER_TICK = 25;

export type BranchField = 'stage' | 'tag' | 'score' | 'target' | 'kind' | 'source';
export type BranchOp = 'eq' | 'neq' | 'has' | 'gte' | 'lte';

export type GraphBranchData = {
  branchLabel?: string;
  field?: BranchField;
  op?: BranchOp;
  value?: string | number;
};

export type GraphWaitData = { waitHours?: number };

function flowFor(rule: AutomationRule): AutomationFlowGraph {
  return rule.flow?.nodes?.length ? rule.flow : ruleToFlowGraph(rule);
}

function findNode(flow: AutomationFlowGraph, id?: string): AutomationFlowNode | undefined {
  if (!id) return undefined;
  return flow.nodes.find((n) => n.id === id);
}

function outgoingEdges(flow: AutomationFlowGraph, nodeId: string) {
  return flow.edges.filter((e) => e.source === nodeId);
}

function firstNodeId(flow: AutomationFlowGraph): string | undefined {
  const trigger = flow.nodes.find((n) => n.type === 'trigger');
  if (trigger) {
    const next = outgoingEdges(flow, trigger.id)[0];
    if (next) return next.target;
  }
  return flow.nodes[0]?.id;
}

function logRecordActivity(record: CrmRecord, label: string) {
  if (record.sourceRef?.type === 'prospect') {
    addProspectNote(record.sourceRef.id, `[Automation] ${label}`);
  } else if (record.sourceRef?.type === 'lead') {
    addLeadNote(record.sourceRef.id, `[Automation] ${label}`);
  }
}

function evaluateBranch(node: AutomationFlowNode, record: CrmRecord): boolean {
  const data = (node.data ?? {}) as GraphBranchData;
  if (!data.field) return true; // no condition configured — treat as "always true" (matches AutomationCondition 'always')
  const op = data.op ?? 'eq';
  const raw: unknown =
    data.field === 'stage'
      ? record.stage
      : data.field === 'score'
        ? record.score ?? 0
        : data.field === 'target'
          ? record.target
          : data.field === 'kind'
            ? record.kind
            : data.field === 'source'
              ? record.source
              : data.field === 'tag'
                ? record.tags ?? []
                : undefined;

  if (data.field === 'tag') {
    const tags = (raw as string[]) ?? [];
    return tags.map((t) => t.toLowerCase()).includes(String(data.value ?? '').toLowerCase());
  }
  if (op === 'gte') return Number(raw) >= Number(data.value);
  if (op === 'lte') return Number(raw) <= Number(data.value);
  if (op === 'neq') return String(raw ?? '') !== String(data.value ?? '');
  if (op === 'has') return String(raw ?? '').toLowerCase().includes(String(data.value ?? '').toLowerCase());
  return String(raw ?? '') === String(data.value ?? '');
}

function pickBranchEdge(flow: AutomationFlowGraph, nodeId: string, matched: boolean) {
  const edges = outgoingEdges(flow, nodeId);
  const wantLabel = matched ? ['yes', 'true', 'match'] : ['no', 'false', 'else'];
  const byLabel = edges.find((e) => wantLabel.includes(String(e.label ?? '').toLowerCase()));
  if (byLabel) return byLabel;
  // Fallback convention: first outgoing edge = true branch, second = false branch.
  return matched ? edges[0] : (edges[1] ?? edges[0]);
}

async function sendGraphEmail(record: CrmRecord, subject: string, body: string, ruleName: string): Promise<string> {
  const email = record.contact.email?.trim();
  if (!email) return 'Email skipped — no email on file';
  const suppression = checkSuppression({ email, channel: 'email' });
  if (suppression.suppressed) {
    logAgentAction({
      agentId: AGENT_ID,
      action: 'graph.email.suppressed',
      entityType: 'crm_record',
      entityId: record.id,
      reasoning: `Suppressed: ${suppression.reason}`,
    });
    return `Email suppressed (${suppression.reason})`;
  }
  const frequencyCapKey = await resolveFrequencyCapKey({ email, crmRecordId: record.id });
  if (isOverFrequencyCap(frequencyCapKey)) return 'Email deferred — frequency cap';
  if (!isFeatureEnabled('commsDelivery')) return 'Email queued (comms delivery flag off)';
  try {
    await sendEmail({ toEmail: email, toName: record.contact.fullName, subject, text: body });
    recordSendForFrequencyCap(frequencyCapKey);
    logAgentAction({
      agentId: AGENT_ID,
      action: 'graph.email.sent',
      entityType: 'crm_record',
      entityId: record.id,
      reasoning: `Rule "${ruleName}" graph action fired for ${crmRecordDisplayName(record)}`,
      meta: { subject },
    });
    return `Email sent: ${subject}`;
  } catch (err) {
    return `Email failed: ${(err as Error)?.message ?? 'unknown error'}`;
  }
}

async function sendGraphSms(record: CrmRecord, body: string, ruleName: string): Promise<string> {
  const phone = record.contact.phone?.trim();
  if (!phone) return 'SMS skipped — no phone on file';
  const suppression = checkSuppression({ phone, channel: 'sms' });
  if (suppression.suppressed) return `SMS suppressed (${suppression.reason})`;
  const frequencyCapKey = await resolveFrequencyCapKey({ phone, crmRecordId: record.id });
  if (isOverFrequencyCap(frequencyCapKey)) return 'SMS deferred — frequency cap';
  if (!isFeatureEnabled('commsDelivery')) return 'SMS queued (comms delivery flag off)';
  try {
    await sendSms({ toPhone: phone, body });
    recordSendForFrequencyCap(frequencyCapKey);
    logAgentAction({
      agentId: AGENT_ID,
      action: 'graph.sms.sent',
      entityType: 'crm_record',
      entityId: record.id,
      reasoning: `Rule "${ruleName}" graph action fired for ${crmRecordDisplayName(record)}`,
    });
    return 'SMS sent';
  } catch (err) {
    return `SMS failed: ${(err as Error)?.message ?? 'unknown error'}`;
  }
}

function addRecordTag(record: CrmRecord, tag: string) {
  const norm = tag.trim();
  if (!norm) return;
  if (record.sourceRef?.type === 'prospect') {
    // Prospect tags are patched via crmProspectsRepo; keep imports local to avoid a cycle at module load.
    void import('../../data/crmProspectsRepo').then(({ getProspect, patchProspect }) => {
      const p = getProspect(record.sourceRef!.id);
      if (!p) return;
      patchProspect(p.id, { tags: Array.from(new Set([...(p.tags ?? []), norm])) });
    });
  } else if (record.sourceRef?.type === 'lead') {
    const op = getLeadOp(record.sourceRef.id);
    upsertLeadOp({ ...op, tags: Array.from(new Set([...(op.tags ?? []), norm])) });
  }
}

/** Execute one action node's side effect. Throws on unrecoverable failure so the retry/dead-letter rail can catch it. */
async function executeAction(action: AutomationActionV2, record: CrmRecord, rule: AutomationRule): Promise<string> {
  switch (action.type) {
    case 'move_crm_stage':
      setCrmRecordStage(record.id, action.stage as CrmRecord['stage']);
      return `Stage → ${action.stage}`;
    case 'add_crm_tag':
      addRecordTag(record, action.tag);
      return `Tag added: ${action.tag}`;
    case 'enroll_crm_sequence':
      enrollCrmRecordInSequence({ recordId: record.id, sequenceId: action.sequenceId, currentStage: record.stage });
      return `Enrolled sequence ${action.sequenceId}`;
    case 'create_task': {
      if (!record.partnerId) {
        logRecordActivity(record, `Task (awaiting partner link): ${action.title}`);
        return 'Task deferred — no linked partner';
      }
      const dueAt =
        typeof action.dueInDays === 'number' ? new Date(Date.now() + Math.max(0, action.dueInDays) * 86400000).toISOString() : undefined;
      createTask({
        partnerId: record.partnerId,
        title: action.title,
        kind: action.kind,
        stage: action.stage,
        priority: action.priority,
        status: 'pending',
        dueAt,
        notes: action.notes,
        tags: Array.from(new Set([...(action.tags ?? []), 'automation-graph'])),
        assignedTo: 'admin',
      });
      return `Task created: ${action.title}`;
    }
    case 'notify_admin':
      createNotification({
        audience: 'admin',
        kind: 'system',
        title: action.title,
        body: action.body ?? `Automation "${rule.name}" advanced for ${crmRecordDisplayName(record)}`,
        href: '/admin/automations',
        meta: { ruleId: rule.id, recordId: record.id },
      });
      return `Notified admin: ${action.title}`;
    case 'send_email':
      return sendGraphEmail(record, action.subject ?? rule.name, action.body, rule.name);
    case 'send_sms':
      return sendGraphSms(record, action.body, rule.name);
    default:
      logRecordActivity(record, `Automation step skipped (not yet graph-executable): ${action.type}`);
      return `Skipped — action type "${action.type}" is not yet graph-executable`;
  }
}

/** Enroll a CRM record into a rule's flow graph. No-op if an active enrollment already exists. */
export function enrollCrmRecordInAutomationGraph(ruleId: string, crmRecordId: string): AutomationEnrollment | null {
  const rule = getAutomationRule(ruleId);
  if (!rule) return null;
  const existing = listAutomationEnrollments(ruleId).find(
    (e) => e.crmRecordId === crmRecordId && (e.status === 'active' || e.status === 'paused'),
  );
  if (existing) return existing;
  const flow = flowFor(rule);
  const startNodeId = firstNodeId(flow);
  return createAutomationEnrollment({
    ruleId,
    status: 'active',
    crmRecordId,
    currentNodeId: startNodeId,
    attempts: 0,
  });
}

export type GraphTickResult = { enrollmentId: string; ruleId: string; ok: boolean; message: string };

/**
 * Advance one enrollment as far as it can go this tick: executes trigger →
 * condition → action nodes immediately, pauses at the first not-yet-due wait
 * node, evaluates branch nodes against the linked CRM record, and marks the
 * enrollment complete at a goal node. Reliability rail: any thrown error
 * increments `attempts`; after MAX_ATTEMPTS the enrollment is dead-lettered
 * (status 'stalled') instead of retried forever.
 */
export async function advanceAutomationEnrollment(enrollment: AutomationEnrollment, nowMs = Date.now()): Promise<GraphTickResult> {
  if (enrollment.status !== 'active') {
    return { enrollmentId: enrollment.id, ruleId: enrollment.ruleId, ok: true, message: `Skipped — status ${enrollment.status}` };
  }
  const rule = getAutomationRule(enrollment.ruleId);
  if (!rule || !rule.enabled) {
    upsertAutomationEnrollment({ ...enrollment, status: 'cancelled', meta: { ...(enrollment.meta ?? {}), reason: 'Rule missing or disabled' } });
    return { enrollmentId: enrollment.id, ruleId: enrollment.ruleId, ok: false, message: 'Rule missing or disabled — cancelled' };
  }
  const record = enrollment.crmRecordId ? getCrmRecord(enrollment.crmRecordId) : null;
  if (!record) {
    upsertAutomationEnrollment({ ...enrollment, status: 'cancelled', meta: { ...(enrollment.meta ?? {}), reason: 'CRM record not found' } });
    return { enrollmentId: enrollment.id, ruleId: enrollment.ruleId, ok: false, message: 'CRM record not found — cancelled' };
  }

  const flow = flowFor(rule);
  let cursor = enrollment.currentNodeId ?? firstNodeId(flow);
  const messages: string[] = [];
  let hops = 0;

  try {
    while (cursor && hops < MAX_HOPS_PER_TICK) {
      hops += 1;
      const node = findNode(flow, cursor);
      if (!node) {
        upsertAutomationEnrollment({ ...enrollment, status: 'completed', currentNodeId: undefined });
        return { enrollmentId: enrollment.id, ruleId: enrollment.ruleId, ok: true, message: 'Completed — no more nodes in graph' };
      }

      if (node.type === 'goal') {
        upsertAutomationEnrollment({ ...enrollment, status: 'completed', currentNodeId: node.id, attempts: 0 });
        logRecordActivity(record, `Automation "${rule.name}" reached goal`);
        return { enrollmentId: enrollment.id, ruleId: enrollment.ruleId, ok: true, message: `Goal reached: ${node.label}` };
      }

      if (node.type === 'wait') {
        const waitHours = Number((node.data as GraphWaitData)?.waitHours ?? 24);
        const startedWaitAt = enrollment.currentNodeId === node.id && enrollment.nextRunAt ? Date.parse(enrollment.nextRunAt) - waitHours * 3_600_000 : nowMs;
        const dueMs =
          enrollment.currentNodeId === node.id && enrollment.nextRunAt
            ? Date.parse(enrollment.nextRunAt)
            : startedWaitAt + Math.max(0, waitHours) * 3_600_000;
        if (nowMs < dueMs) {
          upsertAutomationEnrollment({ ...enrollment, currentNodeId: node.id, nextRunAt: new Date(dueMs).toISOString(), attempts: 0 });
          return { enrollmentId: enrollment.id, ruleId: enrollment.ruleId, ok: true, message: `Waiting until ${new Date(dueMs).toISOString()}` };
        }
        const next = outgoingEdges(flow, node.id)[0];
        cursor = next?.target;
        continue;
      }

      if (node.type === 'branch') {
        const matched = evaluateBranch(node, record);
        const edge = pickBranchEdge(flow, node.id, matched);
        messages.push(`Branch "${node.label}" → ${matched ? 'yes' : 'no'}`);
        cursor = edge?.target;
        continue;
      }

      if (node.type === 'action') {
        const action = (node.data as { action?: AutomationActionV2 })?.action;
        if (action) {
          // eslint-disable-next-line no-await-in-loop
          const msg = await executeAction(action, record, rule);
          messages.push(msg);
        }
        const next = outgoingEdges(flow, node.id)[0];
        cursor = next?.target;
        continue;
      }

      // trigger / condition nodes — no side effect in the graph engine itself (conditions are
      // evaluated as flat AutomationRule.conditions before enrollment happens); just advance.
      const next = outgoingEdges(flow, node.id)[0];
      cursor = next?.target;
    }

    if (!cursor) {
      upsertAutomationEnrollment({ ...enrollment, status: 'completed', currentNodeId: undefined, attempts: 0 });
      return { enrollmentId: enrollment.id, ruleId: enrollment.ruleId, ok: true, message: messages.join(' · ') || 'Completed — end of graph' };
    }

    upsertAutomationEnrollment({ ...enrollment, currentNodeId: cursor, attempts: 0 });
    return { enrollmentId: enrollment.id, ruleId: enrollment.ruleId, ok: true, message: messages.join(' · ') || `Advanced to ${cursor}` };
  } catch (err) {
    const attempts = (enrollment.attempts ?? 0) + 1;
    const errorMessage = (err as Error)?.message ?? 'Unknown graph engine error';
    if (attempts >= MAX_ATTEMPTS) {
      upsertAutomationEnrollment({
        ...enrollment,
        status: 'stalled',
        attempts,
        lastError: errorMessage,
      });
      logAgentAction({
        agentId: AGENT_ID,
        action: 'graph.enrollment.stalled',
        entityType: 'crm_record',
        entityId: enrollment.crmRecordId,
        reasoning: `Node ${cursor} threw ${attempts} times — dead-lettered`,
        meta: { ruleId: rule.id, enrollmentId: enrollment.id, error: errorMessage },
      });
      return { enrollmentId: enrollment.id, ruleId: enrollment.ruleId, ok: false, message: `Stalled after ${attempts} attempts: ${errorMessage}` };
    }
    upsertAutomationEnrollment({ ...enrollment, attempts, lastError: errorMessage });
    return { enrollmentId: enrollment.id, ruleId: enrollment.ruleId, ok: false, message: `Retry ${attempts}/${MAX_ATTEMPTS}: ${errorMessage}` };
  }
}

/** Tick entry point — mirrors runDueCrmSequenceSteps() shape/naming for consistency. */
export async function runDueAutomationGraphEnrollments(args?: { maxPerRun?: number }): Promise<GraphTickResult[]> {
  const max = Math.max(1, args?.maxPerRun ?? 40);
  const nowMs = Date.now();
  const rules = new Map(listAutomationRules().map((r) => [r.id, r]));
  const due = listAutomationEnrollments()
    .filter((e) => e.status === 'active' && rules.get(e.ruleId)?.enabled)
    .filter((e) => !e.nextRunAt || Date.parse(e.nextRunAt) <= nowMs)
    .slice(0, max);

  const results: GraphTickResult[] = [];
  for (const enrollment of due) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await advanceAutomationEnrollment(enrollment, nowMs));
  }
  return results;
}

/** Dead-letter surface — future admin UI can alert on these instead of them silently sitting there. */
export function listStalledAutomationEnrollments(): AutomationEnrollment[] {
  return listAutomationEnrollments().filter((e) => e.status === 'stalled');
}
