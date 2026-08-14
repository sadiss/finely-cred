/**
 * Admin-wide revenue aggregate over `agreements` (Phase E1a).
 *
 * Unlike `billingSupabaseSync.ts` (partner-scoped, portal use) and
 * `AdminBillingPage.tsx` (100% localStorage, per-browser only), this module
 * queries Supabase directly with NO `partner_id` filter. This is safe under
 * existing RLS: `agreements_select_own` uses `is_partner_owner(partner_id)`,
 * and `is_partner_owner()` was patched (20260521000001_add_admin_bypass_to_rls.sql)
 * to return true for every row when the caller is `is_admin()`. No new
 * migration/RLS policy is required for this cross-partner read.
 *
 * Splits revenue into three distinct views per the enhancement plan (not one
 * blended metric):
 *   1. One-time DFY/DIY program revenue (personal/business/debt/wealth categories)
 *   2. Recurring membership MRR (only `personal_core` is a true subscription SKU)
 *   3. Agency revenue-share pipeline (the $1K–$499K buy-in ladder)
 * Plus ladder-progression tracking (% of partners who graduate to a higher-value
 * package on a later agreement).
 */
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import type { AgreementStatus, BillingRail } from '../domain/billing';
import { getPackageById, categoryLabels, type PricingCategory } from '../config/pricingCatalog';

const MEMBERSHIP_PACKAGE_ID = 'personal_core';

/**
 * Agreements in these statuses represent revenue actually collected — draft/pending/cancelled are excluded.
 * Exported so other surfaces that need the SAME "does this agreement count toward graduation"
 * definition (e.g. `partnerLadderProgression.ts`'s partner-facing next-rung recommendation, L2)
 * can import this instead of re-deriving their own status list.
 */
export const REVENUE_RECOGNIZED_STATUSES = new Set<AgreementStatus>(['active', 'completed']);

export type AdminAgreementRow = {
  id: string;
  tenantId: string;
  partnerId: string;
  packageId: string;
  category: PricingCategory | 'unknown';
  status: AgreementStatus;
  amountCents: number;
  rail: BillingRail;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
};

export type RevenueBreakdownRow = { key: string; label: string; totalCents: number; count: number };

export type LadderProgressionStats = {
  /** Distinct partners with at least one agreement. */
  partnersWithAgreements: number;
  /** Partners with 2+ agreements — the graduation-candidate pool (the only valid denominator). */
  partnersWithMultipleAgreements: number;
  /** Partners whose highest-value agreement came after their first (any category — crossing categories counts, e.g. Restore → Wealth Builder). */
  partnersProgressed: number;
  partnersNotProgressed: number;
  /** null when there is no graduation-candidate pool yet (avoids a misleading 0%). */
  progressionRatePct: number | null;
  examples: Array<{ partnerId: string; fromPackageId: string; toPackageId: string }>;
};

export type AdminRevenueSnapshot = {
  generatedAt: string;
  agreementsScanned: number;
  dataSource: 'supabase' | 'unavailable';
  error?: string;

  /** (a) One-time DFY/DIY program revenue — excludes the recurring membership SKU and agency buy-ins. */
  oneTimeProgramRevenueCents: number;
  oneTimeProgramCount: number;
  revenueByCategory: RevenueBreakdownRow[];

  /** (b) Recurring membership MRR — sum of active `personal_core` agreements only. */
  recurringMembershipMrrCents: number;
  recurringMembershipActiveCount: number;

  /** (c) Agency revenue-share pipeline — one-time buy-in collected across the $1K–$499K ladder. */
  agencyRevenueSharePipelineCents: number;
  agencyBuyInCount: number;
  agencyByTier: RevenueBreakdownRow[];

  /** Combined month-over-month trend (all revenue-recognized agreements), most recent 12 months. */
  monthlyTrend: Array<{ month: string; totalCents: number }>;

  ladderProgression: LadderProgressionStats;
};

