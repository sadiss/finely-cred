-- Finely Voice Studio — shared audio catalog for Finely Cred + Nora Capital Group

create table if not exists public.voice_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null check (tenant_id in ('finely_cred', 'nora_capital')),
  content_type text not null check (content_type in ('guide', 'ebook', 'funding_module')),
  content_id text not null,
  title text not null default '',
  voice_profile text not null,
  script_hash text not null,
  pipeline_version text not null default 'v1',
  storage_path text not null,
  provider text,
  model text,
  duration_sec integer,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, content_type, content_id, voice_profile, script_hash, pipeline_version)
);

create index if not exists voice_assets_tenant_content_idx
  on public.voice_assets (tenant_id, content_type, content_id, voice_profile, status);

create table if not exists public.voice_clones (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null check (tenant_id in ('finely_cred', 'nora_capital')),
  profile_key text not null,
  provider text not null,
  voice_id text not null,
  label text not null default '',
  consent_recorded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, profile_key)
);

create table if not exists public.voice_render_jobs (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.voice_assets(id) on delete set null,
  tenant_id text not null,
  content_id text not null,
  voice_profile text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.voice_assets enable row level security;
alter table public.voice_clones enable row level security;
alter table public.voice_render_jobs enable row level security;

insert into storage.buckets (id, name, public)
values ('voice-masters', 'voice-masters', false)
on conflict (id) do nothing;
