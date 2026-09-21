import { prefetchRoutePrefix } from './routePrefetch';
import { resolvePublicNavPath } from './publicNavPaths';

const warmed = new Set<string>();

function warmPath(path: string) {
  const normalized = resolvePublicNavPath(path);
  if (warmed.has(normalized)) return;
  warmed.add(normalized);
  prefetchRoutePrefix(normalized);
}

/** Hover / focus / touch intent prefetch for public chrome links. */
export function navIntentProps(target: string): {
  onMouseEnter: () => void;
  onFocus: () => void;
  onTouchStart: () => void;
} {
  return {
    onMouseEnter: () => warmPath(target),
    onFocus: () => warmPath(target),
    onTouchStart: () => warmPath(target),
  };
}

export function warmPublicNavTargets(targets: string[]) {
  for (const t of targets) warmPath(t);
}
