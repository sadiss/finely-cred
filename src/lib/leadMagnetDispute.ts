/** One free collection dispute per lead-magnet trial — local tracking until portal upgrade. */

import { loadJson, saveJson } from '../data/localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.leadMagnet.dispute.v1';

export type LeadMagnetDisputeStatus =
  | 'intake'
  | 'report_uploaded'
  | 'letter_ready'
  | 'sent'
  | 'awaiting_response'
  | 'follow_up';

export type LeadMagnetDisputeTimelineEntry = {
  id: string;
  status: LeadMagnetDisputeStatus;
  label: string;
  at: string;
  note?: string;
};

export type LeadMagnetDispute = {
  id: string;
  leadId: string;
  email: string;
  collectorName: string;
  accountLast4?: string;
  bureau: 'equifax' | 'experian' | 'transunion';
  balance?: string;
  status: LeadMagnetDisputeStatus;
  reportFileName?: string;
  reportUploadedAt?: string;
  sentAt?: string;
  responseDueAt?: string;
  timeline: LeadMagnetDisputeTimelineEntry[];
  createdAt: string;
  updatedAt: string;
};

type Store = { disputes: LeadMagnetDispute[] };

const STATUS_LABELS: Record<LeadMagnetDisputeStatus, string> = {
  intake: 'Collection identified',
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
    id: newId('lm_timeline'),
    status,
    label: STATUS_LABELS[status],
    at: nowIso(),
    note,
  };
  dispute.timeline.push(entry);
  return entry;
}

export function getLeadMagnetDisputeByLead(leadId: string): LeadMagnetDispute | null {
  return loadStore().disputes.find((d) => d.leadId === leadId) ?? null;
}

export function listLeadMagnetDisputesForEmail(email: string): LeadMagnetDispute[] {
  const norm = email.trim().toLowerCase();
  return loadStore().disputes.filter((d) => d.email.trim().toLowerCase() === norm);
}

export function createLeadMagnetCollectionDispute(args: {
  leadId: string;
  email: string;
  collectorName: string;
  bureau: LeadMagnetDispute['bureau'];
  accountLast4?: string;
  balance?: string;
}): LeadMagnetDispute {
  const store = loadStore();
  const existing = store.disputes.find((d) => d.leadId === args.leadId);
  if (existing) return existing;

  const createdAt = nowIso();
  const dispute: LeadMagnetDispute = {
    id: newId('lm_dispute'),
    leadId: args.leadId,
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
  pushTimeline(dispute, 'intake', `Collection: ${dispute.collectorName}`);
  store.disputes.push(dispute);
  saveStore(store);
  return dispute;
}

export function attachLeadMagnetDisputeReport(args: {
  leadId: string;
  fileName: string;
}): LeadMagnetDispute | null {
  const store = loadStore();
  const idx = store.disputes.findIndex((d) => d.leadId === args.leadId);
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

export function markLeadMagnetDisputeLetterReady(leadId: string): LeadMagnetDispute | null {
  return advanceLeadMagnetDispute(leadId, 'letter_ready', 'Round-one dispute letter prepared from your guide.');
}

export function markLeadMagnetDisputeSent(leadId: string): LeadMagnetDispute | null {
  const store = loadStore();
  const idx = store.disputes.findIndex((d) => d.leadId === leadId);
  if (idx < 0) return null;
  const dispute = { ...store.disputes[idx] };
  const at = nowIso();
  dispute.sentAt = at;
  dispute.responseDueAt = addDaysIso(at, 30);
  dispute.status = 'awaiting_response';
  dispute.updatedAt = at;
  pushTimeline(dispute, 'sent', 'Certified mail or online dispute submission logged.');
  pushTimeline(dispute, 'awaiting_response', 'FCRA 30-day response window started.');
  store.disputes[idx] = dispute;
  saveStore(store);
  return dispute;
}

function advanceLeadMagnetDispute(
  leadId: string,
  status: LeadMagnetDisputeStatus,
  note?: string,
): LeadMagnetDispute | null {
  const store = loadStore();
  const idx = store.disputes.findIndex((d) => d.leadId === leadId);
  if (idx < 0) return null;
  const dispute = { ...store.disputes[idx] };
  dispute.status = status;
  dispute.updatedAt = nowIso();
  pushTimeline(dispute, status, note);
  store.disputes[idx] = dispute;
  saveStore(store);
  return dispute;
}

export function leadMagnetDisputeProgress(dispute: LeadMagnetDispute): {
  step: number;
  total: number;
  nextAction: string;
} {
  const order: LeadMagnetDisputeStatus[] = [
    'intake',
    'report_uploaded',
    'letter_ready',
    'sent',
    'awaiting_response',
    'follow_up',
  ];
  const step = Math.max(0, order.indexOf(dispute.status));
  const nextAction =
    dispute.status === 'intake'
      ? 'Upload your credit report or confirm the collection details.'
      : dispute.status === 'report_uploaded'
        ? 'Generate your round-one dispute letter from the free guide.'
        : dispute.status === 'letter_ready'
          ? 'Send the dispute and mark it sent to start the response clock.'
          : dispute.status === 'sent' || dispute.status === 'awaiting_response'
            ? dispute.responseDueAt
              ? `Watch for bureau response by ${new Date(dispute.responseDueAt).toLocaleDateString()}.`
              : 'Log bureau responses as they arrive.'
            : 'Plan your follow-up or next round if needed.';
  return { step: step + 1, total: order.length, nextAction };
}

export { STATUS_LABELS as LEAD_MAGNET_DISPUTE_STATUS_LABELS };
