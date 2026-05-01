---
name: integrated_pending_master_plan
overview: >
  Single integrated plan that merges ALL remaining pending items across .cursor/plans plus “hanging” launch-readiness
  checklists into one dependency-ordered build sequence. This includes the in-depth signup/onboarding process, credit
  intelligence expansion (including HTML→PDF fallback), letter/template expansion, enterprise engines (fields/RBAC/workflows/
  comms), monetization + checkout/Denefits hardening, and white-label/automation/charts polish.
todos:
  # ────────────────────────────────────────────────────────────────────────────
  # Phase 0 — Launch blockers (must work, not just exist)
  # ────────────────────────────────────────────────────────────────────────────
  - id: p0-downloads-audit-and-fix
    content: Audit + harden ALL download/view flows (letters/templates/resources/evidence) with retries + user-facing errors; unify download helper usage and ensure blobs render and don’t revoke too early.
    status: completed
  - id: p0-template-preview-view-fix
    content: Fix template “View” preview reliability (iframe srcDoc/print-safe CSS, correct data wiring, clear fallbacks) so View always shows the actual letter content.
    status: completed
  - id: p0-screenshot-black-background-fix
    content: Ensure screenshots/tables embedded in PDFs and previews always have a forced white background + readable text; make capture/PDF paths print-safe.
    status: completed
  - id: p0-letter-inline-view-edit-save
    content: Add consistent inline letter viewing + editing + saving before download across template outputs and partner/admin letter flows (editor → preview → save → export).
    status: completed
  - id: p0-navigation-back-buttons
    content: Add a consistent Back pattern across portal/admin/business pages (no “dead-end” pages); ensure sidebar/nav is reachable on mobile.
    status: completed
  - id: p0-buttons-links-audit
    content: Audit all buttons/links for correct destinations and working handlers; remove dead links or replace with real pages/CTAs.
    status: completed
  - id: p0-mobile-responsiveness-pass
    content: Mobile responsiveness pass across PageShell/nav/grids/tables/boards; verify core flows are usable on small screens.
    status: completed
  - id: p0-deploy-and-view-links
    content: Add documented LAN + staging deployment recipe (Vite host + Vercel/Netlify) so the site can be viewed via a shareable link.
    status: completed

  # ────────────────────────────────────────────────────────────────────────────
  # Phase 1 — In-depth signup + onboarding (lane-aware)
  # ────────────────────────────────────────────────────────────────────────────
  - id: p1-in-depth-signup-onboarding
    content: Implement an engaging, lane-aware multi-step signup/onboarding (personal vs business vs AU seller vs agent) that persists into partner routes + profile and is surfaced immediately in dashboard readiness + next actions.
    status: completed

  # ────────────────────────────────────────────────────────────────────────────
  # Phase 2 — Credit Intel 40x + parsing hardening + exports
  # ────────────────────────────────────────────────────────────────────────────
  - id: p2-extraction-hardening
    content: Harden report extraction (HTML/PDF/Text/OCR) with better diagnostics and provider tolerance; maximize identity + tradeline coverage.
    status: completed
  - id: p2-html-to-pdf-fallback
    content: Add HTML→PDF conversion fallback for report ingestion (when HTML parsing fails) and then extract from PDF text/OCR, preserving evidence-table structure as best possible.
    status: completed
  - id: p2-evidence-view-tables
    content: Build screenshot-safe “Evidence View” tables per category (full rows/cols, export CSV/TSV, print-safe styles) for capture + letters.
    status: completed
  - id: p2-credit-intel-model-and-scoring
    content: Extend Credit Intel derived models (contradictions/readiness/timelines) and implement multi-factor scoring + strategy generator + simulations (with clear disclaimers).
    status: completed
  - id: p2-credit-intel-ui-upgrade
    content: Upgrade Credit Intel UI to compartmentalize by category (long lists per category) and add strategy timeline + litigation readiness views with direct CTAs.
    status: completed
  - id: p2-tradelines-clarity-typography
    content: Improve tradelines UI clarity (AU vs primary/joint/etc.) with unmistakable badges/sections and run typography pass across ParsedReportViewer + Credit Intel so headings/directions pop.
    status: completed
  - id: p2-report-upload-validation-identity-faults
    content: Strengthen report upload validation (different person/report, name mismatch, address faults), surface faults prominently, and create actionable tasks/suggestions.
    status: completed

  # ────────────────────────────────────────────────────────────────────────────
  # Phase 3 — Letters + Templates expansion (premium studio + litigation packs)
  # ────────────────────────────────────────────────────────────────────────────
  - id: p3-letter-studio-premium-upgrades
    content: Finish premium Letter Studio UX (page-sized preview + pagination, bigger editor, evidence inside editor context, stronger defaults/clauses by negative type).
    status: completed
  - id: p3-analysis-report-templates-vault
    content: Turn credit analysis PDF generator into a templateable studio with variant generation and storage/categorization in Vault/Templates.
    status: completed
  - id: p3-template-catalog-split-expand
    content: Split template bases by domain and expand litigation-focused library (affidavits, summons responses, repo/foreclosure, bankruptcy, advanced disputes).
    status: completed
  - id: p3-regulatory-complaints-module
    content: Add Regulatory Complaints module (CFPB/AG/FTC/BBB workflows) tied to cases/evidence with draft/submit/track lifecycle.
    status: completed
  - id: p3-canonical-identity-for-letters
    content: Introduce canonical partner identity mapping (custom fields + profile) so letters auto-fill name + address reliably across portal/admin/template flows.
    status: completed

  # ────────────────────────────────────────────────────────────────────────────
  # Phase 4 — Business credit “CreditSuite-style” ladder + vendors
  # ────────────────────────────────────────────────────────────────────────────
  - id: p4-business-credit-ladder
    content: Build business portal modules around a 4-step ladder (fundability → reports → initial trade → revolving/fleet/cash) with sequencing + tasks integration.
    status: completed
  - id: p4-enterprise-fields-seed-and-render
    content: Ensure enterprise default custom fields/layouts are seeded per tenant and rendered/editable on Partner/Business/Projects/Tasks pages where work happens.
    status: completed
  - id: p4-vendors-admin-and-recommendations
    content: Ensure vendor catalog is admin-manageable + properly seeded per tenant, add Recommended grouping rules, and ensure the admin nav links to vendor admin.
    status: completed

  # ────────────────────────────────────────────────────────────────────────────
  # Phase 5 — Monetization + checkout + Denefits hardening
  # ────────────────────────────────────────────────────────────────────────────
  - id: p5-hybrid-monetization-entitlements
    content: Implement hybrid monetization (Free vs Core subscription vs specialty packs, restore tiers) and wire consistent gating via entitlements.
    status: completed
  - id: p5-checkout-modernization
    content: Complete checkout flow (cart persistence, discount/markup controls, Stripe/Denefits paths) and modernize tradelines checkout rails.
    status: completed
  - id: p5-denefits-secure-integration
    content: Implement secure Denefits integration via backend/Edge Functions + webhook receiver (no secrets in browser), and enhance admin billing dashboards with contract analytics.
    status: completed

  # ────────────────────────────────────────────────────────────────────────────
  # Phase 6 — Enterprise Flex 2x engines (compounding platform)
  # ────────────────────────────────────────────────────────────────────────────
  - id: p6-field-layout-engine-upgrade
    content: Upgrade Custom Fields into a full per-tenant Field+Layout Engine (categories/order/permissions/import-export) and improve admin builder UX.
    status: completed
  - id: p6-rbac-capabilities
    content: Implement capability-based RBAC and enforce on routes/actions and field visibility/edit across admin/agent/partner.
    status: completed
  - id: p6-entity-detail-framework
    content: Build reusable Entity Detail Framework (header KPIs, notes, attachments, audit timeline, custom fields panel) and adopt on top modules.
    status: completed
  - id: p6-workflow-primitives
    content: Add workflow primitives (stages/transitions/checklists/SLAs/triggers) and wire into tasks/cases/letters with auditability.
    status: completed
  - id: p6-comms-hub
    content: Build Comms Hub improvements (threads, templates, assignment, SLAs, escalation) and integrate with evidence attachments; stage email/SMS behind backend.
    status: completed
  - id: p6-admin-guide-ops-queues
    content: Upgrade Admin Guide to operator-grade and add Ops Queues driven by audit/workflow signals.
    status: completed
  - id: p6-staged-backend-cutover
    content: Add repo interfaces + versioned config objects now; later cut over to Supabase/Postgres repos with migration path.
    status: completed

  # ────────────────────────────────────────────────────────────────────────────
  # Phase 7 — Automations + white label + visuals
  # ────────────────────────────────────────────────────────────────────────────
  - id: p7-automation-engine-v2
    content: Refactor automations into declarative condition/action engine and seed 40+ workflow templates with audit trails.
    status: completed
  - id: p7-white-label-control-plane
    content: Expand white label settings (branding/modules/content slots) and wire into theme/assets with per-tenant isolation.
    status: completed
  - id: p7-charts-and-imagery
    content: Add modern charts (Recharts) and an imagery/empty-state art system configurable via settings; modernize dashboards and KPI visuals.
    status: completed
isProject: false
---

## What this integrates (sources)

Pending items merged/deduped from:

- `integrated_master_execution_a2cde3d0.plan.md`
- `enterprise_profiles_vendors_and_tradelines_f9a1a43b.plan.md`
- `enterprise_flex_layer_2x_2ed2ed58.plan.md`
- `launch_readiness_master_merge_77117e58.plan.md`
- `launch_expansion_master_plan_0778bcf1.plan.md`
- `launch_expansion_master_plan_8ec010f8.plan.md`
- `complete_launch_preparation_845ffa4f.plan.md`

Already completed plans are not re-done (but their output is leveraged).

## Definition of done (global)

- No broken downloads/view actions; errors are actionable.
- Core flows work end-to-end on desktop + mobile.
- Signup/onboarding captures deep profile data and immediately drives the dashboard/roadmap/tasks.
- Credit Intel supports long, compartmentalized evidence tables, exports, strategy, and fallbacks.
- Letters + templates feel premium and support litigation/regulatory workflows.
- Enterprise engines (fields/RBAC/workflows/comms) compound capability without one-off UI patches.

