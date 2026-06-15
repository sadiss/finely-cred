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
