# Round 3 — Finalized Execution Spec: Phases C0, C, G, D

**Status:** Round 3 (finalize). This document takes Phase C0 (Compliance/Legal Review Gate), Phase C (Public SEO Content, C1–C5), Phase G (Agent Intelligence, G1/G2/G2b/G3/G4), and Phase D (Pricing & Funnel Simplification, D1–D5) from `docs/planning/enhancement_plan_draft_v2.md` and turns each into an execution-ready spec — file paths, migrations, step-by-step approach, ownership boundaries, dependencies, acceptance criteria, effort. It does **not** re-litigate Phase A, B, E, F, K, H, I, J, L — those stay as scoped in draft v2 pending a separate Round 3 pass.

**Method:** Read `enhancement_plan_draft_v2.md` and all three Round 2 critiques in full. Then spot-checked the actual source files for every claim that changes a file-ownership boundary, effort estimate, or scope decision — not just the five highest-ambiguity items requested, but every item where draft v2 or the Round 2 critiques cited a specific line number or file. Every "Verified" note below cites the exact file/line read in this pass. No application code was changed.

---

## 0. Read this first — the three explicit resolutions

### 0.1 D1 + D2 + D5 file-ownership — CONFIRMED, and here is the concrete boundary

**Verified directly against `src/pages/PricingPage.tsx` (582 lines, read in full) and `src/config/pricingCatalog.ts` (2,161 lines, read in full).**

All three items touch the same three artifacts:

