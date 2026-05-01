---
name: launch_readiness_master_merge
overview: Full site assessment + merged launch plan (prep + expansion), prioritized for Credit Intel 40x, litigation templates, CreditSuite-style business credit modules, downloads reliability, and mobile responsiveness, plus a recipe for local/LAN/staging view links.
todos:
  - id: assess-inventory
    content: Produce complete module inventory (real vs placeholder) + screenshot match notes
    status: completed
  - id: fix-downloads
    content: Audit and harden all download/view flows (templates, guides, evidence, PDFs) with errors + retries
    status: completed
  - id: mobile-responsive
    content: Mobile responsiveness pass (PageShell, MasteryOS sidebar, portal nav, grids, back buttons)
    status: completed
  - id: credit-intel-40x
    content: "Credit Intel 40x: extraction hardening + compartmentalized dispute evidence tables + exports"
    status: completed
  - id: letters-edit-flow
    content: Letter view/edit/save flow + improved evidence embedding + Template Studio expansion
    status: completed
  - id: business-credit-creditsuite
    content: Business portal modules modeled after CreditSuite 4-step ladder + vendor library + sequencing + tasks integration
    status: completed
  - id: roadmap-checklist
    content: Cinematic roadmap replacing flat checklist; integrate tasks/projects progress
    status: completed
  - id: crm-comms-hub
    content: Unify Projects/Tasks/Messages into a communication hub with kanban/list/calendar views
    status: completed
  - id: tradelines-checkout
    content: Tradelines + checkout modernization; Denefits embed + real checkout rails
    status: completed
  - id: deploy-links
    content: Provide LAN + public staging deployment setup with documentation
    status: completed
isProject: false
---

# FinelyCred Launch Readiness Plan (Merged + Prioritized)

## Goal

Ship a **launch-ready** FinelyCred that matches the “Sovereign Workspace” experience in your screenshots, has **no broken downloads/buttons**, is **mobile responsive**, and supports **real client work** (reports → intel → disputes → evidence → letters → tasks/projects → support comms). This plan merges your existing “prep” and “expansion” tracks into one execution order.

## What the app already has (assessment)

### Matches your screenshots (confirmed)

- **MasteryOS / Sovereign Workspace dashboard**: implemented and matches the “Overview / Disputes / Debt Kill / Lender Logic / Automation / Launchpad” look.
- **Debt Kill page** (in MasteryOS): implemented as an experience page.
- **Credit Intel screenshot-cards**: implemented (per-section cards + screenshot capture).

### Major modules that are implemented (usable today)

- **Admin**: dashboard, partner management, cases, parsing lab, workflow queue, projects, templates, template studio, billing (incl. Denefits linking/analytics), resources manager.
- **Partner portal**: dashboard, checklist, reports upload + parsing + Credit Intel, disputes center + detail, tasks & notifications, evidence vault, letters vault, education, calendar, projects board (basic), messages/support threads (basic, but real).
- **Public**: landing, tradelines, checkout (demo), resources, bookstore, pricing/services pages, affiliate, etc.

### Notable “real but incomplete / shell” areas (launch blockers)

- **Payments/checkout**: public checkout routes to a stripe mock; partner checkout is “demo activation” for stripe and Denefits is link-based.
- **Business portal**: pages exist but are mostly “shell” content; missing a true CreditSuite-level module system.
- **Template library depth**: “2,000+ templates” is currently a **generator math** (bases × variants × tones × versions × states). The base set is still small, so it feels like “only a few templates.”

## Phase 0 (Prep) — Launch readiness + debugging sweep (must do before more features)

### 0.1 “Downloads & viewing” reliability audit (highest)

**Problem you reported**: downloads not working, template view blank, dispute letter PDFs missing evidence or show black screenshots.

**Plan**

- **Unify download helpers** (one consistent pattern): ensure all downloads append `<a>` to DOM before click, revoke URLs after delay, show user-facing error on missing blob.
- **Fix common failure modes**:
  - `getBlobUrl()` null/expired signed URL → show actionable error + retry.
  - premature `URL.revokeObjectURL()` (can blank downloads) → delay revoke.
  - missing `body`/white-on-white rendering for “View letter” → add fallback UI + ensure letter HTML has readable default styles.
- **Evidence screenshots in PDFs**:
  - Audit every screenshot capture function (`toPng`) to force **white background + dark text** for printable evidence.
  - Ensure the PDF embed step can read blobs reliably and report missing evidence clearly.

**Key code paths**

- `[src/storage/getBlobUrl.ts](src/storage/getBlobUrl.ts)`
- `[src/letters/generateDisputePdfInline.ts](src/letters/generateDisputePdfInline.ts)`
- `[src/pages/admin/AdminTemplatesPage.tsx](src/pages/admin/AdminTemplatesPage.tsx)` (preview uses `iframe srcDoc`, PDFs are OCR-friendly text)
- `[src/pages/portal/PartnerLettersPage.tsx](src/pages/portal/PartnerLettersPage.tsx)` and admin letter preview in partner detail

### 0.2 Mobile responsiveness pass (highest)

**Problem**: the site needs to be truly mobile responsive.

**Plan**

- Fix core layout primitives:
  - `[src/components/layout/PageShell.tsx](src/components/layout/PageShell.tsx)` padding/title sizing for small screens.
  - MasteryOS sidebar: add mobile drawer behavior.
  - Partner portal nav: ensure pills/dropdowns don’t overflow.
- Add a standard “Back” pattern for pages that currently strand users.

### 0.3 Button/link unification + route placeholders

- Identify all routes still pointing to `PlaceholderPage` for any “core flow” path.
- Ensure every sidebar/menu item leads somewhere meaningful (or is clearly “Coming soon” without dead-ends).

