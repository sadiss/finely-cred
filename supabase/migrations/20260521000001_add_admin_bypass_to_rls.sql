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
