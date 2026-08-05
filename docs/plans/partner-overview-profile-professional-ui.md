# Partner Overview + Profile — Professional Light UI Plan

Status: **PLAN ONLY** — no implementation yet.
Scope: `PartnerOverviewTab.tsx`, `PartnerProfileTab.tsx`, `EntityDetailShell.tsx`, `PartnerDetailSidebarNav.tsx`, `PageShell.tsx` (admin lane only), `finelyOsLightUi.ts` tokens used by these surfaces.
Out of scope: portal (partner-facing) dashboard, public marketing pages, letter studio, CRM boards — see "What NOT to change."

---

## 0. Root-cause audit (why it still looks dark today)

This matters because it changes *where* the fix has to happen — not just "pick lighter colors."

1. **`finelyOsLightUi.ts` is dark-by-default despite its name.** Almost every exported token hardcodes dark-theme Tailwind utilities directly: `text-white`, `text-white/75`, `text-white/90`, `bg-black/20`, `bg-black/25`, `bg-black/35`, `border-white/10`. These are literal utility classes, **not** driven by the `--fc-*` CSS variables. So even when an admin flips the site theme to "light," text and inner fills on Partner Overview/Profile stay white-on-dark.
   - Examples: `FINELY_OS_ENTITY_TITLE = 'text-xl font-semibold tracking-tight text-white'`, `FINELY_OS_ENTITY_BODY = '... text-white/75'`, `finelyOsGlowField()` → `bg-black/35 ... text-white/90`, the inline KPI/score tiles in `PartnerOverviewTab.tsx` (`rounded-xl border border-white/10 bg-black/20`) and `PartnerProfileTab.tsx` (`bg-black/25`, `border-white/15`).
   - The *card shell* (`fc-accent-card` via `finelyOsCatalogCard()`) **does** get a real light glass treatment through `html[data-fc-theme="light"] .fc-accent-card` rules in `src/index.css` — but the text and inner tiles sitting on top of it don't adapt, which is why toggling light theme today produces low-contrast, half-themed panels rather than a clean workspace.
2. **`PageShell.tsx` hardcodes the app shell.** The root wrapper is `className="... bg-fc-deep text-white ..."` — `bg-fc-deep` does resolve to `var(--fc-bg-deep)` (theme-aware), but `text-white` is literal. Back links (`text-white/60`), the H1, and the badge all use literal white-family classes too. So the admin page frame itself can't become a light workspace without touching `PageShell`.
3. **The "light" system that *does* work is built for public marketing,** not workspace admin: `finelyOsLightGlassPanel`, `fc-light-chrome-*`, `fc-light-mesh-section`, `fc-landing-wealthy-ivory` etc. are tuned for hero bands and sell sections (ivory/champagne with navy ink), gated behind `[data-fc-theme="light"]` and mixed with dark-depth "contrast bands." That aesthetic (multiple alternating bands, gold sell copy) is wrong for a dense admin workspace — we need a **separate, single, always-light admin surface** that isn't tied to the marketing dark/light toggle at all.
4. **Rainbow accent-per-tile pattern.** `finelyOsKpiTile()`, `finelyOsCatalogCard()`, `finelyOsEntityKpi()` cycle through violet/emerald/sky/fuchsia/rose per index or per call-site choice with no semantic meaning — this is the "rainbow accents / card soup" the user is flagging. In `PartnerOverviewTab.tsx` alone: hero card is `emerald`, KPI tiles cycle 0–3 (violet/emerald/sky/fuchsia), `overallScore` KPI cards use emerald/sky/fuchsia/amber by hint, "top improvements" panel is `sky`, quick-nav tiles are `sky`, activity card is `emerald`. Nothing here is wrong individually, but stacked on one page it reads as noisy rather than "one command hub."

**Conclusion:** we need (a) a new, dedicated **admin/partner-workspace surface** that renders light unconditionally (not gated by the marketing theme toggle), (b) new text/body/value tokens that use dark ink instead of white, and (c) a disciplined, mostly-monochrome accent system with 1–2 semantic colors instead of 5 decorative ones.

