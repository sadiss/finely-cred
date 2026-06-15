export type SiteWayfinderLane = {
  id: string;
  label: string;
  hint: string;
  path: string;
  accent: 'emerald' | 'violet' | 'fuchsia' | 'amber' | 'sky';
};

/** Four high-intent lanes — primary public wayfinding (keep nav simple). */
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

export const PUBLIC_PRIMARY_NAV: { id: string; label: string; path: string; match: (path: string) => boolean }[] = [
  { id: 'home', label: 'Home', path: '/', match: (p) => p === '/' },
  { id: 'services', label: 'Services', path: '/services', match: (p) => p.startsWith('/services') },
  { id: 'pricing', label: 'Pricing', path: '/pricing', match: (p) => p.startsWith('/pricing') },
  { id: 'resources', label: 'Resources', path: '/resources', match: (p) => p.startsWith('/resources') || p.startsWith('/bookstore') || p.startsWith('/events') },
  { id: 'contact', label: 'Contact', path: '/contact', match: (p) => p.startsWith('/contact') || p.startsWith('/faq') },
];

export const PUBLIC_MOBILE_EXPLORE: { id: string; label: string; path: string }[] = [
  { id: 'start-here', label: 'Start here', path: '/start-here' },
  { id: 'help', label: 'Help center', path: '/help-center' },
  { id: 'tradelines', label: 'Tradelines', path: '/tradelines' },
  { id: 'testimonials', label: 'Testimonials', path: '/testimonials' },
  { id: 'bookstore', label: 'Bookstore', path: '/bookstore' },
  { id: 'events', label: 'Events', path: '/events' },
  { id: 'affiliate', label: 'Affiliate', path: '/affiliate' },
  { id: 'about', label: 'About', path: '/about' },
  { id: 'specialists', label: 'Credit specialists', path: '/credit-specialists' },
  { id: 'session', label: 'Book a strategy call', path: '/enlightenment-session' },
];
