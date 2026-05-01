---
name: next_wave_power_modules
overview: "Plan the next build wave to unify Finely Cred modules and add major expansions: 30+ Course Builder capabilities, a significantly more powerful Video Generator, 20+ new fields/options across Tasks/Projects/CRM/Courses/Automations/Comms (plus Business Profile), stage-colored Kanban, letter categorization, editable analysis reports, expanded Automations (+20 actions), expanded Comms Studio (+30 features), and major Business + Personal credit tracking/roadmaps."
todos:
  - id: workboard-20plus-fields
    content: Extend Projects/Tasks domains to 20+ fields; update repos normalization + migrations
    status: completed
  - id: workboard-create-anywhere
    content: Add shared create/edit modal and enable creating tasks/projects from both Projects and Tasks pages with permissions
    status: completed
  - id: workboard-stage-colors
    content: Add stage color to WorkStageDefinition; update AdminSettings stage editor; apply colors in Kanban/List/Calendar
    status: completed
  - id: courses-block-registry
    content: Implement Course Block Registry and add 30+ lesson block types with editor + renderer
    status: completed
  - id: courses-templates
    content: Add Course Templates repo + UI; ship 30+ starter templates/presets
    status: completed
  - id: courses-automation-modules
    content: Add prerequisites, drip rules, enrollment, and certificate issuance/download
    status: completed
  - id: media-video-generator-power
    content: Upgrade Media Studio data model + UI for timeline, transitions, audio/voiceover, captions, batch render, presets
    status: completed
  - id: automations-registry-plus20
    content: Implement Automation action/condition registry and add 20+ new actions across workboard/comms/letters/credit/CRM
    status: completed
  - id: comms-studio-plus30
    content: Add sequences/campaigns + advanced templating + preferences + analytics; expand Comms Studio by 30+ features
    status: in_progress
  - id: crm-plus15-plus20fields
    content: Expand CRM prospects + leads with 20+ fields using custom fields infra; add +15 feature upgrades (scoring, convert, dedupe, analytics, assignment)
    status: pending
  - id: credit-personal-tracking
    content: Add Personal Credit tracking domain/repo/pages with snapshots, utilization, disputes, goals
    status: pending
  - id: credit-business-profile-20fields
    content: Expand Business Profile to 20+ fields and integrate into Business Portal flows
    status: pending
  - id: letters-categorization
    content: Add letter category taxonomy and update Letters Vault to filter/group; ensure generators set category
    status: pending
  - id: analysis-template-editable
    content: Make Credit Analysis Reports template-driven and editable in Templates; link template version to rendered evidence
    status: pending
  - id: roadmap-3d-overhaul
    content: Replace roadmap UI with premium 3D-style roadmap component (faux-3D default; optional true 3D) and expand roadmap content drastically
    status: pending
isProject: false
---

# Next wave: powerful modules + unified platform plan

## P0 goals (your selected priorities)

- **Course Builder**: 30+ lesson block types + 30+ templates + automation modules (drip/prereqs/certs).
- **Video Generator**: materially more useful for real production workflows (timeline, audio/voice, templates, exports, batch, asset library).
- **Projects/Tasks**: 20+ fields/options, create/edit projects+tasks from both pages, stage color Kanban.

## Guiding principles (keep everything unified)

- **Registry-driven options**: for “30+ options” and “20+ actions”, implement registries so UI + validation + defaults come from a single source of truth.
- **Entity linking everywhere**: tasks/projects/letters/evidence/reports/disputes/comms share a common `EntityRef`/`EntityLink` model so everything cross-navigates cleanly.
- **Local-first, upgradeable**: maintain current local stores (`localJsonStore`) while designing optional Supabase sync hooks later.

## Current code map (anchors for the plan)

- **Projects/Tasks + Kanban**
  - Domain: [src/domain/projects.ts](src/domain/projects.ts), [src/domain/tasks.ts](src/domain/tasks.ts)
  - Repos: [src/data/projectsRepo.ts](src/data/projectsRepo.ts), [src/data/tasksRepo.ts](src/data/tasksRepo.ts)
  - Workboard settings: [src/domain/settings.ts](src/domain/settings.ts), [src/data/settingsRepo.ts](src/data/settingsRepo.ts)
  - Kanban UI: [src/components/workboard/WorkKanbanBoard.tsx](src/components/workboard/WorkKanbanBoard.tsx), [src/components/workboard/WorkBoardShell.tsx](src/components/workboard/WorkBoardShell.tsx)
  - Pages: [src/pages/admin/AdminProjectsPage.tsx](src/pages/admin/AdminProjectsPage.tsx), [src/pages/admin/AdminProjectDetailPage.tsx](src/pages/admin/AdminProjectDetailPage.tsx), [src/pages/portal/PartnerProjectsPage.tsx](src/pages/portal/PartnerProjectsPage.tsx), [src/pages/portal/PartnerTasksPage.tsx](src/pages/portal/PartnerTasksPage.tsx), [src/pages/portal/PartnerWorkPage.tsx](src/pages/portal/PartnerWorkPage.tsx)