---

## 1. Visual direction — "Platinum Workspace"

Pick **cool platinum/graphite**, not cream/ivory (cream reads "marketing landing page," which the user explicitly wants to avoid) and not generic purple-AI-SaaS look (avoid indigo/violet as the dominant chrome color; keep violet only as one semantic accent, not the wallpaper).

### Palette (hex)

| Role | Token name | Value | Notes |
|---|---|---|---|
| Page background | `--fc-admin-bg` | `#F4F5F7` | Cool light graphite, not stark white — reduces glare on long sessions |
| Page background (deep/footer zones) | `--fc-admin-bg-deep` | `#EBEDF1` | Subtle depth for page edges |
| Card surface | `--fc-admin-surface` | `#FFFFFF` | Pure white cards *on* graphite bg = visible separation without borders doing all the work |
| Card surface (recessed / nested) | `--fc-admin-surface-sunken` | `#F7F8FA` | Inner tiles inside a white card (KPI cells, score cells) |
| Border | `--fc-admin-border` | `#E2E5EA` | Hairline, 1px, no glow/gradient borders |
| Border (emphasis) | `--fc-admin-border-strong` | `#CBD2DC` | Hover / focus resting state |
| Heading ink | `--fc-admin-ink` | `#141A22` | Near-black graphite, not pure `#000` |
| Body ink | `--fc-admin-ink-muted` | `#4B5563` | Slate-600-equivalent |
| Faint ink / meta | `--fc-admin-ink-faint` | `#8A93A3` | Timestamps, IDs, helper text |
| Primary accent (brand) | `--fc-admin-accent` | `#0F6B57` (deep emerald/teal) or existing brand green if brand color differs | One accent used for primary CTAs, active tab underline, focus ring |
| Status · good | `--fc-admin-status-ok` | `#0E8F6B` | Active, healthy, verified |
| Status · attention | `--fc-admin-status-warn` | `#B7791F` (amber-ink, not neon amber-glow) | Lead, pending, needs input |
| Status · risk | `--fc-admin-status-risk` | `#B42318` | Blocked, delete, danger |
| Status · info | `--fc-admin-status-info` | `#3B5BDB` | Neutral informational (used sparingly — e.g. one score band) |

Rationale for **cool graphite over cream/platinum-metallic**: the existing "platinum" tokens in the codebase (`fc-button-platinum`, `finelyOsLandingWealthyIvorySection`) are already claimed by marketing/luxury sell bands with gold accents — reusing that exact look in the admin workspace would blur the "am I on the marketing site or the tool" distinction the user wants ("each page recognizable and differentiated"). A cool, slightly blue-gray platinum (not warm ivory) reads as *professional SaaS workspace* (Linear/Notion/Stripe Dashboard territory) rather than *luxury sales page*.

### Typography & density
- Keep `Inter` (already the sans stack).
- Headings: semibold, not `font-light` (current `PageShell` H1 is `font-light` at `text-3xl…text-6xl` — far too "marketing hero" for a workspace; drop to `text-xl sm:text-2xl font-semibold` for admin detail pages per compact-luxury-ui rule).
- Body: `text-sm` default, `text-[13px]` for dense meta rows.
- No `uppercase tracking-[0.3em]` labels everywhere — reserve heavy letter-spacing for section eyebrows only (1 per card, not per field).

### What to avoid (explicit anti-goals)
- No `radial-gradient` glows behind every card (`FINELY_OS_KPI_ACCENTS`, `DECK_ACCENT` idle/active gradients).
- No `backdrop-blur` glass on a workspace list of data — glassmorphism belongs on marketing/hero surfaces, not on a table of scores.
- No 5-color rotation for KPI tiles. One accent per *type of thing* (status = semantic color, data = neutral graphite), not per index.
- No purple/violet as the default "app chrome" color (it currently is, via `FINELY_OS_SIDE_RAIL_GLOW`, `finelyOsViewTab` active states, `finelyOsListItem` default selected state). Violet becomes *one* optional semantic accent, e.g. reserved for "Profile" wayfinding only.

