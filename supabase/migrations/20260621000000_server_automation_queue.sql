-- Server automation queue — create_task / run_workflow from DB rules (Part AS)
create table if not exists public.server_automation_queue (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  rule_id text not null,
  action_type text not null default 'execute_rule',
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists server_automation_queue_pending_idx
  on public.server_automation_queue (tenant_id, status, created_at);

alter table public.server_automation_queue enable row level security;

drop policy if exists server_automation_queue_admin on public.server_automation_queue;
create policy server_automation_queue_admin on public.server_automation_queue
for all to authenticated
using (public.is_admin())
with check (public.is_admin());
