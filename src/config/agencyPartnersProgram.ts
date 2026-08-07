import type { AgencyTier } from './pricingCatalog';
import { agencyTiers, formatAgencyTierKeepHeadline, formatPrice, getAgencyTierById, getPackageById } from './pricingCatalog';

export function getPublicAgencyTiers(): AgencyTier[] {
  return agencyTiers.filter((t) => t.isPublic !== false).sort((a, b) => a.sortOrder - b.sortOrder);
}

export const AGENCY = {
  programName: 'Agency Partner Program',
  signupPath: '/agency/signup',
  publicPath: '/agency-partners',
} as const;

/**
 * One-time white-label buy-in — separate from the ongoing payout % tiers below.
 * Pricing lives in `pricingCatalog.ts` (single source of truth); this copy layer
 * only adds the marketing-facing "what you get" bullets and the tier→buy-in mapping.
 *
 * Each buy-in maps 1:1 to a capacity tier (`agencyTiers` in pricingCatalog.ts) — buying
 * in activates that tenant's seats, file limits, and white-label depth on the full
 * Finely OS (CRM, AI agents, dispute engine, letters studio + vault).
 */
export type AgencyBuyInTierId =
  | 'agency_buyin_starter'
  | 'agency_buyin_growth'
  | 'agency_buyin_operator'
  | 'agency_buyin_pro'
  | 'agency_buyin_scale'
  | 'agency_buyin_enterprise';

/** 1:1 map — buy-in id → the capacity tier it activates. */
export const AGENCY_BUY_IN_CAPACITY_TIER_ID: Record<AgencyBuyInTierId, string> = {
  agency_buyin_starter: 'agency_solo',
  agency_buyin_growth: 'agency_growth',
  agency_buyin_operator: 'agency_operator',
  agency_buyin_pro: 'agency_pro',
  agency_buyin_scale: 'agency_scale',
  agency_buyin_enterprise: 'agency_enterprise',
};

/** Reverse of `AGENCY_BUY_IN_CAPACITY_TIER_ID` — capacity tier id → its buy-in id. */
const CAPACITY_TIER_TO_AGENCY_BUY_IN_ID: Record<string, AgencyBuyInTierId> = Object.fromEntries(
  (Object.entries(AGENCY_BUY_IN_CAPACITY_TIER_ID) as [AgencyBuyInTierId, string][]).map(([buyInId, tierId]) => [
    tierId,
    buyInId,
  ]),
);

const AGENCY_BUY_IN_COPY: Record<AgencyBuyInTierId, { name: string; tagline: string; included: string[] }> = {
  agency_buyin_starter: {
    name: 'Starter Buy-In',
    tagline: 'One-time — launch your solo agency tenant',
    included: [
      'Full Finely OS: CRM, dispute engine, AI copilots, letters studio + vault',
      '1 seat • up to 20 active partner files',
      'Finely-branded portal while you launch',
      'Training seat + guided 30-day onboarding',
      'Keep 30% while training → 45% once certified',
    ],
  },
  agency_buyin_growth: {
    name: 'Growth Buy-In',
    tagline: 'One-time — small agency, co-branded portal',
    included: [
      'Everything in Starter Buy-In',
      '2 seats • up to 50 active partner files',
      'Co-branded portal — your logo alongside Finely',
      'Lead Intelligence + Comms sequences',
      'Keep 42% while training → 52% once certified',
    ],
  },
  agency_buyin_operator: {
    name: 'Operator Buy-In',
    tagline: 'One-time — team workflows before full white-label',
    included: [
      'Everything in Growth Buy-In',
      '4 seats • up to 100 active partner files',
      'Advanced CRM routing + team workflows',
      'Marketing asset library + Media Studio',
      'Keep 46% while training → 58% once certified',
    ],
  },
  agency_buyin_pro: {
    name: 'White-Label Pro Buy-In',
    tagline: 'One-time — full white-label + custom domain',
    included: [
      'Everything in Operator Buy-In',
      '6 seats • up to 175 active partner files',
      'Full white-label + custom domain',
      'API access + dedicated account manager',
      'Keep 50% at launch → 62% as independent operator',
    ],
  },
  agency_buyin_scale: {
    name: 'Scale Buy-In',
    tagline: 'One-time — high-volume white-label',
    included: [
      'Everything in White-Label Pro Buy-In',
      '10 seats • up to 300 active partner files',
      'White-label at scale + automation',
      'Quarterly strategy calls',
      'Keep 50% ramp-up → 58% certified',
    ],
  },
  agency_buyin_enterprise: {
    name: 'Enterprise Buy-In',
    tagline: 'One-time — unlimited scale, dedicated infrastructure',
    included: [
      'Everything in Scale Buy-In',
      'Unlimited seats & active partner files',
      'Enterprise white-label + dedicated infrastructure',
      'Dedicated success team + custom integrations + SLA',
      'Custom revenue share — negotiated up to 68% keep',
    ],
  },
};

export type AgencyBuyInTier = {
  id: AgencyBuyInTierId;
  name: string;
  tagline: string;
  included: string[];
  priceLabel: string;
  priceCents: number;
  /** The capacity tier id this buy-in activates (`agencyTiers` in pricingCatalog.ts). */
  capacityTierId: string;
};

const AGENCY_BUY_IN_ORDER: AgencyBuyInTierId[] = [
  'agency_buyin_starter',
  'agency_buyin_growth',
  'agency_buyin_operator',
  'agency_buyin_pro',
  'agency_buyin_scale',
  'agency_buyin_enterprise',
];

