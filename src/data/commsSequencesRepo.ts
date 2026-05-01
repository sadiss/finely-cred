import type { CommsSequence, CommsSequenceId, CommsEnrollment } from '../domain/commsSequences';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.comms_sequences.v1';
const VERSION = 1;

type Store = { sequences: CommsSequence[]; enrollments: CommsEnrollment[] };

function nowIso() {
  return new Date().toISOString();
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { sequences: [], enrollments: [] }, VERSION);
}

function saveStore(store: Store) {
  saveJson(KEY, store, VERSION);
}

export function listCommsSequences(): CommsSequence[] {
  return loadStore().sequences.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getCommsSequence(id: CommsSequenceId): CommsSequence | null {
  return loadStore().sequences.find((s) => s.id === id) ?? null;
}

export function upsertCommsSequence(seq: CommsSequence): CommsSequence {
  const store = loadStore();
  const idx = store.sequences.findIndex((s) => s.id === seq.id);
  const next: CommsSequence = { ...seq, updatedAt: nowIso() };
  if (idx >= 0) store.sequences[idx] = next;
  else store.sequences.push(next);
  saveStore(store);
  return next;
}

export function createCommsSequence(seed?: Partial<Pick<CommsSequence, 'name' | 'defaultChannel' | 'enabled'>>): CommsSequence {
  const now = nowIso();
  const seq: CommsSequence = {
    id: newId('seq'),
    name: (seed?.name || '').trim() || 'New sequence',
    enabled: seed?.enabled ?? true,
    defaultChannel: seed?.defaultChannel ?? 'portal',
    tags: [],
    steps: [
      { id: newId('step'), templateId: '', delayHours: 0 },
      { id: newId('step'), templateId: '', delayHours: 24 },
    ],
    createdAt: now,
    updatedAt: now,
    meta: { createdBy: 'admin' },
  };
  return upsertCommsSequence(seq);
}

export function deleteCommsSequence(id: CommsSequenceId): boolean {
  const store = loadStore();
  const before = store.sequences.length;
  store.sequences = store.sequences.filter((s) => s.id !== id);
  store.enrollments = store.enrollments.filter((e) => e.sequenceId !== id);
  const changed = store.sequences.length !== before;
  if (changed) saveStore(store);
  return changed;
}

export function listEnrollmentsBySequence(sequenceId: CommsSequenceId): CommsEnrollment[] {
  return loadStore().enrollments.filter((e) => e.sequenceId === sequenceId).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listEnrollmentsByPartner(partnerId: string): CommsEnrollment[] {
  return loadStore().enrollments.filter((e) => e.partnerId === partnerId).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function enrollPartnerInSequence(args: { partnerId: string; sequenceId: CommsSequenceId }): CommsEnrollment {
  const store = loadStore();
  const existing = store.enrollments.find((e) => e.partnerId === args.partnerId && e.sequenceId === args.sequenceId);
  if (existing) return existing;
  const now = nowIso();
  const next: CommsEnrollment = {
    id: newId('enroll'),
    partnerId: args.partnerId,
    sequenceId: args.sequenceId,
    enrolledAt: now,
    lastSentStepIndex: -1,
    updatedAt: now,
  };
  store.enrollments.push(next);
  saveStore(store);
  return next;
}

export function pauseEnrollment(id: string, paused: boolean): CommsEnrollment | null {
  const store = loadStore();
  const idx = store.enrollments.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const cur = store.enrollments[idx]!;
  const now = nowIso();
  const next: CommsEnrollment = { ...cur, pausedAt: paused ? now : undefined, updatedAt: now };
  store.enrollments[idx] = next;
  saveStore(store);
  return next;
}

export function advanceEnrollmentStep(args: { enrollmentId: string; stepIndex: number }): CommsEnrollment | null {
  const store = loadStore();
  const idx = store.enrollments.findIndex((e) => e.id === args.enrollmentId);
  if (idx < 0) return null;
  const cur = store.enrollments[idx]!;
  const now = nowIso();
  const next: CommsEnrollment = {
    ...cur,
    lastSentStepIndex: Math.max(cur.lastSentStepIndex, args.stepIndex),
    updatedAt: now,
  };
  store.enrollments[idx] = next;
  saveStore(store);
  return next;
}

export function completeEnrollment(id: string): CommsEnrollment | null {
  const store = loadStore();
  const idx = store.enrollments.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const cur = store.enrollments[idx]!;
  const now = nowIso();
  const next: CommsEnrollment = { ...cur, completedAt: now, updatedAt: now };
  store.enrollments[idx] = next;
  saveStore(store);
  return next;
}

export function dueSequenceSends(args: { nowMs?: number }): Array<{
  enrollment: CommsEnrollment;
  sequence: CommsSequence;
  stepIndex: number;
  templateId: string;
  channel?: string;
}> {
  const store = loadStore();
  const nowMs = args.nowMs ?? Date.now();
  const sequencesById = new Map(store.sequences.map((s) => [s.id, s]));
  const out: Array<{ enrollment: CommsEnrollment; sequence: CommsSequence; stepIndex: number; templateId: string; channel?: string }> = [];

  for (const e of store.enrollments) {
    if (e.completedAt || e.pausedAt) continue;
    const seq = sequencesById.get(e.sequenceId);
    if (!seq || !seq.enabled) continue;
    const nextIdx = e.lastSentStepIndex + 1;
    const step = seq.steps[nextIdx];
    if (!step) continue;
    if (!step.templateId) continue;
    const enrolledMs = Date.parse(e.enrolledAt);
    if (!Number.isFinite(enrolledMs)) continue;
    const dueAtMs = enrolledMs + Math.max(0, Number(step.delayHours || 0)) * 60 * 60 * 1000;
    if (nowMs < dueAtMs) continue;
    out.push({ enrollment: e, sequence: seq, stepIndex: nextIdx, templateId: step.templateId, channel: step.channel ?? seq.defaultChannel });
  }

  return out.slice(0, 500);
}

