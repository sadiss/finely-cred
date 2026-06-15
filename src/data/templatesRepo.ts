import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.templates.settings.v1';

type Store = {
  favorites: string[]; // baseIds
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { favorites: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listFavoriteTemplateIds(): string[] {
  return loadStore().favorites.slice();
}

export function toggleFavoriteTemplate(baseId: string): boolean {
  const store = loadStore();
  const idx = store.favorites.indexOf(baseId);
  if (idx >= 0) store.favorites.splice(idx, 1);
  else store.favorites.unshift(baseId);
  // cap
  store.favorites = Array.from(new Set(store.favorites)).slice(0, 200);
  saveStore(store);
  return store.favorites.includes(baseId);
}

