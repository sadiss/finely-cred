import type { CrmSequence, CrmSequenceEnrollment, CrmSequenceStep } from '../domain/crmSequences';
import { nowIso } from '../domain/crmSequences';
import { loadJson, saveJson } from './localJsonStore';

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

export function enrollCrmRecordInSequence(args: { recordId: string; sequenceId: string }): CrmSequenceEnrollment {
  const store = loadStore();
  const existing = store.enrollments.find(
    (e) => e.recordId === args.recordId && e.sequenceId === args.sequenceId && !e.completedAt,
  );
  if (existing) return existing;
  const now = nowIso();
  const next: CrmSequenceEnrollment = {
    id: newId('crm_enroll'),
    sequenceId: args.sequenceId,
    recordId: args.recordId,
    enrolledAt: now,
    updatedAt: now,
    lastCompletedStepIndex: -1,
  };
  store.enrollments.push(next);
  saveStore(store);
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
