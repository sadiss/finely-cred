// Server-side mirror of src/data/commsSuppressionRepo.ts::checkSuppression() —
// both sides read/write the same public.comms_suppression table (see migration
// 20260813200000_crm_server_sync_and_suppression.sql) so a suppression added
// from either the admin app or a server dispatch is honored everywhere.

type SuppressionRow = {
  email?: string | null;
  phone?: string | null;
  channel?: string | null;
  reason?: string | null;
};

// deno-lint-ignore no-explicit-any
type AdminClient = any;

function normalizeEmail(email?: string | null): string | undefined {
  const v = (email || '').trim().toLowerCase();
  return v && v.includes('@') ? v : undefined;
}

function normalizePhone(phone?: string | null): string | undefined {
  const digits = (phone || '').replace(/[^\d]/g, '');
  return digits.length >= 7 ? digits.slice(-10) : undefined;
}

export type ServerSuppressionResult = { suppressed: boolean; reason?: string; matchedOn?: 'email' | 'phone' };

export async function checkSuppressionServerSide(
  admin: AdminClient,
  args: { email?: string; phone?: string; channel: 'email' | 'sms'; tenantId?: string },
): Promise<ServerSuppressionResult> {
  const tenantId = args.tenantId ?? 'finely_cred';
  const email = normalizeEmail(args.email);
  const phone = normalizePhone(args.phone);
  if (!email && !phone) return { suppressed: false };

  try {
    const { data } = await admin.from('comms_suppression').select('email, phone, channel, reason').eq('tenant_id', tenantId).limit(1000);
    const hit = (data ?? []).find((row) => {
      const rowChannel = row.channel ?? 'all';
      if (rowChannel !== 'all' && rowChannel !== args.channel) return false;
      if (email && normalizeEmail(row.email) === email) return true;
      if (phone && normalizePhone(row.phone) === phone) return true;
      return false;
    });
    if (hit) {
      return { suppressed: true, reason: hit.reason ?? 'manual_dnc', matchedOn: email && normalizeEmail(hit.email) === email ? 'email' : 'phone' };
    }
  } catch {
    // Fail open on infra error — same behavior as the client-side lookup failure path.
  }
  return { suppressed: false };
}

/**
 * Server-side mirror of src/data/commsSuppressionRepo.ts::isWithinQuietHours().
 * Added as part of Phase F1 (meeting reminders/no-show recovery) — confirmed
 * during Round 3 planning that NO server-side send path (nurture cron,
 * automation-runner dispatch) enforced quiet hours before this. F1's two new
 * processors are the first server sends required to check this; F2's ported
 * CRM-sequence processor and the processDueNurtureEnrollments.ts reconciliation
 * fix reuse this same helper rather than duplicating the logic.
 *
 * Same caveat as the client version: uses the edge function runtime's system
 * clock (UTC on Supabase), not the recipient's local timezone — a coarse but
 * consistent guard, matching the client's own "server clock fallback" note.
 */
export function isWithinQuietHoursServerSide(date: Date = new Date(), startHour = 9, endHour = 20): boolean {
  const h = date.getHours();
  return h >= startHour && h < endHour;
}

/**
 * Server-side mirror of commsSuppressionRepo.ts's isOverFrequencyCap /
 * recordSendForFrequencyCap, backed by the new public.comms_frequency_log
 * table (migration 20260814110000_crm_sequences_server.sql). Added as part of
 * Phase F2 — the client's FREQUENCY_KEY localStorage log has no server
 * equivalent today, so every server-side send path (nurture cron,
 * automation-runner dispatch, and now the CRM-sequence processor) could
 * previously pile multiple sends onto the same recipient in one day with zero
 * cross-agent awareness. Reused as-is by F3's dunning/win-back one-time-per-
 * threshold sends via a long window (see processDueBillingDunning.ts).
 */
export async function isOverFrequencyCapServerSide(
  admin: AdminClient,
  recipientKey: string,
  args?: { tenantId?: string; windowHours?: number; maxPerWindow?: number },
): Promise<boolean> {
  const tenantId = args?.tenantId ?? 'finely_cred';
  const windowHours = args?.windowHours ?? 20;
  const maxPerWindow = args?.maxPerWindow ?? 1;
  const key = recipientKey.toLowerCase();
  const cutoff = new Date(Date.now() - windowHours * 3_600_000).toISOString();
  try {
    const { count } = await admin
      .from('comms_frequency_log')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('recipient_key', key)
      .gte('sent_at', cutoff);
    return (count ?? 0) >= maxPerWindow;
  } catch {
    // Fail open on infra error — a missed cap check should never block a
    // send outright; the suppression/quiet-hours checks are the hard guards.
    return false;
  }
}

export async function recordSendForFrequencyCapServerSide(
  admin: AdminClient,
  recipientKey: string,
  tenantId = 'finely_cred',
): Promise<void> {
  try {
    await admin.from('comms_frequency_log').insert({
      tenant_id: tenantId,
      recipient_key: recipientKey.toLowerCase(),
      sent_at: new Date().toISOString(),
    });
  } catch {
    // non-blocking — the send itself already succeeded
  }
}

/**
 * Server-side mirror of commsSuppressionRepo.ts's resolveFrequencyCapKey.
 * When a crmRecordId is available, resolves to the crm_records row's own
 * contact identity (email preferred, then phone) so an email send and an SMS
 * send against the same CRM record share one frequency-cap bucket. Falls back
 * to the raw email/phone when no CRM record is available or the lookup fails.
 */
export async function resolveFrequencyCapKeyServerSide(
  admin: AdminClient,
  args: { email?: string; phone?: string; crmRecordId?: string; tenantId?: string },
): Promise<string> {
  if (args.crmRecordId) {
    try {
      const { data } = await admin
        .from('crm_records')
        .select('contact')
        .eq('id', args.crmRecordId)
        .eq('tenant_id', args.tenantId ?? 'finely_cred')
        .maybeSingle();
      const contact = (data?.contact ?? {}) as { email?: string; phone?: string };
      const canonical = normalizeEmail(contact.email) || normalizePhone(contact.phone);
      if (canonical) return `crm:${canonical}`;
    } catch {
      // fall through to raw identity below — never block a send on a lookup failure
    }
  }
  const email = normalizeEmail(args.email);
  const phone = normalizePhone(args.phone);
  return email || phone || (args.email || args.phone || 'unknown').toLowerCase();
}

export async function recordSuppressionServerSide(
  admin: AdminClient,
  args: { email?: string; phone?: string; channel: 'email' | 'sms' | 'all'; reason: string; note?: string; tenantId?: string },
): Promise<{ ok: boolean; error?: string }> {
  const email = normalizeEmail(args.email);
  const phone = normalizePhone(args.phone);
  if (!email && !phone) return { ok: false, error: 'No email or phone provided' };
  try {
    const { error } = await admin.from('comms_suppression').insert({
      id: `sup_srv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      tenant_id: args.tenantId ?? 'finely_cred',
      email: email ?? null,
      phone: phone ?? null,
      channel: args.channel,
      reason: args.reason,
      note: args.note ?? null,
      created_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Insert failed' };
  }
}
