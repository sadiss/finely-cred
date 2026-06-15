import type { PartnerSavedReason } from '../domain/partnerReasonPacks';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.partner_reason_packs.v1';

type Store = { reasons: PartnerSavedReason[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { reasons: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listSavedReasonsByPartner(partnerId: string): PartnerSavedReason[] {
  return loadStore()
    .reasons.filter((r) => r.partnerId === partnerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function savePartnerReason(args: { partnerId: string; text: string; category?: string }): PartnerSavedReason {
  const store = loadStore();
  const reason: PartnerSavedReason = {
    id: newId('preason'),
    partnerId: args.partnerId,
    text: args.text.trim(),
    category: args.category,
    createdAt: new Date().toISOString(),
  };
  store.reasons.push(reason);
  saveStore(store);
  return reason;
}

export function deletePartnerReason(id: string) {
  const store = loadStore();
  store.reasons = store.reasons.filter((r) => r.id !== id);
  saveStore(store);
}
