import type { RegulatoryComplaint, RegulatoryBody, RegulatoryComplaintStatus, RegulatoryTargetType } from '../domain/regulatoryComplaints';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.regulatory_complaints.v1';

type Store = { complaints: RegulatoryComplaint[] };

function nowIso(): string {
  return new Date().toISOString();
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { complaints: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listRegulatoryComplaintsByPartner(partnerId: string): RegulatoryComplaint[] {
  return loadStore().complaints
    .filter((c) => c.partnerId === partnerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getRegulatoryComplaint(id: string): RegulatoryComplaint | null {
  return loadStore().complaints.find((c) => c.id === id) ?? null;
}

export function createRegulatoryComplaint(args: {
  partnerId: string;
  body: RegulatoryBody;
  targetType: RegulatoryTargetType;
  targetName: string;
  narrative: string;
  evidenceIds?: string[];
  caseId?: string;
  reportId?: string;
}): RegulatoryComplaint {
  const store = loadStore();
  const now = nowIso();
  const c: RegulatoryComplaint = {
    id: newId('regc'),
    partnerId: args.partnerId,
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    body: args.body,
    targetType: args.targetType,
    targetName: args.targetName,
    narrative: args.narrative,
    evidenceIds: (args.evidenceIds ?? []).slice(),
    caseId: args.caseId,
    reportId: args.reportId,
  };
  store.complaints.push(c);
  saveStore(store);
  return c;
}

export function upsertRegulatoryComplaint(next: RegulatoryComplaint): RegulatoryComplaint {
  const store = loadStore();
  const idx = store.complaints.findIndex((c) => c.id === next.id);
  const merged: RegulatoryComplaint = { ...next, updatedAt: nowIso() };
  if (idx >= 0) store.complaints[idx] = merged;
  else store.complaints.push(merged);
  saveStore(store);
  return merged;
}

export function markRegulatoryComplaintSubmitted(args: {
  id: string;
  referenceNumber?: string;
  submissionMethod?: RegulatoryComplaint['submissionMethod'];
  submittedAt?: string;
}): RegulatoryComplaint | null {
  const store = loadStore();
  const idx = store.complaints.findIndex((c) => c.id === args.id);
  if (idx < 0) return null;
  const prev = store.complaints[idx]!;
  const next: RegulatoryComplaint = {
    ...prev,
    status: prev.status === 'draft' ? 'submitted' : prev.status,
    referenceNumber: args.referenceNumber ?? prev.referenceNumber,
    submissionMethod: args.submissionMethod ?? prev.submissionMethod,
    submittedAt: args.submittedAt ?? prev.submittedAt ?? nowIso(),
    updatedAt: nowIso(),
  };
  store.complaints[idx] = next;
  saveStore(store);
  return next;
}

export function setRegulatoryComplaintStatus(args: {
  id: string;
  status: RegulatoryComplaintStatus;
  outcomeNote?: string;
}): RegulatoryComplaint | null {
  const store = loadStore();
  const idx = store.complaints.findIndex((c) => c.id === args.id);
  if (idx < 0) return null;
  const prev = store.complaints[idx]!;
  const next: RegulatoryComplaint = { ...prev, status: args.status, updatedAt: nowIso() };
  if (args.outcomeNote !== undefined) next.outcomeNote = args.outcomeNote;
  store.complaints[idx] = next;
  saveStore(store);
  return next;
}

