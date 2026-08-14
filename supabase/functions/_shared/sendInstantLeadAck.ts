// Server-side instant acknowledgment for leads ingested outside the browser's
// submitLeadCapture() → runLeadCapturePipeline() flow (currently: Meta Lead Ads
// via meta-webhook/index.ts). Those leads land directly in `lead_captures` via
// a service-role upsert and previously received ZERO acknowledgment of any
// kind — this closes that gap with the same suppression-checked send pattern
// automation-runner's `executeAutomationAction.ts` already uses.
import { checkSuppressionServerSide } from './commsSuppressionCheck.ts';
import { sendServiceEmail } from './commsSendEmail.ts';
import { sendServiceSms } from './commsSendSms.ts';
import { logEdgeEvent } from './edgeGuard.ts';

// deno-lint-ignore no-explicit-any
type AdminClient = any;

export type InstantLeadAckResult = {
  emailSent: boolean;
  smsSent: boolean;
  emailReason?: string;
  smsReason?: string;
};

function firstName(fullName?: string): string {
  const trimmed = (fullName || '').trim();
  if (!trimmed) return 'there';
  return trimmed.split(/\s+/)[0];
}

const DEFAULT_BOOKING_URL = 'https://finelycred.com/free-debt-guide';

/**
 * Sends a real instant email + SMS acknowledgment for a server-ingested lead and
 * best-effort marks `lead_captures.first_touch_at` on the first successful send.
 * Never throws — every branch resolves to a result object so the caller (the
 * webhook handler) can log/continue regardless of send outcome.
 */
export async function sendInstantLeadAckServerSide(
  admin: AdminClient,
  args: {
    leadId: string;
    email?: string | null;
    phone?: string | null;
    fullName?: string | null;
    tenantId?: string;
    bookingUrl?: string;
  },
): Promise<InstantLeadAckResult> {
  const tenantId = args.tenantId ?? 'finely_cred';
  const name = firstName(args.fullName ?? undefined);
  const bookingUrl = args.bookingUrl ?? DEFAULT_BOOKING_URL;
  const result: InstantLeadAckResult = { emailSent: false, smsSent: false };

  const email = (args.email || '').trim();
  // meta-webhook falls back to a `meta+<id>@lead.local` placeholder when the Graph API
  // fetch can't resolve a real address — never send to that placeholder domain.
  const hasResolvableEmail = email.includes('@') && !email.toLowerCase().endsWith('@lead.local');

  if (hasResolvableEmail) {
    try {
      const suppression = await checkSuppressionServerSide(admin, { email, channel: 'email', tenantId });
      if (suppression.suppressed) {
        result.emailReason = `suppressed_${suppression.reason}`;
      } else {
        const sendResult = await sendServiceEmail({
          toEmail: email,
          toName: args.fullName ?? undefined,
          subject: `Thanks for reaching out, ${name}!`,
          text:
            `Hi ${name},\n\n` +
            `Thanks for your interest in Finely Cred! A specialist will follow up shortly. ` +
            `In the meantime, grab a free strategy session here: ${bookingUrl}\n\n— Finely Cred`,
        });
        if (sendResult.ok) {
          result.emailSent = true;
        } else {
          result.emailReason = sendResult.error;
        }
      }
    } catch (e) {
      result.emailReason = e instanceof Error ? e.message : 'email_send_failed';
    }
  } else {
    result.emailReason = 'no_resolvable_email';
  }

  const phone = (args.phone || '').trim();
  if (phone) {
    try {
      const suppression = await checkSuppressionServerSide(admin, { phone, channel: 'sms', tenantId });
      if (suppression.suppressed) {
        result.smsReason = `suppressed_${suppression.reason}`;
      } else {
        const sendResult = await sendServiceSms({
          to: phone,
          body: `Hi ${name}, it's Finely Cred! Grab a free strategy session here: ${bookingUrl} Reply STOP to opt out.`,
        });
        if (sendResult.ok) {
          result.smsSent = true;
        } else {
          result.smsReason = sendResult.error;
        }
      }
    } catch (e) {
      result.smsReason = e instanceof Error ? e.message : 'sms_send_failed';
    }
  } else {
    result.smsReason = 'no_phone';
  }

  if (result.emailSent || result.smsSent) {
    const channel = result.emailSent ? 'email' : 'sms';
    try {
      await admin
        .from('lead_captures')
        .update({ first_touch_at: new Date().toISOString(), first_touch_channel: channel })
        .eq('id', args.leadId)
        .is('first_touch_at', null);
    } catch {
      // non-blocking — tracking-only write
    }
  }

  await logEdgeEvent({
    namespace: 'instant-lead-ack',
    level: 'info',
    event: 'ack_attempted',
    meta: {
      leadId: args.leadId,
      emailSent: result.emailSent,
      smsSent: result.smsSent,
      emailReason: result.emailReason,
      smsReason: result.smsReason,
    },
  });

  return result;
}
