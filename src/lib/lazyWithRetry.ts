import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/** Lazy import with automatic retry — recovers from stale chunk hashes after deploys. */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries = 3,
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await importFn();
      } catch (err) {
        lastError = err;
        if (attempt < retries - 1) {
          await new Promise((r) => window.setTimeout(r, 800 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  });
}
