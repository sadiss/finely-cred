import type { LibraryBookmark, LibraryBookEntitlement, LibraryReadingProgress } from '../domain/libraryEntitlements';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.library.v1';

type Store = {
  entitlements: LibraryBookEntitlement[];
  progress: LibraryReadingProgress[];
  bookmarks: LibraryBookmark[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { entitlements: [], progress: [], bookmarks: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function nowIso() {
  return new Date().toISOString();
}

export function listLibraryEntitlements(partnerId: string): LibraryBookEntitlement[] {
  return loadStore().entitlements.filter((e) => e.partnerId === partnerId);
}

export function hasLibraryBook(partnerId: string, bookSlug: string): boolean {
  return listLibraryEntitlements(partnerId).some((e) => e.bookSlug === bookSlug);
}

export function grantLibraryBook(args: {
  partnerId: string;
  bookSlug: string;
  source: LibraryBookEntitlement['source'];
  agreementId?: string;
}): LibraryBookEntitlement {
  const store = loadStore();
  const existing = store.entitlements.find((e) => e.partnerId === args.partnerId && e.bookSlug === args.bookSlug);
  if (existing) return existing;

  const ent: LibraryBookEntitlement = {
    partnerId: args.partnerId,
    bookSlug: args.bookSlug,
    grantedAt: nowIso(),
    source: args.source,
    agreementId: args.agreementId,
  };
  store.entitlements.unshift(ent);
  saveStore(store);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('finely:store'));
  }
  return ent;
}

export function revokeLibraryBook(partnerId: string, bookSlug: string) {
  const store = loadStore();
  store.entitlements = store.entitlements.filter((e) => !(e.partnerId === partnerId && e.bookSlug === bookSlug));
  saveStore(store);
}

export function getReadingProgress(partnerId: string, bookSlug: string): LibraryReadingProgress | null {
  const hits = loadStore().progress.filter((p) => p.partnerId === partnerId && p.bookSlug === bookSlug);
  hits.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return hits[0] ?? null;
}

export function saveReadingProgress(args: Omit<LibraryReadingProgress, 'updatedAt'> & { updatedAt?: string }) {
  const store = loadStore();
  const idx = store.progress.findIndex(
    (p) => p.partnerId === args.partnerId && p.bookSlug === args.bookSlug && p.chapterId === args.chapterId,
  );
  const row: LibraryReadingProgress = { ...args, updatedAt: args.updatedAt ?? nowIso() };
  if (idx >= 0) store.progress[idx] = row;
  else store.progress.unshift(row);
  saveStore(store);
}

export function listBookmarks(partnerId: string, bookSlug?: string): LibraryBookmark[] {
  return loadStore()
    .bookmarks.filter((b) => b.partnerId === partnerId && (!bookSlug || b.bookSlug === bookSlug))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addBookmark(args: Omit<LibraryBookmark, 'id' | 'createdAt'>): LibraryBookmark {
  const store = loadStore();
  const bm: LibraryBookmark = { ...args, id: newId('lbm'), createdAt: nowIso() };
  store.bookmarks.unshift(bm);
  saveStore(store);
  return bm;
}

/** Demo: grant flagship book for portal trial partners. */
export function ensureDemoLibraryGrant(partnerId: string) {
  if (!hasLibraryBook(partnerId, 'sovereign-blueprint')) {
    grantLibraryBook({ partnerId, bookSlug: 'sovereign-blueprint', source: 'demo' });
  }
}
