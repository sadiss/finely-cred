# Automation Studio — Event Triggers (Phase 10)

Platform events flow through `automationEventBridge.ts` and match rules via `automationEventMatcher.ts`.

## Live event triggers

| Trigger | Platform event | Default seed rule |
|---------|----------------|-------------------|
| `funnel_signup` | `lead.created`, `lead.magnet_download` | Notify admin |
| `funnel_session_booked` | `automation.triggered` kind `funnel_session_booked` | Appointment setter + admin + lead confirmation email |
| `purchase_completed` | `purchase.completed` | Notify admin |
| `task_created` | `task.created` | — |
| `task_completed` | `task.completed` | — |
| `task_overdue` | `task.overdue` | SLA notify admin |
| `dispute_letter_mailed` | `automation.triggered` kind `dispute_letter_mailed` | Bureau window alert |
| `lead_scored` | `automation.triggered` kind `lead_scored` | Hot lead → sales closer |
| `trial_expiring` | `automation.triggered` kind `trial_expiring` | — |
| `billing_past_due` | `automation.triggered` kind `billing_past_due` | Dunning sequence |
| `win_back` | `automation.triggered` kind `win_back` | Trial win-back nurture |
| `report_uploaded` | `automation.triggered` kind `report_uploaded` | Auto-draft dispute letter (disabled by default) |
| `dispute_evidence_ready` | `automation.triggered` kind `dispute_evidence_ready` | Draft + letter ops review (disabled by default) |
| `complaint_detected` | `automation.triggered` kind `complaint_detected` | Compliance escalation queue |

## Hands-free ops (Staff OS)

When **Automation Autopilot** is enabled in Admin → Settings, `automationEventOps.ts` executes live actions for matched events:

| Action | Behavior | Human confirm? |
|--------|----------|--------------|
| `draft_dispute_letter` | Factual findings only → `lettersRepo` + review queue | Review before mail |
| `queue_letter_review` | Admin task + autopilot draft queue | No |
| `request_mail_confirmation` | Mail confirm queue + urgent task | **Yes** (Lob send) |
| `assign_staff_task` | Work OS task tied to on-duty staff role | No |
| `queue_compliance_escalation` | Complaints queue + admin notify | Review before outbound |

Control plane: **Admin → Hands-free ops** (`/admin/ops-autopilot`).

Event bridge respects `automationAutopilot` feature flag; recipes seed via `automationRecipeSeeder.ts` on boot.

## Lead scoring pipeline

On every lead capture, `runLeadCapturePipeline()` emits `lead_scored` with:

- `score`, `band`, `fit`
- `suggestedPersonaId`, `suggestedSequenceId`

Rules with `lead_scored` trigger + `minScore` / `band` filters run automatically.

## Cron vs events

| Runner | Location | Handles |
|--------|----------|---------|
| Event bridge | Client `main.tsx` import | Real-time platform events |
| Platform cron | `platformCron.ts` | Nurture, interval automations, trial expiry, billing dunning, support SLA, task overdue, win-back, admin + partner digests |
| Edge `automation-runner` | Supabase function | Server dispatch hook (extend for prod) |
| Edge `platform-cron` | Supabase function | Scheduled heartbeat + audit; see `PLATFORM_CRON.md` |

Core seed recipes (boot via `ensureCoreAutomationRecipesOnce()` in `main.tsx`):

- Meta lead notify
- Funnel nurture
- Funnel session booked → appointment setter
- Task overdue SLA
- Billing dunning
- Trial win-back
- Report upload auto-draft (disabled)
- Evidence ready draft (disabled)
- Complaint keyword → compliance queue

## Billing & comms

Event-scoped billing emails run through `automationEventComms.ts` when rules fire `billing_past_due` or `win_back`.

Cron-scoped dunning and digests run in `platformCron.ts`:

- `processBillingDunningTick` / `processWinBackTick`
- `processNotificationDigestTick` — admin daily digest (`admin_daily_digest` template)
- `processPartnerDigestTick` — partner daily digest (`partner_daily_digest` template)

Templates live in `commsBillingTemplatesSeed.ts` and `commsDigestTemplatesSeed.ts`.

## Server automation-runner

Edge function `supabase/functions/automation-runner` matches production hooks:

| Hook | Payload kind | Actions |
|------|----------------|---------|
| `hook_report_uploaded` | `report_uploaded` | `draft_dispute_letter`, `assign_staff_task`, `notify_admin` |
| `hook_complaint_detected` | `complaint_detected` | `queue_compliance_escalation`, `notify_admin` |
| `hook_lead_scored` | `lead_scored` | `assign_persona`, `nurture_enqueue` |

Dispatch with `{ action: 'dispatch', eventType: 'automation.triggered', payload: { kind: 'report_uploaded', partnerId } }`. Client-side live execution remains in `automationEventBridge.ts` when **Automation Autopilot** is on.

## Admin

- **Automations** → `/admin/automations` — canvas, trigger catalog, server hooks, cron status
- **Monitoring → Deploy** — server cron ping/tick
- Seed rules tagged `meta.seed: true` — safe to disable without breaking core flows
- Webhook hub dispatches: `lead.created`, `purchase.completed`, `task.*`, `automation.triggered`

## Adding a trigger

1. Add type to `AutomationTrigger` in `domain/automationStudio.ts`
2. Add matcher branch in `lib/automationEventMatcher.ts`
3. Add catalog entry in `features/automation/automationTriggerCatalog.ts`
4. Optional: seed rule in `data/automationStudioRepo.ts` `ensureSeedRules` or `lib/automationRecipeSeeder.ts`
