import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import type { AutomationRule, AutomationRunLog, AutomationEnrollment } from '../domain/automationStudio';
import type { PartnerJourneyStage, PartnerLane } from '../domain/partners';

const KEY = 'finely.automationStudio.v1';

type Store = { rules: AutomationRule[]; runs: AutomationRunLog[]; enrollments: AutomationEnrollment[] };

function nowIso() {
  return new Date().toISOString();
}

function loadStore(): Store {
  const raw = loadJson<Store>(KEY, { rules: [], runs: [], enrollments: [] }, 1);
  return { rules: raw.rules ?? [], runs: raw.runs ?? [], enrollments: raw.enrollments ?? [] };
}

function saveStore(store: Store, opts?: { skipSync?: boolean }) {
  saveJson(KEY, store, 1);
  if (!opts?.skipSync) {
    void import('./automationSupabaseSync').then((m) => m.syncAllAutomationRulesToSupabase(store.rules));
  }
}

export function mergeAutomationRulesFromRemote(remote: AutomationRule[]) {
  ensureAutomationRuleDefaultsOnce();
  const store = loadStore();
  const byId = new Map(store.rules.map((r) => [r.id, r]));
  for (const rule of remote) {
    const local = byId.get(rule.id);
    const remoteTs = Date.parse(rule.updatedAt);
    const localTs = local ? Date.parse(local.updatedAt) : 0;
    if (!local || remoteTs >= localTs) byId.set(rule.id, rule);
  }
  store.rules = Array.from(byId.values());
  saveStore(store, { skipSync: true });
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

  const eventSeeds: AutomationRule[] = [
    {
      id: seedRuleId('event_funnel_signup_admin'),
      name: 'Event: funnel signup → notify admin',
      enabled: true,
      createdAt: now,
      updatedAt: now,
      trigger: { type: 'funnel_signup' },
      conditions: [{ type: 'always' }],
      actions: [{ type: 'notify_admin', title: 'New funnel signup', body: 'Review lead in Leads OS and assign persona.' }],
      meta: { seed: true, seedKey: 'event_funnel_signup_admin' },
    },
    {
      id: seedRuleId('event_funnel_session_booked'),
      name: 'Event: funnel session booked → appointment setter',
      enabled: true,
      createdAt: now,
      updatedAt: now,
      trigger: { type: 'funnel_session_booked' },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'assign_agent_persona', personaId: 'appointment_setter', leadIdField: 'leadId' },
        { type: 'notify_admin', title: 'Funnel session booked', body: 'Confirm slot in Calendar OS and send prep email.' },
      ],
      meta: { seed: true, seedKey: 'event_funnel_session_booked' },
    },
    {
      id: seedRuleId('event_purchase_completed'),
      name: 'Event: purchase → notify admin',
      enabled: true,
      createdAt: now,
      updatedAt: now,
      trigger: { type: 'purchase_completed' },
      conditions: [{ type: 'always' }],
      actions: [{ type: 'notify_admin', title: 'Purchase completed', body: 'Verify entitlements and welcome sequence.' }],
      meta: { seed: true, seedKey: 'event_purchase_completed' },
    },
    {
      id: seedRuleId('event_task_overdue'),
      name: 'Event: task overdue → SLA escalation',
      enabled: true,
      createdAt: now,
      updatedAt: now,
      trigger: { type: 'task_overdue' },
      conditions: [{ type: 'always' }],
      actions: [{ type: 'notify_admin', title: 'Task SLA breach', body: 'Review Work OS queue and reassign if needed.' }],
      meta: { seed: true, seedKey: 'event_task_overdue' },
    },
    {
      id: seedRuleId('event_hot_lead'),
      name: 'Event: hot lead scored → assign closer',
      enabled: true,
      createdAt: now,
      updatedAt: now,
      trigger: { type: 'lead_scored', minScore: 58, band: 'hot' },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'assign_agent_persona', personaId: 'sales_closer', leadIdField: 'leadId' },
        { type: 'notify_admin', title: 'Hot lead', body: 'Sales closer persona recommended — follow up within 24h.' },
      ],
      meta: { seed: true, seedKey: 'event_hot_lead' },
    },
    {
      id: seedRuleId('event_dispute_mailed'),
      name: 'Event: dispute letter mailed',
      enabled: true,
      createdAt: now,
      updatedAt: now,
      trigger: { type: 'dispute_letter_mailed' },
      conditions: [{ type: 'always' }],
      actions: [{ type: 'notify_admin', title: 'Dispute letter mailed', body: 'Bureau FCRA window started — monitor follow-up task.' }],
      meta: { seed: true, seedKey: 'event_dispute_mailed' },
    },
    {
      id: seedRuleId('event_meta_lead'),
      name: 'Event: Meta Lead Ad → notify admin',
      enabled: true,
      createdAt: now,
      updatedAt: now,
      trigger: { type: 'meta_lead_form' },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'assign_agent_persona', personaId: 'sales_closer', leadIdField: 'leadId' },
        { type: 'notify_admin', title: 'Meta Lead Ad', body: 'New lead from Facebook/Instagram — review in Leads OS → Social.' },
      ],
      meta: { seed: true, seedKey: 'event_meta_lead' },
    },
    {
      id: seedRuleId('event_task_completed'),
      name: 'Event: task completed → refresh project KPIs',
      enabled: true,
      createdAt: now,
      updatedAt: now,
      trigger: { type: 'task_completed' },
      conditions: [{ type: 'always' }],
      actions: [{ type: 'notify_admin', title: 'Task completed', body: 'Partner recorded a result — review project outcomes in Work OS.' }],
      meta: { seed: true, seedKey: 'event_task_completed' },
    },
    {
      id: seedRuleId('event_task_result'),
      name: 'Event: task result recorded → ops verify',
      enabled: false,
      createdAt: now,
      updatedAt: now,
      trigger: { type: 'task_result_recorded' },
      conditions: [{ type: 'always' }],
      actions: [{ type: 'notify_admin', title: 'Task result logged', body: 'Partner saved actual outcome — verify evidence in Work OS.' }],
      meta: { seed: true, seedKey: 'event_task_result' },
    },
    {
      id: seedRuleId('event_course_lesson_agent'),
      name: 'Event: course lesson agent run',
      enabled: false,
      createdAt: now,
      updatedAt: now,
      trigger: { type: 'course_lesson_agent_run' },
      conditions: [{ type: 'always' }],
      actions: [{ type: 'notify_admin', title: 'Lesson agent ran', body: 'Review Voice Studio narration + checklist tasks in Course Builder.' }],
      meta: { seed: true, seedKey: 'event_course_lesson_agent' },
    },
    {
      id: seedRuleId('event_crm_qualified'),
      name: 'Event: CRM booked → closer',
      enabled: false,
      createdAt: now,
      updatedAt: now,
      trigger: { type: 'crm_stage_changed', stage: 'booked' },
      conditions: [{ type: 'always' }],
      actions: [
        { type: 'assign_agent_persona', personaId: 'sales_closer', leadIdField: 'leadId' },
        { type: 'notify_admin', title: 'CRM booked', body: 'Pipeline record booked — assign closer in Leads OS.' },
      ],
      meta: { seed: true, seedKey: 'event_crm_qualified' },
    },
    {
      id: seedRuleId('event_partner_funding'),
      name: 'Event: partner funding stage',
      enabled: false,
      createdAt: now,
      updatedAt: now,
      trigger: { type: 'partner_stage_changed', stage: 'funding' },
      conditions: [{ type: 'always' }],
      actions: [{ type: 'notify_admin', title: 'Partner funding stage', body: 'Client reached funding journey — review Nora queue.' }],
      meta: { seed: true, seedKey: 'event_partner_funding' },
    },
  ];

  for (const r of eventSeeds) {
    if (have.has(r.id)) continue;
    store.rules.push(r);
    have.add(r.id);
    changed = true;
  }

  if (changed) saveStore(store, { skipSync: true });
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
  void import('./automationSupabaseSync').then((m) => m.syncAutomationRuleToSupabase(next));
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
  store.enrollments = store.enrollments.filter((e) => e.ruleId !== id);
  const changed = store.rules.length !== before;
  if (changed) saveStore(store);
  return changed;
}

export function listAutomationEnrollments(ruleId?: string): AutomationEnrollment[] {
  ensureAutomationRuleDefaultsOnce();
  const all = loadStore().enrollments.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return ruleId ? all.filter((e) => e.ruleId === ruleId) : all;
}

export function upsertAutomationEnrollment(enrollment: AutomationEnrollment): AutomationEnrollment {
  const store = loadStore();
  const idx = store.enrollments.findIndex((e) => e.id === enrollment.id);
  const next = { ...enrollment, updatedAt: nowIso() };
  if (idx >= 0) store.enrollments[idx] = next;
  else store.enrollments.push(next);
  saveStore(store);
  return next;
}

export function createAutomationEnrollment(args: Omit<AutomationEnrollment, 'id' | 'enrolledAt' | 'updatedAt'>): AutomationEnrollment {
  const now = nowIso();
  return upsertAutomationEnrollment({ id: newId('enroll'), enrolledAt: now, updatedAt: now, ...args });
}

