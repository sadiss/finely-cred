/**
 * Pure computation engine for the public outcome wizard (Phase C5). No UI dependency —
 * every function here is unit-testable in isolation from `caseStudiesRepo.ts` /
 * `pricingCatalog.ts` data alone.
 */
import { CASE_STUDIES, type CaseStudy } from '../data/caseStudiesRepo';
import { getDebtPackageGuidanceForBalance } from '../config/pricingCatalog';
import {
  STARTING_SCORE_BANDS,
  type DebtLitigationStatus,
  type OutcomeRangeResult,
  type OutcomeUrgencyLevel,
  type OutcomeWizardInput,
  type OutcomeWizardResult,
  type StartingScoreBand,
} from '../domain/outcomeWizard';

export const OUTCOME_WIZARD_DISCLAIMER =
  'Results vary. Individual outcomes depend on your unique credit profile, documentation, income, and cooperation with the process. This range is drawn from past documented case studies — it is an estimate, not a promise, guarantee, or legal/financial advice.';

/** Below this many matching case studies, a band-level range is treated as too thin to stand alone. */
const MIN_SAMPLE_FOR_BAND_CONFIDENCE = 3;

function scoreDeltasFrom(studies: CaseStudy[]): number[] {
  return studies
    .filter((cs) => cs.startingScore != null && cs.endingScore != null)
    .map((cs) => (cs.endingScore as number) - (cs.startingScore as number));
}

