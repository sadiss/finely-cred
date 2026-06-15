import type { Bureau } from '../domain/creditReports';
import type { DisputeReasonsRecord } from '../domain/disputeReasons';
import { computeDisputeReasonsId } from '../domain/disputeReasons';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.disputeReasons.v1';

type Store = { items: DisputeReasonsRecord[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { items: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listDisputeReasonsByPartner(partnerId: string): DisputeReasonsRecord[] {
  return loadStore()
    .items.filter((x) => x.partnerId === partnerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDisputeReasons(args: {
  partnerId: string;
  reportId?: string;
  bureau: Bureau;
  candidateId: string;
}): DisputeReasonsRecord | null {
  const id = computeDisputeReasonsId(args);
  return loadStore().items.find((x) => x.id === id) ?? null;
}

export function upsertDisputeReasons(rec: DisputeReasonsRecord): DisputeReasonsRecord {
  const store = loadStore();
  const idx = store.items.findIndex((x) => x.id === rec.id);
  if (idx >= 0) store.items[idx] = rec;
  else store.items.push(rec);
  saveStore(store);
  return rec;
}

export function deleteDisputeReasons(id: string) {
  const store = loadStore();
  store.items = store.items.filter((x) => x.id !== id);
  saveStore(store);
}

