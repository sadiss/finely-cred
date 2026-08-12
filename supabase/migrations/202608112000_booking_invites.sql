-- Booking self-schedule invites (Phase 3 — local-first mirror; optional server sync)
create table if not exists public.booking_invites (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  token text not null unique,
  label text,
  topic text not null default 'enlightenment',
  duration_minutes int not null default 30,
  crm_record_id text,
  lead_id text,
  partner_id text,
  guest_name text,
  guest_email text,
  guest_phone text,
  expires_at timestamptz,
  max_uses int not null default 1,
  use_count int not null default 0,
  status text not null default 'active',
  last_event_id text,
  last_used_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_invites_token_idx on public.booking_invites (token);
create index if not exists booking_invites_status_idx on public.booking_invites (tenant_id, status, created_at desc);

alter table public.booking_invites enable row level security;

drop policy if exists booking_invites_admin on public.booking_invites;
create policy booking_invites_admin on public.booking_invites
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists booking_invites_public_read on public.booking_invites;
create policy booking_invites_public_read on public.booking_invites
for select to anon, authenticated
using (status = 'active');
