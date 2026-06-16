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
