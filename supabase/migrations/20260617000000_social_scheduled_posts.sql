-- Social Hub — scheduled posts + autopilot config (server cron persistence)
create table if not exists public.social_scheduled_posts (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  caption text not null,
  scheduled_at timestamptz not null,
  status text not null default 'queued',
  page_id text,
  platforms jsonb,
  sop_template_id text,
  assigned_staff_id text,
  compliance_status text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_scheduled_posts_due_idx
  on public.social_scheduled_posts (tenant_id, status, scheduled_at);

create table if not exists public.social_autopilot_config (
  tenant_id text primary key default 'finely_cred',
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.social_scheduled_posts enable row level security;
alter table public.social_autopilot_config enable row level security;

drop policy if exists social_scheduled_posts_admin on public.social_scheduled_posts;
create policy social_scheduled_posts_admin on public.social_scheduled_posts
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists social_autopilot_config_admin on public.social_autopilot_config;
create policy social_autopilot_config_admin on public.social_autopilot_config
for all to authenticated
using (public.is_admin())
with check (public.is_admin());
