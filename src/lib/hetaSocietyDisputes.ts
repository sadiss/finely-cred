import { loadJson, saveJson } from '../data/localJsonStore';
import { newId } from '../utils/ids';
import { HETA_SOCIETY_DISPUTE_LIMIT } from '../config/hetaSocietyProgram';
import type { LeadMagnetDispute, LeadMagnetDisputeStatus, LeadMagnetDisputeTimelineEntry } from './leadMagnetDispute';

const KEY = 'finely.hetaSociety.disputes.v1';

type Store = { disputes: LeadMagnetDispute[] };

const STATUS_LABELS: Record<LeadMagnetDisputeStatus, string> = {
  intake: 'Item identified',
  report_uploaded: 'Report on file',
  letter_ready: 'Dispute letter ready',
  sent: 'Dispute sent',
  awaiting_response: 'Awaiting bureau response',
  follow_up: 'Follow-up window',
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { disputes: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function nowIso() {
  return new Date().toISOString();
}

function addDaysIso(fromIso: string, days: number) {
  const d = new Date(fromIso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function pushTimeline(
  dispute: LeadMagnetDispute,
  status: LeadMagnetDisputeStatus,
  note?: string,
): LeadMagnetDisputeTimelineEntry {
  const entry: LeadMagnetDisputeTimelineEntry = {
    id: newId('hos_timeline'),
    status,
    label: STATUS_LABELS[status],
    at: nowIso(),
    note,
  };
  dispute.timeline.push(entry);
  return entry;
}

export function listHetaSocietyDisputes(ownerKey: string): LeadMagnetDispute[] {
  return loadStore()
    .disputes.filter((d) => d.leadId === ownerKey)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function hetaDisputeSlotsUsed(ownerKey: string): number {
  return listHetaSocietyDisputes(ownerKey).length;
}

export function hetaDisputeSlotsRemaining(ownerKey: string): number {
  return Math.max(0, HETA_SOCIETY_DISPUTE_LIMIT - hetaDisputeSlotsUsed(ownerKey));
}

export function createHetaSocietyDispute(args: {
  ownerKey: string;
  email: string;
  collectorName: string;
  bureau: LeadMagnetDispute['bureau'];
  accountLast4?: string;
  balance?: string;
}): LeadMagnetDispute {
  if (hetaDisputeSlotsRemaining(args.ownerKey) <= 0) {
    throw new Error(`HOS members can track up to ${HETA_SOCIETY_DISPUTE_LIMIT} disputes.`);
  }
  const store = loadStore();
  const createdAt = nowIso();
  const dispute: LeadMagnetDispute = {
    id: newId('hos_dispute'),
    leadId: args.ownerKey,
    email: args.email.trim().toLowerCase(),
    collectorName: args.collectorName.trim(),
    accountLast4: args.accountLast4?.trim(),
    bureau: args.bureau,
    balance: args.balance?.trim(),
    status: 'intake',
    timeline: [],
    createdAt,
    updatedAt: createdAt,
  };
  pushTimeline(dispute, 'intake', args.collectorName);
  store.disputes.push(dispute);
  saveStore(store);
  return dispute;
}

export function getHetaSocietyDispute(id: string): LeadMagnetDispute | null {
  return loadStore().disputes.find((d) => d.id === id) ?? null;
}

export function attachHetaSocietyDisputeReport(args: { disputeId: string; fileName: string }): LeadMagnetDispute | null {
  const store = loadStore();
  const idx = store.disputes.findIndex((d) => d.id === args.disputeId);
  if (idx < 0) return null;
  const dispute = { ...store.disputes[idx] };
  const at = nowIso();
  dispute.reportFileName = args.fileName;
  dispute.reportUploadedAt = at;
  dispute.status = 'report_uploaded';
  dispute.updatedAt = at;
  pushTimeline(dispute, 'report_uploaded', args.fileName);
  store.disputes[idx] = dispute;
  saveStore(store);
  return dispute;
}

export function markHetaDisputeLetterReady(disputeId: string): LeadMagnetDispute | null {
  return advanceHetaDispute(disputeId, 'letter_ready', 'Round-one letter prepared.');
}

export function markHetaDisputeSent(disputeId: string): LeadMagnetDispute | null {
  const store = loadStore();
  const idx = store.disputes.findIndex((d) => d.id === disputeId);
  if (idx < 0) return null;
  const dispute = { ...store.disputes[idx] };
  const at = nowIso();
  dispute.sentAt = at;
  dispute.responseDueAt = addDaysIso(at, 30);
  dispute.status = 'awaiting_response';
  dispute.updatedAt = at;
  pushTimeline(dispute, 'sent');
  pushTimeline(dispute, 'awaiting_response', '30-day FCRA response window.');
  store.disputes[idx] = dispute;
  saveStore(store);
  return dispute;
}

function advanceHetaDispute(
  disputeId: string,
  status: LeadMagnetDisputeStatus,
  note?: string,
): LeadMagnetDispute | null {
  const store = loadStore();
  const idx = store.disputes.findIndex((d) => d.id === disputeId);
  if (idx < 0) return null;
  const dispute = { ...store.disputes[idx] };
  dispute.status = status;
  dispute.updatedAt = nowIso();
  pushTimeline(dispute, status, note);
  store.disputes[idx] = dispute;
  saveStore(store);
  return dispute;
}

export { STATUS_LABELS as HETA_DISPUTE_STATUS_LABELS };
