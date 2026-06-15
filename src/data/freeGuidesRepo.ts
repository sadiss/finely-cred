import type { FreeGuide, FreeGuideId } from '../resources/freeGuides';
import { ALL_FREE_GUIDES } from '../resources/freeGuides';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.resources.free_guides.v1';

type Store = {
  /** Overrides for built-in guides (same IDs). */
  overrides: FreeGuide[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { overrides: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listFreeGuideOverrides(): FreeGuide[] {
  return loadStore().overrides.slice().sort((a, b) => a.title.localeCompare(b.title));
}

export function getFreeGuideOverride(id: FreeGuideId): FreeGuide | null {
  return loadStore().overrides.find((g) => g.id === id) ?? null;
}

export function upsertFreeGuideOverride(guide: FreeGuide): FreeGuide {
  const store = loadStore();
  const idx = store.overrides.findIndex((g) => g.id === guide.id);
  if (idx >= 0) store.overrides[idx] = guide;
  else store.overrides.push(guide);
  saveStore(store);
  return guide;
}

export function deleteFreeGuideOverride(id: FreeGuideId) {
  const store = loadStore();
  store.overrides = store.overrides.filter((g) => g.id !== id);
  saveStore(store);
}

export function listFreeGuidesEffective(): FreeGuide[] {
  const store = loadStore();
  const byId = new Map(store.overrides.map((g) => [g.id, g] as const));
  return ALL_FREE_GUIDES.map((g) => byId.get(g.id) ?? g);
}

export function findFreeGuideByTitleEffective(title?: string | null): FreeGuide | null {
  const t = (title ?? '').trim().toLowerCase();
  if (!t) return null;
  return listFreeGuidesEffective().find((g) => g.title.trim().toLowerCase() === t) ?? null;
}

/** Match legacy blog slugs or guide ids from `/blog/:slug` redirects. */
export function findFreeGuideBySlugOrIdEffective(slug?: string | null): FreeGuide | null {
  const s = (slug ?? '').trim().toLowerCase();
  if (!s) return null;
  const norm = s.replace(/_/g, '-');
  return listFreeGuidesEffective().find((g) => g.id.toLowerCase() === norm || g.id.toLowerCase().replace(/-/g, '') === norm.replace(/-/g, '')) ?? null;
}

