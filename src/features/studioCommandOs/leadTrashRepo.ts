import { loadJson, saveJson } from '../../data/localJsonStore';
import { newId } from '../../utils/ids';
import type { LeadTrashRecord } from './types';

const KEY = 'finely.lead_trash.v1';
const VERSION = 1;

type Store = { trash: LeadTrashRecord[] };

function nowIso() { return new Date().toISOString(); }
function loadStore(): Store { return loadJson<Store>(KEY, { trash: [] }, VERSION); }
function saveStore(store: Store) { saveJson(KEY, store, VERSION); }

export function listLeadTrash(): LeadTrashRecord[] {
  return loadStore().trash.slice().sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
}

export function isLeadTrashed(leadId: string): boolean {
  return loadStore().trash.some((r) => r.leadId === leadId);
}

export function trashLead(args: { leadId: string; reason?: string; deletedBy?: string; originalStage?: string }): LeadTrashRecord {
  const store = loadStore();
  const existing = store.trash.find((r) => r.leadId === args.leadId);
  if (existing) return existing;
  const rec: LeadTrashRecord = {
    id: newId('leadtrash'),
    leadId: args.leadId,
    deletedAt: nowIso(),
    reason: (args.reason || '').trim() || 'Not a fit / cleanup',
    deletedBy: (args.deletedBy || '').trim() || 'admin',
    originalStage: args.originalStage,
    restoreHint: 'Restore returns the lead to visible pipeline; stage must be verified by admin.',
  };
  store.trash.unshift(rec);
  saveStore(store);
  window.dispatchEvent?.(new CustomEvent('finely:store'));
  return rec;
}

export function restoreLead(leadId: string): boolean {
  const store = loadStore();
  const before = store.trash.length;
  store.trash = store.trash.filter((r) => r.leadId !== leadId);
  if (before !== store.trash.length) {
    saveStore(store);
    window.dispatchEvent?.(new CustomEvent('finely:store'));
    return true;
  }
  return false;
}

export function emptyLeadTrash(): number {
  const store = loadStore();
  const n = store.trash.length;
  store.trash = [];
  saveStore(store);
  window.dispatchEvent?.(new CustomEvent('finely:store'));
  return n;
}
