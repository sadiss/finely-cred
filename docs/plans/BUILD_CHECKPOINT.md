# Finely Cred — BUILD CHECKPOINT

Last updated: 2026-08-26 (leftover rebuild on auto — wire + next Composer wave without waiting)

## Hard rules (always)

[`.cursor/rules/self-correction-hard-rules.mdc`](../.cursor/rules/self-correction-hard-rules.mdc) — every agent double-checks, triple-checks, self-corrects, and improves without being asked. **Do not stop between plan phases.**

## This execution pass

- [x] **Step 1 chrome:** Roles bottom-left; Communication Hub bottom-right; hub closed on refresh; dashboard hub solid rail paint.
- [x] **Step 2 theme:** White / light is the default (`finely.siteTheme.v3`, FOUC in `index.html`). Dark is opt-in. Workspace header shows a labeled **Light | Dark** pair. `canUseLightTheme` no longer clamps the dashboard to dark before auth email loads.
- [x] **View-as chrome:** Pink `fixed top-0` overlay removed. `AdminPartnerViewAsChip` sits in the partner header **above** the menu (`fc-wlp-viewas-row`) so Dashboard / Reports / etc. stay clickable. Credit scores: parked in [CREDIT_SCORE_READ_PLAN.md](./CREDIT_SCORE_READ_PLAN.md).
- [x] **No brief copy:** Hub launcher is Chat / Ask Finely — not “Talk naturally · smart routing · no dropdowns”. Rule: [`.cursor/rules/no-brief-copy-in-ui.mdc`](../../.cursor/rules/no-brief-copy-in-ui.mdc). Plan: [NO_BRIEF_COPY_IN_UI.md](./NO_BRIEF_COPY_IN_UI.md). Hub stays obsidian in Light.
- [x] **Step 3 identity:** Card open keys inspector + override on that partner; dashboard no longer always demo fixture.
- [x] **Step 4 inspector:** Default body is new partner surfaces — **not** `PartnerDetailPage`. Classic full page remains secondary.
- [x] **Step 5 debt:** Five centers + bankruptcy workstation ([Debt agent](82877d33-0cfd-48f7-b7c4-6ad984cfb25d)).
- [x] **Step 6 roles:** 11 lanes pickable, admin-only ([Roles agent](c77111ac-3612-4e23-8a06-dde4aca039a0)).
- [x] **P2 global inspectors:** CRM/cases/courses/projects verified; portal debt/disputes close→list; business disputes + growth-agent detail converted.
- [x] **P2 embed contrast:** `partnerProductEmbedScope.css` under `.fc-wlp` — leftover partner/admin embeds wrap `fc-wlp-embed-scope`; ivory/white leftover slabs get a visible wash.
- [x] **P2 notes tab:** `PartnerNotesProductSurface` (real notes, not messages stand-in).
- [x] **P2 program archetypes:** specialist / affiliate / agency / case-help / real-estate / HOS pageIds assigned; leftover wrap sets `data-archetype`.
- [x] **P2 HOS live route:** `/portal/hos` uses `ProductRoutedPage` `hos-hub`. HOS in `adminNavLanes`. Role chip prefers preview-shell paths (no login bounce).
- [x] **P2 inspector admin tools:** Status select + Care team / Access / Upload report wired to existing portfolio modals.

## Stage 6 — Admin role preview (transfer)

- [x] All 11 `rolePreviewCatalog` lanes in bottom-left **Roles** chip + **Role studio** tabs.
- [x] Picks use `activateRolePreview` → **workspace preview path** when present (gated live hubs no longer require JWT/select-partner).
- [x] Lane banner on internal routes (bottom-left, full chip row) — never public marketing.
- [x] **Programs & careers** service line + 6 hubs in `PARTNER_PRODUCT_NAV` (incl. `hos-hub` surface).
- [x] Preview toolbar **Role view** select.
- [x] HOS in `adminNavLanes` → `/admin/role-preview?role=heta_society`.
- [ ] Remaining: live JWT impersonation for gated hubs (preview shell is the admin pick path).

## Stage 6 — Admin role preview (transfer)

