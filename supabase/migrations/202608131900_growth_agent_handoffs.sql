-- Growth agent handoff ledger — explicit, attributable, verifiable agent-to-agent
-- transitions (Phase 3). Replaces "two agents happen to read the same localStorage
-- key" with a real timestamped, queryable record of who handed what to whom, why,
-- and whether it was acknowledged/completed.
create table if not exists public.growth_agent_handoffs (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  from_agent_id text not null,
  to_agent_id text not null,
  entity_type text not null default 'crm_record',
  entity_id text,
  action text not null,
  status text not null default 'pending', -- pending | acked | completed | stalled
  reasoning text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  acked_at timestamptz,
  completed_at timestamptz
);

create index if not exists growth_agent_handoffs_recent_idx
  on public.growth_agent_handoffs (tenant_id, created_at desc);
create index if not exists growth_agent_handoffs_entity_idx
  on public.growth_agent_handoffs (entity_type, entity_id, created_at desc);
create index if not exists growth_agent_handoffs_status_idx
  on public.growth_agent_handoffs (tenant_id, status, created_at desc);

alter table public.growth_agent_handoffs enable row level security;

drop policy if exists growth_agent_handoffs_admin on public.growth_agent_handoffs;
create policy growth_agent_handoffs_admin on public.growth_agent_handoffs
for all to authenticated
using (public.is_admin())
with check (public.is_admin());
