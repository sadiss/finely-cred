/** User-facing affiliate program config (internal role id stays `affiliate`). */
export const AF = {
  programName: 'Affiliate Program',
  hubName: 'Affiliate Hub',
  hubPath: '/affiliate/hub',
  publicPath: '/affiliate',
  defaultCommissionPct: 20,
  defaultRecurringCommissionPct: 15,
  defaultDenefitsSharePct: 8,
  messagesDeepLink: '/portal/messages?hub=team&topic=affiliate_program',
} as const;

/**
 * ONE payout formula, every path: base package % on the sale, PLUS a Denefit share
 * that automatically stacks on top whenever that specific referral chooses in-house
 * financing (Denefit). It is never "percentage OR profit share" — Denefit residual
 * layers on top of the package %, it does not replace it. If a referral pays cash or
 * a non-Denefit payment plan, the affiliate still earns the appropriate package %;
 * the Denefit share simply isn't in play because there's no Denefit contract to share.
 *
 * What changes path-to-path is the business ladder around that formula — toolkit
 * depth, payout priority, co-branded assets, calculator depth, and service-lane
 * bonuses. Percentages below are pulled straight from the published defaults above
 * (`AF.defaultCommissionPct`, `AF.defaultRecurringCommissionPct`, `AF.defaultDenefitsSharePct`)
 * — no invented numbers.
 */
export const AFFILIATE_STACKING_NOTE =
  `Base % and Denefit share always stack — never either/or. Every path earns ` +
  `${AF.defaultCommissionPct}% on package sales, and the ${AF.defaultDenefitsSharePct}% Denefit share layers on ` +
  `top automatically the moment a referral chooses in-house financing — no matter which path you're on. ` +
  `Paths change your toolkit, priority, and specialization, not whether payouts stack.`;

export type AffiliatePathId = 'referrer' | 'recurring_partner' | 'denefit_stream';

export type AffiliatePathAccent = 'sky' | 'emerald' | 'gold';

export type AffiliatePathBlock = {
  key: string;
  title: string;
  items: string[];
};

export type AffiliatePath = {
  id: AffiliatePathId;
  name: string;
  /** e.g. "Tier 1 · Entry" — reinforces the business-ladder feel on choice cards. */
  ladderLabel: string;
  accent: AffiliatePathAccent;
  tagline: string;
  payoutLabel: string;
  description: string;
  /** How the universal formula reads for this path specifically — always additive, never "or". */
  stack: string[];
  /** Ladder buckets — toolkit / priority / bonus depth is drastically different tier to tier. */
  blocks: AffiliatePathBlock[];
};