1. **`getPackagesForTab()`** (`src/pages/PricingPage.tsx:158-196`) — one `switch` statement keyed on `activeTab`. The `personal_credit` case (lines 160-176) is D1's target (filters `personalCreditPackages` by `personalLane`, excludes `chexsystems_cleanup`/`early_warning_cleanup`/`personal_free`). The `banking_reports` case (lines 177-180) is D5's target (the exact two IDs D1's `personal_credit` case excludes). The `debt_legal` case (line 183-184) is D2's target.
2. **`TABS` constant + `TAB_ACCENT` map** (`src/pages/PricingPage.tsx:65-87`) — D5 specifically may remove/fold the `banking_reports` tab entry; D1/D2 do not touch the tab list itself but do touch the tab's downstream rendering (the `personalLane` toggle at lines 406-422, the debt-legal balance-guidance table at lines 439-467 which iterates `debtLegalPackages.filter(p => p.debtBalanceGuidance)`).
3. **`personalCreditPackages` and `debtLegalPackages` arrays** (`src/config/pricingCatalog.ts:171-627` and `:806-1042`) — D1 collapses personal restore from 6 named DFY tiers (`personal_restore_starter` "Starter" → `personal_restore` "Pro" → `personal_platinum` "Elite" → `personal_restore_5000` "Supreme" → `personal_restore_7000` "Apex" → `personal_restore_10000` "Dynasty", confirmed exactly 6 restore-tier entries at `pricingCatalog.ts:306-456`) to 3–4 + custom-quote. D2 collapses `debtLegalPackages`'s 8 tiers (`debt_kill_diy` → `debt_kill_starter_dfy` → `debt_kill_pro` → `debt_kill_plus` → `debt_kill_premium` → `debt_kill_high_balance` → `debt_kill_institutional` → `debt_kill_enterprise`, confirmed exactly 8 entries at `pricingCatalog.ts:806-1042`) to 3–4 headline tiers.

**Why this cannot be 3 parallel agents:** any two of D1/D2/D5 running concurrently on `getPackagesForTab()` will produce a merge conflict on the same ~40-line function, and D1/D5 additionally share the same filter predicate (`id === 'chexsystems_cleanup' || id === 'early_warning_cleanup'`) as inverse conditions of each other — if D1 changes the personal-lane filter logic without D5's tab decision already being made, D1's edit will need to be redone once D5 lands.

**Concrete sequencing (one agent, three sequential steps, single PR or three stacked commits):**

| Step | Owns | Does | Must NOT touch |
|---|---|---|---|
| **1. D5 first** (smallest, decides the tab structure everything else renders inside) | `PricingPage.tsx` `TABS`/`TAB_ACCENT`, `getPackagesForTab()`'s `banking_reports` case | Decide: keep `banking_reports` as its own tab (current state) **or** fold the ChexSystems/Early Warning pair into the `personal_credit` tab as a labeled sub-section. Recommendation: **keep as separate tab** — it's a distinct product (banking-report disputes, not credit-bureau disputes) and folding it in would make D1's already-simplified personal tab noisier again. If kept separate, D5's task shrinks to: confirm copy/positioning only (no functional change needed) — **downgrade D5 to a no-op verification step**, not a rebuild. | `personalCreditPackages`/`debtLegalPackages` arrays |
| **2. D1 second** | `pricingCatalog.ts` `personalCreditPackages` array (the 6 `personal_restore*` entries + their `entitlementKeys` chains), `PricingPage.tsx`'s `personal_credit` case in `getPackagesForTab()` | Collapse Starter/Pro/Elite/Supreme/Apex/Dynasty → e.g. Starter/Pro/Elite + a "Custom (Supreme+)" quote-only tier. **Entitlement-key chain risk:** each tier's `entitlementKeys` array is cumulative (e.g. `personal_restore_10000` includes all 6 prior keys) — any partner who already purchased a collapsed-away tier must keep their existing entitlement keys resolvable; do not delete old package IDs from `pricingCatalog.ts`, instead set `isPublic: false` on the ones being retired from the public tab so `getPackageById()`/checkout/webhook code (which looks up by ID) still resolves them for existing partners. Add a new custom-quote pseudo-tier (`priceAmount: 0`, `badge: 'Custom quote'`) that routes to intake instead of checkout. | `debtLegalPackages`, `banking_reports` filter |
| **3. D2 third** | `pricingCatalog.ts` `debtLegalPackages` array (8 `debt_kill_*` entries), `PricingPage.tsx`'s `debt_legal` case | Same pattern: collapse to 3–4 headline tiers (e.g. Starter/Pro/High-Balance + custom-quote), retire (not delete) old IDs via `isPublic: false`, preserve `debtBalanceGuidance` on at least one surviving tier per band so the balance-guidance table at `PricingPage.tsx:439-467` still spans the full $0–$100k+ range without gaps. This table already reads `debtLegalPackages.filter(p => p.debtBalanceGuidance)` directly, so it auto-updates once retired tiers are excluded — no separate edit needed there beyond keeping guidance data on the tiers that remain public. | `personalCreditPackages`, tab list |

**File-ownership rule for Round 3 execution:** one agent (or one human reviewer chain) owns `PricingPage.tsx` + `pricingCatalog.ts` for the D1→D5→D2 (or D5→D1→D2) sequence end to end. Do not split across 3 parallel Task/agent invocations. D3 and D4 (below) are genuinely independent — they touch `funnelExperimentsRepo.ts`/`domain/funnelExperiments.ts`/`App.tsx`'s homepage handler and `/free-debt-guide`/`/free-business-guide`, respectively — and **can** run in parallel with the D1/D2/D5 chain and with each other.

### 0.2 B3 / C1 non-citizen overlap — RESOLVED

**Verified:** `src/pages/business/BusinessProfilePage.tsx:41-46, 205-334` contains a real, working, gated portal panel (`<details>` disclosure titled "Non-citizen & international credit") that imports `getFundingRulesForApplicantType`/`getInternationalCreditSystem` from `src/data/internationalAndNonCitizenCreditRepo.ts`, renders applicant-type chips (ITIN holder, E-2/EB-5, non-resident LLC, DACA, green card) and country chips (Canada, UK, Germany, EU general), and shows matched funding rules / international credit-system comparisons inline. This is real, built, and gated behind partner login (`/business/profile`).

**Decision: B3's public surface IS one of C1's articles — one article, not a separate page, and not a separate workstream.**

Concrete task list (this resolves both B3 and C1's non-citizen scope in one pass, owned by C1's agent, not a second agent):

1. **New public article** — `src/pages/resources/NonCitizenBusinessCreditPage.tsx` at route `/resources/non-citizen-business-credit` (matches the established `/resources/...` convention, not `/learn/...` — see C1 below). Content pulled from `internationalAndNonCitizenCreditRepo.ts`'s `NON_CITIZEN_FUNDING_RULES` and `INTERNATIONAL_CREDIT_SYSTEMS` exports (same data BusinessProfilePage.tsx already renders, reused not rebuilt) — presented as static/SEO-readable prose + tables (applicant type → loan type → SSN/ITIN requirements → key requirements), not the interactive chip-picker UI (that stays portal-only, gated, in `BusinessProfilePage.tsx`, unchanged).
2. **Link from `/business/funding`** to the existing gated `/business/profile` panel (per draft v2's B3(a) — this is a portal-internal link, one line, owned by whoever picks up the (now-shrunk) B3 item, not C1's agent — different file, no conflict).
3. **`publicSeoCatalog.ts`** — add one entry: `{ path: '/resources/non-citizen-business-credit', title: 'Non-citizen & international business credit', description: '...', hasSchema: true }`.
4. **`App.tsx`** — add one lazy import + one `<Route>` entry alongside the other `/resources/*` routes (`App.tsx:1497-1503`).
5. **Compliance gate (C0)** applies to this article like every other C1 article — see §1 below; the source repo's own header disclaimer (`internationalAndNonCitizenCreditRepo.ts:1-14`) already flags this as "eligibility... vary[ies]... and change[s] over time," so this is not a lighter-scrutiny article than the debt-litigation ones.

This eliminates the "two independent workstreams targeting the same repo" risk Round 2 flagged — there is one repo (`internationalAndNonCitizenCreditRepo.ts`), one portal consumer (unchanged), and one new public consumer (this new page), built by C1's agent as item C1.4 in the article list below.

### 0.3 G4 scope — DECISION: build (a) now, explicitly design the data model so (b) can extend it later, and gate (b) behind C0 by name

**Verified:** No file in `src/features/growthAgents/` or `src/lib/` contains `conversion_probability`, `DisputePro`, or any predictive-outcome scoring logic today (grepped `conversion.probability|conversion_probability|DisputePro|expected.outcome` across `src/` — zero matches for a scoring implementation; only planning-doc references). `getDebtPackageGuidanceForBalance()` (`pricingCatalog.ts:2119-2130`) exists and is a **package-recommendation** function (balance → package by lookup table), not an outcome-probability model — it is C5's foundation, not G4's.

**Decision:** G4 is two distinct features that happen to share a name in the draft. Round 3 splits them explicitly:

- **G4a (internal-only, build first, sequence after G2).** A CRM-record-level "likely to convert" signal computed from G2's attribution data (last-touch agent action → eventual stage outcome) plus record-level features already on `CrmRecord` (`src/domain/crmRecords.ts`) — score/stage/source/touch-count. This is heuristic/rule-based scoring (e.g., a weighted-feature score, not a trained ML model — no ML infra exists in this codebase and building one is out of scope), surfaced only in `AdminCrmWorkspacePage.tsx`/`CrmRecordDrawer.tsx` as a "likelihood" chip for staff triage. **No compliance gate needed** — this is an internal staff-facing operational signal, same category as a CRM lead-score field, not a claim made to a partner or the public.
- **G4b (partner-facing pre-mail outcome simulator — the actual DisputePro AI competitive benchmark, explicitly separate, explicitly gated).** A tool a *partner* sees before mailing a dispute letter, showing a realistic outcome range. **This is functionally the partner-facing sibling of C5** (public-facing "which program fits" wizard) — both are "outcome range from real historical data, not a black-box prediction" features, just gated (portal, post-signup) vs. public (pre-signup). **Recommendation: do not build G4b as a separate feature from C5.** Instead, once C5's wizard component (score-band → outcome-range logic) exists (see C5 spec below), G4b is "mount the same outcome-range component inside the portal's Letter Studio / dispute-drafting flow, scoped to the partner's own historical dispute type instead of a generic score band." This reuses C5's compliance-reviewed language and disclaimer pattern instead of building and reviewing a second copy of the same sensitive claim. **G4b explicitly requires Phase C0's compliance gate applied to it, exactly like C5 — an outcome range is an outcome range whether it's shown pre-signup or post-signup.**
- Scope decision for this document: **G4 = G4a only, effort S/M, sequenced immediately after G2.** G4b is **not** separately scoped here — it is deferred and re-labeled as "C5-extension-into-portal," to be picked up once C5 ships and only after a compliance review confirms the disclaimer language holds up post-signup where a partner has a specific, real dispute in front of them (higher stakes than a generic public visitor plugging in hypothetical numbers).

---

## 1. Phase C0 — Compliance/Legal Review Gate

**Verified pattern to reuse:** `src/features/social/SocialDisclosureReviewPanel.tsx` (100 lines) + `src/lib/socialDisclosureLayer.ts` (73 lines). The existing pattern is: (1) a pure function (`evaluateDisclosureReview`) that inspects content and returns `{ needsReview: boolean; reasons: string[] }`, (2) a `complianceStatus` field (`'approved' | 'needs_review' | 'blocked'`) stored alongside the content record, (3) a filter function (`listPostsNeedingDisclosureReview`) that surfaces only unreviewed/flagged items, (4) an admin panel with Approve/Block buttons that call `updateSocialPostStatus(id, ..., { complianceStatus })`. This is the template C0 reuses for legal/doctrine content instead of social posts.

### C0.1 — Legal/compliance review pass before publishing doctrine-derived content

**Files to create:**
- `src/domain/complianceReview.ts` — new domain type: `ContentComplianceStatus = 'draft' | 'needs_review' | 'approved' | 'blocked'`; `ComplianceReviewRecord { id: string; contentType: 'public_article' | 'state_landing_page' | 'outcome_wizard'; contentRef: string /* route or article id */; status: ContentComplianceStatus; reviewedBy?: string; reviewedAt?: string; reviewNotes?: string; sourceRepoRefs: string[] /* e.g. ['debtLitigationDoctrineRepo.ts'] */; lastVerifiedAt?: string; nextVerificationDueAt?: string; }`
- `src/data/complianceReviewRepo.ts` — CRUD over `ComplianceReviewRecord[]`, following the exact `localJsonStore` pattern used by `funnelExperimentsRepo.ts`/`auditRepo.ts` (`loadJson`/`saveJson`, key `finely.complianceReview.v1`). Exports: `listComplianceReviews()`, `upsertComplianceReview()`, `getComplianceReviewForContent(contentRef)`, `listContentNeedingReview()` (status `draft`/`needs_review`, or `nextVerificationDueAt` in the past).
- `src/lib/complianceReviewLayer.ts` — pure evaluation function `evaluateContentComplianceReadiness(record, opts: { hasComplianceFootnote: boolean; sourceRepoVersion?: string })` mirroring `evaluateDisclosureReview()`'s shape (returns `{ readyToPublish: boolean; reasons: string[] }`). Checks: (a) does the article include a "results vary / not legal advice / individual circumstances differ" footnote (reuse `FINELY_OS_COMPLIANCE_FOOTNOTE` token from `finelyOsLightUi.ts`, already used on `PricingPage.tsx:234-236`), (b) has a human marked `status: 'approved'`, (c) is `nextVerificationDueAt` still in the future.
- `src/components/compliance/ContentComplianceReviewPanel.tsx` — admin panel, visual/structural clone of `SocialDisclosureReviewPanel.tsx` (list pending items, show `sourceRepoRefs` + reasons, Approve/Block buttons wired to `complianceReviewRepo.ts`).
- New admin route: add to an existing admin page (recommend embedding inside whatever page already lists `/admin/content-studio` or a new lightweight `/admin/compliance-review` route in `App.tsx`) rather than building a new full page shell — reuse `EntityDetailShell`/`FinelyUnifiedHubLayout` patterns already used by `BusinessProfilePage.tsx` if a dedicated page is preferred.

**No Supabase migration needed** — this mirrors `socialHubRepo.ts`'s `complianceStatus` field, which is itself client-side/localStorage today (confirmed no `social_scheduled_posts.compliance_status`-equivalent write-blocking exists server-side beyond the `platform-cron` publish-sweep filter at `platform-cron/index.ts:61-65`, which does read `compliance_status` from the DB — so if C0's review status needs to actually gate a *build-time or deploy-time* publish step later, that would need a table; for now, a pre-publish human checklist gate (checked before merging the PR that adds a new `/resources/*` route) is sufficient since there's no server-side "unpublish" mechanism for a CSR route once it's in the bundle).

