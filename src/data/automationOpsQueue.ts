import type { AgentPersonaId } from '../domain/agentPersonas';
import type { Bureau } from '../domain/creditReports';
import { loadJson, saveJson } from './localJsonStore';
import { appendAiActionAudit } from './aiActionAuditLog';

const KEY = 'finely.autopilotQueue.v1';

export type AutopilotQueueKind = 'draft_review' | 'mail_confirm' | 'complaint' | 'staff_gap';

export type AutopilotQueueItem = {
  id: string;
  kind: AutopilotQueueKind;
  partnerId: string;
  partnerName?: string;
  title: string;
  body?: string;
  letterId?: string;
  bureau?: Bureau;
  roleId?: AgentPersonaId;
  status: 'pending' | 'done' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
};

type Store = { items: AutopilotQueueItem[] };

function loadStore(): Store {
  return loadJson(KEY, { items: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function listAutopilotQueue(status?: AutopilotQueueItem['status']): AutopilotQueueItem[] {
  const items = loadStore().items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!status) return items.filter((i) => i.status === 'pending');
  return items.filter((i) => i.status === status);
}

export function pushAutopilotQueueItem(
  item: Omit<AutopilotQueueItem, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
    id?: string;
    status?: AutopilotQueueItem['status'];
  },
): AutopilotQueueItem {
  const store = loadStore();
  const now = new Date().toISOString();
  const rec: AutopilotQueueItem = {
    id: item.id ?? `apq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    status: item.status ?? 'pending',
    createdAt: now,
    updatedAt: now,
    kind: item.kind,
    partnerId: item.partnerId,
    partnerName: item.partnerName,
    title: item.title,
    body: item.body,
    letterId: item.letterId,
    bureau: item.bureau,
    roleId: item.roleId,
    meta: item.meta,
  };
  const dup = store.items.find(
    (x) =>
      x.status === 'pending' &&
      x.kind === rec.kind &&
      x.partnerId === rec.partnerId &&
      x.letterId === rec.letterId &&
      x.title === rec.title,
  );
  if (dup) return dup;
  store.items.unshift(rec);
  if (store.items.length > 500) store.items = store.items.slice(0, 500);
  saveStore(store);
  appendAiActionAudit({
    kind: 'autopilot_queue',
    action: rec.title,
    detail: rec.body,
    partnerId: rec.partnerId,
    partnerName: rec.partnerName,
    status: 'queued',
    meta: { queueId: rec.id, kind: rec.kind },
  });
  return rec;
}

export function setAutopilotQueueStatus(id: string, status: AutopilotQueueItem['status']) {
  const store = loadStore();
  const idx = store.items.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const prev = store.items[idx]!;
  store.items[idx] = { ...prev, status, updatedAt: new Date().toISOString() };
  saveStore(store);
  if (status === 'done' || status === 'dismissed') {
    appendAiActionAudit({
      kind: 'autopilot_queue',
      action: prev.title,
      detail: status === 'done' ? 'Approved by ops' : 'Dismissed by ops',
      partnerId: prev.partnerId,
      partnerName: prev.partnerName,
      status: status === 'done' ? 'approved' : 'dismissed',
      meta: { queueId: id, kind: prev.kind },
    });
  }
  return store.items[idx]!;
}

export function autopilotQueueKpis() {
  const pending = listAutopilotQueue('pending');
  return {
    draftReview: pending.filter((i) => i.kind === 'draft_review').length,
    mailConfirm: pending.filter((i) => i.kind === 'mail_confirm').length,
    complaint: pending.filter((i) => i.kind === 'complaint').length,
    staffGap: pending.filter((i) => i.kind === 'staff_gap').length,
    total: pending.length,
  };
}
