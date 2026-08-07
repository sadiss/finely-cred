import type { PublicNavAccent } from './siteWayfinderLanes';

export type ResourcesHubCard = {
  id: string;
  title: string;
  desc: string;
  path: string;
  accent: PublicNavAccent;
  badge?: string;
};

/** Curated overview tiles for `/resources` — each opens a dedicated page. */
export const PUBLIC_RESOURCES_HUB_CARDS: ResourcesHubCard[] = [
  {
    id: 'guides',
    title: 'Free guides',
    desc: 'All partner lead magnets and PDF field guides in one index.',
    path: '/resources/guides',
    accent: 'emerald',
    badge: 'Start here',
  },
  {
    id: 'onesheets',
    title: 'Partner one-sheets',
    desc: 'Offer packs, tier sheets, and talking-point PDFs.',
    path: '/resources/one-sheets',
    accent: 'violet',
  },
  {
    id: 'bookstore',
    title: 'Partner bookstore',
    desc: 'Premium ebooks, kits, and listen-mode deep dives.',
    path: '/bookstore',
    accent: 'amber',
  },
  {
    id: 'monitoring',
    title: 'Credit monitoring',
    desc: 'Bureau pull partners with HTML-friendly export tips.',
    path: '/resources/credit-monitoring',
    accent: 'sky',
  },
  {
    id: 'videos',
    title: 'Video library',
    desc: 'Watch-how tours and short lessons for every major screen.',
    path: '/resources/videos',
    accent: 'fuchsia',
  },
  {
    id: 'references',
    title: 'Quick references',
    desc: 'Workflow, vault, score-model, and funding cheat sheets.',
    path: '/resources/references',
    accent: 'violet',
  },
  {
    id: 'stories',
    title: 'Partner stories',
    desc: 'Wins, walkthroughs, and real restore journeys.',
    path: '/testimonials',
    accent: 'emerald',
  },
  {
    id: 'events',
    title: 'Events',
    desc: 'Live workshops, webinars, and community sessions.',
    path: '/events',
    accent: 'sky',
  },
];

/** Featured funnel guides shown at the top of `/resources/guides`. */
export const PUBLIC_FEATURED_FREE_GUIDES: {
  id: string;
  title: string;
  desc: string;
  path: string;
  accent: PublicNavAccent;
  badge?: string;
}[] = [
  {
    id: 'dispute',
    title: 'Dispute letter guide',
    desc: '5-step playbook with instant PDF and portal preview.',
    path: '/free-guide',
    accent: 'emerald',
    badge: 'Popular',
  },
  {
    id: 'debt',
    title: 'Debt & summons guide',
    desc: 'Validation-first response when collectors or courts show up.',
    path: '/free-debt-guide',
    accent: 'fuchsia',
  },
  {
    id: 'business',
    title: 'Business credit guide',
    desc: 'Entity, vendors, and fundability sequencing.',
    path: '/free-business-guide',
    accent: 'violet',
  },
  {
    id: 'tradeline',
    title: 'Tradeline guide',
    desc: 'Authorized-user strategy without the hype.',
    path: '/free-tradeline-guide',
    accent: 'emerald',
  },
  {
    id: 'score',
    title: 'Score roadmap',
    desc: 'Utilization, inquiries, and timing for cleaner optics.',
    path: '/free-score-roadmap',
    accent: 'sky',
  },
  {
    id: 'agency',
    title: 'Agency guide',
    desc: 'Agency and specialist-path overview for operators.',
    path: '/free-agency-guide',
    accent: 'amber',
  },
  {
    id: 'cs',
    title: 'Credit Specialist guide',
    desc: 'Earn · serve · grow — free e-guide and 2-sheet playbook.',
    path: '/credit-specialist-guide',
    accent: 'amber',
  },
  {
    id: 'real_estate',
    title: 'Real Estate Operator Guide',
    desc: 'You refer · Finely runs credit — scripts, Fannie summaries, seven levers.',
    path: '/real-estate-guide',
    accent: 'amber',
    badge: 'New',
  },
];

/**
 * Dedicated sheet pages — each PDF has its own thorough public page rather than living inside a
 * shared hub. Titles carry the true page count; never label a multi-page PDF a "one-sheet".
 */
export const PUBLIC_DEDICATED_SHEET_PAGES: {
  id: string;
  title: string;
  sheetLabel: string;
  desc: string;
  path: string;
  accent: PublicNavAccent;
}[] = [
  {
    id: 'restore',
    title: 'Personal Credit Restore',
    sheetLabel: '3-sheet field kit',
    desc: 'Rights you invoke, round-one sequence with reason language, escalation ladder, and a 90-day hold plan.',
    path: '/resources/personal-credit-restore-sheet',
    accent: 'fuchsia',
  },
  {
    id: 'build',
    title: 'Personal Credit Build',
    sheetLabel: '2-sheet blueprint',
    desc: 'Five-rung instrument ladder, scoring weights, worked utilization math, and a 12-month calendar.',
    path: '/resources/personal-credit-build-sheet',
    accent: 'sky',
  },
  {
    id: 'au_teen',
    title: 'Authorized User & Teen Credit',
    sheetLabel: '2-sheet parent kit',
    desc: 'Issuer minimum ages, minor-AU reporting reality, parent checklist, and the 18th-birthday handoff.',
    path: '/resources/au-teen-credit-sheet',
    accent: 'amber',
  },
];

export const PUBLIC_ONE_SHEET_PACKS: {
  id: string;
  title: string;
  desc: string;
  path: string;
  accent: PublicNavAccent;
  badge?: string;
}[] = [
  {
    id: 'bc',
    title: 'Business credit one-sheets',
    desc: '3-sheet Process Brief, fundability roadmap, tier ladder, and single-page destination sheets.',
    path: '/resources/business-credit-one-sheets',
    accent: 'violet',
    badge: 'Partner pack',
  },
  {
    id: 'cs',
    title: 'Credit Specialist 2-sheet playbook',
    desc: 'Two-page path PDF from the free Credit Specialist guide landing — the offer, then the operating sheet.',
    path: '/credit-specialist-guide',
    accent: 'amber',
  },
  {
    id: 'restore',
    title: 'Personal Credit Restore 3-sheet',
    desc: 'Pointer to its own dedicated page — rights, round-one sequence, escalation ladder.',
    path: '/resources/personal-credit-restore-sheet',
    accent: 'fuchsia',
  },
  {
    id: 'build',
    title: 'Personal Credit Build 2-sheet',
    desc: 'Pointer to its own dedicated page — instrument ladder and the optics engine.',
    path: '/resources/personal-credit-build-sheet',
    accent: 'sky',
  },
  {
    id: 'au_teen',
    title: 'AU & Teen Credit 2-sheet',
    desc: 'Pointer to its own dedicated page — issuer ages, reporting reality, parent checklist.',
    path: '/resources/au-teen-credit-sheet',
    accent: 'emerald',
  },
];
