-- Partner Prospector: durable B2B referral-partner batches (not client partners).
-- Admin-only via is_admin(). Public business data. No auto-outreach.

create table if not exists public.partner_prospector_runs (
  id text primary key,
  batch_id text not null unique,
  tenant_id text null,
  params jsonb not null default '{}'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  source text not null default 'seed',
  created_by text null,
  created_at timestamptz not null default now()
);

create table if not exists public.partner_prospects (
  id text primary key,
  batch_id text not null references public.partner_prospector_runs(batch_id) on delete cascade,
  tenant_id text null,
  business_name text not null,
  person_name text not null default '',
  title text not null default '',
  city text not null default '',
  metro text not null default '',
  category text not null default '',
  vertical text not null,
  geo text not null default '',
  website text not null default '',
  phone text not null default '',
  email text not null default '',
  icp_fit text not null,
  why_fit text not null default '',
  source_urls jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  status text not null default 'new',
  draft_stub text not null default '',
  dedupe_key text not null default '',
  score int not null default 0,
  skip_reason text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partner_prospects_batch_idx on public.partner_prospects (batch_id);
create index if not exists partner_prospects_vertical_fit_idx on public.partner_prospects (vertical, icp_fit);
create index if not exists partner_prospects_dedupe_idx on public.partner_prospects (dedupe_key);
create index if not exists partner_prospects_email_idx on public.partner_prospects (email);
create index if not exists partner_prospects_phone_idx on public.partner_prospects (phone);

alter table public.partner_prospector_runs enable row level security;
alter table public.partner_prospects enable row level security;

drop policy if exists partner_prospector_runs_admin_all on public.partner_prospector_runs;
create policy partner_prospector_runs_admin_all
  on public.partner_prospector_runs
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists partner_prospects_admin_all on public.partner_prospects;
create policy partner_prospects_admin_all
  on public.partner_prospects
  for all
  using (public.is_admin())
  with check (public.is_admin());