---

## 2. Overview vs Profile — job split

Today both tabs are visually similar "stack of `finelyOsCatalogCard` panels," and Overview already duplicates some of what Profile owns (status dropdown + scores appear on both). Tighten the split:

### Overview = command hub (read-first, glanceable, action-oriented)
Answers: *What's the state of this partner right now, and what should I do next?*

Keep:
- Identity strip: name, status chip, signup status chip, contact line, mailing line — **read-only** (status chip, not an editable dropdown — move status *change* to Profile or keep as a single quick-action button, not an inline `<select>` sitting in the hero).
- Primary score snapshot (EXP/EQF/TUC) — **latest only**, link to "Full score history" on Profile instead of rendering all rows.
- KPI strip (Reports / Letters / Debt / Open tasks) — 4 max, neutral tiles, no color rotation.
- Overall readiness score + top improvements — this is genuinely "command hub" content, keep it, but visually demote to a secondary card (not repeat the same visual weight as the hero).
- Activity feed (compact, last 5–6 items) with a link to full Notes — keep, this is a hub, not a duplicate of Notes.
- One clear primary CTA area: "Continue work" — surfaces the single most useful next tab (e.g., "Upload report" / "Open letters") instead of a 4-up quick-nav grid that duplicates the top tab bar.

Remove/relocate from Overview:
- The `status` `<select>` in the hero → move to Profile ("Partner status & lifecycle" field) or keep as a one-click segmented control but not a raw `<select>` in the hero (raw selects read as "unfinished form," not "command hub").
- `emptyCustomFieldSections` nudge banner — keep, but style as a single inline chip on the identity strip ("3 profile sections incomplete → Finish"), not a full-width amber bar competing with KPIs.

### Profile = identity, scores, access — the system-of-record editor
Answers: *Edit contact info, manage custom fields, configure entitlements/billing, view full score history, danger zone.*

Keep as-is structurally (contact & mailing form, custom field sections, billing/entitlements/DTI, full score history, danger zone) but:
- Remove any duplicate "quick stats" — Profile should not re-render the KPI strip or the top-improvements list; that lives only on Overview.
- Group into **3 clear sections** via left-hand in-page anchor nav (not stacked `<details>` accordions which hide content and feel like a FAQ page): **Identity & Contact**, **Access & Billing** (entitlements, DTI, Denefit contract), **Scores & History**. Danger zone stays pinned at the bottom, visually separated (already is).
- `<details>` accordions for "Billing, entitlements & DTI" and "Credit scores" currently hide important admin actions (grant entitlements, DTI) behind a collapsed disclosure by default — for an admin tool this is a discoverability regression. Replace with always-expanded sections + in-page anchor chips at the top of Profile so admins don't hunt for a `<summary>` toggle.

### Shared chrome, not shared content
Both tabs sit under the same `EntityDetailShell` sticky tab bar — that's correct and should stay the *only* navigation mechanism (see §3). Do not add a second tab strip or duplicate nav inside either tab body (no-duplicate-ui-layers rule).

---

## 3. Navigation & recognition cues

Problem today: `PARTNER_STICKY_TABS` uses 4 accent colors across 9 tabs with no consistent logic (`overview`=emerald, `profile`=violet, `reports`/`analysis`/`evidence`=sky, `letters`=amber, `tasks`/`notes`=emerald, `debt`=violet) — colors repeat across unrelated tabs, so color isn't actually a reliable recognition cue, just noise.

