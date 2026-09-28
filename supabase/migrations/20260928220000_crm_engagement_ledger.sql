-- Immutable CRM engagement ledger + durable cold-directory heat/stage.
-- Profile completeness must never manufacture Hot. Clicks are Warm only.

alter table public.crm_prospects
  add column if not exists outreach_stage text,
  add column if not exists heat_state text,
  add column if not exists heat_fit integer not null default 0,
  add column if not exists heat_intent integer not null default 0,
  add column if not exists heat_recency integer not null default 0,
  add column if not exists heat_total integer not null default 0,
  add column if not exists heat_reasons jsonb not null default '[]'::jsonb,
  add column if not exists heat_version text not null default 'v1';

create table if not exists public.crm_engagement_events (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  prospect_id text not null,
  event_type text not null,
  source text,
  campaign_id text,
  material_id text,
  actor text,
  consent_snapshot jsonb not null default '{}'::jsonb,
  dedupe_key text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists crm_engagement_events_dedupe_idx
  on public.crm_engagement_events (tenant_id, dedupe_key);

create index if not exists crm_engagement_events_prospect_idx
  on public.crm_engagement_events (tenant_id, prospect_id, created_at desc);

alter table public.crm_engagement_events enable row level security;

drop policy if exists crm_engagement_events_admin on public.crm_engagement_events;
create policy crm_engagement_events_admin on public.crm_engagement_events
for all to authenticated
using (public.is_admin())
with check (public.is_admin());
