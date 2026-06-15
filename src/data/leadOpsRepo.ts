import type { LeadNote, LeadOp, LeadStage } from '../domain/leadOps';
import { nowIso } from '../domain/leadOps';
import { newId } from '../utils/ids';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.leadops.v1';

type Store = {
  ops: LeadOp[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { ops: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function defaultOp(leadId: string): LeadOp {
  const now = nowIso();
  return { leadId, stage: 'new', tags: [], notes: [], updatedAt: now };
}

export function getLeadOp(leadId: string): LeadOp {
  const store = loadStore();
  return store.ops.find((o) => o.leadId === leadId) ?? defaultOp(leadId);
}

export function listLeadOps(): LeadOp[] {
  const store = loadStore();
  return (store.ops ?? []).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function upsertLeadOp(op: LeadOp): LeadOp {
  const store = loadStore();
  const idx = store.ops.findIndex((o) => o.leadId === op.leadId);
  const next = { ...op, updatedAt: nowIso() };
  if (idx >= 0) store.ops[idx] = next;
  else store.ops.push(next);
  saveStore(store);
  return next;
}

export function setLeadStage(leadId: string, stage: LeadStage) {
  const op = getLeadOp(leadId);
  return upsertLeadOp({ ...op, stage });
}

export function linkLeadToPartner(leadId: string, partnerId: string) {
  const op = getLeadOp(leadId);
  return upsertLeadOp({ ...op, partnerId, stage: op.stage === 'disqualified' ? op.stage : 'converted' });
}

export function addLeadNote(leadId: string, text: string): LeadOp {
  const op = getLeadOp(leadId);
  const note: LeadNote = { id: newId('lnote'), createdAt: nowIso(), text: (text || '').trim() };
  const nextNotes = note.text ? [note, ...op.notes] : op.notes;
  return upsertLeadOp({ ...op, notes: nextNotes });
}

