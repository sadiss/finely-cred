import { listAffiliatesByTenant, listAffiliateAttributions, affiliateConversionStats } from '../data/affiliateRepo';
import { FINELY_TENANT_ID } from '../domain/tenants';
import { emitPlatformEvent } from '../domain/platformEvents';
import { logAffiliateAttribution } from '../data/affiliateRepo';

export type AffiliatePayoutRow = {
  affiliateId: string;
  email: string;
  referralCode: string;
  leads: number;
  conversions: number;
  pendingPayoutCents: number;
  commissionPct: number;
};

export type AffiliatePayoutRollup = {
  affiliates: AffiliatePayoutRow[];
  totalPendingCents: number;
  totalLeads30d: number;
};

const MS_DAY = 24 * 60 * 60 * 1000;

function inDays(iso: string, days: number) {
  return Date.parse(iso) >= Date.now() - days * MS_DAY;
}

/** Phase 26 — affiliate payout rollup for admin ops. */
export async function buildAffiliatePayoutRollup(): Promise<AffiliatePayoutRollup> {
  const affiliates = await listAffiliatesByTenant(FINELY_TENANT_ID);
  const rows: AffiliatePayoutRow[] = [];
  let totalPendingCents = 0;
  let totalLeads30d = 0;

  for (const a of affiliates) {
    const stats = affiliateConversionStats(a.id);
    const events = listAffiliateAttributions(a.id);
    const leads30d = events.filter((e) => e.eventType === 'lead' && inDays(e.createdAt, 30)).length;
    totalLeads30d += leads30d;
    totalPendingCents += stats.pendingPayoutCents;
    rows.push({
      affiliateId: a.id,
      email: a.email,
      referralCode: a.referralCode,
      leads: stats.leads,
      conversions: stats.conversions,
      pendingPayoutCents: stats.pendingPayoutCents,
      commissionPct: a.commissionPct,
    });
  }

  rows.sort((a, b) => b.pendingPayoutCents - a.pendingPayoutCents);
  return { affiliates: rows, totalPendingCents, totalLeads30d };
}

/** Mark pending commission as paid (demo / admin action). */
export async function recordAffiliatePayout(args: {
  affiliateId: string;
  amountCents: number;
  note?: string;
}): Promise<void> {
  await logAffiliateAttribution({
    affiliateId: args.affiliateId,
    eventType: 'payout',
    amountCents: args.amountCents,
    meta: { note: args.note ?? 'Admin payout' },
  });
  emitPlatformEvent({
    type: 'automation.triggered',
    tenantId: FINELY_TENANT_ID,
    payload: { kind: 'affiliate_payout_recorded', affiliateId: args.affiliateId, amountCents: args.amountCents },
  });
}
