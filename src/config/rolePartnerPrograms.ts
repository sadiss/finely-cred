/**
 * Role clarity spine for the five public role pages (RE, case help, specialist,
 * agency, AU seller).
 *
 * This file holds the *data* only — every page renders it with its own visual
 * language so no two role pages look alike. Keep partner terminology: people we
 * serve are partners, public visitors are guests.
 *
 * Cascade rule: if you change a guide route or label here, also check
 * `publicCareers.ts` (careers nav), `leadMagnetFunnels.ts` (funnel), and
 * `App.tsx` routes.
 */

export type RolePageId = 're' | 'case_help' | 'cs' | 'agency' | 'au_seller';

/** Distinct “Open [Role] Guide” CTA — visually different from Join/Apply on every page. */
export type RoleGuideCta = {
  role: RolePageId;
  /** Button label — always “Open … Guide” so the guide reads as a separate action. */
  label: string;
  /** Guide landing route (capture + download). */
  path: string;
  /** In-app reader route when the guide has one. */
  readPath?: string;
  readLabel?: string;
  /** One line describing what the guide is for. */
  blurb: string;
  /** 3 short “what’s inside” lines for the guide rail. */
  inside: [string, string, string];
};

export const ROLE_GUIDE_CTAS: Record<RolePageId, RoleGuideCta> = {
  re: {
    role: 're',
    label: 'Open Real Estate Guide',
    path: '/free-score-roadmap',
    readPath: '/free-score-roadmap/read',
    readLabel: 'Read the buyer-ready checklist',
    blurb: 'The readiness guide you hand a buyer or seller before the lender pulls credit.',
    inside: [
      'Utilization, mix, and age sequencing before a mortgage pull',
      'What AU optics may do — and why AU is never a DTI fix',
      'Paydown proof to hand the loan officer for a rapid rescore ask',
    ],
  },
  case_help: {
    role: 'case_help',
    label: 'Open Case Desk Guide',
    path: '/free-debt-guide',
    readPath: '/free-debt-guide/read',
    readLabel: 'Read in browser',
    blurb: 'The debt and summons guide our case desk works from — read it before you apply.',
    inside: [
      'Validation clocks, FDCPA notice duties, and dispute windows',
      'Answer, affidavit, and discovery packet anatomy',
      'Debt-buyer chain-of-assignment patterns we see most',
    ],
  },
  cs: {
    role: 'cs',
    label: 'Open Specialist Guide',
    path: '/credit-specialist-guide',
    readPath: '/credit-specialist-guide/read',
    readLabel: 'Read every chapter free',
    blurb: 'The full specialist playbook — read every chapter before you commit to a tier.',
    inside: [
      'How the lead minimum and free-leads window actually work',
      'Findings-based dispute method, letter studio, and evidence vault',
      'Revenue-share math and how certification changes your split',
    ],
  },
  agency: {
    role: 'agency',
    label: 'Open Agency Guide',
    path: '/free-agency-guide',
    readPath: '/free-agency-guide/read',
    readLabel: 'Read in browser',
    blurb: 'White-label launch guide — tenant setup, team lanes, and the first 30 days.',
    inside: [
      'White-label tiers: co-brand → custom domain → enterprise',
      '30-day launch checklist for tenant, branding, and seats',
      'Compliance-safe promo copy your team can actually send',
    ],
  },
  au_seller: {
    role: 'au_seller',
    label: 'Open AU Seller Guide',
    path: '/free-tradeline-guide',
    readPath: '/free-tradeline-guide/read',
    readLabel: 'Read in browser',
    blurb: 'Tradeline insider guide — what reports, what does not, and how rotation protects you.',
    inside: [
      'Primary vs authorized user — what underwriters actually read',
      'Slot limits, seasons, and rotation that protects issuer risk',
      'Buyer expectations and marketplace policy in plain English',
    ],
  },
};

/**
 * Who does the work. This is the single most misread thing on role pages —
 * every page must state it without hedging.
 */
export type RoleWorkSplit = {
  /** Short headline framing for the split. */
  headline: string;
  /** What the person in this role personally does. */
  youDo: string[];
  /** What Finely Cred and its specialists run on their behalf. */
  finelyRuns: string[];
  /** Explicit “this is not your job” list — kills the biggest misconception. */
  notYourJob: string[];
};

