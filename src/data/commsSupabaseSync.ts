/** Supabase sync for Comms Studio send logs (multi-admin parity + webhook correlation). */
import type { CommsSendLog } from '../domain/comms';
import { listCommsSends, mergeCommsSends } from './commsRepo';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { FINELY_TENANT_ID } from '../domain/tenants';

function rowFromSend(log: CommsSendLog, tenantId: string) {
  return {
    id: log.id,
    tenant_id: tenantId,
    template_id: log.templateId ?? null,
    channel: log.channel,
    partner_id: log.partnerId ?? null,
    to_address: log.to ?? null,
    status: log.status,
    subject: log.subject ?? null,
    body_preview: log.body ? log.body.slice(0, 500) : null,
    error_message: log.error ?? null,
    meta: log.meta ?? null,
    created_at: log.createdAt,
    updated_at: log.createdAt,
  };
}

function sendFromRow(row: Record<string, unknown>): CommsSendLog {
  return {
    id: String(row.id),
    templateId: row.template_id ? String(row.template_id) : undefined,
    channel: String(row.channel ?? 'portal') as CommsSendLog['channel'],
    partnerId: row.partner_id ? String(row.partner_id) : undefined,
    to: row.to_address ? String(row.to_address) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    status: String(row.status ?? 'sent') as CommsSendLog['status'],
    subject: row.subject ? String(row.subject) : undefined,
    body: row.body_preview ? String(row.body_preview) : undefined,
    error: row.error_message ? String(row.error_message) : undefined,
    meta: row.meta && typeof row.meta === 'object' ? (row.meta as Record<string, unknown>) : undefined,
  };
}

export async function syncCommsSendToSupabase(log: CommsSendLog) {
  if (!isSupabaseConfigured) return { ok: false as const, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('comms_send_logs').upsert(rowFromSend(log, FINELY_TENANT_ID), { onConflict: 'id' });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  } catch (err: unknown) {
    return { ok: false as const, error: (err as Error)?.message ?? String(err) };
  }
}

export async function syncAllCommsSendsToSupabase(sends?: CommsSendLog[]) {
  const rows = sends ?? listCommsSends(500);
  if (!rows.length) return { ok: true as const, count: 0 };
  if (!isSupabaseConfigured) return { ok: false as const, count: 0, error: 'Supabase not configured' };
  try {
    const payload = rows.map((s) => rowFromSend(s, FINELY_TENANT_ID));
    const { error } = await supabase.from('comms_send_logs').upsert(payload, { onConflict: 'id' });
    if (error) return { ok: false as const, count: 0, error: error.message };
    return { ok: true as const, count: rows.length };
  } catch (err: unknown) {
    return { ok: false as const, count: 0, error: (err as Error)?.message ?? String(err) };
  }
}

export async function syncCommsSendsFromSupabase(): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, count: 0, error: 'Supabase not configured' };
  try {
    const { data, error } = await supabase
      .from('comms_send_logs')
      .select('*')
      .eq('tenant_id', FINELY_TENANT_ID)
      .order('created_at', { ascending: false })
      .limit(800);
    if (error) return { ok: false, count: 0, error: error.message };
    const remote = (data ?? []).map((r) => sendFromRow(r as Record<string, unknown>));
    if (remote.length === 0) return { ok: true, count: 0 };
    mergeCommsSends(remote);
    return { ok: true, count: remote.length };
  } catch (err: unknown) {
    return { ok: false, count: 0, error: (err as Error)?.message ?? String(err) };
  }
}

export async function ensureCommsSyncedOnce() {
  if (!isSupabaseConfigured) return;

  const remote = await syncCommsSendsFromSupabase();
  if (remote.ok && remote.count > 0) return;

  const local = listCommsSends(500);
  if (remote.ok && remote.count === 0 && local.length > 0) {
    await syncAllCommsSendsToSupabase(local);
  }
}
