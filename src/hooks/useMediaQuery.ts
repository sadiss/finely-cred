import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [query]);

  return matches;
}

/** Phone — primary audience for funnels. */
export function useIsMobileViewport() {
  return useMediaQuery('(max-width: 639px)');
}

/** Tablet portrait / small laptop — second funnel target. */
export function useIsTabletViewport() {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
}

/** Mobile + tablet — use bottom chrome instead of desktop section rail. */
export function useIsMobileOrTabletViewport() {
  return useMediaQuery('(max-width: 1023px)');
}
