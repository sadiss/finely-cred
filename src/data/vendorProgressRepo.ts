import { loadJson, saveJson } from './localJsonStore';
import { FINELY_TENANT_ID } from '../domain/tenants';

export type VendorProgressStatus = 'recommended' | 'opened' | 'skipped';

export type VendorProgressRecord = {
  tenantId: string;
  partnerId: string;
  vendorId: string;
  status: VendorProgressStatus;
  createdAt: string;
  updatedAt: string;
};

const KEY = 'finely.vendorProgress.v1';

type Store = {
  records: VendorProgressRecord[];
};

function nowIso() {
  return new Date().toISOString();
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { records: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listVendorProgress(args: { partnerId: string; tenantId?: string }): VendorProgressRecord[] {
  const tenantId = (args.tenantId || '').trim() || FINELY_TENANT_ID;
  return loadStore().records.filter((r) => r.tenantId === tenantId && r.partnerId === args.partnerId).slice();
}

export function getVendorProgress(args: { partnerId: string; vendorId: string; tenantId?: string }): VendorProgressRecord | null {
  const tenantId = (args.tenantId || '').trim() || FINELY_TENANT_ID;
  return (
    loadStore().records.find((r) => r.tenantId === tenantId && r.partnerId === args.partnerId && r.vendorId === args.vendorId) ?? null
  );
}

export function setVendorProgress(args: {
  partnerId: string;
  vendorId: string;
  status: VendorProgressStatus;
  tenantId?: string;
}): VendorProgressRecord {
  const tenantId = (args.tenantId || '').trim() || FINELY_TENANT_ID;
  const store = loadStore();
  const idx = store.records.findIndex((r) => r.tenantId === tenantId && r.partnerId === args.partnerId && r.vendorId === args.vendorId);
  const createdAt = idx >= 0 ? store.records[idx].createdAt : nowIso();
  const next: VendorProgressRecord = {
    tenantId,
    partnerId: args.partnerId,
    vendorId: args.vendorId,
    status: args.status,
    createdAt,
    updatedAt: nowIso(),
  };
  if (idx >= 0) store.records[idx] = next;
  else store.records.push(next);
  saveStore(store);
  return next;
}

