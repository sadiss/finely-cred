import type { CustomFieldScope } from '../domain/customFields';
import type { FieldLayout } from '../domain/fieldLayouts';
import { nowIso } from '../domain/fieldLayouts';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.fieldLayouts.v1';

type Store = {
  layouts: FieldLayout[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { layouts: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listFieldLayouts(args: { tenantId: string; scope?: CustomFieldScope }): FieldLayout[] {
  const { tenantId, scope } = args;
  return loadStore()
    .layouts
    .filter((l) => l.tenantId === tenantId && (!scope || l.scope === scope))
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getFieldLayout(args: { tenantId: string; scope: CustomFieldScope }): FieldLayout | null {
  return listFieldLayouts(args)[0] ?? null;
}

export function upsertFieldLayout(layout: FieldLayout): FieldLayout {
  const store = loadStore();
  const idx = store.layouts.findIndex((x) => x.id === layout.id);
  const next: FieldLayout = { ...layout, updatedAt: nowIso() };
  if (idx >= 0) store.layouts[idx] = next;
  else store.layouts.push(next);
  saveStore(store);
  return next;
}

export function deleteFieldLayout(id: string) {
  const store = loadStore();
  store.layouts = store.layouts.filter((l) => l.id !== id);
  saveStore(store);
}

