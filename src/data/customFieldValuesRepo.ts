import type { CustomFieldScope } from '../domain/customFields';
import type { CustomFieldValuesRecord } from '../domain/customFieldValues';
import { nowIso } from '../domain/customFields';
import { loadJson, saveJson } from './localJsonStore';
import { FINELY_TENANT_ID } from '../domain/tenants';

const KEY = 'finely.customFieldValues.v1';

type Store = {
  records: CustomFieldValuesRecord[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { records: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function getCustomFieldValues(scope: CustomFieldScope, entityId: string, tenantId?: string): CustomFieldValuesRecord {
  const tid = (tenantId || '').trim() || FINELY_TENANT_ID;
  const store = loadStore();
  const hit = store.records.find((r) => (r.tenantId || FINELY_TENANT_ID) === tid && r.scope === scope && r.entityId === entityId);
  if (hit) return hit;
  const createdAt = nowIso();
  return { tenantId: tid, scope, entityId, values: {}, createdAt, updatedAt: createdAt };
}

export function upsertCustomFieldValues(
  scope: CustomFieldScope,
  entityId: string,
  values: Record<string, any>,
  tenantId?: string,
): CustomFieldValuesRecord {
  const tid = (tenantId || '').trim() || FINELY_TENANT_ID;
  const store = loadStore();
  const idx = store.records.findIndex((r) => (r.tenantId || FINELY_TENANT_ID) === tid && r.scope === scope && r.entityId === entityId);
  const createdAt = idx >= 0 ? store.records[idx].createdAt : nowIso();
  const next: CustomFieldValuesRecord = { tenantId: tid, scope, entityId, values, createdAt, updatedAt: nowIso() };
  if (idx >= 0) store.records[idx] = next;
  else store.records.push(next);
  saveStore(store);
  return next;
}

