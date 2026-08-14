// Phase F3 — server-side win-back (platform-cron step `win_back`). Ports
// src/lib/billingSubscriptionEngine.ts's processWinBackTick() detection logic
// (expired-trial entitlement + no paid conversion, 1/3 days post-expiry)
// server-side. Like billing_dunning, needed NO new table for detection —
// `entitlements` (trial end date) and `agreements` (paid-conversion check)
// already have real Supabase server truth.
//
// Deliberate deviation from the client version's action: the client engine
// calls enrollLeadInNurtureSequence({ sequenceId: 'seq_credit_funnel',
// context: { stepOverride: 'day14_trial' } }) — a client-only nurture-engine
// feature that lets a caller start a lead partway through a sequence at a
// named step. The SERVER nurture processor (processDueNurtureEnrollments.ts)
// has no equivalent: it always advances nurture_enrollments purely by numeric
// next_step_index starting at 0, with no "start at step index N by name"
// support. Enrolling a win-back candidate into nurture_enrollments naively
// would replay that funnel's entire welcome/day1/day3/day7 intro sequence to
// someone whose trial already expired — wrong content, not a faithful port.
// Rather than extend the nurture catalog/processor schema (out of scope here
// and a shared-file risk per the file-ownership matrix), this processor sends
// a self-contained win-back email directly — same pattern as F1's reminders
// and F3's own dunning processor — deduped via the same shared
// comms_frequency_log table so it never re-sends per partner/threshold.
import {
  checkSuppressionServerSide,
  isOverFrequencyCapServerSide,
  isWithinQuietHoursServerSide,
  recordSendForFrequencyCapServerSide,
} from './commsSuppressionCheck.ts';
import { isEmailDeliveryConfigured, sendServiceEmail } from './commsSendEmail.ts';
import { logEdgeEvent } from './edgeGuard.ts';
import { enqueueRetry } from './sendRetryQueue.ts';

// deno-lint-ignore no-explicit-any
type AdminClient = any;

// See processDueBillingDunning.ts's header comment for this dual-tenant-id note.
const ENTITLEMENTS_TENANT_ID = 'tenant_finely_primary';
const COMMS_TENANT_ID = 'finely_cred';

const WIN_BACK_DAYS = [1, 3];
const DEDUPE_WINDOW_HOURS = 24 * 35;

type EntitlementRow = { partner_id: string; source_agreement_id: string | null; ends_at: string | null };
type AgreementRow = { partner_id: string; package_id: string; status: string };

export type WinBackProcessResult = {
  trialsExpired: number;
  due: number;
  emailsSent: number;
  emailsSkipped: number;
  errors: string[];
};

function appBaseUrl(): string {
  return (Deno.env.get('APP_BASE_URL') || Deno.env.get('VITE_APP_BASE_URL') || 'https://app.finelycred.com').replace(/\/+$/, '');
}

export async function processDueWinBack(args: { admin: AdminClient; dryRun: boolean; tenantId?: string }): Promise<WinBackProcessResult> {
  const tenantId = args.tenantId ?? ENTITLEMENTS_TENANT_ID;
  const now = Date.now();
  const result: WinBackProcessResult = { trialsExpired: 0, due: 0, emailsSent: 0, emailsSkipped: 0, errors: [] };

  const { data: entitlementRows } = await args.admin
    .from('entitlements')
    .select('partner_id, source_agreement_id, ends_at')
    .eq('tenant_id', tenantId)
    .eq('source_agreement_id', 'trial_30d')
    .not('ends_at', 'is', null)
    .limit(500);

  const entitlements = (entitlementRows ?? []) as EntitlementRow[];
  result.trialsExpired = entitlements.length;

  const candidates = entitlements
    .map((e) => ({ e, daysSinceExpiry: Math.floor((now - Date.parse(e.ends_at as string)) / 86_400_000) }))
    .filter(({ daysSinceExpiry }) => WIN_BACK_DAYS.includes(daysSinceExpiry));

  if (args.dryRun || !candidates.length) {
    result.due = candidates.length;
    return result;
  }

  // Batch-check paid conversion once instead of one query per candidate.
  const partnerIds = Array.from(new Set(candidates.map((c) => c.e.partner_id)));
  const { data: agreementRows } = await args.admin
    .from('agreements')
    .select('partner_id, package_id, status')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .in('partner_id', partnerIds);
  const paidPartnerIds = new Set(
    ((agreementRows ?? []) as AgreementRow[]).filter((a) => a.package_id !== 'trial_30d').map((a) => a.partner_id),
  );

  const due = candidates.filter(({ e }) => !paidPartnerIds.has(e.partner_id));
  result.due = due.length;

  if (!isEmailDeliveryConfigured()) return result;

  const quietHoursOk = isWithinQuietHoursServerSide();

  for (const { e, daysSinceExpiry } of due) {
    try {
      const dedupeKey = `winback:${e.partner_id}:${daysSinceExpiry}d`;
      const alreadySent = await isOverFrequencyCapServerSide(args.admin, dedupeKey, {
        tenantId: COMMS_TENANT_ID,
        windowHours: DEDUPE_WINDOW_HOURS,
        maxPerWindow: 1,
      });
      if (alreadySent) continue;

      const { data: partner } = await args.admin.from('partners').select('profile').eq('id', e.partner_id).maybeSingle();
      const profile = (partner?.profile ?? {}) as { email?: string; fullName?: string };
      const email = (profile.email || '').trim();
      if (!email) {
        result.emailsSkipped += 1;
        continue;
      }

      const suppression = await checkSuppressionServerSide(args.admin, { email, channel: 'email', tenantId: COMMS_TENANT_ID });
      if (suppression.suppressed || !quietHoursOk) {
        result.emailsSkipped += 1;
        continue;
      }

      const subject = 'Your Finely Cred trial has ended — come back?';
      const body =
        `Hi ${profile.fullName || 'there'},\n\n` +
        `Your free DIY trial ended ${daysSinceExpiry} day(s) ago and you haven't upgraded yet. ` +
        `Pick up right where you left off — restore access here: ${appBaseUrl()}/pricing\n\n— Finely Cred`;
      const sent = await sendServiceEmail({ toEmail: email, toName: profile.fullName, subject, text: body });

      if (sent.ok) {
        result.emailsSent += 1;
        await recordSendForFrequencyCapServerSide(args.admin, dedupeKey, COMMS_TENANT_ID);
      } else {
        result.emailsSkipped += 1;
        result.errors.push(sent.error || 'Win-back email failed');
        // Same rationale as billing_dunning: record the dedupe key on
        // failure too so the retry queue (not the next raw tick) owns
        // resending this exact threshold.
        await recordSendForFrequencyCapServerSide(args.admin, dedupeKey, COMMS_TENANT_ID);
        await enqueueRetry({
          admin: args.admin,
          tenantId: COMMS_TENANT_ID,
          channel: 'email',
          toEmail: email,
          toName: profile.fullName,
          subject,
          body,
          sourceProcessor: 'win_back',
          referenceId: e.partner_id,
          error: sent.error || 'Win-back email failed',
        });
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : 'Win-back processing failed');
    }
  }

  if (due.length) {
    await logEdgeEvent({
      namespace: 'platform-cron',
      level: 'info',
      event: 'win_back_processed',
      meta: { trialsExpired: result.trialsExpired, due: due.length, emailsSent: result.emailsSent },
    });
  }

  return result;
}
