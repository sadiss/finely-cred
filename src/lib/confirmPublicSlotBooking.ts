import {
  createPublicAppointmentRequest,
  scheduleEventFromPublicRequest,
} from '../data/calendarRepo';
import type { CalendarEvent, ConsultationTopic, SlotDuration } from '../domain/calendar';
import { formatSlotRange, type BookableSlot } from './calendarSlots';
import { assertSlotBookable } from './meetingEmailGuards';
import { buildGuestMeetingJoinPath } from './meetingUrls';
import { getPublicSiteOrigin } from './funnelPublicLinks';
import { sendMeetingInviteEmail } from './meetingInviteEmailSend';
import { isFeatureEnabled } from '../data/settingsRepo';
import { pickRoundRobinAssignee } from './calendarStaffRotation';

export type ConfirmPublicSlotBookingResult = {
  requestId: string;
  event: CalendarEvent;
  joinPath: string;
  confirmedLabel: string;
};

/**
 * Shared instant-confirm pipeline (Phase 4 "Booking overhaul"). This is the same
 * create-request → schedule-confirmed-event → best-effort email flow originally built
 * for `/book/i/:token` self-book invites — generalized so every public booking surface
 * (main booking page, funnel inline booking, invite links) confirms immediately
 * instead of filing a "team will follow up" request.
 */
export async function confirmPublicSlotBooking(args: {
  topic: ConsultationTopic;
  fullName: string;
  email: string;
  phone?: string;
  agenda?: string;
  notes?: string;
  selectedSlot: BookableSlot;
  durationMinutes: SlotDuration;
  timezone?: string;
  freeSessionApplied?: boolean;
  sessionPriceCents?: number;
  paymentRequired?: boolean;
  hostName?: string;
  hostRoleLabel?: string;
  scheduleUrl?: string;
  emailPartnerId?: string;
}): Promise<ConfirmPublicSlotBookingResult> {
  assertSlotBookable(args.selectedSlot, args.durationMinutes);
  const tz = args.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const req = createPublicAppointmentRequest({
    topic: args.topic,
    fullName: args.fullName.trim(),
    email: args.email.trim(),
    phone: args.phone?.trim() || undefined,
    preferredSlotMinutes: args.durationMinutes,
    availabilityNotes: `Instant-booked: ${formatSlotRange(args.selectedSlot.startAt, args.selectedSlot.endAt)}`,
    selectedSlotStartAt: args.selectedSlot.startAt,
    selectedSlotEndAt: args.selectedSlot.endAt,
    timezone: tz,
    meetingAgenda: args.agenda?.trim() || undefined,
    notes: args.notes,
    freeSessionApplied: args.freeSessionApplied,
    sessionPriceCents: args.sessionPriceCents,
    paymentRequired: args.paymentRequired,
  });

  const confirmed = await confirmScheduledEventForRequest({
    requestId: req.id,
    startAt: args.selectedSlot.startAt,
    endAt: args.selectedSlot.endAt,
    durationMinutes: args.durationMinutes,
    fullName: args.fullName,
    email: args.email,
    agenda: args.agenda,
    timezone: tz,
    hostName: args.hostName,
    hostRoleLabel: args.hostRoleLabel,
    scheduleUrl: args.scheduleUrl,
    emailPartnerId: args.emailPartnerId,
  });

  return { requestId: req.id, ...confirmed };
}

/**
 * Confirms an event for a request that already exists (e.g. after a Stripe payment
 * redirect, where the slot/details were captured before checkout). Also used
 * internally by `confirmPublicSlotBooking` above.
 */
export async function confirmScheduledEventForRequest(args: {
  requestId: string;
  startAt: string;
  endAt: string;
  durationMinutes?: SlotDuration;
  fullName: string;
  email: string;
  agenda?: string;
  timezone?: string;
  hostName?: string;
  hostRoleLabel?: string;
  scheduleUrl?: string;
  emailPartnerId?: string;
}): Promise<{ event: CalendarEvent; joinPath: string; confirmedLabel: string }> {
  const ev = scheduleEventFromPublicRequest({
    requestId: args.requestId,
    startAt: args.startAt,
    endAt: args.endAt,
    slotDurationMinutes: args.durationMinutes,
    confirm: true,
  });
  if (!ev) throw new Error('Could not confirm that slot — it may no longer be available. Pick another time.');

  const joinPath = buildGuestMeetingJoinPath(ev.id);
  const confirmedLabel = formatSlotRange(args.startAt, args.endAt);
  const tz = args.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const roundRobinHost = pickRoundRobinAssignee();
  const resolvedHostName = args.hostName || roundRobinHost?.displayName || 'Alex Rivera';
  const resolvedHostRole = args.hostRoleLabel || roundRobinHost?.roleLabel || 'Session Coordinator';

  if (isFeatureEnabled('commsDelivery')) {
    try {
      const origin = getPublicSiteOrigin();
      await sendMeetingInviteEmail({
        partnerId: args.emailPartnerId || 'admin_growth',
        toEmail: args.email.trim(),
        toName: args.fullName.trim(),
        title: ev.title,
        joinUrl: `${origin}${joinPath}?name=${encodeURIComponent(args.fullName.trim())}`,
        startAt: ev.startAt,
        endAt: ev.endAt,
        timezone: tz,
        agenda: args.agenda?.trim() || undefined,
        hostName: resolvedHostName,
        hostRoleLabel: resolvedHostRole,
        scheduleUrl: args.scheduleUrl,
        intent: 'booking_confirm',
      });
    } catch {
      // Best-effort — the booking is already confirmed regardless of email delivery.
    }
  }

  return { event: ev, joinPath, confirmedLabel };
}
