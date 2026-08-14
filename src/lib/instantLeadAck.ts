/**
 * Instant SMS acknowledgment for client-captured leads (Phase N1). Parallel in
 * shape to `sendImmediateWelcomeEmail` (`funnelEmail.ts`) — same gating pattern
 * (consent, feature flag, Supabase configured), plus the unified suppression
 * check every send path in this codebase must call before dispatching
 * (`commsSuppressionRepo.ts`). No frequency-cap check here: this is the very
 * first touch on a brand-new lead, not a cadence step that could pile on top
 * of other outreach.
 *
 * Gives the lead a real next action (a booking link) rather than a bare
 * "thanks for reaching out" — reuses the same booking-invite + public-origin
 * pattern already used by `alexAppointmentAutomation.ts`.
 */
import type { LeadCapture } from '../domain/leads';
import { sendSms } from './commsDeliveryClient';
import { isFeatureEnabled } from '../data/settingsRepo';
import { isSupabaseConfigured } from './supabaseClient';
import { checkSuppression } from '../data/commsSuppressionRepo';
import { buildBookingInvitePath, createBookingInvite, listBookingInvites } from '../data/bookingInviteRepo';
import { getPublicSiteOrigin } from './funnelPublicLinks';
import { markLeadFirstTouch } from './leadFirstTouchTracking';

function firstName(fullName?: string): string {
  const trimmed = (fullName || '').trim();
  if (!trimmed) return 'there';
  return trimmed.split(/\s+/)[0];
}

function bookingUrlForLead(lead: LeadCapture): string {
  const existingInvite = listBookingInvites().find((i) => i.status === 'active' && i.leadId === lead.id);
  const invite =
    existingInvite ??
    createBookingInvite({
      label: `Instant ack — ${lead.fullName || lead.id}`,
      topic: 'enlightenment',
      durationMinutes: 30,
      leadId: lead.id,
      guestName: lead.fullName,
      guestEmail: lead.email,
      guestPhone: lead.phone,
      maxUses: 3,
    });
  return `${getPublicSiteOrigin()}${buildBookingInvitePath(invite.token)}`;
}

export async function sendImmediateWelcomeSms(args: { lead: LeadCapture }): Promise<{ sent: boolean; reason?: string }> {
  const phone = (args.lead.phone || '').trim();
  if (!phone) return { sent: false, reason: 'no_phone' };

  if (!args.lead.consentToContact || !args.lead.consentSmsMarketing) {
    return { sent: false, reason: 'no_consent' };
  }

  if (!isFeatureEnabled('commsDelivery') || !isSupabaseConfigured) {
    return { sent: false, reason: 'comms_not_configured' };
  }

  const suppression = checkSuppression({ phone, channel: 'sms' });
  if (suppression.suppressed) {
    return { sent: false, reason: `suppressed_${suppression.reason}` };
  }

  try {
    const bookUrl = bookingUrlForLead(args.lead);
    await sendSms({
      toPhone: phone,
      body: `Hi ${firstName(args.lead.fullName)}, it's Finely Cred! Grab a free strategy session here: ${bookUrl} Reply STOP to opt out.`,
    });

    void markLeadFirstTouch(args.lead.id, 'sms');
    return { sent: true };
  } catch (e: unknown) {
    return { sent: false, reason: (e as Error)?.message || 'send_failed' };
  }
}
