import type { CrmSequence, CrmSequenceEnrollment, CrmSequenceStep, CrmSequenceVariantKey } from '../domain/crmSequences';
import { assignCrmSequenceVariantForSeed, crmSequenceStepHasVariants, nowIso } from '../domain/crmSequences';
import type { CrmRecordStage } from '../domain/crmRecords';
import { loadJson, saveJson } from './localJsonStore';
import { syncCrmSequenceEnrollmentToSupabase, syncCrmSequenceToSupabase } from './crmSequencesServerSync';

const KEY = 'finely.crm_sequences.v1';
const VERSION = 1;

type Store = { sequences: CrmSequence[]; enrollments: CrmSequenceEnrollment[] };

function loadStore(): Store {
  const raw = loadJson<Store>(KEY, { sequences: [], enrollments: [] }, VERSION);
  return { sequences: raw.sequences ?? [], enrollments: raw.enrollments ?? [] };
}

function saveStore(store: Store) {
  saveJson(KEY, store, VERSION);
  window.dispatchEvent(new Event('finely:store'));
}

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Default escalating multi-touch cadence per target — every qualified lead gets
 * enrolled into one of these instead of a single one-time outreach (Phase 3
 * "persistent escalating cadence" rail). Previously only 'clients' had a default
 * sequence, so prospects/affiliates/agents discovered by Caleb/Benjamin/Rebecca
 * silently got zero follow-up cadence once their first touch was sent.
 */
