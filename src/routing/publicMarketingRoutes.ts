/**
 * Canonical list + chrome profile for public marketing routes (no portal/admin).
 */

export type PublicChatLayout = 'standard' | 'compact' | 'minimal';
export type NavView =
  | 'landing'
  | 'tradelines'
  | 'tradelines_primary'
  | 'tradelines_au'
  | 'checkout'
  | 'events'
  | 'about'
  | 'onboarding'
  | 'dashboard'
  | 'services'
  | 'services_tradelines'
  | 'resources'
  | 'pricing'
  | 'testimonials'
  | 'bookstore'
  | 'affiliate'
  | 'agents'
  | 'contact'
  | 'consultation'
  | 'faq'
  | 'terms'
  | 'privacy'
  | 'disclaimer';

export const SERVICE_SLUGS = [
  'personal-credit',
  'personal-credit-restore',
  'personal-credit-building',
  'business-credit',
  'debt-legal',
  'wealth-builder',
  'privacy-id',
  'bundles',
  'tradelines',
  'agencies',
] as const;

/** Static marketing paths (for docs / audits). Dynamic segments noted separately. */
export const PUBLIC_MARKETING_STATIC_PATHS: string[] = [
  '/',
  '/onboarding',
  '/login',
  '/signup',
  '/forgot-password',
  '/pricing',
  '/services',
  '/start',
  '/free-guide',
  '/free-kreyol-guide',
  '/kreyol',
  '/haitian',
  '/tradelines',
  '/checkout',
  '/about',
  '/personal-credit',
  '/fix-my-credit',
  '/build-my-credit',
  '/debt-summons-help',
  '/business-credit-solutions',
  '/business-credit',
  '/funding-readiness',
  '/diy-academy',
  '/blog',
  '/rent-reporting',
  '/resources',
  '/events',
  '/testimonials',
  '/bookstore',
  '/affiliate',
  '/agents',
  '/contact',
  '/enlightenment-session',
  '/consultation',
  '/faq',
  '/claim',
  '/terms',
  '/privacy',
  '/disclaimer',
  ...SERVICE_SLUGS.map((s) => `/services/${s}`),
  ...SERVICE_SLUGS.map((s) => `/pricing/${s}`),
];

const WORKSPACE_PREFIXES = ['/portal', '/admin', '/business', '/au', '/seller', '/dashboard'];

export function isPublicMarketingPath(pathname: string): boolean {
  const p = (pathname || '/').split('?')[0] || '/';
  return !WORKSPACE_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

export type PublicChromeProfile = {
  chatLayout: PublicChatLayout;
  hideApprovalTicker: boolean;
  formHeavy: boolean;
  /** CSS length for PageShell bottom pad + float clearance */
  safeBottom: string;
};

const FORM_HEAVY = [
  '/contact',
  '/enlightenment-session',
  '/consultation',
  '/free-guide',
  '/free-kreyol-guide',
  '/haitian',
  '/affiliate',
  '/agents',
  '/onboarding',
  '/login',
  '/signup',
];

export function getPublicChromeProfile(pathname: string): PublicChromeProfile {
  const p = (pathname || '/').split('?')[0] || '/';
  const formHeavy = FORM_HEAVY.some((x) => p === x || p.startsWith(`${x}/`));

  const heroHeavy =
    p === '/' ||
    p.startsWith('/tradelines') ||
    p.startsWith('/privacy') ||
    p.startsWith('/terms') ||
    p.startsWith('/disclaimer') ||
    p.startsWith('/testimonials') ||
    p.startsWith('/contact') ||
    p.startsWith('/enlightenment-session');

  let chatLayout: PublicChatLayout = 'standard';
  if (formHeavy) chatLayout = 'minimal';
  else if (heroHeavy) chatLayout = 'compact';

  return {
    chatLayout,
    hideApprovalTicker: formHeavy || p.startsWith('/privacy') || p.startsWith('/terms') || p.startsWith('/disclaimer'),
    formHeavy,
    safeBottom: formHeavy ? '11rem' : heroHeavy ? '9rem' : '7rem',
  };
}

export function viewFromPath(pathname: string): NavView {
  if (pathname.startsWith('/tradelines')) return 'tradelines';
  if (pathname.startsWith('/checkout')) return 'checkout';
  if (pathname.startsWith('/events')) return 'events';
  if (pathname.startsWith('/about')) return 'about';
  if (pathname.startsWith('/onboarding') || pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    return 'onboarding';
  }
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (
    pathname.startsWith('/services/business-credit') ||
    pathname.startsWith('/pricing/business-credit') ||
    pathname === '/business-credit'
  ) {
    return 'services';
  }
  if (pathname.startsWith('/services')) return 'services';
  if (pathname.startsWith('/resources') || pathname.startsWith('/blog')) return 'resources';
  if (pathname.startsWith('/pricing') || pathname.startsWith('/start')) return 'pricing';
  if (pathname.startsWith('/testimonials')) return 'testimonials';
  if (pathname.startsWith('/bookstore')) return 'bookstore';
  if (pathname.startsWith('/affiliate')) return 'affiliate';
  if (pathname.startsWith('/agents')) return 'agents';
  if (pathname.startsWith('/contact') || pathname.startsWith('/haitian')) return 'contact';
  if (pathname.startsWith('/enlightenment-session')) return 'consultation';
  if (pathname.startsWith('/faq')) return 'faq';
  if (pathname.startsWith('/terms')) return 'terms';
  if (pathname.startsWith('/privacy')) return 'privacy';
  if (pathname.startsWith('/disclaimer')) return 'disclaimer';
  if (
    pathname.startsWith('/free-kreyol-guide') ||
    pathname.startsWith('/free-guide') ||
    pathname.startsWith('/kreyol')
  ) {
    return 'resources';
  }
  if (pathname.startsWith('/personal-credit')) return 'services';
  return 'landing';
}

export function routeFromView(view: NavView): string {
  const map: Record<NavView, string> = {
    landing: '/',
    tradelines: '/tradelines',
    tradelines_primary: '/tradelines?focus=primary',
    tradelines_au: '/tradelines?focus=au',
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
  return map[view] ?? '/';
}
