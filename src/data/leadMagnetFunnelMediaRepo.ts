import { loadJson, saveJson } from './localJsonStore';
import type { LeadMagnetFunnelMedia } from '../domain/leadMagnetFunnelMedia';
import type { LeadMagnetFunnelConfig } from '../domain/leadMagnetFunnels';

const KEY = 'finely.leadMagnetFunnelMedia.v1';
const VERSION = 1;

type Store = { items: Record<string, LeadMagnetFunnelMedia> };

function nowIso() {
  return new Date().toISOString();
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { items: {} }, VERSION);
}

function saveStore(store: Store) {
  saveJson(KEY, store, VERSION);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function getFunnelMedia(funnelKey: string): LeadMagnetFunnelMedia | null {
  const key = (funnelKey || '').trim();
  if (!key) return null;
  return loadStore().items[key] ?? null;
}

export function getFunnelMediaForConfig(config: LeadMagnetFunnelConfig): LeadMagnetFunnelMedia | null {
  return getFunnelMedia(config.funnelId) ?? getFunnelMedia(config.id);
}

export function upsertFunnelMedia(
  funnelKey: string,
  patch: Partial<Omit<LeadMagnetFunnelMedia, 'funnelKey' | 'updatedAt'>>,
): LeadMagnetFunnelMedia {
  const key = (funnelKey || '').trim();
  const store = loadStore();
  const prev = store.items[key];
  const next: LeadMagnetFunnelMedia = {
    ...prev,
    ...patch,
    funnelKey: key,
    updatedAt: nowIso(),
  };
  store.items[key] = next;
  saveStore(store);
  return next;
}

export function clearFunnelMedia(funnelKey: string) {
  const key = (funnelKey || '').trim();
  const store = loadStore();
  delete store.items[key];
  saveStore(store);
}

export function listFunnelMedia(): LeadMagnetFunnelMedia[] {
  return Object.values(loadStore().items).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
