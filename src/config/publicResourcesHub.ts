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
    id: 'haitian',
    title: 'Haitian community',
    desc: 'Credit help for Haitian Americans — English letters with a Kreyòl meaning beside them.',
    path: '/haitian',
    accent: 'emerald',
    badge: 'Kreyòl',
  },
  {
    id: 'guides',
    title: 'Free guides',
    desc: 'Free field guides for restore, debt paper, business credit, and the paths that earn with Finely Cred.',
    path: '/resources/guides',
    accent: 'emerald',
    badge: 'Start here',
  },
  {
    id: 'onesheets',
    title: 'Partner one-sheets',
    desc: 'Short offer sheets and talking points you can send before a session.',
    path: '/resources/one-sheets',
    accent: 'violet',
  },
  {
    id: 'bookstore',
    title: 'Partner bookstore',
    desc: 'Longer ebooks and kits for partners who want to read the method in full.',
    path: '/bookstore',
    accent: 'fuchsia',
  },
  {
    id: 'monitoring',
    title: 'Credit monitoring',
    desc: 'Bureau-pull partners and how to export a report the portal can actually read.',
    path: '/resources/credit-monitoring',
    accent: 'sky',
  },
  {
    id: 'videos',
    title: 'Video library',
    desc: 'Short walkthroughs that show how each public and portal screen works.',
    path: '/resources/videos',
    accent: 'fuchsia',
  },
  {
    id: 'references',
    title: 'Quick references',
    desc: 'Statutes, templates, and score-model notes for the work you are already doing.',
    path: '/resources/references',
    accent: 'violet',
  },
  {
    id: 'stories',
    title: 'Partner stories',
    desc: 'Partner wins and restore journeys — every file is different, and results vary.',
    path: '/testimonials',
    accent: 'emerald',
  },
  {
    id: 'events',
    title: 'Events',
    desc: 'Workshops and live sessions with the Finely Cred team.',
    path: '/events',
    accent: 'sky',
  },
  {
    id: 'rules',
    title: 'Rules this week',
    desc: 'This week’s Federal Register notices on credit reporting and collections.',
    path: '/resources/rules-this-week',
    accent: 'emerald',
  },
  {
    id: 'complaints',
    title: 'Complaint board',
    desc: 'Public CFPB complaints about bureaus and collectors — a filing is not a verdict.',
    path: '/resources/complaints',
    accent: 'violet',
  },
  {
    id: 'law',
    title: 'What the statute says',
    desc: 'Live eCFR excerpts so you can read the statute in the room.',
    path: '/resources/law',
    accent: 'sky',
  },
  {
    id: 'opinions',
    title: 'Debt opinions',
    desc: 'How summons and collection headlines actually work, in plain English.',
    path: '/resources/debt-opinions',
    accent: 'rose',
  },
  {
    id: 'funding',
    title: 'State funding pressure',
    desc: 'HMDA and SBA pressure by state — context for a conversation, not a lender list.',
    path: '/resources/funding/tx',
    accent: 'emerald',
  },
  {
    id: 'compare',
    title: 'DIY vs done-for-you',
    desc: 'How self-guided work, a traditional shop, and Finely Cred differ — without smearing anyone.',
    path: '/resources/diy-vs-traditional-vs-finely',
    accent: 'violet',
  },
  {
    id: 'study',
    title: 'Complaint study',
    desc: 'A public CFPB sample, counted honestly. A complaint is not a court finding.',
    path: '/resources/complaint-study',
    accent: 'sky',
  },
  {
    id: 'pins',
    title: 'Pin wall',
    desc: 'Ready-to-copy Pinterest text for the field kits and guides.',
    path: '/resources/pins',
    accent: 'emerald',
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
    desc: 'A five-step dispute playbook that opens Letter Studio, a task board, and a preview of the partner portal.',
    path: '/free-guide',
    accent: 'emerald',
    badge: 'Popular',
  },
  {
    id: 'restore-wealth',
    title: 'Restore for Wealth',
    desc: 'Credit restore for funding and opportunity. Debt is not erased. Separate from the DIY letter guide.',
    path: '/free-restore-wealth',
    accent: 'amber',
    badge: 'Campaign',
  },
  {
    id: 'debt',
    title: 'Debt & summons guide',
    desc: 'Validation and court education: FDCPA letters, summons triage, and a debt task board you can actually use.',
    path: '/free-debt-guide',
    accent: 'fuchsia',
  },
  {
    id: 'business',
    title: 'Business credit guide',
    desc: 'How to stand up an EIN profile, sequence vendors, and get ready for a commercial underwrite.',
    path: '/free-business-guide',
    accent: 'violet',
  },
  {
    id: 'tradeline',
    title: 'Tradeline guide',
    desc: 'How authorized-user tradelines work — and what they cannot promise.',
    path: '/free-tradeline-guide',
    accent: 'emerald',
  },
  {
    id: 'score',
    title: 'Score roadmap',
    desc: 'Utilization, inquiries, and timing, in the order a lender actually reads.',
    path: '/free-score-roadmap',
    accent: 'sky',
  },
  {
    id: 'agency',
    title: 'Agency guide',
    desc: 'How a branded credit shop runs on Finely Cred — seats, files, and the method underneath.',
    path: '/free-agency-guide',
    accent: 'rose',
  },
  {
    id: 'kreyol',
    title: 'Credit kits',
    desc: 'Four credit kits: what credit is, what the letter says, how to help family, and a church flyer.',
    path: '/free-kreyol-guide',
    accent: 'emerald',
    badge: 'Haitian community',
  },
  {
    id: 'cs',
    title: 'Credit Specialist guide',
    desc: 'A free e-guide and two-sheet playbook for specialists who want to serve partners and grow a practice.',
    path: '/credit-specialist-guide',
    accent: 'violet',
  },
  {
    id: 'real_estate',
    title: 'Real Estate Operator Guide',
    desc: 'You refer the buyer or seller. Finely specialists run the credit work. Scripts and readiness levers, without a promised closing.',
    path: '/real-estate-guide',
    accent: 'sky',
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
    desc: 'Five instruments, worked utilization math, and a twelve-month calendar you can follow without guessing.',
    path: '/resources/personal-credit-build-sheet',
    accent: 'sky',
  },
  {
    id: 'au_teen',
    title: 'Authorized User & Teen Credit',
    sheetLabel: '2-sheet parent kit',
    desc: 'Issuer minimum ages, minor-AU reporting reality, parent checklist, and the 18th-birthday handoff.',
    path: '/resources/au-teen-credit-sheet',
    accent: 'rose',
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
    desc: 'A three-sheet process brief, fundability roadmap, tier ladder, and single-page destination sheets.',
    path: '/resources/business-credit-one-sheets',
    accent: 'violet',
    badge: 'Partner pack',
  },
  {
    id: 'cs',
    title: 'Credit Specialist 2-sheet playbook',
    desc: 'A two-page path from the free Credit Specialist guide — the offer, then the weekly operating sheet.',
    path: '/credit-specialist-guide',
    accent: 'violet',
  },
  {
    id: 'restore',
    title: 'Personal Credit Restore 3-sheet',
    desc: 'Rights you invoke, the first-round sequence, and the escalation ladder.',
    path: '/resources/personal-credit-restore-sheet',
    accent: 'fuchsia',
  },
  {
    id: 'build',
    title: 'Personal Credit Build 2-sheet',
    desc: 'The instrument ladder and the utilization math that makes a thin file readable.',
    path: '/resources/personal-credit-build-sheet',
    accent: 'sky',
  },
  {
    id: 'au_teen',
    title: 'AU & Teen Credit 2-sheet',
    desc: 'Issuer ages, what actually reports, and the parent checklist before you add a teen.',
    path: '/resources/au-teen-credit-sheet',
    accent: 'emerald',
  },
];
