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