- **Courses**
  - Domain: [src/domain/courses.ts](src/domain/courses.ts)
  - Repo: [src/data/coursesRepo.ts](src/data/coursesRepo.ts)
  - Admin: [src/pages/admin/AdminCoursesPage.tsx](src/pages/admin/AdminCoursesPage.tsx), [src/pages/admin/AdminCourseEditorPage.tsx](src/pages/admin/AdminCourseEditorPage.tsx)
  - Portal: [src/pages/portal/PartnerCoursesPage.tsx](src/pages/portal/PartnerCoursesPage.tsx), [src/pages/portal/PartnerCoursePage.tsx](src/pages/portal/PartnerCoursePage.tsx)
- **Automations**
  - Domain: [src/domain/automationStudio.ts](src/domain/automationStudio.ts), [src/domain/automation.ts](src/domain/automation.ts)
  - Execution: [src/automation/agentRunner.ts](src/automation/agentRunner.ts), [src/automation/runWorkflows.ts](src/automation/runWorkflows.ts)
  - UI: [src/pages/admin/AdminAutomationsPage.tsx](src/pages/admin/AdminAutomationsPage.tsx), [src/components/automation/AutomationRuleEditor.tsx](src/components/automation/AutomationRuleEditor.tsx)
- **CRM + Comms Studio**
  - CRM domain/repos: [src/domain/crmProspects.ts](src/domain/crmProspects.ts), [src/data/crmProspectsRepo.ts](src/data/crmProspectsRepo.ts), [src/domain/leads.ts](src/domain/leads.ts), [src/data/leadsRepo.ts](src/data/leadsRepo.ts), [src/domain/leadOps.ts](src/domain/leadOps.ts), [src/data/leadOpsRepo.ts](src/data/leadOpsRepo.ts)
  - Comms domain/repos: [src/domain/comms.ts](src/domain/comms.ts), [src/data/commsRepo.ts](src/data/commsRepo.ts)
  - Comms engine: [src/lib/commsEngine.ts](src/lib/commsEngine.ts), delivery: [src/lib/commsDeliveryClient.ts](src/lib/commsDeliveryClient.ts)
  - Pages: [src/pages/admin/AdminCrmPage.tsx](src/pages/admin/AdminCrmPage.tsx), [src/pages/admin/AdminCommsStudioPage.tsx](src/pages/admin/AdminCommsStudioPage.tsx)

## Wave 1 (P0): Projects/Tasks “power workboard” + stage colors + create everywhere

### A) Add 20+ fields/options to Tasks + Projects

- **Tasks (`src/domain/tasks.ts`)** add fields (examples; final set ≥20):
  - `projectId?`, `stage?`, `status`, `priority`, `kind`
  - `ownerUserId?`, `assigneeUserIds?` (already), `watcherUserIds?`
  - `startAt?`, `dueAt?`, `completedAt?`, `lastTouchedAt?`
  - `estimateMinutes?`, `actualMinutes?`
  - `tags?`, `labels?`, `blockedByTaskIds?`, `blockingTaskIds?`
  - `linkedEntities?: EntityRef[]` (letters/evidence/reports/disputes/comms)
  - `checklist` (already), `statusHistory` (already)
  - `notes?`, `attachments?: { evidenceId?: string; blobRef?: string; filename?: string }[]`
  - `visibility?: 'partner' | 'admin' | 'hybrid'` (enforce your “DFY partners can’t assign” rule)
- **Projects (`src/domain/projects.ts`)** add fields (≥20 combined project options):
  - `stage`, `status`, `priority?`, `targetCloseAt?`, `startedAt?`, `completedAt?`
  - `budgetCents?`, `expectedValueCents?`
  - `primaryContact?`, `company?`
  - `assigneeUserIds?`, `watcherUserIds?`
  - `tags?`, `linkedEntities?: EntityRef[]`
  - `health?: 'green'|'amber'|'red'`, `riskFlags?: string[]`
  - `customFields?: Record<string, unknown>` (bridge to your custom fields system)
