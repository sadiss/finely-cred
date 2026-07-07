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
