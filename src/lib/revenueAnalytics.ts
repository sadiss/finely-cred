import { listLeadCaptures } from '../data/leadsRepo';
import { listAgreementsByTenant } from '../data/billingRepo';
import { getRecentPlatformEvents } from '../domain/platformEvents';
import { getPackageById } from '../config/pricingCatalog';
import { FINELY_TENANT_ID } from '../domain/tenants';

import { buildReferralGrowthSnapshot } from './referralGrowthEngine';
import { buildRevenueCohortMetrics } from './revenueIntelCohorts';

export type RevenueIntelSnapshot = {
  leads7d: number;
  leads30d: number;
  purchases30d: number;
  revenue30dCents: number;
  topFunnels: Array<{ funnelId: string; count: number }>;
  trialExpiringSoon: number;
  cohorts: ReturnType<typeof buildRevenueCohortMetrics>;
  referral: ReturnType<typeof buildReferralGrowthSnapshot>;
};

const MS_DAY = 24 * 60 * 60 * 1000;

function inDays(iso: string, days: number, now = Date.now()) {
  return Date.parse(iso) >= now - days * MS_DAY;
}

export function buildRevenueIntelSnapshot(tenantId = FINELY_TENANT_ID): RevenueIntelSnapshot {
  const leads = listLeadCaptures();
  const leads7d = leads.filter((l) => inDays(l.createdAt, 7)).length;
  const leads30d = leads.filter((l) => inDays(l.createdAt, 30)).length;

  const agreements = listAgreementsByTenant(tenantId).filter(
    (a) => a.status === 'active' || a.status === 'completed',
  );
  const recentAgreements = agreements.filter((a) => inDays(a.createdAt, 30));
  let revenue30dCents = 0;
  for (const a of recentAgreements) {
    revenue30dCents += a.amountCents ?? getPackageById(a.packageId ?? '')?.priceAmount ?? 0;
  }

  const purchaseEvents = getRecentPlatformEvents(100).filter(
    (e) => e.type === 'purchase.completed' && inDays(e.createdAt, 30),
  );

  const funnelCounts = new Map<string, number>();
  for (const l of leads.filter((x) => inDays(x.createdAt, 30))) {
    const fid = l.funnelId ?? l.goal ?? 'unknown';
    funnelCounts.set(fid, (funnelCounts.get(fid) ?? 0) + 1);
  }
  const topFunnels = [...funnelCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([funnelId, count]) => ({ funnelId, count }));

  const trialExpiringSoon = getRecentPlatformEvents(50).filter(
    (e) =>
      e.type === 'automation.triggered' &&
      (e.payload as any)?.kind === 'trial_expiring' &&
      inDays(e.createdAt, 7),
  ).length;

  return {
    leads7d,
    leads30d,
    purchases30d: purchaseEvents.length,
    revenue30dCents,
    topFunnels,
    trialExpiringSoon,
    referral: buildReferralGrowthSnapshot(),
    cohorts: buildRevenueCohortMetrics({
      leads30d,
      purchases30d: purchaseEvents.length,
      revenue30dCents,
      referralConversions30d: buildReferralGrowthSnapshot().conversions30d,
    }),
  };
}

export function formatUsd(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
