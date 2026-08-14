/**
 * Public "which program fits your situation" outcome wizard (Phase C5).
 *
 * Two real, reusable data sources power this wizard — nothing here fabricates
 * a number:
 * - `getDebtPackageGuidanceForBalance()` (`src/config/pricingCatalog.ts`) — the same
 *   debt-balance → package lookup already used by the inline chip picker on
 *   `PricingPage.tsx`'s Debt & Legal tab. Reused, never reimplemented.
 * - `CaseStudy.startingScore` / `endingScore` pairs (`src/data/caseStudiesRepo.ts`) —
 *   real documented case studies. The outcome range shown to a visitor is computed
 *   from however many real entries match their category + starting-score band, and
 *   the sample size behind that range is always shown honestly (see
 *   `src/lib/outcomeWizardEngine.ts`'s fallback ladder).
 */
import type { PricingCategory, PricingPackage } from '../config/pricingCatalog';

export type OutcomeWizardStep = 'situation' | 'debt_details' | 'starting_score' | 'result';

/** How far along a visitor's debt has escalated — feeds urgency framing, not the package match itself. */
export type DebtLitigationStatus = 'none' | 'collector_threatening' | 'lawsuit_filed' | 'judgment_or_garnishment';

export const DEBT_LITIGATION_STATUS_OPTIONS: { id: DebtLitigationStatus; label: string }[] = [
  { id: 'none', label: 'Nothing filed — collections or validation stage' },
  { id: 'collector_threatening', label: 'A collector is threatening to sue' },
  { id: 'lawsuit_filed', label: 'Lawsuit filed / summons received' },
  { id: 'judgment_or_garnishment', label: 'Judgment entered or wages being garnished' },
];

export type StartingScoreBand = '300-579' | '580-669' | '670-739' | '740-799' | '800-850';

export const STARTING_SCORE_BANDS: { id: StartingScoreBand; label: string; min: number; max: number }[] = [
  { id: '300-579', label: '300–579 · Poor', min: 300, max: 579 },
  { id: '580-669', label: '580–669 · Fair', min: 580, max: 669 },
  { id: '670-739', label: '670–739 · Good', min: 670, max: 739 },
  { id: '740-799', label: '740–799 · Very good', min: 740, max: 799 },
  { id: '800-850', label: '800–850 · Exceptional', min: 800, max: 850 },
];

/** Categories this wizard supports — must exist as real `PricingPackage`/`CaseStudy` categories. */
export const WIZARD_CATEGORIES: { id: PricingCategory; label: string; blurb: string }[] = [
  {
    id: 'personal_credit',
    label: 'Personal credit',
    blurb: 'Late payments, collections, charge-offs, or errors on your personal report.',
  },
  {
    id: 'debt_legal',
    label: 'Debt & collections',
    blurb: 'A collector, a lawsuit, a judgment, or garnishment already in motion.',
  },
  {
    id: 'business_credit',
    label: 'Business credit',
    blurb: 'Building fundability, vendor lines, or funding capacity for your business.',
  },
  {
    id: 'wealth_builder',
    label: 'Wealth & funding',
    blurb: 'Already credit-stable and moving toward a structured capital plan.',
  },
];

/** Representative cents per debt-balance band — same shape/values as PricingPage.tsx's inline picker for consistency. */
export const WIZARD_DEBT_BALANCE_BANDS: { label: string; amountCents: number }[] = [
  { label: 'Under $10k', amountCents: 500_000 },
  { label: '$10k–$25k', amountCents: 1_500_000 },
  { label: '$25k–$100k', amountCents: 5_000_000 },
  { label: '$100k+', amountCents: 15_000_000 },
];

export interface OutcomeWizardInput {
  category: PricingCategory;
  debtBalanceCents?: number;
  litigationStatus?: DebtLitigationStatus;
  startingScoreBand?: StartingScoreBand;
}

export type OutcomeRangeSampleScope = 'category_band' | 'category_overall' | 'sitewide_overall' | 'none';

export interface OutcomeRangeResult {
  hasData: boolean;
  lowDelta: number | null;
  highDelta: number | null;
  medianDelta: number | null;
  /** Real count of case studies backing this range — always rendered, never hidden. */
  sampleSize: number;
  sampleScope: OutcomeRangeSampleScope;
  /** Human sentence explaining exactly what the sample size means (small-n honesty, per C5 spec). */
  sampleSizeNote: string;
}

export type OutcomeUrgencyLevel = 'normal' | 'elevated' | 'critical';

export interface OutcomeWizardResult {
  recommendedPackage?: PricingPackage;
  packageGuidanceNote?: string;
  urgencyLevel: OutcomeUrgencyLevel;
  urgencyNote?: string;
  outcomeRange: OutcomeRangeResult;
  disclaimer: string;
}
