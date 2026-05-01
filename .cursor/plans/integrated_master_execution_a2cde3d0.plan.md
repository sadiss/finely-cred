---
name: integrated_master_execution
overview: "Single integrated master plan that merges all prior plans (excluding already-completed items) into one ordered build sequence: sitewide KPI/card UX + scroll guardrails, premium letter studio (page-sized preview + bigger editor + evidence-in-editor + smarter AI by negative type), Credit Analysis templates + vault, hybrid monetization (free tier + subscription + specialty packs + expanded pricing), enterprise default fields/layout seeding, admin-managed vendor catalog + recommendations, tradeline clarity + typography, and report-upload identity validation feeding letters/cases/tasks."
todos:
  - id: phase1-sitewide-kpi-card-refactor
    content: Finalize KPI/card primitives and refactor top portal/admin/business pages to KPI rows + card grids + show more/less; remove nested vertical scrollers; keep page-level scrolling only.
    status: completed
  - id: phase1-scroll-guardrails
    content: Keep/extend debugUi=1 audit + nested-scroll detection guardrails until verified across routes.
    status: completed
  - id: phase1b-letters-debug-and-full-editor
    content: "DEBUG/FIX Letters Command Center: fix paper preview overlay/long-page UX, enable editing of the full dynamic letter body (not just the intro), and ensure evidence screenshots render in draft/preview/PDF."
    status: completed
  - id: phase2-letter-studio-page-preview-and-editor
    content: Implement true page-sized letter preview with pagination, widen studio columns, increase editor height and sticky toolbar, and ensure layout matches site premium styling.
    status: completed
  - id: phase2-letter-evidence-in-editor
    content: Show/manage selected evidence inside letter editor context (focused item evidence strip + add/replace/remove), with instant reactivity.
    status: completed
  - id: phase2-letter-power-and-negative-intelligence
    content: Make letters stronger (CTA/30-day/opt-out footer) and implement negative-type-driven AI drafting + clause library + case-attached trackers/tasks for bankruptcy/repo/foreclosure/inquiries/etc.
    status: completed
  - id: phase3-analysis-report-templates-and-vault
    content: Turn existing credit analysis PDF generator into templateable studio with variant generation (images + selected tradelines) and storage/categorization in Templates/Vault and Letters Vault.
    status: completed
  - id: phase4-hybrid-monetization-and-pricing
    content: Implement Free tier (attractive, no Letters) + Core subscription + specialty letter packs; add $5k/$7k/$10k restore tiers; wire gating consistently via entitlements.
    status: completed
  - id: phase5-seed-enterprise-fields-and-render
    content: Seed 20+ default custom fields/layouts per tenant (partners/projects/tasks plus business profile sections) and render/edit them on core pages using FieldLayoutRenderer.
    status: completed
  - id: phase6-vendor-catalog-and-recommendations
    content: Build admin-managed vendor catalog with seeded Tier 1 (30+) + Tier 2/3 starters; implement unlock rules + recommendation grouping in Business Vendors UI.
    status: completed
  - id: phase7-tradelines-clarity-and-typography
    content: Improve tradelines UI clarity (AU vs primary/joint/etc.) and run typography pass so key titles/directions pop across report viewer + credit intel.
    status: completed
  - id: phase8-report-upload-validation-and-canonical-identity
    content: Add report upload identity validation (different report/name mismatch/address faults) and implement canonical partner identity mapping so letters auto-fill name+address correctly; surface faults as dispute suggestions/tasks.
    status: completed
  - id: phase9-remove-dev-instrumentation-post-verify
    content: After UX is confirmed, remove dev-only instrumentation/overlays that aren’t part of maintainable guardrails; keep lightweight diagnostics only.
    status: completed
isProject: false
---

# Integrated master execution plan (all pending work)

## Plans integrated

This merges the **remaining** work from these plans into one sequence (deduped):

- `[c:\Users\stlou\.cursor\plans\sitewide_kpi_cards_refactor_fbaf17f1.plan.md](c:\Users\stlou\.cursor\plans\sitewide_kpi_cards_refactor_fbaf17f1.plan.md)`
- `[c:\Users\stlou\.cursor\plans\premium_letter_studio_pricing_and_analysis_8d724705.plan.md](c:\Users\stlou\.cursor\plans\premium_letter_studio_pricing_and_analysis_8d724705.plan.md)`
- `[c:\Users\stlou\.cursor\plans\enterprise_profiles_vendors_and_tradelines_f9a1a43b.plan.md](c:\Users\stlou\.cursor\plans\enterprise_profiles_vendors_and_tradelines_f9a1a43b.plan.md)`

And it explicitly **does not redo** work already marked completed in:

- `[c:\Users\stlou\.cursor\plans\restore-ai-letter-drafting_84d25eeb.plan.md](c:\Users\stlou\.cursor\plans\restore-ai-letter-drafting_84d25eeb.plan.md)`
- `[c:\Users\stlou\.cursor\plans\master_enterprise_flex_and_premium_ux_ee6d0302.plan.md](c:\Users\stlou\.cursor\plans\master_enterprise_flex_and_premium_ux_ee6d0302.plan.md)`

## What you’ll see when this is done

- **No long ugly lists**: KPI rows + card grids + Show more/less across portal/admin/business; page-level scroll only.
- **Letter Studio is premium**:
  - **Page-sized preview** (US letter page) with pagination (no endless preview)
  - **Bigger editor** (near page height) + sticky toolbar with more options
  - Evidence thumbnails/attachments visible **inside** the editing context
  - “Stronger letter” defaults: CTA/footer (30-day response, verification demand, opt-out language), plus negative-type-specific clauses.
