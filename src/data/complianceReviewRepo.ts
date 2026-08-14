import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import type {
  ComplianceContentType,
  ComplianceReviewRecord,
  ContentComplianceStatus,
} from '../domain/complianceReview';
import { RE_VERIFICATION_CADENCE_MONTHS, isHighestScrutinyContentType } from '../domain/complianceReview';

const KEY = 'finely.complianceReview.v1';

type Store = { records: ComplianceReviewRecord[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { records: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function nowIso() {
  return new Date().toISOString();
}

function addMonthsIso(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

export function listComplianceReviews(): ComplianceReviewRecord[] {
  return loadStore().records.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getComplianceReviewForContent(contentRef: string): ComplianceReviewRecord | null {
  return loadStore().records.find((r) => r.contentRef === contentRef) ?? null;
}

export type UpsertComplianceReviewInput = Partial<
  Pick<
    ComplianceReviewRecord,
    | 'status'
    | 'highestScrutiny'
    | 'reviewedBy'
    | 'reviewedAt'
    | 'reviewNotes'
    | 'sourceRepoRefs'
    | 'lastVerifiedAt'
    | 'nextVerificationDueAt'
  >
> & {
  contentType: ComplianceContentType;
  contentRef: string;
};

/**
 * Create or update a review record by `contentRef`. Stamps/refreshes `nextVerificationDueAt`
 * whenever a record newly becomes (or is re-confirmed) `approved`, using the content type's
 * default cadence (C0.2 — 6 months general, C0.3 — 3 months state-specific).
 */
export function upsertComplianceReview(input: UpsertComplianceReviewInput): ComplianceReviewRecord {
  const store = loadStore();
  const now = nowIso();
  const idx = store.records.findIndex((r) => r.contentRef === input.contentRef);
  const existing = idx >= 0 ? store.records[idx] : null;

  const status: ContentComplianceStatus = input.status ?? existing?.status ?? 'draft';
  const wasApproved = existing?.status === 'approved';
  const nowApproved = status === 'approved';

  const next: ComplianceReviewRecord = {
    id: existing?.id ?? newId('compliance'),
    contentType: input.contentType,
    contentRef: input.contentRef,
    status,
    highestScrutiny: input.highestScrutiny ?? existing?.highestScrutiny ?? isHighestScrutinyContentType(input.contentType),
    reviewedBy: input.reviewedBy ?? existing?.reviewedBy,
    reviewedAt: input.reviewedAt ?? existing?.reviewedAt,
    reviewNotes: input.reviewNotes ?? existing?.reviewNotes,
    sourceRepoRefs: input.sourceRepoRefs ?? existing?.sourceRepoRefs ?? [],
    lastVerifiedAt: input.lastVerifiedAt ?? existing?.lastVerifiedAt,
    nextVerificationDueAt: input.nextVerificationDueAt ?? existing?.nextVerificationDueAt,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (nowApproved && (!wasApproved || !next.nextVerificationDueAt)) {
    const cadenceMonths = RE_VERIFICATION_CADENCE_MONTHS[next.contentType];
    next.lastVerifiedAt = now;
    next.nextVerificationDueAt = addMonthsIso(now, cadenceMonths);
    next.reviewedAt = next.reviewedAt ?? now;
  }

  if (idx >= 0) store.records[idx] = next;
  else store.records.push(next);
  saveStore(store);
  return next;
}

export function approveComplianceReview(
  contentRef: string,
  reviewedBy: string,
  reviewNotes?: string,
): ComplianceReviewRecord | null {
  const existing = getComplianceReviewForContent(contentRef);
  if (!existing) return null;
  return upsertComplianceReview({
    ...existing,
    status: 'approved',
    reviewedBy,
    reviewNotes: reviewNotes ?? existing.reviewNotes,
  });
}

export function blockComplianceReview(
  contentRef: string,
  reviewedBy: string,
  reviewNotes?: string,
): ComplianceReviewRecord | null {
  const existing = getComplianceReviewForContent(contentRef);
  if (!existing) return null;
  return upsertComplianceReview({
    ...existing,
    status: 'blocked',
    reviewedBy,
    reviewNotes: reviewNotes ?? existing.reviewNotes,
  });
}

export function isRecordOverdueForVerification(record: ComplianceReviewRecord): boolean {
  if (record.status !== 'approved' || !record.nextVerificationDueAt) return false;
  return new Date(record.nextVerificationDueAt).getTime() < Date.now();
}

/** Content that still needs a human decision, or an approved record whose re-verification window lapsed. */
export function listContentNeedingReview(): ComplianceReviewRecord[] {
  return listComplianceReviews().filter(
    (r) => r.status === 'draft' || r.status === 'needs_review' || isRecordOverdueForVerification(r),
  );
}

/** Is this content ref currently publishable per the gate (approved + not overdue)? Read-only check —
 * does not itself block a build/deploy (see docs/planning/round3_final_phases_C0_C_G_D.md §C0.1). */
export function isContentApprovedForPublish(contentRef: string): boolean {
  const record = getComplianceReviewForContent(contentRef);
  if (!record) return false;
  return record.status === 'approved' && !isRecordOverdueForVerification(record);
}

// ─────────────────────────────────────────────────────────────────────────────
// C1 — public doctrine article seed records
// ─────────────────────────────────────────────────────────────────────────────

type ComplianceSeedInput = Pick<UpsertComplianceReviewInput, 'contentType' | 'contentRef' | 'sourceRepoRefs'>;

/**
 * One `ComplianceReviewRecord` per C1 doctrine article shipped this wave — every route already
 * merged into `App.tsx`/`publicSeoCatalog.ts`, gated `needs_review` pending human sign-off
 * (C0.1 step 3). Do not flip these to `approved` here — that is a human/compliance step.
 */
const C1_ARTICLE_COMPLIANCE_SEEDS: ComplianceSeedInput[] = [
  {
    contentType: 'public_article',
    contentRef: '/resources/debt-defense-validation-letters',
    sourceRepoRefs: ['debtLitigationDoctrineRepo.ts', 'caseStudiesRepo.ts'],
  },
  {
    contentType: 'public_article',
    contentRef: '/resources/debt-defense-summons-answer',
    sourceRepoRefs: ['debtLitigationDoctrineRepo.ts'],
  },
  {
    contentType: 'public_article',
    contentRef: '/resources/debt-defense-discovery-demands',
    sourceRepoRefs: ['debtLitigationDoctrineRepo.ts'],
  },
  {
    contentType: 'public_article',
    contentRef: '/resources/debt-defense-post-judgment',
    sourceRepoRefs: ['debtLitigationDoctrineRepo.ts', 'caseStudiesRepo.ts'],
  },
  {
    contentType: 'public_article',
    contentRef: '/resources/fdcpa-collector-violations',
    sourceRepoRefs: ['debtLitigationDoctrineRepo.ts', 'authorityCitationsRepo.ts'],
  },
  {
    contentType: 'public_article',
    contentRef: '/resources/business-credit-tier-matrix',
    sourceRepoRefs: ['businessCreditDoctrineRepo.ts', 'caseStudiesRepo.ts'],
  },
  {
    contentType: 'public_article',
    contentRef: '/resources/business-credit-funding-instruments',
    sourceRepoRefs: ['businessCreditDoctrineRepo.ts'],
  },
  {
    contentType: 'public_article',
    contentRef: '/resources/business-credit-building-mistakes',
    sourceRepoRefs: ['businessCreditDoctrineRepo.ts'],
  },
  {
    contentType: 'public_article',
    contentRef: '/resources/non-citizen-business-credit',
    sourceRepoRefs: ['internationalAndNonCitizenCreditRepo.ts'],
  },
  {
    contentType: 'public_article',
    contentRef: '/resources/international-credit-systems-guide',
    sourceRepoRefs: ['internationalAndNonCitizenCreditRepo.ts'],
  },
];

/**
 * Idempotent, additive-only seed: creates a `needs_review` record for each C1 article that does not
 * already have one. Never overwrites a record a human has already touched (approved/blocked/notes),
 * matching the `ensureDefaultExperiments()`-style seeding convention used elsewhere in this codebase
 * (`funnelExperimentsRepo.ts`). Call this from the compliance admin surface on mount.
 */
export function ensureC1ArticleComplianceRecordsSeeded(): void {
  for (const seed of C1_ARTICLE_COMPLIANCE_SEEDS) {
    if (getComplianceReviewForContent(seed.contentRef)) continue;
    upsertComplianceReview({ ...seed, status: 'needs_review' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C5 — outcome wizard seed record
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `ComplianceReviewRecord` for the C5 outcome wizard (`/resources/which-program-fits`) — an
 * interactive tool, not a static article, but held to the same compliance bar (it produces a
 * personalized-feeling number from real data). Left `needs_review`, not self-approved — a human
 * reviewer must flip this to `approved` in the admin panel before the route is treated as
 * publish-ready per C0.1's process gate.
 */
const C5_WIZARD_COMPLIANCE_SEEDS: ComplianceSeedInput[] = [
  {
    contentType: 'outcome_wizard',
    contentRef: '/resources/which-program-fits',
    sourceRepoRefs: ['pricingCatalog.ts', 'caseStudiesRepo.ts'],
  },
];

/**
 * Idempotent, additive-only seed for the C5 outcome wizard — same convention as
 * `ensureC1ArticleComplianceRecordsSeeded()`. Called both from the compliance admin surface on
 * mount (so the record is visible for review even if nobody has visited the public wizard yet)
 * and from the wizard page itself on mount (belt-and-suspenders — harmless if already seeded).
 */
export function ensureC5OutcomeWizardComplianceRecordsSeeded(): void {
  for (const seed of C5_WIZARD_COMPLIANCE_SEEDS) {
    if (getComplianceReviewForContent(seed.contentRef)) continue;
    upsertComplianceReview({ ...seed, status: 'needs_review' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C4 — state-specific debt-defense landing page seed records (highest scrutiny)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `ComplianceReviewRecord`s for C4's state-specific debt-defense landing pages — the single
 * highest compliance-scrutiny content category in the plan per C0.3. Every record here is created
 * with `contentType: 'state_landing_page'` (which defaults `highestScrutiny` to `true` via
 * `isHighestScrutinyContentType()`) and is left `needs_review`, never self-approved — a human
 * compliance-aware reviewer must flip each one to `approved` before its route is treated as
 * publish-ready per C0.1's process gate, and approval stamps the shorter 3-month re-verification
 * cadence (C0.2/C0.3), not the standard 6-month cadence used by `public_article`/`outcome_wizard`.
 */
const C4_STATE_COMPLIANCE_SEEDS: ComplianceSeedInput[] = [
  {
    contentType: 'state_landing_page',
    contentRef: '/resources/debt-defense-texas',
    sourceRepoRefs: ['debtLitigationDoctrineRepo.ts', 'caseStudiesRepo.ts'],
  },
  {
    contentType: 'state_landing_page',
    contentRef: '/resources/debt-defense-new-york',
    sourceRepoRefs: ['debtLitigationDoctrineRepo.ts'],
  },
  {
    contentType: 'state_landing_page',
    contentRef: '/resources/debt-defense-pennsylvania',
    sourceRepoRefs: ['debtLitigationDoctrineRepo.ts'],
  },
];

/**
 * Idempotent, additive-only seed for C4's state-specific pages — same convention as
 * `ensureC1ArticleComplianceRecordsSeeded()`/`ensureC5OutcomeWizardComplianceRecordsSeeded()`.
 * Explicitly stamps `highestScrutiny: true` on every record rather than relying only on the
 * content-type default, per C0.3's explicit instruction that state-specific content is this
 * plan's highest-scrutiny category.
 */
export function ensureC4StateDebtDefenseComplianceRecordsSeeded(): void {
  for (const seed of C4_STATE_COMPLIANCE_SEEDS) {
    if (getComplianceReviewForContent(seed.contentRef)) continue;
    upsertComplianceReview({ ...seed, status: 'needs_review', highestScrutiny: true });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C2 — public before/after proof gallery seed record
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `ComplianceReviewRecord` for the C2 public before/after proof gallery
 * (`/results/before-after`) — a visual results/outcome surface, held to the same compliance bar as
 * C1's articles (it shows real score-delta numbers, so it carries the same "results vary" scrutiny
 * as `/results` itself). Left `needs_review`, not self-approved — a human reviewer must flip this
 * to `approved` in the admin panel before the route is treated as publish-ready per C0.1's process
 * gate.
 */
const C2_GALLERY_COMPLIANCE_SEEDS: ComplianceSeedInput[] = [
  {
    contentType: 'public_article',
    contentRef: '/results/before-after',
    sourceRepoRefs: ['caseStudiesRepo.ts'],
  },
];

/**
 * Idempotent, additive-only seed for the C2 before/after gallery — same convention as
 * `ensureC1ArticleComplianceRecordsSeeded()`/`ensureC5OutcomeWizardComplianceRecordsSeeded()`.
 */
export function ensureC2BeforeAfterGalleryComplianceRecordSeeded(): void {
  for (const seed of C2_GALLERY_COMPLIANCE_SEEDS) {
    if (getComplianceReviewForContent(seed.contentRef)) continue;
    upsertComplianceReview({ ...seed, status: 'needs_review' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C3 — "vs. DIY / vs. traditional credit repair" comparison page seed record
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `ComplianceReviewRecord` for C3's comparison page (`/resources/diy-vs-traditional-vs-finely`) —
 * comparative marketing content, not state-specific legal doctrine, so it is a standard
 * `public_article` (6-month re-verification cadence), not `highestScrutiny`. Left `needs_review`,
 * not self-approved — a human reviewer must flip this to `approved` in the admin panel before the
 * route is treated as publish-ready per C0.1's process gate.
 */
const C3_COMPARISON_COMPLIANCE_SEEDS: ComplianceSeedInput[] = [
  {
    contentType: 'public_article',
    contentRef: '/resources/diy-vs-traditional-vs-finely',
    sourceRepoRefs: ['pricingCatalog.ts', 'caseStudiesRepo.ts', 'authorityCitationsRepo.ts'],
  },
];

/**
 * Idempotent, additive-only seed for C3's comparison page — same convention as
 * `ensureC5OutcomeWizardComplianceRecordsSeeded()`. Called both from the compliance admin surface
 * on mount and from the comparison page itself on mount (belt-and-suspenders).
 */
export function ensureC3ComparisonPageComplianceRecordSeeded(): void {
  for (const seed of C3_COMPARISON_COMPLIANCE_SEEDS) {
    if (getComplianceReviewForContent(seed.contentRef)) continue;
    upsertComplianceReview({ ...seed, status: 'needs_review' });
  }
}