- [x] All 11 `rolePreviewCatalog` lanes in bottom-left **Roles** chip + **Role studio** tabs.
- [x] Picks use `activateRolePreview` → live `previewPath`; studio at `/admin/role-preview?role=`.
- [x] Lane banner on internal routes (bottom-left, full chip row) — never public marketing.
- [x] **Programs & careers** service line + 6 hubs in `PARTNER_PRODUCT_NAV` (incl. `hos-hub` surface).
- [ ] Remaining: program archetypes; preview-toolbar switcher; JWT impersonation for gated hubs; HOS in `adminNavLanes`.

Active playbook: `.cursor/plans/finely_cred_repair_plan_1c05825b.plan.md`  
Global inspector rule: [ENHANCED_RECORD_INSPECTOR.md](./ENHANCED_RECORD_INSPECTOR.md)  
Partners template plan: `.cursor/plans/restore_partner_inspector_popup_ba0cfd88.plan.md`  
**Partner Overview parity (next implement):** [PARTNER_INSPECTOR_OVERVIEW_PARITY_PLAN.md](./PARTNER_INSPECTOR_OVERVIEW_PARITY_PLAN.md)  
**Debt flow parity:** [DEBT_FLOW_PARITY_PLAN.md](./DEBT_FLOW_PARITY_PLAN.md) — Stage 5 shipped (five debt centers + bankruptcy embed); P0.2 admin case overlay next.

## Correction (do not re-litigate)

Prior Wave 1 framing treated “View partner → `AdminPartnerFileProductSurface` embedding `PartnerDetailPage`” as done. **Owner rejected that.** Correct product form:

- Click record card → **enhanced new-UI inspector/popup**
- Same features/tabs/flow as old UI, enhanced
- **Never** default-route to legacy full page
- Pattern is **GLOBAL** (partners first as template, then CRM/cases/courses/projects/debt/disputes/…)

## Done this batch (Wave 1R peers)

### Stage 5 — Debt flow parity (2026-08-25)
- [x] `/portal/debt` + inspector Debt tab — `PartnerDebtWorkspace embedded` via `ProductDebtWorkspace`; all five `LettersCommandCenter` centers (Validation, Litigation, Foreclosure, Repossession, Bankruptcy).
- [x] `/portal/bankruptcy` — `PartnerBankruptcyProductSurface` now embeds `PartnerBankruptcyWorkspace` (filing + credit tracks, case CRUD, `BankruptcyFilingCenterView` / `BankruptcyCenterView`).
- [x] Admin inspector case cards — `?caseId=` on current URL (no jump to `/portal/debt/:id`); overlay uses `PartnerSessionOverrideProvider` partner.
- [ ] Admin Debt tab case drill-in from classic `PartnerDetailPage` case list (P0.3 patch script).

### Partners template (shipped earlier — do not fight mid-edit)
- [x] Partners portfolio → `PartnerRecordInspector` (template). Leftover file surface secondary only.

### Converted this agent (list+:id → primary surface + inspector)
- [x] **Admin CRM** — `/admin/crm/records/:id` now `pageId=crm`; card/URL opens enhanced sheet with `AdminCrmRecordPage` over pipeline; close → `/admin/crm`.
- [x] **Admin cases** — `/admin/cases/:id` now `pageId=cases`; card/URL opens enhanced sheet with `AdminCaseDetailPage` over docket; close → `/admin/cases`.
- [x] **Admin courses / projects** — already inspector-over-list (verified; no route change needed).
- [x] **Partner debt** — `/portal/debt/:id` → `pageId=debt`; hub + `PartnerDebtDetailWorkspace` inspector overlay.
- [x] **Partner disputes** — `/portal/disputes/:id` → `pageId=disputes`; hub + dispute detail inspector overlay.
- [x] **Partner courses / projects** — `:id` remapped to list pageIds + inspector overlays (parity with admin).
- [x] **Business disputes** — `/business/disputes/:id` → `pageId=business-disputes`; hub + `BusinessDisputeDetailWorkspace` inspector overlay; close → `/business/disputes`.
- [x] **Growth agent detail** — `/admin/growth-agents/:agentId` → `pageId=growth-agents`; roster shell + `GrowthAgentWorkspaceView` inspector overlay; close → `/admin/growth-agents`.

