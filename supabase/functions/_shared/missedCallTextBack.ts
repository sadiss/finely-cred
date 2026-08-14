// Phase J3 — missed-call text-back / instant voicemail-to-SMS acknowledgment.
//
// Shares design with `_shared/sendInstantLeadAck.ts` (Phase N1): same
// suppression-checked send pattern, same "give them a real booking link,
// not a bare thanks" framing. The trigger source is different — this fires
// off `twilio-webhook`'s existing voice-status callback (`call_missed` /
// `voicemail` events) instead of a lead-capture webhook — but the shared
// utility both should reuse (per the Round 3 J3 spec's file-ownership note)
// is this module: one suppression-aware "acknowledge a real-time inbound
// event with an SMS + booking link, in the same request" helper, not two
// near-duplicate implementations.
//
// Deliberately NOT a new Twilio webhook endpoint: `twilio-webhook/index.ts`
// already receives and verifies Twilio's voice-status callbacks for the
// support number (see its own header comment) — reusing that live,
// already-configured webhook avoids asking anyone to add a second Twilio
// webhook URL for the exact same phone number. This file is the shared
// helper `twilio-webhook/index.ts` calls into on a missed-call/voicemail
// event; it is not itself Deno.serve()-mounted.
//
// Gating (Phase J3 feature-flag requirement — mirrors src/domain/settings.ts's
// `missedCallTextBack` flag, which documents the client-visible reasoning):
// this only ever sends when BOTH are true —
//   1. `MISSED_CALL_TEXTBACK_ENABLED=true` secret is set (explicit opt-in;
//      the client-side `missedCallTextBack` flag is informational only since
//      this fires from a service-role webhook with no browser/session in the
//      loop — the edge function needs its own opt-in switch).
//   2. Twilio is actually configured (`TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN`),
//      since a text-back with no real phone number configured is a no-op at
//      best and a misleading "sent" log at worst.
import { checkSuppressionServerSide } from './commsSuppressionCheck.ts';
import { sendServiceSms } from './commsSendSms.ts';
import { isTwilioConfigured, trimEnv } from './commsCredentials.ts';
import { logEdgeEvent, requireIdempotency } from './edgeGuard.ts';
import { enqueueRetry } from './sendRetryQueue.ts';

// deno-lint-ignore no-explicit-any
type AdminClient = any;

export type MissedCallTextBackResult = {
  /** True once the enabled-check + caller-phone checks both passed and a send was attempted. */
  attempted: boolean;
  smsSent: boolean;
  followUpTaskCreated: boolean;
  bookingUrl?: string;
  reason?: string;
};

function appBaseUrl(): string {
  return (Deno.env.get('APP_BASE_URL') || Deno.env.get('VITE_APP_BASE_URL') || 'https://app.finelycred.com').replace(/\/+$/, '');
}

function tokenFromId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
}

/** Server-side mirror of src/domain/settings.ts's `missedCallTextBack` flag gate. */
export function isMissedCallTextBackEnabled(): boolean {
  return trimEnv('MISSED_CALL_TEXTBACK_ENABLED').toLowerCase() === 'true' && isTwilioConfigured();
}

/** Creates a real booking_invites row for an unknown caller (guest phone, no partner/lead id yet) and returns its public URL. */
async function createMissedCallBookingInvite(
  admin: AdminClient,
  args: { callerPhone: string; tenantId: string },
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const id = `binv_mc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const token = tokenFromId(id);
  const now = new Date().toISOString();
  try {
    const { error } = await admin.from('booking_invites').insert({
      id,
      tenant_id: args.tenantId,
      token,
      label: `Missed call — ${args.callerPhone}`,
      topic: 'enlightenment',
      duration_minutes: 30,
      guest_phone: args.callerPhone,
      audience: 'guest',
      max_uses: 2,
      use_count: 0,
      status: 'active',
      created_at: now,
      updated_at: now,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, url: `${appBaseUrl()}/book/i/${encodeURIComponent(token)}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Booking invite insert failed' };
  }
}

