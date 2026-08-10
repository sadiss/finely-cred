-- =====================================================================
-- Finely Cred - LIVE database setup (run ONCE, in order)
-- HOW: Supabase Dashboard -> SQL Editor -> New query -> paste ALL -> Run
-- Safe to re-run (idempotent). Auto-generated from supabase/migrations (37 files).
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

-- 2) RLS on storage objects is always enabled on Supabase — no ALTER needed.
-- (Removed: `alter table storage.objects enable row level security` fails because
--  the migration runner is not the owner of that system table.)

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


-- ============================================================
-- SECTION: 20260623000000_secret_vault_items.sql
-- ============================================================

-- Owner Secret Vault — server index for cross-device + NCG API feed
create table if not exists public.secret_vault_items (
  id text primary key,
  tenant_id text not null,
  type text not null default 'file',
  media_kind text not null default 'document',
  title text not null,
  notes text null,
  tags jsonb not null default '[]'::jsonb,
  blob_ref text null,
  filename text null,
  mime_type text null,
  size_bytes bigint null,
  sha256 text null,
  source_url text null,
  youtube_id text null,
  intel jsonb null,
  shared_with_roles jsonb not null default '[]'::jsonb,
  share_with_ncg boolean not null default false,
  created_by_user_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists secret_vault_items_tenant_updated_idx
  on public.secret_vault_items (tenant_id, updated_at desc);

create index if not exists secret_vault_items_ncg_idx
  on public.secret_vault_items (tenant_id, share_with_ncg)
  where share_with_ncg = true;

alter table public.secret_vault_items enable row level security;

drop policy if exists secret_vault_items_admin on public.secret_vault_items;
create policy secret_vault_items_admin on public.secret_vault_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists secret_vault_items_select_owner on public.secret_vault_items;
create policy secret_vault_items_select_owner on public.secret_vault_items
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid()
      and m.tenant_id = secret_vault_items.tenant_id
      and m.status = 'active'
      and (m.role in ('platform_admin', 'tenant_owner', 'agent') or coalesce((m.permissions->>'canAccessVault')::boolean, false))
  )
);


-- ============================================================
-- SECTION: 20260624000000_hos_access_codes.sql
-- ============================================================

-- Head of Society invite keys — one key per assigned person (server-validated).

create table if not exists public.hos_access_codes (
  id text primary key,
  code text not null unique,
  label text,
  assigned_first_name text not null,
  assigned_last_name text not null,
  assigned_email text not null,
  assigned_phone text,
  assigned_lead_id text,
  notes text,
  cohort text,
  created_at timestamptz not null default now(),
  created_by text,
  expires_at timestamptz,
  max_uses int not null default 1 check (max_uses >= 1),
  use_count int not null default 0 check (use_count >= 0),
  redeemed_by jsonb not null default '[]'::jsonb,
  revoked boolean not null default false
);

create index if not exists hos_access_codes_code_idx on public.hos_access_codes (code);
create index if not exists hos_access_codes_assigned_email_idx on public.hos_access_codes (lower(assigned_email));
create index if not exists hos_access_codes_created_at_idx on public.hos_access_codes (created_at desc);

alter table public.hos_access_codes enable row level security;

