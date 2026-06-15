-- Automation rule run log + platform cron schedule (Part AR)
create table if not exists public.automation_rule_runs (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  rule_id text not null,
  started_at timestamptz not null default now(),
  mode text not null default 'live',
  summary text,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists automation_rule_runs_rule_idx
  on public.automation_rule_runs (tenant_id, rule_id, started_at desc);

create table if not exists public.platform_cron_schedule (
  id text primary key default 'live',
  tenant_id text not null default 'finely_cred',
  enabled boolean not null default false,
  interval_minutes integer not null default 15,
  dry_run boolean not null default false,
  load_social_from_db boolean not null default true,
  run_automation_sweep boolean not null default true,
  notes text,
  updated_at timestamptz not null default now()
);

insert into public.platform_cron_schedule (id, tenant_id, notes)
values (
  'live',
  'finely_cred',
  'Enable via pg_cron — see docs/PLATFORM_CRON.md. Set enabled=true after scheduling.'
)
on conflict (id) do nothing;

alter table public.automation_rule_runs enable row level security;
alter table public.platform_cron_schedule enable row level security;

drop policy if exists automation_rule_runs_admin on public.automation_rule_runs;
create policy automation_rule_runs_admin on public.automation_rule_runs
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists platform_cron_schedule_admin on public.platform_cron_schedule;
create policy platform_cron_schedule_admin on public.platform_cron_schedule
for all to authenticated
using (public.is_admin())
with check (public.is_admin());
