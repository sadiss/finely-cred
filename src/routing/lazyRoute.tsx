import React, { Suspense, useState, type ComponentType } from 'react';
import { lazyWithRetry } from '../lib/lazyWithRetry';
import { RouteSkeleton } from './RouteSkeleton';
import { RouteChunkErrorBoundary } from './RouteChunkErrorBoundary';
import { registerRoutePrefetch } from './routePrefetch';

/**
 * Code-split route module with its own Suspense boundary so navigation never
 * blanks the entire app while a chunk loads.
 */
export function lazyRoute(
  importer: () => Promise<{ default: ComponentType<any> }>,
  options?: { label?: string; prefetchPath?: string }
): ComponentType<any> {
  if (options?.prefetchPath) {
    registerRoutePrefetch(options.prefetchPath, importer);
  }

  const Lazy = lazyWithRetry(importer);
  const label = options?.label;

  function LazyRoute(props: Record<string, unknown>) {
    const [attempt, setAttempt] = useState(0);
    return (
      <RouteChunkErrorBoundary onRetry={() => setAttempt((n) => n + 1)}>
        <Suspense key={attempt} fallback={<RouteSkeleton label={label} />}>
          <Lazy {...props} />
        </Suspense>
      </RouteChunkErrorBoundary>
    );
  }

  return LazyRoute;
}