function summarizeDeltas(deltas: number[]): { low: number; high: number; median: number } {
  const sorted = [...deltas].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? Math.round(((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2) : (sorted[mid] as number);
  return { low: sorted[0] as number, high: sorted[sorted.length - 1] as number, median };
}

/** Which starting-score band a raw score number falls into, if any. */
export function findBandForScore(score: number): StartingScoreBand | undefined {
  return STARTING_SCORE_BANDS.find((b) => score >= b.min && score <= b.max)?.id;
}

/**
 * Honest, layered outcome-range lookup: try the exact category + starting-score band first;
 * if too few (or zero) case studies match, fall back one step at a time — always naming the
 * real sample size and what it actually represents, never presenting a small `n` as a
 * big-data statistic (C5 acceptance criterion).
 */
export function computeOutcomeRangeForBand(
  category: OutcomeWizardInput['category'],
  band: StartingScoreBand,
): OutcomeRangeResult {
  const bandDef = STARTING_SCORE_BANDS.find((b) => b.id === band);
  if (!bandDef) {
    return {
      hasData: false,
      lowDelta: null,
      highDelta: null,
      medianDelta: null,
      sampleSize: 0,
      sampleScope: 'none',
      sampleSizeNote: 'Pick a starting score band to see a real outcome range from past case studies.',
    };
  }

  const categoryBandStudies = CASE_STUDIES.filter(
    (cs) =>
      cs.category === category &&
      cs.startingScore != null &&
      cs.startingScore >= bandDef.min &&
      cs.startingScore <= bandDef.max,
  );
  const categoryBandDeltas = scoreDeltasFrom(categoryBandStudies);

  if (categoryBandDeltas.length >= MIN_SAMPLE_FOR_BAND_CONFIDENCE) {
    const { low, high, median } = summarizeDeltas(categoryBandDeltas);
    return {
      hasData: true,
      lowDelta: low,
      highDelta: high,
      medianDelta: median,
      sampleSize: categoryBandDeltas.length,
      sampleScope: 'category_band',
      sampleSizeNote: `Based on ${categoryBandDeltas.length} documented case studies that started in the ${bandDef.label} range.`,
    };
  }

  // Fallback 1: any case study in the same category with score data, regardless of exact band.
  const categoryDeltas = scoreDeltasFrom(CASE_STUDIES.filter((cs) => cs.category === category));
  if (categoryDeltas.length > 0) {
    const { low, high, median } = summarizeDeltas(categoryDeltas);
    const exactBandCount = categoryBandDeltas.length;
    const note = exactBandCount
      ? `Limited data for this exact starting point — only ${exactBandCount} case ${exactBandCount === 1 ? 'study starts' : 'studies start'} in the ${bandDef.label} range, so this shows our overall average across ${categoryDeltas.length} documented case studies in this category instead.`
      : `No documented case studies start in the ${bandDef.label} range yet — showing our overall average across ${categoryDeltas.length} documented case studies in this category instead.`;
    return {
      hasData: true,
      lowDelta: low,
      highDelta: high,
      medianDelta: median,
      sampleSize: categoryDeltas.length,
      sampleScope: 'category_overall',
      sampleSizeNote: note,
    };
  }

  // Fallback 2: sitewide average across every documented case study with score data.
  const allDeltas = scoreDeltasFrom(CASE_STUDIES);
  if (allDeltas.length > 0) {
    const { low, high, median } = summarizeDeltas(allDeltas);
    return {
      hasData: true,
      lowDelta: low,
      highDelta: high,
      medianDelta: median,
      sampleSize: allDeltas.length,
      sampleScope: 'sitewide_overall',
      sampleSizeNote: `No documented before/after scores in this category yet — showing our sitewide average based on ${allDeltas.length} documented case studies with score data instead.`,
    };
  }

  return {
    hasData: false,
    lowDelta: null,
    highDelta: null,
    medianDelta: null,
    sampleSize: 0,
    sampleScope: 'none',
    sampleSizeNote: 'We do not have documented before/after score data yet — book a free strategy session for a personalized read.',
  };
}

function urgencyFromLitigationStatus(status: DebtLitigationStatus | undefined): {
  level: OutcomeUrgencyLevel;
  note?: string;
} {
  switch (status) {
    case 'judgment_or_garnishment':
      return {
        level: 'critical',
        note: 'A judgment or garnishment changes the timeline — book a strategy session now instead of self-checkout so we can map the fastest safe move first.',
      };
    case 'lawsuit_filed':
      return {
        level: 'critical',
        note: 'An active lawsuit has real deadlines (an answer is usually due on a short clock). Talk to a strategist before choosing a package so nothing is missed.',
      };
    case 'collector_threatening':
      return {
        level: 'elevated',
        note: 'A threat to sue is a good time to validate the debt in writing before it becomes a filed case.',
      };
    default:
      return { level: 'normal' };
  }
}

/** Compute the full wizard result: package recommendation (debt-balance path) + outcome range (score-band path). */
export function computeOutcomeWizardResult(input: OutcomeWizardInput): OutcomeWizardResult {
  let recommendedPackage: OutcomeWizardResult['recommendedPackage'];
  let packageGuidanceNote: string | undefined;
  let urgencyLevel: OutcomeUrgencyLevel = 'normal';
  let urgencyNote: string | undefined;

  if (input.category === 'debt_legal') {
    if (input.debtBalanceCents != null) {
      recommendedPackage = getDebtPackageGuidanceForBalance(input.debtBalanceCents);
      packageGuidanceNote = 'Illustrative guidance only — your exact package and pricing are confirmed after intake.';
    }
    const urgency = urgencyFromLitigationStatus(input.litigationStatus);
    urgencyLevel = urgency.level;
    urgencyNote = urgency.note;
  }

  const outcomeRange: OutcomeRangeResult = input.startingScoreBand
    ? computeOutcomeRangeForBand(input.category, input.startingScoreBand)
    : {
        hasData: false,
        lowDelta: null,
        highDelta: null,
        medianDelta: null,
        sampleSize: 0,
        sampleScope: 'none',
        sampleSizeNote: 'Pick your starting score band to see a real outcome range from past case studies.',
      };

  return {
    recommendedPackage,
    packageGuidanceNote,
    urgencyLevel,
    urgencyNote,
    outcomeRange,
    disclaimer: OUTCOME_WIZARD_DISCLAIMER,
  };
}