export const ROLE_WORK_SPLIT: Record<RolePageId, RoleWorkSplit> = {
  re: {
    headline: 'You refer and coach. Finely processes the file.',
    youDo: [
      'Spot the buyer or seller whose credit is blocking the contract',
      'Hand them the readiness guide and a tracked referral link',
      'Stay in the loop on milestones so you can time the lender package',
    ],
    finelyRuns: [
      'Report pulls, findings-based dispute letters, and bureau follow-up',
      'AU tradeline education and marketplace placement prep',
      'Paydown-proof and document packaging for the loan officer’s rescore ask',
    ],
    notYourJob: [
      'You do not draft or mail dispute letters',
      'You do not run validation clocks or handle bureau responses',
      'You do not advise on legal strategy or promise an approval',
    ],
  },
  case_help: {
    headline: 'You work assigned case files. Finely runs intake and the platform.',
    youDo: [
      'Organize court papers, dockets, and hearing timelines on assigned files',
      'Prepare letter and evidence packets for partner review',
      'Meet partners by video inside scheduled, logged sessions',
    ],
    finelyRuns: [
      'Partner intake, scope assignment, and access provisioning',
      'Letter studio, evidence vault, and audit trail infrastructure',
      'Compliance review and escalation routing (CFPB, AG, BBB)',
    ],
    notYourJob: [
      'You never get raw platform-wide access — scope is per assigned partner',
      'You do not set pricing or make offers to partners',
      'Non-attorney roles do not give legal advice or appear as counsel',
    ],
  },
  cs: {
    headline: 'You run partner files. Finely supplies the engine, method, and back office.',
    youDo: [
      'Own your partner relationships from consult through restore milestones',
      'Pull reports, pick items, and send findings-based letters from the studio',
      'Bring your lead minimum and keep your pipeline moving',
    ],
    finelyRuns: [
      'Education, certification path, and the dispute method itself',
      'Full Finely OS: CRM, letter studio, evidence vault, comms, payouts',
      'Escalation support and compliance guardrails on every letter track',
    ],
    notYourJob: [
      'You do not build software, buy tooling, or pay a platform fee',
      'You do not invent letter language — the method ships with the tracks',
      'You do not carry legal risk alone; escalation paths are built in',
    ],
  },
  agency: {
    headline: 'Your brand and your team out front. Finely is the operating system behind it.',
    youDo: [
      'Own the brand, the partner relationships, and the team you hire',
      'Route partners into your tenant and manage seat capacity',
      'Set your service mix across restore, build, funding, and AU lanes',
    ],
    finelyRuns: [
      'Tenant provisioning, white-label branding, and seat controls',
      'Dispute OS, letter studio, evidence vault, and audit trails',
      'Method updates, training path, and admin oversight tooling',
    ],
    notYourJob: [
      'You do not maintain infrastructure, uptime, or compliance tooling',
      'You do not rebuild the dispute method for each new hire',
      'You are an independent operator — not a Finely employee',
    ],
  },
  au_seller: {
    headline: 'You supply and fulfill cards. Finely brings the buyers.',
    youDo: [
      'List verified inventory with real limits, age, and open slots',
      'Add and remove authorized users on schedule',
      'Rotate cards each season to protect issuer relationships',
    ],
    finelyRuns: [
      'Buyer marketing, intake, verification, and order routing',
      'Contract lifecycle tracking and payout records per placement',
      'Marketplace policy, seller training, and dispute-free expectations',
    ],
    notYourJob: [
      'You do not run ads, DMs, or chase buyers',
      'You do not process dispute files — that is the specialist track',
      'You do not negotiate one-off deals outside marketplace terms',
    ],
  },
};

/** Named benefit / access / capability / profile rows — rendered differently per page. */
export type RoleFeatureRow = {
  label: string;
  detail: string;
};

