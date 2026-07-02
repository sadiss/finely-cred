create table if not exists public.lead_engine_swarm_jobs (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'queued',
  source text not null,
  city_id text not null,
  query text not null,
  result_limit integer not null default 12,
  progress_pct integer not null default 0,
  discovered integer not null default 0,
  enriched integer not null default 0,
  hot integer not null default 0,
  imported integer not null default 0,
  error text,
  notes jsonb not null default '[]'::jsonb
);

create index if not exists lead_engine_swarm_jobs_status_idx on public.lead_engine_swarm_jobs(status, created_at);
create index if not exists lead_engine_swarm_jobs_city_source_idx on public.lead_engine_swarm_jobs(city_id, source);

create table if not exists public.lead_engine_candidates (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null,
  city_id text not null,
  query text not null,
  title text not null,
  url text,
  domain text,
  snippet text,
  emails jsonb not null default '[]'::jsonb,
  phones jsonb not null default '[]'::jsonb,
  socials jsonb not null default '[]'::jsonb,
  score integer not null default 0,
  funnel text not null,
  status text not null default 'new',
  fit_reasons jsonb not null default '[]'::jsonb,
  risk_flags jsonb not null default '[]'::jsonb,
  short_link_id text,
  prospect_id text,
  next_best_action text
);

create unique index if not exists lead_engine_candidates_url_uniq on public.lead_engine_candidates(url) where url is not null;
create index if not exists lead_engine_candidates_score_idx on public.lead_engine_candidates(score desc);
create index if not exists lead_engine_candidates_city_funnel_idx on public.lead_engine_candidates(city_id, funnel);

create table if not exists public.lead_engine_short_links (
  id text primary key,
  slug text not null unique,
  created_at timestamptz not null default now(),
  destination_url text not null,
  funnel text not null,
  city_id text,
  source text,
  campaign text,
  medium text,
  clicks integer not null default 0,
  leads integer not null default 0,
  bookings integer not null default 0,
  last_click_at timestamptz,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists lead_engine_short_links_slug_idx on public.lead_engine_short_links(slug);
create index if not exists lead_engine_short_links_city_funnel_idx on public.lead_engine_short_links(city_id, funnel);

create table if not exists public.lead_engine_actions (
  id text primary key,
  created_at timestamptz not null default now(),
  candidate_id text not null,
  headline text not null,
  funnel text not null,
  owner jsonb not null,
  short_link jsonb not null,
  message_draft text not null,
  compliance_status text not null default 'needs_review',
  compliance_notes jsonb not null default '[]'::jsonb,
  approval_status text not null default 'draft'
);

create index if not exists lead_engine_actions_candidate_idx on public.lead_engine_actions(candidate_id);
create index if not exists lead_engine_actions_approval_idx on public.lead_engine_actions(approval_status, created_at);

create table if not exists public.lead_engine_nurture_handoffs (
  id text primary key,
  created_at timestamptz not null default now(),
  candidate_id text not null,
  prospect_id text,
  funnel text not null,
  sequence_id text not null,
  channel_plan jsonb not null default '[]'::jsonb,
  consent_status text not null,
  status text not null default 'drafted',
  owner jsonb not null,
  first_message_draft text not null,
  blocked_reason text
);

create index if not exists lead_engine_nurture_handoffs_status_idx on public.lead_engine_nurture_handoffs(status, created_at);

create table if not exists public.lead_engine_events (
  id text primary key,
  created_at timestamptz not null default now(),
  kind text not null,
  city_id text,
  candidate_id text,
  funnel text,
  source text,
  summary text not null,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists lead_engine_events_kind_time_idx on public.lead_engine_events(kind, created_at desc);
create index if not exists lead_engine_events_city_time_idx on public.lead_engine_events(city_id, created_at desc);

alter table public.lead_engine_swarm_jobs enable row level security;
alter table public.lead_engine_candidates enable row level security;
alter table public.lead_engine_short_links enable row level security;
alter table public.lead_engine_actions enable row level security;
alter table public.lead_engine_nurture_handoffs enable row level security;
alter table public.lead_engine_events enable row level security;
