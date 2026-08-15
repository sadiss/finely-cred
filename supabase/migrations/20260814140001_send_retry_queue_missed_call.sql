-- Phase J3 — missed-call text-back. Adds 'missed_call_textback' to
-- send_retry_queue.source_processor's allowed values so a failed
-- text-back SMS (see _shared/missedCallTextBack.ts) can be retried by the
-- same processDueRetries() sweep as every other send processor, instead of
-- silently dropping on provider failure.
alter table public.send_retry_queue drop constraint if exists send_retry_queue_source_processor_check;

alter table public.send_retry_queue add constraint send_retry_queue_source_processor_check
  check (
    source_processor in (
      'meeting_reminders',
      'no_show_recovery',
      'crm_sequences',
      'billing_dunning',
      'win_back',
      'nurture',
      'missed_call_textback'
    )
  );
