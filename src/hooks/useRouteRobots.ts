import { useEffect } from 'react';
import { isNoindexPath } from '../lib/publicRobotsPolicy';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** noindex app/auth/portal routes so they do not compete with marketing URLs. */
export function useRouteRobots(pathname: string) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!isNoindexPath(pathname)) return;
    upsertMeta('name', 'robots', 'noindex, follow');
    upsertMeta('name', 'googlebot', 'noindex, follow');
  }, [pathname]);
}