**Step-by-step:**
1. Build `complianceReview.ts` + `complianceReviewRepo.ts` + `complianceReviewLayer.ts` (S).
2. Build `ContentComplianceReviewPanel.tsx`, wire into an admin surface (S).
3. For every C1/C4/C5 article, **before** merging its route into `App.tsx`, create a `ComplianceReviewRecord` with `status: 'draft'`, have a human (owner/compliance-aware reviewer) flip it to `approved`, **then** merge the route. This is a process gate, not a runtime gate — the mechanism doesn't block the build, it blocks the PR/review step.
4. Document the process in a short addition to `docs/PLATFORM_CRON.md`-style ops doc or a new `docs/COMPLIANCE_REVIEW_GATE.md` (optional, low effort) so future contributors know the checklist exists.

**Acceptance criteria:** every new C1/C4/C5 route has a corresponding `ComplianceReviewRecord` with `status: 'approved'` before merge; the admin panel correctly lists any record with `status !== 'approved'` or a past-due `nextVerificationDueAt`.

**Effort: S.** (New domain type + repo + one panel, no migration, purely additive — smaller than the social-disclosure precedent it clones because it has one fewer status transition to model.)

### C0.2 — Recurring re-verification cadence

**Files to modify:** `complianceReviewRepo.ts` (add `nextVerificationDueAt` computation on `approve` — set to `approvedAt + 6 months` by default, configurable per `contentType`, with `state_landing_page` content defaulting to a shorter 3-month cadence per C0.3).

**Step-by-step:** On approval, stamp `nextVerificationDueAt`. Surface overdue items at the top of `ContentComplianceReviewPanel.tsx` (reuse the panel built in C0.1, add a "re-verification due" section — no new component needed). No automated reminder/notification wiring in this pass (that would require a new cron step and is out of scope for this document — flag as a natural Phase F/K follow-on, not a blocker for C0.2 itself: a visible "needs re-verification" badge in the admin panel is a sufficient S-effort v1).

**Acceptance criteria:** an approved record older than its cadence window shows as "needs re-verification" in the admin panel.

