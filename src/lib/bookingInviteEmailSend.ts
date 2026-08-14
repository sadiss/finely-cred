/**
 * Sends a "pick a time" self-book invite email for a BookingInvite record.
 * Reuses Finely Comms (`send-email` + commsDelivery flag) — same pipe as everything else.
 */
import type { BookingInvite, ConsultationTopic } from '../domain/calendar';
import { buildBookingInvitePath, markBookingInviteEmail } from '../data/bookingInviteRepo';
import { buildBookingInviteEmail } from '../comms/meetingInviteEmail';
import { isFeatureEnabled } from '../data/settingsRepo';
import { isSupabaseConfigured } from './supabaseClient';
import { sendEmail } from './commsDeliveryClient';
import { addAuditEvent } from '../data/auditRepo';
import { checkSuppression } from '../data/commsSuppressionRepo';
import { getPublicSiteOrigin } from './funnelPublicLinks';

const TOPIC_LABELS: Record<ConsultationTopic, string> = {
  enlightenment: 'Strategy call',
  credit_restore: 'Credit restore session',
  business_build: 'Business build session',
  debt_summons: 'Debt & summons session',
  identity_theft: 'Identity theft session',
  billing: 'Billing session',
  affiliate: 'Affiliate session',
  other: 'session',
};

export async function sendBookingInviteEmailNow(args: {
  invite: BookingInvite;
  toEmail?: string;
  toName?: string;
  hostName?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { invite } = args;
  const toEmail = (args.toEmail || invite.guestEmail || '').trim().toLowerCase();
  const toName = (args.toName || invite.guestName || '').trim();

  if (!toEmail || !toEmail.includes('@')) {
    return { ok: false, error: 'Add a recipient email before sending.' };
  }
  if (!isFeatureEnabled('commsDelivery')) {
    return { ok: false, error: 'Turn on Comms Delivery (Feature Flags) to send invite emails.' };
  }
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase is not configured — cannot send email.' };
  }

  const suppression = checkSuppression({ channel: 'email', email: toEmail });
  if (suppression.suppressed) {
    markBookingInviteEmail(invite.id, { status: 'failed', error: `Suppressed: ${suppression.reason || 'do-not-contact'}` });
    return { ok: false, error: `This address is on the do-not-contact list (${suppression.reason || 'suppressed'}).` };
  }

  markBookingInviteEmail(invite.id, { status: 'sending' });

  const origin = getPublicSiteOrigin();
  const bookingUrl = `${origin}${buildBookingInvitePath(invite.token)}`;
  const topicLabel = TOPIC_LABELS[invite.topic] || 'session';

  const content = buildBookingInviteEmail({
    guestName: toName || undefined,
    hostName: args.hostName,
    topicLabel,
    durationMinutes: invite.durationMinutes,
    bookingUrl,
    label: invite.label,
    audience: invite.audience,
  });

  try {
    await sendEmail({
      toEmail,
      toName: toName || undefined,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
    markBookingInviteEmail(invite.id, { status: 'sent' });
    try {
      addAuditEvent({
        actorType: 'admin',
        partnerId: invite.partnerId || 'admin',
        action: 'calendar.invite_email_sent',
        entityType: 'booking_invite',
        entityId: invite.id,
        meta: { toEmail, audience: invite.audience, topic: invite.topic, durationMinutes: invite.durationMinutes },
      });
    } catch {
      /* audit best-effort */
    }
    return { ok: true };
  } catch (e: unknown) {
    const error = (e as Error)?.message || 'Invite email failed.';
    markBookingInviteEmail(invite.id, { status: 'failed', error });
    return { ok: false, error };
  }
}
