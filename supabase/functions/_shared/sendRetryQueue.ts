// Phase F5 — Retry queue for failed sequence/nurture/reminder/billing sends.
//
// Every server-side send processor (meeting reminders, no-show recovery, CRM
// sequences, billing dunning, win-back, and the nurture reconciliation fix)
// previously logged a failed provider send into its own result.errors array
// and dropped it — no automatic retry existed anywhere. enqueueRetry() gives
// those failure paths a durable place to land instead; processDueRetries()
// (wired into platform-cron's tick handler as its own CRON_STEPS entry)
// attempts due rows with exponential backoff (5min → 30min → 2hr), then
// marks a row permanently 'failed' once BACKOFF_MINUTES is exhausted so it
// stops being retried forever but is still visible in the admin panel.
//
// Re-checks suppression before every retry attempt (not just at enqueue
// time) — a contact could be added to comms_suppression in the window
// between the original failure and the retry firing, and a stale queued
// send should never bypass a suppression added after it was queued.
import { checkSuppressionServerSide } from './commsSuppressionCheck.ts';
import { sendServiceEmail } from './commsSendEmail.ts';
import { sendServiceSms } from './commsSendSms.ts';
import { logEdgeEvent } from './edgeGuard.ts';

// deno-lint-ignore no-explicit-any
type AdminClient = any;

export type SendRetrySourceProcessor =
  | 'meeting_reminders'
  | 'no_show_recovery'
  | 'crm_sequences'
  | 'billing_dunning'
  | 'win_back'
  | 'nurture'
  | 'missed_call_textback';

export type EnqueueRetryArgs = {
  admin: AdminClient;
  tenantId?: string;
  channel: 'email' | 'sms';
  toEmail?: string;
  toPhone?: string;
  toName?: string;
  subject?: string;
  body: string;
  html?: string;
  sourceProcessor: SendRetrySourceProcessor;
  referenceId?: string;
  error: string;
};

/** Delays (minutes) before each successive retry attempt — 5min, 30min, 2hr, then give up. */
const BACKOFF_MINUTES = [5, 30, 120];

function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

/**
 * Called from a processor's send-failure path instead of just logging and
 * dropping. Never throws — a failure to enqueue a retry should not mask or
 * compound the original send failure being reported by the caller.
 */
export async function enqueueRetry(args: EnqueueRetryArgs): Promise<{ ok: boolean; error?: string }> {
  const tenantId = args.tenantId ?? 'finely_cred';
  if (args.channel === 'email' && !args.toEmail?.trim()) return { ok: false, error: 'Missing toEmail' };
  if (args.channel === 'sms' && !args.toPhone?.trim()) return { ok: false, error: 'Missing toPhone' };

  const id = `retry_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  try {
    const { error } = await args.admin.from('send_retry_queue').insert({
      id,
      tenant_id: tenantId,
      channel: args.channel,
      to_email: args.toEmail ?? null,
      to_phone: args.toPhone ?? null,
      to_name: args.toName ?? null,
      subject: args.subject ?? null,
      body: args.body,
      html: args.html ?? null,
      source_processor: args.sourceProcessor,
      reference_id: args.referenceId ?? null,
      attempts: 0,
      max_attempts: BACKOFF_MINUTES.length,
      next_retry_at: minutesFromNow(BACKOFF_MINUTES[0]),
      last_error: args.error,
      status: 'pending',
      created_at: now,
      updated_at: now,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Retry enqueue failed' };
  }
}

type RetryRow = {
  id: string;
  tenant_id: string;
  channel: 'email' | 'sms';
  to_email: string | null;
  to_phone: string | null;
  to_name: string | null;
  subject: string | null;
  body: string;
  html: string | null;
  source_processor: SendRetrySourceProcessor;
  reference_id: string | null;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
};

export type SendRetryProcessResult = {
  due: number;
  sent: number;
  rescheduled: number;
  permanentlyFailed: number;
  errors: string[];
};

/** Attempts every due (`status = 'pending'`, `next_retry_at <= now`) retry row with exponential backoff. */
export async function processDueRetries(args: {
  admin: AdminClient;
  dryRun: boolean;
  tenantId?: string;
  maxPerRun?: number;
}): Promise<SendRetryProcessResult> {
  const tenantId = args.tenantId ?? 'finely_cred';
  const maxPerRun = Math.max(1, args.maxPerRun ?? 50);
  const nowIso = new Date().toISOString();

  const result: SendRetryProcessResult = { due: 0, sent: 0, rescheduled: 0, permanentlyFailed: 0, errors: [] };

  const { data } = await args.admin
    .from('send_retry_queue')
    .select('id, tenant_id, channel, to_email, to_phone, to_name, subject, body, html, source_processor, reference_id, attempts, max_attempts, last_error')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .lte('next_retry_at', nowIso)
    .limit(maxPerRun);

  const due = (data ?? []) as RetryRow[];
  result.due = due.length;

  if (args.dryRun || !due.length) return result;

  for (const row of due) {
    try {
      if (row.channel === 'email' && row.to_email) {
        const suppression = await checkSuppressionServerSide(args.admin, { email: row.to_email, channel: 'email', tenantId });
        if (suppression.suppressed) {
          await markPermanentlyFailed(args.admin, row.id, `Suppressed before retry (${suppression.reason ?? 'unknown'})`);
          result.permanentlyFailed += 1;
          continue;
        }
      } else if (row.channel === 'sms' && row.to_phone) {
        const suppression = await checkSuppressionServerSide(args.admin, { phone: row.to_phone, channel: 'sms', tenantId });
        if (suppression.suppressed) {
          await markPermanentlyFailed(args.admin, row.id, `Suppressed before retry (${suppression.reason ?? 'unknown'})`);
          result.permanentlyFailed += 1;
          continue;
        }
      }

      const sendOutcome =
        row.channel === 'email'
          ? await sendServiceEmail({ toEmail: row.to_email ?? '', toName: row.to_name ?? undefined, subject: row.subject || 'Finely Cred', text: row.body, html: row.html ?? undefined })
          : await sendServiceSms({ to: row.to_phone ?? '', body: row.body });

      if (sendOutcome.ok) {
        await args.admin
          .from('send_retry_queue')
          .update({ status: 'sent', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', row.id);
        result.sent += 1;
        continue;
      }

      const attempts = row.attempts + 1;
      const errorMsg = ('error' in sendOutcome ? sendOutcome.error : undefined) || 'Retry send failed';
      if (attempts >= BACKOFF_MINUTES.length) {
        await markPermanentlyFailed(args.admin, row.id, errorMsg);
        result.permanentlyFailed += 1;
      } else {
        await args.admin
          .from('send_retry_queue')
          .update({
            attempts,
            last_error: errorMsg,
            next_retry_at: minutesFromNow(BACKOFF_MINUTES[attempts]),
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
        result.rescheduled += 1;
      }
    } catch (e) {
      result.errors.push(e instanceof Error ? e.message : 'Retry processing failed');
    }
  }

  if (due.length) {
    await logEdgeEvent({
      namespace: 'platform-cron',
      level: 'info',
      event: 'send_retry_queue_processed',
      meta: { due: due.length, sent: result.sent, rescheduled: result.rescheduled, permanentlyFailed: result.permanentlyFailed },
    });
  }

  return result;
}

async function markPermanentlyFailed(admin: AdminClient, id: string, error: string): Promise<void> {
  try {
    await admin
      .from('send_retry_queue')
      .update({ status: 'failed', last_error: error, updated_at: new Date().toISOString() })
      .eq('id', id);
  } catch {
    // best-effort — the row will simply remain 'pending' and retried again next tick
  }
}
