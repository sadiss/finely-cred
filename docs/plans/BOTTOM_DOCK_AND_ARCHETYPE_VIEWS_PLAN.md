# Bottom dock + archetype / program views — high-level plan

**Status:** Plan only (no product TSX in this pass)  
**Date:** 2026-08-25  
**Scope:** (1) Bottom Communication Hub must stay **closed** until clicked on refresh/page load. (2) Every product **archetype / program view** (real estate, HOS, admin, case help, business, specialist, affiliate, agency, etc.) must be **visible**, **styled distinctly**, and **reachable with an explicit Service / operating-line picker**.

---

## Executive summary

| Problem | Root cause (confirmed in code) |
|--------|--------------------------------|
| Bottom popup opens on refresh | `FinelyCommunicationHub` treats **any** `?hub=` query param (and `?openHub=1`) as “open on mount”; URLs keep `hub=` after navigation (e.g. full-page handoff from floating hub). |
| Program views “missing” in preview | Five role hubs are registered in `workspaceProductSurfaceRegistry.ts` but **absent from** `PARTNER_PRODUCT_NAV` / `PARTNER_SERVICE_LINES`, so they never appear in the preview hub index or “All tools” service drawer. HOS partner portal (`/portal/hos`) uses a **separate** page with no preview nav entry. |
| No Service picker per view | Service lines stop at 7 partner + 7 admin buckets; **Programs / Roles** lane from `rolePreviewCatalog.ts` is not wired into product nav or preview hub. |

Explore agent `7e0b685b-8e5b-4fb1-8daf-e6c03ed476f7` did not leave a standalone transcript; this plan is based on a focused re-audit of the files below.

---

## Part A — Bottom popup auto-open

### What the user sees

Fixed bottom-right **Communication Hub** (launcher + panel) on partner/admin workspace pages — rendered via `PortalChatWidget` → `FinelyCommunicationHub` (`mode="floating"`). In preview, `ProductWorkspaceShell` mounts it with `forceEnabled` and `visualVariant="product"`.

This is **not** `PartnerRestoreWorkspaceDock` (Reports · Evidence · Documents · Letters · Debt strip). That dock is navigation-only and does not auto-open.

`ProductCopilotPanel` exists but is **not mounted** anywhere in the tree today; `openProductCopilot()` delegates to `openCommunicationHub()` — so all “Ask Finely” paths hit the same hub.

### Root cause (files + state keys)

| Mechanism | File | Lines / keys | Behavior |
|-----------|------|--------------|----------|
| **URL `?hub=` auto-open** | `src/components/chat/FinelyCommunicationHub.tsx` | `explicitOpen` from `openHub`; `useState` initializer L89; `useEffect` L116–122 | Floating hub opens when `searchParams.get('hub')` is **any** value, not only when user explicitly requested open. **Refresh with `?hub=ai` re-opens the panel.** |
| **URL `?openHub=1`** | Same | L87–89 | Same as above for explicit open flag. |
| **Sticky `hub` on navigation** | Same | L252 `navigate(\`${messagesPath}?hub=${tab}...\`)` | “Open full page” leaves `hub` in the URL → next load auto-opens. |
| **Event bus open** | `src/components/chat/communicationHubModel.ts` | `OPEN_HUB_EVENT` / `openCommunicationHub()` | Any caller sets `setOpen(true)` — correct for clicks; wrong if fired on mount. |
| **Dashboard deep link** | `src/pages/portal/PartnerDashboardPage.tsx` | L92–97 `?chat=1` | Opens hub then **strips** param (good pattern to copy). |
| **Copilot handoff (no auto-open)** | `ProductCopilotPanel.tsx` | `finely:copilot-handoff`, `finely:copilot-expanded`, `finely:copilot-locale` | `expanded` / locale persist only **after** open; they do not cause mount open. |
| **Legacy coach dock** | `PartnerLaneCoachDock.tsx` | `defaultOpen` prop (default `false`) | Separate collapsible; only opens if a parent passes `defaultOpen={true}` (rare). |

### Intended behavior (acceptance)