- Update normalization in repos: [src/data/tasksRepo.ts](src/data/tasksRepo.ts), [src/data/projectsRepo.ts](src/data/projectsRepo.ts).

### B) Create/edit Projects and Tasks from both “Projects” and “Tasks” pages

- **Admin + Portal**: add “Create task” within project context, and “Create project” from tasks context.
- Implement a shared modal/sheet:
  - `src/components/workboard/WorkItemCreateModal.tsx` (new)
  - Supports: create Project, create Task, create Task in Project
- Ensure permissions:
  - Partners can create tasks only when `visibility !== 'admin'` and entitlement/lane allows; DFY partners blocked from assigning.

### C) Kanban stage colors

- Extend `WorkStageDefinition` in [src/domain/settings.ts](src/domain/settings.ts): add `color?: string`.
- Update Admin Settings stage editor in [src/pages/admin/AdminSettingsPage.tsx](src/pages/admin/AdminSettingsPage.tsx) to pick colors.
- Apply in:
  - [src/components/workboard/WorkKanbanBoard.tsx](src/components/workboard/WorkKanbanBoard.tsx): column headers + subtle column accent + card indicator.
  - [src/components/workboard/WorkListView.tsx](src/components/workboard/WorkListView.tsx): stage badge.
  - [src/components/workboard/WorkCalendarView.tsx](src/components/workboard/WorkCalendarView.tsx): colored pill/border.

## Wave 2 (P0): Course Builder 30+ blocks + templates + automation modules

### A) Block-based lesson content model (30+ block types)

- Expand `LessonContentBlock` union in [src/domain/courses.ts](src/domain/courses.ts).
- Create a **Block Registry**:
  - `src/courses/blockRegistry.ts` (new): id, label, category, defaultPayload, renderer, editor.
  - Goal: add new block type by registering once.
- Add editor UI:
  - `src/components/courses/LessonBlockEditor.tsx` (new)
  - `src/components/courses/blocks/*` (new) editors.
- Add renderer UI:
  - `src/components/courses/LessonBlockRenderer.tsx` (new)
  - Integrate into [src/pages/portal/PartnerCoursePage.tsx](src/pages/portal/PartnerCoursePage.tsx).
- “30+ types” target: include content, assessment, action, layout, and media blocks (quiz, checklist, assignment, download, embed, callout, accordion, timeline, FAQ, rubric, etc.).

### B) 30+ course templates/presets

- Add `CourseTemplate` domain + repo:
  - `src/domain/courseTemplates.ts` (new)
  - `src/data/courseTemplatesRepo.ts` (new)
- Admin UX:
  - “New course from template” in [src/pages/admin/AdminCoursesPage.tsx](src/pages/admin/AdminCoursesPage.tsx).
  - Template library UI patterned after Template Vault.

### C) Automation modules for courses (drip, prerequisites, certificates)

- Extend `Course/CourseModule/CourseLesson` with prerequisites + drip fields.
- Add course enrollment state + unlock computation:
  - Extend [src/data/coursesRepo.ts](src/data/coursesRepo.ts) with `enrollPartnerInCourse`, `isLessonUnlocked`, `nextUnlockedLesson`.
- Certificates:
  - `src/domain/certificates.ts` + `src/data/certificatesRepo.ts` (new)
  - Render certificate PDF using existing PDF pipeline.

## Wave 3 (P0): Video Generator becomes production-grade

### A) Media project model upgrades

- Extend media scene model for:
  - Timelines (duration per scene)
  - Transitions
  - Audio tracks (music bed + voiceover)
  - Captions/subtitles
  - Render presets (1080p/720p, fps)
- Likely files to extend (existing):
  - `src/domain/mediaStudio.ts`
  - `src/data/mediaStudioRepo.ts`
  - [src/pages/admin/AdminMediaStudioPage.tsx](src/pages/admin/AdminMediaStudioPage.tsx)

### B) Renderer pipeline options (choose an implementation during build)

- **Default (client-first)**: expand the existing WebM export approach (`exportScenesToWebm`) with audio mixing + captions.
- **Optional (high quality)**: add a server/edge rendering pipeline (FFmpeg-based) for mp4 + better audio.

### C) Admin UX improvements

