import type { PartnerEscalation } from '../domain/escalations';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.escalations.v1';
type Store = { escalations: PartnerEscalation[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { escalations: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function nowIso(): string {
  return new Date().toISOString();
}

export function listEscalationsByPartner(partnerId: string): PartnerEscalation[] {
  return loadStore().escalations
    .filter((e) => e.partnerId === partnerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createEscalation(args: Omit<PartnerEscalation, 'id' | 'createdAt' | 'updatedAt' | 'status'>): PartnerEscalation {
  const store = loadStore();
  const now = nowIso();
  const esc: PartnerEscalation = {
    id: newId('esc'),
    status: 'open',
    createdAt: now,
    updatedAt: now,
    ...args,
  };
  store.escalations.push(esc);
  saveStore(store);
  return esc;
}

export function getEscalation(id: string): PartnerEscalation | null {
  return loadStore().escalations.find((e) => e.id === id) ?? null;
}

export function updateEscalationStatus(
  id: string,
  status: PartnerEscalation['status'],
  resolutionNote?: string
): PartnerEscalation | null {
  const store = loadStore();
  const idx = store.escalations.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const next = {
    ...store.escalations[idx],
    status,
    updatedAt: nowIso(),
    ...(resolutionNote !== undefined && { resolutionNote }),
  };
  store.escalations[idx] = next;
  saveStore(store);
  return next;
}