1. On **cold load** and **refresh**, floating hub shows **launcher only** (`data-fc-communication-hub="floating"`, panel closed).
2. Hub opens **only** when user clicks launcher / “Ask Finely” / an explicit CTA, or when URL carries a **one-shot** intent flag that is **removed after consume** (mirror `?chat=1` pattern).
3. `?hub=team` on Messages **full page** (`mode="page"`) may select tab **without** forcing floating panel open on unrelated routes.
4. No `localStorage` key may restore “open” across sessions (none exists today — keep it that way).

### Fix strategy (implementation guide)

**P0 — minimal correct fix**

1. **`FinelyCommunicationHub.tsx`**
   - Change floating initial state to `useState(false)` always (only `mode === 'page'` starts open).
   - In `useEffect`, open floating hub **only** when `explicitOpen` (`openHub=1|true`), not when `urlTabRaw` alone is present.
   - On floating open from `OPEN_HUB_EVENT`, keep current behavior.
   - When consuming `openHub` / one-shot `chat`, `replace` URL to drop the flag (like `PartnerDashboardPage`).

2. **`communicationHubModel.ts`**
   - Document contract: `openCommunicationHub({ expanded })` is for **user gestures**; add optional `openHub: true` only when navigation should open on arrival.
   - Stop appending bare `?hub=` on cross-route links unless `openHub=1` is also set OR target is `mode="page"`.

3. **Call-site sweep** (grep `openCommunicationHub`, `?hub=`, `openHub=`)
   - `ProductWorkspaceShell.tsx` — OK (click only).
   - `PartnerMessagesProductSurface.tsx` — ensure preview/live `openHub` links use one-shot pattern.
   - `ProductCopilotPanel.openProductCopilot` — remove synchronous `openCommunicationHub` if event listener already opens (avoid double-fire).

4. **E2E**
   - New spec: load `/preview/workspace-light/portal/dashboard` → assert hub panel **hidden**, launcher visible; click launcher → panel visible; reload → panel **hidden** again.
   - Regression: `/portal/messages?hub=ai` in **page** mode shows tab without floating overlay on dashboard routes.

---

## Part B — Archetype & program view inventory

### Archetype system (body layout)

- **Registry:** `src/features/workspaceLightPreview/product/workspaceProductArchetypes.ts`
- **Layouts:** `src/features/workspaceLightPreview/product/components/archetypes/*`
- **Assignments:** `PARTNER_ARCHETYPE_BY_PAGE` / `ADMIN_ARCHETYPE_BY_PAGE` (42 partner + 12 admin primary pages; default fallback `ledger`)
- **QA:** `e2e/archetype-differentiation.spec.ts`, `e2e/helpers/workspaceDesignSystem.ts` (`ARCHETYPE_SAMPLES` — 6 partner samples only)

Archetypes: `command` | `focus` | `pipeline` | `journey` | `ledger` | `matrix` | `feed`

### Service / operating lines (navigation grouping)

- **Partner:** `PARTNER_SERVICE_LINES` — workspace, restore, build, business, tradelines, funding, debt (`workspaceProductNav.ts`)
- **Admin:** `ADMIN_SERVICE_LINES` — command, delivery, growth, studio, finance, team, platform
- **Picker UI:** `ProductWorkspaceShell` → “All tools” drawer → `getWorkspaceProductNavByService()`
- **Preview index:** `WorkspaceLightPreviewHubPage` groups `PARTNER_PRODUCT_NAV` / `ADMIN_PRODUCT_NAV` by service line

### Role / program catalog (canonical list)

From `src/config/rolePreviewCatalog.ts` + `ROLE_CAPABILITY_MATRIX`:

| Role key | Label | Live hub path | Preview surface key | In `PARTNER_PRODUCT_NAV`? | Archetype assigned? | Product surface |
|----------|-------|---------------|---------------------|----------------------------|---------------------|-----------------|
| `partner` | Partner portal | `/portal/dashboard` | `dashboard` | Yes | `command` | Real adapter |
| `business` | Business credit | `/business/dashboard` | `business` | Yes | `focus` | Real |
| `agent` | Credit Specialist | `/credit-specialist/hub` | `specialist-hub` | **No** | **No** (→ ledger) | Leftover embed |
| `affiliate` | Affiliate | `/affiliate/hub` | `affiliate-hub` | **No** | **No** | Leftover embed |
| `agency` | Agency | `/agency/hub` | `agency-hub` | **No** | **No** | Leftover embed |
| `case_help` | Case Help | `/case-help/hub` | `case-help-hub` | **No** | **No** | Leftover embed |
| `real_estate` | Real estate | `/real-estate/hub` | `real-estate-hub` | **No** | **No** | Leftover embed |
| `heta_society` | HOS | `/portal/hos` | **Missing** | **No** | **No** | `HetaSocietyPortalPage` only |
| `au_seller` | AU seller | `/seller/dashboard` | `au-seller` | Yes (tradelines) | `focus` (tradelines) | Leftover embed |
| `au_buyer` | AU buyer | `/au/marketplace` | `au-marketplace` | Yes | `matrix` | Real |
| `admin` | Admin | `/admin` | `dashboard` | Yes | `command` | Real adapter |

**Admin-only**

| Item | Path | In admin nav? | Notes |
|------|------|---------------|-------|
| Role preview switcher | `/admin/role-preview?role=` | Yes (`role-preview`) | Embeds `AdminRolePreviewPage` — lists all roles but preview paths jump to **live** URLs |
| HOS program admin | `/head-of-society` | Yes (`hos-program`) | Points to **public** landing, not preview shell |

### Coverage audit (2026-08-25)

```text
node scripts/audit-preview-page-coverage.mjs

PARTNER — 42 destinations: 42 real, 0 derived
ADMIN — 75 destinations: 74 real, 1 suite
```

Program hubs (`affiliate-hub`, etc.) are **not** in the 42 — they are registered in `REAL_SURFACES` but omitted from nav enumeration.

### Present vs missing (user-facing)

| View | Present in live app | Present in preview nav / hub | Distinct archetype body | Service picker |
|------|--------------------|------------------------------|-------------------------|----------------|
| Partner restore/build/debt/business (core) | Yes | Yes | Yes (6 archetypes in e2e) | Yes (7 lines) |
| Admin command/delivery/growth | Yes | Yes | Partial (admin pages mostly real/suite) | Yes |
| Credit Specialist hub | Yes | **No** | Legacy unified hub layout | **No** |
| Affiliate hub | Yes | **No** | Legacy unified hub | **No** |
| Agency hub | Yes | **No** | Legacy unified hub | **No** |
| Case Help hub | Yes | **No** | Legacy unified hub | **No** |
| Real estate hub | Yes | **No** | Legacy unified hub | **No** |
| HOS member portal | Yes (`/portal/hos`) | **No** | Own page, not in product shell | **No** |
| Admin role preview (all roles) | Yes | Partial (`role-preview` page) | Tab switcher only | N/A |

### Target architecture (no duplicate layers)

1. **Single nav source:** Extend `workspaceProductNav.ts` — do **not** fork a second menu.
2. **New partner service line:** `programs` (or `roles`) — “Partner programs & careers” containing specialist, affiliate, agency, case help, real estate, HOS hubs.
3. **Archetype picks per program hub** (proposal):

| pageId | Archetype | Rationale |
|--------|-----------|-----------|
| `specialist-hub` | `journey` | Onboarding + certification steps |
| `affiliate-hub` | `matrix` | Referral tiers / payout comparison |
| `agency-hub` | `pipeline` | Agency partner pipeline |
| `case-help-hub` | `focus` | Assigned cases hero + action rail |
| `real-estate-hub` | `matrix` | Playbook + affiliate toolkit compare |
| `hos-hub` (new) | `journey` | Invite redemption + society steps |

4. **Service picker for reviewers:** Add `WorkspaceProgramViewBar` on preview hub + `ProductReviewToolbar` — dropdown driven by `allRolePreviewEntries()` with preview paths rewritten to `/preview/workspace-light/portal/{pageId}`.
5. **Graduate surfaces incrementally:** Role hubs can keep `PartnerLeftoverWorkstationsSurface` embeds in P0; P1 wraps each in `ProductHubScaffold` + `renderArchetype()` like `PartnerCoursesProductSurface`.

