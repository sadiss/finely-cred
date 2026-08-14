/**
 * Pure evaluation logic for the compliance review gate — mirrors the shape of
 * `evaluateDisclosureReview()` in `socialDisclosureLayer.ts`, but for doctrine-derived
 * public content (articles, state landing pages, outcome wizards) instead of social posts.
 */
import type { ComplianceReviewRecord } from '../domain/complianceReview';

export type ComplianceReadinessInput = Pick<
  ComplianceReviewRecord,
  'status' | 'nextVerificationDueAt' | 'sourceRepoRefs'
>;

export type ComplianceReadinessOptions = {
  /** Does the page/article render the standard "results vary / not legal advice" footnote
   * (`FINELY_OS_COMPLIANCE_FOOTNOTE` token)? The authoring page/component knows this, not the repo. */
  hasComplianceFootnote: boolean;
  /** Optional version/commit marker of the doctrine repo this content was sourced from, for future
   * drift detection (e.g. flag content whose source repo has changed since last approval). */
  sourceRepoVersion?: string;
};

export function evaluateContentComplianceReadiness(
  record: ComplianceReadinessInput,
  opts: ComplianceReadinessOptions,
): { readyToPublish: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (!opts.hasComplianceFootnote) {
    reasons.push('Missing "results vary / not legal advice" compliance footnote.');
  }
  if (record.status !== 'approved') {
    reasons.push(`Compliance status is "${record.status}", not "approved".`);
  }
  if (!record.sourceRepoRefs.length) {
    reasons.push('No source doctrine repo reference recorded for this content.');
  }
  if (record.nextVerificationDueAt && new Date(record.nextVerificationDueAt).getTime() < Date.now()) {
    reasons.push('Re-verification window has lapsed — content must be re-reviewed before publish.');
  }

  return { readyToPublish: reasons.length === 0, reasons };
}
