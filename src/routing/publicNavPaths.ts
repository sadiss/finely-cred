/** Resolve public header/footer/mobile nav targets to route paths (for prefetch + navigation). */
const VIEW_TO_PATH: Record<string, string> = {
  landing: '/',
  tradelines: '/tradelines',
  tradelines_primary: '/tradelines',
  tradelines_au: '/tradelines',
  checkout: '/checkout',
  events: '/events',
  about: '/about',
  onboarding: '/onboarding',
  dashboard: '/dashboard',
  services: '/services',
  services_tradelines: '/services/tradelines',
  resources: '/resources',
  pricing: '/pricing',
  testimonials: '/testimonials',
  bookstore: '/bookstore',
  affiliate: '/affiliate',
  agents: '/agents',
  contact: '/contact',
  consultation: '/enlightenment-session',
  faq: '/faq',
  terms: '/terms',
  privacy: '/privacy',
  disclaimer: '/disclaimer',
};

export function resolvePublicNavPath(target: string): string {
  const raw = target.trim();
  if (!raw) return '/';
  if (raw.startsWith('/')) {
    const pathOnly = raw.split('?')[0] || '/';
    return pathOnly;
  }
  return VIEW_TO_PATH[raw] ?? `/${raw}`;
}

export const PUBLIC_SERVICE_PATHS = [
  '/services/personal-credit-restore',
  '/services/personal-credit-building',
  '/services/business-credit',
  '/services/debt-legal',
  '/services/wealth-builder',
  '/services/privacy-id',
  '/services/bundles',
  '/services/agencies',
  '/services/tradelines',
] as const;