---

## Part C — Phased execution

### P0 — Ship blockers (behavior + discoverability)

| ID | Task | Files to touch |
|----|------|----------------|
| P0-1 | **Stop hub auto-open on refresh** — floating closed by default; only `openHub=1` or explicit event opens; strip one-shot params after consume | `FinelyCommunicationHub.tsx`, `communicationHubModel.ts`, `PartnerMessagesProductSurface.tsx`, `ProductCopilotPanel.tsx` |
| P0-2 | **Add program destinations to nav** — `partner()` entries + `programs` service line in `PARTNER_SERVICE_LINES` | `workspaceProductNav.ts` |
| P0-3 | **Register HOS preview page** — `hos-hub` surface → embed `HetaSocietyPortalPage` or dedicated adapter; live alias `/portal/hos` | `workspaceProductSurfaceRegistry.ts`, `PartnerLeftoverWorkstationsSurface.tsx` (or new adapter), `App.tsx` (`ProductRoutedPage` optional) |
| P0-4 | **Preview hub index** — show Programs line on `WorkspaceLightPreviewHubPage` | `WorkspaceLightPreviewHubPage.tsx` |
| P0-5 | **E2E: hub closed on load** | `e2e/workspace-product-preview.spec.ts` (new test) |
| P0-6 | **E2E: program pages render** | `e2e/service-nav-coverage.spec.ts` — extend `PARTNER_PAGES` + `SERVICE_HEADINGS` |

### P1 — Distinct looks + service picker

| ID | Task | Files to touch |
|----|------|----------------|
| P1-1 | Archetype assignments for program `pageId`s | `workspaceProductArchetypes.ts` |
| P1-2 | Wrap each program hub in product scaffold + archetype body (or thin adapters) | `Partner*HubProductSurface.tsx` (new), hub pages under `src/pages/*/` |
| P1-3 | **Program / role picker** in preview toolbar — uses `rolePreviewCatalog.ts` | `ProductReviewToolbar.tsx`, new `WorkspaceProgramViewSwitcher.tsx` |
| P1-4 | Wire **Service** filter on role preview → sets `service` query or nav context | `AdminRolePreviewPage.tsx`, `AdminRolePreviewProductSurface.tsx` |
| P1-5 | Admin `hos-program` preview path → `/preview/workspace-light/admin/hos-program` or partner `hos-hub` | `workspaceProductNav.ts` |
| P1-6 | Extend `ARCHETYPE_SAMPLES` + `archetype-differentiation.spec.ts` for program pages | `e2e/helpers/workspaceDesignSystem.ts`, `e2e/archetype-differentiation.spec.ts` |
| P1-7 | Update `scripts/audit-preview-page-coverage.mjs` nav regex to count new ids | `scripts/audit-preview-page-coverage.mjs` |

### P2 — Polish & parity

| ID | Task | Files to touch |
|----|------|----------------|
| P2-1 | Full workstation graduation for program hubs (move off leftover embed) | `workspaceProductSurfaceRegistry.ts` `FULL_WORKSTATION_SURFACES` |
| P2-2 | `surface-coverage.spec.ts` include program pageIds | `e2e/surface-coverage.spec.ts` |
| P2-3 | Align `AdminRolePreviewPage` preview CTAs to preview URLs when `navigationMode=preview` | `AdminRolePreviewPage.tsx`, `usePartnerProductNavigation.ts` |
| P2-4 | Document program nav in `docs/DEVELOPER_GUIDE.md` | `docs/DEVELOPER_GUIDE.md` |
| P2-5 | Optional: mount `ProductCopilotPanel` OR remove dead code; single hub entry point | `ProductWorkspaceShell.tsx`, `ProductCopilotPanel.tsx` |

---

## Part D — Acceptance criteria

### Bottom dock / hub

- [ ] Refresh on `/preview/workspace-light/portal/dashboard` — **no** hub dialog; launcher visible.
- [ ] Refresh on `/preview/workspace-light/portal/messages` — hub **closed** unless `openHub=1` present (then opens once and param removed).
- [ ] Click “Ask Finely” in header — hub opens; close; refresh — **stays closed**.
- [ ] `npm run typecheck` passes after P0.

