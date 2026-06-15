import type { TemplateCategory } from '../domain/templates';
import type { TemplateVaultItem } from '../domain/templateVault';
import { ENTITLEMENT_KEYS, type EntitlementKey } from '../billing/entitlements';
import { hasEntitlement } from './billingRepo';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.template_vault.v1';

type Store = { items: TemplateVaultItem[] };

function nowIso() {
  return new Date().toISOString();
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { items: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function newId(prefix: string) {
  return crypto?.randomUUID ? `${prefix}_${crypto.randomUUID()}` : `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function defaultRequiredEntitlementsForCategory(category: TemplateCategory): EntitlementKey[] {
  // Always require templates module.
  const base: EntitlementKey[] = [ENTITLEMENT_KEYS.templates];
  switch (category) {
    case 'credit_dispute':
    case 'furnisher_dispute':
      return [...base, ENTITLEMENT_KEYS.disputes];
    case 'identity_theft':
      return [...base, ENTITLEMENT_KEYS.identityTheft];
    case 'debt_collection':
    case 'court_filing':
      return [...base, ENTITLEMENT_KEYS.debt];
    // These are currently “admin library” categories; keep them templates-only by default.
    case 'bankruptcy':
    case 'chexsystems':
    case 'business_funding':
    case 'contracts':
    case 'ops':
    default:
      return base;
  }
}

export function listTemplateVaultItems(args: { tenantId: string }): TemplateVaultItem[] {
  const items = loadStore().items.filter((t) => t.tenantId === args.tenantId);
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getTemplateVaultItem(args: { tenantId: string; id: string }): TemplateVaultItem | null {
  const id = (args.id || '').trim();
  if (!id) return null;
  return loadStore().items.find((t) => t.tenantId === args.tenantId && t.id === id) ?? null;
}

export function upsertTemplateVaultItem(item: TemplateVaultItem): TemplateVaultItem {
  const store = loadStore();
  const idx = store.items.findIndex((x) => x.id === item.id);
  const next: TemplateVaultItem = { ...item, updatedAt: nowIso() };
  if (idx >= 0) store.items[idx] = next;
  else store.items.push(next);
  saveStore(store);
  return next;
}

export function createTemplateVaultItem(args: Omit<TemplateVaultItem, 'id' | 'createdAt' | 'updatedAt'>): TemplateVaultItem {
  const now = nowIso();
  const next: TemplateVaultItem = {
    id: newId('tplv'),
    createdAt: now,
    updatedAt: now,
    ...args,
  };
  return upsertTemplateVaultItem(next);
}

export function deleteTemplateVaultItem(args: { tenantId: string; id: string }) {
  const store = loadStore();
  store.items = store.items.filter((t) => !(t.tenantId === args.tenantId && t.id === args.id));
  saveStore(store);
}

export function canPartnerUseTemplate(args: { partnerId: string; template: TemplateVaultItem }): boolean {
  // Require ALL entitlements listed on template.
  for (const key of args.template.requiredEntitlements || []) {
    if (!hasEntitlement(args.partnerId, key)) return false;
  }
  return true;
}

export function listVisibleTemplateVaultItemsForPartner(args: { tenantId: string; partnerId: string }): TemplateVaultItem[] {
  return listTemplateVaultItems({ tenantId: args.tenantId }).filter((t) => canPartnerUseTemplate({ partnerId: args.partnerId, template: t }));
}

