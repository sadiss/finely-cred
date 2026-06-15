/** Public route SEO catalog for admin health panel (Phase 35). */

export type PublicSeoRoute = {
  path: string;
  title: string;
  description: string;
  hasSchema?: boolean;
  /** When false, omitted from sitemap.xml (still tracked in admin SEO health). */
  sitemap?: boolean;
};

export const PUBLIC_SEO_CATALOG: PublicSeoRoute[] = [
  {
    path: '/',
    title: 'Finely Cred homepage',
    description: 'Credit restore, business credit, debt strategy, tradelines, and funding readiness operating system.',
    hasSchema: true,
  },
  {
    path: '/enlightenment-session',
    title: 'Book a strategy call',
    description: 'Free consultation for personal credit, business credit, debt, tradelines, and funding paths.',
    hasSchema: true,
  },
  {
    path: '/pricing',
    title: 'Pricing & packages',
    description: 'Personal restore, business credit, debt & legal, tradelines, and partnership tiers.',
    hasSchema: true,
  },
  {
    path: '/resources',
    title: 'Free credit resources',
    description: 'Field guides, dispute templates, and educational downloads.',
    hasSchema: true,
  },
  {
    path: '/bookstore',
    title: 'Finely Cred bookstore',
    description: 'Bundles, courses, and credit mastery books.',
    hasSchema: true,
  },
  {
    path: '/free-guide',
    title: 'Free dispute letter guide',
    description: 'Download the credit dispute letter guide and start your restore journey.',
    hasSchema: true,
  },
  {
    path: '/free-debt-guide',
    title: 'Free debt validation guide',
    description: 'Collections validation playbook — FDCPA workflows, summons checklist, and portal preview.',
    hasSchema: true,
  },
  {
    path: '/free-business-guide',
    title: 'Free business credit guide',
    description: 'Entity hygiene, vendor credit sequencing, and D-U-N-S checklist.',
    hasSchema: true,
  },
  {
    path: '/free-tradeline-guide',
    title: 'Free tradeline insider guide',
    description: 'Authorized user tradelines explained — timing, risk, and restore plan fit.',
    hasSchema: true,
  },
  {
    path: '/free-score-roadmap',
    title: 'Free score roadmap',
    description: '5-step score recovery sequence — utilization, mix, and timing — plus portal preview.',
    hasSchema: true,
  },
  {
    path: '/free-agency-guide',
    title: 'Free agency white-label guide',
    description: 'Scale a credit services agency with Finely Cred partner OS and compliance workflows.',
    hasSchema: true,
  },
  {
    path: '/credit-specialist-apply',
    title: 'Credit specialist program',
    description: 'Apply to the Finely Cred specialist network — tools, training, and activation support.',
    hasSchema: true,
  },
  {
    path: '/affiliate-toolkit',
    title: 'Free affiliate toolkit',
    description: 'Referral links, QR kits, and compliant promo templates for Finely Cred partners.',
    hasSchema: true,
  },
  {
    path: '/affiliate',
    title: 'Affiliate program',
    description: 'Earn by referring partners to Finely Cred restore and funding programs.',
    hasSchema: true,
  },
  {
    path: '/credit-specialists',
    title: 'Credit specialists',
    description: 'Join the Finely Cred specialist network and grow your agency.',
    hasSchema: true,
  },
  {
    path: '/personal-credit',
    title: 'Personal credit restore',
    description: 'DIY and done-for-you personal credit restore with dispute automation.',
    hasSchema: true,
  },
  {
    path: '/tradelines',
    title: 'Tradeline marketplace',
    description: 'Authorized user tradelines and funding readiness tools.',
    hasSchema: true,
  },
  {
    path: '/au/marketplace',
    title: 'AU tradeline marketplace',
    description: 'Browse authorized user tradelines and submit buyer intake.',
    hasSchema: true,
  },
  {
    path: '/au/request',
    title: 'AU tradeline request',
    description: 'Structured buyer intake for authorized user tradeline placement.',
    hasSchema: true,
  },
  {
    path: '/au/orders',
    title: 'AU order tracking',
    description: 'Track authorized user tradeline order status and fulfillment.',
    hasSchema: true,
    sitemap: false,
  },
  {
    path: '/agency/signup',
    title: 'Agency white-label signup',
    description: 'Launch a credit services agency on Finely Cred partner OS.',
    hasSchema: true,
  },
  {
    path: '/about',
    title: 'About Finely Cred',
    description: 'Credit systems architecture since 2014 — DIY and done-for-you restore, funding, and partner OS.',
    hasSchema: true,
  },
  {
    path: '/faq',
    title: 'FAQ',
    description: 'Answers about credit restore, disputes, tradelines, billing, and the Finely Cred platform.',
    hasSchema: true,
  },
  {
    path: '/contact',
    title: 'Contact Finely Cred',
    description: 'Reach support, sales, or partnerships — we respond within one business day.',
    hasSchema: true,
  },
  {
    path: '/terms',
    title: 'Terms of service',
    description: 'Finely Cred terms of service and platform usage agreement.',
    hasSchema: true,
  },
  {
    path: '/privacy',
    title: 'Privacy policy',
    description: 'How Finely Cred collects, uses, and protects your personal information.',
    hasSchema: true,
  },
  {
    path: '/disclaimer',
    title: 'Disclaimer',
    description: 'Educational services disclaimer — not legal advice or credit repair guarantees.',
    hasSchema: true,
  },
  {
    path: '/testimonials',
    title: 'Partner success stories',
    description: 'Real stories from Finely Cred partners — credit restore, funding readiness, and results-driven workflows.',
    hasSchema: true,
  },
  {
    path: '/events',
    title: 'Events & workshops',
    description: 'Live workshops and community sessions for credit and funding education.',
    hasSchema: true,
  },
  {
    path: '/claim',
    title: 'Claim your partner profile',
    description: 'Connect your imported Finely Cred profile to your account and resume your journey.',
    hasSchema: true,
  },
  {
    path: '/unsubscribe',
    title: 'Unsubscribe from marketing',
    description: 'Opt out of Finely Cred promotional email and SMS.',
    hasSchema: true,
    sitemap: false,
  },
];

/** Paths indexed for sitemap generation (Phase 35). */
export const PUBLIC_SEO_PATHS = PUBLIC_SEO_CATALOG.filter((r) => r.sitemap !== false).map((r) => r.path);
