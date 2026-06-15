-- =====================================================================
-- Finely Cred - LIVE database setup (run ONCE, in order)
-- HOW: Supabase Dashboard -> SQL Editor -> New query -> paste ALL -> Run
-- Safe to re-run (idempotent). Auto-generated from supabase/migrations (18 files).
-- Regenerate: node scripts/rebuild-live-setup.mjs
-- After running, see docs/PRODUCTION_DEPLOY.md for env vars, secrets, deploy:functions.
-- =====================================================================

-- ============================================================
-- SECTION: 20260211000100_full_mode_core.sql
-- ============================================================

-- Full Mode Core: tenants/partners + billing (agreements/entitlements) + minimal audit.
-- This migration is designed to match existing app string IDs (e.g. "partner_...", "agree_...").

-- Extensions
create extension if not exists pgcrypto;

-- -------------------------------------------------------------------
-- Tenancy
-- -------------------------------------------------------------------
create table if not exists public.tenants (
  id text primary key,
  type text not null check (type in ('platform', 'agency')),
  name text not null,
  slug text not null unique,
  status text not null check (status in ('active', 'suspended', 'pending')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  role text not null,
  status text not null,
  permissions jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------------
-- Partners (end-user / client records)
-- -------------------------------------------------------------------
create table if not exists public.partners (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete restrict,
  status text not null default 'active',
  profile jsonb not null default '{}'::jsonb,
  primary_route text null,
  lane text null,
  journey_stage text null,
  assigned_agent_id text null,
  claimed_user_id uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure one claimed partner per auth user (prevents cross-device duplicates)
create unique index if not exists partners_claimed_user_unique
  on public.partners (claimed_user_id)
  where claimed_user_id is not null;

-- Helper: is the current auth user the owner of a partner record?
create or replace function public.is_partner_owner(pid text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.partners p
    where p.id = pid
      and p.claimed_user_id = auth.uid()
  );
$$;

-- -------------------------------------------------------------------
-- Billing
-- -------------------------------------------------------------------
create table if not exists public.billing_accounts (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete restrict,
  partner_id text not null references public.partners(id) on delete cascade,
  status text not null check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agreements (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete restrict,
  billing_account_id text null references public.billing_accounts(id) on delete set null,
  partner_id text not null references public.partners(id) on delete cascade,
  package_id text not null,
  rail text not null check (rail in ('stripe', 'in_house')),
  status text not null check (status in ('draft','pending_review','active','past_due','cancelled','completed')),
  amount_cents integer not null default 0,
  external_ref text null,
  denefits_contract_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz null,
  ended_at timestamptz null
);

create table if not exists public.agreement_events (
  id text primary key,
  agreement_id text not null references public.agreements(id) on delete cascade,
  kind text not null,
  payload jsonb null,
  created_at timestamptz not null default now()
);

create table if not exists public.entitlements (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete restrict,
  partner_id text not null references public.partners(id) on delete cascade,
  key text not null,
  source_agreement_id text null references public.agreements(id) on delete set null,
  status text not null check (status in ('active','inactive','revoked','expired')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz null
);

create index if not exists entitlements_partner_key_idx on public.entitlements(partner_id, key);
create unique index if not exists entitlements_partner_key_unique on public.entitlements(partner_id, key);

-- -------------------------------------------------------------------
-- Audit events (minimal)
-- -------------------------------------------------------------------
create table if not exists public.audit_events (
  id text primary key,
  tenant_id text null references public.tenants(id) on delete set null,
  partner_id text null references public.partners(id) on delete set null,
  actor_type text not null,
  actor_email text null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  meta jsonb null,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------------
alter table public.tenants enable row level security;
alter table public.memberships enable row level security;
alter table public.partners enable row level security;
alter table public.billing_accounts enable row level security;
alter table public.agreements enable row level security;
alter table public.agreement_events enable row level security;
alter table public.entitlements enable row level security;
alter table public.audit_events enable row level security;

-- Tenants/Memberships: locked down by default (admin-only flows later).
-- For now: no anon access; no general auth access. Server/service-role can manage.

-- Partners: allow the claimed user to read/write their own partner record.
drop policy if exists partner_select_own on public.partners;
create policy partner_select_own on public.partners
for select
to authenticated
using (claimed_user_id = auth.uid());

drop policy if exists partner_insert_self on public.partners;
create policy partner_insert_self on public.partners
for insert
to authenticated
with check (claimed_user_id = auth.uid());

drop policy if exists partner_update_own on public.partners;
create policy partner_update_own on public.partners
for update
to authenticated
using (claimed_user_id = auth.uid())
with check (claimed_user_id = auth.uid());

-- Billing: allow partner to read their own billing state.
drop policy if exists billing_accounts_select_own on public.billing_accounts;
create policy billing_accounts_select_own on public.billing_accounts
for select
to authenticated
using (public.is_partner_owner(partner_id));

drop policy if exists billing_accounts_insert_own on public.billing_accounts;
create policy billing_accounts_insert_own on public.billing_accounts
for insert
to authenticated
with check (public.is_partner_owner(partner_id));

drop policy if exists billing_accounts_update_own on public.billing_accounts;
create policy billing_accounts_update_own on public.billing_accounts
for update
to authenticated
using (public.is_partner_owner(partner_id))
with check (public.is_partner_owner(partner_id));

drop policy if exists agreements_select_own on public.agreements;
create policy agreements_select_own on public.agreements
for select
to authenticated
using (public.is_partner_owner(partner_id));

drop policy if exists agreements_insert_own on public.agreements;
create policy agreements_insert_own on public.agreements
for insert
to authenticated
with check (public.is_partner_owner(partner_id));

drop policy if exists agreements_update_own on public.agreements;
create policy agreements_update_own on public.agreements
for update
to authenticated
using (public.is_partner_owner(partner_id))
with check (public.is_partner_owner(partner_id));

drop policy if exists entitlements_select_own on public.entitlements;
create policy entitlements_select_own on public.entitlements
for select
to authenticated
using (public.is_partner_owner(partner_id));

drop policy if exists agreement_events_select_own on public.agreement_events;
create policy agreement_events_select_own on public.agreement_events
for select
to authenticated
using (
  exists (
    select 1
    from public.agreements a
    where a.id = agreement_events.agreement_id
      and public.is_partner_owner(a.partner_id)
  )
);

drop policy if exists audit_events_select_own on public.audit_events;
create policy audit_events_select_own on public.audit_events
for select
to authenticated
using (partner_id is not null and public.is_partner_owner(partner_id));

-- Seed primary tenant (id matches src/domain/tenants.ts)
insert into public.tenants (id, type, name, slug, status, settings)
values (
  'tenant_finely_primary',
  'platform',
  'Finely Cred',
  'finely-cred',
  'active',
  jsonb_build_object('features', jsonb_build_object(
    'whiteLabel', false,
    'businessCredit', true,
    'debtResolution', true,
    'tradelines', false,
    'wealthPaths', true,
    'apiAccess', false
  ))
)
on conflict (id) do nothing;


-- ============================================================
-- SECTION: 20260211000200_full_mode_workflow.sql
-- ============================================================

-- Full Mode Workflow: reports, evidence, letters, cases (portable across devices)

-- Reports (store full record as jsonb for flexibility)
create table if not exists public.credit_reports (
  id text primary key,
  partner_id text not null references public.partners(id) on delete cascade,
  received_at timestamptz not null,
  filename text null,
  provider text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists credit_reports_partner_received_idx on public.credit_reports(partner_id, received_at desc);

-- Evidence metadata (blobs live in storage; this is the index)
create table if not exists public.evidence (
  id text primary key,
  partner_id text not null references public.partners(id) on delete cascade,
  report_id text null references public.credit_reports(id) on delete set null,
  type text not null,
  source text null,
  section_key text null,
  creditor_name text null,
  caption text null,
  filename text null,
  mime_type text null,
  size_bytes bigint null,
  blob_ref text null,
  created_at timestamptz not null default now()
);

create index if not exists evidence_partner_created_idx on public.evidence(partner_id, created_at desc);

-- Letters
create table if not exists public.letters (
  id text primary key,
  partner_id text not null references public.partners(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  status text null,
  meta jsonb null,
  pdf_blob_ref text null,
  pdf_filename text null,
  related_evidence_ids jsonb null,
  mailing jsonb null,
  archived_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists letters_partner_created_idx on public.letters(partner_id, created_at desc);

-- Dispute cases
create table if not exists public.cases (
  id text primary key,
  partner_id text not null references public.partners(id) on delete cascade,
  project_id text null,
  bureau text not null,
  title text not null,
  status text not null,
  latest_report_id text null references public.credit_reports(id) on delete set null,
  items jsonb not null default '[]'::jsonb,
  rounds jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cases_partner_updated_idx on public.cases(partner_id, updated_at desc);

-- -------------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------------
alter table public.credit_reports enable row level security;
alter table public.evidence enable row level security;
alter table public.letters enable row level security;
alter table public.cases enable row level security;

drop policy if exists credit_reports_select_own on public.credit_reports;
create policy credit_reports_select_own on public.credit_reports
for select
to authenticated
using (public.is_partner_owner(partner_id));

drop policy if exists credit_reports_insert_own on public.credit_reports;
create policy credit_reports_insert_own on public.credit_reports
for insert
to authenticated
with check (public.is_partner_owner(partner_id));

drop policy if exists credit_reports_update_own on public.credit_reports;
create policy credit_reports_update_own on public.credit_reports
for update
to authenticated
using (public.is_partner_owner(partner_id))
with check (public.is_partner_owner(partner_id));

drop policy if exists evidence_select_own on public.evidence;
create policy evidence_select_own on public.evidence
for select
to authenticated
using (public.is_partner_owner(partner_id));

drop policy if exists evidence_insert_own on public.evidence;
create policy evidence_insert_own on public.evidence
for insert
to authenticated
with check (public.is_partner_owner(partner_id));

drop policy if exists evidence_update_own on public.evidence;
create policy evidence_update_own on public.evidence
for update
to authenticated
using (public.is_partner_owner(partner_id))
with check (public.is_partner_owner(partner_id));

drop policy if exists letters_select_own on public.letters;
create policy letters_select_own on public.letters
for select
to authenticated
using (public.is_partner_owner(partner_id));

drop policy if exists letters_insert_own on public.letters;
create policy letters_insert_own on public.letters
for insert
to authenticated
with check (public.is_partner_owner(partner_id));

drop policy if exists letters_update_own on public.letters;
create policy letters_update_own on public.letters
for update
to authenticated
using (public.is_partner_owner(partner_id))
with check (public.is_partner_owner(partner_id));

drop policy if exists cases_select_own on public.cases;
create policy cases_select_own on public.cases
for select
to authenticated
using (public.is_partner_owner(partner_id));

drop policy if exists cases_insert_own on public.cases;
create policy cases_insert_own on public.cases
for insert
to authenticated
with check (public.is_partner_owner(partner_id));

drop policy if exists cases_update_own on public.cases;
create policy cases_update_own on public.cases
for update
to authenticated
using (public.is_partner_owner(partner_id))
with check (public.is_partner_owner(partner_id));


-- ============================================================
-- SECTION: 20260521000001_add_admin_bypass_to_rls.sql
-- ============================================================

-- Add admin bypass to is_partner_owner check
-- This allows admins (identified by email) to access any partner's data

-- Admin email allowlist (matches ADMIN_EMAIL_ALLOWLIST in src/auth/admin.ts)
create table if not exists public.admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

-- Populate initial admin emails (can be updated via dashboard)
insert into public.admin_emails (email) values
  ('partnersupport@finelycred.com'),
  ('sanzstlouis@finelycred.com'),
  ('shellystlouis@finelycred.com')
on conflict (email) do nothing;

-- Helper to check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.admin_emails
    where email = auth.jwt() ->> 'email'
  );
$$;

-- Updated: is the current auth user the owner of a partner record or an admin?
create or replace function public.is_partner_owner(pid text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.partners p
    where p.id = pid
      and (
        p.claimed_user_id = auth.uid()
        or public.is_admin()
      )
  );
$$;

-- Enable RLS on admin_emails table
alter table public.admin_emails enable row level security;

-- Admin emails can only be managed by service role (no general auth access)
-- This is locked down by default and should be managed via Supabase dashboard or backend API


-- ============================================================
-- SECTION: 20260530000001_fix_admin_partner_select_policy.sql
-- ============================================================

-- Fix: Admin users could not see all partners because the SELECT policy
-- only checked claimed_user_id = auth.uid(), ignoring the is_admin() function
-- that was added in 20260521000001_add_admin_bypass_to_rls.sql.

-- Fix the partners SELECT policy so admins can see ALL partners.
drop policy if exists partner_select_own on public.partners;
create policy partner_select_own on public.partners
for select
to authenticated
using (
  claimed_user_id = auth.uid()
  or public.is_admin()
);

-- Also fix INSERT/UPDATE/DELETE so admins can manage any partner record.
drop policy if exists partner_insert_self on public.partners;
create policy partner_insert_self on public.partners
for insert
to authenticated
with check (
  claimed_user_id = auth.uid()
  or public.is_admin()
);

drop policy if exists partner_update_own on public.partners;
create policy partner_update_own on public.partners
for update
to authenticated
using (
  claimed_user_id = auth.uid()
  or public.is_admin()
)
with check (
  claimed_user_id = auth.uid()
  or public.is_admin()
);

drop policy if exists partner_delete_own on public.partners;
create policy partner_delete_own on public.partners
for delete
to authenticated
using (
  claimed_user_id = auth.uid()
  or public.is_admin()
);


-- ============================================================
-- SECTION: 20260606000001_storage_pii_bucket.sql
-- ============================================================

-- Private storage bucket for partner PII: evidence screenshots, generated
-- letter PDFs, uploaded documents, etc.
--
-- WHY THIS EXISTS:
-- The app stores binary files via SupabaseBlobStore, which uploads to the bucket
-- named by VITE_SUPABASE_PRIVATE_BUCKET (default "pii") at the path
--   partners/{partnerId}/{kind}/{id}.{ext}
-- and renders them through short-lived signed URLs. If the bucket or its access
-- policies don't exist, uploads and signed-URL reads fail on live, so screenshots
-- and letter PDFs appear locally (IndexedDB) but NOT on live. This migration
-- creates the bucket and the access rules so they work on live too.
--
-- NOTE: if you set VITE_SUPABASE_PRIVATE_BUCKET to something other than "pii",
-- change the bucket id in BOTH the insert and the policies below to match.

-- 1) Create the private bucket (not public; access is via signed URLs only).
insert into storage.buckets (id, name, public)
values ('pii', 'pii', false)
on conflict (id) do nothing;

-- 2) RLS on storage objects (enabled by default on Supabase; harmless if already on).
alter table storage.objects enable row level security;

-- 3) Access policy: an authenticated user can read/write objects in the "pii"
--    bucket for a partner they own - OR any partner if they are an admin.
--    Path layout is partners/{partnerId}/..., so the partner id is the 2nd
--    folder segment: (storage.foldername(name))[2].
--    Reuses public.is_partner_owner() (admin bypass included) from the
--    20260521000001 migration, so this matches the letters/evidence table rules.
drop policy if exists pii_partner_owner_all on storage.objects;
create policy pii_partner_owner_all on storage.objects
for all
to authenticated
using (
  bucket_id = 'pii'
  and public.is_partner_owner((storage.foldername(name))[2])
)
with check (
  bucket_id = 'pii'
  and public.is_partner_owner((storage.foldername(name))[2])
);


-- ============================================================
-- SECTION: 20260611000001_role_os_migration_nora.sql
-- ============================================================

-- Role OS 2.0 + legacy import columns + AU sellers + affiliates + Nora funding stage

alter table public.partners
  add column if not exists import_source text null,
  add column if not exists import_external_id text null,
  add column if not exists journey_signals jsonb not null default '{}'::jsonb,
  add column if not exists notes text null,
  add column if not exists routes jsonb not null default '{}'::jsonb,
  add column if not exists consents jsonb not null default '{}'::jsonb,
  add column if not exists funding_stage text null,
  add column if not exists funding_meta jsonb not null default '{}'::jsonb;

create unique index if not exists partners_import_external_unique
  on public.partners (import_source, import_external_id)
  where import_source is not null and import_external_id is not null;

-- AU Seller supply-side
create table if not exists public.au_sellers (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete restrict,
  email text not null,
  full_name text null,
  phone text null,
  business_name text null,
  entity_type text null,
  address jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('active', 'pending', 'suspended')),
  verification jsonb not null default '{}'::jsonb,
  contract jsonb not null default '{}'::jsonb,
  payouts jsonb not null default '{}'::jsonb,
  referral_code text null,
  notes text null,
  claimed_user_id uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists au_sellers_tenant_email_idx on public.au_sellers(tenant_id, email);

create table if not exists public.au_seller_listings (
  id text primary key,
  seller_id text not null references public.au_sellers(id) on delete cascade,
  bank text not null default '',
  credit_limit text not null default '',
  age text not null default '',
  price_cents integer not null default 0,
  bureau text null,
  card_type text null,
  utilization_pct integer null,
  statement_date text null,
  slots_available integer null,
  min_score integer null,
  reporting_history_months integer null,
  opened_at text null,
  notes text null,
  proof_blob_ref text null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists au_seller_listings_seller_idx on public.au_seller_listings(seller_id);

create table if not exists public.au_seller_contracts (
  id text primary key,
  seller_id text not null references public.au_sellers(id) on delete cascade,
  listing_id text null references public.au_seller_listings(id) on delete set null,
  buyer_partner_id text null references public.partners(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'fulfilled', 'cancelled', 'disputed')),
  amount_cents integer not null default 0,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists au_seller_contracts_seller_idx on public.au_seller_contracts(seller_id);

-- Affiliate program
create table if not exists public.affiliates (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete restrict,
  email text not null,
  full_name text null,
  referral_code text not null,
  commission_pct numeric(5,2) not null default 20,
  recurring_commission_pct numeric(5,2) not null default 15,
  denefits_share_pct numeric(5,2) not null default 8,
  status text not null default 'active' check (status in ('active', 'pending', 'suspended')),
  claimed_user_id uuid null references auth.users(id) on delete set null,
  partner_id text null references public.partners(id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists affiliates_referral_code_unique on public.affiliates(referral_code);

create table if not exists public.affiliate_campaigns (
  id text primary key,
  affiliate_id text not null references public.affiliates(id) on delete cascade,
  name text not null,
  utm_source text null,
  utm_medium text null,
  utm_campaign text null,
  landing_path text null,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.affiliate_attributions (
  id text primary key,
  affiliate_id text not null references public.affiliates(id) on delete cascade,
  campaign_id text null references public.affiliate_campaigns(id) on delete set null,
  event_type text not null check (event_type in ('click', 'lead', 'signup', 'conversion', 'payout')),
  partner_id text null references public.partners(id) on delete set null,
  amount_cents integer null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_attributions_affiliate_idx on public.affiliate_attributions(affiliate_id, created_at desc);

alter table public.au_sellers enable row level security;
alter table public.au_seller_listings enable row level security;
alter table public.au_seller_contracts enable row level security;
alter table public.affiliates enable row level security;
alter table public.affiliate_campaigns enable row level security;
alter table public.affiliate_attributions enable row level security;


-- ============================================================
-- SECTION: 20260612000000_voice_studio.sql
-- ============================================================

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


-- ============================================================
-- SECTION: 20260612000001_lead_captures_referral_columns.sql
-- ============================================================

-- Nullable referral columns on lead_captures (handoff tier 293)
alter table if exists public.lead_captures
  add column if not exists referral_code text,
  add column if not exists referral_source text,
  add column if not exists utm_campaign text,
  add column if not exists utm_medium text,
  add column if not exists utm_source text;

comment on column public.lead_captures.referral_code is 'Short referral / affiliate code when present';
comment on column public.lead_captures.referral_source is 'Human-readable referral source label';


-- ============================================================
-- SECTION: 20260614000001_lead_captures_table.sql
-- ============================================================

-- Lead captures table + referral attribution columns (Tier 293)
create table if not exists public.lead_captures (
  id text primary key,
  created_at timestamptz not null default now(),
  source text not null,
  offer text not null,
  interest text null,
  full_name text not null,
  email text not null,
  phone text null,
  consent_to_contact boolean not null default false,
  referral_code text null,
  referral_source text null,
  promoter_role text null,
  promo_type text null,
  promo_asset text null,
  utm_source text null,
  utm_medium text null,
  utm_campaign text null,
  funnel_path text null
);

create index if not exists lead_captures_created_idx on public.lead_captures(created_at desc);
create index if not exists lead_captures_email_idx on public.lead_captures(email);

alter table public.lead_captures enable row level security;

drop policy if exists lead_captures_admin_all on public.lead_captures;
create policy lead_captures_admin_all on public.lead_captures
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists lead_captures_anon_insert on public.lead_captures;
create policy lead_captures_anon_insert on public.lead_captures
for insert
to anon, authenticated
with check (true);

-- Backfill columns when table existed before this migration
alter table if exists public.lead_captures
  add column if not exists referral_code text,
  add column if not exists referral_source text,
  add column if not exists promoter_role text,
  add column if not exists promo_type text,
  add column if not exists promo_asset text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists funnel_path text;


-- ============================================================
-- SECTION: 20260614000002_role_os_rls.sql
-- ============================================================

-- RLS policies for Role OS 2.0 tables (Tier 349/357)

-- AU sellers: owner or admin
drop policy if exists au_sellers_select on public.au_sellers;
create policy au_sellers_select on public.au_sellers
for select to authenticated
using (claimed_user_id = auth.uid() or public.is_admin());

drop policy if exists au_sellers_update on public.au_sellers;
create policy au_sellers_update on public.au_sellers
for update to authenticated
using (claimed_user_id = auth.uid() or public.is_admin())
with check (claimed_user_id = auth.uid() or public.is_admin());

drop policy if exists au_sellers_admin_write on public.au_sellers;
create policy au_sellers_admin_write on public.au_sellers
for insert to authenticated
with check (public.is_admin());

drop policy if exists au_sellers_admin_delete on public.au_sellers;
create policy au_sellers_admin_delete on public.au_sellers
for delete to authenticated
using (public.is_admin());

-- Listings: seller owner or admin
drop policy if exists au_seller_listings_select on public.au_seller_listings;
create policy au_seller_listings_select on public.au_seller_listings
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.au_sellers s
    where s.id = seller_id and s.claimed_user_id = auth.uid()
  )
);

drop policy if exists au_seller_listings_write on public.au_seller_listings;
create policy au_seller_listings_write on public.au_seller_listings
for all to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.au_sellers s
    where s.id = seller_id and s.claimed_user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.au_sellers s
    where s.id = seller_id and s.claimed_user_id = auth.uid()
  )
);

-- Contracts: seller owner, buyer partner owner, or admin
drop policy if exists au_seller_contracts_select on public.au_seller_contracts;
create policy au_seller_contracts_select on public.au_seller_contracts
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.au_sellers s
    where s.id = seller_id and s.claimed_user_id = auth.uid()
  )
  or (buyer_partner_id is not null and public.is_partner_owner(buyer_partner_id))
);

drop policy if exists au_seller_contracts_write on public.au_seller_contracts;
create policy au_seller_contracts_write on public.au_seller_contracts
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Affiliates: owner or admin
drop policy if exists affiliates_select on public.affiliates;
create policy affiliates_select on public.affiliates
for select to authenticated
using (claimed_user_id = auth.uid() or public.is_admin());

drop policy if exists affiliates_update on public.affiliates;
create policy affiliates_update on public.affiliates
for update to authenticated
using (claimed_user_id = auth.uid() or public.is_admin())
with check (claimed_user_id = auth.uid() or public.is_admin());

drop policy if exists affiliates_admin_write on public.affiliates;
create policy affiliates_admin_write on public.affiliates
for insert to authenticated
with check (public.is_admin());

drop policy if exists affiliate_campaigns_select on public.affiliate_campaigns;
create policy affiliate_campaigns_select on public.affiliate_campaigns
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.affiliates a
    where a.id = affiliate_id and a.claimed_user_id = auth.uid()
  )
);

drop policy if exists affiliate_campaigns_write on public.affiliate_campaigns;
create policy affiliate_campaigns_write on public.affiliate_campaigns
for all to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.affiliates a
    where a.id = affiliate_id and a.claimed_user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.affiliates a
    where a.id = affiliate_id and a.claimed_user_id = auth.uid()
  )
);

drop policy if exists affiliate_attributions_select on public.affiliate_attributions;
create policy affiliate_attributions_select on public.affiliate_attributions
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.affiliates a
    where a.id = affiliate_id and a.claimed_user_id = auth.uid()
  )
);

