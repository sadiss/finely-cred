---
name: AU_marketplace_unify_people
overview: “Unify everything” master plan. Prioritize AU Marketplace + People Directory first, then Vendors→BusinessCredit, Media/Resources/Bookstore integration, CRM roles/tags, dedupe, Secret Vault recovery, Knowledge Base, Chat overhaul, Journey map redesign, and Lead Intel. Includes audit of already-implemented items (Kanban defaulting, AU/agent/affiliate fields, Enlightenment session booking, save destinations).
todos:
  - id: au-marketplace-hub
    content: Add Admin AU Marketplace hub page with inventory preview + quick actions + pricing controls
    status: pending
  - id: au-contract-accept
    content: Add contract acceptance controls to Admin AU Sellers so sellers can qualify for marketplace inventory
    status: pending
  - id: au-nav-links
    content: Add AU Sellers + AU Marketplace links to admin left navigation
    status: pending
  - id: au-demo-fallback-label
    content: Keep demo inventory fallback but label it and warn when no approved seller inventory exists
    status: pending
  - id: people-directory
    content: Create unified /admin/people directory (team + partners + leads/prospects + applications + AU sellers/buyers) with search and KPIs
    status: pending
  - id: media-route-and-gating
    content: Add /admin/media route alias and clarify Media Studio gating reasons (feature flags vs Supabase config) so it doesn’t feel like a redirect loop
    status: pending
  - id: vendors-business-credit
    content: Remove standalone Vendors page and integrate vendor tiers into Business Credit with compact, non-scroll UI + unlock logic; keep vendor CRUD in Settings if needed
    status: pending
  - id: media-resources-bookstore-courses
    content: Reintroduce/extensively enhance media creation (images, mockups, video uploads) and connect Media → Resources → Bookstore → Courses with “save to…” everywhere needed
    status: pending
  - id: crm-primary-role-tags
    content: CRM upgrade: Primary Role (single-select) + Categories/Tags (multi-select) for leads/prospects/partners with strong visibility + management UX
    status: pending
  - id: knowledge-base
    content: Dedicated Knowledge Base page: ingest existing knowledge; upload links/docs; organize + search
    status: pending
  - id: chat-overhaul
    content: Drastically enhance chat UI; unify internal/external chat; integrate KB; package entitlement gating; guided next-steps/letters workflows (with disclaimers)
    status: pending
  - id: journey-map-redesign
    content: Redesign Journey Map: 2D road-style default (clear milestones, “you are here”, next steps panel) + optional cinematic mode
    status: pending
  - id: lead-intel-super
    content: Enhance Lead Intel Agent “50x” (data capture, workflows, saving into CRM, richer output + operators)
    status: pending
  - id: secret-vault-recovery
    content: Secret Vault: show all secrets; password protection; co-owner recovery/help flow when password is lost
    status: pending
  - id: dedupe-merge
    content: Detect + resolve duplicates across users/partners/leads/prospects/applications (merge/link flow)
    status: pending
  - id: audit-existing-implemented
    content: Audit/verify already-implemented items (Kanban defaults, AU/agents/affiliates fields, Enlightenment session booking, existing save-destination selectors) and close gaps
    status: pending
  - id: comms-studio-50x
    content: Drastically enhance Comms Studio (Portal + Email + SMS): 50+ template options, richer editor, variable library, sequences, testing, deliverability controls, and template packs
    status: pending
  - id: automation-studio-dnd
    content: Upgrade Automation Studio to drag-and-drop builder (step list first, then node canvas) with 40+ new actions/triggers/conditions and a large template library
    status: pending
isProject: false
---

# Unify Everything (Master Plan)

## What’s already implemented (audit + close gaps)

- **Kanban defaults + “actual stage”**: standardized progression columns for tasks/projects site-wide (verify all remaining boards).
- **Create tasks assigned to project**: `WorkItemCreateModal` flows exist from project/task contexts (verify remaining entry points).
- **Enlightenment session booking**: public booking page + lead capture exists (verify discovery/navigation + calendar output).
- **AU / agent / affiliate fields**: extended domain models + forms exist (verify all new fields are surfaced where needed).
- **Save destinations (partial)**: Media Studio export destination + Resources video upload destination + course template saving exists. Expand to “save to…” everywhere you generate/upload content.

## Root causes (items you reported that feel “missing”)

- **AU Marketplace inventory is filtered hard**: only sellers that are `active`, `verified`, have `contract.acceptedAt`, and have listings with `status === 'approved'` appear as real inventory.
  - Source: `[src/components/landing/index.tsx](src/components/landing/index.tsx)` → `TradelineMarketplace()` seller inventory builder.
