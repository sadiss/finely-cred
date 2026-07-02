create table if not exists public.human_staff_threads (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  mission_type text not null,
  status text not null default 'open',
  city_ids text[] not null default '{}',
  assigned_agent_ids text[] not null default '{}',
  summary text not null default '',
  next_action text not null default '',
  memory jsonb not null default '[]'::jsonb,
  messages jsonb not null default '[]'::jsonb
);

create table if not exists public.human_staff_notifications (
  id text primary key,
  created_at timestamptz not null default now(),
  from_agent_id text not null,
  to_agent_id text not null,
  title text not null,
  body text not null,
  priority text not null default 'normal',
  read boolean not null default false,
  action_label text,
  route_hint text,
  thread_id text
);

create table if not exists public.human_staff_memories (
  id text primary key,
  created_at timestamptz not null default now(),
  agent_id text not null,
  topic text not null,
  detail text not null,
  source text not null default 'system_event',
  importance int not null default 3
);

create table if not exists public.human_staff_missions (
  id text primary key,
  created_at timestamptz not null default now(),
  lead_agent_id text not null,
  supporting_agent_ids text[] not null default '{}',
  mission_type text not null,
  title text not null,
  objective text not null,
  city_ids text[] not null default '{}',
  risk_level text not null default 'medium',
  autonomy text not null default 'approval_required_external',
  operating_summary text not null default '',
  agent_briefs jsonb not null default '[]'::jsonb,
  action_sequence jsonb not null default '[]'::jsonb,
  approval_gates jsonb not null default '[]'::jsonb,
  expected_outputs jsonb not null default '[]'::jsonb
);

alter table public.human_staff_threads enable row level security;
alter table public.human_staff_notifications enable row level security;
alter table public.human_staff_memories enable row level security;
alter table public.human_staff_missions enable row level security;

drop policy if exists "admin human staff threads" on public.human_staff_threads;
create policy "admin human staff threads" on public.human_staff_threads for all using (true) with check (true);
drop policy if exists "admin human staff notifications" on public.human_staff_notifications;
create policy "admin human staff notifications" on public.human_staff_notifications for all using (true) with check (true);
drop policy if exists "admin human staff memories" on public.human_staff_memories;
create policy "admin human staff memories" on public.human_staff_memories for all using (true) with check (true);
drop policy if exists "admin human staff missions" on public.human_staff_missions;
create policy "admin human staff missions" on public.human_staff_missions for all using (true) with check (true);
