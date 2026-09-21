import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const RELOAD_GUARD_KEY = 'finely.chunkReloadAttempt.v1';
const RELOAD_GUARD_MS = 30_000;

function isChunkLoadError(err: unknown): boolean {
  const msg = String((err as any)?.message ?? err ?? '');
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Loading chunk [\d]+ failed/i.test(msg) ||
    /ChunkLoadError/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  );
}

function tryOneTimeHardReload(): boolean {
  try {
    const raw = sessionStorage.getItem(RELOAD_GUARD_KEY);
    const last = raw ? Number(raw) : 0;
    if (last && Date.now() - last < RELOAD_GUARD_MS) return false;
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

/**
 * Lazy import with retry for stale deploy chunks.
 * NEVER returns a never-resolving promise — on failure we throw so Suspense ends
 * and an error boundary can show Retry (see RouteChunkErrorBoundary).
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries = 3
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await importFn();
      } catch (err) {
        lastError = err;
        if (attempt < retries - 1) {
          await new Promise((r) => window.setTimeout(r, 400 * (attempt + 1)));
        }
      }
    }

    if (isChunkLoadError(lastError) && tryOneTimeHardReload()) {
      // Page is reloading — throw so React does not hang; reload unloads the tab.
      throw new Error('Refreshing to load the latest version…');
    }

    const message =
      (lastError as any)?.message ||
      'This page module failed to load. Check your connection or try again.';
    const wrapped = new Error(message);
    (wrapped as any).cause = lastError;
    throw wrapped;
  });
}