### Fix: semantic, not decorative, accent per tab family
| Tab | New accent role | Why |
|---|---|---|
| Overview | Neutral (graphite, active = accent underline only) | It's the hub, not "a" section — shouldn't compete visually |
| Profile | `violet` (kept — becomes *the one place* violet appears) | Distinct from Overview, consistently "edit mode" |
| Reports / Analysis / Evidence | `sky` (grouped — these are "source documents") | Already grouped in code; keep, but same swatch across all 3 so they read as one family with sub-tabs, not 3 unrelated colors |
| Letters | `amber` | Action/output family |
| Tasks / Notes | `emerald` | Ops/communication family |
| Debt | keep separate, e.g. `rose`/`slate` — currently reuses Profile's violet, which breaks recognizability | Give Debt its own color so it's not confused with Profile |

### Additional recognition cues
1. **Tab bar style**: switch active-tab styling from a filled gradient pill (`finelyOsViewTab`) to an **underline + label weight** pattern (common in Linear/Stripe/GitHub admin) — filled gradient pills at 9-wide are the "card soup meets rainbow" the user is flagging. Underline tabs scale better to 9 items and read calmer.
2. **Status chips**: keep `finelyOsStatusChip` concept but restrict palette to the 3 semantic states (ok/warn/blocked) — never introduce a 4th/5th hue for chips.
3. **Score strip**: give the EXP/EQF/TUC trio a fixed, always-identical visual treatment (3 equal cells, bureau mark/initial, consistent number size) wherever it appears (Overview snapshot, Profile full history) — right now Overview uses one style (`rounded-xl border border-white/10 bg-black/20`) and Profile uses a different one (`finelyOsCatalogCard('sky') !p-4`) for conceptually the same data. Unify into one `partnerScoreCell()` helper.
4. **Page identity**: `EntityDetailShell`'s `subtitle` currently reads the same generic sentence regardless of which tab is active ("Partner profile: reports, evidence…"). Make the subtitle context-aware per active tab (e.g., Profile → "Edit contact info, scores, and portal access.") so the page's *purpose* is legible without reading the tab bar.
5. **Sidebar nav component** (`PartnerDetailSidebarNav.tsx`) exists but is currently unused by `PartnerDetailPage` (only the sticky pill bar is wired up) — decide explicitly: either (a) delete/ignore this component for Partner Detail and keep the horizontal sticky bar as the single nav, or (b) adopt it as the *only* nav and remove the sticky pill bar. Don't ship both. Recommendation: keep horizontal sticky bar (works better at 9 tabs + mobile), retire `PartnerDetailSidebarNav` usage for this page to avoid the two-navigator anti-pattern already called out in the workspace rules.

---

## 4. Token changes needed

