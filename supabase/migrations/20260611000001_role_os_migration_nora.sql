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
