export type SiteWayfinderLane = {
  id: string;
  label: string;
  hint: string;
  path: string;
  accent: 'emerald' | 'violet' | 'fuchsia' | 'amber' | 'sky';
};

/** Four high-intent lanes — sticky wayfinder below the header. */
export const SITE_WAYFINDER_LANES: SiteWayfinderLane[] = [
  {
    id: 'personal',
    label: 'Personal credit',
    hint: 'Restore & build',
    path: '/services/personal-credit-restore',
    accent: 'emerald',
  },
  {
    id: 'business',
    label: 'Business credit',
    hint: 'Entity & funding',
    path: '/services/business-credit',
    accent: 'violet',
  },
  {
    id: 'debt',
    label: 'Debt & legal',
    hint: 'Validation OS',
    path: '/services/debt-legal',
    accent: 'fuchsia',
  },
  {
    id: 'guide',
    label: 'Start here',
    hint: 'Pick your path',
    path: '/start-here',
    accent: 'amber',
  },
];

export type PublicNavLink = { id: string; label: string; path: string; hint?: string; badge?: string };

export type PublicNavSection = {
  id: string;
  title: string;
  links: PublicNavLink[];
};

/** Core header links — kept minimal; depth lives in dropdowns. */
export const PUBLIC_CORE_NAV: { id: string; label: string; path: string; match: (path: string) => boolean }[] = [
  { id: 'home', label: 'Home', path: '/', match: (p) => p === '/' },
  { id: 'services', label: 'Services', path: '/services', match: (p) => p.startsWith('/services') },
  { id: 'pricing', label: 'Pricing', path: '/pricing', match: (p) => p.startsWith('/pricing') },
];

export const PUBLIC_RESOURCES_SECTIONS: PublicNavSection[] = [
  {
    id: 'free',
    title: 'Free guides',
    links: [
      { id: 'free-guide', label: 'Dispute letter guide', path: '/free-guide', hint: 'PDF + portal preview', badge: 'Popular' },
      { id: 'free-debt', label: 'Debt & summons guide', path: '/free-debt-guide' },
      { id: 'free-business', label: 'Business credit guide', path: '/free-business-guide' },
      { id: 'free-tradeline', label: 'Tradeline guide', path: '/free-tradeline-guide' },
      { id: 'free-score', label: 'Score roadmap', path: '/free-score-roadmap' },
      { id: 'free-agency', label: 'Agency guide', path: '/free-agency-guide' },
    ],
  },
  {
    id: 'library',
    title: 'Library & learn',
    links: [
      { id: 'resources-hub', label: 'Resource hub', path: '/resources' },
      { id: 'bookstore', label: 'Bookstore & eGuides', path: '/bookstore' },
      { id: 'start-here', label: 'Start here', path: '/start-here' },
      { id: 'events', label: 'Events', path: '/events' },
      { id: 'testimonials', label: 'Testimonials', path: '/testimonials' },
      { id: 'tradelines', label: 'Tradelines', path: '/tradelines' },
    ],
  },
];

export const PUBLIC_CONTACT_LINKS: PublicNavLink[] = [
  { id: 'contact', label: 'Contact us', path: '/contact', hint: 'Message the team' },
  { id: 'help', label: 'Help center', path: '/help-center', hint: 'Plain-English playbooks' },
  { id: 'session', label: 'Book a strategy call', path: '/enlightenment-session' },
  { id: 'about', label: 'About Finely', path: '/about' },
  { id: 'faq', label: 'FAQ', path: '/faq' },
];

/** Head of Society — dedicated public entrance. */
export const PUBLIC_HOS_NAV = {
  id: 'hos',
  label: 'Head of Society',
  shortLabel: 'HOS',
  path: '/head-of-society',
  loginPath: '/onboarding?lane=heta_society&next=/portal/hos',
  match: (p: string) => p.startsWith('/head-of-society') || p.startsWith('/portal/hos') || p === '/hos',
};

/** Career paths — earn · serve · grow. */
export { PUBLIC_CAREER_PATHS, matchCareersPath } from './publicCareers';

const FREE_GUIDE_PREFIXES = [
  '/free-guide',
  '/free-debt-guide',
  '/free-business-guide',
  '/free-tradeline-guide',
  '/free-score-roadmap',
  '/free-agency-guide',
];

export function matchResourcesPath(p: string): boolean {
  if (FREE_GUIDE_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))) return true;
  return (
    p.startsWith('/resources') ||
    p.startsWith('/bookstore') ||
    p.startsWith('/events') ||
    p.startsWith('/testimonials') ||
    p.startsWith('/tradelines') ||
    p === '/start-here'
  );
}

export function matchContactPath(p: string): boolean {
  return (
    p.startsWith('/contact') ||
    p.startsWith('/help-center') ||
    p.startsWith('/enlightenment-session') ||
    p.startsWith('/about') ||
    p.startsWith('/faq')
  );
}

/** @deprecated Use PUBLIC_CORE_NAV + dropdown sections. */
export const PUBLIC_PRIMARY_NAV = PUBLIC_CORE_NAV;

/** @deprecated Explore merged into Resources + Contact menus. */
export const PUBLIC_EXPLORE_LINKS: PublicNavLink[] = [];
export const PUBLIC_MOBILE_EXPLORE = PUBLIC_EXPLORE_LINKS;
