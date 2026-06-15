/** Supabase sync for nurture enrollments (server cron persistence). */
import type { NurtureEnrollment } from '../lib/nurtureEngine';
import { listNurtureEnrollments, mergeNurtureEnrollmentsFromRemote } from '../lib/nurtureEngine';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { FINELY_TENANT_ID } from '../domain/tenants';

function rowFromEnrollment(e: NurtureEnrollment) {
  return {
    id: e.id,
    tenant_id: e.tenantId || FINELY_TENANT_ID,
    sequence_id: e.sequenceId,
    lead_id: e.leadId,
    started_at: e.startedAt,
    next_step_index: e.nextStepIndex,
    next_run_at: e.nextRunAt,
    status: e.status,
    context: e.context ?? {},
    updated_at: e.updatedAt ?? e.startedAt,
  };
}

function enrollmentFromRow(row: Record<string, unknown>): NurtureEnrollment {
  return {
    id: String(row.id),
    sequenceId: String(row.sequence_id),
    leadId: String(row.lead_id),
    tenantId: String(row.tenant_id ?? FINELY_TENANT_ID),
    startedAt: String(row.started_at),
    nextStepIndex: Number(row.next_step_index ?? 0),
    nextRunAt: String(row.next_run_at),
    status: String(row.status ?? 'active') as NurtureEnrollment['status'],
    context: (row.context as Record<string, unknown>) ?? {},
    updatedAt: String(row.updated_at ?? row.started_at),
  };
}

export async function syncNurtureEnrollmentToSupabase(enrollment: NurtureEnrollment) {
  if (!isSupabaseConfigured) return { ok: false as const, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('nurture_enrollments').upsert(rowFromEnrollment(enrollment), { onConflict: 'id' });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  } catch (err: unknown) {
    return { ok: false as const, error: (err as Error)?.message ?? String(err) };
  }
}

export async function syncAllNurtureEnrollmentsToSupabase(enrollments?: NurtureEnrollment[]) {
  const rows = enrollments ?? listNurtureEnrollments(500);
  if (!rows.length) return { ok: true as const, count: 0 };
  if (!isSupabaseConfigured) return { ok: false as const, count: 0, error: 'Supabase not configured' };
  try {
    const payload = rows.map(rowFromEnrollment);
    const { error } = await supabase.from('nurture_enrollments').upsert(payload, { onConflict: 'id' });
    if (error) return { ok: false as const, count: 0, error: error.message };
    return { ok: true as const, count: rows.length };
  } catch (err: unknown) {
    return { ok: false as const, count: 0, error: (err as Error)?.message ?? String(err) };
  }
}

export async function syncNurtureEnrollmentsFromSupabase(): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, count: 0, error: 'Supabase not configured' };
  try {
    const { data, error } = await supabase
      .from('nurture_enrollments')
      .select('*')
      .eq('tenant_id', FINELY_TENANT_ID)
      .order('started_at', { ascending: false })
      .limit(500);
    if (error) return { ok: false, count: 0, error: error.message };
    const remote = (data ?? []).map((r) => enrollmentFromRow(r as Record<string, unknown>));
    if (remote.length === 0) return { ok: true, count: 0 };
    mergeNurtureEnrollmentsFromRemote(remote);
    return { ok: true, count: remote.length };
  } catch (err: unknown) {
    return { ok: false, count: 0, error: (err as Error)?.message ?? String(err) };
  }
}

export async function refreshNurtureEnrollmentsFromSupabase() {
  return syncNurtureEnrollmentsFromSupabase();
}
