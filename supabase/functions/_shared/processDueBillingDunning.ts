// Phase F3 — server-side billing dunning (platform-cron step `billing_dunning`).
// Ports src/lib/billingDunningEngine.ts's processBillingDunningTick() logic —
// confirmed during F3 investigation that `agreements` already has real
// Supabase server truth (Stripe-webhook-driven, same table E1a's admin
// revenue dashboard reads), so this needed NO new table — it queries
// `agreements` directly (status = 'past_due'), same detection logic the
// client engine already used.
//
// One real behavior change vs. the client version (deliberate, matches this
// round's spec acceptance criteria: "triggers a dunning email via a server
// tick"): the client engine only ever created a local in-app notification
// (createNotification, localStorage-only, no server table) — it never sent a
// real email. This server processor sends a genuine dunning email via
// sendServiceEmail, which is strictly more useful for a revenue-protection
// step and requires no new client-side behavior to remove (the client
// in-app notification still fires independently when an admin has the
// billing page open).
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

// `agreements`/`partners` use the FINELY_TENANT_ID convention
// ('tenant_finely_primary'), NOT the 'finely_cred' literal calendar_events/
// crm_*/comms_* tables use — see processDueMeetingReminders.ts's comment for
// the same pre-existing dual-tenant-id convention in this codebase.
const AGREEMENTS_TENANT_ID = 'tenant_finely_primary';
// comms_suppression / comms_frequency_log are always keyed 'finely_cred'
// regardless of which business-domain table triggered the send — this is the
// single shared identity these tables use across every edge function.
const COMMS_TENANT_ID = 'finely_cred';

const DUNNING_DAYS = [7, 3, 1];
// Long dedupe window: each of the 3 day-thresholds should fire at most once
// per agreement's past-due period, so a window well beyond the longest
// realistic past-due period is equivalent to "ever sent for this exact
// threshold" without needing a dedicated ledger table.
const DEDUPE_WINDOW_HOURS = 24 * 35;

type AgreementRow = {
  id: string;
  partner_id: string;
  package_id: string;
  amount_cents: number | null;
  status: string;
  updated_at: string;
};

export type BillingDunningProcessResult = {
  pastDue: number;
  due: number;
  emailsSent: number;
  emailsSkipped: number;
  errors: string[];
};

function appBaseUrl(): string {
  return (Deno.env.get('APP_BASE_URL') || Deno.env.get('VITE_APP_BASE_URL') || 'https://app.finelycred.com').replace(/\/+$/, '');
}

export async function processDueBillingDunning(args: {
  admin: AdminClient;
  dryRun: boolean;
  tenantId?: string;
}): Promise<BillingDunningProcessResult> {
  const tenantId = args.tenantId ?? AGREEMENTS_TENANT_ID;
  const now = Date.now();
  const result: BillingDunningProcessResult = { pastDue: 0, due: 0, emailsSent: 0, emailsSkipped: 0, errors: [] };

  const { data } = await args.admin
    .from('agreements')
    .select('id, partner_id, package_id, amount_cents, status, updated_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'past_due')
    .limit(200);

  const agreements = (data ?? []) as AgreementRow[];
  result.pastDue = agreements.length;

  const due = agreements
    .map((a) => ({ a, daysSince: Math.floor((now - Date.parse(a.updated_at)) / 86_400_000) }))
    .filter(({ daysSince }) => DUNNING_DAYS.includes(daysSince));
  result.due = due.length;

  if (args.dryRun || !due.length || !isEmailDeliveryConfigured()) return result;

  const quietHoursOk = isWithinQuietHoursServerSide();

  for (const { a, daysSince } of due) {
    try {
      const dedupeKey = `dunning:${a.id}:${daysSince}d`;
      const alreadySent = await isOverFrequencyCapServerSide(args.admin, dedupeKey, {
        tenantId: COMMS_TENANT_ID,
        windowHours: DEDUPE_WINDOW_HOURS,
        maxPerWindow: 1,
      });
      if (alreadySent) continue;

      const { data: partner } = await args.admin.from('partners').select('profile').eq('id', a.partner_id).maybeSingle();
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

      const amount = ((a.amount_cents ?? 0) / 100).toFixed(2);
      const subject = 'Payment past due — action needed';
      const body =
        `Hi ${profile.fullName || 'there'},\n\n` +
        `Your Finely Cred plan payment ($${amount}) is ${daysSince} day(s) overdue. ` +
        `Please update your billing to avoid a service interruption.\n\n` +
        `Update billing: ${appBaseUrl()}/portal/billing\n\n— Finely Cred`;
      const sent = await sendServiceEmail({ toEmail: email, toName: profile.fullName, subject, text: body });

      if (sent.ok) {
        result.emailsSent += 1;
        await recordSendForFrequencyCapServerSide(args.admin, dedupeKey, COMMS_TENANT_ID);
      } else {
        result.emailsSkipped += 1;
        result.errors.push(sent.error || 'Dunning email failed');
        // Record the send against the dedupe key regardless — a retry-queue
        // resend later should not also let the next tick's DUNNING_DAYS
        // window re-fire the exact same threshold a second time.
        await recordSendForFrequencyCapServerSide(args.admin, dedupeKey, COMMS_TENANT_ID);
        await enqueueRetry({
          admin: args.admin,
          tenantId: COMMS_TENANT_ID,
          channel: 'email',
          toEmail: email,
          toName: profile.fullName,
          subject,
          body,
          sourceProcessor: 'billing_dunning',
          referenceId: a.id,
          error: sent.error || 'Dunning email failed',
        });
      }
    } catch (e) {
      result.errors.push(e instanceof Error ? e.message : 'Dunning processing failed');
    }
  }

  if (due.length) {
    await logEdgeEvent({
      namespace: 'platform-cron',
      level: 'info',
      event: 'billing_dunning_processed',
      meta: { pastDue: result.pastDue, due: due.length, emailsSent: result.emailsSent },
    });
  }

  return result;
}
