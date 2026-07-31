/**
 * Credit Specialist offer SSOT — pricing tiers, 3-lead gate, 30-day free-leads window.
 * Public copy uses partner terminology. No income guarantees.
 */
import { CS } from './creditSpecialistProgram';

export const CS_OFFER = {
  pricingPath: '/credit-specialist',
  joinPath: '/credit-specialist/join',
  onboardingAliasPath: '/credit-specialist/onboarding',
  guidePath: '/credit-specialist-guide',
  programPath: CS.publicPath,
  hubPath: CS.hubPath,
  /** Minimum leads a specialist must bring to unlock full system access. */
  minLeadsRequired: 3,
  /** Calendar days from signup to source the free-leads commitment. */
  freeLeadsWindowDays: 30,
  complianceFootnote:
    'Results vary · not legal advice · not an employment offer · income examples are illustrative only · funding and partner outcomes subject to underwriting and effort.',
} as const;

export type CreditSpecialistOfferTierId =
  | 'cs_foundation'
  | 'cs_builder'
  | 'cs_pro'
  | 'cs_elite';

export type CreditSpecialistOfferTier = {
  id: CreditSpecialistOfferTierId;
  name: string;
  tagline: string;
  badge?: string;
  /** Typical keep band on partner service fees (illustrative). */
  keepPctLabel: string;
  keepPctTypical: number;
  pricingModel: 'revenue_share';
  priceLabel: string;
  priceHint: string;
  access: string[];
  education: string[];
  methods: string[];
  tools: string[];
  support: string[];
  bestFor: string;
  sortOrder: number;
};

/** Transparent access tiers — revenue share, not a flat platform fee. */
export const CREDIT_SPECIALIST_OFFER_TIERS: CreditSpecialistOfferTier[] = [
  {
    id: 'cs_foundation',
    name: 'Specialist Foundation',
    tagline: 'Start trained — platform, methods, and mentor-backed files.',
    keepPctLabel: '~30%',
    keepPctTypical: 30,
    pricingModel: 'revenue_share',
    priceLabel: 'Revenue share',
    priceHint: 'No platform fee — you keep ~30% while Finely co-runs early files.',
    access: [
      'Full Finely partner OS (CRM, portal, disputes, vault)',
      'Specialist Hub + academy unlock after 3-lead commitment',
      `${CS_OFFER.freeLeadsWindowDays}-day window to source your free leads`,
    ],
    education: [
      'Core academy modules (restore, build, intake)',
      'Weekly mentor checkpoints during apprenticeship',
      'Free Credit Specialist Playbook (in-app guide)',
    ],
    methods: [
      'Factual dispute workflows & evidence packs',
      'Partner onboarding checklists',
      'Compliant pitch frameworks',
    ],
    tools: ['Letters studio', 'Documents vault', 'Task sequencing', 'Portal messaging'],
    support: ['Partnership line in portal messages', 'Mentor QA on early rounds'],
    bestFor: 'New specialists learning the craft while bringing their first 3 partners.',
    sortOrder: 1,
  },
  {
    id: 'cs_builder',
    name: 'Specialist Builder',
    tagline: 'You run day-to-day — Finely backs complex fulfillment.',
    badge: 'Popular',
    keepPctLabel: '~42%',
    keepPctTypical: 42,
    pricingModel: 'revenue_share',
    priceLabel: 'Revenue share',
    priceHint: 'Higher keep as you own relationships and most file work.',
    access: [
      'Everything in Foundation',
      'Lead Intelligence + nurture sequences',
      'Co-branded portal options',
    ],
    education: [
      'Specialty tracks (business credit, debt, tradelines)',
      'Mentor office hours (not daily co-pilot)',
      'Growth & compliance refreshers',
    ],
    methods: [
      'Full-cycle partner file playbooks',
      'Sales + fee setting within program guidelines',
      'Escalation paths for legal/debt lanes',
    ],
    tools: ['Comms Studio templates', 'Marketing asset library', 'Denefit enrollment tools'],
    support: ['Priority mentor office hours', 'Shared QA on complex disputes'],
    bestFor: 'Operators who already have a pipeline and want higher keep.',
    sortOrder: 2,
  },
  {
    id: 'cs_pro',
    name: 'Specialist Pro',
    tagline: 'Independent operator — platform is your engine.',
    keepPctLabel: '~52%',
    keepPctTypical: 52,
    pricingModel: 'revenue_share',
    priceLabel: 'Revenue share',
    priceHint: 'You run fulfillment and growth; Finely powers the OS.',
    access: [
      'Everything in Builder',
      'White-label readiness path',
      'Optional shared lead programs (negotiated)',
    ],
    education: ['Certification prep', 'Advanced specialty intensives', 'Compliance update briefings'],
    methods: [
      'End-to-end file ownership playbooks',
      'Ad creative kits for your own spend',
      'Team-seat prep (if upgrading to agency later)',
    ],
    tools: ['Automation suites', 'API-ready workflows (where enabled)', 'Full letters + reasons library'],
    support: ['Partnership line for escalations', 'Certification review path'],
    bestFor: 'Experienced specialists running volume under their own brand motion.',
    sortOrder: 3,
  },
  {
    id: 'cs_elite',
    name: 'Certified Partner',
    tagline: 'Top specialist status — highest per-file keep.',
    badge: 'Elite',
    keepPctLabel: '~62–80%',
    keepPctTypical: 62,
    pricingModel: 'revenue_share',
    priceLabel: 'Revenue share',
    priceHint: 'Invitation / review-based. Finely always retains ≥20% for the OS layer.',
    access: [
      'Everything in Pro',
      'Priority routing & dedicated account support',
      'Custom lead programs (when negotiated)',
    ],
    education: ['Quarterly strategy sessions', 'Train-the-trainer for junior seats'],
    methods: ['Enterprise-grade operating standards', 'Multi-lane specialty ownership'],
    tools: ['Enterprise platform features', 'Priority product feedback loop'],
    support: ['Dedicated partnership support', 'Compliance audits & SLA-style response'],
    bestFor: 'Proven operators maintaining quality, volume, and compliance scores.',
    sortOrder: 4,
  },
];

