import type { SecretVaultItem } from '../domain/secretVault';
import { nowIso } from '../domain/secretVault';
import { newId } from '../utils/ids';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.secretVault.v1';

type Store = {
  items: SecretVaultItem[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { items: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listSecretVaultItemsByTenant(tenantId: string): SecretVaultItem[] {
  const t = (tenantId || '').trim();
  if (!t) return [];
  return loadStore()
    .items
    .filter((i) => i.tenantId === t)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function upsertSecretVaultItem(item: SecretVaultItem): SecretVaultItem {
  const store = loadStore();
  const idx = store.items.findIndex((x) => x.id === item.id);
  const next = { ...item, updatedAt: nowIso() };
  if (idx >= 0) store.items[idx] = next;
  else store.items.push(next);
  saveStore(store);
  return next;
}

export function createSecretVaultFileItem(args: Omit<SecretVaultItem, 'id' | 'createdAt' | 'updatedAt' | 'type'>): SecretVaultItem {
  const now = nowIso();
  return upsertSecretVaultItem({
    id: newId('vault'),
    createdAt: now,
    updatedAt: now,
    type: 'file',
    ...args,
  });
}

export function createSecretVaultUrlItem(args: Omit<SecretVaultItem, 'id' | 'createdAt' | 'updatedAt' | 'type'>): SecretVaultItem {
  const now = nowIso();
  return upsertSecretVaultItem({
    id: newId('vault'),
    createdAt: now,
    updatedAt: now,
    type: 'url',
    ...args,
  });
}

export function deleteSecretVaultItem(id: string) {
  const store = loadStore();
  store.items = store.items.filter((i) => i.id !== id);
  saveStore(store);
}