/** Public buy-in tiers (all 6), priced from the pricing catalog and mapped 1:1 to capacity tiers. */
export function getPublicAgencyBuyInTiers(): AgencyBuyInTier[] {
  return AGENCY_BUY_IN_ORDER.map((id) => {
    const pkg = getPackageById(id);
    const copy = AGENCY_BUY_IN_COPY[id];
    return {
      id,
      name: copy.name,
      tagline: copy.tagline,
      included: copy.included,
      priceCents: pkg?.priceAmount ?? 0,
      priceLabel: pkg ? formatPrice(pkg.priceAmount) : '',
      capacityTierId: AGENCY_BUY_IN_CAPACITY_TIER_ID[id],
    };
  });
}

/** The capacity tier a given buy-in activates (1:1 mapping). */
export function agencyCapacityTierIdForBuyIn(buyInId?: string | null): string | null {
  if (!buyInId) return null;
  return AGENCY_BUY_IN_CAPACITY_TIER_ID[buyInId as AgencyBuyInTierId] ?? null;
}

/** The buy-in that activates a given capacity tier (1:1 mapping — replaces old "recommended" heuristic). */
export function recommendedAgencyBuyInIdForTier(tierId?: string | null): AgencyBuyInTierId {
  if (tierId && CAPACITY_TIER_TO_AGENCY_BUY_IN_ID[tierId]) {
    return CAPACITY_TIER_TO_AGENCY_BUY_IN_ID[tierId];
  }
  return 'agency_buyin_starter';
}

/** Full agency tier for the capacity tier a buy-in activates — handy for keep-% / seat copy. */
export function agencyTierForBuyIn(buyInId?: string | null): AgencyTier | undefined {
  const tierId = agencyCapacityTierIdForBuyIn(buyInId);
  return tierId ? getAgencyTierById(tierId) : undefined;
}

/** Plain-English copy for a capacity tier's white-label depth — shared by the choice cards and signup confirm step. */
export const AGENCY_WHITE_LABEL_LABEL: Record<string, string> = {
  finely_branded: 'Finely-branded portal while you launch',
  co_branded: 'Co-branded portal — your logo alongside Finely',
  white_label: 'Full white-label + custom domain',
  enterprise_white_label: 'Enterprise white-label + dedicated infrastructure',
};

/** Plain-English copy for a capacity tier's recommended training phase. */
export const AGENCY_TRAINING_PHASE_LABEL: Record<string, string> = {
  apprenticeship: 'Guided apprenticeship while your tenant ramps up',
  guided: 'Mentor checkpoints on files and team workflows',
  independent: 'Independent fulfillment — your agency runs the work',
  partner: 'Certified partner track — negotiated agreement',
};

/**
 * 3–4 plain-English facts for a capacity tier — seats, active files, white-label depth, keep %.
 * Shared by the buy-in choice cards on the public page and the confirm-step summary on signup.
 */
export function getAgencyPlanBullets(capacity: AgencyTier | null | undefined): string[] {
  if (!capacity) return [];
  const seatText =
    capacity.seatLimit === -1 ? 'Unlimited team seats' : `${capacity.seatLimit} team seat${capacity.seatLimit === 1 ? '' : 's'}`;
  const fileText =
    capacity.activeClientLimit === -1
      ? 'Unlimited active partner files'
      : `Up to ${capacity.activeClientLimit} active partner files`;
  const wlText = capacity.whiteLabelLevel ? AGENCY_WHITE_LABEL_LABEL[capacity.whiteLabelLevel] : null;
  const keepText = formatAgencyTierKeepHeadline(capacity);
  return [seatText, fileText, wlText, keepText].filter(Boolean) as string[];
}

/** Agency track only — not shown on credit specialist pages. */
export const AGENCY_ROLE_MODEL = {
  headline: 'Agency owners vs credit specialists',
  rows: [
    {
      term: 'Agency partner (you)',
      meaning:
        'You own a branded credit services company on Finely OS — tenant, team seats, partner routing, and white-label portal. You may earn on company volume and team production, not just one file at a time.',
    },
    {
      term: 'Credit specialist',
      meaning:
        'An individual (or seat on your team) who runs partner files and earns a payout share of each service sale. Many agency owners also operate as certified specialists — but the career pages are separate.',
    },
    {
      term: 'White-label tier',
      meaning:
        'How much of the partner experience is your brand vs Finely — from co-branded portal to full custom domain and enterprise API.',
    },
    {
      term: 'Finely platform',
      meaning:
        'The software engine both tracks use: CRM, disputes, letters, vault, comms. Specialists get access through the program; agencies get tenant-level branding and seat controls.',
    },
  ],
  percentOf:
    'Agency tiers show payout share while training vs when certified on your tenant’s partner volume. Per-file splits for individual specialists are on the Credit specialists page.',
} as const;

export const AGENCY_OFFERINGS = [
  {
    title: 'White-label tenant',
    description: 'Your agency name, logo, and partner-facing portal — not Finely-branded at higher tiers.',
    included: ['Custom brand + support email', 'Team seat management', 'Partner routing rules'],
  },
  {
    title: 'Compliance & workflows',
    description: 'Operator-grade dispute OS with audit trails built for agencies, not hobbyists.',
    included: ['Multi-partner CRM', 'Letter studio + evidence vault', 'Admin oversight tools'],
  },
  {
    title: 'Scale tiers',
    description: 'Grow from solo operator capacity to enterprise white-label with more files and seats.',
    included: ['Defined partner file limits', 'Seat limits per tier', 'Payout share while training → certified'],
  },
  {
    title: 'Dedicated agency support',
    description: 'Onboarding for tenant setup, branding, and team provisioning.',
    included: ['Agency signup workspace', 'Admin console access', 'Pricing & tier upgrades'],
  },
] as const;