/** Real `work_tasks` row so a human follow-up is queued, not just an automated text — mirrors processDueNoShowRecovery.ts's createFollowUpTask shape. */
async function createMissedCallFollowUpTask(
  admin: AdminClient,
  args: { callerPhone: string; callSid: string; isVoicemail: boolean; transcription?: string; smsSent: boolean; bookingUrl?: string; tenantId: string },
): Promise<boolean> {
  try {
    const id = `task_mc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    // No partner/lead record exists yet for a cold inbound caller — follows the
    // same `public:<tenant>` convention already used for guest calendar events
    // (see src/data/calendarRepo.ts / processDueNoShowRecovery.ts's resolveEmail()).
    const partnerId = `public:${args.tenantId}`;
    const title = args.isVoicemail ? `Missed call + voicemail — ${args.callerPhone}` : `Missed call — ${args.callerPhone}`;
    const notes = [
      `Caller: ${args.callerPhone}`,
      `Call SID: ${args.callSid}`,
      args.transcription ? `Voicemail transcript: "${args.transcription.slice(0, 600)}"` : 'No voicemail left.',
      args.smsSent
        ? `Instant text-back sent${args.bookingUrl ? ` with booking link: ${args.bookingUrl}` : '.'}`
        : 'Instant text-back was not sent automatically — call back manually.',
    ].join('\n');

    const { error } = await admin.from('work_tasks').insert({
      id,
      tenant_id: args.tenantId,
      partner_id: partnerId,
      title,
      kind: 'follow_up',
      priority: 'high',
      status: 'pending',
      due_at: new Date(Date.now() + 4 * 3600_000).toISOString(),
      notes,
      tags: ['missed-call-textback', 'twilio-webhook'],
      assigned_to: 'admin',
      visibility: 'admin',
      task: {
        id,
        partnerId,
        title,
        kind: 'follow_up',
        stage: 'intake',
        priority: 'high',
        status: 'pending',
        notes,
        tags: ['missed-call-textback', 'twilio-webhook'],
        assignedTo: 'admin',
        visibility: 'admin',
        aiGenerated: true,
      },
      created_at: now,
      updated_at: now,
    });
    return !error;
  } catch {
    // best-effort — the SMS send is the load-bearing part of this feature
    return false;
  }
}

/**
 * Called from `twilio-webhook/index.ts` on a missed-call (`no-answer` /
 * `busy` / `failed` / `canceled` status) or completed-voicemail event.
 * Never throws — every branch resolves to a result object so the webhook
 * handler can log/continue regardless of send outcome, matching
 * `sendInstantLeadAckServerSide()`'s contract.
 */
export async function sendMissedCallTextBack(
  admin: AdminClient,
  args: { callerPhone: string; callSid: string; isVoicemail?: boolean; transcription?: string; tenantId?: string },
): Promise<MissedCallTextBackResult> {
  const tenantId = args.tenantId ?? 'finely_cred';
  const result: MissedCallTextBackResult = { attempted: false, smsSent: false, followUpTaskCreated: false };

  if (!isMissedCallTextBackEnabled()) {
    result.reason = 'feature_disabled_or_twilio_not_configured';
    return result;
  }

  const callerPhone = (args.callerPhone || '').trim();
  if (!callerPhone) {
    result.reason = 'no_caller_phone';
    return result;
  }

  // Twilio can deliver more than one status callback for the same CallSid
  // (e.g. a `no-answer` status callback followed by a separate voicemail
  // completion event) — one text-back per call, not one per callback.
  const idempotent = await requireIdempotency({ namespace: 'missed-call-textback', key: args.callSid, ttlSeconds: 24 * 60 * 60 });
  if (!idempotent) {
    result.reason = 'already_processed_for_call_sid';
    return result;
  }

  result.attempted = true;

  try {
    const suppression = await checkSuppressionServerSide(admin, { phone: callerPhone, channel: 'sms', tenantId });
    if (suppression.suppressed) {
      result.reason = `suppressed_${suppression.reason}`;
    } else {
      const invite = await createMissedCallBookingInvite(admin, { callerPhone, tenantId });
      const bookingUrl = invite.ok && invite.url ? invite.url : `${appBaseUrl()}/free-debt-guide`;
      result.bookingUrl = bookingUrl;

      const body = `Sorry we missed your call! A Finely Cred team member will reach out shortly, or book a time that works for you: ${bookingUrl} Reply STOP to opt out.`;
      const sent = await sendServiceSms({ to: callerPhone, body });

      if (sent.ok) {
        result.smsSent = true;
      } else {
        result.reason = sent.error;
        await enqueueRetry({
          admin,
          tenantId,
          channel: 'sms',
          toPhone: callerPhone,
          body,
          sourceProcessor: 'missed_call_textback',
          referenceId: args.callSid,
          error: sent.error || 'Missed-call text-back SMS failed',
        });
      }
    }
  } catch (e) {
    result.reason = e instanceof Error ? e.message : 'missed_call_textback_failed';
  }

  result.followUpTaskCreated = await createMissedCallFollowUpTask(admin, {
    callerPhone,
    callSid: args.callSid,
    isVoicemail: Boolean(args.isVoicemail),
    transcription: args.transcription,
    smsSent: result.smsSent,
    bookingUrl: result.bookingUrl,
    tenantId,
  });

  await logEdgeEvent({
    namespace: 'missed-call-textback',
    level: result.smsSent ? 'info' : 'warn',
    event: 'processed',
    meta: {
      callSid: args.callSid,
      callerPhone,
      isVoicemail: Boolean(args.isVoicemail),
      smsSent: result.smsSent,
      followUpTaskCreated: result.followUpTaskCreated,
      reason: result.reason ?? null,
    },
  });

  return result;
}
