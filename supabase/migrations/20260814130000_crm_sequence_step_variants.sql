-- G3 — real A/B variant-testing primitive for the CRM sequence send path
-- (src/features/crm/sequences/runCrmSequenceEngine.ts client engine +
-- supabase/functions/_shared/processDueCrmSequenceSteps.ts server engine,
-- Phase F2's cron-side port). Additive-only:
--
-- - crm_sequences.steps is already jsonb (20260814110000_crm_sequences_server.sql)
--   so a step's new optional `variants: { variant_a: { emailSubject, emailBody } }`
--   field needs no schema change — old rows without it are unaffected.
-- - crm_sequence_enrollments gets two new nullable columns: which variant
--   ('control' | 'variant_a') this enrollment was deterministically assigned
--   to (assigned via a hash of the enrollment id — see
--   assignCrmSequenceVariantForSeed in src/domain/crmSequences.ts, duplicated
--   verbatim in the edge function so both engines always agree), and the CRM
--   stage the record was in at enroll time (the baseline for the "did it
--   advance within N days" outcome proxy the results view uses).
alter table public.crm_sequence_enrollments
  add column if not exists assigned_variant text,
  add column if not exists stage_at_enrollment text;
