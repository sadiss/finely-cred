/** Per-lead funnel toolkit progress — local until portal upgrade. */

import { loadJson, saveJson } from '../data/localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.leadMagnet.toolkit.v1';

export type ToolkitChecklistItem = {
  id: string;
  label: string;
  hint?: string;
  done: boolean;
};

export type LeadMagnetToolkitRecord = {
  id: string;
  leadId: string;
  funnelId: string;
  email: string;
  checklist: ToolkitChecklistItem[];
  notes: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

type Store = { records: LeadMagnetToolkitRecord[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { records: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function nowIso() {
  return new Date().toISOString();
}

export function getToolkitByLead(leadId: string, funnelId: string): LeadMagnetToolkitRecord | null {
  return loadStore().records.find((r) => r.leadId === leadId && r.funnelId === funnelId) ?? null;
}

export function upsertToolkitChecklist(args: {
  leadId: string;
  funnelId: string;
  email: string;
  items: Array<{ id: string; label: string; hint?: string }>;
  doneIds: Set<string>;
  notes?: Record<string, string>;
}): LeadMagnetToolkitRecord {
  const store = loadStore();
  const existing = store.records.find((r) => r.leadId === args.leadId && r.funnelId === args.funnelId);
  const checklist: ToolkitChecklistItem[] = args.items.map((item) => ({
    ...item,
    done: args.doneIds.has(item.id),
  }));
  const record: LeadMagnetToolkitRecord = existing
    ? {
        ...existing,
        checklist,
        notes: { ...existing.notes, ...args.notes },
        updatedAt: nowIso(),
      }
    : {
        id: newId('lm_toolkit'),
        leadId: args.leadId,
        funnelId: args.funnelId,
        email: args.email,
        checklist,
        notes: args.notes ?? {},
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
  const next = existing
    ? store.records.map((r) => (r.id === record.id ? record : r))
    : [...store.records, record];
  saveStore({ records: next });
  return record;
}

export function toggleToolkitItem(leadId: string, funnelId: string, itemId: string): LeadMagnetToolkitRecord | null {
  const store = loadStore();
  const idx = store.records.findIndex((r) => r.leadId === leadId && r.funnelId === funnelId);
  if (idx < 0) return null;
  const record = { ...store.records[idx] };
  record.checklist = record.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c));
  record.updatedAt = nowIso();
  store.records[idx] = record;
  saveStore(store);
  return record;
}

export function toolkitProgress(record: LeadMagnetToolkitRecord | null): { done: number; total: number; pct: number } {
  if (!record?.checklist.length) return { done: 0, total: 0, pct: 0 };
  const done = record.checklist.filter((c) => c.done).length;
  const total = record.checklist.length;
  return { done, total, pct: Math.round((done / total) * 100) };
}
