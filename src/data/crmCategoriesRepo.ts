import type { CrmCategory, CrmCategoryAssignment, CrmCategoryId, CrmEntityKind } from '../domain/crmCategories';
import { nowIso } from '../domain/crmCategories';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.crm.categories.v1';
const VERSION = 1;

type Store = {
  categories: CrmCategory[];
  assignments: CrmCategoryAssignment[];
};

function norm(s: any) {
  return String(s ?? '').trim();
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { categories: [], assignments: [] }, VERSION);
}

function saveStore(store: Store) {
  saveJson(KEY, store, VERSION);
}

export function listCrmCategories(): CrmCategory[] {
  const store = loadStore();
  return (store.categories ?? []).slice().sort((a, b) => a.label.localeCompare(b.label));
}

export function createCrmCategory(args: { label: string; color?: string }): CrmCategory {
  const label = norm(args.label);
  if (!label) throw new Error('Category label is required.');
  const store = loadStore();
  const now = nowIso();
  const existing = (store.categories ?? []).find((c) => c.label.toLowerCase() === label.toLowerCase());
  if (existing) return existing;
  const cat: CrmCategory = {
    id: newId('crmcat'),
    label,
    color: norm(args.color) || undefined,
    createdAt: now,
    updatedAt: now,
  };
  store.categories = [cat, ...(store.categories ?? [])];
  saveStore(store);
  return cat;
}

export function upsertCrmCategory(cat: CrmCategory): CrmCategory {
  const store = loadStore();
  const now = nowIso();
  const next: CrmCategory = {
    ...cat,
    label: norm(cat.label),
    color: norm(cat.color) || undefined,
    updatedAt: now,
  };
  if (!next.label) throw new Error('Category label is required.');
  const idx = (store.categories ?? []).findIndex((c) => c.id === next.id);
  if (idx >= 0) store.categories[idx] = next;
  else store.categories = [next, ...(store.categories ?? [])];
  saveStore(store);
  return next;
}

export function deleteCrmCategory(id: CrmCategoryId): boolean {
  const store = loadStore();
  const before = (store.categories ?? []).length;
  store.categories = (store.categories ?? []).filter((c) => c.id !== id);
  store.assignments = (store.assignments ?? []).map((a) => ({
    ...a,
    categoryIds: (a.categoryIds ?? []).filter((cid) => cid !== id),
    updatedAt: nowIso(),
  }));
  const changed = store.categories.length !== before;
  if (changed) saveStore(store);
  return changed;
}

function assignmentId(kind: CrmEntityKind, entityId: string) {
  return `${kind}:${entityId}`;
}

export function getCrmCategoryIdsForEntity(kind: CrmEntityKind, entityId: string): CrmCategoryId[] {
  const store = loadStore();
  const key = assignmentId(kind, entityId);
  const a = (store.assignments ?? []).find((x) => x.id === key);
  return (a?.categoryIds ?? []).slice();
}

export function setCrmCategoriesForEntity(kind: CrmEntityKind, entityId: string, categoryIds: CrmCategoryId[]): CrmCategoryAssignment {
  const store = loadStore();
  const key = assignmentId(kind, entityId);
  const now = nowIso();
  const uniq = Array.from(new Set((categoryIds ?? []).map((x) => norm(x)).filter(Boolean))).slice(0, 24);
  const next: CrmCategoryAssignment = {
    id: key,
    entityKind: kind,
    entityId: norm(entityId),
    categoryIds: uniq,
    updatedAt: now,
  };
  const idx = (store.assignments ?? []).findIndex((x) => x.id === key);
  if (idx >= 0) store.assignments[idx] = next;
  else store.assignments = [next, ...(store.assignments ?? [])];
  saveStore(store);
  return next;
}

export function toggleCrmCategoryForEntity(kind: CrmEntityKind, entityId: string, categoryId: CrmCategoryId, on?: boolean): CrmCategoryAssignment {
  const cur = getCrmCategoryIdsForEntity(kind, entityId);
  const has = cur.includes(categoryId);
  const next = on === true ? (has ? cur : [categoryId, ...cur]) : on === false ? cur.filter((x) => x !== categoryId) : has ? cur.filter((x) => x !== categoryId) : [categoryId, ...cur];
  return setCrmCategoriesForEntity(kind, entityId, next);
}

