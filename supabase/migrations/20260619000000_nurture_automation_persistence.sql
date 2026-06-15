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
