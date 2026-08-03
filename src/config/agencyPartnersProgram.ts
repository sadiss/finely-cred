import type { AgencyTier } from './pricingCatalog';
import { agencyTiers, formatPrice, getPackageById } from './pricingCatalog';

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
 * only adds the marketing-facing "what you get" bullets and tier→buy-in mapping.
 */
export type AgencyBuyInTierId = 'agency_buyin_starter' | 'agency_buyin_operator';

const AGENCY_BUY_IN_COPY: Record<AgencyBuyInTierId, { name: string; tagline: string; included: string[] }> = {
  agency_buyin_starter: {
    name: 'Starter buy-in',
    tagline: 'One-time — get your tenant live',
    included: [
      'Branded workspace provisioning',
      'Training seat (apprenticeship track)',
      'First 30-day guided onboarding',
    ],
  },
  agency_buyin_operator: {
    name: 'Operator buy-in',
    tagline: 'One-time — launch faster with priority setup',
    included: [
      'Everything in Starter buy-in',
      'Priority tenant provisioning',
      'White-label kit (co-brand assets + domain guidance)',
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
};

/** Public buy-in tiers, priced from the pricing catalog (`agency_buyin_starter` / `agency_buyin_operator`). */
export function getPublicAgencyBuyInTiers(): AgencyBuyInTier[] {
  return (Object.keys(AGENCY_BUY_IN_COPY) as AgencyBuyInTierId[]).map((id) => {
    const pkg = getPackageById(id);
    const copy = AGENCY_BUY_IN_COPY[id];
    return {
      id,
      name: copy.name,
      tagline: copy.tagline,
      included: copy.included,
      priceCents: pkg?.priceAmount ?? 0,
      priceLabel: pkg ? formatPrice(pkg.priceAmount) : '',
    };
  });
}

/** Recommended buy-in for a given capacity tier — Starter for solo, Operator once you add seats/white-label. */
export function recommendedAgencyBuyInIdForTier(tierId?: string | null): AgencyBuyInTierId {
  return tierId && tierId !== 'agency_solo' ? 'agency_buyin_operator' : 'agency_buyin_starter';
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
