-- Platform cron heartbeat — last server tick snapshot for admin monitoring
create table if not exists public.platform_cron_heartbeats (
  id text primary key default 'latest',
  tenant_id text not null default 'finely_cred',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.platform_cron_heartbeats enable row level security;

drop policy if exists platform_cron_heartbeats_admin on public.platform_cron_heartbeats;
create policy platform_cron_heartbeats_admin on public.platform_cron_heartbeats
for all to authenticated
using (public.is_admin())
with check (public.is_admin());
