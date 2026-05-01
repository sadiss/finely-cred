---
name: Letters + Restore Experience Boost
overview: Make the letter area and overall credit-restore flow more results-driven, clearer, and more engaging, while improving the Partner Journey Map into a world-map style experience and reducing the “long list / constant scrolling” feel across the app.
todos:
  - id: letters-hud-readiness
    content: Add Restore Progress HUD + Letter Readiness Score + bulk actions in `LettersCommandCenter` dispute flow.
    status: completed
  - id: restore-mode-intel
    content: Add guided Restore Mode strip + focused negative-item drilldowns in Reports/Credit Intel.
    status: completed
  - id: journey-map-world
    content: Implement `JourneyMapView` world-map journey and set it as default on Partner Dashboard.
    status: completed
  - id: anti-long-list-patterns
    content: Apply grouping/clamp/pagination patterns to key long-list pages to reduce endless scrolling.
    status: completed
  - id: layout-width-pass
    content: Adjust app-wide content width and admin rail spacing for more room site-wide.
    status: completed
  - id: instrument-funnel
    content: Add audit events for restore/letter funnel and expose basic counts for admins.
    status: completed
isProject: false
---

## Outcomes (what “+50% better” means)

- **Faster time-to-first-letter**: fewer clicks and less confusion from Reports → Evidence → Letters.
- **Higher completion rate**: more users successfully reach “Generated PDF + saved to vault” with all evidence/reasons attached.
- **More engaging progress**: clear progress, milestones, and rewards for completing the credit restore workflow.
- **Less “endless list” UI**: replace long lists with focused dashboards, grouping, filters, pagination, and progressive disclosure.

## Key decisions captured

- **Journey map style**: World-map themed route.
- **Scrollbar goal**: Not “hide scrollbars everywhere no matter what”; instead reduce the need for scrolling lists and use cleaner layouts. Where scroll is necessary, prefer subtle/auto-hide scroll indicators.

## Phase 1 — Letter Area: Results-driven “Restore Command Center” UX

Target file: `src/components/letters/LettersCommandCenter.tsx`

- Add a **Restore Progress HUD** at the top of Dispute flow:
  - Steps: Upload report → Review intel → Capture evidence → Select disputes → Select reasons → Generate PDF → Mail/Track.
  - Show a **progress %** and a “Next best action” button.
- Add a **Letter Readiness Score** per bureau letter:
  - Evidence attached count, reasons selected count, missing items list.
  - One-click actions: “Attach first missing evidence”, “Select recommended reasons for all”.
- Add **Bulk actions**:
  - Apply recommended reasons to all selected disputes (with undo).
  - Clear/Reset per bureau.
  - Group selected disputes by creditor/type and collapse groups.
- Make the **drafting experience feel “studio-like”** everywhere:
  - Dispute letters: keep the new side-by-side studio and make “Open studio” the default on first use.
  - Validation/Court: upgrade preview to include optional enclosure preview/labeling.

Supporting areas:

- `src/pages/portal/PartnerLettersPage.tsx` and embedded admin letters view in `src/pages/admin/PartnerDetailPage.tsx` (ensure the same UX, same progress HUD).
- `src/pages/portal/PartnerLettersVaultPage.tsx` (add “Resume where you left off” and clearer “what to do next” after generating).

## Phase 2 — Credit Restore Experience: make Reports/Intel feel like a guided workflow

Targets:

- `src/pages/portal/PartnerReportsPage.tsx`
- `src/components/creditIntel/CreditIntelTabs.tsx`
- `src/pages/portal/PartnerDashboardPage.tsx`

Changes:

- Add a **guided “Restore Mode” strip** above Credit Intel:
  - Shows what to do next (ex: “Capture evidence for these 3 negatives”).
  - Deep-links to the correct tab + auto-scroll (you already have initial tab + scroll support).
- Add **negative-item focus** views:
  - Instead of scrolling huge lists, show “Top issues” cards (collections/late pays/high utilization) with drill-down.
- Add “Evidence completeness” signals:
  - For each candidate, show whether a screenshot is linked; enable “Fix missing evidence” mode.

## Phase 3 — Partner Journey Map: world-map experience (fun + motivating)

Targets:

- Add new component: `src/components/journey/JourneyMapView.tsx` (SVG-based world route with stops)
- Update: `src/components/journey/JourneyRoadmap.tsx` (becomes wrapper: timeline view + map view)
- Update: `src/pages/portal/PartnerDashboardPage.tsx` (default to map view)

Behavior:

- World route with the existing stages as “cities/stops”.
- Each stop shows:
  - What it unlocks
  - What counts as “done”
  - Current progress signals (reports/evidence/open tasks)
- Add small “rewards”:
  - Badges (evidence discipline, first letter generated, first case created)
  - Streaks (days with progress)

## Phase 4 — Site-wide: reduce long-list scrolling + cleaner page flow

Targets:

- `src/components/ui/CollapsibleSection.tsx` (expand clamp presets; add optional “Show more (N)” pattern)
- `src/index.css` (add **auto-hide scrollbar utilities** for app-only containers, not global)
- `src/components/layout/PageShell.tsx` (ensure app pages use consistent scroll container + spacing)
- Selected high-traffic list pages:
  - `src/pages/portal/PartnerTasksPage.tsx`
  - `src/pages/portal/PartnerDocumentsPage.tsx`
  - `src/pages/portal/PartnerDisputesPage.tsx`

Pattern changes:

- Replace giant lists with:
  - KPI summary row + filters
  - Grouping + collapsible clusters
  - Pagination / “Load more”
  - Sticky mini-header for actions

## Phase 5 — Width/space improvements (more breathable layouts)

Targets:

- `src/index.css` (`.fc-container` max-width and padding)
- `src/components/layout/PageShell.tsx` (admin rail width + main column spacing)

Deliverables:

- Wider readable content (less cramped cards)
- Keep nav usable while giving main content more room

## Validation

- Add lightweight event logging via `src/data/auditRepo.ts` for key funnel events:
  - `report.uploaded`, `evidence.captured`, `letter.disputes_selected`, `letter.evidence_complete`, `letter.generated`, `letter.saved`
- Spot-check:
  - Dispute letter flow from 0 → PDF generated
  - Evidence attach without losing progress
  - Journey map renders correctly for different lanes

