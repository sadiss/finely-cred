/**
 * Legal/compliance pre-publish review gate for doctrine-derived public content
 * (debt-litigation, business-credit, non-citizen/international doctrine repos).
 *
 * Cloned in spirit from `domain`-level social disclosure status tracking
 * (`socialHubRepo.ts`'s `complianceStatus` + `socialDisclosureLayer.ts`), but scoped
 * to public articles/pages/wizards instead of social posts. Every future public
 * route derived from a doctrine repo must have an `approved` `ComplianceReviewRecord`
 * here before a later team wires it into the actual publish flow.
 */

export type ContentComplianceStatus = 'draft' | 'needs_review' | 'approved' | 'blocked';

export type ComplianceContentType = 'public_article' | 'state_landing_page' | 'outcome_wizard';

export type ComplianceReviewRecord = {
  id: string;
  contentType: ComplianceContentType;
  /** Route or article id this record gates, e.g. '/resources/debt-defense-validation-letters'. */
  contentRef: string;
  status: ContentComplianceStatus;
  /** True for highest-scrutiny content (state-specific landing pages) — distinct from standard content. */
  highestScrutiny?: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  /** Which doctrine repo(s) this content's claims are sourced from, e.g. ['debtLitigationDoctrineRepo.ts']. */
  sourceRepoRefs: string[];
  lastVerifiedAt?: string;
  /** Recurring re-verification due date — 6 months default, 3 months for state-specific pages (C0.2/C0.3). */
  nextVerificationDueAt?: string;
  createdAt: string;
  updatedAt: string;
};

/** Recurring re-verification cadence, in months, per content type (C0.2). */
export const RE_VERIFICATION_CADENCE_MONTHS: Record<ComplianceContentType, number> = {
  public_article: 6,
  outcome_wizard: 6,
  // State-specific pages carry the shortest cadence — statutes/garnishment/service-of-process
  // rules vary by state and change more often than general educational content (C0.3).
  state_landing_page: 3,
};

/** State-specific landing pages are "highest scrutiny" content by default (C0.3). */
export function isHighestScrutinyContentType(contentType: ComplianceContentType): boolean {
  return contentType === 'state_landing_page';
}

export const CONTENT_TYPE_LABELS: Record<ComplianceContentType, string> = {
  public_article: 'Public article',
  state_landing_page: 'State landing page',
  outcome_wizard: 'Outcome wizard',
};
