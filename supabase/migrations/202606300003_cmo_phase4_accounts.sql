-- Finely Cred CMO Phase 4: managed accounts, publishing queue, health reports, webhooks.
-- Review RLS predicates against your existing admin/user model before applying in production.

create table if not exists public.cmo_managed_accounts (
  id text primary key,
  platform text not null,
  label text not null,
  handle text,
  public_url text,
  owner_type text not null default 'brand',
  status text not null default 'needs_auth',
  publish_mode text not null default 'manual_copy_paste',
  scopes jsonb not null default '[]'::jsonb,
  health_score numeric not null default 70,
  daily_lead_target integer default 0,
  daily_post_target integer default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cmo_publish_assets (
  id text primary key,
  campaign_id text,
  account_id text references public.cmo_managed_accounts(id) on delete set null,
  platform text not null,
  asset_type text not null,
  title text not null,
  caption text not null,
  cta text,
  link_url text,
  media_urls jsonb not null default '[]'::jsonb,
  hashtags jsonb not null default '[]'::jsonb,
  compliance_score numeric not null default 0,
  conversion_score numeric not null default 0,
  risk_level text not null default 'medium',
  risk_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cmo_publish_jobs (
  id text primary key,
  asset_id text references public.cmo_publish_assets(id) on delete cascade,
  campaign_id text,
  account_id text references public.cmo_managed_accounts(id) on delete set null,
  platform text not null,
  scheduled_for timestamptz,
  status text not null default 'needs_review',
  approval_required boolean not null default true,
  approved_by text,
  approved_at timestamptz,
  dispatched_at timestamptz,
  published_at timestamptz,
  provider_post_id text,
  provider_url text,
  failure_reason text,
  retry_count integer not null default 0,
  audit_trail jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cmo_account_health_reports (
  id text primary key,
  account_id text references public.cmo_managed_accounts(id) on delete cascade,
  platform text not null,
  health_score numeric not null,
  auth_healthy boolean not null default false,
  content_velocity_healthy boolean not null default false,
  engagement_healthy boolean not null default false,
  lead_path_healthy boolean not null default false,
  compliance_healthy boolean not null default false,
  warnings jsonb not null default '[]'::jsonb,
  recommended_actions jsonb not null default '[]'::jsonb,
  checked_at timestamptz not null default now()
);

create table if not exists public.cmo_webhook_events (
  id text primary key,
  provider text not null,
  account_id text,
  event_type text not null,
  external_id text,
  campaign_id text,
  payload_summary text not null,
  raw_payload jsonb,
  classified_intent text,
  lead_score numeric,
  created_at timestamptz not null default now()
);

alter table public.cmo_managed_accounts enable row level security;
alter table public.cmo_publish_assets enable row level security;
alter table public.cmo_publish_jobs enable row level security;
alter table public.cmo_account_health_reports enable row level security;
alter table public.cmo_webhook_events enable row level security;

-- Replace `true` with your real admin policy, e.g. auth.jwt() role checks.
do $$ begin
  create policy "cmo_phase4_admin_all_accounts" on public.cmo_managed_accounts for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cmo_phase4_admin_all_assets" on public.cmo_publish_assets for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cmo_phase4_admin_all_jobs" on public.cmo_publish_jobs for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cmo_phase4_admin_all_health" on public.cmo_account_health_reports for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cmo_phase4_admin_all_webhooks" on public.cmo_webhook_events for all using (true) with check (true);
exception when duplicate_object then null; end $$;
