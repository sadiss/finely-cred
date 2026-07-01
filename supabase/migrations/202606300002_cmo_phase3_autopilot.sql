-- Finely Cred CMO Phase 3 Autopilot tables
-- Apply only after reviewing RLS policies for your tenant/admin model.

create table if not exists public.cmo_autopilot_settings (
  id text primary key default 'default',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cmo_playbooks (
  id text primary key,
  status text not null default 'ready',
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cmo_autopilot_runs (
  id text primary key,
  run_type text not null,
  status text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cmo_growth_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  campaign_id text,
  prospect_id text,
  channel text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.cmo_experiments (
  id text primary key,
  status text not null default 'draft',
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cmo_briefs (
  id text primary key,
  cadence text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists cmo_growth_events_type_idx on public.cmo_growth_events(event_type);
create index if not exists cmo_growth_events_campaign_idx on public.cmo_growth_events(campaign_id);
create index if not exists cmo_growth_events_channel_idx on public.cmo_growth_events(channel);

alter table public.cmo_autopilot_settings enable row level security;
alter table public.cmo_playbooks enable row level security;
alter table public.cmo_autopilot_runs enable row level security;
alter table public.cmo_growth_events enable row level security;
alter table public.cmo_experiments enable row level security;
alter table public.cmo_briefs enable row level security;

-- Replace with your real admin policy helper. This intentionally does not open data broadly.
-- Example:
-- create policy "Admins manage cmo phase3" on public.cmo_playbooks for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
