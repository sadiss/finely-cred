import React, { Suspense, lazy, type ComponentType } from 'react';
import { RouteSkeleton } from './RouteSkeleton';

/**
 * Code-split route module with its own Suspense boundary so navigation never
 * blanks the entire app while a chunk loads.
 */
export function lazyRoute(
  importer: () => Promise<{ default: ComponentType<any> }>,
  options?: { label?: string }
): ComponentType<any> {
  const Lazy = lazy(importer);
  const label = options?.label;

  function LazyRoute(props: Record<string, unknown>) {
    return (
      <Suspense fallback={<RouteSkeleton label={label} />}>
        <Lazy {...props} />
      </Suspense>
    );
  }

  return LazyRoute;
}
