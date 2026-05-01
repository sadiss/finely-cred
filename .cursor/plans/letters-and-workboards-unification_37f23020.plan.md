---
name: letters-and-workboards-unification
overview: Fix Letters UI by swapping the partner Letters preview to the same Templates-style paper preview (without changing letter content logic), then unify Projects + Tasks into a tenant-configurable WorkBoard system with Kanban/List/Calendar views and drag-and-drop across portal + admin, with separate Personal vs Business boards.
todos:
  - id: letters-preview-iframe
    content: Implement Templates-style iframe paper preview for Partner Letters, keeping existing content/features; add full-preview modal.
    status: completed
  - id: letters-edit-opening-closing
    content: Add per-bureau editable Opening + Closing editors; wire to preview + PDF; persist in letters draft store.
    status: completed
  - id: settings-stage-defs
    content: Extend tenant settings to store configurable stage definitions for projects and tasks; add Admin Settings UI to manage them.
    status: completed
  - id: workboard-components
    content: Create shared WorkBoard components (Kanban/List/Calendar) and integrate into Partner Projects, Partner Tasks, Admin Projects, Admin Project Detail.
    status: completed
  - id: workboard-dnd
    content: Add drag-and-drop stage moves using dnd-kit for tasks and projects across all boards; ensure store refresh + audit hooks if needed.
    status: completed
  - id: workboard-scope
    content: Add personal/business scope to projects/tasks, include separate boards and an aggregated 'All work' view for each scope.
    status: completed
isProject: false
---

## Goals

- **Letters**: keep all existing behavior (AI drafts, templates, screenshots, dispute item structure, PDF output) but **replace the partner Letters preview UI** with the same **Templates preview style** (iframe + `srcDoc` paper rendering) so there’s no overlay/bleed and it’s easy to view.
- **Letters editing**: provide **editable top + bottom** sections per bureau (Opening + Closing). Do **not** add editing for the dynamic item blocks.
- **Projects/Tasks**: make Projects and Tasks **uniform** with **Kanban + List + Calendar** views everywhere, with **multi-stage kanban** and **drag-and-drop** stage moves.
- **Personal vs Business**: when a partner has both profiles, provide **separate boards** (Personal board and Business board) in all views.
- **Aggregations**: provide an “All work” view that can show **all projects and all tasks** for a person/company in all three views.

## Non-goals / constraints

- Do **not** change the semantics of letter generation, evidence linking, AI drafting, template apply, or PDF structure—only the **preview UI** and **top/bottom editors**.
- Keep page-level scrolling as the default; if the preview needs an internal scroll, keep it contained to a fixed-height preview frame.

## Current code anchors

- **Partner Letters generation**: `src/components/letters/LettersCommandCenter.tsx`
- **Dispute PDF generation**: `src/letters/generateDisputePdfInline.ts`
- **Templates preview style** (iframe + `srcDoc`): `src/pages/admin/AdminTemplatesPage.tsx` (see the `previewSrcDoc` + `<iframe srcDoc=...>` pattern)
- **Projects (partner)** already has view toggle: `src/pages/portal/PartnerProjectsPage.tsx` (`view: 'kanban'|'list'|'calendar'`)
- **Tasks (partner)** is currently queue/activity only: `src/pages/portal/PartnerTasksPage.tsx`
- **Projects (admin)** list table: `src/pages/admin/AdminProjectsPage.tsx`
- **Domain models**: `src/domain/projects.ts`, `src/domain/tasks.ts`
- **Repos**: `src/data/projectsRepo.ts`, `src/data/tasksRepo.ts`

## Workstream A — Letters UI (Templates-style paper preview)

### A1) Create a shared Templates-style paper preview utility

- Add a small shared helper that builds `srcDoc` for paper preview, reusing the same strategy as Admin Templates:
  - A “print-safe” CSS reset (force white background, black text)
  - Page geometry (US Letter)
  - Prose styling (`.fc-paper-prose` equivalent)
- Suggested new module:
  - `src/components/letters/paperPreviewSrcDoc.ts` (pure function)
  - Optional wrapper component: `src/components/letters/PaperPreviewFrame.tsx`

### A2) Render the dispute letter into preview HTML

- In `src/components/letters/LettersCommandCenter.tsx`, build the **same letter content** currently used for preview/PDF:
  - bureau header block + subject
  - opening paragraphs (editable)
  - dispute item blocks (account/type, evidence screenshot, reasons, AI narrative)
  - closing block (editable) + signature
- Evidence screenshots:
  - Use `getBlobUrl(ref, { preferSigned: true, mimeType })` to obtain URLs.
  - Inject those URLs into the HTML preview (so screenshots render inline).
  - Track/revoke blob URLs on unmount.

