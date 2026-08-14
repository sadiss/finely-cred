import type { CrmSequence, CrmSequenceVariantKey } from '../../../domain/crmSequences';
import { crmSequenceStepHasVariants, hasCrmSequenceEnrollmentAdvancedStage } from '../../../domain/crmSequences';
import { listCrmEnrollmentsBySequence } from '../../../data/crmSequencesRepo';
import { getCrmRecord } from '../../../data/crmRecordsRepo';

const VARIANT_KEYS: CrmSequenceVariantKey[] = ['control', 'variant_a'];

export type CrmSequenceVariantStat = {
  variant: CrmSequenceVariantKey;
  /** Total enrollments bucketed into this arm. */
  enrolled: number;
  /** Enrollments where the outcome window has closed (or the record already advanced) — the honest denominator for `advanceRate`. */
  resolved: number;
  /** Of `resolved`, how many advanced to a different CRM stage than the one they enrolled with. */
  advanced: number;
  /** Still inside the observation window and hasn't advanced yet — not counted in `advanceRate`. */
  pending: number;
  /** `advanced / resolved`, or 0 when there is no resolved sample yet. */
  advanceRate: number;
};

export type CrmSequenceVariantResults = {
  sequenceId: string;
  /** Whether this sequence currently has at least one step with real variant_a content configured. */
  hasVariantSteps: boolean;
  windowDays: number;
  stats: CrmSequenceVariantStat[];
  /** The arm with the higher advance rate, only set once at least one resolved sample exists on each side. */
  leadingVariant?: CrmSequenceVariantKey;
  /** Mandatory honesty caveat — mirrors the sample-size/completeness pattern used by G2's AgentAttributionPanel and C5's outcome wizard. */
  sampleSizeNote: string;
};

/**
 * G3 results view — pure, unit-testable aggregation over already-loaded
 * local enrollments + CRM records. Deliberately client-side/local-only: it
 * reads this browser's `crmSequencesRepo`/`crmRecordsRepo`, so (same
 * completeness caveat as G2's attribution panel) enrollments processed
 * server-side by `processDueCrmSequenceSteps.ts` while no admin tab was open
 * are only reflected here once their `crm_sequence_enrollments` row has been
 * pulled back into this browser's local store (or if this same browser was
 * the one that originally created the enrollment, which is the common case
 * since enrollment creation itself is still client-only).
 */
export function computeCrmSequenceVariantResults(
  sequence: CrmSequence,
  opts?: { windowDays?: number },
): CrmSequenceVariantResults {
  const windowDays = Math.max(1, opts?.windowDays ?? 14);
  const windowMs = windowDays * 86_400_000;
  const nowMs = Date.now();
  const hasVariantSteps = sequence.steps.some(crmSequenceStepHasVariants);

  const groups = new Map<CrmSequenceVariantKey, { enrolled: number; resolved: number; advanced: number }>();
  for (const enrollment of listCrmEnrollmentsBySequence(sequence.id)) {
    if (!enrollment.assignedVariant) continue;
    const g = groups.get(enrollment.assignedVariant) ?? { enrolled: 0, resolved: 0, advanced: 0 };
    g.enrolled += 1;

    const record = getCrmRecord(enrollment.recordId);
    const advanced = hasCrmSequenceEnrollmentAdvancedStage(enrollment, record?.stage);
    const enrolledMs = Date.parse(enrollment.enrolledAt);
    const windowElapsed = Number.isFinite(enrolledMs) ? nowMs - enrolledMs >= windowMs : true;

    if (advanced || windowElapsed) {
      g.resolved += 1;
      if (advanced) g.advanced += 1;
    }
    groups.set(enrollment.assignedVariant, g);
  }

  const stats: CrmSequenceVariantStat[] = VARIANT_KEYS.map((variant) => {
    const g = groups.get(variant) ?? { enrolled: 0, resolved: 0, advanced: 0 };
    return {
      variant,
      enrolled: g.enrolled,
      resolved: g.resolved,
      advanced: g.advanced,
      pending: g.enrolled - g.resolved,
      advanceRate: g.resolved > 0 ? g.advanced / g.resolved : 0,
    };
  });

  const [controlStat, variantAStat] = stats;
  const leadingVariant =
    controlStat.resolved > 0 && variantAStat.resolved > 0
      ? controlStat.advanceRate === variantAStat.advanceRate
        ? undefined
        : controlStat.advanceRate > variantAStat.advanceRate
          ? 'control'
          : 'variant_a'
      : undefined;

  const totalResolved = stats.reduce((n, s) => n + s.resolved, 0);
  const totalEnrolled = stats.reduce((n, s) => n + s.enrolled, 0);

  return {
    sequenceId: sequence.id,
    hasVariantSteps,
    windowDays,
    stats,
    leadingVariant,
    sampleSizeNote: totalEnrolled
      ? `Based on ${totalResolved} resolved of ${totalEnrolled} bucketed enrollment(s) (${windowDays}-day stage-advance window) — as complete as this browser's local activity history; sends processed server-side while no admin tab was open aren't reflected until that data syncs back.`
      : `No enrollments bucketed into an A/B arm yet — assignment happens the first time a step with a variant is due.`,
  };
}