### Archetype / program views

- [ ] Preview hub lists **Programs** service group with: Specialist, Affiliate, Agency, Case Help, Real estate, HOS.
- [ ] Each program URL renders inside `fc-wlp` shell (not legacy public chrome).
- [ ] Each program page exposes `data-archetype` on `.fc-wlp-product-page` (not default-only ledger).
- [ ] Review toolbar can switch **role view** without leaving preview shell.
- [ ] `node scripts/audit-preview-page-coverage.mjs` counts ≥ 48 partner destinations.

---

## Part E — Click-test URLs (manual QA)

Base: `http://localhost:5173` (or dev host). Seed preview: localStorage `fc_wlp_view_mode=preview`, `fc_wlp_data_mode=demo` (see `seedWorkspacePreview`).

### Hub auto-open (P0)

| Step | URL | Expected |
|------|-----|----------|
| Cold load | `/preview/workspace-light/portal/dashboard` | Launcher only, panel closed |
| Refresh | Same | Still closed |
| After Ask Finely click | Same + interaction | Panel open |
| Reload after close | Same | Closed |
| Sticky query regression | `/preview/workspace-light/portal/messages?hub=ai` | Tab selected; **floating panel closed** on dashboard routes |
| One-shot open | `/portal/dashboard?chat=1` | Opens once; `chat` stripped |

### Program views (P0–P1)

| View | Preview URL (after P0 nav) | Live URL |
|------|---------------------------|----------|
| Specialist | `/preview/workspace-light/portal/specialist-hub` | `/credit-specialist/hub` |
| Affiliate | `/preview/workspace-light/portal/affiliate-hub` | `/affiliate/hub` |
| Agency | `/preview/workspace-light/portal/agency-hub` | `/agency/hub` |
| Case Help | `/preview/workspace-light/portal/case-help-hub` | `/case-help/hub` |
| Real estate | `/preview/workspace-light/portal/real-estate-hub` | `/real-estate/hub` |
| HOS member | `/preview/workspace-light/portal/hos-hub` (new) | `/portal/hos` |
| Business | `/preview/workspace-light/portal/business` | `/business/dashboard` |
| Admin role preview | `/preview/workspace-light/admin/role-preview?role=case_help` | `/admin/role-preview?role=case_help` |
| Admin HOS keys | `/preview/workspace-light/admin/hos-program` (P1 path) | `/head-of-society` |

### Archetype differentiation (P1)

| Archetype | Sample preview URL |
|-----------|-------------------|
| focus | `/preview/workspace-light/portal/case-help-hub` |
| journey | `/preview/workspace-light/portal/specialist-hub` |
| matrix | `/preview/workspace-light/portal/real-estate-hub` |
| pipeline | `/preview/workspace-light/portal/agency-hub` |

---

## Part F — Dependencies & risks

- **Do not** add a second floating chat (`ProductCopilotPanel` + `FinelyCommunicationHub`) — pick one launcher (hub wins today).
- **Do not** StrReplace `PartnerDetailPage.tsx` (repo rule) — admin partner file changes via patch scripts if needed.
- Program hubs use `FinelyUnifiedHubLayout` — migrating to archetype scaffold must preserve existing modals/tool decks (`roleHubLauncherPresets.ts`).
- HOS has public marketing (`/head-of-society`) vs member portal (`/portal/hos`) — keep both; preview should target **member** experience.

---

## Part G — P0 checklist (copy for execution agent)

1. Fix `FinelyCommunicationHub` open logic (`explicitOpen` only; strip one-shot params).
2. Add `programs` service line + 6 `partner()` nav rows in `workspaceProductNav.ts`.
3. Add `hos-hub` surface registration + leftover/embed wiring.
4. Update `WorkspaceLightPreviewHubPage` to list Programs destinations.
5. Add Playwright: hub closed on refresh.
6. Extend `service-nav-coverage.spec.ts` for new pageIds.
7. Run `npm run typecheck`.

---

*Plan author: high-level planner subagent · no product TSX changed in this pass.*