export const CS_OFFER_ENTRY_RULES = {
  headline: `Bring ${CS_OFFER.minLeadsRequired} leads · ${CS_OFFER.freeLeadsWindowDays} days to get them free`,
  subline:
    'Minimum requirement to use the system, get educated, and access methods, tools, and the full specialist stack.',
  bullets: [
    {
      title: `${CS_OFFER.minLeadsRequired}-lead minimum`,
      body: `You commit to bringing at least ${CS_OFFER.minLeadsRequired} partner leads. That unlocks education, methods, and full platform access — not a side-door trial with empty seats.`,
    },
    {
      title: `${CS_OFFER.freeLeadsWindowDays}-day free-leads window`,
      body: `From signup, you have ${CS_OFFER.freeLeadsWindowDays} days to source those leads using Finely capture pages, playbooks, and growth tooling. The window is clear on day one — no surprise clocks.`,
    },
    {
      title: 'What “free leads” means',
      body: 'You keep the partners you bring. Finely provides the capture funnels, education, and OS so you can convert — without charging a platform fee for the lead window itself.',
    },
    {
      title: 'After the window',
      body: 'You continue on revenue share for partner service fees. Lead share or co-marketing (if any) is disclosed before it changes your keep percentage.',
    },
  ],
} as const;

export const CS_OPPORTUNITY_FRAMING = {
  headline: 'Why specialists join Finely',
  subline: 'Income potential is real when you bring partners and run files — never guaranteed.',
  pillars: [
    {
      title: 'Per-file revenue share',
      body: 'Keep a transparent % of each partner’s service fee. Typical keep rises from ~30% in apprenticeship toward certified-partner levels as you run more of the work.',
    },
    {
      title: 'Impact that compounds',
      body: 'Help partners clean files, build credit, pursue funding readiness, and navigate debt lanes — with methods that stay compliance-aware.',
    },
    {
      title: 'OS, not a spreadsheet',
      body: 'CRM, letters, vault, tasks, and academy in one place so you spend time on partners — not duct-taping tools.',
    },
  ],
  earningsNote:
    'Dollar examples on the economics tab are illustrations for a single sample fee — not promises of income, volume, or lifestyle outcomes. Your results depend on effort, market, compliance, and partner fit.',
} as const;

export function getCreditSpecialistOfferTier(id: string | null | undefined): CreditSpecialistOfferTier | undefined {
  return CREDIT_SPECIALIST_OFFER_TIERS.find((t) => t.id === id);
}

export function listPublicCreditSpecialistOfferTiers(): CreditSpecialistOfferTier[] {
  return CREDIT_SPECIALIST_OFFER_TIERS.slice().sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Signup URL into unified auth with specialist role + offer intent query flags. */
export function creditSpecialistAccountSignupUrl(args?: {
  tierId?: string;
  next?: string;
}): string {
  const qs = new URLSearchParams({
    auth: 'signup',
    role: 'agent',
    skipRole: '1',
    minLeads: String(CS_OFFER.minLeadsRequired),
    freeLeadsDays: String(CS_OFFER.freeLeadsWindowDays),
  });
  if (args?.tierId) qs.set('tier', args.tierId);
  if (args?.next) qs.set('next', args.next);
  return `/signup?${qs.toString()}`;
}
