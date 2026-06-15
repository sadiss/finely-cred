/** Part E8 — local audit trail for AI + hands-free ops actions. */
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.aiActionAudit.v1';
const MAX = 200;

export type AiActionAuditKind =
  | 'autopilot_queue'
  | 'brain_ask'
  | 'letter_chain'
  | 'social_autopilot'
  | 'automation_rule';

export type AiActionAuditStatus = 'queued' | 'approved' | 'dismissed' | 'blocked' | 'info';

export type AiActionAuditEntry = {
  id: string;
  at: string;
  kind: AiActionAuditKind;
  action: string;
  detail?: string;
  partnerId?: string;
  partnerName?: string;
  status: AiActionAuditStatus;
  meta?: Record<string, unknown>;
};

type Store = { entries: AiActionAuditEntry[] };

function loadStore(): Store {
  return loadJson(KEY, { entries: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function appendAiActionAudit(
  entry: Omit<AiActionAuditEntry, 'id' | 'at'> & { id?: string; at?: string },
): AiActionAuditEntry {
  const store = loadStore();
  const rec: AiActionAuditEntry = {
    id: entry.id ?? `audit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    at: entry.at ?? new Date().toISOString(),
    kind: entry.kind,
    action: entry.action,
    detail: entry.detail,
    partnerId: entry.partnerId,
    partnerName: entry.partnerName,
    status: entry.status,
    meta: entry.meta,
  };
  store.entries.unshift(rec);
  if (store.entries.length > MAX) store.entries = store.entries.slice(0, MAX);
  saveStore(store);
  return rec;
}

export function listAiActionAudit(limit = 30): AiActionAuditEntry[] {
  return loadStore().entries.slice(0, limit);
}

export function aiActionAuditStats() {
  const entries = loadStore().entries;
  const last24h = entries.filter((e) => Date.now() - Date.parse(e.at) < 86400000);
  return {
    total: entries.length,
    last24h: last24h.length,
    pendingQueue: last24h.filter((e) => e.kind === 'autopilot_queue' && e.status === 'queued').length,
  };
}
