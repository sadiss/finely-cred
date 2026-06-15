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
