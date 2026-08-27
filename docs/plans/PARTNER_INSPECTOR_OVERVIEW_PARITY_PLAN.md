# Partner inspector — Overview parity plan

Last updated: 2026-08-25  
Workspace: `E:\Finely-Cred\Tishobe\finely-cred-main`

Related: [ENHANCED_RECORD_INSPECTOR.md](./ENHANCED_RECORD_INSPECTOR.md) · [BUILD_CHECKPOINT.md](./BUILD_CHECKPOINT.md) · `.cursor/plans/restore_partner_inspector_popup_ba0cfd88.plan.md`

## Owner goal

When an admin opens a partner profile from the portfolio (card click or `/admin/partners/:id`), they must land on **Overview** with the same command hub they had in the classic file UI — scores, KPIs, status, activity, and obvious next steps — inside the **enhanced inspector popup**, not a legacy full-page default.

## Audit summary (source of truth)

| Finding | Impact |
|--------|--------|
| Inspector embeds full `PartnerDetailPage` (9 tabs incl. Overview) on Admin file lens | Feature parity exists in code path |
| **Tab desync** — inspector chrome can show Overview while embed still renders prior `?tab=` | Admin sees wrong tab body on open / partner switch |
| **`openPartnerRecord` does not reset query** — no `?tab=overview`, does not clear `?view=` | Stale deep links leak across card clicks |
| **Partner view lens hides admin workflow tabs** | Easy to lose tab context when switching lenses |
| **Sticky contextual CTAs CSS-hidden** — `[data-fc-entity-sticky-surface]` hidden in embed | Upload report / Letter studio CTAs invisible in inspector |
| **Dead modals in portfolio surface** — `new_case`, `care_team`, `portal_access`, `parse_overview` modals exist but nothing calls `setActiveModal(...)` | Overview-adjacent actions unreachable |
| **Contrast band may read empty** — embed on dark chrome without restored command strip | Overview feels blank vs old UI |

## Global constraints (do not violate)

1. **Card click → enhanced inspector** (`PartnerRecordInspector`). Legacy full page / `AdminPartnerFileProductSurface` is **secondary only** (`Classic full page` button / modal drawer).
2. **Do not `StrReplace` `PartnerDetailPage.tsx`** for large edits — use props, `key`, URL sync, inspector chrome, or patch scripts (`scripts/_patch-partner-detail-*.mjs`) only when unavoidable.
3. PowerShell: `;` not `&&`. No git commits unless asked.

---

## P0 — Must ship (overview open + tab sync + visible next step)

### P0.1 Reset URL on every partner open

**File:** `src/features/workspaceLightPreview/product/admin/AdminPrimarySignatureSurface.tsx`  
**Function:** `openPartnerRecord(partnerId: string)` (~L697)

**Change:** When opening a partner (card click or programmatic open), navigate to:

```text
{adminPartnerRecordPath(pathname, partnerId)}?tab=overview
```

and **delete** `view` from search params so lens defaults to `admin-file`.

Also apply the same reset when `routePartnerId` changes via deep link (effect that sets `selectedPartnerId` ~L689) if current `?tab=` is missing or partner id changed.

**Acceptance:** Fresh card click always shows Overview tab **selected and rendered** in embed.

---

### P0.2 Remount / resync embed on partner id change

**File:** `src/features/workspaceLightPreview/product/admin/PartnerRecordInspector.tsx`  
**Embed:** `<PartnerDetailPage embedded />` (~L316)

**Change (pick one, prefer both if cheap):**

1. Add `key={partner.id}` (or `key={`${partner.id}:${activeTab}`}`) on `PartnerDetailPage` so internal `useState('overview')` cannot leak across partners.
2. Confirm `PartnerDetailPage` deep-link effect (~L1073–1102 in `PartnerDetailPage.tsx`) runs on `partner?.id` + `location.search`; no extra patch unless effect gap found.

**Do not** patch `PartnerDetailPage.tsx` unless audit proves the effect is insufficient — prefer inspector `key` first.

**Acceptance:** Open partner A on Letters → close → open partner B → body is Overview, not Letters.

---

### P0.3 Inspector chrome ↔ embed tab lockstep

**Files:**

- `src/features/workspaceLightPreview/product/admin/PartnerRecordInspector.tsx` — `activeTab`, `setTab`, `resolveInspectorTab` (~L64–118, ~L237–257)
- `src/pages/admin/PartnerDetailPage.tsx` — `setTabAndUrl`, deep-link `useEffect` (~L1073–1102) — read-only unless patch required

**Change:** Single source of truth = URL `?tab=`. Inspector workflow tabs already call `setTab`; ensure `openPartnerRecord` (P0.1) and `closePartnerRecord` clear stale params. Optional: when embed calls `setTabAndUrl` internally, URL already updates — verify inspector `activeTab` re-reads `searchParams` (it does today).