### Leftover detail pageIds
- `crm-record`, `case-detail`, `debt-detail`, `dispute-detail`, `course-detail`, `project-detail`, `business-dispute-detail`, `growth-agent-detail` remain in leftover surfaces as **deprecated secondary** only (not default App routes).

## Still valid from earlier batches

### Wave 0 — Continuity + P0
- [x] PublicChatStaffAvatar infinite loop fix.
- [x] Site alive on `http://127.0.0.1:5173/`.

### Wave 1 — Entity context plumbing (keep)
- [x] entityId in ProductRoutedPage / WorkspaceProductSurfaceProps.

### Wave 2B — partial
- [x] All-tools accordion, HOS nav, vault primary, Settings → Heta.

### Wave 3 — Design parity (partial)
- [x] Partner-dashboard card recipe / portal scope / Credit Intel tab strip (earlier batch).
- [ ] Remaining: admin `AdminLeftoverWorkstationsSurface` growth embeds; live dark-mode visual QA on `/portal/*`.

## Next (spawn next agent here)

1. Dedicated rebuilds replacing `AdminGraduatedWorkstationSurface` / `PartnerGraduatedWorkstationSurface` bodies (calendar, finance, team, partner education, studio pages — Composer wave in flight).
2. Live visual QA on `/admin` Light+Dark with two partner cards + inspector tabs (Overview / Notes / Debt).
3. Click-test Roles chip → HOS / RE / Case Help preview-shell destinations.
4. Live JWT impersonation for gated hubs if preview-shell is not enough for a reviewer.
5. Optional: classic `PartnerDetailPage` debt case list overlay (patch script only).

## Blockers

- None for CRM/cases/debt/disputes conversion path.
- Partners template files may be mid-edit by another worker — left untouched this batch.

## Files touched (P2 embed contrast — this agent)

- `src/features/workspaceLightPreview/product/partner/partnerProductEmbedScope.css` (new)
- `src/features/workspaceLightPreview/product/workspaceProduct.css` — import embed scope
- `src/features/workspaceLightPreview/product/partner/PartnerWorkstationFrame.tsx` — `fc-wlp-embed-scope`
- `src/features/workspaceLightPreview/product/components/productDisputeWorkspace.css` — `.fc-wlp` scope alias
- `docs/plans/BUILD_CHECKPOINT.md`

## Files touched (prior batch)

- `src/App.tsx` — remapped detail routes to list pageIds
- `src/features/workspaceLightPreview/product/admin/AdminOperationalWorkstationsSurface.tsx`
- `src/pages/admin/AdminCrmRecordPage.tsx` / `AdminCaseDetailPage.tsx` — id from prop/query
- `src/features/workspaceLightPreview/product/components/ProductDebtWorkspace.tsx`
- `src/features/workspaceLightPreview/product/components/ProductDisputeWorkspace.tsx`
- `src/features/workspaceLightPreview/product/partner/PartnerDebtProductSurface.tsx`
- `src/features/workspaceLightPreview/product/partner/PartnerDisputesProductSurface.tsx`
- `src/features/workspaceLightPreview/product/partner/PartnerCoursesProductSurface.tsx`
- `src/features/workspaceLightPreview/product/partner/PartnerProjectsProductSurface.tsx`
- `src/pages/portal/PartnerCoursePage.tsx`
- `src/features/workspaceLightPreview/product/admin/AdminLeftoverWorkstationsSurface.tsx`
- `src/features/workspaceLightPreview/product/partner/PartnerLeftoverWorkstationsSurface.tsx`
- `src/features/workspaceLightPreview/product/workspaceProduct.css`
- `docs/plans/BUILD_CHECKPOINT.md`
- `docs/plans/ENHANCED_RECORD_INSPECTOR.md`

## Verify commands

```powershell
cd E:\Finely-Cred\Tishobe\finely-cred-main; npm run typecheck
cd E:\Finely-Cred\Tishobe\finely-cred-main; npm run dev
# /admin/crm/records/:id → CRM pipeline + inspector (not bare leftover page)
# /admin/cases/:id → Cases docket + inspector
# /portal/debt/:id and /portal/disputes/:id → hub + inspector; Close returns to list
```