function emptySnapshot(dataSource: AdminRevenueSnapshot['dataSource'], error?: string): AdminRevenueSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    agreementsScanned: 0,
    dataSource,
    error,
    oneTimeProgramRevenueCents: 0,
    oneTimeProgramCount: 0,
    revenueByCategory: [],
    recurringMembershipMrrCents: 0,
    recurringMembershipActiveCount: 0,
    agencyRevenueSharePipelineCents: 0,
    agencyBuyInCount: 0,
    agencyByTier: [],
    monthlyTrend: [],
    ladderProgression: {
      partnersWithAgreements: 0,
      partnersWithMultipleAgreements: 0,
      partnersProgressed: 0,
      partnersNotProgressed: 0,
      progressionRatePct: null,
      examples: [],
    },
  };
}

function safeStr(v: unknown): string {
  return String(v ?? '').trim();
}

function sumCents(rows: AdminAgreementRow[]): number {
  return rows.reduce((acc, r) => acc + r.amountCents, 0);
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function breakdownBy(
  rows: AdminAgreementRow[],
  keyFn: (r: AdminAgreementRow) => string,
  labelFn: (key: string) => string,
): RevenueBreakdownRow[] {
  const map = new Map<string, { totalCents: number; count: number }>();
  for (const r of rows) {
    const key = keyFn(r);
    const cur = map.get(key) ?? { totalCents: 0, count: 0 };
    cur.totalCents += r.amountCents;
    cur.count += 1;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .map(([key, v]) => ({ key, label: labelFn(key), totalCents: v.totalCents, count: v.count }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

/**
 * Catalog list price for ladder-comparison purposes — falls back to the agreement's own charged
 * amount if the package id is unknown/retired. Exported (not row-shaped) so `partnerLadderProgression.ts`
 * (L2, partner-facing next-rung recommendation) can rank a single partner's own agreements against
 * the exact same rung-price definition this admin metric (E1a.3) uses — the two surfaces must agree
 * on what counts as a "higher rung" or they'd tell contradictory stories about the same partner.
 */
export function packageRungPriceForAgreement(args: { packageId: string; amountCents: number }): number {
  return getPackageById(args.packageId)?.priceAmount ?? args.amountCents;
}

function packageRungPrice(row: AdminAgreementRow): number {
  return packageRungPriceForAgreement(row);
}

/**
 * % of partners who graduate from one pricing rung to the next. Compares each partner's
 * agreements in creation order — if any later agreement out-prices every prior one, that
 * partner "progressed" (this deliberately allows cross-category graduation, e.g.
 * Restore → Wealth Builder → Business Credit, not just within-category tier bumps).
 * Partners with only one agreement are excluded from the denominator entirely.
 */
export function computeLadderProgression(agreements: AdminAgreementRow[]): LadderProgressionStats {
  const byPartner = new Map<string, AdminAgreementRow[]>();
  for (const a of agreements) {
    if (!a.partnerId) continue;
    const list = byPartner.get(a.partnerId) ?? [];
    list.push(a);
    byPartner.set(a.partnerId, list);
  }

  let partnersWithMultiple = 0;
  let progressed = 0;
  const examples: LadderProgressionStats['examples'] = [];

  for (const [partnerId, list] of byPartner.entries()) {
    if (list.length < 2) continue;
    partnersWithMultiple += 1;

    const sorted = list.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    let runningMax = packageRungPrice(sorted[0]);
    let didProgress = false;
    let progressedTo = '';

    for (let i = 1; i < sorted.length; i += 1) {
      const price = packageRungPrice(sorted[i]);
      if (price > runningMax) {
        didProgress = true;
        progressedTo = sorted[i].packageId;
        runningMax = price;
      }
    }

    if (didProgress) {
      progressed += 1;
      if (examples.length < 5) {
        examples.push({ partnerId, fromPackageId: sorted[0].packageId, toPackageId: progressedTo });
      }
    }
  }

  return {
    partnersWithAgreements: byPartner.size,
    partnersWithMultipleAgreements: partnersWithMultiple,
    partnersProgressed: progressed,
    partnersNotProgressed: partnersWithMultiple - progressed,
    progressionRatePct: partnersWithMultiple > 0 ? Math.round((progressed / partnersWithMultiple) * 1000) / 10 : null,
    examples,
  };
}

export async function pullAdminRevenueSnapshot(): Promise<AdminRevenueSnapshot> {
  if (!isSupabaseConfigured) return emptySnapshot('unavailable', 'Supabase not configured');

  try {
    const { data, error } = await supabase
      .from('agreements')
      .select('id, tenant_id, partner_id, package_id, status, amount_cents, rail, created_at, started_at, ended_at')
      .order('created_at', { ascending: false })
      .limit(2000);

    if (error) {
      console.warn('[billingAdminAggregateRepo] Error pulling agreements:', error.message);
      return emptySnapshot('unavailable', error.message);
    }

    const rows: AdminAgreementRow[] = (data ?? []).map((r: Record<string, unknown>) => {
      const packageId = safeStr(r.package_id);
      const pkg = getPackageById(packageId);
      return {
        id: safeStr(r.id),
        tenantId: safeStr(r.tenant_id),
        partnerId: safeStr(r.partner_id),
        packageId,
        category: (pkg?.category ?? 'unknown') as PricingCategory | 'unknown',
        status: (safeStr(r.status) as AgreementStatus) || 'draft',
        amountCents: Number(r.amount_cents ?? 0) || 0,
        rail: (safeStr(r.rail) as BillingRail) || 'stripe',
        createdAt: safeStr(r.created_at),
        startedAt: safeStr(r.started_at) || undefined,
        endedAt: safeStr(r.ended_at) || undefined,
      };
    });

    const revenueRecognized = rows.filter((r) => REVENUE_RECOGNIZED_STATUSES.has(r.status));

    const agencyRows = revenueRecognized.filter((r) => r.category === 'agency');
    const membershipRows = rows.filter((r) => r.packageId === MEMBERSHIP_PACKAGE_ID && r.status === 'active');
    const oneTimeRows = revenueRecognized.filter(
      (r) => r.category !== 'agency' && r.packageId !== MEMBERSHIP_PACKAGE_ID,
    );

    const revenueByCategory = breakdownBy(
      oneTimeRows,
      (r) => r.category,
      (key) => categoryLabels[key as PricingCategory] ?? key,
    );
    const agencyByTier = breakdownBy(
      agencyRows,
      (r) => r.packageId,
      (key) => getPackageById(key)?.name ?? key,
    );

    const monthlyTrendMap = new Map<string, number>();
    for (const r of revenueRecognized) {
      const key = monthKey(r.createdAt);
      if (!key) continue;
      monthlyTrendMap.set(key, (monthlyTrendMap.get(key) ?? 0) + r.amountCents);
    }
    const monthlyTrend = Array.from(monthlyTrendMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, totalCents]) => ({ month, totalCents }));

    return {
      generatedAt: new Date().toISOString(),
      agreementsScanned: rows.length,
      dataSource: 'supabase',
      oneTimeProgramRevenueCents: sumCents(oneTimeRows),
      oneTimeProgramCount: oneTimeRows.length,
      revenueByCategory,
      recurringMembershipMrrCents: sumCents(membershipRows),
      recurringMembershipActiveCount: membershipRows.length,
      agencyRevenueSharePipelineCents: sumCents(agencyRows),
      agencyBuyInCount: agencyRows.length,
      agencyByTier,
      monthlyTrend,
      ladderProgression: computeLadderProgression(rows),
    };
  } catch (err: unknown) {
    const message = (err as Error)?.message ?? String(err);
    console.warn('[billingAdminAggregateRepo] Unexpected error:', message);
    return emptySnapshot('unavailable', message);
  }
}