**Effort: S** (extends C0.1's repo, no new infra).

### C0.3 — Flag C4 (state-specific pages) as highest scrutiny

**Files to modify:** `complianceReviewRepo.ts`'s default cadence logic (3 months for `contentType: 'state_landing_page'` vs. 6 months for `public_article`); `ContentComplianceReviewPanel.tsx` (sort/badge state-landing-page records first, with a distinct visual flag — reuse `finelyOsStatusChip('blocked')`-style token from `finelyOsLightUi.ts`, already used in `BusinessProfilePage.tsx:248-252` for similar binary-risk chips).

**Acceptance criteria:** C4 records default to the 3-month cadence and render with a distinct "highest scrutiny" badge in the review panel.

**Effort: S** (a conditional inside C0.1/C0.2's already-built logic — bundle into the same PR as C0.1/C0.2, not a separate task).

**Dependencies:** None — C0 has zero dependency on any other phase. **C1, C4, and C5 all depend on C0** (their `ComplianceReviewRecord` must exist and be `approved` before each route merges). C0 itself can and should be built in parallel with, or immediately before, C1's first article.

---

## 2. Phase C — Public SEO Content From Existing Doctrine

**Naming decision (per Round 2 feasibility critique, confirmed against `App.tsx:1497-1503` and `publicSeoCatalog.ts:32-71`):** all new routes use the **`/resources/...`** prefix, matching the confirmed live convention (`/resources/personal-credit-restore-sheet`, `/resources/business-credit-one-sheets`, `/resources/videos`, `/resources/references`, `/resources/au-teen-credit-sheet`), **not** `/learn/...`.

**Confirmed page-shell pattern** (from `src/pages/resources/PersonalCreditRestoreSheetPage.tsx:1-27`): every new article page imports `PageShell`, `FinelyOsPageFooter`, `MarketingStaffChatStrip`, and calls `usePublicSeoMeta({ title, description, path })` near the top of the component. New C1/C4/C5 pages follow this exact shell.

### C1 — Publish 8–12 public SEO articles from doctrine repos

**Files to create** (one file per article, all under `src/pages/resources/`):
- `DebtDefenseValidationLettersPage.tsx` → `/resources/debt-defense-validation-letters` (from `debtLitigationDoctrineRepo.ts`, `phase: 'pre_suit_validation'` entries)
- `DebtDefenseSummonsAnswerPage.tsx` → `/resources/debt-defense-summons-answer` (from `phase: 'summons_answer'` entries)
- `DebtDefensePostJudgmentPage.tsx` → `/resources/debt-defense-post-judgment` (from `phase: 'post_judgment_emergency'` entries)
- `BusinessCreditTierMatrixPage.tsx` → `/resources/business-credit-tier-matrix` (from `businessCreditDoctrineRepo.ts`'s `BusinessCreditTierStrategy[]`, tiers 1–5)
- `BusinessCreditVendorFundingLandscapePage.tsx` → `/resources/business-credit-funding-instruments` (from the same repo's funding-instrument section)
- `NonCitizenBusinessCreditPage.tsx` → `/resources/non-citizen-business-credit` (per §0.2 above — resolves B3/C1 overlap)
- 2–5 additional articles at the team's discretion drawn from remaining doctrine repo sections (e.g. a garnishment-exemption explainer, an FDCPA-counter-suit overview, an ECOA business-credit-discrimination explainer) to reach the 8–12 target — exact count/titles are a content decision, not a technical blocker.

**Files to modify:**
- `src/data/publicSeoCatalog.ts` — one entry per new article (title, description, `hasSchema: true`), following the existing entry shape at lines 44-71.
- `src/App.tsx` — one lazy import + one `<Route>` per article, added adjacent to the existing `/resources/*` block at lines 1497-1503.

**No Supabase migration needed** (per Round 2 feasibility critique — confirmed `scripts/generate-public-sitemap.mjs` regex-parses `publicSeoCatalog.ts` and is already wired into `npm run build`; no manual sitemap step required).

**Step-by-step:**
1. **Gate check first:** create a `draft`-status `ComplianceReviewRecord` per planned article (C0 dependency).
2. For each article: write the page component (reuse `PersonalCreditRestoreSheetPage.tsx`'s shell structure), sourcing prose directly from the relevant doctrine repo's structured fields (`overview`, `statutoryBasis`, `remedyAction`, etc. for debt-litigation; `tierName`, `vendorList`, `naicsRiskBypass` etc. for business-credit) — do not paraphrase away from the repo's own citations, and do not invent new statutory claims not already present in the repo.
3. Add the `FINELY_OS_COMPLIANCE_FOOTNOTE` disclaimer block to every article (required for the compliance gate to mark it `readyToPublish`).
4. Add the `publicSeoCatalog.ts` entry + `App.tsx` route.
5. Get the `ComplianceReviewRecord` flipped to `approved` (human step) before merging the route.
6. Confirm `npm run build` regenerates the sitemap including the new paths.

**Known, accepted limitation (not a blocker):** this is a CSR-only SPA — `usePublicSeoMeta` sets tags via `useEffect` post-mount, so non-JS social-preview crawlers (Facebook/LinkedIn/X on first share) may show generic homepage OG data until cached. This is a pre-existing, site-wide limitation shared by all 15+ existing `/resources/*` pages, not something C1 introduces — no action needed, just don't be surprised by it.

**Acceptance criteria:** 8–12 new routes live under `/resources/*`, each with an `approved` compliance record, each appearing in `sitemap.xml` after build, each reusing (not duplicating) the underlying doctrine repo as its source of truth.

**Effort: M** (confirmed by Round 2 — new page components + route entries + SEO catalog entries, no new infra; the compliance-gate step is new process overhead but not new engineering complexity).

**Dependencies:** C0 (compliance gate) must exist and each article's record must be `approved` before merge. No dependency on any other phase.

### C2 — Public before/after proof gallery

**Files to create:** `src/pages/resources/BeforeAfterGalleryPage.tsx` → `/resources/before-after-results` (or `/results/gallery` if it's grouped with Phase B's `/results` page — coordinate with whoever owns B1 to avoid two competing "results" routes; recommend nesting under `/results/gallery` if B1's `/results` page ships first, otherwise ship standalone at `/resources/before-after-results` and redirect later).

**Files to modify:** `publicSeoCatalog.ts`, `App.tsx` (one route), and reuse `src/features/studioCommandOs/BeforeAfterScoreGraphicPanel.tsx`'s existing image-generation output as the gallery's data source (confirmed this is currently an admin-only tool with no public destination — this page is that destination).

**Step-by-step:** Build a gallery grid page pulling from whatever `BeforeAfterScoreGraphicPanel.tsx` persists (check its output storage — if it writes to a repo/localStorage key, read from there; if it's purely ephemeral/download-only today, the first sub-task is adding a lightweight persistence step so generated graphics have something for the gallery to list). Apply the same compliance footnote pattern as C1.

**Acceptance criteria:** at least the case studies already used in `caseStudiesRepo.ts`'s score deltas (e.g. 528→671, 542→698, 561→705) are represented visually, with the standard disclaimer.

**Effort: S/M.** Sequence after B2/D3/C1 per Round 2's business-impact ranking (lower marginal lift than those — score-delta proof already exists in text form in every case study).

**Dependencies:** C0 (same public-content compliance gate applies to any results/outcome claims shown).

### C3 — "vs. DIY / vs. traditional credit repair" comparison page

**Files to create:** `src/pages/resources/CreditRepairComparisonPage.tsx` → `/resources/diy-vs-traditional-vs-finely`.

**Files to modify:** `publicSeoCatalog.ts`, `App.tsx`.

**Step-by-step:** Straightforward comparison-table page (Finely Cred DFY vs. Finely Cred DIY vs. traditional credit-repair agencies), compliance-forward framing (no disparaging or unverifiable claims about named competitors — factual, feature-based comparison only). Apply standard compliance footnote.

**Acceptance criteria:** page ships with no unverifiable competitor claims; compliance record approved.

**Effort: S/M.**

**Dependencies:** C0.

### C4 — State-specific debt-defense landing pages (stretch, highest compliance scrutiny)

**Files to create:** 3–5 pages under `src/pages/resources/state/` (e.g. `TexasDebtDefensePage.tsx`, `FloridaDebtDefensePage.tsx`, `CaliforniaDebtDefensePage.tsx` — pick top-volume states from actual lead-source data if available, otherwise the 3 largest states by population as a starting heuristic) at routes like `/resources/debt-defense/texas`.

**Files to modify:** `publicSeoCatalog.ts` (one entry per state), `App.tsx` (one route per state — or a single dynamic `:stateCode` route component if the content structure is uniform enough; recommend starting with explicit per-state files for the first 3–5 since content review needs to happen per-state anyway, not templated).

**Step-by-step:**
1. **Create the `ComplianceReviewRecord` with `contentType: 'state_landing_page'` per state before writing any content** — this triggers the 3-month re-verification cadence from C0.3 automatically.
2. Source state-specific claims (answer deadlines, garnishment exemptions, service-of-process rules) **only** from what `debtLitigationDoctrineRepo.ts` already contains with an explicit state citation — where the repo says "varies by state, verify locally" for a given rule, the landing page must carry the same hedge, not assert a false specific answer to fill a content gap.
3. Do not publish any state page whose compliance record is not `approved`.

**Acceptance criteria:** every state page has a distinct, approved `ComplianceReviewRecord` with the shorter re-verification cadence; no state-specific legal claim appears on the page without a corresponding citation in the source doctrine repo.

**Effort: L** (stretch — confirmed by both draft v2 and Round 2 as the single highest-compliance-risk item in the whole plan; do not compress the per-state review step to hit a deadline).

**Dependencies:** C0 (hard blocker — do not build C4 content before C0.1–C0.3 exist). Should ship after C1 (reuses the same doctrine-repo-sourcing discipline C1 establishes).

### C5 — Interactive public outcome/program-fit wizard

**Verified:** `getDebtPackageGuidanceForBalance(amountCents)` exists at `pricingCatalog.ts:2119-2130` — takes a debt balance in cents, returns the matching `PricingPackage` from `debtLegalPackages` by iterating `debtBalanceGuidance` ranges. `CaseStudy` (`caseStudiesRepo.ts:16-32`) has `startingScore?: number` and `endingScore?: number` fields per entry, categorized by `PricingCategory`, with a `STANDARD_DISCLAIMER` constant already defined (`caseStudiesRepo.ts:34-35`) reading "Results vary. Individual outcomes depend on your unique credit profile...". This is real, structured historical data — not a black box.

**Files to create:**
- `src/domain/outcomeWizard.ts` — new domain types: `OutcomeWizardStep = 'category' | 'debt_balance' | 'starting_score' | 'result'`; `OutcomeWizardInput { category: PricingCategory; debtBalanceCents?: number; startingScoreBand?: '300-579' | '580-669' | '670-739' | '740-799' | '800-850'; }`; `OutcomeWizardResult { recommendedPackage?: PricingPackage; outcomeRangeLabel: string; sampleSize: number; disclaimer: string; }`.
- `src/lib/outcomeWizardEngine.ts` — pure function `computeOutcomeWizardResult(input: OutcomeWizardInput): OutcomeWizardResult`. For debt-balance inputs, calls the existing `getDebtPackageGuidanceForBalance()` directly (reuse, not reimplement). For score-band outcome ranges, filters `CASE_STUDIES` (from `caseStudiesRepo.ts`) by `category` and by whether `startingScore` falls in the selected band, then computes a real min/max/median `endingScore - startingScore` delta across the matching case studies (**not** a single cherry-picked example — an honest range from however many real entries match, explicitly showing `sampleSize` so a small `n` is visible, e.g. "based on 4 case studies in this band" rather than presenting it as a large-sample statistic it isn't).
- `src/pages/resources/OutcomeWizardPage.tsx` → `/resources/which-program-fits` — multi-step wizard UI (category picker → debt-balance or starting-score input depending on category → result screen showing `computeOutcomeWizardResult()`'s output + the standard disclaimer + a CTA into `/pricing` or intake).

**Files to modify:** `publicSeoCatalog.ts`, `App.tsx` (one route).

**No Supabase migration** — this is pure client-side computation over existing static TS data (`debtLegalPackages`, `CASE_STUDIES`), no new persistence needed for v1.

**Step-by-step:**
1. **Compliance gate first** (C0 dependency) — this is the single most sensitive new public artifact in Phase C precisely because it produces a personalized-feeling number; create the `ComplianceReviewRecord` (`contentType: 'outcome_wizard'`) before building the result screen's copy.
2. Build `outcomeWizardEngine.ts` with unit-testable pure functions (no UI dependency) — verify the score-band bucketing and sample-size honesty logic in isolation before wiring to UI.
3. Build the wizard UI, reusing existing form-step patterns from the site (check `LeadMagnetFunnelShell.tsx`'s step-based UI for a precedent already in the codebase before inventing a new stepper pattern).
4. Every result screen must show: the sample size behind any range, the standard disclaimer, and a link to full case-study detail (`/testimonials?tab=case_studies` or the future `/results` page from Phase B) so the number isn't presented as a floating, unsourced claim.
5. Add SEO catalog entry + route; get compliance record approved; merge.

**Acceptance criteria:** every outcome range shown states its sample size; every screen carries the standard disclaimer; the debt-balance path calls the existing `getDebtPackageGuidanceForBalance()` rather than duplicating its logic; compliance record approved before merge.

**Effort: M.** (New domain model + engine + multi-step UI, but zero new infra — reuses two existing, already-structured data sources. Larger than a single static article (C1) but smaller than a full new product surface, since the "hard part" — the underlying data and package-matching logic — already exists.)

**Dependencies:** C0 (hard gate, explicitly named in draft v2 and reconfirmed here). Not blocked by C1/C2/C3/C4 — can build in parallel with them, but its compliance review should happen with awareness that it's the highest-scrutiny *wizard-type* item in Phase C the same way C4 is the highest-scrutiny *static-page* item.

---

## 3. Phase G — Agent Intelligence Upgrades

### G1 — Narrower "escalate to real reasoning" threshold

**Files to modify:** `src/lib/finelyBrain/finelyPublicAnswer.ts` — specifically `classifyFinelyPublicTopic()` (line 88) and `shouldUseFinelyPublicAnswer()` (line 83-86), which currently short-circuits to a canned answer whenever `classifyFinelyPublicTopic()` returns non-null.

**Step-by-step:**
1. Read `classifyFinelyPublicTopic()`'s current classification rules in full (keyword/pattern matching against `message`) to enumerate exactly which topics currently get canned answers.
2. Narrow the matched-topic set to only genuinely repetitive, low-variance FAQ-style questions (e.g. "what is FCRA," "how much does it cost") — remove topics where a real, adaptive LLM response would meaningfully outperform a canned string (anything involving the visitor's specific situation/numbers).
3. No new files needed — this is a targeted edit to existing classification logic.

**Acceptance criteria:** measurable increase in the share of public-chat messages that reach a real LLM call vs. a canned string (instrument via `logAgentAction`/existing chat analytics if present; if no such counter exists today, add one minimal counter as part of this task rather than shipping unmeasured).

**Effort: S/M** (the edit itself is small; enumerating which topics to keep canned vs. open up requires care, since narrowing too aggressively increases LLM cost/latency for genuinely repetitive questions).

**Dependencies:** None. Independent of C0/C/D — can run in parallel with anything in this document.

### G2 — Agent-action → CRM-outcome attribution (build now, do not wait for Phase F)

**Verified:** `logAgentAction()` (`src/lib/agentAuditLog.ts:32-46`) already writes `actorType: 'agent'`, `entityType`, `entityId` via `addAuditEvent()` (`src/data/auditRepo.ts`) on every agent action, confirmed called from `runCrmSequenceEngine.ts` and `alexAppointmentAutomation.ts` (per Round 2's citation) and from `calebReasoningSubagents.ts:64-70` (`handoff.routed_to_alex`). `auditRepo.ts:2,15` confirms `loadJson`-backed, 100% localStorage — no Supabase sync exists. `CrmRecord.stage` (`src/domain/crmRecords.ts:7-12`, `CrmRecordStage` union of `ProspectStage | LeadStage | 'active_client' | 'won' | 'lost'`) is already tracked client-side per record via `crmRecordsRepo.ts:200`'s `setCrmRecordStage()`.

**Files to create:**
- `src/domain/agentAttribution.ts` — shared data model used by both G2 (agent-action view) and E2 (channel view), per Round 2's explicit recommendation to build these as one model with two views, not two divergent systems. Types: `AttributionTouch { agentId: string; action: string; entityId: string; entityType: string; occurredAt: string; auditEventId: string; }`; `AttributionOutcome { entityId: string; finalStage: CrmRecordStage; resolvedAt?: string; }`; `AgentAttributionSummary { agentId: string; touches: number; entitiesTouched: number; entitiesWon: number; conversionRate: number; dataCompletenessNote: string; }` (the `dataCompletenessNote` field is mandatory, not optional — see acceptance criteria below).
- `src/lib/agentAttributionEngine.ts` — `computeAgentAttribution(): AgentAttributionSummary[]` — reads `listAuditEvents()` (from `auditRepo.ts`) filtered to `actorType: 'agent'` entries with `entityType: 'crm_record'`, joins by `entityId` to `getCrmRecord(entityId)`'s current `stage`, does last-touch attribution (most recent agent action before the record reached a terminal stage), and aggregates per `agentId`.
- Surface: either a new lightweight panel in `AdminAnalyticsPage.tsx`/`AdminCrmWorkspacePage.tsx`, or (preferred, per Round 2's "shared model, two views" instruction) a dedicated `src/features/crm/attribution/AgentAttributionPanel.tsx` mountable from both an E-dashboard location and a G2/growth-agents-roster location, so the underlying `agentAttributionEngine.ts` truly has one call site pattern feeding two UI destinations.

**No Supabase migration** — this is a pure read-and-join over existing client-side data (`auditRepo.ts` + `crmRecordsRepo.ts`), matching Round 2's confirmation that G2's code does not need to wait for Phase F.

**Step-by-step:**
1. Build `agentAttribution.ts` domain types.
2. Build `agentAttributionEngine.ts`'s `computeAgentAttribution()` as a pure function over already-loaded `auditRepo`/`crmRecordsRepo` data (unit-testable without any UI).
3. Build `AgentAttributionPanel.tsx`, mount it in the admin CRM workspace and/or growth-agents roster page.
4. **Mandatory honesty label:** every rendered summary must display language equivalent to "as complete as this browser's activity history — actions from other sessions aren't counted yet" (the `dataCompletenessNote` field exists specifically so this can't be silently dropped from the UI). Do not present this as ground-truth attribution.

**Acceptance criteria:** the panel renders per-agent touch counts, win rates, and conversion rates joined from real `auditRepo`/`crmRecordsRepo` data; the completeness caveat is visibly rendered, not just present in a tooltip or code comment; the domain model in `agentAttribution.ts` is structured so a future E2 (channel-level view) can reuse `AttributionTouch`/`AttributionOutcome` without redefining them.

**Effort: M.** (Round 2 confirms the code is buildable now against existing data — the M-sizing reflects building a real join/aggregation engine plus a UI panel, not new infra; it is not S because "last-touch, per-agent, with an honest completeness caveat" is more than a one-file edit.)

**Dependencies:** None (does not need Phase F). Its **output quality** improves once Phase F lands (server-side action logging closes the localStorage gap) — but do not block building G2 on Phase F. Sequence G2 to share a data model with E2 if/when E2 is picked up (see draft v2 Phase E — out of this document's scope but flagged here as a coordination note).

### G2b — "Why didn't this convert" post-mortem loop

**Verified:** `calebReasoningSubagents.ts:47` confirms `allowedActions: ['route_handoff', 'no_action']` is a real, already-used decision vocabulary for Caleb's Qualifier/Handoff Router — `no_action` is a concrete, loggable outcome via `logAgentAction()`, not a hypothetical.

**Files to create:**
- `src/features/growthAgents/agentDecisionPostMortem.ts` — `runDecisionPostMortem(lookbackDays: number): PostMortemFinding[]`. Queries `auditRepo.ts` for agent actions where `meta.reasoning`/`action` indicates a `no_action`/`skip` decision (e.g. `action === 'handoff.no_action'` or wherever the Handoff Router logs its non-routing branch — verify the exact logged action string when implementing, since the current `runCalebHandoffRouterForProspects()` snippet only explicitly logs the `route_handoff` branch at lines 64-70; **add a matching `logAgentAction()` call to the `no_action`/held branch first if one doesn't already exist**, since a post-mortem needs both outcomes logged, not just the positive one), then joins each flagged decision's `entityId` forward in time to that CRM record's actual eventual `stage` (via `crmRecordsRepo.ts`). Produces `PostMortemFinding { agentId, entityId, decisionAt, decisionAction: 'no_action'; actualOutcome: CrmRecordStage; wasLikelyMisjudged: boolean /* e.g. no_action decision but record later reached 'won' via a different path */; }`.
- Surface: extend `AgentAttributionPanel.tsx` (built in G2) with a "missed opportunities" sub-section, rather than building a second standalone panel — this is explicitly the backward-looking sibling of G2's forward-attribution, so it belongs in the same UI surface per Round 2's shared-model guidance.

**Step-by-step:**
1. First, audit every subagent that has a `no_action`/`skip`-equivalent branch (`calebReasoningSubagents.ts` confirmed; check `estherStrategySubagent.ts`, `benjaminPartnershipSubagent.ts`, and others per the registry) and confirm each one calls `logAgentAction()` on that branch too, not just the "did something" branch. Add the missing calls where absent — this is a prerequisite, not optional, since G2b cannot analyze decisions that were never logged.
2. Build `agentDecisionPostMortem.ts`'s join logic.
3. Extend `AgentAttributionPanel.tsx` with the post-mortem section.

**Acceptance criteria:** for any CRM record that reached `'won'` after a prior `no_action` decision from any agent, the panel surfaces it as a "possible missed opportunity" with the original decision's reasoning shown alongside the eventual outcome.

**Effort: S/M** (mostly reuses G2's join infrastructure; the "make sure no_action branches are actually logged everywhere" step is the real work, and its size depends on how many subagents currently skip logging their negative branch — verify count during implementation).

**Dependencies:** G2 (shares its attribution data model and UI surface — build G2 first, G2b immediately after in the same PR chain or the very next one).

### G3 — A/B variant-testing primitive for a high-volume send path

**Files to modify/create:** Extend `src/domain/funnelExperiments.ts`'s pattern (currently scoped to headline/CTA-copy tests within a lead-magnet funnel) into the CRM/outreach domain — new type `SendVariantExperiment` (or extend `runCrmSequenceEngine.ts`'s email-step model with an optional `variants: { control: EmailContent; variant_a: EmailContent }` field) plus a variant-assignment + outcome-recording pair analogous to `assignFunnelVariant()`/`recordFunnelConversion()` in `funnelExperimentsRepo.ts:36-55` and beyond.

**Step-by-step:**
1. Decide the target send path — recommend CRM sequences (`runCrmSequenceEngine.ts`) over Alex's outreach (`alexAppointmentAutomation.ts`) since CRM sequences already have a defined step/email model to extend, whereas Alex's outreach is more ad hoc.
2. Add a `variantId` field to whatever enrollment/step-execution record tracks a given send, assign deterministically (mirroring `assignFunnelVariant()`'s sticky-per-session pattern, but keyed by CRM record/prospect ID instead of `sessionStorage` since these are cross-session server-eventual sends, not same-session page views).
3. Record outcome (reply, booking, stage advance) back to the variant the same way `recordFunnelConversion()` does today.

**Acceptance criteria:** at least one CRM sequence step can run two variants and report per-variant conversion counts.

**Effort: M** (new domain-model extension into a live send path, more involved than D3's page-level A/B test because it needs a persistent per-record variant assignment, not a `sessionStorage` read).

**Dependencies:** None directly, but this is more valuable once Phase F (server-side CRM sequences) lands, since a client-only variant test only captures sends made while an admin has a browser open — same caveat pattern as G2. Build now if desired; note the same completeness caveat.

### G4 — Internal CRM-record conversion-probability signal (G4a only; G4b deferred into C5, per §0.3)

**Files to create:**
- `src/lib/agentAttributionEngine.ts` (extend, same file as G2) — `computeConversionLikelihood(record: CrmRecord, attributionSummary: AgentAttributionSummary[]): { likelihood: 'low' | 'medium' | 'high'; reasoning: string; }`. Heuristic scoring using: record `score` field, touch count from G2's `AttributionTouch[]` for this entity, source channel's overall win rate (from the same attribution join), and time-in-current-stage. Explicitly rule-based/transparent (the `reasoning` string must name which factors drove the bucket), not an opaque ML score — no ML training infra exists in this codebase and building one is out of scope for this item.
- Surface: a small "likelihood" chip on `src/features/crm/components/CrmRecordDrawer.tsx` and/or `CrmPipelineBoard.tsx` card, showing the bucket + a one-line reasoning tooltip.

**Acceptance criteria:** every CRM record shows a likelihood bucket with a human-readable reason; the underlying function is a named, auditable heuristic (list of factors + weights documented in code comments), not a black box.

**Effort: S/M.** (Reuses G2's join data; the scoring function itself is small, but wiring the chip into two existing UI surfaces and getting the heuristic's factor weights right is real, non-zero work.)

**Dependencies:** G2 (hard — G4a's scoring input is G2's attribution join output; sequence directly after G2, ideally in the same wave). **No compliance gate needed for G4a** (internal-only, staff-facing, same risk category as an existing CRM lead score). **G4b is explicitly deferred and re-scoped as a C5 extension** — see §0.3; when picked up, it inherits C5's compliance-gate dependency.

---

## 4. Phase D — Pricing & Funnel Simplification

*(D1, D2, D5 sequencing is fully specified in §0.1 above — this section covers D3 and D4, which are independent of that chain.)*

### D3 — A/B test homepage hero CTA destination

**Verified:** `App.tsx:447` hardcodes `<HeroSection onGetStarted={() => navigate('/pricing/business-credit')} .../>` — the homepage hero CTA today always routes every visitor into the business-credit funnel with zero experimentation. `domain/funnelExperiments.ts` (16 lines, read in full) confirms the experiment type only has `headlines`/`ctaLabels`/`stats` fields — no destination field exists.

**Files to modify:**
- `src/domain/funnelExperiments.ts` — add `ctaDestinations: Partial<Record<FunnelExperimentVariant, string>>` field to `FunnelExperiment`.
- `src/data/funnelExperimentsRepo.ts` — no structural change needed to `assignFunnelVariant()`/`recordFunnelConversion()` (they're already generic over `FunnelExperiment`), but add a helper `getAssignedCtaDestination(funnelId: string, fallback: string): string` that resolves the variant's `ctaDestinations[variant]` or falls back to the current hardcoded path.
- `src/App.tsx` — replace the hardcoded `navigate('/pricing/business-credit')` at line 447 with `navigate(getAssignedCtaDestination('homepage_hero', '/pricing/business-credit'))`.
- **New: cross-page conversion bridge.** Since the "conversion" for this test fires on a *different* page after navigation (e.g., the visitor lands on `/pricing/business-credit` or `/pricing/personal-credit` and then converts there, not on the homepage), add a small helper (e.g. `src/lib/funnelCtaBridge.ts`) that: (a) on hero-CTA click, writes `sessionStorage.setItem('finely.heroCta.variant', variant)` alongside navigation, (b) on the destination page's own conversion event (checkout start, intake submit), reads that key back and calls `recordFunnelConversion('homepage_hero', variant)` before clearing the key. This is new cross-page wiring, not "reuse of already-built infra" — confirmed absent today (existing `assignFunnelVariant`/`recordFunnelConversion` calls are same-page, per `LeadMagnetFunnelShell.tsx`'s usage).

**Step-by-step:**
1. Extend the domain type + repo helper (S).
2. Wire the homepage hero to use the helper instead of the hardcoded path (S).
3. Build the `sessionStorage` bridge and call `recordFunnelConversion()` from wherever the destination pages' existing conversion events already fire (e.g. checkout-start handlers) — this requires touching at least one destination page's conversion call site, likely `PricingPage.tsx`'s `handleSelect()` (line 130) or the funnel intake submit handler, in addition to the homepage.
4. Seed an `ensureDefaultExperiments()`-style default experiment for `homepage_hero` with 2–3 candidate destinations (business-credit, personal-credit, a new "start here" quiz-style landing) to test against the current default.

**Acceptance criteria:** homepage visitors are deterministically bucketed into a hero-CTA-destination variant; conversions on the destination page are correctly attributed back to the originating variant via the `sessionStorage` bridge; existing headline/CTA-label experiments on other funnels are unaffected by the new field (additive-only change to the domain type).

**Effort: S/M** (confirmed by Round 2 — new domain field + cross-page wiring, not a same-page reuse).

**Dependencies:** None. Fully independent of C0/C/G/D1/D2/D5.

### D4 — Populate 2–3 more funnel experiments

**Files to modify:** Whatever calls `ensureDefaultExperiments()` (likely `funnelExperimentsRepo.ts` or a seed script) — add headline/CTA-label experiment definitions targeting `/free-debt-guide` and `/free-business-guide`, following the exact same shape as whatever existing default experiment(s) already target `LeadMagnetFunnelShell.tsx`-based funnels.

**Step-by-step:** Confirm `/free-debt-guide` and `/free-business-guide` are both `LeadMagnetFunnelShell`-based (so `assignFunnelVariant`/`recordFunnelConversion` already wire in without new plumbing); if so, this is pure content/config work — write 2–3 headline/CTA variants per funnel and register them via `upsertFunnelExperiment()`.

**Acceptance criteria:** both funnels show variant-specific headlines/CTAs and record conversions per variant using existing infra (no new code path).

**Effort: S** (confirmed — this is the one Phase D item that genuinely is "just use the already-built infra," unlike D3).

**Dependencies:** None.

### D5 — Resolve the Banking Reports tab indirection

See §0.1, Step 1 — folded into the D1/D2/D5 sequential chain as the **first** step (decides tab structure before D1/D2 build on top of it). **Recommendation: keep `banking_reports` as its own tab** (current state is actually fine — it's a distinct product from credit-bureau disputes); downgrade this to a verification-and-copy-only pass unless the team specifically wants to fold it into `personal_credit` as a sub-section, which would require re-touching D1's just-collapsed personal tab and is not recommended.

**Effort: S** (verification-only if the "keep separate tab" recommendation is accepted; S/M if folding into `personal_credit` is chosen instead, since that reopens D1's work).

---

## 5. Dependency summary (this document's phases only)

| Item | Hard dependency | Soft/quality dependency | Can start immediately? |
|---|---|---|---|
| C0.1–C0.3 | None | — | Yes |
| C1 (incl. non-citizen article) | C0 approved record per article | — | Yes, in parallel with C0's build (gate the *merge*, not the *writing*) |
| C2 | C0 | Sequence after B2/D3/C1 (business-impact ranking, not a technical block) | After C1 |
| C3 | C0 | — | Yes, in parallel with C1 |
| C4 | C0 (hard, highest scrutiny) | Sequence after C1 (reuses its sourcing discipline) | After C0 + C1 |
| C5 | C0 (hard) | Reuses `getDebtPackageGuidanceForBalance()` (already exists, no wait) | Yes, in parallel with C1 |
| G1 | None | — | Yes |
| G2 | None (does NOT need Phase F) | Output completeness improves after Phase F lands | Yes |
| G2b | G2 (shares data model + UI) | — | Immediately after G2 |
| G3 | None | More valuable after Phase F | Yes, with same completeness caveat as G2 |
| G4 (G4a) | G2 (hard — needs its join output) | — | Immediately after G2 |
| G4b | Deferred — re-scoped as a C5 extension | Requires C0 gate applied a second time (portal context) | After C5 ships |
| D1/D2/D5 | Each other (sequential, one owner, §0.1) | — | Yes, as a chain |
| D3 | None | — | Yes, parallel to D1/D2/D5 |
| D4 | None | — | Yes, parallel to everything |

**Cross-phase note (already correct in draft v2, reconfirmed):** G2 does **not** wait for Phase F — build it now against current client-side data, with the mandatory completeness caveat rendered in the UI, not just noted in a planning doc.

---

## 6. Recommended execution wave grouping

Grouping for 3–4 parallel build agents per wave, respecting every file-ownership boundary found above (no two agents ever hold the same file in the same wave).

### Wave 1 (foundation — everything else in this document reads or gates through these)
- **Agent 1:** C0.1 + C0.2 + C0.3 (compliance domain/repo/panel — new files only, zero collision risk with anything else).
- **Agent 2:** D1 → D5 → D2 sequential chain on `PricingPage.tsx` + `pricingCatalog.ts` (one agent owns this whole chain per §0.1 — do not split).
- **Agent 3:** G2 domain model + engine + panel (`agentAttribution.ts`, `agentAttributionEngine.ts`, `AgentAttributionPanel.tsx`) — new files, reads existing `auditRepo.ts`/`crmRecordsRepo.ts` but doesn't modify them.
- **Agent 4:** D3 (funnel-experiment domain extension + homepage hero wiring + cross-page bridge) — touches `domain/funnelExperiments.ts`, `funnelExperimentsRepo.ts`, `App.tsx` (a *different* region of `App.tsx` than Agent 2 or C1's routes — the homepage hero handler at line 447, not the `/resources/*` route block — low collision risk but coordinate on `App.tsx` diffs if agents run truly concurrently).

### Wave 2 (depends on Wave 1 landing)
- **Agent 1:** C1 — all 8–12 articles (including the resolved non-citizen article), gated by Wave 1's C0 output. New files only (`src/pages/resources/*.tsx`), plus additive edits to `publicSeoCatalog.ts` and the `/resources/*` route block in `App.tsx`.
- **Agent 2:** C5 — outcome wizard (`domain/outcomeWizard.ts`, `lib/outcomeWizardEngine.ts`, `pages/resources/OutcomeWizardPage.tsx`), gated by Wave 1's C0 output, reuses `getDebtPackageGuidanceForBalance()` (untouched, read-only) and `caseStudiesRepo.ts` (untouched, read-only).
- **Agent 3:** G2b + G4a — both extend G2's Wave-1 output (`agentAttributionEngine.ts`, `AgentAttributionPanel.tsx`); one agent owns both since they share the same two files and the same "extend the panel with a new section" pattern.
- **Agent 4:** D4 (funnel experiment seeding for `/free-debt-guide`/`/free-business-guide`) + G1 (narrow `classifyFinelyPublicTopic()`) — unrelated files (`funnelExperimentsRepo.ts` seed data vs. `finelyPublicAnswer.ts`), bundled onto one agent only because both are small, independent, S/M-effort items with no natural Wave-2 partner otherwise.

### Wave 3 (stretch / lower-priority / explicitly gated)
- **Agent 1:** C4 (state-specific landing pages) — gated by both C0 and C1 landing first; highest-scrutiny item, should not be rushed alongside Wave 2.
- **Agent 2:** C2 (before/after gallery) — sequence after C1 per business-impact ranking; coordinate the exact route with whoever (if anyone) is concurrently building Phase B's `/results` page to avoid two competing "results" surfaces.
- **Agent 3:** C3 (comparison page) — can actually move to Wave 2 if capacity allows; placed in Wave 3 only because it's the lowest-differentiation item in Phase C and shouldn't compete for a Wave-2 slot against C1/C5.
- **Agent 4:** G3 (A/B variant primitive for CRM sequences) — genuinely independent, placed here mainly because it's more valuable once Phase F (out of this document's scope) lands; fine to pull into Wave 2 if the team wants it sooner.

**G4b is intentionally not assigned to any wave** — it is deferred pending C5 shipping and a second compliance review specific to the portal/post-signup context (see §0.3).

---

## 7. Effort estimate rollup (Round 2–corrected S/M/L)

| Item | Effort | Basis |
|---|---|---|
| C0.1 | S | New domain/repo/panel, clones existing `socialDisclosureLayer.ts` pattern, no migration |
| C0.2 | S | Extends C0.1's repo |
| C0.3 | S | Conditional inside C0.1/C0.2 |
| C1 (8–12 articles incl. non-citizen) | M | Confirmed by Round 2 — new pages + routes + SEO entries, no new infra; compliance-gate step adds process overhead, not engineering complexity |
| C2 | S/M | Sequence after B2/D3/C1; may need a small persistence add-on to `BeforeAfterScoreGraphicPanel.tsx`'s output |
| C3 | S/M | Straightforward comparison page |
| C4 | L | Confirmed highest-compliance-risk item in the plan; per-state review discipline, not a technical blocker |
| C5 | M | New domain model + engine + multi-step UI; reuses two existing structured data sources |
| G1 | S/M | Small edit, but enumerating safe-to-narrow topics needs care |
| G2 | M | Real join/aggregation engine + UI, buildable now per Round 2, not S |
| G2b | S/M | Reuses G2's infra; real work is auditing/adding missing `no_action` logging calls |
| G3 | M | New persistent per-record variant assignment into a live send path |
| G4 (G4a only) | S/M | Reuses G2's join output; heuristic scoring + two UI chip mounts |
| G4b | Deferred | Re-scoped as a C5 portal-extension; not separately estimated here |
| D1 | M | Collapse 6→3-4 tiers + retire-not-delete entitlement chain handling |
| D2 | M | Collapse 8→3-4 tiers, same pattern as D1 |
| D3 | S/M | Confirmed by Round 2 — new domain field + cross-page `sessionStorage` bridge |
| D4 | S | Confirmed — genuinely just uses existing infra |
| D5 | S | Verification-only if "keep separate tab" is accepted; S/M if folding into `personal_credit` |

---

## 8. What this document does not cover

Per the task scope, this document finalizes only C0, C, G, D. Phases A, B, E, F, H, I, J, K, L, and N from `enhancement_plan_draft_v2.md` are unchanged and still need their own Round 3 finalization pass before full-plan execution. In particular, note two cross-references this document depends on but does not itself finalize:

- **E2** (channel-level conversion consolidation) should share `src/domain/agentAttribution.ts`'s `AttributionTouch`/`AttributionOutcome` types with this document's G2 spec, per Round 2's explicit "one model, two views" instruction — whoever finalizes Phase E should reuse the domain file built here rather than defining a parallel one.
- **B3** is now a small, separate, one-line-link task ("link `/business/funding` → `/business/profile`'s existing gated panel") fully decoupled from C1 per §0.2 — Phase B's Round 3 finalization should size B3 accordingly (much smaller than draft v2's original framing implied) and should not re-open the non-citizen public-content question, since it's resolved here as "one of C1's articles."
