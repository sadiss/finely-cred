import type { Partner } from '../domain/partners';
import { nowIso } from '../domain/partners';
import { upsertPartner } from '../data/partnersRepo';

export function getPartnerFundingTarget(partner: Partner | null | undefined): number | null {
  if (!partner) return null;
  const routeKey = partner.primaryRoute || 'personal_restore';
  const v = partner.routes?.[routeKey]?.fundingTarget;
  return typeof v === 'number' && v > 0 ? v : null;
}

export function formatFundingAmount(centsOrDollars: number): string {
  const n = Math.max(0, Math.round(centsOrDollars));
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n.toLocaleString()}`;
}

/** Persist funding target on the partner's primary route intake. */
export async function savePartnerFundingTarget(partner: Partner, targetDollars: number): Promise<Partner> {
  const routeKey = partner.primaryRoute || 'personal_restore';
  const fundingTarget = Math.max(0, Math.round(targetDollars));
  return upsertPartner({
    ...partner,
    routes: {
      ...partner.routes,
      [routeKey]: {
        ...(partner.routes?.[routeKey] ?? {}),
        fundingTarget: fundingTarget || undefined,
      },
    },
    updatedAt: nowIso(),
  });
}

export const FUNDING_GOAL_PRESETS = [
  { label: '$25K', value: 25000 },
  { label: '$50K', value: 50000 },
  { label: '$100K', value: 100000 },
  { label: '$250K', value: 250000 },
  { label: '$500K', value: 500000 },
  { label: '$1M', value: 1000000 },
];

export const AGENCY_TIER_IDS = [
  'agency_solo',
  'agency_growth',
  'agency_operator',
  'agency_pro',
  'agency_scale',
  'agency_enterprise',
] as const;

export type AgencyTierId = (typeof AGENCY_TIER_IDS)[number];
