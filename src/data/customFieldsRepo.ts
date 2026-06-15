import type { CustomFieldDefinition, CustomFieldScope } from '../domain/customFields';
import { nowIso } from '../domain/customFields';
import { loadJson, saveJson } from './localJsonStore';
import { FINELY_TENANT_ID } from '../domain/tenants';

const KEY = 'finely.customFields.v1';

type Store = {
  definitions: CustomFieldDefinition[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { definitions: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listCustomFieldDefinitions(args?: { tenantId?: string }): CustomFieldDefinition[] {
  const tenantId = (args?.tenantId || '').trim() || FINELY_TENANT_ID;
  return loadStore()
    .definitions
    .filter((d) => (d.tenantId ? d.tenantId === tenantId : tenantId === FINELY_TENANT_ID))
    .slice()
    .sort((a, b) => {
    if (a.scope !== b.scope) return a.scope.localeCompare(b.scope);
    return a.label.localeCompare(b.label);
  });
}

export function listCustomFieldDefinitionsByScope(scope: CustomFieldScope, tenantId?: string): CustomFieldDefinition[] {
  return listCustomFieldDefinitions({ tenantId }).filter((d) => d.scope === scope);
}

export function upsertCustomFieldDefinition(def: CustomFieldDefinition): CustomFieldDefinition {
  const store = loadStore();
  const idx = store.definitions.findIndex((d) => d.id === def.id);
  const next: CustomFieldDefinition = { ...def, tenantId: (def.tenantId || '').trim() || FINELY_TENANT_ID, updatedAt: nowIso() };
  if (idx >= 0) store.definitions[idx] = next;
  else store.definitions.push(next);
  saveStore(store);
  return next;
}

export function deleteCustomFieldDefinition(id: string) {
  const store = loadStore();
  store.definitions = store.definitions.filter((d) => d.id !== id);
  saveStore(store);
}

