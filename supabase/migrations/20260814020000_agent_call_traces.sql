-- Phase H2 — structured, replayable per-agent-LLM-call trace records.
-- Best-effort dual-write only (see src/data/agentCallTraceRepo.ts):
-- localStorage stays the source of truth on the client if these calls fail.
-- Internal ops/audit data only — no partner-facing read path, same
-- data-sensitivity class as the existing agent_audit_events data.

create table if not exists public.agent_call_traces (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  agent_id text not null,
  task_type text not null,
  provider text,
  model text,
  prompt_tokens_est integer,
  completion_tokens_est integer,
  latency_ms integer not null default 0,
  cost_usd_est numeric,
  input text not null default '',
  output text not null default '',
  linked_entity_type text,
  linked_entity_id text,
  outcome_at_capture text,
  created_at timestamptz not null default now()
);

create index if not exists agent_call_traces_tenant_agent_idx
  on public.agent_call_traces (tenant_id, agent_id, created_at desc);
create index if not exists agent_call_traces_tenant_created_idx
  on public.agent_call_traces (tenant_id, created_at desc);

alter table public.agent_call_traces enable row level security;

drop policy if exists agent_call_traces_admin on public.agent_call_traces;
create policy agent_call_traces_admin on public.agent_call_traces
for all to authenticated
using (public.is_admin())
with check (public.is_admin());
