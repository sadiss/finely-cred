/** Email provider webhook events (Resend / SendGrid / SES) — local cache + Supabase mirror. */
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { FINELY_TENANT_ID } from '../domain/tenants';

export type EmailWebhookProvider = 'resend' | 'sendgrid' | 'ses' | 'unknown';

export type EmailWebhookEvent = {
  id: string;
  provider: EmailWebhookProvider;
  eventType: string;
  messageId?: string;
  recipient?: string;
  payload?: Record<string, unknown>;
  receivedAt: string;
};

const KEY = 'finely.emailWebhooks.v1';
const MAX_LOCAL = 400;

type Store = { events: EmailWebhookEvent[] };

function load(): Store {
  return loadJson(KEY, { events: [] }, 1);
}

function save(store: Store) {
  store.events = store.events.slice(0, MAX_LOCAL);
  saveJson(KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function listEmailWebhookEvents(limit = 80): EmailWebhookEvent[] {
  return load().events.slice(0, Math.max(1, limit));
}

export function ingestEmailWebhookEvent(args: {
  provider: EmailWebhookProvider;
  eventType: string;
  messageId?: string;
  recipient?: string;
  payload?: Record<string, unknown>;
}): EmailWebhookEvent {
  const event: EmailWebhookEvent = {
    id: newId('ewh'),
    provider: args.provider,
    eventType: args.eventType,
    messageId: args.messageId,
    recipient: args.recipient,
    payload: args.payload,
    receivedAt: new Date().toISOString(),
  };
  const store = load();
  store.events.unshift(event);
  save(store);
  void syncEmailWebhookEventToSupabase(event);
  return event;
}

function rowFromEvent(ev: EmailWebhookEvent, tenantId: string) {
  return {
    id: ev.id,
    tenant_id: tenantId,
    provider: ev.provider,
    event_type: ev.eventType,
    message_id: ev.messageId ?? null,
    recipient: ev.recipient ?? null,
    payload: ev.payload ?? null,
    received_at: ev.receivedAt,
  };
}

function eventFromRow(row: Record<string, unknown>): EmailWebhookEvent {
  return {
    id: String(row.id),
    provider: String(row.provider ?? 'unknown') as EmailWebhookProvider,
    eventType: String(row.event_type ?? row.eventType ?? 'unknown'),
    messageId: row.message_id ? String(row.message_id) : undefined,
    recipient: row.recipient ? String(row.recipient) : undefined,
    payload: row.payload && typeof row.payload === 'object' ? (row.payload as Record<string, unknown>) : undefined,
    receivedAt: String(row.received_at ?? new Date().toISOString()),
  };
}

export async function syncEmailWebhookEventToSupabase(ev: EmailWebhookEvent) {
  if (!isSupabaseConfigured) return { ok: false as const, error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('email_webhook_events').upsert(rowFromEvent(ev, FINELY_TENANT_ID), { onConflict: 'id' });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  } catch (err: unknown) {
    return { ok: false as const, error: (err as Error)?.message ?? String(err) };
  }
}

export async function syncEmailWebhooksFromSupabase(): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, count: 0, error: 'Supabase not configured' };
  try {
    const { data, error } = await supabase
      .from('email_webhook_events')
      .select('*')
      .eq('tenant_id', FINELY_TENANT_ID)
      .order('received_at', { ascending: false })
      .limit(200);
    if (error) return { ok: false, count: 0, error: error.message };
    if (!data?.length) return { ok: true, count: 0 };
    const store = load();
    const byId = new Map(store.events.map((e) => [e.id, e]));
    for (const row of data) {
      const ev = eventFromRow(row as Record<string, unknown>);
      byId.set(ev.id, ev);
    }
    store.events = Array.from(byId.values()).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)).slice(0, MAX_LOCAL);
    save(store);
    return { ok: true, count: data.length };
  } catch (err: unknown) {
    return { ok: false, count: 0, error: (err as Error)?.message ?? String(err) };
  }
}