/** Concrete benefits of holding this role. */
export const ROLE_BENEFITS: Record<RolePageId, RoleFeatureRow[]> = {
  re: [
    { label: 'Contracts stop dying at the credit pull', detail: 'A blocked buyer gets a real lane instead of “come back in a year.”' },
    { label: 'Tracked referrals', detail: 'Every handoff is attributed to you, with milestone visibility on your partners.' },
    { label: 'Payouts on engagement', detail: 'You earn when a referred partner engages a program. Payout terms are shown when you join.' },
    { label: 'Co-branded materials', detail: 'Readiness guide and share cards you can put your name and market on.' },
  ],
  case_help: [
    { label: 'Real case volume', detail: 'Assigned partner files with collection, validation, and summons work already in motion.' },
    { label: 'Scoped access, not god-mode', detail: 'You see exactly the partners assigned to you — audited, logged, revocable.' },
    { label: 'Packet tooling included', detail: 'Letter studio, evidence vault, and docket timelines instead of loose PDFs.' },
    { label: 'Video sessions on the calendar', detail: 'Structured partner meetings with notes written back to the case file.' },
  ],
  cs: [
    { label: 'Zero platform fee', detail: 'Revenue share on service fees — you do not pay to hold a seat.' },
    { label: 'Free-leads window', detail: 'A defined window to source your lead minimum using Finely capture tools.' },
    { label: 'The method, not just software', detail: 'Findings-based dispute training, escalation ladders, and letter tracks.' },
    { label: 'Certification ladder', detail: 'Your split improves as you graduate from apprentice to certified specialist.' },
  ],
  agency: [
    { label: 'Your brand out front', detail: 'Partners see your company — from co-branded portal up to custom domain.' },
    { label: 'Team leverage', detail: 'Seats, routing rules, and oversight so production is not capped by your calendar.' },
    { label: 'Company-level payouts', detail: 'Economics ride on tenant volume and team production, not one file at a time.' },
    { label: 'Operator-grade compliance', detail: 'Audit trails and admin controls built for an agency, not a hobby account.' },
  ],
  au_seller: [
    { label: 'Demand without marketing', detail: 'Finely runs the buyer marketplace, intake, and routing to your listings.' },
    { label: 'Managed seasons', detail: 'Listing cycles keep inventory fresh and rotation predictable.' },
    { label: 'Payout visibility', detail: 'Pending and completed payouts tied to each fulfilled placement.' },
    { label: 'Risk-aware training', detail: 'Rotation, removal, and issuer-risk practice so supply stays sustainable.' },
  ],
};

/** Inside access — the doors this role opens that the public never sees. */
export const ROLE_INSIDE_ACCESS: Record<RolePageId, RoleFeatureRow[]> = {
  re: [
    { label: 'Referral desk', detail: 'Milestone status on partners you sent — restore, AU prep, lender-ready.' },
    { label: 'AU optics library', detail: 'The same underwriting-aware AU and DTI material our specialists teach from.' },
    { label: 'Rescore prep vault', detail: 'Document checklists your loan officer will actually accept.' },
  ],
  case_help: [
    { label: 'Assigned case desk', detail: 'Per-partner file access with docket dates and letter history in one place.' },
    { label: 'Validation + court tracks', detail: 'Track-separated letter families so validation never mixes with court filings.' },
    { label: 'Escalation ladder', detail: 'CFPB, state AG, and BBB routes with the evidence already attached.' },
  ],
  cs: [
    { label: 'Full Finely OS', detail: 'CRM, disputes, letter studio, evidence vault, comms, and payout tracking.' },
    { label: 'Method library', detail: 'Findings-based letter tracks, escalation scripts, and objection handling.' },
    { label: 'Partner capture tools', detail: 'Funnels, guides, and invite cards to source your lead minimum.' },
  ],
  agency: [
    { label: 'Tenant console', detail: 'Branding, seats, routing rules, and capacity in your own workspace.' },
    { label: 'Team oversight', detail: 'Review letters, files, and production across every seat you own.' },
    { label: 'White-label kit', detail: 'Portal branding, support identity, and promo copy that stays compliant.' },
  ],
  au_seller: [
    { label: 'Seller workspace', detail: 'Listing editor, contract lifecycle, buyer order queue, and payouts.' },
    { label: 'Buyer marketplace', detail: 'See how your inventory is presented and which listings convert.' },
    { label: 'AU specialty training', detail: 'Season planning, slot math, and removal timing that protects your cards.' },
  ],
};

