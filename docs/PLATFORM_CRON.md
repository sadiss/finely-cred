# Platform cron — server-side ticks

Production Finely Cred runs background ops through the **`platform-cron`** Supabase Edge Function. Pair it with **pg_cron** or an external scheduler so nurture/automation/social sweeps continue when no admin browser is open.

## Deploy

```bash
cd Tishobe/finely-cred-main
supabase db push
npm run deploy:functions
```

Key migrations:

- `20260617000000_social_scheduled_posts.sql` — social queue for publish sweep
- `20260618000000_platform_cron_heartbeats.sql` — last tick snapshot for admin monitoring
- `20260619000000_nurture_automation_persistence.sql` — nurture enrollments + automation rules for server cron
- `20260620000000_automation_rule_runs_cron_schedule.sql` — rule run log + pg_cron schedule config
- `20260814100000_calendar_events_server.sql` — server-backed calendar events (Phase F1: meeting reminders + no-show detection)
- `20260814110000_crm_sequences_server.sql` — `crm_sequences` / `crm_sequence_enrollments` / `comms_frequency_log` for server cron (Phase F2)
- `20260814130000_crm_sequence_step_variants.sql` — `crm_sequence_enrollments.assigned_variant` / `.stage_at_enrollment` for the CRM sequence A/B primitive (Phase G3)
- `20260814120000_send_retry_queue.sql` — `send_retry_queue` table for failed-send retries with exponential backoff (Phase F5)

Edge functions: `platform-cron`, `automation-runner`, `meta-publish-post`

