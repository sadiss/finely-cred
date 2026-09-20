import { PUBLIC_SEO_CATALOG } from '../data/publicSeoCatalog';

/** App / auth / portal prefixes that must not be indexed. */
export const PRIVATE_ROBOTS_PREFIXES = [
  '/admin',
  '/portal',
  '/dashboard',
  '/onboarding',
  '/login',
  '/signup',
  '/forgot-password',
  '/seller',
  '/account',
  '/preview',
  '/owners-guide',
  '/business',
  '/partner-setup',
] as const;

function normalizePath(pathname: string): string {
  const raw = (pathname || '/').split('?')[0] || '/';
  if (raw.length > 1 && raw.endsWith('/')) return raw.slice(0, -1);
  return raw;
}

export function isNoindexPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  if (path === '/unsubscribe' || path.startsWith('/unsubscribe/')) return true;
  if (path === '/au/orders' || path.startsWith('/au/orders/')) return true;
  for (const prefix of PRIVATE_ROBOTS_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return true;
  }
  const entry = PUBLIC_SEO_CATALOG.find((row) => row.path === path);
  return Boolean(entry && entry.sitemap === false);
}
