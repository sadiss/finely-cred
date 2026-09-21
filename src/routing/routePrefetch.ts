/** Path → dynamic import (registered from lazyRoute). */
const prefetchByPath = new Map<string, () => Promise<unknown>>();

export function registerRoutePrefetch(path: string, importer: () => Promise<unknown>) {
  prefetchByPath.set(path, importer);
}

const inflight = new Set<string>();

export function prefetchRoute(path: string) {
  const normalized = path.split('?')[0].split('#')[0];
  const importer = prefetchByPath.get(normalized);
  if (!importer || inflight.has(normalized)) return;
  inflight.add(normalized);
  void importer().finally(() => inflight.delete(normalized));
}

/** Register many paths that share the same chunk importer (e.g. /pricing/:service). */
export function registerRoutePrefetchPrefix(prefix: string, importer: () => Promise<unknown>) {
  prefetchByPath.set(prefix, importer);
}

export function prefetchRoutePrefix(path: string) {
  const normalized = path.split('?')[0].split('#')[0];
  for (const [key, importer] of prefetchByPath) {
    if (normalized === key || normalized.startsWith(key + '/')) {
      prefetchRoute(key);
      return;
    }
  }
  prefetchRoute(normalized);
}
