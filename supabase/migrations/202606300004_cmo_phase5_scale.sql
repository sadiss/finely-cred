-- Finely Cred CMO Phase 5: scale intelligence, forecasting, budgets, experiments, autonomy policy.
-- Review RLS predicates against your existing admin/user model before applying in production.

create table if not exists public.cmo_growth_events (
  id text primary key,
  occurred_at timestamptz not null default now(),
  channel text not null,
  campaign_id text,
  asset_id text,
  account_id text,
  event_type text not null,
  value numeric,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.cmo_channel_models (
  channel text primary key,
  impressions integer not null default 0,
  clicks integer not null default 0,
  leads integer not null default 0,
  qualified_leads integer not null default 0,
  booked_calls integer not null default 0,
  sales integer not null default 0,
  revenue numeric not null default 0,
  cost numeric not null default 0,
  lead_rate numeric not null default 0,
  qualified_rate numeric not null default 0,
  booking_rate numeric not null default 0,
  close_rate numeric not null default 0,
  cost_per_lead numeric not null default 0,
  revenue_per_lead numeric not null default 0,
  confidence numeric not null default 0,
  decision text not null default 'test_more',
  reason text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.cmo_lead_forecasts (
  id text primary key,
  target_daily_leads integer not null default 200,
  projected_daily_leads integer not null default 0,
  projected_qualified_leads integer not null default 0,
  projected_booked_calls integer not null default 0,
  projected_revenue numeric not null default 0,
  required_actions jsonb not null default '[]'::jsonb,
  bottlenecks jsonb not null default '[]'::jsonb,
  confidence numeric not null default 0,
  generated_at timestamptz not null default now()
);

create table if not exists public.cmo_budget_allocations (
  id text primary key,
  total_daily_budget numeric not null default 0,
  allocations jsonb not null default '[]'::jsonb,
  guardrails jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now()
);

create table if not exists public.cmo_autonomy_policies (
  id text primary key,
  level text not null default 'internal_auto',
  policy jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.cmo_scale_experiments (
  id text primary key,
  campaign_id text,
  hypothesis text not null,
  channel text not null,
  variant_a text not null,
  variant_b text not null,
  metric text not null,
  min_sample_size integer not null default 50,
  status text not null default 'draft',
  winner text,
  notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cmo_growth_events enable row level security;
alter table public.cmo_channel_models enable row level security;
alter table public.cmo_lead_forecasts enable row level security;
alter table public.cmo_budget_allocations enable row level security;
alter table public.cmo_autonomy_policies enable row level security;
alter table public.cmo_scale_experiments enable row level security;

-- Replace `true` with your real admin policy, e.g. auth.jwt() role checks.
do $$ begin
  create policy "cmo_phase5_admin_all_events" on public.cmo_growth_events for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cmo_phase5_admin_all_models" on public.cmo_channel_models for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cmo_phase5_admin_all_forecasts" on public.cmo_lead_forecasts for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cmo_phase5_admin_all_budgets" on public.cmo_budget_allocations for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cmo_phase5_admin_all_policies" on public.cmo_autonomy_policies for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cmo_phase5_admin_all_experiments" on public.cmo_scale_experiments for all using (true) with check (true);
exception when duplicate_object then null; end $$;