drop policy if exists affiliate_attributions_admin_write on public.affiliate_attributions;
create policy affiliate_attributions_admin_write on public.affiliate_attributions
for insert to authenticated
with check (public.is_admin());


-- ============================================================
-- SECTION: 20260615000000_meta_connections.sql
-- ============================================================

-- Meta Social Hub — page connections + inbox archive (Phase 3)
create table if not exists public.meta_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'finely_cred',
  page_id text not null,
  page_name text,
  ig_business_id text,
  ig_username text,
  access_token text,
  connected_at timestamptz not null default now(),
  token_expires_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (tenant_id, page_id)
);

create table if not exists public.meta_inbox_messages (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  page_id text not null,
  thread_id text not null,
  channel text not null default 'messenger',
  direction text not null default 'inbound',
  text text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists meta_inbox_created_idx on public.meta_inbox_messages(created_at desc);

alter table public.meta_connections enable row level security;
alter table public.meta_inbox_messages enable row level security;

drop policy if exists meta_connections_admin on public.meta_connections;
create policy meta_connections_admin on public.meta_connections
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists meta_inbox_admin on public.meta_inbox_messages;
create policy meta_inbox_admin on public.meta_inbox_messages
for all to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- SECTION: 20260616000000_staff_members.sql
-- ============================================================

-- Staff roster sync (Phase 12B) — named team members + shift blocks for multi-admin parity

create table if not exists public.staff_members (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  first_name text not null,
  last_name text not null,
  primary_role_id text not null,
  department text not null,
  display_title text,
  avatar_path text not null,
  bio_line text,
  shift_blocks jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_members_tenant_idx on public.staff_members (tenant_id);
create index if not exists staff_members_role_idx on public.staff_members (primary_role_id);

alter table public.staff_members enable row level security;

drop policy if exists staff_members_select on public.staff_members;
create policy staff_members_select on public.staff_members
for select to authenticated
using (public.is_admin() or true);

drop policy if exists staff_members_admin_write on public.staff_members;
create policy staff_members_admin_write on public.staff_members
for all to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- SECTION: 20260617000000_social_scheduled_posts.sql
-- ============================================================

-- Social Hub — scheduled posts + autopilot config (server cron persistence)
create table if not exists public.social_scheduled_posts (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  caption text not null,
  scheduled_at timestamptz not null,
  status text not null default 'queued',
  page_id text,
  platforms jsonb,
  sop_template_id text,
  assigned_staff_id text,
  compliance_status text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_scheduled_posts_due_idx
  on public.social_scheduled_posts (tenant_id, status, scheduled_at);

create table if not exists public.social_autopilot_config (
  tenant_id text primary key default 'finely_cred',
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.social_scheduled_posts enable row level security;
alter table public.social_autopilot_config enable row level security;

drop policy if exists social_scheduled_posts_admin on public.social_scheduled_posts;
create policy social_scheduled_posts_admin on public.social_scheduled_posts
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists social_autopilot_config_admin on public.social_autopilot_config;
create policy social_autopilot_config_admin on public.social_autopilot_config
for all to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- SECTION: 20260618000000_platform_cron_heartbeats.sql
-- ============================================================

-- Platform cron heartbeat — last server tick snapshot for admin monitoring
create table if not exists public.platform_cron_heartbeats (
  id text primary key default 'latest',
  tenant_id text not null default 'finely_cred',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.platform_cron_heartbeats enable row level security;

drop policy if exists platform_cron_heartbeats_admin on public.platform_cron_heartbeats;
create policy platform_cron_heartbeats_admin on public.platform_cron_heartbeats
for all to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- SECTION: 20260619000000_nurture_automation_persistence.sql
-- ============================================================

-- Nurture + automation persistence for server-side cron (Part AQ)
create table if not exists public.nurture_enrollments (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  sequence_id text not null,
  lead_id text not null,
  started_at timestamptz not null,
  next_step_index integer not null default 0,
  next_run_at timestamptz not null,
  status text not null default 'active',
  context jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists nurture_enrollments_due_idx
  on public.nurture_enrollments (tenant_id, status, next_run_at);

create table if not exists public.automation_rules (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  rule jsonb not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists automation_rules_enabled_idx
  on public.automation_rules (tenant_id, enabled, updated_at desc);

alter table public.nurture_enrollments enable row level security;
alter table public.automation_rules enable row level security;

drop policy if exists nurture_enrollments_admin on public.nurture_enrollments;
create policy nurture_enrollments_admin on public.nurture_enrollments
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists automation_rules_admin on public.automation_rules;
create policy automation_rules_admin on public.automation_rules
for all to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- SECTION: 20260620000000_automation_rule_runs_cron_schedule.sql
-- ============================================================

-- Automation rule run log + platform cron schedule (Part AR)
create table if not exists public.automation_rule_runs (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  rule_id text not null,
  started_at timestamptz not null default now(),
  mode text not null default 'live',
  summary text,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists automation_rule_runs_rule_idx
  on public.automation_rule_runs (tenant_id, rule_id, started_at desc);

create table if not exists public.platform_cron_schedule (
  id text primary key default 'live',
  tenant_id text not null default 'finely_cred',
  enabled boolean not null default false,
  interval_minutes integer not null default 15,
  dry_run boolean not null default false,
  load_social_from_db boolean not null default true,
  run_automation_sweep boolean not null default true,
  notes text,
  updated_at timestamptz not null default now()
);

insert into public.platform_cron_schedule (id, tenant_id, notes)
values (
  'live',
  'finely_cred',
  'Enable via pg_cron — see docs/PLATFORM_CRON.md. Set enabled=true after scheduling.'
)
on conflict (id) do nothing;

alter table public.automation_rule_runs enable row level security;
alter table public.platform_cron_schedule enable row level security;

drop policy if exists automation_rule_runs_admin on public.automation_rule_runs;
create policy automation_rule_runs_admin on public.automation_rule_runs
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists platform_cron_schedule_admin on public.platform_cron_schedule;
create policy platform_cron_schedule_admin on public.platform_cron_schedule
for all to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- SECTION: 20260621000000_server_automation_queue.sql
-- ============================================================

-- Server automation queue — create_task / run_workflow from DB rules (Part AS)
create table if not exists public.server_automation_queue (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  rule_id text not null,
  action_type text not null default 'execute_rule',
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists server_automation_queue_pending_idx
  on public.server_automation_queue (tenant_id, status, created_at);

alter table public.server_automation_queue enable row level security;

drop policy if exists server_automation_queue_admin on public.server_automation_queue;
create policy server_automation_queue_admin on public.server_automation_queue
for all to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- SECTION: 20260622000000_work_tasks.sql
-- ============================================================

-- Server-created Work OS tasks (Part BD — server-side create_task without client drain)
create table if not exists public.work_tasks (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  partner_id text not null,
  project_id text,
  title text not null,
  kind text not null default 'general',
  stage text,
  priority text,
  status text not null default 'pending',
  due_at timestamptz,
  notes text,
  tags jsonb not null default '[]'::jsonb,
  assigned_to text default 'partner',
  visibility text default 'partner',
  source_rule_id text,
  source_queue_id text,
  task jsonb not null default '{}'::jsonb,
  merged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists work_tasks_partner_idx
  on public.work_tasks (tenant_id, partner_id, created_at desc);

create index if not exists work_tasks_unmerged_idx
  on public.work_tasks (tenant_id, merged_at nulls first, created_at asc);

alter table public.work_tasks enable row level security;

drop policy if exists work_tasks_admin on public.work_tasks;
create policy work_tasks_admin on public.work_tasks
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists work_tasks_partner_read on public.work_tasks;
create policy work_tasks_partner_read on public.work_tasks
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.partners p
    where p.id = work_tasks.partner_id
      and p.claimed_user_id = auth.uid()
  )
);

drop policy if exists work_tasks_partner_merge on public.work_tasks;
create policy work_tasks_partner_merge on public.work_tasks
for update to authenticated
using (
  exists (
    select 1 from public.partners p
    where p.id = work_tasks.partner_id
      and p.claimed_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.partners p
    where p.id = work_tasks.partner_id
      and p.claimed_user_id = auth.uid()
  )
);