export const AFFILIATE_PATHS: AffiliatePath[] = [
  {
    id: 'referrer',
    name: 'Referrer',
    ladderLabel: 'Tier 1 · Entry',
    accent: 'sky',
    tagline: `${AF.defaultCommissionPct}% upfront, every sale`,
    payoutLabel: `${AF.defaultCommissionPct}% upfront on every package sale — Denefit share still stacks on top if that referral finances in-house`,
    description:
      'Share your link. The moment a referral buys a Finely Cred package — restore, business credit, dispute letters — you get paid upfront. Simplest path to your first check, with Denefit stacking already built in if that referral ends up on an in-house financing contract.',
    stack: [
      `${AF.defaultCommissionPct}% upfront the moment a referred package sells`,
      `PLUS Denefit share (${AF.defaultDenefitsSharePct}%) automatically stacks on top if that referral chooses in-house financing`,
      'No residual tracking to manage on non-Denefit sales — one clean payout per sale',
    ],
    blocks: [
      {
        key: 'payout',
        title: 'How you get paid',
        items: [
          `${AF.defaultCommissionPct}% upfront commission on every qualified referral sale`,
          `Denefit share (${AF.defaultDenefitsSharePct}%) stacks automatically — no extra step — when a referral picks in-house financing`,
          'One payout per sale, no active-membership tracking required',
        ],
      },
      {
        key: 'toolkit',
        title: 'Toolkit',
        items: [
          'Tracked referral link + UTM-ready codes',
          'Core marketing kit: education library links, ebooks, share templates',
          'Standard payout calculator (upfront view)',
        ],
      },
      {
        key: 'bonus',
        title: 'Bonuses',
        items: ['Fast-start bonus on your first 3 referred sales in 30 days'],
      },
    ],
  },
  {
    id: 'recurring_partner',
    name: 'Recurring partner',
    ladderLabel: 'Tier 2 · Growth',
    accent: 'emerald',
    tagline: `Upfront + ${AF.defaultRecurringCommissionPct}% residual`,
    payoutLabel: `Same ${AF.defaultCommissionPct}% upfront, PLUS ${AF.defaultRecurringCommissionPct}% residual while a referral stays active — Denefit share still stacks on top`,
    description:
      'Everything in Referrer, plus we track residual for you: every month a referral stays on a membership or payment plan, you earn again. Denefit share still stacks on top whenever that referral is on an in-house financing contract — built for audiences that stick around long-term.',
    stack: [
      `${AF.defaultCommissionPct}% upfront on the initial package sale`,
      `PLUS ${AF.defaultRecurringCommissionPct}% recurring residual for every month the referral stays active on a membership/payment plan`,
      `PLUS Denefit share (${AF.defaultDenefitsSharePct}%) still stacks on top whenever that referral is on an in-house financing contract`,
    ],
    blocks: [
      {
        key: 'payout',
        title: 'How you get paid',
        items: [
          `${AF.defaultCommissionPct}% upfront on the initial sale`,
          `${AF.defaultRecurringCommissionPct}% recurring residual for every month the referral stays on an active plan`,
          `Denefit share (${AF.defaultDenefitsSharePct}%) still stacks on top on any Denefit contract — same formula as Referrer, just tracked for you`,
        ],
      },
      {
        key: 'toolkit',
        title: 'Toolkit',
        items: [
          'Everything in Referrer, plus a residual-tracking dashboard (active months, churn alerts)',
          'Co-branded landing page with your name alongside Finely Cred',
          'Recurring + volume payout calculator — 12-month projection, cumulative earnings',
        ],
      },
      {
        key: 'priority',
        title: 'Priority',
        items: ['Priority payout batch — faster than Referrer tier', 'Direct line to affiliate ops for residual questions'],
      },
      {
        key: 'bonus',
        title: 'Bonuses',
        items: ['Retention bonus when a referred partner stays active 6+ months across any service lane'],
      },
    ],
  },
  {
    id: 'denefit_stream',
    name: 'Denefit-focused partner',
    ladderLabel: 'Tier 3 · Specialist',
    accent: 'gold',
    tagline: `Package % + Denefit residual`,
    payoutLabel: `Package % when it applies, PLUS the full Denefit share (${AF.defaultDenefitsSharePct}%) over the contract term — the strongest residual story`,
    description:
      'Built for affiliates who specialize in placing referrals into in-house financing. You still earn the standard package % on any non-Denefit sale — and on every Denefit contract, that % PLUS the Denefit share stack together over the life of the contract, backed by our deepest Denefit toolkit and priority support.',
    stack: [
      `Standard package % (${AF.defaultCommissionPct}% upfront, or ${AF.defaultRecurringCommissionPct}% residual on plans) whenever a referral does not choose Denefit`,
      `PLUS Denefit share (${AF.defaultDenefitsSharePct}%) over the full contract term on every in-house financing contract`,
      'Never either/or — package % and Denefit share always stack together on Denefit deals',
    ],
    blocks: [
      {
        key: 'payout',
        title: 'How you get paid',
        items: [
          `Package % on any sale, same formula as every path — nothing lost if a referral skips Denefit`,
          `Denefit share (${AF.defaultDenefitsSharePct}%) over the full contract term stacks on top of that % on every in-house financing contract`,
          'The long-term residual story Denefit was built for, with the deepest tracking of any path',
        ],
      },
      {
        key: 'toolkit',
        title: 'Toolkit',
        items: [
          'Deepest Denefit calculator: full contract-term amortization + residual projection',
          'Denefit-specific co-branded explainer deck and landing funnel',
          'Denefit certification track so you can pitch in-house financing with confidence',
        ],
      },
      {
        key: 'priority',
        title: 'Priority',
        items: ['Top payout priority — Denefit contracts route to the front of every batch', 'Dedicated Denefit sales support line'],
      },
      {
        key: 'bonus',
        title: 'Bonuses',
        items: ['Per-contract Denefit close bonus, plus a quarterly volume bonus once you cross a Denefit contract threshold'],
      },
    ],
  },
];

export function getAffiliatePathById(id: string): AffiliatePath | undefined {
  return AFFILIATE_PATHS.find((p) => p.id === id);
}

/** Hub deepen band — affiliate is referral-only (not in RolePageId work-split map). */
export const AFFILIATE_WORK_SPLIT = {
  headline: 'You refer partners. Finely delivers the packages and tracks payouts.',
  youDo: [
    'Share your tagged apply / pricing links',
    'Attribute traffic with campaigns so payouts stay clean',
    'Model commissions before you pitch a package',
  ],
  finelyRuns: [
    'Partner onboarding, restore / build delivery, and dispute tooling',
    'Attribution, payout batches, and Denefit residual tracking',
    'Co-marketing kits and education library updates',
  ],
  notYourJob: [
    'You do not run partner dispute files or letter studios',
    'You do not process payments or underwriting decisions',
    'You do not invent payout math — the published % stack is SSOT',
  ],
} as const;

export const AFFILIATE_OFFERINGS = [
  {
    title: 'Tracked referral links',
    description: 'Share Finely services with unique links — conversions attributed to your account.',
    included: ['Referral codes & UTM-ready links', 'Lead capture on applications', 'CRM pipeline visibility for admins'],
  },
  {
    title: 'Payout calculator',
    description: `Model your ${AF.defaultCommissionPct}% upfront payout, plus recurring share when referrals stay on membership plans — both stack.`,
    included: ['Upfront sale payout', 'Optional recurring months', 'Transparent percentage inputs'],
  },
  {
    title: 'Denefit referral stream',
    description:
      'Refer in-house Denefit contracts — the referral builds credit on Equifax as they pay, and the Denefit share stacks on top of your package % over the contract term.',
    included: ['Equifax reporting story for prospects', 'Denefit calculator in hub', 'Always stacks with package % — never a replacement for it'],
  },
  {
    title: 'Marketing kit',
    description: 'Education library, ebooks, and Comms templates you can share with your audience.',
    included: ['Portal education resources', 'Affiliate agreement template', 'Co-branded assets as program expands'],
  },
  {
    title: 'Affiliate partnership line',
    description: 'Message Finely ops for payouts, compliance questions, and campaign support.',
    included: ['Portal messages thread', 'Application → lead workflow', 'Admin Support Inbox replies'],
  },
] as const;
