/** Bump when seeded bookstore markdown is materially updated — forces merge into localStorage. */
export const BOOKSTORE_CONTENT_VERSION = 5;

const VERSION_KEY = 'finely.bookstore.contentVersion';

export function getStoredBookstoreContentVersion(): number {
  try {
    const raw = localStorage.getItem(VERSION_KEY);
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function markBookstoreContentVersionApplied(version: number) {
  try {
    localStorage.setItem(VERSION_KEY, String(version));
  } catch {
    /* ignore */
  }
}
