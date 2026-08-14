/**
 * One unified do-not-contact / suppression list — checked by every outbound send
 * (nurture, CRM sequences, growth-agent outreach, cadence engine) regardless of
 * which subsystem originated the message. Prevents the "two agents message the
 * same lead the same day" and "contact someone who opted out" failure modes.
 *
 * Sources merged at read time:
 *  - manual suppressions added here (explicit DNC, SMS STOP, email unsubscribe)
 *  - lead_captures consent flags (existing marketingUnsubscribe.ts path)
 */
import { loadJson, saveJson } from './localJsonStore';
import { listLeadCaptures } from './leadsRepo';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const KEY = 'finely.comms_suppression.v1';
/** Matches the literal tenant_id used by automation-runner/platform-cron/meta-webhook edge
 * functions (not the FINELY_TENANT_ID app constant) so this table is a genuine shared source
 * of truth between the client and server dispatch path — see crmServerSync.ts for context. */
const SERVER_TENANT_ID = 'finely_cred';

export type SuppressionChannel = 'email' | 'sms' | 'all';
export type SuppressionReason = 'unsubscribe' | 'sms_stop' | 'manual_dnc' | 'bounce' | 'complaint';

export type SuppressionEntry = {
  id: string;
  /** Normalized lowercase email, or E.164-ish phone digits — whichever was suppressed. */
  email?: string;
  phone?: string;
  channel: SuppressionChannel;
  reason: SuppressionReason;
  note?: string;
  createdAt: string;
};

type Store = { entries: SuppressionEntry[] };

function normalizeEmail(email?: string): string | undefined {
  const v = (email || '').trim().toLowerCase();
  return v && v.includes('@') ? v : undefined;
}