### A3) Replace the current preview widget with the iframe preview frame

- Swap the partner Letters preview panel to use `<iframe srcDoc=...>` just like Templates.
- Add a **“Full preview”** action that opens the preview in a modal (same iframe) for easy review.

### A4) Add editable Opening + Closing per bureau

- Opening exists already (intro editor). Add:
  - `footerByBureau: Record<Bureau,string>` stored as HTML.
  - UI: RichText editor labeled “Closing / demand block”.
  - Reset-to-default button per bureau.
- Wire into output:
  - Preview: uses sanitized HTML
  - PDF: pass `footerOverride` as plain text derived from the HTML (same approach used for intro).
- Persist these in the Letters draft store:
  - `src/data/lettersCommandCenterDraftRepo.ts` add `footerByBureau`.

### A5) Preserve AI + templates + screenshots

- Keep AI draft button behavior; it can still populate:
  - opening paragraphs
  - per-item narratives
- Keep template apply behavior (opening paragraphs replacement).
- Keep evidence linking flow; preview should show either:
  - screenshot inline, or
  - an explicit placeholder if screenshot URL fails.

### Acceptance checks (Letters)

- `/portal/letters`
  - No “white page overlaying text behind it”.
  - Preview is readable, bounded, and matches the Templates preview style.
  - Editing works for **both top and bottom** text.
  - Screenshots show inline in the preview when attached.
  - Generated PDF still matches existing structure and includes screenshots.

## Workstream B — WorkBoard unification (Projects + Tasks)

### B1) Add tenant-configurable stages

- Add stage definitions to tenant settings (default to the current stage set).
- Store two lists:
  - `projectStages[]`
  - `taskStages[]`
- Add an Admin Settings panel to edit (add/rename/reorder/disable).
  - Target: `src/pages/admin/AdminSettingsPage.tsx`
  - Backing store: `src/domain/settings.ts`, `src/data/settingsRepo.ts`

### B2) Add personal vs business scope to Projects and Tasks

- Extend models:
  - `Project.scope: 'personal'|'business'` (default `personal`)
  - `TaskItem.scope: 'personal'|'business'` (default `personal`)
- Update repos (`projectsRepo.ts`, `tasksRepo.ts`) to preserve backwards compatibility by defaulting missing scope.
- Update `ensureDefaultProjectForPartner` to create/seed the correct default projects for each scope.

### B3) Build shared WorkBoard components

- New shared UI under `src/components/workboard/`:
  - `WorkBoardShell` (header: view toggle, scope toggle, filters)
  - `WorkKanbanBoard` (columns from tenant stage defs)
  - `WorkListView` (table/cards)
  - `WorkCalendarView` (month grid; uses `dueAt`)
- Use these for:
  - Partner Projects page: `src/pages/portal/PartnerProjectsPage.tsx`
  - Partner Tasks page: `src/pages/portal/PartnerTasksPage.tsx` (replace queue/activity as primary with board views; keep Activity as a secondary tab)
  - Admin Projects page: `src/pages/admin/AdminProjectsPage.tsx`
  - Admin Project detail page: `src/pages/admin/AdminProjectDetailPage.tsx` (board for project tasks)

### B4) Drag-and-drop Kanban (sitewide)

- Implement DnD with a modern maintained library (recommend `@dnd-kit/*`).
- Behaviors:
  - Drag task card between columns → update `task.stage`.
  - Drag project card between columns → update `project.stage`.
  - Optional: reorder within a column (store `sortOrder` later; v1 can skip reorder persistence).
- Ensure updates emit `finely:store` so all pages react immediately.

### B5) Aggregated “All work” views

- Provide a unified view that can show:
  - All Projects for the scope
  - All Tasks for the scope
  - Filter by project, stage, status, due date
- Implement as:
  - either a new route (e.g. `/portal/work`) linked from portal nav, or
  - an expanded Projects/Tasks page with a top-level “All work vs This project” switch.

### Acceptance checks (WorkBoard)

- Partner:
  - `/portal/projects` and `/portal/tasks` both offer **Kanban/List/Calendar**.
  - Scope toggle shows **Personal** vs **Business**.
  - Dragging cards updates stage consistently.
  - “All work” view shows both projects and tasks across the scope.
- Admin:
  - `/admin/projects` offers the same views and DnD.
  - Stages are driven by tenant settings.

## Dependencies

- Add DnD dependencies:
  - `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

## Execution order

1. Letters preview swap + top/bottom editors (unblocks your core workflow).
2. Tenant stage model + Admin Settings UI.
3. WorkBoard components.
4. DnD kanban behaviors.
5. Aggregate “All work” views + adoption across pages.