### 4a. New file: `src/features/os/finelyOsAdminSurface.ts` (new "partner admin surface" helpers)
Rather than mutating `finelyOsLightUi.ts` in place (high blast radius — it's used across CRM boards, comms hub, letter studio, public catalog cards), add a **new, additive** token module scoped to admin entity workspaces (Partner Detail first, reusable later for other admin detail pages). This satisfies "phased, small PRs" and avoids regressing dark surfaces still intentionally dark (comms hub, CRM board, AI widget).

Proposed exports (values per §1 palette, implemented as Tailwind arbitrary-value/utility strings, mirroring the existing helper-function style):
```ts
// Page / shell
export const FC_ADMIN_PAGE = 'space-y-4';
export const FC_ADMIN_SHELL_BG = 'bg-[#F4F5F7]'; // or CSS var --fc-admin-bg once added to index.css

// Card surfaces (flat, hairline border, no blur/glow)
export function fcAdminCard(padding = 'p-5') { /* bg-white border border-[#E2E5EA] rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] */ }
export function fcAdminInnerTile() { /* bg-[#F7F8FA] border border-[#E2E5EA] rounded-xl */ }

// Typography
export const FC_ADMIN_TITLE = 'text-xl font-semibold tracking-tight text-[#141A22]';
export const FC_ADMIN_SUBLABEL = 'text-[11px] font-semibold uppercase tracking-wide text-[#8A93A3]';
export const FC_ADMIN_BODY = 'text-sm leading-relaxed text-[#4B5563]';
export const FC_ADMIN_VALUE = 'font-semibold tracking-tight text-[#141A22]';

// Inputs
export const FC_ADMIN_INPUT = 'w-full rounded-lg border border-[#E2E5EA] bg-white px-3 py-2 text-sm text-[#141A22] placeholder:text-[#8A93A3] focus:outline-none focus:border-[#0F6B57] focus:ring-2 focus:ring-[#0F6B57]/15';

// Status chips (3 semantic states only)
export function fcAdminStatusChip(tone: 'ok' | 'warn' | 'blocked') { /* pill, tinted bg + ink text, no glow */ }

// Buttons
export const FC_ADMIN_PRIMARY_BTN = '...'; // solid accent fill, white text
export const FC_ADMIN_SECONDARY_BTN = '...'; // outline, graphite ink
export const FC_ADMIN_DANGER_BTN = '...'; // outline red, fills solid on hover only

// Tabs (underline style, semantic per family — see §3)
export function fcAdminTab(active: boolean, family: 'neutral'|'violet'|'sky'|'amber'|'emerald'|'rose') { /* border-b-2, no gradient fill */ }

// Score cell (unify Overview + Profile score display)
export function fcAdminScoreCell() { /* used for EXP/EQF/TUC everywhere */ }
```

### 4b. `src/index.css` additions
- Add a **new, always-on scope class** (not gated by `data-fc-theme`), e.g. `.fc-admin-workspace { background: var(--fc-admin-bg); color: var(--fc-admin-ink); }`, applied by `PageShell` only when `appSurface === 'admin'` **and** a feature flag / route match for entity-detail pages, so it doesn't fight the existing dark admin list/board pages on day one (phased rollout, see §5).
- Add the new `--fc-admin-*` CSS custom properties from §1 under `:root` (single value set — this surface does *not* need a dark variant; it's intentionally "the light admin workspace," full stop, not theme-toggle-dependent). This directly resolves the "Light naming vs dark reality" confusion: `finelyOsLightUi.ts` keeps its current (mostly dark) behavior for CRM/comms/letter studio, while the *new* module is unambiguously, unconditionally light.

### 4c. `EntityDetailShell.tsx`
- Add optional prop `surface?: 'default' | 'adminLight'`. When `'adminLight'`, wrap children in the `.fc-admin-workspace` scope class and swap `FINELY_OS_PAGE` spacing token for `FC_ADMIN_PAGE`. Keeps the shell backward-compatible for every other entity page (cases, projects, templates) that isn't being touched yet.

### 4d. `PageShell.tsx`
- Minimal, surgical change: when rendering the admin hero for a route flagged `adminLight` (passed down or derived from a route allowlist), swap the hardcoded `text-white`, `font-light text-3xl…text-6xl`, `text-white/55` classes for the new admin ink tokens, and drop the H1 down to `text-xl sm:text-2xl font-semibold` (compact-luxury-ui already requires `text-xl` in workspace, this page currently violates that rule at `text-3xl…text-6xl`).
- Do not change `PageShell` globally — every other admin list page currently depends on the dark hero; gate this behind the same `adminLight` signal as `EntityDetailShell`.

---

## 5. Phased implementation (small PRs)

**PR 1 — Tokens only, no visual change yet.**
Add `finelyOsAdminSurface.ts` + new `--fc-admin-*` CSS vars + `.fc-admin-workspace` scope class in `index.css`. Nothing imports it yet. Zero visual diff, safe to merge anytime.

**PR 2 — `EntityDetailShell` + `PageShell` opt-in surface.**
Add the `surface` prop / `adminLight` signal plumbing described in §4c/4d, defaulted to current behavior everywhere. Still zero visual diff until a page opts in.

**PR 3 — Partner Overview redesign (opt in).**
Rewrite `PartnerOverviewTab.tsx` against the new tokens per §2 (identity strip read-only, unified score cell, neutral KPI tiles, demote readiness/top-improvements, compact activity, single "continue work" CTA, remove quick-nav 4-up grid if redundant with tab bar). Turn on `surface="adminLight"` for the Partner Detail route only.

**PR 4 — Partner Profile redesign.**
Rewrite `PartnerProfileTab.tsx`: replace `<details>` accordions with always-expanded anchor-navigable sections (§2), unify score cell with Overview's, apply new tokens, keep danger zone at bottom.

**PR 5 — Tab bar + recognition cues.**
Update `PARTNER_STICKY_TABS` accent map (§3 table), switch `finelyOsViewTab` usage on this page only to a new `fcAdminTab` underline style (don't touch `finelyOsViewTab` globally — it's used elsewhere), make `EntityDetailShell` subtitle context-aware per tab, retire unused `PartnerDetailSidebarNav` import from this flow (or delete the file if confirmed unused elsewhere).

**PR 6 — Polish pass.**
Visual QA at mobile (2-col sticky tab wrap), verify contrast (WCAG AA) on every new ink/bg pairing, verify empty states (no scores yet / no activity yet) read cleanly on white, screenshot before/after for review.

Each PR should be reviewable independently and revertable without touching the others (tokens → plumbing → Overview → Profile → nav polish → QA).

---

## 6. What NOT to change

- **Partner Portal** (`/portal/...`, `PartnerPortalNav`, portal dashboard/checklist/disputes) — explicitly out of scope; portal keeps its current dark/obsidian workspace treatment (`PartnerCreditRestoreCommandStrip` etc.) unless the user asks separately.
- **Public marketing site** (landing pages, pricing, hero sections, `finelyOsLandingWealthyIvorySection`, `finelyOsCatalogCard` public usages) — the existing dark/platinum/ivory alternating-band system stays as-is; it's a different product surface with different goals (sell, not operate).
- **CRM / Kanban boards, Communications Hub, Finely AI widget, Letter Studio** — these intentionally keep the dark obsidian + spotlight-glow treatment (`FINELY_OS_COLUMN_THEMES`, `FINELY_OS_COMMS_SHELL`, `FINELY_OS_AI_WIDGET`). Do not touch `finelyOsLightUi.ts` exports in place; only add new, additive tokens.
- **Other admin entity pages** (Cases, Projects, Templates, Settings, admin Partners *list*) — not touched in this plan; `EntityDetailShell`'s new `surface` prop defaults to current behavior for them. A future follow-up plan can extend the same admin-light surface once Partner Overview/Profile validate the direction.
- **`finelyOsViewTab`, `finelyOsKpiTile`, `finelyOsCatalogCard` global exports** — left untouched; new `fcAdminTab` / `fcAdminCard` helpers are additive siblings, not replacements, to avoid regressing every other surface that imports the existing tokens.
- **Theme toggle system** (`FinelySiteThemeProvider`, `data-fc-theme`) — the new admin workspace surface is unconditionally light and does not participate in the dark/light/system toggle; no changes needed to `finelySiteTheme.ts` / `finelyThemeAccess.ts`.

---

## Appendix: file-by-file touch list

| File | Change type |
|---|---|
| `src/features/os/finelyOsAdminSurface.ts` | **New** |
| `src/index.css` | Additive: new `--fc-admin-*` vars + `.fc-admin-workspace` scope |
| `src/components/layout/EntityDetailShell.tsx` | Additive prop (`surface`) |
| `src/components/layout/PageShell.tsx` | Additive branch for `adminLight` hero styling |
| `src/features/partner/PartnerOverviewTab.tsx` | Rewrite (PR 3) |
| `src/features/partner/PartnerProfileTab.tsx` | Rewrite (PR 4) |
| `src/pages/admin/PartnerDetailPage.tsx` | Update `PARTNER_STICKY_TABS` accents, opt into `surface="adminLight"`, context-aware subtitle |
| `src/features/partner/PartnerDetailSidebarNav.tsx` | Confirm unused → remove import (or delete file if orphaned) |
| `src/features/os/finelyOsLightUi.ts` | **No changes** (left intact for CRM/comms/letters/public) |