function normalizePhone(phone?: string): string | undefined {
  const digits = (phone || '').replace(/[^\d]/g, '');
  return digits.length >= 7 ? digits.slice(-10) : undefined;
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { entries: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function dispatchStore() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function addSuppression(args: {
  email?: string;
  phone?: string;
  channel: SuppressionChannel;
  reason: SuppressionReason;
  note?: string;
}): SuppressionEntry | null {
  const email = normalizeEmail(args.email);
  const phone = normalizePhone(args.phone);
  if (!email && !phone) return null;
  const store = loadStore();
  const entry: SuppressionEntry = {
    id: `sup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    email,
    phone,
    channel: args.channel,
    reason: args.reason,
    note: args.note,
    createdAt: new Date().toISOString(),
  };
  store.entries.push(entry);
  saveStore(store);
  dispatchStore();
  void syncSuppressionToSupabase(entry);
  return entry;
}

/** Best-effort mirror to the shared public.comms_suppression table — never blocks the local add. */
async function syncSuppressionToSupabase(entry: SuppressionEntry): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('comms_suppression').upsert(
      {
        id: entry.id,
        tenant_id: SERVER_TENANT_ID,
        email: entry.email ?? null,
        phone: entry.phone ?? null,
        channel: entry.channel,
        reason: entry.reason,
        note: entry.note ?? null,
        created_at: entry.createdAt,
      },
      { onConflict: 'id' },
    );
  } catch {
    // non-blocking — local suppression already applied
  }
}

/** Pulls server-recorded suppressions (e.g. added by automation-runner) into the local list. */
export async function refreshSuppressionsFromSupabase(): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, count: 0, error: 'Supabase not configured' };
  try {
    const { data, error } = await supabase
      .from('comms_suppression')
      .select('id, email, phone, channel, reason, note, created_at')
      .eq('tenant_id', SERVER_TENANT_ID)
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) return { ok: false, count: 0, error: error.message };
    const rows = (data ?? []) as unknown as Array<{
      id: string;
      email: string | null;
      phone: string | null;
      channel: SuppressionChannel;
      reason: SuppressionReason;
      note: string | null;
      created_at: string;
    }>;
    const remote: SuppressionEntry[] = rows.map((row) => ({
      id: row.id,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      channel: row.channel,
      reason: row.reason,
      note: row.note ?? undefined,
      createdAt: row.created_at,
    }));
    if (!remote.length) return { ok: true, count: 0 };
    const store = loadStore();
    const byId = new Map(store.entries.map((e) => [e.id, e]));
    let added = 0;
    for (const row of remote) {
      if (!byId.has(row.id)) {
        byId.set(row.id, row);
        added += 1;
      }
    }
    if (added > 0) {
      store.entries = Array.from(byId.values());
      saveStore(store);
      dispatchStore();
    }
    return { ok: true, count: added };
  } catch (err: unknown) {
    return { ok: false, count: 0, error: (err as Error)?.message ?? String(err) };
  }
}

export function listSuppressions(): SuppressionEntry[] {
  return loadStore().entries.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function removeSuppression(id: string) {
  const store = loadStore();
  store.entries = store.entries.filter((e) => e.id !== id);
  saveStore(store);
  dispatchStore();
}

export type SuppressionCheckResult = {
  suppressed: boolean;
  reason?: SuppressionReason | 'lead_consent_revoked';
  matchedOn?: 'email' | 'phone';
};

/**
 * Check before ANY agent/automation/sequence send. Every growth agent, the CRM
 * sequence engine, the nurture engine, and the Phase 3 cadence/timing engine
 * must call this before dispatching an email or SMS.
 */
export function checkSuppression(args: { email?: string; phone?: string; channel: 'email' | 'sms' }): SuppressionCheckResult {
  const email = normalizeEmail(args.email);
  const phone = normalizePhone(args.phone);

  const manual = loadStore().entries.find((e) => {
    if (e.channel !== 'all' && e.channel !== args.channel) return false;
    if (email && e.email === email) return true;
    if (phone && e.phone === phone) return true;
    return false;
  });
  if (manual) {
    return { suppressed: true, reason: manual.reason, matchedOn: manual.email === email ? 'email' : 'phone' };
  }

  if (email) {
    try {
      const lead = listLeadCaptures().find((l) => normalizeEmail(l.email) === email);
      if (lead) {
        const revoked =
          args.channel === 'email' ? lead.consentEmailMarketing === false : lead.consentSmsMarketing === false;
        if (revoked) return { suppressed: true, reason: 'lead_consent_revoked', matchedOn: 'email' };
      }
    } catch {
      // lead capture store unavailable — do not block send on a lookup failure
    }
  }

  return { suppressed: false };
}

/** Quiet-hours guard — default 9am-8pm in the lead's local-ish presumed hour (server clock fallback). */
export function isWithinQuietHours(date: Date = new Date(), startHour = 9, endHour = 20): boolean {
  const h = date.getHours();
  return h >= startHour && h < endHour;
}

const FREQUENCY_KEY = 'finely.comms_frequency_log.v1';
type FrequencyLogEntry = { key: string; sentAtMs: number };

function loadFrequencyLog(): FrequencyLogEntry[] {
  return loadJson<{ rows: FrequencyLogEntry[] }>(FREQUENCY_KEY, { rows: [] }, 1).rows;
}

function saveFrequencyLog(rows: FrequencyLogEntry[]) {
  saveJson(FREQUENCY_KEY, { rows: rows.slice(-2000) }, 1);
}

/** Record a send for frequency-cap enforcement — call after every successful send. */
export function recordSendForFrequencyCap(recipientKey: string) {
  const rows = loadFrequencyLog();
  rows.push({ key: recipientKey.toLowerCase(), sentAtMs: Date.now() });
  saveFrequencyLog(rows);
}

/** True if this recipient already received a send within windowHours — caps cross-agent pile-on. */
export function isOverFrequencyCap(recipientKey: string, windowHours = 20, maxPerWindow = 1): boolean {
  const key = recipientKey.toLowerCase();
  const cutoff = Date.now() - windowHours * 3_600_000;
  const count = loadFrequencyLog().filter((r) => r.key === key && r.sentAtMs >= cutoff).length;
  return count >= maxPerWindow;
}

/**
 * Canonical cross-channel identity key for frequency-cap bucketing. When a `crmRecordId` is
 * available, resolves to the CRM record's own contact identity (preferring email, then phone)
 * so an email send and an SMS send against the *same* CRM record share one frequency-cap
 * bucket instead of two independent ones keyed by raw email/phone strings. Falls back to the
 * raw email/phone passed in when no CRM record is available or the lookup fails — never
 * blocks a send on a lookup failure.
 *
 * Uses a dynamic import for `crmRecordsRepo` to avoid a circular import: `crmRecordsRepo.ts`
 * transitively imports this module (via `leadCapturePipeline.ts` -> `nurtureEngine.ts` ->
 * `checkSuppression`), so a static top-level import here would create an import cycle.
 */
export async function resolveFrequencyCapKey(args: {
  email?: string;
  phone?: string;
  crmRecordId?: string;
}): Promise<string> {
  if (args.crmRecordId) {
    try {
      const { getCrmRecord } = await import('./crmRecordsRepo');
      const record = getCrmRecord(args.crmRecordId);
      const canonical = normalizeEmail(record?.contact.email) || normalizePhone(record?.contact.phone);
      if (canonical) return `crm:${canonical}`;
    } catch {
      // fall through to raw identity below — never block a send on a lookup failure
    }
  }
  const email = normalizeEmail(args.email);
  const phone = normalizePhone(args.phone);
  return email || phone || (args.email || args.phone || 'unknown').toLowerCase();
}