**Secrets for live nurture email:** `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, optional `APP_BASE_URL` for unsubscribe links.

## Schedule (pg_cron example)

**Not yet executed** — running this requires the Supabase SQL editor/dashboard (or `supabase db push` + `psql`) against the live project, neither of which this environment has credentials for. The SQL below is copy-paste ready; an operator with dashboard access should run it once (or use the Admin Deploy panel's "Copy pg_cron SQL" action, which renders the same statement from `platform_cron_schedule`).

Run every 15 minutes with service role (live social + automation sweep):

```sql
select cron.schedule(
  'finely-platform-cron-live',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/platform-cron',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{"action":"tick","dryRun":false,"source":"pg_cron","loadSocialFromDb":true,"runAutomationSweep":true}'::jsonb
  );
  $$
);
```

Dry-run heartbeat (hourly):

```json
{"action":"tick","dryRun":true,"source":"pg_cron"}
```

## What each tick runs

| Step | Server behavior |
|------|-----------------|
| `social_publish` | Publishes due rows from `social_scheduled_posts` via Meta Graph |
| `automation_sweep` | Invokes `automation-runner` `cron_sweep` — lead scan + due nurture emails + DB `notify_admin` rules |
| `nurture` | Server sends due email steps via SendGrid/SMTP + advances `nurture_enrollments` — now also enforces suppression, quiet-hours, and cross-channel frequency-cap checks (Phase F2 reconciliation fix) |
| `automations` | Interval rules with `notify_admin` actions execute from `automation_rules` table |
| `task_overdue` | **(Phase 2)** Tags overdue `work_tasks` rows (`overdue_notified`) so they're queryable without an admin browser open — see `_shared/processTaskOverdueSweep.ts` |
| `meeting_reminders` | **(Phase F1)** Sends confirmed-meeting email/SMS reminders directly from `calendar_events` (suppression + quiet-hours checked) — see `_shared/processDueMeetingReminders.ts` |
| `no_show_recovery` | **(Phase F1)** Flags confirmed sessions past a 20-minute grace window as `no_show`, creates a real `booking_invites` reschedule link + `work_tasks` follow-up, and sends a recovery email — see `_shared/processDueNoShowRecovery.ts` |
| `crm_sequences` | **(Phase F2)** Advances `crm_sequence_enrollments` — email/task/stage_move steps, with suppression + quiet-hours + cross-channel frequency-cap guards — see `_shared/processDueCrmSequenceSteps.ts`. **(Phase G3)** An email step can optionally carry a `variant_a` subject/body; each enrollment is deterministically bucketed into `control`/`variant_a` (hash of the enrollment id, byte-identical logic in `src/domain/crmSequences.ts` and this edge function) so the client engine and this server engine always agree on which arm a given enrollment sends, no matter which one processes it first. |
| `billing_dunning` | **(Phase F3)** Sends past-due payment nudge emails straight from `agreements` (`status = 'past_due'`) — no new table needed, real server truth already existed — see `_shared/processDueBillingDunning.ts` |
| `win_back` | **(Phase F3)** Sends a win-back email to expired-trial partners (via `entitlements`/`agreements`) who never converted to a paid plan — see `_shared/processDueWinBack.ts` |
| `send_retry_queue` | **(Phase F5)** Retries failed sends enqueued by `meeting_reminders`/`no_show_recovery`/`crm_sequences`/`billing_dunning`/`win_back` via `enqueueRetry()`, with exponential backoff (5min → 30min → 2hr), then permanently marks a row `failed` — see `_shared/sendRetryQueue.ts`. Re-checks suppression before every retry attempt. |

### Client-only cron steps (remaining gap)

`support_sla`, `admin_digest`, `partner_digest`, `social_autopilot` still only run from `src/lib/platformCron.ts` while an admin has the app open. They read from localStorage-backed repos (support inbox threads, notification digests) that have no server table yet. Porting them requires either syncing those repos to Supabase first (same dual-write pattern as `crmServerSync.ts`/`calendarServerSync.ts`) or accepting they stay admin-session-gated. Not faked here — flagged as a real gap.

`trial_expiry` also remains client-only — not addressed by Phase F1–F3 (F3's scope was explicitly `billing_dunning` + `win_back`); it reads the same `entitlements` table `win_back` now reads server-side, so porting it would follow the identical no-new-table pattern as a small follow-up.

### Phase J3 — missed-call text-back (webhook-triggered, **not** a cron step)

Unlike every processor above, missed-call text-back does **not** poll `platform-cron` — it fires synchronously inside `twilio-webhook`'s existing voice-status callback handler the moment Twilio reports a missed call (`no-answer`/`busy`/`failed`/`canceled`) or a completed voicemail (`TranscriptionText`/`RecordingUrl` present), so the caller gets an SMS acknowledgment within the same request instead of waiting for the next tick. See `_shared/missedCallTextBack.ts`.

- Sends a suppression-checked SMS with a real `booking_invites` link (reuses the same server-booking-invite pattern as `no_show_recovery` above) and queues a high-priority `work_tasks` follow-up (`tags: ['missed-call-textback', 'twilio-webhook']`) so a human still calls back.
- A failed SMS send falls into the same `send_retry_queue` (`source_processor = 'missed_call_textback'`) that `send_retry_queue` above already sweeps every tick — this is the only part of J3 platform-cron touches.
- Gated by **both** the `MISSED_CALL_TEXTBACK_ENABLED=true` secret and real Twilio credentials (`TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`) being configured — see `src/domain/settings.ts`'s `missedCallTextBack` feature flag for the client-visible on/off status. Off by default; do not enable before a real support number is wired to `twilio-webhook`'s voice webhook URL in the Twilio Console.
- Idempotent per `CallSid` (Deno KV, 24h TTL) — Twilio's own multiple status callbacks for the same call never trigger a second text-back.

### Phase 2 additions

- `automation-runner` `dispatch` now executes real actions (send email/SMS, move CRM stage, add CRM tag, create task, post webhook) when the caller passes a structured `actions` array and `dryRun:false` — see `_shared/executeAutomationAction.ts`. Every send checks `public.comms_suppression` first (shared table — see `20260813200000_crm_server_sync_and_suppression.sql`).
- `automation-blueprint-apply` now builds a real trigger→wait→action flow graph from a submitted blueprint's node list and persists it (disabled, pending review) to `automation_rules`, instead of returning a no-op stub.
- New tables: `crm_prospects`, `crm_records` (materialized CRM read-model), `comms_suppression` (shared client/server suppression list).

## pg_cron schedule config

After `supabase db push`, row `platform_cron_schedule.id = live` holds recommended interval (default 15m). Admin Deploy panel shows status and **Copy pg_cron SQL**.

Mark schedule enabled after pg_cron is wired:

```sql
update public.platform_cron_schedule set enabled = true, updated_at = now() where id = 'live';
```

Last tick is stored in `platform_cron_heartbeats` (`id = latest`).

## Admin UI

- **Deploy panel** — Ping server, dry-run tick, publish due (server)
- **Automations → Autopilot** — Server automation sweep button
- **Workflow queue → Triage tab → Platform cron health panel** (`OpsPlatformCronHealthPanel.tsx`) — heartbeat staleness, queued rules, and (Phase F5) a "N sends pending retry" / "N failed permanently" chip that expands into the compact `send_retry_queue` list (source processor, recipient, attempt count, last error)

## Secrets

- `SUPABASE_SERVICE_ROLE_KEY` — required for pg_cron
- `META_DEFAULT_IG_IMAGE_URL` — optional IG media container default
- `EDGE_ADMIN_EMAILS` — allowlisted admin JWT for manual ticks
