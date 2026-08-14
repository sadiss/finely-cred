-- Phase 2 — real server-side execution engine: CRM server-backed tables +
-- unified comms suppression list shared by client (commsSuppressionRepo.ts)
-- and server (automation-runner edge function). Best-effort dual-write only —
-- localStorage stays the source of truth on the client if these calls fail.
--
-- Note: this repo has two tenant_id conventions in the wild
-- ('tenant_finely_primary' via src/domain/tenants.ts FINELY_TENANT_ID, and the
-- literal 'finely_cred' used by nurture_enrollments/automation_rules + all
-- Edge Functions). These new tables intentionally standardize on 'finely_cred'
-- (matching automation-runner/platform-cron/meta-webhook) so the new
-- comms_suppression table is a genuine single source of truth read/written by
-- both the client repo and the server dispatch path.

create table if not exists public.crm_prospects (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  target text not null,
  stage text not null default 'new',
  source text not null default 'manual',
  score integer not null default 0,
  tags jsonb not null default '[]'::jsonb,
  company jsonb not null default '{}'::jsonb,
  contact jsonb not null default '{}'::jsonb,
  intel jsonb not null default '{}'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  touches jsonb not null default '[]'::jsonb,
  assigned_to jsonb,
  next_action jsonb,
  consent_basis text,
  lead_type text,
  email_marketing_allowed boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_prospects_tenant_stage_idx
  on public.crm_prospects (tenant_id, stage, updated_at desc);

-- Materialized CRM record read-model (mirrors src/domain/crmRecords.ts CrmRecord,
-- the merged prospect+lead view already computed client-side). Gives server
-- functions (automation-runner) a single table to read/write CRM stage + tags
-- without re-implementing the prospect/lead merge logic.
create table if not exists public.crm_records (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  kind text not null,
  target text not null,
  stage text not null,
  source text not null,
  score integer,
  tags jsonb not null default '[]'::jsonb,
  contact jsonb not null default '{}'::jsonb,
  partner_id text,
  project_ids jsonb not null default '[]'::jsonb,
  package_interest text,
  deal_value_cents integer,
  assigned_to jsonb,
  next_action jsonb,
  attribution jsonb,
  category_ids jsonb,
  source_ref jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_records_tenant_stage_idx
  on public.crm_records (tenant_id, stage, updated_at desc);
create index if not exists crm_records_partner_idx
  on public.crm_records (tenant_id, partner_id);

create table if not exists public.comms_suppression (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  email text,
  phone text,
  channel text not null default 'all',
  reason text not null default 'manual_dnc',
  note text,
  created_at timestamptz not null default now()
);

create index if not exists comms_suppression_email_idx on public.comms_suppression (tenant_id, email);
create index if not exists comms_suppression_phone_idx on public.comms_suppression (tenant_id, phone);

alter table public.crm_prospects enable row level security;
alter table public.crm_records enable row level security;
alter table public.comms_suppression enable row level security;

drop policy if exists crm_prospects_admin on public.crm_prospects;
create policy crm_prospects_admin on public.crm_prospects
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists crm_records_admin on public.crm_records;
create policy crm_records_admin on public.crm_records
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists comms_suppression_admin on public.comms_suppression;
create policy comms_suppression_admin on public.comms_suppression
for all to authenticated
using (public.is_admin())
with check (public.is_admin());