/** Unique capabilities — what this role can do that no other role can. */
export const ROLE_UNIQUE_CAPABILITIES: Record<RolePageId, RoleFeatureRow[]> = {
  re: [
    { label: 'Time the credit work to a contract', detail: 'Only you know the closing date — you set the pace the restore lane works against.' },
    { label: 'Two-sided referrals', detail: 'Buyers and listing sellers both route through one affiliate lane.' },
    { label: 'Lender-side translation', detail: 'You carry findings and paydown proof to the loan officer, in their language.' },
  ],
  case_help: [
    { label: 'Docket-aware packet prep', detail: 'Build answers, affidavits, and discovery around real hearing dates.' },
    { label: 'Licensed counsel review', detail: 'Attorney applicants can review formal filings other roles cannot touch.' },
    { label: 'Debt-buyer pattern reads', detail: 'Chain-of-assignment analysis on the collectors we see repeatedly.' },
  ],
  cs: [
    { label: 'Own the partner file end to end', detail: 'Consult, findings, letters, escalation, and milestone coaching.' },
    { label: 'Send from the method', detail: 'Track-locked letter generation with evidence attached automatically.' },
    { label: 'Graduate your economics', detail: 'Certification changes your revenue share on the same work.' },
  ],
  agency: [
    { label: 'Provision other operators', detail: 'Create seats, assign partners, and set what each seat may do.' },
    { label: 'Brand the whole experience', detail: 'Your domain, your portal, your support identity at higher tiers.' },
    { label: 'Route by rules, not by hand', detail: 'Lead routing across lanes so no partner sits unassigned.' },
  ],
  au_seller: [
    { label: 'Control the inventory', detail: 'You decide which cards list, at what limit optics, and for how long.' },
    { label: 'Season the market', detail: 'Rotate supply to keep listings fresh without burning issuer relationships.' },
    { label: 'Fulfill without selling', detail: 'Add and remove users on contract — the marketplace does the selling.' },
  ],
};

/** Enhanced profile features — what the shareboard / portal profile shows off. */
export const ROLE_PROFILE_FEATURES: Record<RolePageId, RoleFeatureRow[]> = {
  re: [
    { label: 'Market + brokerage badge', detail: 'License line, brokerage, and the metros you cover.' },
    { label: 'Referral link + share card', detail: 'One tracked link and a downloadable invite card with your name on it.' },
    { label: 'Partner milestone rail', detail: 'Who you referred and where they are, without exposing their file.' },
  ],
  case_help: [
    { label: 'Credential block', detail: 'Bar number or credentials, firm, and the role scope you were approved for.' },
    { label: 'Assigned matter list', detail: 'Only your matters, with next court date surfaced first.' },
    { label: 'Session log', detail: 'Every partner meeting written back to the file with notes.' },
  ],
  cs: [
    { label: 'Specialist credential', detail: 'Tier, certification state, and specialty tracks on one badge.' },
    { label: 'Service menu', detail: 'The programs you are cleared to run, shown to routed partners.' },
    { label: 'Production + payout strip', detail: 'Files in motion, milestones hit, and payouts in flight.' },
  ],
  agency: [
    { label: 'Company identity', detail: 'Logo slot, brand colors, support email, and portal domain.' },
    { label: 'Seat roster', detail: 'Every operator on your tenant with role and capacity.' },
    { label: 'Routing lanes', detail: 'Which lanes accept new partners and who owns each lane.' },
  ],
  au_seller: [
    { label: 'Verified supplier mark', detail: 'Verification state, seasons completed, and fulfillment reliability.' },
    { label: 'Inventory shelf', detail: 'Each card with issuer, limit, age, and slots still open.' },
    { label: 'Payout ledger', detail: 'Placement-linked payouts, pending and cleared.' },
  ],
};

/** Compliance footer text per role — keep visible near payouts, AU, and funding claims. */
export const ROLE_COMPLIANCE_FOOTNOTES: Record<RolePageId, string> = {
  re: 'Results vary · not legal advice · funding and underwriting subject to lender approval · payouts subject to verification · not income or closing guarantees',
  case_help:
    'Educational platform roles · not an offer of employment · attorney applicants must be licensed where they practice · results vary · not legal advice',
  cs: 'Results vary · not legal advice · revenue share, not a platform fee · payouts subject to verification · not income guarantees',
  agency:
    'Results vary · not legal advice · agency partners are independent operators, not employees · payouts subject to verification and underwriting',
  au_seller:
    'Results vary · not legal advice · tradeline supply carries issuer risk — follow marketplace rotation rules · payouts subject to verification · buyers pay placement fees separately',
};
