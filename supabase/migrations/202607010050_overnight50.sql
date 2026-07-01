create table if not exists public.lead_intel_jobs (
  id text primary key,
  source_id text not null,
  city text not null,
  query text not null,
  status text not null default 'queued',
  priority integer not null default 50,
  progress integer not null default 0,
  discovered integer not null default 0,
  enriched integer not null default 0,
  hot integer not null default 0,
  imported integer not null default 0,
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);
create table if not exists public.lead_intel_cache (cache_key text primary key, payload jsonb not null, expires_at timestamptz not null, created_at timestamptz not null default now());
create table if not exists public.lead_intel_live_feed (id text primary key, created_at timestamptz not null default now(), city text not null, source_id text not null, agent text not null, message text not null, severity text not null default 'info', counts jsonb not null default '{}'::jsonb);
create table if not exists public.geo_clusters (id text primary key, city text not null, state text, zips text[] not null default '{}', lat numeric, lng numeric, radius_miles numeric not null default 10, meta jsonb not null default '{}'::jsonb);
create table if not exists public.overnight_runs (id text primary key, city text, started_at timestamptz not null default now(), ended_at timestamptz, target_leads integer not null default 50, actual_leads integer not null default 0, status text not null default 'running', ledger jsonb not null default '{}'::jsonb);
create table if not exists public.overnight_lead_attribution (id text primary key, run_id text references public.overnight_runs(id) on delete cascade, source text not null, city text not null, leads integer not null default 0, cost_cents integer not null default 0, created_at timestamptz not null default now(), meta jsonb not null default '{}'::jsonb);
create table if not exists public.shift_logs (id text primary key, agent_id text not null, shift text not null, status text not null, message text not null, created_at timestamptz not null default now(), meta jsonb not null default '{}'::jsonb);
create table if not exists public.publish_queue (id text primary key, channel text not null, city text, payload jsonb not null, status text not null default 'queued', scheduled_for timestamptz not null default now(), approved boolean not null default false, risk_level text not null default 'medium', attempts integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.staff_shifts (id text primary key, agent_id text not null, city text, starts_at timestamptz, ends_at timestamptz, status text not null default 'scheduled', meta jsonb not null default '{}'::jsonb);
create table if not exists public.hook_performance (id text primary key, hook text not null, channel text not null, city text, impressions integer not null default 0, clicks integer not null default 0, leads integer not null default 0, created_at timestamptz not null default now());
create table if not exists public.seo_queue (id text primary key, city text not null, offer text not null, slug text not null, status text not null default 'draft', content jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create table if not exists public.budget_cells (id text primary key, city text not null, channel text not null, amount_cents integer not null, status text not null default 'draft', created_at timestamptz not null default now(), meta jsonb not null default '{}'::jsonb);
create table if not exists public.human_sessions (id text primary key, account_id text, channel text not null, status text not null default 'planned', notes text, created_at timestamptz not null default now(), meta jsonb not null default '{}'::jsonb);
create table if not exists public.account_warmup_state (id text primary key, account_id text not null, channel text not null, day integer not null default 1, status text not null default 'manual_review', created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create index if not exists idx_lead_intel_jobs_status_priority on public.lead_intel_jobs(status, priority desc, scheduled_for);
create index if not exists idx_publish_queue_due on public.publish_queue(status, scheduled_for);
create index if not exists idx_overnight_attr_run on public.overnight_lead_attribution(run_id);

alter table public.lead_intel_jobs enable row level security;
alter table public.lead_intel_cache enable row level security;
alter table public.lead_intel_live_feed enable row level security;
alter table public.geo_clusters enable row level security;
alter table public.overnight_runs enable row level security;
alter table public.overnight_lead_attribution enable row level security;
alter table public.shift_logs enable row level security;
alter table public.publish_queue enable row level security;
alter table public.staff_shifts enable row level security;
alter table public.hook_performance enable row level security;
alter table public.seo_queue enable row level security;
alter table public.budget_cells enable row level security;
alter table public.human_sessions enable row level security;
alter table public.account_warmup_state enable row level security;