- Timeline-style scene list, batch render queue, render history, reusable templates.
- Asset library: already exists; expand to include audio + caption presets.

## Wave 4: Automations +20 options and Comms Studio +30 features (unified)

### A) Automations: action/condition registry and +20 actions

- Create `src/automation/actionRegistry.ts` + `conditionRegistry.ts` (new).
- Expand [src/domain/automationStudio.ts](src/domain/automationStudio.ts) action union.
- Implement in [src/automation/agentRunner.ts](src/automation/agentRunner.ts).
- Add 20+ actions across categories:
  - Workboard (create project, set stage, assign, add note, tag)
  - Comms (send sequence step, schedule send, dedupe policies)
  - Letters (generate letter from template, queue mail, request evidence)
  - Credit (create dispute round, set follow-up)
  - CRM (convert lead, advance stage, assign)

### B) Comms Studio: +30 features

- Add sequences/campaigns:
  - `src/domain/commsSequences.ts`, `src/data/commsSequencesRepo.ts` (new)
  - UI in [src/pages/admin/AdminCommsStudioPage.tsx](src/pages/admin/AdminCommsStudioPage.tsx)
- Expand template engine in [src/utils/textTemplate.ts](src/utils/textTemplate.ts): conditional blocks + loops.
- Deliverability + preferences:
  - contact preferences (unsubscribe/opt-out), send windows, throttling.
- Tracking dashboard from `CommsSendLog`.

## Wave 5: CRM +15 options AND 20+ fields (prospects + leads)

- Expand `Prospect` and `LeadCapture/LeadOp` with additional structured fields.
- Prefer **Custom Fields** infrastructure for long-tail fields:
  - Use existing repos: `src/data/customFieldsRepo.ts`, `src/data/customFieldValuesRepo.ts`.
- Add: scoring, dedupe/merge, conversion flows, assignment rules, stage analytics.

## Wave 6: Credit platform expansion (business + personal) and letter categorization

### A) Personal credit tracking

- Add new domain + repo:
  - `src/domain/personalCredit.ts` (new)
  - `src/data/personalCreditRepo.ts` (new)
- Track: score snapshots, utilization, tradelines, inquiries, disputes rounds, goals, routines.
- Portal page(s): new under `src/pages/portal/` (and/or `src/pages/personal/`).

### B) Business profile: 20+ fields

- Extend partner business profile fields (likely [src/domain/partners.ts](src/domain/partners.ts)):
  - identity/fundability signals (DUNS, NAICS, 411, address consistency, entity age, etc.)
- Tight integration with Business Portal pages.

### C) Letters: categorization by type

- Add `category` on `LetterRecord` in [src/domain/letters.ts](src/domain/letters.ts) and enforce on creation.
- Categories: dispute, validation, affidavit, goodwill, pay-for-delete, identity theft, business dispute, etc.
- Update Letters Vault UI to filter/group by category.

### D) Credit Analysis Reports: view + edit via templates

- Change analysis deliverable from “PDF-only artifact” to:
  - A **template-driven source** (editable) + a rendered PDF saved as evidence.
- Add `AnalysisReportTemplate` entry type in Template Vault and expose editing in Admin Templates UI.
- Update Admin partner flow to:
  - Generate from selected template version
  - Store metadata linking template version → rendered evidence

## Wave 7: Roadmap overhaul (drastically) + new 3D look

- Replace “space effects” roadmap UI with a premium roadmap component:
  - Faux-3D approach: SVG path + perspective road surface + milestone cards + scroll snapping; no heavy 3D deps.
  - Optional true 3D: Three.js scene if you want actual 3D camera movement.
- Apply to business roadmap first (and then personal).

## Integration: unified navigation and cross-linking

- Standardize deep links:
  - From Tasks/Projects to Letters/Evidence/Reports/Disputes/Comms and back.
- Add consistent “Related items” panels on entity detail pages.

## Success criteria (what “works excellent together” means)

- Creating a project/task from any relevant page takes ≤2 clicks and links correctly.
- Kanban columns have distinct, configurable colors everywhere.
- Course builder supports block editing and renders the same blocks in portal view.
- Video generator supports reusable templates + batch generation + audio/captions.
- Automations can orchestrate tasks/projects/comms/letters across modules using registries.
- Letters are categorized and filterable; analysis reports are editable via templates and regenerate cleanly.
- Personal + business credit tracking share patterns (snapshots, disputes, roadmaps).

