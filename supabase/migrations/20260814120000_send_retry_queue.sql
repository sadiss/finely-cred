-- Phase F5 — Retry queue for failed sequence/nurture/reminder/billing sends.
--
-- Confirmed before this migration: every server-side send processor
-- (processDueMeetingReminders.ts, processDueNoShowRecovery.ts,
-- processDueCrmSequenceSteps.ts, processDueBillingDunning.ts,
-- processDueWinBack.ts, processDueNurtureEnrollments.ts) logs a failed
-- provider send (network error, provider rejection, etc.) into its own
-- result.errors array and drops it — no automatic retry exists anywhere.
-- This table gives _shared/sendRetryQueue.ts's enqueueRetry()/
-- processDueRetries() durable, server-readable state to retry those sends
-- with exponential backoff instead of losing them outright.
--
-- Tenant id uses the literal 'finely_cred' — matching crm_prospects/
-- crm_records/comms_suppression/comms_frequency_log/nurture_enrollments and
-- every other table the same processors already read/write (see
-- crmServerSync.ts's header comment for this codebase's pre-existing
-- dual-tenant-id convention).
create table if not exists public.send_retry_queue (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  channel text not null check (channel in ('email', 'sms')),
  to_email text,
  to_phone text,
  to_name text,
  subject text,
  body text not null,
  html text,
  source_processor text not null check (
    source_processor in (
      'meeting_reminders',
      'no_show_recovery',
      'crm_sequences',
      'billing_dunning',
      'win_back',
      'nurture'
    )
  ),
  reference_id text,
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  next_retry_at timestamptz not null default now(),
  last_error text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);

-- Due-scan index for processDueRetries(); admin-panel pending-count index.
create index if not exists send_retry_queue_due_idx
  on public.send_retry_queue (tenant_id, status, next_retry_at);
create index if not exists send_retry_queue_source_idx
  on public.send_retry_queue (tenant_id, source_processor, status);

alter table public.send_retry_queue enable row level security;

-- Internal ops data — no partner-select policy needed (same as
-- crm_sequences/crm_sequence_enrollments/comms_frequency_log).
drop policy if exists send_retry_queue_admin on public.send_retry_queue;
create policy send_retry_queue_admin on public.send_retry_queue
for all to authenticated
using (public.is_admin())
with check (public.is_admin());