**Acceptance:** Clicking inspector tab immediately shows matching embed panel; browser back/forward keeps chrome and body aligned.

---

### P0.4 Restore contextual sticky CTAs in inspector chrome

**Problem:** `adminPrimarySignature.css` hides embed sticky bar:

```css
.fc-wlp-partner-file-embed [data-fc-entity-sticky-surface] { display: none; }
```

That removes tab-scoped CTAs from `PartnerDetailPage` stickyBar (~L1392–1423): Upload report, Open letters, Letter studio.

**Files:**

- `src/features/workspaceLightPreview/product/admin/PartnerRecordInspector.tsx` — new **context command strip** below workflow tabs (or below quick actions) when `lens === 'admin-file'`
- `src/features/workspaceLightPreview/product/admin/adminPrimarySignature.css` — keep hiding duplicate **tab pill row** inside embed if needed; do **not** hide restored inspector-level CTAs
- Reference CTA logic: `PartnerDetailPage` stickyBar (~L1409–1421)

**Implementation pattern:**

- Derive CTA from `activeTab` + lightweight counts passed as props from `PartnersPrimarySignatureSurface` (`selectedReports.length`, `selectedLetters.length`, etc. — data already computed ~L749+).
- Overview tab: primary CTA = `Upload report` if no reports, else `Letter studio` / `Open letters` (mirror classic behavior).
- Wire CTA to `setTab('reports' | 'letters')` (inspector URL) — not dead handlers.

**Acceptance:** On Overview with zero reports, admin sees one obvious primary CTA (Upload report) in inspector chrome without scrolling.

---

## P1 — Parity polish (handlers, lenses, optional first-class overview)

### P1.1 Wire dead portfolio modals from inspector actions

**File:** `src/features/workspaceLightPreview/product/admin/AdminPrimarySignatureSurface.tsx`  
**Dead state today:** `activeModal` values `new_case`, `care_team`, `portal_access`, `parse_overview` (~L1276–1404) — **no** `setActiveModal('…')` callers in repo.

**Change:** Pass callbacks into `PartnerRecordInspector`, e.g.:

- `onOpenNewCase={() => setActiveModal('new_case')}`
- `onOpenCareTeam={() => setActiveModal('care_team')}`
- `onOpenPortalAccess={() => setActiveModal('portal_access')}`
- `onOpenParseOverview={(reportId?) => { setParseTargetReportId(reportId ?? null); setActiveModal('parse_overview'); }}`

Surface on inspector header or contextual strip when relevant (Overview / Reports).

**Acceptance:** Care team, portal access, new dispute case, and parse overview modals open from inspector UI; no orphaned modal code.

---

### P1.2 Partner view lens — tab context preservation

**File:** `PartnerRecordInspector.tsx` — `setLens`, lens bar (~L216–235, ~L319–326)

**Change:** When switching `partner-view` → `admin-file`, preserve last admin `?tab=` (do not wipe). When switching `admin-file` → `partner-view`, set `?view=partner` only. Document in UI: Partner view = portal mirror; admin workflows return via Admin file lens.

Optional: show read-only breadcrumb “Admin file · Overview” while on partner view so admins know where they return.

**Acceptance:** Round-trip lenses restores same admin tab; no surprise reset to Overview unless P0.1 openPartnerRecord fired.

---

### P1.3 Optional first-class `PartnerOverviewTab` in inspector body

**Files:**

- `src/features/partner/PartnerOverviewTab.tsx`
- `PartnerRecordInspector.tsx`

**Change (optional optimization):** When `activeTab === 'overview'`, render `PartnerOverviewTab` directly in inspector embed slot with props wired from portfolio surface (same handlers as `PartnerDetailPage` ~L1483–1514). Other tabs keep `<PartnerDetailPage embedded />`.

**Constraint:** Only if embed remount cost or double-chrome remains problematic after P0. Prefer P0 key/sync first.

**Acceptance:** Overview renders with identity strip, score tiles, KPI row, activity — visually matches classic Overview on admin file.

---

### P1.4 Contrast / empty-band hardening

**Files:**

- `PartnerRecordInspector.tsx` — `data-fc-contrast-band="1"` on embed wrapper (~L308)
- `adminPrimarySignature.css` — `.fc-wlp-partner-file-embed` (~L413–422)
- `src/features/partner/PartnerOverviewTab.tsx` — admin variant tiles

**Change:** Ensure overview body has visible accent rotation (emerald → violet → sky → rose) per brand rules; bump embed padding/min-height if overview hero collapses visually.

**Acceptance:** Overview never reads as an empty gray box on first paint (QA screenshot compare vs `qa-shots/admin-partners.png` baseline).

---

## P2 — QA, docs, regression guards

### P2.1 Click-test spec (Playwright)

**New or extend:** `e2e/admin-feature-parity.spec.ts` or dedicated `e2e/partner-inspector-overview.spec.ts`

