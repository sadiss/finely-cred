export type SiteWayfinderLane = {
  id: string;
  label: string;
  hint: string;
  path: string;
  accent: 'emerald' | 'violet' | 'fuchsia' | 'amber' | 'sky';
};

/** Four high-intent lanes — sticky wayfinder / path chooser. */
export const SITE_WAYFINDER_LANES: SiteWayfinderLane[] = [
  {
    id: 'personal',
    label: 'Personal credit',
    hint: 'Restore & build',
    path: '/pricing/personal-credit-restore',
    accent: 'emerald',
  },
  {
    id: 'business',
    label: 'Business credit',
    hint: 'Entity & funding',
    path: '/pricing/business-credit',
    accent: 'sky',
  },
  {
    id: 'debt',
    label: 'Debt & legal',
    hint: 'Validation and court help',
    path: '/pricing/debt-legal',
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

export type PublicNavAccent = 'emerald' | 'violet' | 'fuchsia' | 'rose' | 'amber' | 'sky';

export type PublicNavLink = {
  id: string;
  label: string;
  path: string;
  hint?: string;
  badge?: string;
  accent?: PublicNavAccent;
};

export type PublicNavSection = {
  id: string;
  title: string;
  links: PublicNavLink[];
};

/**
 * Core header links — Home + Free dispute guide as direct tabs.
 * Solutions / Resources / Careers / Contact are dropdown menus.
 * (Hero CTAs are solution paths — do not duplicate another Free guide button in the header actions.)
 */
export const PUBLIC_CORE_NAV: { id: string; label: string; path: string; match: (path: string) => boolean }[] = [
  { id: 'home', label: 'Home', path: '/', match: (p) => p === '/' },
  {
    id: 'free-guide',
    label: 'Dispute guide',
    path: '/free-guide',
    match: (p) => p === '/free-guide' || p.startsWith('/free-guide/'),
  },
  {
    id: 'enlightenment-session',
    label: 'Strategy call',
    path: '/enlightenment-session',
    match: (p) => p.startsWith('/enlightenment-session') || p.startsWith('/consultation'),
  },
];

/** Solutions dropdown — pricing lanes + specialist path. */
export const PUBLIC_SOLUTIONS_SECTIONS: PublicNavSection[] = [
  {
    id: 'core',
    title: 'Core paths',
    links: [
      {
        id: 'personal-restore',
        label: 'Personal restore',
        path: '/pricing/personal-credit-restore',
        hint: 'Disputes · deletions · restore sequencing',
        badge: 'Popular',
        accent: 'emerald',
      },
      {
        id: 'personal-building',
        label: 'Personal building',
        path: '/pricing/personal-credit-building',
        hint: 'Thin-file builds · utilization · maintenance',
        accent: 'sky',
      },
      {
        id: 'business',
        label: 'Business credit',
        path: '/pricing/business-credit',
        hint: 'Entity · vendors · fundability',
        accent: 'violet',
      },
      {
        id: 'debt',
        label: 'Debt & legal',
        path: '/pricing/debt-legal',
        hint: 'Collections · validation · summons',
        accent: 'fuchsia',
      },
    ],
  },
  {
    id: 'more',
    title: 'More solutions',
    links: [
      {
        id: 'wealth',
        label: 'Wealth builder',
        path: '/pricing/wealth-builder',
        hint: 'Long-game credit & capital',
        accent: 'amber',
      },
      {
        id: 'tradelines',
        label: 'Tradelines',
        path: '/tradelines',
        hint: 'AU inventory · check availability',
        accent: 'emerald',
      },
      {
        id: 'privacy',
        label: 'Privacy & ID',
        path: '/pricing/privacy-id',
        hint: 'Freeze · lock · identity hygiene',
        accent: 'sky',
      },
      {
        id: 'bundles',
        label: 'Bundles',
        path: '/pricing/bundles',
        hint: 'Combined programs',
        accent: 'violet',
      },
      {
        id: 'specialist',
        label: 'Credit Specialist',
        path: '/credit-specialist',
        hint: 'Earn · serve · grow',
        accent: 'amber',
      },
      {
        id: 'all',
        label: 'All solutions',
        path: '/pricing',
        hint: 'Full DIY + DFY catalog',
        accent: 'emerald',
      },
    ],
  },
];

/**
 * Resources dropdown — curated groups (not a mega-menu).
 * Free guide stays a top-level tab; each cluster links to a dedicated page.
 */
export const PUBLIC_RESOURCES_SECTIONS: PublicNavSection[] = [
  {
    id: 'guides',
    title: 'Guides',
    links: [
      {
        id: 'guides-index',
        label: 'All free guides',
        path: '/resources/guides',
        hint: 'Full index · funnels + PDFs',
        badge: 'Library',
        accent: 'emerald',
      },
      {
        id: 'free-guide',
        label: 'Dispute letter guide',
        path: '/free-guide',
        hint: 'Live portal + Letter Studio',
        badge: 'Popular',
        accent: 'emerald',
      },
      { id: 'free-debt', label: 'Debt & summons guide', path: '/free-debt-guide', hint: 'Validation and court help', accent: 'rose' },
      { id: 'case-desk', label: 'Case Desk Operator Guide', path: '/case-desk-guide', accent: 'sky' },
      { id: 'free-business', label: 'Business credit guide', path: '/free-business-guide', accent: 'violet' },
      { id: 'free-tradeline', label: 'Tradeline guide', path: '/free-tradeline-guide', accent: 'emerald' },
      { id: 'free-score', label: 'Score roadmap', path: '/free-score-roadmap', accent: 'sky' },
      { id: 'free-agency', label: 'Agency guide', path: '/free-agency-guide', accent: 'rose' },
    ],
  },
  {
    id: 'onesheets',
    title: 'Sheet kits',
    links: [
      {
        id: 'onesheets-hub',
        label: 'One-sheets hub',
        path: '/resources/one-sheets',
        hint: 'Legacy partner packs',
        accent: 'violet',
      },
      {
        id: 'bc-onesheets',
        label: 'Business credit one-sheets',
        path: '/resources/business-credit-one-sheets',
        hint: '3-sheet Process Brief · tiers · talking points',
        accent: 'violet',
      },
      {
        id: 'restore-sheet',
        label: 'Personal Credit Restore 3-sheet',
        path: '/resources/personal-credit-restore-sheet',
        hint: 'Rights · round one · escalation ladder',
        accent: 'fuchsia',
      },
      {
        id: 'build-sheet',
        label: 'Personal Credit Build 2-sheet',
        path: '/resources/personal-credit-build-sheet',
        hint: 'Instrument ladder · utilization math',
        accent: 'sky',
      },
      {
        id: 'au-teen-sheet',
        label: 'AU & Teen Credit 2-sheet',
        path: '/resources/au-teen-credit-sheet',
        hint: 'Issuer ages · reporting reality · handoff',
        accent: 'amber',
      },
    ],
  },
  {
    id: 'bookstore',
    title: 'Bookstore',
    links: [
      {
        id: 'bookstore',
        label: 'Partner bookstore',
        path: '/bookstore',
        hint: 'Ebooks · kits · deep dives',
        accent: 'amber',
      },
    ],
  },
  {
    id: 'tools',
    title: 'Tools',
    links: [
      {
        id: 'monitoring',
        label: 'Credit monitoring',
        path: '/resources/credit-monitoring',
        hint: 'Bureau pull partners',
        accent: 'sky',
      },
      {
        id: 'videos',
        label: 'Video library',
        path: '/resources/videos',
        hint: 'Watch-how tours',
        accent: 'fuchsia',
      },
      {
        id: 'references',
        label: 'Quick references',
        path: '/resources/references',
        hint: 'Cheat sheets',
        accent: 'violet',
      },
    ],
  },
  {
    id: 'community',
    title: 'Community',
    links: [
      { id: 'events', label: 'Events', path: '/events', hint: 'Live sessions', accent: 'sky' },
      { id: 'results', label: 'Case studies & results', path: '/results', hint: 'Real numbers by category', badge: 'Proof', accent: 'emerald' },
      { id: 'testimonials', label: 'Partner stories', path: '/testimonials', hint: 'Wins & walkthroughs', accent: 'emerald' },
      { id: 'start-here', label: 'Start here', path: '/start-here', hint: 'Pick your lane', accent: 'amber' },
      { id: 'resources-hub', label: 'Resource hub', path: '/resources', hint: 'Curated overview', accent: 'violet' },
    ],
  },
];

export const PUBLIC_CONTACT_LINKS: PublicNavLink[] = [
  { id: 'contact', label: 'Contact us', path: '/contact', hint: 'Message the team', accent: 'sky' },
  { id: 'help', label: 'Help center', path: '/help-center', hint: 'Plain-English playbooks', accent: 'emerald' },
  { id: 'session', label: 'Strategy call', path: '/enlightenment-session', hint: 'Book a strategy call with a specialist', accent: 'amber' },
  { id: 'about', label: 'About Finely', path: '/about', accent: 'violet' },
  { id: 'faq', label: 'FAQ', path: '/faq', accent: 'sky' },
];

/** Head of Society — footer / dedicated entrance (not top nav). */
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

const OTHER_FREE_GUIDE_PREFIXES = [
  '/free-debt-guide',
  '/case-desk-guide',
  '/free-business-guide',
  '/free-tradeline-guide',
  '/free-score-roadmap',
  '/free-agency-guide',
];

export function matchSolutionsPath(p: string): boolean {
  return (
    p.startsWith('/pricing') ||
    p.startsWith('/services') ||
    p.startsWith('/tradelines') ||
    p.startsWith('/personal-credit') ||
    p.startsWith('/credit-specialist') ||
    p === '/fix-my-credit' ||
    p === '/build-my-credit' ||
    p === '/debt-summons-help' ||
    p === '/business-credit' ||
    p === '/business-credit-solutions'
  );
}

export function matchResourcesPath(p: string): boolean {
  // Primary Free guide is a core nav item — avoid double-highlighting Resources.
  if (p === '/free-guide' || p.startsWith('/free-guide/')) return false;
  // Buyer tradelines marketplace lives under Solutions, not Resources.
  if (p.startsWith('/tradelines')) return false;
  if (OTHER_FREE_GUIDE_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))) return true;
  return (
    p.startsWith('/resources') ||
    p.startsWith('/bookstore') ||
    p.startsWith('/events') ||
    p.startsWith('/testimonials') ||
    p.startsWith('/results') ||
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
