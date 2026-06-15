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

Edge functions: `platform-cron`, `automation-runner`, `meta-publish-post`

**Secrets for live nurture email:** `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, optional `APP_BASE_URL` for unsubscribe links.

## Schedule (pg_cron example)

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
| `nurture` | Server sends due email steps via SendGrid + advances `nurture_enrollments` |
| `automations` | Interval rules with `notify_admin` actions execute from `automation_rules` table |

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

## Secrets

- `SUPABASE_SERVICE_ROLE_KEY` — required for pg_cron
- `META_DEFAULT_IG_IMAGE_URL` — optional IG media container default
- `EDGE_ADMIN_EMAILS` — allowlisted admin JWT for manual ticks
