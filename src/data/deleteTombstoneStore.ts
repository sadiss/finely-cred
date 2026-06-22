/**
 * Tombstone store — tracks IDs of locally deleted entities so they are never
 * merged back from Supabase during a snapshot sync (even if the Supabase delete
 * hasn't propagated yet at page-reload time).
 *
 * Tombstones older than EXPIRY_MS are pruned automatically to prevent unbounded
 * localStorage growth.
 */

const KEY = 'finely.deleteTombstones.v1';
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type EntityKind = 'report' | 'evidence' | 'letter';

type TombstoneEntry = {
  id: string;
  kind: EntityKind;
  deletedAt: number; // Date.now()
};

type TombstoneStore = {
  entries: TombstoneEntry[];
};

function load(): TombstoneStore {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { entries: [] };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.entries)) return parsed as TombstoneStore;
  } catch {
    // ignore
  }
  return { entries: [] };
}

function save(store: TombstoneStore) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

function pruneExpired(store: TombstoneStore): TombstoneStore {
  const cutoff = Date.now() - EXPIRY_MS;
  return { entries: store.entries.filter((e) => e.deletedAt >= cutoff) };
}

export function addTombstone(id: string, kind: EntityKind): void {
  let store = pruneExpired(load());
  // Deduplicate
  if (!store.entries.some((e) => e.id === id && e.kind === kind)) {
    store.entries.push({ id, kind, deletedAt: Date.now() });
  }
  save(store);
}

export function isTombstoned(id: string, kind: EntityKind): boolean {
  const store = load();
  const cutoff = Date.now() - EXPIRY_MS;
  return store.entries.some((e) => e.id === id && e.kind === kind && e.deletedAt >= cutoff);
}

export function filterTombstoned<T extends { id: string }>(items: T[], kind: EntityKind): T[] {
  const store = pruneExpired(load());
  const tombstoned = new Set(store.entries.filter((e) => e.kind === kind).map((e) => e.id));
  if (!tombstoned.size) return items;
  return items.filter((item) => !tombstoned.has(item.id));
}