-- Public can validate/redeem via edge function (service role). No direct anon select.
drop policy if exists hos_access_codes_admin_all on public.hos_access_codes;
create policy hos_access_codes_admin_all on public.hos_access_codes
  for all
  using (
    exists (
      select 1 from public.admin_emails ae
      where ae.email = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
  with check (
    exists (
      select 1 from public.admin_emails ae
      where ae.email = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );


-- ============================================================
-- SECTION: 20260629000001_fix_is_admin_security_definer.sql
-- ============================================================

-- Fix: is_admin() and is_partner_owner() need SECURITY DEFINER.
--
-- Root cause of error 42501 on partners INSERT/UPDATE:
--   is_admin() queries the admin_emails table, but admin_emails has RLS
--   enabled with NO SELECT policy for authenticated users. Without
--   SECURITY DEFINER the function runs as the calling user, gets 0 rows,
--   and always returns false — so any INSERT where claimed_user_id is NULL
--   (admin-created partner rows) fails the WITH CHECK policy.
--
-- Fix: SECURITY DEFINER causes the function to run as the DB owner,
--   bypassing RLS on admin_emails. set search_path = public prevents
--   search-path hijacking (security best practice for SECURITY DEFINER fns).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $func$
  select exists (
    select 1
    from public.admin_emails
    where email = auth.jwt() ->> 'email'
  );
$func$;

-- is_partner_owner() also benefits from SECURITY DEFINER since it queries
-- the RLS-enabled partners table from inside a policy helper context.
create or replace function public.is_partner_owner(pid text)
returns boolean
language sql
stable
security definer
set search_path = public
as $func$
  select exists (
    select 1
    from public.partners p
    where p.id = pid
      and (
        p.claimed_user_id = auth.uid()
        or public.is_admin()
      )
  );
$func$;


-- ============================================================
-- SECTION: 20260629000002_auto_create_partner_on_signup.sql
-- ============================================================

-- Fix: partner row creation during signup fails with 42501 when email confirmation
-- is enabled. In that case, supabase.auth.signUp() returns data.session = null,
-- so the Supabase client has no JWT when getOrCreatePartnerForSession() calls
-- upsertPartner(). The RLS INSERT policy checks claimed_user_id = auth.uid(), but
-- auth.uid() = null (no session) while claimed_user_id = userId -> check fails.
--
-- Solution: database trigger (SECURITY DEFINER) that auto-creates the partner row
-- immediately when an auth user is inserted, before any client code runs. This is
-- the Supabase-recommended pattern for creating profile rows on signup.
--
-- The trigger also handles admin-pre-created unclaimed partner rows (links them by
-- email) so sign-up with a matching email auto-claims without needing the client.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner_id text;
  v_email      text;
  v_name       text;
  v_meta       jsonb;
begin
  v_meta       := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_partner_id := 'partner_' || new.id::text;
  v_email      := lower(trim(coalesce(new.email, '')));
  v_name       := coalesce(
    nullif(trim(v_meta->>'name'), ''),
    nullif(trim(v_meta->>'full_name'), ''),
    nullif(v_email, ''),
    'Partner'
  );

  -- 1. If partner with this deterministic ID already exists, just claim it.
  if exists (select 1 from public.partners where id = v_partner_id) then
    update public.partners
       set claimed_user_id = new.id,
           updated_at      = now()
     where id = v_partner_id
       and claimed_user_id is null;
    return new;
  end if;

  -- 2. If an unclaimed partner with matching email already exists (admin pre-created),
  --    link it instead of creating a duplicate.
  if v_email <> '' and exists (
    select 1 from public.partners
     where (profile->>'email') = v_email
       and claimed_user_id is null
  ) then
    update public.partners
       set claimed_user_id = new.id,
           updated_at      = now()
     where (profile->>'email') = v_email
       and claimed_user_id is null;
    return new;
  end if;

  -- 3. Create a fresh partner row (SECURITY DEFINER bypasses RLS).
  insert into public.partners (
    id,
    tenant_id,
    status,
    profile,
    primary_route,
    lane,
    journey_stage,
    journey_signals,
    consents,
    routes,
    claimed_user_id,
    claimed_at,
    created_at,
    updated_at
  ) values (
    v_partner_id,
    coalesce(nullif(trim(v_meta->>'tenantId'), ''), 'tenant_finely_primary'),
    'active',
    jsonb_build_object(
      'fullName', v_name,
      'email',    v_email,
      'phone',    nullif(trim(v_meta->>'phone'), '')
    ),
    nullif(trim(v_meta->>'primaryRoute'), ''),
    nullif(trim(v_meta->>'lane'), ''),
    'intake',
    jsonb_build_object(
      'goal',          v_meta->>'goal',
      'accessApproved', true,
      'roleUnlocked',   true,
      'fractures',      v_meta->'fractures',
      'liabilityTier',  v_meta->>'liabilityTier',
      'urgency',        v_meta->>'urgency'
    ),
    coalesce(v_meta->'legalConsents', '{}'::jsonb),
    '{}'::jsonb,
    new.id,
    now(),
    now(),
    now()
  );

  return new;
end;
$$;

-- Drop and recreate the trigger (idempotent).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();


-- ============================================================
-- SECTION: 20260629000003_add_claimed_at_to_partners.sql
-- ============================================================

-- Fix: trigger handle_new_auth_user() references claimed_at in its INSERT but
-- the column was never added to public.partners — causing "Database error saving
-- new user" (code: unexpected_failure) on every new signup.
--
-- This migration:
--   1. Adds the missing claimed_at column.
--   2. Backfills it from created_at for existing claimed rows.
--   3. Recreates the trigger function with a top-level EXCEPTION block so any
--      future bug in the trigger cannot block auth.users insertion.

-- 1. Add missing column (idempotent).
alter table public.partners
  add column if not exists claimed_at timestamptz null;

-- 2. Backfill existing claimed rows.
update public.partners
   set claimed_at = created_at
 where claimed_user_id is not null
   and claimed_at is null;

-- 3. Recreate function — identical logic but wrapped in EXCEPTION so auth never
--    breaks if something else goes wrong in the trigger body.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner_id text;
  v_email      text;
  v_name       text;
  v_meta       jsonb;
begin
  v_meta       := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_partner_id := 'partner_' || new.id::text;
  v_email      := lower(trim(coalesce(new.email, '')));
  v_name       := coalesce(
    nullif(trim(v_meta->>'name'), ''),
    nullif(trim(v_meta->>'full_name'), ''),
    nullif(v_email, ''),
    'Partner'
  );

  -- 1. Partner with this deterministic ID already exists — just claim it.
  if exists (select 1 from public.partners where id = v_partner_id) then
    update public.partners
       set claimed_user_id = new.id,
           claimed_at      = coalesce(claimed_at, now()),
           updated_at      = now()
     where id = v_partner_id
       and claimed_user_id is null;
    return new;
  end if;

  -- 2. Unclaimed partner with matching email (admin pre-created) — link it.
  if v_email <> '' and exists (
    select 1 from public.partners
     where (profile->>'email') = v_email
       and claimed_user_id is null
  ) then
    update public.partners
       set claimed_user_id = new.id,
           claimed_at      = coalesce(claimed_at, now()),
           updated_at      = now()
     where (profile->>'email') = v_email
       and claimed_user_id is null;
    return new;
  end if;

  -- 3. Create a fresh partner row (SECURITY DEFINER bypasses RLS).
  insert into public.partners (
    id,
    tenant_id,
    status,
    profile,
    primary_route,
    lane,
    journey_stage,
    journey_signals,
    consents,
    routes,
    claimed_user_id,
    claimed_at,
    created_at,
    updated_at
  ) values (
    v_partner_id,
    coalesce(nullif(trim(v_meta->>'tenantId'), ''), 'tenant_finely_primary'),
    'active',
    jsonb_build_object(
      'fullName', v_name,
      'email',    v_email,
      'phone',    nullif(trim(v_meta->>'phone'), '')
    ),
    nullif(trim(v_meta->>'primaryRoute'), ''),
    nullif(trim(v_meta->>'lane'), ''),
    'intake',
    jsonb_build_object(
      'goal',           v_meta->>'goal',
      'accessApproved', true,
      'roleUnlocked',   true,
      'fractures',      v_meta->'fractures',
      'liabilityTier',  v_meta->>'liabilityTier',
      'urgency',        v_meta->>'urgency'
    ),
    coalesce(v_meta->'legalConsents', '{}'::jsonb),
    '{}'::jsonb,
    new.id,
    now(),
    now(),
    now()
  );

  return new;

exception when others then
  -- Log the error but never block the auth.users insert.
  raise warning 'handle_new_auth_user: failed for user % (email %): % %',
    new.id, new.email, sqlerrm, sqlstate;
  return new;
end;
$$;

-- Recreate trigger (idempotent).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();


-- ============================================================
-- SECTION: 202606300001_cmo_growth_os_phase2.sql
-- ============================================================

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


-- ============================================================
-- SECTION: 202606300002_cmo_phase3_autopilot.sql
-- ============================================================

-- Finely Cred CMO Phase 3 Autopilot tables
-- Apply only after reviewing RLS policies for your tenant/admin model.

create table if not exists public.cmo_autopilot_settings (
  id text primary key default 'default',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cmo_playbooks (
  id text primary key,
  status text not null default 'ready',
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cmo_autopilot_runs (
  id text primary key,
  run_type text not null,
  status text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- cmo_growth_events was already created by 202606300001_cmo_growth_os_phase2.sql with a
-- different column set. `create table if not exists` is a silent no-op once that table
-- exists, so re-declaring a conflicting schema here left this migration's columns
-- (event_type, payload) missing on the real table — breaking the index below with
-- "column event_type does not exist". Reconcile via ALTER instead.
create table if not exists public.cmo_growth_events (
  id text primary key,
  created_at timestamptz not null default now()
);
alter table public.cmo_growth_events
  add column if not exists event_type text,
  add column if not exists campaign_id text,
  add column if not exists prospect_id text,
  add column if not exists channel text,
  add column if not exists payload jsonb not null default '{}'::jsonb;

create table if not exists public.cmo_experiments (
  id text primary key,
  status text not null default 'draft',
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cmo_briefs (
  id text primary key,
  cadence text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists cmo_growth_events_type_idx on public.cmo_growth_events(event_type);
create index if not exists cmo_growth_events_campaign_idx on public.cmo_growth_events(campaign_id);
create index if not exists cmo_growth_events_channel_idx on public.cmo_growth_events(channel);

alter table public.cmo_autopilot_settings enable row level security;
alter table public.cmo_playbooks enable row level security;
alter table public.cmo_autopilot_runs enable row level security;
alter table public.cmo_growth_events enable row level security;
alter table public.cmo_experiments enable row level security;
alter table public.cmo_briefs enable row level security;

-- Replace with your real admin policy helper. This intentionally does not open data broadly.
-- Example:
-- create policy "Admins manage cmo phase3" on public.cmo_playbooks for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));


-- ============================================================
-- SECTION: 202606300003_cmo_phase4_accounts.sql
-- ============================================================

-- Finely Cred CMO Phase 4: managed accounts, publishing queue, health reports, webhooks.
-- Review RLS predicates against your existing admin/user model before applying in production.

create table if not exists public.cmo_managed_accounts (
  id text primary key,
  platform text not null,
  label text not null,
  handle text,
  public_url text,
  owner_type text not null default 'brand',
  status text not null default 'needs_auth',
  publish_mode text not null default 'manual_copy_paste',
  scopes jsonb not null default '[]'::jsonb,
  health_score numeric not null default 70,
  daily_lead_target integer default 0,
  daily_post_target integer default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cmo_publish_assets (
  id text primary key,
  campaign_id text,
  account_id text references public.cmo_managed_accounts(id) on delete set null,
  platform text not null,
  asset_type text not null,
  title text not null,
  caption text not null,
  cta text,
  link_url text,
  media_urls jsonb not null default '[]'::jsonb,
  hashtags jsonb not null default '[]'::jsonb,
  compliance_score numeric not null default 0,
  conversion_score numeric not null default 0,
  risk_level text not null default 'medium',
  risk_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cmo_publish_jobs (
  id text primary key,
  asset_id text references public.cmo_publish_assets(id) on delete cascade,
  campaign_id text,
  account_id text references public.cmo_managed_accounts(id) on delete set null,
  platform text not null,
  scheduled_for timestamptz,
  status text not null default 'needs_review',
  approval_required boolean not null default true,
  approved_by text,
  approved_at timestamptz,
  dispatched_at timestamptz,
  published_at timestamptz,
  provider_post_id text,
  provider_url text,
  failure_reason text,
  retry_count integer not null default 0,
  audit_trail jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cmo_account_health_reports (
  id text primary key,
  account_id text references public.cmo_managed_accounts(id) on delete cascade,
  platform text not null,
  health_score numeric not null,
  auth_healthy boolean not null default false,
  content_velocity_healthy boolean not null default false,
  engagement_healthy boolean not null default false,
  lead_path_healthy boolean not null default false,
  compliance_healthy boolean not null default false,
  warnings jsonb not null default '[]'::jsonb,
  recommended_actions jsonb not null default '[]'::jsonb,
  checked_at timestamptz not null default now()
);

create table if not exists public.cmo_webhook_events (
  id text primary key,
  provider text not null,
  account_id text,
  event_type text not null,
  external_id text,
  campaign_id text,
  payload_summary text not null,
  raw_payload jsonb,
  classified_intent text,
  lead_score numeric,
  created_at timestamptz not null default now()
);

alter table public.cmo_managed_accounts enable row level security;
alter table public.cmo_publish_assets enable row level security;
alter table public.cmo_publish_jobs enable row level security;
alter table public.cmo_account_health_reports enable row level security;
alter table public.cmo_webhook_events enable row level security;

-- Replace `true` with your real admin policy, e.g. auth.jwt() role checks.
do $$ begin
  create policy "cmo_phase4_admin_all_accounts" on public.cmo_managed_accounts for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cmo_phase4_admin_all_assets" on public.cmo_publish_assets for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cmo_phase4_admin_all_jobs" on public.cmo_publish_jobs for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cmo_phase4_admin_all_health" on public.cmo_account_health_reports for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cmo_phase4_admin_all_webhooks" on public.cmo_webhook_events for all using (true) with check (true);
exception when duplicate_object then null; end $$;


-- ============================================================
-- SECTION: 202606300004_cmo_phase5_scale.sql
-- ============================================================

-- Finely Cred CMO Phase 5: scale intelligence, forecasting, budgets, experiments, autonomy policy.
-- Review RLS predicates against your existing admin/user model before applying in production.

-- cmo_growth_events already created (and reconciled) by 202606300001/202606300002.
-- Re-declaring a conflicting schema here would be a silent no-op once the table
-- exists — reconcile via ALTER instead so occurred_at/asset_id/account_id/metadata
-- are actually present.
create table if not exists public.cmo_growth_events (
  id text primary key,
  created_at timestamptz not null default now()
);
alter table public.cmo_growth_events
  add column if not exists occurred_at timestamptz not null default now(),
  add column if not exists channel text,
  add column if not exists campaign_id text,
  add column if not exists asset_id text,
  add column if not exists account_id text,
  add column if not exists event_type text,
  add column if not exists value numeric,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.cmo_channel_models (
  channel text primary key,
  impressions integer not null default 0,
  clicks integer not null default 0,
  leads integer not null default 0,
  qualified_leads integer not null default 0,
  booked_calls integer not null default 0,
  sales integer not null default 0,
  revenue numeric not null default 0,
  cost numeric not null default 0,
  lead_rate numeric not null default 0,
  qualified_rate numeric not null default 0,
  booking_rate numeric not null default 0,
  close_rate numeric not null default 0,
  cost_per_lead numeric not null default 0,
  revenue_per_lead numeric not null default 0,
  confidence numeric not null default 0,
  decision text not null default 'test_more',
  reason text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.cmo_lead_forecasts (
  id text primary key,
  target_daily_leads integer not null default 200,
  projected_daily_leads integer not null default 0,
  projected_qualified_leads integer not null default 0,
  projected_booked_calls integer not null default 0,
  projected_revenue numeric not null default 0,
  required_actions jsonb not null default '[]'::jsonb,
  bottlenecks jsonb not null default '[]'::jsonb,
  confidence numeric not null default 0,
  generated_at timestamptz not null default now()
);

create table if not exists public.cmo_budget_allocations (
  id text primary key,
  total_daily_budget numeric not null default 0,
  allocations jsonb not null default '[]'::jsonb,
  guardrails jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now()
);

create table if not exists public.cmo_autonomy_policies (
  id text primary key,
  level text not null default 'internal_auto',
  policy jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.cmo_scale_experiments (
  id text primary key,
  campaign_id text,
  hypothesis text not null,
  channel text not null,
  variant_a text not null,
  variant_b text not null,
  metric text not null,
  min_sample_size integer not null default 50,
  status text not null default 'draft',
  winner text,
  notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cmo_growth_events enable row level security;
alter table public.cmo_channel_models enable row level security;
alter table public.cmo_lead_forecasts enable row level security;
alter table public.cmo_budget_allocations enable row level security;
alter table public.cmo_autonomy_policies enable row level security;
alter table public.cmo_scale_experiments enable row level security;

-- Replace `true` with your real admin policy, e.g. auth.jwt() role checks.
do $$ begin
  create policy "cmo_phase5_admin_all_events" on public.cmo_growth_events for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cmo_phase5_admin_all_models" on public.cmo_channel_models for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cmo_phase5_admin_all_forecasts" on public.cmo_lead_forecasts for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cmo_phase5_admin_all_budgets" on public.cmo_budget_allocations for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cmo_phase5_admin_all_policies" on public.cmo_autonomy_policies for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "cmo_phase5_admin_all_experiments" on public.cmo_scale_experiments for all using (true) with check (true);
exception when duplicate_object then null; end $$;


-- ============================================================
-- SECTION: 202607010050_overnight50.sql
-- ============================================================

create table if not exists public.lead_intel_jobs (
  id text primary key,
  source_id text not null,
  city text not null,
  query text not null,
  status text not null default 'queued',
  priority integer not null default 50,
  progress integer not null default 0,
  discovered integer not null default 0,
  enriched integer not null default 0,
  hot integer not null default 0,
  imported integer not null default 0,
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);
create table if not exists public.lead_intel_cache (cache_key text primary key, payload jsonb not null, expires_at timestamptz not null, created_at timestamptz not null default now());
create table if not exists public.lead_intel_live_feed (id text primary key, created_at timestamptz not null default now(), city text not null, source_id text not null, agent text not null, message text not null, severity text not null default 'info', counts jsonb not null default '{}'::jsonb);
create table if not exists public.geo_clusters (id text primary key, city text not null, state text, zips text[] not null default '{}', lat numeric, lng numeric, radius_miles numeric not null default 10, meta jsonb not null default '{}'::jsonb);
create table if not exists public.overnight_runs (id text primary key, city text, started_at timestamptz not null default now(), ended_at timestamptz, target_leads integer not null default 50, actual_leads integer not null default 0, status text not null default 'running', ledger jsonb not null default '{}'::jsonb);
create table if not exists public.overnight_lead_attribution (id text primary key, run_id text references public.overnight_runs(id) on delete cascade, source text not null, city text not null, leads integer not null default 0, cost_cents integer not null default 0, created_at timestamptz not null default now(), meta jsonb not null default '{}'::jsonb);
create table if not exists public.shift_logs (id text primary key, agent_id text not null, shift text not null, status text not null, message text not null, created_at timestamptz not null default now(), meta jsonb not null default '{}'::jsonb);
create table if not exists public.publish_queue (id text primary key, channel text not null, city text, payload jsonb not null, status text not null default 'queued', scheduled_for timestamptz not null default now(), approved boolean not null default false, risk_level text not null default 'medium', attempts integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.staff_shifts (id text primary key, agent_id text not null, city text, starts_at timestamptz, ends_at timestamptz, status text not null default 'scheduled', meta jsonb not null default '{}'::jsonb);
create table if not exists public.hook_performance (id text primary key, hook text not null, channel text not null, city text, impressions integer not null default 0, clicks integer not null default 0, leads integer not null default 0, created_at timestamptz not null default now());
create table if not exists public.seo_queue (id text primary key, city text not null, offer text not null, slug text not null, status text not null default 'draft', content jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create table if not exists public.budget_cells (id text primary key, city text not null, channel text not null, amount_cents integer not null, status text not null default 'draft', created_at timestamptz not null default now(), meta jsonb not null default '{}'::jsonb);
create table if not exists public.human_sessions (id text primary key, account_id text, channel text not null, status text not null default 'planned', notes text, created_at timestamptz not null default now(), meta jsonb not null default '{}'::jsonb);
create table if not exists public.account_warmup_state (id text primary key, account_id text not null, channel text not null, day integer not null default 1, status text not null default 'manual_review', created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create index if not exists idx_lead_intel_jobs_status_priority on public.lead_intel_jobs(status, priority desc, scheduled_for);
create index if not exists idx_publish_queue_due on public.publish_queue(status, scheduled_for);
create index if not exists idx_overnight_attr_run on public.overnight_lead_attribution(run_id);

alter table public.lead_intel_jobs enable row level security;
alter table public.lead_intel_cache enable row level security;
alter table public.lead_intel_live_feed enable row level security;
alter table public.geo_clusters enable row level security;
alter table public.overnight_runs enable row level security;
alter table public.overnight_lead_attribution enable row level security;
alter table public.shift_logs enable row level security;
alter table public.publish_queue enable row level security;
alter table public.staff_shifts enable row level security;
alter table public.hook_performance enable row level security;
alter table public.seo_queue enable row level security;
alter table public.budget_cells enable row level security;
alter table public.human_sessions enable row level security;
alter table public.account_warmup_state enable row level security;


-- ============================================================
-- SECTION: 202607010126_lead_engine_system_dev.sql
-- ============================================================

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


-- ============================================================
-- SECTION: 202607010214_human_staff_os.sql
-- ============================================================

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


-- ============================================================
-- SECTION: 202607010315_sovereign_growth_command_stack.sql
-- ============================================================

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


-- ============================================================
-- SECTION: 202607010515_studio_ux_command_os.sql
-- ============================================================

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


-- ============================================================
-- SECTION: 20260702093000_sitewide_ux_command_stack.sql
-- ============================================================

create table if not exists public.sitewide_ux_audit_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  page_count integer not null default 0,
  critical_count integer not null default 0,
  protected_count integer not null default 0,
  summary jsonb not null default '{}'::jsonb
);

create table if not exists public.sitewide_ux_page_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.sitewide_ux_audit_runs(id) on delete cascade,
  created_at timestamptz not null default now(),
  path text not null,
  route text,
  zone text not null,
  priority text not null,
  finding text not null,
  recommended_pattern text not null,
  protected boolean not null default false
);

create index if not exists sitewide_ux_page_findings_run_idx on public.sitewide_ux_page_findings(run_id);
create index if not exists sitewide_ux_page_findings_zone_idx on public.sitewide_ux_page_findings(zone);


-- ============================================================
-- SECTION: 20260702120000_comms_integration_hardening.sql
-- ============================================================

-- Phase 9 — Comms send log persistence + email provider webhooks + social poster_type

create table if not exists public.comms_send_logs (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  template_id text,
  channel text not null,
  partner_id text,
  to_address text,
  status text not null default 'sent',
  subject text,
  body_preview text,
  error_message text,
  meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_send_logs_created_idx
  on public.comms_send_logs (tenant_id, created_at desc);

create index if not exists comms_send_logs_partner_idx
  on public.comms_send_logs (tenant_id, partner_id, created_at desc);

create table if not exists public.email_webhook_events (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  provider text not null,
  event_type text not null,
  message_id text,
  recipient text,
  payload jsonb,
  received_at timestamptz not null default now()
);

create index if not exists email_webhook_events_received_idx
  on public.email_webhook_events (tenant_id, received_at desc);

alter table public.comms_send_logs enable row level security;
alter table public.email_webhook_events enable row level security;

drop policy if exists comms_send_logs_admin on public.comms_send_logs;
create policy comms_send_logs_admin on public.comms_send_logs
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists email_webhook_events_admin on public.email_webhook_events;
create policy email_webhook_events_admin on public.email_webhook_events
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Social Hub: disclosure poster type (AI vs human executive)
alter table public.social_scheduled_posts
  add column if not exists poster_type text;


-- ============================================================
-- SECTION: 202607071200_staff_platform_persistence.sql
-- ============================================================

-- Staff platform persistence — move staffing state off localStorage into Supabase.

alter table public.staff_members
  add column if not exists portrait_gender text not null default 'neutral';

alter table public.human_staff_missions
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.staff_platform_state (
  tenant_id text not null default 'finely_cred',
  state_key text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, state_key)
);

create index if not exists staff_platform_state_tenant_idx on public.staff_platform_state (tenant_id);

alter table public.staff_platform_state enable row level security;

drop policy if exists staff_platform_state_select on public.staff_platform_state;
create policy staff_platform_state_select on public.staff_platform_state
for select to authenticated
using (public.is_admin() or true);

drop policy if exists staff_platform_state_admin_write on public.staff_platform_state;
create policy staff_platform_state_admin_write on public.staff_platform_state
for all to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- SECTION: 202607210900_partner_claim_promotes_active.sql
-- ============================================================

-- On auth signup claim: promote lead → active, stamp claimed_at + authActivity.
-- Fixes admin partners list stuck on "Pending" after invitee finishes registration.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner_id text;
  v_email      text;
  v_name       text;
  v_meta       jsonb;
  v_invite_id  text;
  v_now        timestamptz := now();
  v_signals    jsonb;
begin
  v_meta       := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_partner_id := 'partner_' || new.id::text;
  v_email      := lower(trim(coalesce(new.email, '')));
  v_invite_id  := nullif(trim(coalesce(v_meta->>'partnerId', v_meta->>'partner_id', '')), '');
  v_name       := coalesce(
    nullif(trim(v_meta->>'name'), ''),
    nullif(trim(v_meta->>'full_name'), ''),
    nullif(v_email, ''),
    'Partner'
  );

  -- Prefer explicit invite partner id from signup metadata.
  if v_invite_id is not null and exists (select 1 from public.partners where id = v_invite_id) then
    update public.partners
       set claimed_user_id = new.id,
           claimed_at = coalesce(claimed_at, v_now),
           status = case when status = 'paused' then status else 'active' end,
           journey_signals = coalesce(journey_signals, '{}'::jsonb)
             || jsonb_build_object(
               'authActivity',
               coalesce(journey_signals->'authActivity', '{}'::jsonb)
                 || jsonb_build_object(
                   'accountClaimedAt', coalesce(journey_signals->'authActivity'->>'accountClaimedAt', v_now::text),
                   'signupCompletedAt', coalesce(journey_signals->'authActivity'->>'signupCompletedAt', v_now::text)
                 )
             ),
           updated_at = v_now
     where id = v_invite_id
       and (claimed_user_id is null or claimed_user_id = new.id);
    return new;
  end if;

  if exists (select 1 from public.partners where id = v_partner_id) then
    update public.partners
       set claimed_user_id = new.id,
           claimed_at = coalesce(claimed_at, v_now),
           status = case when status = 'paused' then status else 'active' end,
           journey_signals = coalesce(journey_signals, '{}'::jsonb)
             || jsonb_build_object(
               'authActivity',
               coalesce(journey_signals->'authActivity', '{}'::jsonb)
                 || jsonb_build_object(
                   'accountClaimedAt', coalesce(journey_signals->'authActivity'->>'accountClaimedAt', v_now::text),
                   'signupCompletedAt', coalesce(journey_signals->'authActivity'->>'signupCompletedAt', v_now::text)
                 )
             ),
           updated_at = v_now
     where id = v_partner_id
       and (claimed_user_id is null or claimed_user_id = new.id);
    return new;
  end if;

  -- Case-insensitive email match for admin pre-created invite partners.
  if v_email <> '' and exists (
    select 1 from public.partners
     where lower(trim(coalesce(profile->>'email', ''))) = v_email
       and claimed_user_id is null
  ) then
    update public.partners
       set claimed_user_id = new.id,
           claimed_at = coalesce(claimed_at, v_now),
           status = case when status = 'paused' then status else 'active' end,
           journey_signals = coalesce(journey_signals, '{}'::jsonb)
             || jsonb_build_object(
               'authActivity',
               coalesce(journey_signals->'authActivity', '{}'::jsonb)
                 || jsonb_build_object(
                   'accountClaimedAt', coalesce(journey_signals->'authActivity'->>'accountClaimedAt', v_now::text),
                   'signupCompletedAt', coalesce(journey_signals->'authActivity'->>'signupCompletedAt', v_now::text)
                 )
             ),
           updated_at = v_now
     where lower(trim(coalesce(profile->>'email', ''))) = v_email
       and claimed_user_id is null;
    return new;
  end if;

  v_signals := jsonb_build_object(
    'goal', v_meta->>'goal',
    'accessApproved', true,
    'roleUnlocked', true,
    'fractures', v_meta->'fractures',
    'liabilityTier', v_meta->>'liabilityTier',
    'urgency', v_meta->>'urgency',
    'authActivity', jsonb_build_object(
      'accountClaimedAt', v_now::text,
      'signupCompletedAt', v_now::text
    )
  );

  insert into public.partners (
    id,
    tenant_id,
    status,
    profile,
    primary_route,
    lane,
    journey_stage,
    journey_signals,
    consents,
    routes,
    claimed_user_id,
    claimed_at,
    created_at,
    updated_at
  ) values (
    v_partner_id,
    coalesce(nullif(trim(v_meta->>'tenantId'), ''), 'tenant_finely_primary'),
    'active',
    jsonb_build_object(
      'fullName', v_name,
      'email', v_email,
      'phone', nullif(trim(v_meta->>'phone'), '')
    ),
    nullif(trim(v_meta->>'primaryRoute'), ''),
    nullif(trim(v_meta->>'lane'), ''),
    'intake',
    v_signals,
    coalesce(v_meta->'legalConsents', '{}'::jsonb),
    '{}'::jsonb,
    new.id,
    v_now,
    v_now,
    v_now
  );

  return new;
end;
$$;


-- ============================================================
-- SECTION: 202607240001_entitlements_admin_write.sql
-- ============================================================

-- Allow platform admins to grant/revoke partner entitlements from the app
-- (stripe-webhook already upserts via service role; client grants were local-only).

drop policy if exists entitlements_admin_write on public.entitlements;
create policy entitlements_admin_write on public.entitlements
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Partners can still only read their own rows (existing entitlements_select_own).