- **AU sellers can be created, but contract acceptance is a blocker**: `AdminAuSellersPage` currently has no “accept contract” control, so sellers never qualify for marketplace inventory.
  - Source: `[src/pages/admin/AdminAuSellersPage.tsx](src/pages/admin/AdminAuSellersPage.tsx)`.
- **Media “redirect to settings” feels broken**: it’s actually the setup-gate panel (missing flags and/or Supabase env), with a button to Settings.
  - Source: `[src/pages/admin/AdminMediaStudioPage.tsx](src/pages/admin/AdminMediaStudioPage.tsx)`.

## Guiding principles (to “unify everything”)

- **One place for people**: a unified `/admin/people` directory that can route you to the right profile/editor for any person-like entity.
- **Page-level scrolling**: avoid giant long pages and nested scroll traps; use KPI rows + collapsible sections by default.
- **Premium selection workflows**: KPI row + grouped `<details>` + focused right-side detail panel for editing many items (vendors, tags, KB entries).
- **Feature gating is explicit**: if something is disabled, the UI says exactly why and offers the exact fix.

## Execution order (priorities first, but everything is included)

### Phase 0: audit + stabilize

- Verify routes/nav entries exist and match expected behavior for newly-added modules (tasks, agents, enlightenment session, AU modules, media studio).
- Close any “partial” implementations (especially “save to…” and any Kanban boards not yet updated).

### Phase 1: AU Marketplace (add/edit supply and make it show up)

- **Admin AU Marketplace hub** (new) with inventory preview, checklist, quick actions, and pricing controls.
  - Add: `[src/pages/admin/AdminAuMarketplacePage.tsx](src/pages/admin/AdminAuMarketplacePage.tsx)`
- **Add contract acceptance UI** to AU sellers admin so sellers can qualify.
  - Update: `[src/pages/admin/AdminAuSellersPage.tsx](src/pages/admin/AdminAuSellersPage.tsx)`
- **Nav + discoverability** for AU sellers and the AU marketplace admin hub.
  - Update: `[src/components/admin/AdminNav.tsx](src/components/admin/AdminNav.tsx)`
- **Keep demo inventory fallback** but label it and warn when no approved seller supply exists.
  - Update: `[src/components/landing/index.tsx](src/components/landing/index.tsx)`

### Phase 2: Unified People Directory (“all users in 1 place”)

- Create `/admin/people` with global search + KPIs + tabs for:
  - Team, Partners, Leads/Prospects, Applications (agent/affiliate), AU Sellers, AU Buyers/Orders
- Add quick-create menu + deep-links to existing detail pages.
- Add duplicate detection surface (email/phone collisions) with a “Resolve” compare panel (merge is Phase 6).
  - Add: `[src/pages/admin/AdminPeoplePage.tsx](src/pages/admin/AdminPeoplePage.tsx)`
  - Update routes: `[src/App.tsx](src/App.tsx)`
  - Update nav: `[src/components/admin/AdminNav.tsx](src/components/admin/AdminNav.tsx)`

### Phase 3: Vendors → Business Credit (UI fix: no long scroll)

- Remove/retire the standalone Vendors page from primary nav.
- Add vendor tiers to Business Credit with:
  - KPI row (unlocked tiers, next tier requirement, readiness)
  - Grouped collapsible tier cards
  - Focused vendor detail panel
- Keep vendor CRUD (add/edit) in Admin Settings if needed.
- Ensure unlock logic is clearly explained in UI and matches existing entitlements.

### Phase 4: Media/Resources/Bookstore/Courses (“everything connects to media”)

- Fix routing discoverability:
  - Add `/admin/media` alias; ensure nav entry is visible when allowed.
  - Make gating reasons explicit (flags vs Supabase env).
- Restore/enhance asset creation and ingestion:
  - Upload images and videos from Media.
  - Generate images (incl. book mockups) and save them to Resources/Bookstore/Courses.
  - Expand “Save to…” destination selectors across media outputs, resource creation, bookstore products (covers), and course assets.
- Ensure Resource Library can be built from Media outputs (not only manual uploads).

### Phase 5: CRM upgrade (Primary Role + tags/categories everywhere)

- Implement **Primary Role** (single-select) + **Categories/Tags** (multi-select) for:
  - Leads, Prospects, Partners (and optionally Team)
- Provide premium management UX:
  - Create/manage tags in CRM
  - Assign tags from person detail panels and from list rows
  - Filter CRM views by role/tags
- Ensure existing partners are fully visible and manageable from CRM.

### Phase 6: Duplicates (real dedupe/merge)

- Build a merge/link flow for duplicate people across:
  - partners, leads/prospects, applications, users/team
- Maintain audit trail of merges and prevent future dup creation.

### Phase 7: Secret Vault (passwords + co-owner recovery)