### 0.4 Copywriting baseline + brand polish

- Replace dull/placeholder copy across:
  - onboarding steps
  - dashboards
  - business portal
  - affiliate page
  - empty states

## Phase A — Credit Intelligence 40x expansion (your top priority)

### A1. “Evidence View” + compartmentalized disputes everywhere

You asked for “full table displayed” and long, compartmentalized lists.

**Plan**

- Standardize a “Dispute Evidence View” across:
  - Admin partner detail (reports)
  - Partner portal disputes
- Keep categories hard-separated:
  - inquiries
  - collections
  - charge-offs
  - late pays
  - public records
  - bankruptcy
  - repo/foreclosure
- Ensure each category has:
  - stable columns
  - no truncation by default
  - copy-to-table (TSV/CSV)
  - screenshot capture with forced white background

### A2. Extraction hardening (HTML providers first)

- Expand provider-specific parsing for IdentityIQ/MyScoreIQ variants.
- Add “missing sections” diagnostics that point to why (scripted HTML shell vs true table export).

### A3. Intelligence upgrades (pragmatic “40x”)

“Machine learning everywhere” isn’t realistic immediately without backend + data; instead we implement:

- More **deterministic scoring signals** (severity + contradictions + cross-bureau mismatches).
- “Next best action” generation per category.
- “Simulation” improvements (paydown/utilization, removal impact estimates).

## Phase B — Letters, legal, and AI-powered editing flow

### B1. Make templates truly viewable + editable before download

**You want**: view the letter, edit it, then export.

**Plan**

- Add a **Letter Editor** flow:
  - Open a template output into an editor
  - Edit text + clauses
  - Save as a new custom template variant (or as a “draft letter” record)
  - Export to PDF/Word

### B2. “Smart conversational” AI (staged)

- **Stage 1 (no keys)**: better “smart suggestions”, missing-field warnings, tone rewrites, clause library (click-to-insert).
- **Stage 2 (true LLM)**: add a secure server-side drafting endpoint (Supabase Edge Function) so keys never live in browser.

### B3. Seed litigation/debt templates from your examples

- Convert your uploaded sample letters/affidavits into:
  - editable Template Studio templates
  - structured clause blocks
  - “packs”: validation, licensing/standing, CFPB/AG/FTC/BBB complaints.

## Phase C — Business credit modules (CreditSuite-style)

Reference: `https://www.creditsuite.com/business-credit/`.

### C1. Build Business Portal around a 4-step system

Mirror the proven “module ladder” (structure, not copying proprietary text):

- **Fundability Foundation**
- **Business Credit Reports** (D&B/Experian/EQF Commercial)
- **Initial Trade Credit**
- **Revolving Credit + Fleet + Cash credit + Vehicle financing**

### C2. What to implement inside your app

- **Fundability checklist** (125-factor style but simplified for MVP)
- **Vendor/credit source library** categorized by:
  - vendor credit
  - retail credit
  - fleet credit
  - service credit
  - cash credit cards
  - vehicle financing
- **Sequencing engine** (what to do next + prerequisites)
- **Business “projects/tasks” integration** so modules create tasks automatically.

## Phase D — Partner “cinematic roadmap” + checklist modernization

- Replace the flat checklist with a roadmap:
  - stages
  - progress
  - icons/avatars (car/ship/etc.)
  - tasks and milestones integrated

## Phase E — CRM, tasks/projects, and communication hub hardening

You requested: sophisticated kanban/list/calendar views, comms hub (email/SMS/internal).

**Plan**

- **Unify navigation** so Projects, Tasks, and Messages are first-class in the sidebar.
- **Projects page upgrades**:
  - Kanban columns
  - list view
  - calendar view (due dates + consults)
- **Comms hub (MVP)**:
  - internal threads (already present)
  - attachments from evidence vault
  - convert thread → task
  - outbound email hooks (Phase 2 with backend)

## Phase F — Tradelines + checkout modernization

- Make `/tradelines` and checkout production-ready:
  - real product definitions
  - clear cart → checkout
  - Denefits “Get Financed” embed option (button-based + API-based)
  - ability to apply markup/discount from admin (already partly exists via pricing controls)

## “Provide a link to view it” recipe (Both: LAN + public staging)

### Local + LAN (quick sharing)

- Run dev server with LAN exposure: `npm run dev:host`
- You’ll get:
  - local: `http://localhost:5173/`
  - LAN: `http://<your-local-ip>:5173/` (viewable on phone/tablet on same Wi‑Fi)

### Public staging (shareable link)

- Deploy to **Vercel** (recommended): connect Git repo, set build `npm run build`, output `dist/`.
- Add env vars for Supabase only if you want live backend.

## How the “2,000–3,000 templates” should appear

- Today you see fewer because **base templates are limited**.
- The system is designed to generate thousands via:
  - tones + variants + versions + (optional) state specialization
  - see `[src/templates/catalog.ts](src/templates/catalog.ts)` and `[src/pages/admin/AdminTemplatesPage.tsx](src/pages/admin/AdminTemplatesPage.tsx)`.

**Launch target**: increase the number of base templates in the most-used categories (credit disputes, debt collection, court filings, regulators) so the generator produces a truly large library.

## Acceptance criteria for “Launch Ready”

- No broken “View” or “Download” buttons.
- Letters can be viewed/edited before export.
- Evidence screenshots embed reliably in PDFs (no black/blank evidence).
- Mobile navigation works across public + portals.
- Business portal has a complete, step-based module ladder.
- Projects/tasks/messages are unified into a clean workspace for real client work.