- **Credit Analysis Reports** become a real product:
  - Generate from partner profile + portal reports
  - Save in Vault
  - Build/store “analysis templates” + generate variants with images and selected tradelines.
- **Enterprise data capture**: seeded 20+ default fields/layouts across Partners/Projects/Tasks/Business profiles + editable on-record.
- **Vendors**: admin-managed catalog seeded with 30+ Tier 1 vendors (plus Tier 2/3 starters), with unlock rules + recommended picks per business stage.
- **Smart report uploads**: detect mismatched names / different report vs partner profile, warn clearly, and surface identity faults as dispute suggestions + tasks.

## Execution order (dependency-first)

### Phase 1 — UX foundation (site-wide)

- Convert list-heavy pages to the “premium pattern”: **KPI summary row + card grids + Show more/less**.
- Remove remaining nested vertical scroll panes (keep only horizontal scrollers).
- Keep/extend `debugUi=1` guardrails (audit + nested-scroll detector) until verified.

Primary targets:

- Portal: Reports, Disputes, Letters/Vault, Tasks, Partner Dashboard
- Admin: Dashboard, Partners list, Partner detail tabs
- Business: Profile/Vendors/Billion Path pages

### Phase 2 — Premium Letter Studio (your new requirements)

- **Page-sized preview** (single page shell) + pagination.
- **Bigger editor** (near page height) + wider columns that match the site aesthetic.
- **Evidence inside editor** (focused item panel shows attachments + add/replace/remove).
- “Powerful draft” defaults:
  - Strong CTA/footer block (30 days, verify/furnish, opt-out/do-not-share language).
  - Negative-type-specific flows (bankruptcy/court verification, repo accounting/sale price, inquiry FTC steps, foreclosure workflow) implemented as:
    - drafting logic + clause library
    - trackers/tasks attached to cases.

### Phase 3 — Credit Analysis Report Studio (templates + variants)

- Promote the existing generator (already present on `/portal/reports`) into:
  - **Template builder** (stored, categorized)
  - **Generate variants** (different images / selected negatives + optional positives)
  - **Storage**: saved documents in Letters Vault (or a dedicated “Reports Vault” section) with categories.

Entry points:

- Admin Partner profile
- Portal Reports
- Templates/Vault
- Letters Vault

### Phase 4 — Monetization + entitlements + pricing expansion

- Implement **hybrid monetization**:
  - **Free subscription**: attractive core value, **no Letters**
  - **Core subscription**: unlock Letters module
  - **Specialty letter packs**: bankruptcy/repo/student loan/foreclosure/inquiries packs
- Add credit restore tiers: **$5k / $7k / $10k** after the existing $3k tier.
- Wire gating consistently via `EntitlementGate` + entitlements repo.

### Phase 5 — Enterprise fields/layout seeding + on-record editing

- Add a per-tenant seed initializer that creates robust default fields + layouts (20+ per scope):
  - `partners` (identity, address, monitoring credentials, business IDs, compliance)
  - `projects` (goals, SLAs, status signals)
  - `tasks` (category, owner, escalation, proof requirements)
- Render these layouts on:
  - Business Profile
  - Projects
  - Tasks
  - Partner profile screens

### Phase 6 — Vendor Catalog (admin CRUD + seeded list) + recommendations

- Admin CRUD for vendors (tier, tags, requirements, links, lock/unlock)
- Seed starter catalog:
  - 30+ Tier 1 vendors (plus Tier 2/3 starters)
- Business Vendors UI:
  - “Recommended for you” section (rules-based)
  - Tier 1/2/3 catalogs with locked CTAs until eligible

### Phase 7 — Tradelines clarity + typography pass

- Make AU vs primary/joint/etc unmistakable:
  - prominent responsibility badge + grouping
  - clearer headings and larger instruction text
- Apply to:
  - `ParsedReportViewer`
  - Credit Intel tabs

### Phase 8 — Report upload validation + canonical identity for letters

- Extract report identity (name/address) where available.
- Compare to partner canonical identity (from seeded custom fields/layout + partner record).
- Warn on mismatch + allow marking as “different report/person”.
- Feed mismatches into:
  - dispute suggestions
  - tasks
- Ensure letters always auto-fill partner **name + address block** correctly.

## Key code touchpoints (high-signal)

- UI foundation: `src/components/layout/PageShell.tsx`, `src/components/ui/KpiCards.tsx`, `src/components/ui/CollapsibleSection.tsx`
- Letter Studio: `src/components/letters/LettersCommandCenter.tsx`, `src/components/ui/RichTextEditor.tsx`, `src/letters/generateDisputePdfInline.ts`
- Analysis Reports: `src/pages/portal/PartnerReportsPage.tsx`, `src/reports/generateCreditAnalysisReportPdf.ts` (and new template layer)
- Fields/layout engine: `src/pages/admin/AdminSettingsPage.tsx`, `src/data/customFieldsRepo.ts`, `src/data/fieldLayoutsRepo.ts`, `src/components/fields/FieldLayoutRenderer.tsx`
- Vendors: new domain/data + admin page + `src/pages/business/BusinessVendorsPage.tsx`
- Billing: `src/config/pricingCatalog.ts`, `src/billing/entitlements.ts`, `src/components/billing/EntitlementGate.tsx`

## Definition of done

- Every list-heavy page has KPI row + card grids + show more/less; no nested vertical scroll panes.
- Letter preview is page-sized with pagination; editor is near-page height and premium.
- Evidence is visible and manageable inside the letter editing context.
- Credit analysis reports can be generated, templated, variant-generated, and stored.
- Default enterprise fields exist out-of-box and can be edited on core screens.
- Vendor catalog is seeded + admin-manageable + recommendations work.
- Upload validation catches mismatches and produces actionable next steps.

