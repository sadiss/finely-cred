/**
 * User-facing labels and paths for the credit specialist (partner) program.
 * Internal role IDs stay `agent` for data compatibility.
 */
export const CS = {
  singular: 'Credit Specialist',
  plural: 'Credit Specialists',
  programName: 'Credit Specialist Program',
  hubName: 'Specialist Hub',
  hubPath: '/credit-specialist/hub',
  /** Legacy alias — redirects to hubPath */
  hubPathLegacy: '/agent/hub',
  publicPath: '/credit-specialists',
  publicPathLegacy: '/agents',
  pricingTabLabel: 'Credit Specialists',
  supportThreadSubject: 'Credit Specialist Program — partnership line',
  messagesDeepLink: '/portal/messages?hub=team&topic=credit_specialist_program',
} as const;

export type CreditSpecialistOffering = {
  title: string;
  description: string;
  included: string[];
};

/** What Finely provides to credit specialists — shown on public + hub surfaces. */
export const CREDIT_SPECIALIST_OFFERINGS: CreditSpecialistOffering[] = [
  {
    title: 'Revenue-share partnership',
    description: 'No flat platform fee. Your keep grows as you graduate training and run more levers yourself.',
    included: ['Phase-by-phase split (training → certified)', 'Split calculator with lever controls', 'Transparent tier capacity limits'],
  },
  {
    title: 'Denefit in-house contracts',
    description: 'Enroll clients in Denefit financing that reports to Equifax as they pay — recurring commission over the full contract term.',
    included: ['Equifax build-as-they-pay positioning', 'Term-based Denefit commission calculator', 'Combines with service-fee revenue share'],
  },
  {
    title: 'Full operating stack',
    description: 'CRM, client portal, dispute workflows, and document vault — the same engine Finely runs on.',
    included: ['Client dashboard & case routing', 'Letters studio + dispute center', 'Documents vault & task sequencing'],
  },
  {
    title: 'Comms & growth tools',
    description: 'Reach clients and prospects with templates, sequences, and marketing assets under your brand.',
    included: ['Portal messaging with Finely ops', 'Comms templates & lead magnets', 'Education library + free & paid ebooks'],
  },
  {
    title: 'Training & certification',
    description: 'Specialty tracks across restore, build, business credit, debt, tradelines, and funding.',
    included: ['Academy modules per specialty', 'Mentor checkpoints in apprenticeship', 'Certified partner upgrade path'],
  },
  {
    title: 'White-label workspace',
    description: 'From Finely-branded training to co-branded and full white-label with custom domain.',
    included: ['Logo, colors, and portal theming', 'Custom domain + Comms from-address', 'Team seats & client routing rules'],
  },
  {
    title: 'Lead growth & prospecting',
    description: 'Connect your split percentages, Denefit economics, and public profile into one pitch for lead agents.',
    included: ['Growth tab with pricing story cards', 'Letters studio + reasons library for demos', 'CRM intake + partnership line'],
  },
  {
    title: 'Dedicated partnership line',
    description: 'One ongoing thread with Finely — onboarding, mentor check-ins, and program questions.',
    included: ['Program inbox in Communication Hub', 'Admin replies via Support Inbox', 'Template updates from Comms Studio post into Hub threads'],
  },
];

export const CREDIT_SPECIALIST_COMMS_CHANNELS = [
  {
    title: 'Partnership line (portal)',
    description: 'Your dedicated thread with Finely ops — onboarding, mentor checkpoints, tier upgrades, and program questions.',
    action: 'Open messages',
    path: CS.messagesDeepLink,
  },
  {
    title: 'Client threads (Communication Hub)',
    description: 'Live support with your clients — separate from your Finely partnership line. Admin template sends appear here too.',
    action: 'Client threads',
    path: '/portal/messages?hub=team',
  },
  {
    title: 'Calendar & video sessions',
    description: 'Book strategy calls and join confirmed video rooms with Finely or clients.',
    action: 'Open calendar',
    path: '/portal/calendar',
  },
  {
    title: 'Notifications & tasks',
    description: 'Portal alerts when Finely replies, plus daily operating checklists in your Specialist Hub.',
    action: 'View hub',
    path: CS.hubPath,
  },
] as const;
