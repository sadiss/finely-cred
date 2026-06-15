import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

export type PartnerApiKey = {
  id: string;
  label: string;
  keyPrefix: string;
  scopes: string[];
  partnerId?: string;
  enabled: boolean;
  createdAt: string;
  lastUsedAt?: string;
};

const KEY = 'finely.partnerApiKeys.v1';

type Store = { keys: PartnerApiKey[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { keys: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function randomKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `fc_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export function listPartnerApiKeys(): PartnerApiKey[] {
  return loadStore().keys;
}

export function createPartnerApiKey(args: {
  label: string;
  scopes?: string[];
  partnerId?: string;
}): { record: PartnerApiKey; secret: string } {
  const secret = randomKey();
  const record: PartnerApiKey = {
    id: newId('pak'),
    label: args.label.trim() || 'Partner API key',
    keyPrefix: secret.slice(0, 12),
    scopes: args.scopes ?? ['leads:read', 'webhooks:receive'],
    partnerId: args.partnerId,
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  const store = loadStore();
  store.keys.unshift(record);
  saveStore(store);
  return { record, secret };
}

export function togglePartnerApiKey(id: string, enabled: boolean): PartnerApiKey | null {
  const store = loadStore();
  const idx = store.keys.findIndex((k) => k.id === id);
  if (idx < 0) return null;
  store.keys[idx] = { ...store.keys[idx], enabled };
  saveStore(store);
  return store.keys[idx];
}

export function revokePartnerApiKey(id: string): boolean {
  const store = loadStore();
  const before = store.keys.length;
  store.keys = store.keys.filter((k) => k.id !== id);
  if (store.keys.length === before) return false;
  saveStore(store);
  return true;
}