- Ensure vault lists all secrets.
- Enforce password protection.
- Add co-owner recovery workflow (admin-only) when password is lost, with audit logging.

### Phase 8: Knowledge Base

- Dedicated KB page with:
  - Ingest existing knowledge
  - Upload links/docs
  - Search + categories
  - Admin editor workflows

### Phase 9: Chat overhaul

- Redesign chat UI and unify internal/external chat.
- Integrate Knowledge Base retrieval.
- Add “next best action” outputs (letters, affidavits, checklists) with clear disclaimers and package entitlement gating.

### Phase 9.5: Comms Studio “50x” (Portal + Email + SMS)

- Expand Comms Studio from “templates + manual send” into a complete messaging system:
  - **Portal + Email + SMS** channels with consistent rendering, preview, and send logs.
  - **50+ template options** via:
    - a larger variable library (partner/case/task/report/letters/billing/etc)
    - template packs by category (onboarding, disputes, evidence, reports, billing, AU, business credit)
    - thread strategies, localization, attachments, and per-tenant branding blocks
    - testing tools: send-to-self, A/B variants, spam-signal checklist, delivery simulation
  - **Text capability** means SMS sending + opt-out compliance + throttling + quiet hours.
  - **Sequences**: enrich the new sequences/campaigns area with scheduling, branching, enrollment rules, and due-send processing.
- Anchor files:
  - `[src/pages/admin/AdminCommsStudioPage.tsx](src/pages/admin/AdminCommsStudioPage.tsx)`
  - `[src/data/commsRepo.ts](src/data/commsRepo.ts)`
  - `[src/lib/commsEngine.ts](src/lib/commsEngine.ts)`
  - `[src/data/commsSequencesRepo.ts](src/data/commsSequencesRepo.ts)`
  - `[src/domain/commsSequences.ts](src/domain/commsSequences.ts)`

### Phase 9.6: Automation Studio drag-and-drop (step list → node canvas)

- Replace the “basic but complicated” rule editor with a guided builder:
  - **Builder v1**: draggable step list with groups, collapsible branches, and condition blocks.
  - **Builder v2**: node canvas view (Zapier/Make style) that maps 1:1 to stored rule JSON.
  - **40+ new options** across:
    - Triggers (schedule, events: task created/completed, case status, report uploaded, KB updated, comms delivered/failed, etc.)
    - Conditions (segment checks, partner lane/stage/status, missing evidence, unpaid invoice, time windows, limits)
    - Actions (create/update tasks, assign owners, send comms via template/sequence, create reminders, update CRM tags, generate media, enqueue workflows, webhooks)
  - **Template library**: many prebuilt automations (ops, sales, support, AU, business credit, dispute cadence), plus “duplicate and customize”.
  - Keep existing runner/execution paths; this phase is primarily UX + expanded action catalog.
- Anchor files:
  - `[src/pages/admin/AdminAutomationsPage.tsx](src/pages/admin/AdminAutomationsPage.tsx)`
  - `[src/components/automation/AutomationRuleEditor.tsx](src/components/automation/AutomationRuleEditor.tsx)`
  - `[src/data/automationStudioRepo.ts](src/data/automationStudioRepo.ts)`
  - `[src/domain/automationStudio.ts](src/domain/automationStudio.ts)`
  - `[src/automation/agentRunner.ts](src/automation/agentRunner.ts)`

### Phase 10: Journey Map redesign (“5x”)

- Make 2D road-style journey the default:
  - clear milestones, clickable stops, “you are here”, next steps panel
- Keep cinematic mode as optional toggle.

### Phase 11: Lead Intel “50x”

- Expand enrichment workflows, outputs, and “save into CRM” pipelines.
- Improve operator controls, repeatable playbooks, and result tracking.

## Test plan

- Create AU seller in `Admin AU Marketplace` → accept contract → verify → add listing → approve listing → confirm it shows up on `[src/pages/au/AuMarketplacePage.tsx](src/pages/au/AuMarketplacePage.tsx)`.
- Confirm demo inventory still appears when there are 0 approved seller listings.
- Navigate to `/admin/people` and verify all entity types load and are searchable.
- Navigate to `/admin/media` and confirm it lands on the Media Studio page (or its setup panel) with a clear “missing requirements” explanation.
- Validate Vendors are visible inside Business Credit with tiers/unlock clarity and no long scroll walls.
- Validate “Save to…” works from Media → Resources/Bookstore/Courses.
- Validate CRM role/tags appear and filter correctly across leads/prospects/partners.
- Validate KB can ingest + search content; Chat can retrieve KB and respects entitlements.
- Validate Comms Studio can send Portal + Email + SMS from templates and sequences, with logs and safe throttles.
- Validate Automation builder can reproduce existing rules (round-trip) and run them via existing runner.