const DEFAULT_SEQUENCES: CrmSequence[] = [
  {
    id: 'seq_inbound_nurture',
    name: 'Inbound lead nurture',
    target: 'clients',
    enabled: true,
    steps: [
      { id: 's1', type: 'wait', label: 'Wait 1 day', waitDays: 1 },
      { id: 's2', type: 'email', label: 'Welcome + package overview', emailSubject: 'Your Finely Cred next steps' },
      { id: 's3', type: 'wait', label: 'Wait 2 days', waitDays: 2 },
      { id: 's4', type: 'task', label: 'Ops follow-up call', taskTitle: 'CRM sequence — follow-up call' },
      { id: 's5', type: 'stage_move', label: 'Move to contacted', targetStage: 'contacted' },
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'seq_affiliate_escalating',
    name: 'Affiliate prospect escalating cadence',
    target: 'affiliates',
    enabled: true,
    steps: [
      { id: 'a1', type: 'wait', label: 'Wait 1 day', waitDays: 1 },
      { id: 'a2', type: 'email', label: 'Intro + program overview', emailSubject: 'Partner with Finely Cred — affiliate program' },
      { id: 'a3', type: 'wait', label: 'Wait 3 days', waitDays: 3 },
      { id: 'a4', type: 'email', label: 'Follow-up + payout structure', emailSubject: 'Quick follow-up — affiliate payouts' },
      { id: 'a5', type: 'wait', label: 'Wait 4 days', waitDays: 4 },
      { id: 'a6', type: 'task', label: 'Ops follow-up call', taskTitle: 'Affiliate cadence — follow-up call' },
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'seq_agents_escalating',
    name: 'Agent/specialist recruiting escalating cadence',
    target: 'agents',
    enabled: true,
    steps: [
      { id: 'g1', type: 'wait', label: 'Wait 1 day', waitDays: 1 },
      { id: 'g2', type: 'email', label: 'Intro + role overview', emailSubject: 'Become a Finely Cred credit specialist' },
      { id: 'g3', type: 'wait', label: 'Wait 3 days', waitDays: 3 },
      { id: 'g4', type: 'email', label: 'Follow-up + apply link', emailSubject: 'Still interested? Here is the apply link' },
      { id: 'g5', type: 'wait', label: 'Wait 5 days', waitDays: 5 },
      { id: 'g6', type: 'task', label: 'Recruiter follow-up call', taskTitle: 'Recruiting cadence — follow-up call' },
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

export function listCrmSequences(): CrmSequence[] {
  const store = loadStore();
  if (!store.sequences.length) {
    store.sequences = DEFAULT_SEQUENCES;
    saveStore(store);
  }
  return store.sequences.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getCrmSequence(id: string): CrmSequence | null {
  return listCrmSequences().find((s) => s.id === id) ?? null;
}

export function upsertCrmSequence(seq: CrmSequence): CrmSequence {
  const store = loadStore();
  const idx = store.sequences.findIndex((s) => s.id === seq.id);
  const next = { ...seq, updatedAt: nowIso() };
  if (idx >= 0) store.sequences[idx] = next;
  else store.sequences.push(next);
  saveStore(store);
  void syncCrmSequenceToSupabase(next);
  return next;
}

export function createCrmSequence(args: Pick<CrmSequence, 'name' | 'target'>): CrmSequence {
  const now = nowIso();
  return upsertCrmSequence({
    id: newId('seq'),
    name: args.name,
    target: args.target,
    enabled: true,
    steps: [{ id: newId('step'), type: 'wait', label: 'Wait 1 day', waitDays: 1 }],
    createdAt: now,
    updatedAt: now,
  });
}

export function deleteCrmSequence(id: string): boolean {
  const store = loadStore();
  const before = store.sequences.length;
  store.sequences = store.sequences.filter((s) => s.id !== id);
  store.enrollments = store.enrollments.filter((e) => e.sequenceId !== id);
  if (store.sequences.length === before) return false;
  saveStore(store);
  return true;
}

export function listCrmSequenceEnrollments(): CrmSequenceEnrollment[] {
  return loadStore().enrollments.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listCrmEnrollmentsBySequence(sequenceId: string): CrmSequenceEnrollment[] {
  return listCrmSequenceEnrollments().filter((e) => e.sequenceId === sequenceId);
}

export function listCrmEnrollmentsByRecord(recordId: string): CrmSequenceEnrollment[] {
  return listCrmSequenceEnrollments().filter((e) => e.recordId === recordId);
}

export function getCrmSequenceEnrollment(id: string): CrmSequenceEnrollment | null {
  return loadStore().enrollments.find((e) => e.id === id) ?? null;
}

export function enrollCrmRecordInSequence(args: {
  recordId: string;
  sequenceId: string;
  /** Record's current CRM stage at enroll time — the baseline for G3's "did it advance?" outcome proxy. Optional so existing call sites keep compiling. */
  currentStage?: CrmRecordStage;
}): CrmSequenceEnrollment {
  // Resolved (and, on first-ever call, default-seeded + persisted) BEFORE
  // loadStore() below so the enrollment write doesn't stomp on sequences
  // getCrmSequence()/listCrmSequences() may have just seeded.
  const sequence = getCrmSequence(args.sequenceId);
  const hasVariantStep = sequence?.steps.some(crmSequenceStepHasVariants) ?? false;

  const store = loadStore();
  const existing = store.enrollments.find(
    (e) => e.recordId === args.recordId && e.sequenceId === args.sequenceId && !e.completedAt,
  );
  if (existing) return existing;
  const now = nowIso();
  const id = newId('crm_enroll');
  const next: CrmSequenceEnrollment = {
    id,
    sequenceId: args.sequenceId,
    recordId: args.recordId,
    enrolledAt: now,
    updatedAt: now,
    lastCompletedStepIndex: -1,
    assignedVariant: hasVariantStep ? assignCrmSequenceVariantForSeed(id) : undefined,
    stageAtEnrollment: args.currentStage,
  };
  store.enrollments.push(next);
  saveStore(store);
  void syncCrmSequenceEnrollmentToSupabase(next);
  return next;
}

/**
 * G3 — lazily assigns (and persists) a variant bucket for an enrollment that
 * doesn't have one yet, e.g. because variants were added to a step after the
 * enrollment already existed. No-ops (returns the existing enrollment
 * unchanged) if a bucket is already assigned — first assignment wins, and
 * since the bucket is deterministic from the enrollment id, a "late" call
 * from the other engine would compute the identical value anyway.
 */
export function ensureCrmSequenceEnrollmentVariant(id: string): CrmSequenceEnrollment | null {
  const store = loadStore();
  const idx = store.enrollments.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const cur = store.enrollments[idx]!;
  if (cur.assignedVariant) return cur;
  const variant: CrmSequenceVariantKey = assignCrmSequenceVariantForSeed(cur.id);
  const next: CrmSequenceEnrollment = { ...cur, assignedVariant: variant, updatedAt: nowIso() };
  store.enrollments[idx] = next;
  saveStore(store);
  void syncCrmSequenceEnrollmentToSupabase(next);
  return next;
}

export function pauseCrmSequenceEnrollment(id: string, paused: boolean): CrmSequenceEnrollment | null {
  const store = loadStore();
  const idx = store.enrollments.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const cur = store.enrollments[idx]!;
  const now = nowIso();
  const next: CrmSequenceEnrollment = { ...cur, pausedAt: paused ? now : undefined, updatedAt: now };
  store.enrollments[idx] = next;
  saveStore(store);
  void syncCrmSequenceEnrollmentToSupabase(next);
  return next;
}

export function advanceCrmSequenceEnrollmentStep(args: { enrollmentId: string; stepIndex: number }): CrmSequenceEnrollment | null {
  const store = loadStore();
  const idx = store.enrollments.findIndex((e) => e.id === args.enrollmentId);
  if (idx < 0) return null;
  const cur = store.enrollments[idx]!;
  const now = nowIso();
  const next: CrmSequenceEnrollment = {
    ...cur,
    lastCompletedStepIndex: Math.max(cur.lastCompletedStepIndex, args.stepIndex),
    updatedAt: now,
  };
  store.enrollments[idx] = next;
  saveStore(store);
  void syncCrmSequenceEnrollmentToSupabase(next);
  return next;
}

export function completeCrmSequenceEnrollment(id: string): CrmSequenceEnrollment | null {
  const store = loadStore();
  const idx = store.enrollments.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const cur = store.enrollments[idx]!;
  const now = nowIso();
  const next: CrmSequenceEnrollment = { ...cur, completedAt: now, updatedAt: now };
  store.enrollments[idx] = next;
  saveStore(store);
  void syncCrmSequenceEnrollmentToSupabase(next);
  return next;
}

export function reorderCrmSequenceSteps(sequenceId: string, stepIds: string[]): CrmSequence | null {
  const seq = getCrmSequence(sequenceId);
  if (!seq) return null;
  const byId = new Map(seq.steps.map((s) => [s.id, s]));
  const steps = stepIds.map((id) => byId.get(id)).filter(Boolean) as CrmSequenceStep[];
  return upsertCrmSequence({ ...seq, steps });
}

export function updateCrmSequenceStep(sequenceId: string, step: CrmSequenceStep): CrmSequence | null {
  const seq = getCrmSequence(sequenceId);
  if (!seq) return null;
  const steps = seq.steps.map((s) => (s.id === step.id ? step : s));
  return upsertCrmSequence({ ...seq, steps });
}

export function addCrmSequenceStep(sequenceId: string, type: CrmSequenceStep['type']): CrmSequence | null {
  const seq = getCrmSequence(sequenceId);
  if (!seq) return null;
  const step: CrmSequenceStep = {
    id: newId('step'),
    type,
    label: type === 'wait' ? 'Wait 1 day' : type === 'email' ? 'Send email' : type === 'task' ? 'Create task' : 'Move stage',
    waitDays: type === 'wait' ? 1 : undefined,
    emailSubject: type === 'email' ? 'Follow up from Finely Cred' : undefined,
    taskTitle: type === 'task' ? 'CRM sequence task' : undefined,
    targetStage: type === 'stage_move' ? 'contacted' : undefined,
  };
  return upsertCrmSequence({ ...seq, steps: [...seq.steps, step] });
}

export function removeCrmSequenceStep(sequenceId: string, stepId: string): CrmSequence | null {
  const seq = getCrmSequence(sequenceId);
  if (!seq) return null;
  return upsertCrmSequence({ ...seq, steps: seq.steps.filter((s) => s.id !== stepId) });
}
