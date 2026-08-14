/**
 * Supabase dual-write sync for CRM sequences + enrollments (Phase F2 — real
 * server-side execution of the CRM sequence engine). Follows crmServerSync.ts's
 * exact pattern: every local crmSequencesRepo.ts write is mirrored best-effort
 * to Supabase; if the call fails or Supabase isn't configured, the local write
 * already succeeded and nothing throws.
 *
 * Tenant id uses the literal 'finely_cred', matching crm_prospects/crm_records/
 * comms_suppression/calendar_events/nurture_enrollments and the platform-cron
 * edge function that reads these tables server-side.
 */
import type { CrmSequence, CrmSequenceEnrollment } from '../domain/crmSequences';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const SERVER_TENANT_ID = 'finely_cred';
const BACKFILL_FLAG_KEY = 'finely.crmSequencesServerSync.backfilledV1';

function rowFromSequence(seq: CrmSequence) {
  return {
    id: seq.id,
    tenant_id: SERVER_TENANT_ID,
    name: seq.name,
    target: seq.target,
    enabled: seq.enabled,
    steps: seq.steps ?? [],
    created_at: seq.createdAt,
    updated_at: seq.updatedAt,
  };
}

function rowFromEnrollment(en: CrmSequenceEnrollment) {
  return {
    id: en.id,
    tenant_id: SERVER_TENANT_ID,
    sequence_id: en.sequenceId,
    record_id: en.recordId,
    enrolled_at: en.enrolledAt,
    updated_at: en.updatedAt,
    last_completed_step_index: en.lastCompletedStepIndex,
    completed_at: en.completedAt ?? null,
    paused_at: en.pausedAt ?? null,
    assigned_variant: en.assignedVariant ?? null,
    stage_at_enrollment: en.stageAtEnrollment ?? null,
  };
}

/** Best-effort — call after every local sequence create/update. Never throws. */
export async function syncCrmSequenceToSupabase(sequence: CrmSequence | null): Promise<{ ok: boolean; error?: string }> {
  if (!sequence) return { ok: false, error: 'No sequence' };
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('crm_sequences').upsert(rowFromSequence(sequence), { onConflict: 'id' });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error)?.message ?? String(err) };
  }
}

/** Best-effort — call after every local enrollment create/pause/advance/complete. Never throws. */
export async function syncCrmSequenceEnrollmentToSupabase(enrollment: CrmSequenceEnrollment | null): Promise<{ ok: boolean; error?: string }> {
  if (!enrollment) return { ok: false, error: 'No enrollment' };
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('crm_sequence_enrollments').upsert(rowFromEnrollment(enrollment), { onConflict: 'id' });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error)?.message ?? String(err) };
  }
}

export async function syncAllCrmSequencesToSupabase(sequences: CrmSequence[]): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!sequences.length) return { ok: true, count: 0 };
  if (!isSupabaseConfigured) return { ok: false, count: 0, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('crm_sequences').upsert(sequences.map(rowFromSequence), { onConflict: 'id' });
    if (error) return { ok: false, count: 0, error: error.message };
    return { ok: true, count: sequences.length };
  } catch (err: unknown) {
    return { ok: false, count: 0, error: (err as Error)?.message ?? String(err) };
  }
}

export async function syncAllCrmSequenceEnrollmentsToSupabase(
  enrollments: CrmSequenceEnrollment[],
): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!enrollments.length) return { ok: true, count: 0 };
  if (!isSupabaseConfigured) return { ok: false, count: 0, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('crm_sequence_enrollments').upsert(enrollments.map(rowFromEnrollment), { onConflict: 'id' });
    if (error) return { ok: false, count: 0, error: error.message };
    return { ok: true, count: enrollments.length };
  } catch (err: unknown) {
    return { ok: false, count: 0, error: (err as Error)?.message ?? String(err) };
  }
}

/**
 * One-time data migration: pushes every existing local sequence + enrollment
 * up to Supabase. Safe to call multiple times (idempotent upsert), guarded by
 * runCrmSequencesServerBackfillOnce() below.
 */
export async function backfillCrmSequencesToSupabase(): Promise<{
  ok: boolean;
  sequences: { ok: boolean; count: number; error?: string };
  enrollments: { ok: boolean; count: number; error?: string };
}> {
  // Lazy import avoids a circular import: crmSequencesRepo.ts imports this
  // module to sync on write, so a static top-level import here would cycle.
  const { listCrmSequences, listCrmSequenceEnrollments } = await import('./crmSequencesRepo');
  const sequences = await syncAllCrmSequencesToSupabase(listCrmSequences());
  const enrollments = await syncAllCrmSequenceEnrollmentsToSupabase(listCrmSequenceEnrollments());
  return { ok: sequences.ok && enrollments.ok, sequences, enrollments };
}

/** Guarded one-time backfill — call from an admin entry point (e.g. CRM sequences page mount). */
export async function runCrmSequencesServerBackfillOnce(): Promise<
  { ran: false; reason: string } | ({ ran: true } & Awaited<ReturnType<typeof backfillCrmSequencesToSupabase>>)
> {
  if (typeof window === 'undefined') return { ran: false, reason: 'no window' };
  if (!isSupabaseConfigured) return { ran: false, reason: 'Supabase not configured' };
  try {
    if (window.localStorage.getItem(BACKFILL_FLAG_KEY) === '1') {
      return { ran: false, reason: 'Already migrated' };
    }
  } catch {
    // localStorage unavailable — fall through and attempt anyway
  }
  const result = await backfillCrmSequencesToSupabase();
  if (result.ok) {
    try {
      window.localStorage.setItem(BACKFILL_FLAG_KEY, '1');
    } catch {
      // ignore — worst case we retry the backfill next load
    }
  }
  return { ran: true, ...result };
}

export function isCrmSequencesServerBackfillDone(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(BACKFILL_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}
