/** Routes that are public marketing — no admin/portal quick-link footers. */
const PUBLIC_PREFIXES = [
  '/free-guide',
  '/free-debt-guide',
  '/free-business-guide',
  '/free-tradeline-guide',
  '/case-desk-guide',
  '/resources',
  '/pricing',
  '/services',
  '/contact',
  '/faq',
  '/bookstore',
  '/affiliate',
  '/enlightenment-session',
  '/consultation',
  '/book',
  '/meet',
  '/claim',
  '/unsubscribe',
  '/tradelines',
  '/credit-specialists',
  '/agents',
  '/events',
  '/testimonials',
  '/checkout',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/pricing/personal-credit-restore',
  '/about',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

export function isPublicMarketingPath(pathname: string): boolean {
  const path = (pathname.split('?')[0] ?? '/').replace(/\/+$/, '') || '/';
  if (path === '/') return true;
  if (PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return true;
  return false;
}

export function isInternalWorkspacePath(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname;
  if (isPublicMarketingPath(path)) return false;
  return (
    path.startsWith('/admin') ||
    path.startsWith('/portal') ||
    path.startsWith('/dashboard') ||
    path.startsWith('/owners-guide') ||
    path.startsWith('/onboarding') ||
    path.startsWith('/account') ||
    path.startsWith('/business') ||
    path.startsWith('/credit-specialist') ||
    path.startsWith('/affiliate/hub') ||
    path.startsWith('/agency/hub') ||
    path.startsWith('/agency/signup') ||
    path.startsWith('/case-help/hub') ||
    path.startsWith('/real-estate/hub') ||
    path.startsWith('/agent') ||
    path.startsWith('/seller') ||
    path.startsWith('/au-seller/hub') ||
    path.startsWith('/au/')
  );
}
