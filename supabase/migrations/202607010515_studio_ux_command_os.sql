-- Studio UX Command OS
-- Adds event and audit tables for media command requests, automation blueprint installs, and lead trash sync.

create table if not exists public.studio_media_commands (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by text,
  prompt text not null,
  duration_sec integer not null default 28,
  aspect text not null default '9:16',
  intent text,
  audience text,
  offer text,
  city text,
  status text not null default 'draft',
  plan jsonb not null default '{}'::jsonb,
  compliance_flags text[] not null default '{}'
);

create table if not exists public.automation_blueprint_installs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  blueprint_id text not null,
  rule_id text,
  installed_by text,
  status text not null default 'draft',
  owner text,
  meta jsonb not null default '{}'::jsonb
);

create table if not exists public.lead_trash_audit (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id text not null,
  action text not null check (action in ('trash','restore','purge')),
  reason text,
  actor text,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists idx_studio_media_commands_created_at on public.studio_media_commands(created_at desc);
create index if not exists idx_automation_blueprint_installs_blueprint_id on public.automation_blueprint_installs(blueprint_id);
create index if not exists idx_lead_trash_audit_lead_id on public.lead_trash_audit(lead_id);
