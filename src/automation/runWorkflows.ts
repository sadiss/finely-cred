import { newId } from '../utils/ids';
import { bureauShortCode } from '../utils/bureaus';
import type { WorkflowId, WorkflowRun, WorkflowRunMode, WorkflowAction } from '../domain/automation';
import { nowIso } from '../domain/automation';
import { getWorkflowConfig } from '../data/automationRepo';
import { listCases } from '../data/casesRepo';
import { listTasksByPartner, createTask } from '../data/tasksRepo';
import { addDaysIso } from '../domain/cases';

function isOpenTask(t: { status: string }) {
  return t.status === 'pending' || t.status === 'in_progress';
}

function safeDate(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDate(iso?: string) {
  const d = safeDate(iso);
  if (!d) return '—';
  try {
    return d.toLocaleDateString();
  } catch {
    return iso || '—';
  }
}

export function runWorkflow(workflowId: WorkflowId, mode: WorkflowRunMode): WorkflowRun {
  const cfg = getWorkflowConfig(workflowId);
  const startedAt = nowIso();
  const actions: WorkflowAction[] = [];

  if (!cfg.enabled) {
    const finishedAt = nowIso();
    return {
      id: newId('wfrun'),
      workflowId,
      mode,
      startedAt,
      finishedAt,
      summary: 'Workflow disabled.',
      actions: [{ type: 'info', message: 'Workflow disabled. No actions taken.' }],
    };
  }

  if (workflowId === 'dispute_followup_scheduler') {
    const daysBeforeDue = Number(cfg.params.daysBeforeDue ?? 7);
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + Math.max(0, daysBeforeDue));

    const openCases = listCases().filter((c) => c.status === 'open');
    for (const c of openCases) {
      const latest = c.rounds[c.rounds.length - 1];
      const due = safeDate(latest?.dueAt);
      if (!due) continue;
      if (due.getTime() > cutoff.getTime()) continue;

      const partnerTasks = listTasksByPartner(c.partnerId);
      const hasOpen = partnerTasks.some(
        (t) => t.relatedCaseId === c.id && t.kind === 'follow_up' && isOpenTask(t),
      );
      if (hasOpen) continue;

      const title = `Follow up: ${bureauShortCode(c.bureau)} • ${latest?.round ?? 'Round'} (due ${fmtDate(latest?.dueAt)})`;
      const notes = `Automation: follow-up scheduler. Case ${c.id}. Latest round ${latest?.round ?? '—'} due ${latest?.dueAt ?? '—'}.`;
      actions.push({
        type: mode === 'live' ? 'created_task' : 'would_create_task',
        partnerId: c.partnerId,
        title,
        meta: { caseId: c.id, bureau: c.bureau, round: latest?.round, dueAt: latest?.dueAt },
      });
      if (mode === 'live') {
        createTask({
          partnerId: c.partnerId,
          title,
          kind: 'follow_up',
          status: 'pending',
          dueAt: latest?.dueAt,
          relatedCaseId: c.id,
          notes,
        });
      }
    }
  }

  if (workflowId === 'evidence_request_autopilot') {
    const dueInDays = Number(cfg.params.dueInDays ?? 3);
    const openCases = listCases().filter((c) => c.status === 'open');
    for (const c of openCases) {
      const missing = c.items.filter((it) => !it.evidenceId).length;
      if (missing <= 0) continue;

      const partnerTasks = listTasksByPartner(c.partnerId);
      const hasOpen = partnerTasks.some(
        (t) => t.relatedCaseId === c.id && t.kind === 'upload_document' && isOpenTask(t),
      );
      if (hasOpen) continue;

      const dueAt = addDaysIso(nowIso(), Math.max(0, dueInDays));
      const title = `Upload evidence: ${bureauShortCode(c.bureau)} case (${missing} missing)`;
      const notes =
        `Automation: evidence request autopilot. Case ${c.id} has ${missing} item(s) missing evidence. ` +
        `Upload documents to the vault, then attach evidence to each dispute item.`;

      actions.push({
        type: mode === 'live' ? 'created_task' : 'would_create_task',
        partnerId: c.partnerId,
        title,
        meta: { caseId: c.id, bureau: c.bureau, missingEvidence: missing, dueAt },
      });
      if (mode === 'live') {
        createTask({
          partnerId: c.partnerId,
          title,
          kind: 'upload_document',
          status: 'pending',
          dueAt,
          relatedCaseId: c.id,
          notes,
        });
      }
    }
  }

  const finishedAt = nowIso();
  const createdCount = actions.filter((a) => a.type === 'created_task').length;
  const wouldCount = actions.filter((a) => a.type === 'would_create_task').length;
  const summary =
    mode === 'live'
      ? `Created ${createdCount} task(s).`
      : `Dry-run: would create ${wouldCount} task(s).`;

  return {
    id: newId('wfrun'),
    workflowId,
    mode,
    startedAt,
    finishedAt,
    summary,
    actions,
  };
}

