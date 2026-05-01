import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import type { AutomationRule, AutomationRunLog } from '../domain/automationStudio';
import type { PartnerJourneyStage, PartnerLane } from '../domain/partners';

const KEY = 'finely.automationStudio.v1';

type Store = { rules: AutomationRule[]; runs: AutomationRunLog[] };

function nowIso() {
  return new Date().toISOString();
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { rules: [], runs: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function seedRuleId(key: string) {
  const k = String(key || 'rule')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
  return `seed_rule_${k}`;
}

function ensureSeedRules(store: Store) {
  const have = new Set(store.rules.map((r) => r.id));
  const now = nowIso();

  const lanes: PartnerLane[] = ['funding_readiness', 'business_credit', 'debt_kill', 'au_tradelines', 'primary_tradeline', 'other'];
  const stages: PartnerJourneyStage[] = ['intake', 'report_upload', 'analysis', 'evidence', 'letters', 'mailing', 'funding'];

  const mkTaskRule = (args: {
    key: string;
    name: string;
    everyHours: number;
    lanes?: PartnerLane[];
    stages?: PartnerJourneyStage[];
    rollingHorizonDays?: number;
    task: { title: string; stage?: any; kind?: any; priority?: any; dueInDays?: number; tags?: string[]; notes?: string };
  }): AutomationRule => ({
    id: seedRuleId(args.key),
    name: args.name,
    enabled: true,
    createdAt: now,
    updatedAt: now,
    trigger: { type: 'interval', everyHours: args.everyHours },
    conditions: [
      ...(args.lanes?.length ? [{ type: 'partner_lane_in', lanes: args.lanes } as const] : []),
      ...(args.stages?.length ? [{ type: 'partner_stage_in', stages: args.stages } as const] : []),
      { type: 'always' },
    ],
    actions: [
      {
        type: 'create_task',
        title: args.task.title,
        kind: args.task.kind ?? 'general',
        stage: args.task.stage,
        priority: args.task.priority,
        dueInDays: args.task.dueInDays ?? 3,
        tags: args.task.tags ?? ['automation', 'seed'],
        notes: args.task.notes,
      },
    ],
    rollingHorizonDays: args.rollingHorizonDays,
    meta: { seed: true, seedKey: args.key },
  });

  const mkWorkflowRule = (args: { key: string; name: string; everyHours: number; workflowId: any; lanes?: PartnerLane[]; stages?: PartnerJourneyStage[] }): AutomationRule => ({
    id: seedRuleId(args.key),
    name: args.name,
    enabled: true,
    createdAt: now,
    updatedAt: now,
    trigger: { type: 'interval', everyHours: args.everyHours },
    conditions: [
      ...(args.lanes?.length ? [{ type: 'partner_lane_in', lanes: args.lanes } as const] : []),
      ...(args.stages?.length ? [{ type: 'partner_stage_in', stages: args.stages } as const] : []),
      { type: 'always' },
    ],
    actions: [{ type: 'run_workflow', workflowId: args.workflowId }],
    meta: { seed: true, seedKey: args.key },
  });

  const mkInviteRule = (args: { key: string; name: string; everyHours: number; channel: 'email' | 'sms' | 'both'; olderThanHours: number; maxPerRun: number }): AutomationRule => ({
    id: seedRuleId(args.key),
    name: args.name,
    enabled: true,
    createdAt: now,
    updatedAt: now,
    trigger: { type: 'interval', everyHours: args.everyHours },
    conditions: [{ type: 'has_unclaimed_invite', olderThanHours: args.olderThanHours }],
    actions: [{ type: 'send_invite_reminder', channel: args.channel, olderThanHours: args.olderThanHours, maxPerRun: args.maxPerRun }],
    meta: { seed: true, seedKey: args.key },
  });

  const seeds: AutomationRule[] = [];

  // ---- Invite reminders (9)
  const thresholds = [24, 72, 168];
  const channels: Array<'email' | 'sms' | 'both'> = ['email', 'sms', 'both'];
  for (const h of thresholds) {
    for (const ch of channels) {
      seeds.push(
        mkInviteRule({
          key: `invite_reminder_${ch}_${h}h`,
          name: `Invite reminder (${ch}) — unclaimed ${h}h`,
          everyHours: h <= 24 ? 6 : 12,
          channel: ch,
          olderThanHours: h,
          maxPerRun: 60,
        }),
      );
    }
  }

  // ---- Core workflows (4)
  seeds.push(
    mkWorkflowRule({
      key: 'workflow_dispute_followups_daily',
      name: 'Dispute follow-up scheduler (daily)',
      everyHours: 24,
      workflowId: 'dispute_followup_scheduler',
      lanes: ['funding_readiness', 'debt_kill', 'other'],
    }),
  );
  seeds.push(
    mkWorkflowRule({
      key: 'workflow_evidence_autopilot_daily',
      name: 'Evidence request autopilot (daily)',
      everyHours: 24,
      workflowId: 'evidence_request_autopilot',
      lanes: ['funding_readiness', 'debt_kill', 'business_credit', 'other'],
    }),
  );
  seeds.push(
    mkWorkflowRule({
      key: 'workflow_dispute_followups_weekly',
      name: 'Dispute follow-up scheduler (weekly)',
      everyHours: 24 * 7,
      workflowId: 'dispute_followup_scheduler',
    }),
  );
  seeds.push(
    mkWorkflowRule({
      key: 'workflow_evidence_autopilot_weekly',
      name: 'Evidence request autopilot (weekly)',
      everyHours: 24 * 7,
      workflowId: 'evidence_request_autopilot',
    }),
  );

  // ---- Lane+stage nudges (at least 30): create a task that points user to next best action.
  // We generate 5 lanes × 6 stages = 30 rules (exclude "funding" stage here).
  const nudgeLanes: PartnerLane[] = ['funding_readiness', 'business_credit', 'debt_kill', 'au_tradelines', 'primary_tradeline'];
  const nudgeStages: PartnerJourneyStage[] = ['intake', 'report_upload', 'analysis', 'evidence', 'letters', 'mailing'];
  for (const lane of nudgeLanes) {
    for (const stage of nudgeStages) {
      seeds.push(
        mkTaskRule({
          key: `nudge_${lane}_${stage}`,
          name: `Nudge: ${lane.replace(/_/g, ' ')} @ ${stage.replace(/_/g, ' ')}`,
          everyHours: 24,
          lanes: [lane],
          stages: [stage],
          rollingHorizonDays: 21,
          task: {
            title: `Next step: ${stage.replace(/_/g, ' ')}`,
            stage:
              stage === 'report_upload'
                ? 'reports'
                : stage === 'evidence'
                  ? 'evidence'
                  : stage === 'letters' || stage === 'mailing'
                    ? 'disputes'
                    : 'intake',
            kind: 'general',
            dueInDays: 3,
            tags: ['automation', 'nudge', `lane:${lane}`, `stage:${stage}`],
            notes:
              'This is an automated nudge. If you already completed this step, mark the task done or ignore it.',
          },
        }),
      );
    }
  }

  // ---- Bundle nudges (6): stimulate bundle execution when activated (business fundability sprint, etc).
  const bundles = ['business_fundability_sprint_v1', 'personal_restore_round1_v1', 'debt_summons_defense_v1'];
  for (const b of bundles) {
    seeds.push({
      id: seedRuleId(`bundle_nudge_${b}_daily`),
      name: `Bundle nudge (daily): ${b}`,
      enabled: true,
      createdAt: now,
      updatedAt: now,
      trigger: { type: 'interval', everyHours: 24 },
      conditions: [{ type: 'has_active_bundle', bundleId: b }],
      actions: [{ type: 'bundle_nudge', maxPerRun: 80, dueSoonDays: 3 }],
      meta: { seed: true, seedKey: `bundle_nudge_${b}_daily` },
    } as any);
    seeds.push({
      id: seedRuleId(`bundle_nudge_${b}_weekly`),
      name: `Bundle nudge (weekly): ${b}`,
      enabled: false,
      createdAt: now,
      updatedAt: now,
      trigger: { type: 'interval', everyHours: 24 * 7 },
      conditions: [{ type: 'has_active_bundle', bundleId: b }],
      actions: [{ type: 'bundle_nudge', maxPerRun: 120, dueSoonDays: 7 }],
      meta: { seed: true, seedKey: `bundle_nudge_${b}_weekly` },
    } as any);
  }

  let changed = false;
  for (const r of seeds) {
    if (have.has(r.id)) continue;
    store.rules.push(r);
    have.add(r.id);
    changed = true;
  }
  if (changed) saveStore(store);
}

let seeded = false;
export function ensureAutomationRuleDefaultsOnce() {
  if (seeded) return;
  seeded = true;
  const store = loadStore();
  ensureSeedRules(store);
}

export function listAutomationRules(): AutomationRule[] {
  ensureAutomationRuleDefaultsOnce();
  return loadStore().rules.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getAutomationRule(id: string): AutomationRule | null {
  return loadStore().rules.find((r) => r.id === id) ?? null;
}

export function upsertAutomationRule(rule: AutomationRule): AutomationRule {
  const store = loadStore();
  const idx = store.rules.findIndex((r) => r.id === rule.id);
  const next = { ...rule, updatedAt: nowIso() };
  if (idx >= 0) store.rules[idx] = next;
  else store.rules.push(next);
  saveStore(store);
  return next;
}

export function createAutomationRule(args: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>): AutomationRule {
  const now = nowIso();
  return upsertAutomationRule({ id: newId('rule'), createdAt: now, updatedAt: now, ...args });
}

export function setAutomationRuleEnabled(id: string, enabled: boolean): AutomationRule | null {
  const cur = getAutomationRule(id);
  if (!cur) return null;
  return upsertAutomationRule({ ...cur, enabled });
}

export function listAutomationRuns(limit = 80): AutomationRunLog[] {
  return loadStore().runs.slice().sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, Math.max(1, limit));
}

export function addAutomationRun(run: AutomationRunLog): AutomationRunLog {
  const store = loadStore();
  store.runs.push(run);
  store.runs = store.runs.slice().sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 800);
  saveStore(store);
  return run;
}

export function deleteAutomationRule(id: string): boolean {
  const store = loadStore();
  const before = store.rules.length;
  store.rules = store.rules.filter((r) => r.id !== id);
  const changed = store.rules.length !== before;
  if (changed) saveStore(store);
  return changed;
}

