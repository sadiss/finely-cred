-- Sovereign Growth Command Stack tables
-- Safe to run after the Lead Engine and Human Staff OS migrations.

create table if not exists public.sovereign_staff_missions (
  id text primary key,
  type text not null,
  title text not null,
  priority text not null default 'normal',
  status text not null default 'ready',
  owner_ids text[] not null default '{}',
  city text,
  channel text,
  objective text not null default '',
  inputs jsonb not null default '[]'::jsonb,
  outputs jsonb not null default '[]'::jsonb,
  next_actions jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  intelligence_notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sovereign_staff_notifications (
  id text primary key,
  from_agent_id text not null,
  to_agent_ids text[] not null default '{}',
  mission_id text,
  tone text not null default 'high_conviction',
  priority text not null default 'normal',
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.sovereign_staff_threads (
  id text primary key,
  title text not null,
  mission_id text,
  participant_agent_ids text[] not null default '{}',
  memory_summary text not null default '',
  open_decisions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sovereign_staff_thread_turns (
  id text primary key,
  thread_id text not null references public.sovereign_staff_threads(id) on delete cascade,
  agent_id text not null,
  role text not null default 'agent',
  content text not null,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.sovereign_lead_capture_routes (
  id text primary key,
  name text not null,
  offer text not null,
  audience text not null,
  source_channels text[] not null default '{}',
  short_link_slug text not null,
  destination_path text not null,
  owner_agent_ids text[] not null default '{}',
  required_fields jsonb not null default '[]'::jsonb,
  follow_up_sequence text not null default '',
  compliance_notes jsonb not null default '[]'::jsonb,
  intelligence_score int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sovereign_media_plans (
  id text primary key,
  media_type text not null,
  channel text not null,
  title text not null,
  angle text not null,
  hook_bank jsonb not null default '[]'::jsonb,
  story_beats jsonb not null default '[]'::jsonb,
  cta text not null default '',
  voice_direction text,
  video_direction text,
  owner_agent_ids text[] not null default '{}',
  approval_level int not null default 3,
  compliance_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sovereign_geo_cells (
  id text primary key,
  city text not null,
  state text not null,
  priority text not null default 'normal',
  focus_offers jsonb not null default '[]'::jsonb,
  source_mix text[] not null default '{}',
  lead_target_overnight int not null default 0,
  readiness_score int not null default 0,
  blockers jsonb not null default '[]'::jsonb,
  assigned_agent_ids text[] not null default '{}',
  next_moves jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sovereign_staff_missions_status on public.sovereign_staff_missions(status, priority);
create index if not exists idx_sovereign_staff_notifications_to on public.sovereign_staff_notifications using gin(to_agent_ids);
create index if not exists idx_sovereign_media_plans_channel on public.sovereign_media_plans(channel, media_type);
create index if not exists idx_sovereign_geo_cells_city on public.sovereign_geo_cells(city, state);