Scenarios listed in [Click-test steps](#click-test-steps) below.

---

### P2.2 Deprecation hygiene

**Files:**

- `src/features/workspaceLightPreview/product/admin/AdminPartnerFileProductSurface.tsx` — stays `@deprecated`
- `docs/plans/ENHANCED_RECORD_INSPECTOR.md` — update partners row when P0 verified

---

### P2.3 Secondary drawer parity check

**File:** `AdminPrimarySignatureSurface.tsx` — `full_drawer` modal (~L1407–1413)

Ensure secondary classic embed also honors `?tab=overview` after P0.1 (same URL as inspector).

---

## File / function map

| Priority | File | Symbol / area |
|----------|------|----------------|
| P0 | `AdminPrimarySignatureSurface.tsx` | `openPartnerRecord`, `closePartnerRecord`, `PartnersPrimarySignatureSurface` |
| P0 | `PartnerRecordInspector.tsx` | `resolveInspectorTab`, `setTab`, `setLens`, embed `PartnerDetailPage`, new context CTA strip |
| P0 | `adminPrimarySignature.css` | `.fc-wlp-partner-file-embed [data-fc-entity-sticky-surface]` hide rule vs new chrome |
| P0 | `PartnerDetailPage.tsx` | Deep-link `useEffect`, `stickyBar` CTA logic (reference only; patch scripts if needed) |
| P1 | `AdminPrimarySignatureSurface.tsx` | `activeModal`, `handleCreateCase`, `parseTargetReportId`, modal panels |
| P1 | `PartnerOverviewTab.tsx` | Admin overview layout / KPI tiles |
| P1 | `EntityDetailShell.tsx` | `data-fc-entity-sticky-surface` (understand hide target) |
| P2 | `e2e/*.spec.ts` | Automated parity |
| — | `AdminPartnerFileProductSurface.tsx` | Secondary legacy — do not default |

---

## Acceptance criteria (release gate)

1. **Overview default:** Admin card click → inspector open → **Overview** tab active → `PartnerOverviewTab` content visible (scores/KPIs/activity).
2. **No tab desync:** Inspector tab label always matches embed body.
3. **Partner switch:** Selecting a different partner resets to Overview for that partner.
4. **Next step visible:** At least one contextual primary CTA visible on Overview without opening classic drawer (upload / letters path).
5. **Global rule intact:** Card click never navigates to legacy full-page `PartnerDetailPage` as default; enhanced inspector remains primary.
6. **Deep link:** `/admin/partners/:id?tab=reports` opens inspector with Reports selected (both chrome and body).
7. **Close behavior:** Close inspector → portfolio list; URL returns to `/admin/partners` (or preview equivalent).
8. **Typecheck:** `npm run typecheck` passes after implementation.

---

## Click-test steps (manual QA)

Prereq: `npm run dev` → admin partners portfolio (`/admin/partners` or workspace-light preview route).

| # | Step | Expected |
|---|------|----------|
| 1 | Open partners portfolio | List + empty inspector slot |
| 2 | Click any partner card | Inspector opens; **Overview** tab active; overview content visible |
| 3 | Click **Reports** in inspector tabs | Reports panel; URL `?tab=reports` |
| 4 | Click a **different** partner card | Overview active again (not stuck on Reports) |
| 5 | Open partner → **Letters** → Close inspector → reopen same partner | Respects P0.1 (Overview on card click) |
| 6 | Deep link `/admin/partners/{id}?tab=letters` | Inspector + Letters body |
| 7 | On Overview with no report (demo partner if needed) | **Upload report** CTA visible in inspector chrome |
| 8 | Switch to **Partner view** lens | Portal-style dashboard; admin tabs hidden |
| 9 | Switch back to **Admin file** | Prior admin tab restored; workflows usable |
| 10 | Click **Classic full page** (secondary) | Wide drawer/modal only — not default route |
| 11 | Message / Ask Finely quick actions | Hub opens with correct `partnerId` |
| 12 | `npm run typecheck` | Exit 0 |

---

## Implementation order (recommended)

1. P0.1 `openPartnerRecord` URL reset  
2. P0.2 embed `key` + verify deep-link effect  
3. P0.3 tab lockstep sanity pass  
4. P0.4 inspector context CTA strip  
5. P1.1 wire modals  
6. P1.2 lens preservation  
7. P1.3 optional direct `PartnerOverviewTab`  
8. P1.4 contrast polish  
9. P2 Playwright + doc updates  

---

## Out of scope (this plan)

- Rewriting `PartnerOverviewTab` visual system (see `docs/plans/partner-overview-profile-professional-ui.md`)
- CRM/cases/debt inspector conversions (tracked in Wave 1R)
- Direct edits to `PartnerDetailPage.tsx` except via patch scripts when P0 key/sync insufficient
