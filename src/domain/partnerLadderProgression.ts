/**
 * Lifecycle-stage-aware "next rung" recommendation (Phase L, L2).
 *
 * Pure, unit-testable logic — no I/O. Shares its "does this agreement count as
 * revenue / what price ranks a rung" definition with `billingAdminAggregateRepo.ts`'s
 * `computeLadderProgression()` (built for E1a.3, the admin ladder-graduation metric) by
 * importing `REVENUE_RECOGNIZED_STATUSES` and `packageRungPriceForAgreement()` from that
 * same module rather than re-deriving them. This keeps the admin-facing "% of partners who
 * graduate" metric and this partner-facing "here's your next rung" recommendation from ever
 * telling contradictory stories about the same partner's agreement history.
 *
 * Ladder order (per the enhancement plan's E1a.3 framing): Personal Credit Restore →
 * Wealth Builder → Business Credit. A partner already at/above Business Credit has no
 * further rung defined here — no upsell is forced onto categories (debt/legal, privacy,
 * tradeline, agency, bundles) that don't have a clearly-scoped "next step" in that ladder.
 */
import type { Agreement, AgreementStatus } from './billing';
import {
  REVENUE_RECOGNIZED_STATUSES,
  packageRungPriceForAgreement,
} from '../data/billingAdminAggregateRepo';
import { getPackageById, getPackagesByCategory, type PricingCategory, type PricingPackage } from '../config/pricingCatalog';

/** Categories participating in the cross-sell ladder, in graduation order. */
const LADDER_ORDER: PricingCategory[] = ['personal_credit', 'wealth_builder', 'business_credit'];

export type NextRungRecommendation = {
  /** Human-readable name of the partner's current (highest-rung) package. */
  fromTier: string;
  /** Human-readable name of the recommended next-rung package. */
  toTier: string;
  /** One honest sentence explaining why this recommendation is showing now. */
  rationale: string;
  /** Category the recommended package belongs to — drives the CTA's pricing-tab deep link. */
  toCategory: PricingCategory;
  /** Recommended package id from `pricingCatalog.ts` — the concrete "next rung" tier. */
  toPackageId: string;
};

export type PartnerLadderProgressionInput = {
  /** The partner's known agreements (any status — this function filters to revenue-recognized ones internally). */
  activeAgreements: Agreement[];
  /**
   * Optional credit-score readings, oldest → newest. Used as the stabilization signal for an
   * `active` (not yet `completed`) current-tier agreement — a flat/positive trend over the most
   * recent readings is read as "this partner has stabilized and is far along," not proof of a
   * finished program. When omitted, only a `completed` agreement can trigger a recommendation.
   */
  creditScoreTrend?: number[];
};

/** Minimum number of trailing score readings required to call a trend "stabilized." */
const MIN_TREND_SAMPLES = 3;

function isRevenueRecognized(status: AgreementStatus): boolean {
  return REVENUE_RECOGNIZED_STATUSES.has(status);
}

/** Flat or improving across the most recent readings — never declining. */
function isScoreTrendStabilizedOrImproving(trend: number[] | undefined): boolean {
  if (!trend || trend.length < MIN_TREND_SAMPLES) return false;
  const recent = trend.slice(-MIN_TREND_SAMPLES);
  for (let i = 1; i < recent.length; i += 1) {
    if (recent[i] < recent[i - 1]) return false;
  }
  return true;
}

/** Cheapest public, non-custom-quote package in a category — the natural "entry rung" to recommend. */
function entryPackageForCategory(category: PricingCategory): PricingPackage | undefined {
  return getPackagesByCategory(category)
    .filter((p) => !p.isCustomQuote && p.priceAmount > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder)[0];
}

/**
 * Determine the partner's current highest-rung agreement, and — if they look graduation-ready
 * on that rung — the natural next-rung package to recommend. Returns `null` whenever there is
 * no honest recommendation to make (no purchase yet, already at/above the top of the ladder,
 * already holds the next tier, or not yet graduation-ready on the current one).
 */
export function recommendNextRung(input: PartnerLadderProgressionInput): NextRungRecommendation | null {
  const counted = (input.activeAgreements ?? []).filter((a) => isRevenueRecognized(a.status) && a.packageId);
  if (!counted.length) return null;

  let currentAgreement = counted[0];
  let currentPrice = packageRungPriceForAgreement(currentAgreement);
  for (const a of counted.slice(1)) {
    const price = packageRungPriceForAgreement(a);
    if (price > currentPrice) {
      currentAgreement = a;
      currentPrice = price;
    }
  }

  const currentPkg = getPackageById(currentAgreement.packageId);
  if (!currentPkg) return null;

  const ladderIdx = LADDER_ORDER.indexOf(currentPkg.category);
  if (ladderIdx === -1 || ladderIdx >= LADDER_ORDER.length - 1) return null; // not on the ladder, or already at the top rung

  const graduationReady =
    currentAgreement.status === 'completed' || isScoreTrendStabilizedOrImproving(input.creditScoreTrend);
  if (!graduationReady) return null;

  const nextCategory = LADDER_ORDER[ladderIdx + 1];

  // Never recommend a tier the partner already holds (active or completed) at an equal-or-higher rung.
  const alreadyHasNextTier = counted.some((a) => {
    const pkg = getPackageById(a.packageId);
    return Boolean(pkg && pkg.category === nextCategory);
  });
  if (alreadyHasNextTier) return null;

  const nextPkg = entryPackageForCategory(nextCategory);
  if (!nextPkg) return null;

  const rationale =
    currentAgreement.status === 'completed'
      ? `You've completed ${currentPkg.name} — partners at your stage often move next into ${nextPkg.name} to keep building toward bigger goals.`
      : `Your credit score has been flat or improving for a while on ${currentPkg.name} — a natural next step from here is ${nextPkg.name}.`;

  return {
    fromTier: currentPkg.name,
    toTier: nextPkg.name,
    rationale,
    toCategory: nextCategory,
    toPackageId: nextPkg.id,
  };
}
