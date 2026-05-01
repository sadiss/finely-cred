---
name: enterprise_flex_layer_2x
overview: "Take the current platform from “feature-rich but limited” to enterprise-grade by building shared engines: per-tenant field+layout builder, real RBAC, workflow primitives, comms hub, and standardized entity detail framework (notes, attachments, audit timeline, templates) so every module gains micro-features without one-off coding."
todos:
  - id: engine-fields-layouts
    content: Upgrade Custom Fields to per-tenant Field+Layout Engine (categories/order/permissions/import-export) + shared renderer/builder.
    status: completed
  - id: engine-rbac
    content: Introduce capability-based RBAC and apply consistently across pages/tabs/actions and field visibility/edit.
    status: completed
  - id: engine-entity-framework
    content: Create reusable Entity Detail Framework (notes, attachments, audit timeline, custom fields panel) and adopt in top modules.
    status: completed
  - id: engine-workflows
    content: Add workflow primitives (stages/transitions/checklists/SLAs/triggers) and wire into tasks/cases/letters.
    status: completed
  - id: engine-comms-hub
    content: "Build Comms Hub: threads, templates, assignment, SLAs, escalation; use Field Engine for contact prefs."
    status: completed
  - id: engine-admin-guide-ops
    content: Upgrade Admin Guide to operator-grade + add Ops Queues driven by audit/workflow signals.
    status: completed
  - id: staged-backend-cutover
    content: Add repo interfaces + config versioning now; later implement Supabase/Postgres repos and migration.
    status: completed
isProject: false
---

## Outcomes

- **No more “limited” feeling**: admins can add/reorder/categorize fields and UI sections across modules.
- **Enterprise consistency**: permissions, layouts, workflows, and audit trails behave the same everywhere.
- **Compounding delivery**: each new micro-feature (notes, attachments, templates, SLAs, etc.) automatically appears across Partners/Business/CRM/Comms/Projects/Tasks.

## Core strategy (staged backend, enterprise architecture)

- Keep local JSON store for speed **now**, but introduce **repo interfaces + versioned config objects** so we can later switch storage to Supabase/Postgres with minimal refactor.
- Admins (only) configure fields/workflows/layouts; partner view/edit is controlled per field.

## Platform engines (the “2x” upgrade)

### A) Field + Layout Engine (per-tenant)

Upgrade Custom Fields into a full engine:

- **Per-tenant definitions** and **per-tenant values**
- **Categories/sections**, **order**, and **layout hints**
- **Field permissions** (admin vs partner: hidden/view/edit)
- Import/export JSON for fast bulk creation

Target files:

- `[src/domain/customFields.ts](src/domain/customFields.ts)`
- `[src/data/customFieldsRepo.ts](src/data/customFieldsRepo.ts)`
- `[src/data/customFieldValuesRepo.ts](src/data/customFieldValuesRepo.ts)`
- Admin builder UI: `[src/pages/admin/AdminSettingsPage.tsx](src/pages/admin/AdminSettingsPage.tsx)`

New shared UI:

- `src/components/customFields/CustomFieldsPanel.tsx` (renderer)
- `src/components/customFields/CustomFieldsBuilder.tsx` (admin builder)

### B) Real RBAC (permissions that scale)

Introduce a capability model that can gate:

- pages/tabs/actions
- field visibility/edit
- workflow actions (approve, assign, escalate)

Targets:

- Build a `capabilities` map and helpers in a new module (e.g. `src/auth/capabilities.ts`)
- Integrate with existing tenant membership roles + admin allowlist
- Use consistently in PageShell/tab rendering

### C) Workflow Engine primitives (projects/tasks/cases/letters)

Add reusable workflow primitives:

- statuses/stages
- transitions
- required checklists
- due dates/SLAs
- triggers that create tasks/notifications

Targets:

- Leverage existing repos (`tasksRepo`, `casesRepo`, `auditRepo`) and standardize event naming
- Add `WorkflowDefinition` types + storage (per tenant)

### D) Comms Hub (enterprise communications)

Unify communications into:

- threads
- templates
- assignment
- SLAs
- escalation

Targets:

- Extend `supportRepo` / comms components into a “Comms Hub” page
- Add contact preferences as configurable fields (using Field Engine)

### E) Standard “Entity Detail Framework” (micro-features everywhere)

Create a reusable detail page shell that modules can compose:

- header summary + KPIs
- tabs/sections with clamp/grouping
- notes
- attachments (Evidence/Docs)
- audit timeline
- custom fields panel

Targets to adopt first (highest ROI):

- Admin Partner detail: `[src/pages/admin/PartnerDetailPage.tsx](src/pages/admin/PartnerDetailPage.tsx)`
- Business profile: `[src/pages/business/BusinessProfilePage.tsx](src/pages/business/BusinessProfilePage.tsx)`
- Leads/CRM detail (when present)
- Projects/Tasks detail (when present)

### F) Admin Guide becomes operator-grade

Turn Admin Guide into a real playbook:

- per-module “what it is / how to run it / troubleshooting”
- checklists for launches
- “queues” for stuck workflows

Targets:

- `[src/pages/admin/AdminGuidePage.tsx](src/pages/admin/AdminGuidePage.tsx)`
- New “Ops Queue” panels fed by audit/workflow signals

## Data storage plan (staged)

### Stage 1 (now)

- Introduce **versioned config objects** and **repo interfaces** for:
  - field definitions
  - layouts
  - workflow definitions
  - templates metadata
- Store in localJsonStore per tenant.

### Stage 2 (later, clean cutover)

- Implement Supabase/Postgres-backed repos behind the same interfaces.
- Migrate per-tenant configs + audit stream.

## Rollout order (fast compounding)

1. Field + Layout Engine + Builder
2. RBAC capability gating
3. Entity Detail Framework (notes/attachments/audit/custom fields everywhere)
4. Workflow primitives + triggers
5. Comms Hub
6. Admin Guide + Ops Queues

## Validation

- Tenant-scoped configs isolated correctly
- Field permissions honored in admin + partner portal
- Ordering/categories persist
- Workflow triggers create tasks/notifications reliably
- Audit timeline shows key events consistently across modules

