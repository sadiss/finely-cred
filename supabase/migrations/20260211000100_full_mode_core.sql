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

