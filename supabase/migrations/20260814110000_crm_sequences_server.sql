-- Phase F2 — Port the CRM sequence engine (src/features/crm/sequences/runCrmSequenceEngine.ts)
-- to platform-cron. Confirmed before this migration: src/data/crmSequencesRepo.ts
-- (sequences + enrollments) was 100% localStorage, so a due wait/email/task/
-- stage_move step only advanced when an admin had a CRM page open. These two
-- tables give platform-cron's new processDueCrmSequenceSteps.ts a durable,
-- server-readable cadence state.
create table if not exists public.crm_sequences (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  name text not null,
  target text not null,
  enabled boolean not null default true,
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_sequences_tenant_enabled_idx
  on public.crm_sequences (tenant_id, enabled, updated_at desc);

-- record_id is NOT a hard FK to crm_records: crmServerSync.ts's sync is
-- best-effort, so a hard FK could cause silent enrollment-sync failures if a
-- record hasn't synced yet when its enrollment does.
create table if not exists public.crm_sequence_enrollments (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  sequence_id text not null references public.crm_sequences(id) on delete cascade,
  record_id text not null,
  enrolled_at timestamptz not null,
  updated_at timestamptz not null default now(),
  last_completed_step_index integer not null default -1,
  completed_at timestamptz,
  paused_at timestamptz
);

create index if not exists crm_sequence_enrollments_due_idx
  on public.crm_sequence_enrollments (tenant_id, completed_at, paused_at);
create index if not exists crm_sequence_enrollments_record_idx
  on public.crm_sequence_enrollments (tenant_id, record_id);

-- Phase F2 server-side equivalent of the client's FREQUENCY_KEY localStorage
-- log (commsSuppressionRepo.ts's isOverFrequencyCap/recordSendForFrequencyCap).
-- Shared by processDueCrmSequenceSteps.ts, the processDueNurtureEnrollments.ts
-- reconciliation fix, and F3's dunning/win-back one-time-per-threshold sends.
create table if not exists public.comms_frequency_log (
  id bigserial primary key,
  tenant_id text not null default 'finely_cred',
  recipient_key text not null,
  sent_at timestamptz not null default now()
);

create index if not exists comms_frequency_log_lookup_idx
  on public.comms_frequency_log (tenant_id, recipient_key, sent_at desc);

alter table public.crm_sequences enable row level security;
alter table public.crm_sequence_enrollments enable row level security;
alter table public.comms_frequency_log enable row level security;

-- Internal ops data — no partner-select policy needed (unlike calendar_events).
drop policy if exists crm_sequences_admin on public.crm_sequences;
create policy crm_sequences_admin on public.crm_sequences
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists crm_sequence_enrollments_admin on public.crm_sequence_enrollments;
create policy crm_sequence_enrollments_admin on public.crm_sequence_enrollments
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists comms_frequency_log_admin on public.comms_frequency_log;
create policy comms_frequency_log_admin on public.comms_frequency_log
for all to authenticated
using (public.is_admin())
with check (public.is_admin());
