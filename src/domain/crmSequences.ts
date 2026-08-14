import type { CrmRecordStage } from './crmRecords';
import type { ProspectTarget } from './crmProspects';

export type CrmSequenceStepType = 'wait' | 'email' | 'task' | 'stage_move';

/**
 * G3 — real A/B variant-testing primitive for the CRM sequence send path.
 * `control` is implicit: an email step's base `emailSubject`/`emailBody`
 * fields ARE the control arm, so no `variants.control` entry is required to
 * run a test — only `variants.variant_a` needs content. This keeps every
 * pre-existing sequence (none of which set `variants`) byte-identical in
 * behavior (see `crmSequenceStepHasVariants` below).
 */
export type CrmSequenceVariantKey = 'control' | 'variant_a';

export type CrmSequenceEmailVariantContent = {
  emailSubject?: string;
  emailBody?: string;
};

export type CrmSequenceStepVariants = Partial<Record<CrmSequenceVariantKey, CrmSequenceEmailVariantContent>>;

export type CrmSequenceStep = {
  id: string;
  type: CrmSequenceStepType;
  label: string;
  waitDays?: number;
  emailSubject?: string;
  emailBody?: string;
  taskTitle?: string;
  targetStage?: CrmRecordStage;
  /** Optional A/B content for `type: 'email'` steps — see `CrmSequenceVariantKey` above. */
  variants?: CrmSequenceStepVariants;
};

export type CrmSequence = {
  id: string;
  name: string;
  target: ProspectTarget;
  enabled: boolean;
  steps: CrmSequenceStep[];
  createdAt: string;
  updatedAt: string;
};

/** Active follow-up run for a CRM record on a sequence. */
export type CrmSequenceEnrollment = {
  id: string;
  sequenceId: string;
  recordId: string;
  enrolledAt: string;
  updatedAt: string;
  /** Last executed action-step index (-1 before first action). */
  lastCompletedStepIndex: number;
  completedAt?: string;
  pausedAt?: string;
  /**
   * G3 — sticky per-enrollment A/B bucket, assigned once (at enrollment time
   * if the sequence already has a variant-bearing step, or lazily the first
   * time a variant-bearing step is actually sent). Deterministic from the
   * enrollment id via `assignCrmSequenceVariantForSeed`, so the client engine
   * (`runCrmSequenceEngine.ts`) and the server-side platform-cron engine
   * (`processDueCrmSequenceSteps.ts`) always agree on the same bucket for the
   * same enrollment, regardless of which one processes a given due step first.
   */
  assignedVariant?: CrmSequenceVariantKey;
  /** CRM stage the record was in at enrollment time — the baseline for the "did it advance?" outcome proxy. */
  stageAtEnrollment?: CrmRecordStage;
};

export function nowIso() {
  return new Date().toISOString();
}

/** True only when the step has real (non-blank) `variant_a` content — an empty `variants` object never triggers a test. */
export function crmSequenceStepHasVariants(step: CrmSequenceStep): boolean {
  const a = step.variants?.variant_a;
  return !!a && (!!a.emailSubject?.trim() || !!a.emailBody?.trim());
}

/**
 * Deterministic hash-based variant assignment. Given the same seed (an
 * enrollment id), this ALWAYS returns the same variant — the mechanism that
 * keeps the client and server-side sequence engines from ever disagreeing
 * about which arm a given enrollment belongs to, without needing to read
 * back the other engine's write first. Duplicated verbatim (same algorithm)
 * in `supabase/functions/_shared/processDueCrmSequenceSteps.ts` since edge
 * functions can't import from `src/`.
 */
export function assignCrmSequenceVariantForSeed(seed: string): CrmSequenceVariantKey {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % 2 === 0 ? 'control' : 'variant_a';
}

/** Resolves an enrollment's bucket, recomputing deterministically if it hasn't been persisted yet. */
export function resolveCrmSequenceEnrollmentVariant(enrollment: CrmSequenceEnrollment): CrmSequenceVariantKey {
  return enrollment.assignedVariant ?? assignCrmSequenceVariantForSeed(enrollment.id);
}

/** Picks the email content to actually send for a given resolved variant, falling back to the step's base (control) fields. */
export function resolveCrmSequenceStepEmailContent(
  step: CrmSequenceStep,
  variantKey: CrmSequenceVariantKey | undefined,
): { emailSubject?: string; emailBody?: string } {
  const override = variantKey ? step.variants?.[variantKey] : undefined;
  return {
    emailSubject: override?.emailSubject?.trim() || step.emailSubject,
    emailBody: override?.emailBody?.trim() || step.emailBody,
  };
}

/** Simple outcome proxy: did the record's CRM stage change since it entered this sequence? */
export function hasCrmSequenceEnrollmentAdvancedStage(
  enrollment: CrmSequenceEnrollment,
  currentStage: CrmRecordStage | undefined,
): boolean {
  if (!enrollment.stageAtEnrollment || !currentStage) return false;
  return currentStage !== enrollment.stageAtEnrollment;
}
