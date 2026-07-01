-- Finely Cred CMO Phase 2 persistence layer.
-- Optional but recommended after the local-first install works.
-- Keeps CMO events, campaigns, assets, directives, snapshots, settings, and model state synced across admins.

create table if not exists public.cmo_growth_events (
  id text primary key,
  tenant_id text,
  type text not null,
  source text not null,
  channel text,
  campaign_id text,
  prospect_id text,
  lead_id text,
  asset_id text,
  partner_id text,
  page_path text,
  value numeric,
  score numeric,
  labels text[] default '{}',
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.cmo_growth_records (
  id text primary key,
  tenant_id text,
  kind text not null check (kind in ('settings','model','audience','campaign','asset','scheduled_post','engagement','directive','memory','snapshot')),
  status text,
  campaign_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cmo_events_type_created on public.cmo_growth_events(type, created_at desc);
create index if not exists idx_cmo_events_campaign on public.cmo_growth_events(campaign_id, created_at desc);
create index if not exists idx_cmo_records_kind_updated on public.cmo_growth_records(kind, updated_at desc);
create index if not exists idx_cmo_records_campaign on public.cmo_growth_records(campaign_id, updated_at desc);

alter table public.cmo_growth_events enable row level security;
alter table public.cmo_growth_records enable row level security;

-- Replace these permissive policies with your tenant/admin policy if you already have one.
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cmo_growth_events' and policyname='admin can manage cmo events') then
    create policy "admin can manage cmo events" on public.cmo_growth_events
      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cmo_growth_records' and policyname='admin can manage cmo records') then
    create policy "admin can manage cmo records" on public.cmo_growth_records
      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
end $$;
