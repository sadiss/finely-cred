/**
 * Guards for automated meeting invite emails — prevents spurious sends on deploy,
 * CRM stage moves, or outreach to internal staff without a real booked slot.
 */
import { isAdminEmail } from '../auth/admin';
import { getPartnerSync } from '../data/partnersRepo';
import { getCalendarBookingSettings } from '../data/calendarSettingsRepo';
import { generateDaySlots, type BookableSlot } from './calendarSlots';
import { listCalendarEvents } from '../data/calendarRepo';

export type MeetingInviteIntent = 'manual' | 'booking_confirm' | 'reminder' | 'outreach' | 'handoff';

const FINELY_INTERNAL_DOMAIN = '@finelycred.com';

export function isInternalStaffEmail(email?: string | null): boolean {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized.includes('@')) return false;
  if (isAdminEmail(normalized)) return true;
  return normalized.endsWith(FINELY_INTERNAL_DOMAIN);
}

/** Block automated meeting emails to staff inboxes unless sent manually from admin UI. */
export function guardAutomatedMeetingEmail(args: {
  intent: MeetingInviteIntent;
  toEmail?: string;
  partnerId?: string;
  startAt?: string;
  endAt?: string;
  joinUrl?: string;
}): { ok: true } | { ok: false; reason: string } {
  if (args.intent === 'manual') return { ok: true };

  const partner = args.partnerId ? getPartnerSync(args.partnerId) : null;
  const resolvedEmail = (args.toEmail || partner?.profile.email || '').trim().toLowerCase();

  if (resolvedEmail && isInternalStaffEmail(resolvedEmail)) {
    return { ok: false, reason: 'Internal staff email — automated meeting invite blocked.' };
  }

  if (args.intent === 'handoff') {
    return {
      ok: false,
      reason: 'Booked handoff must not send calendar invites — confirm only after a scheduled slot exists.',
    };
  }

  if (args.intent === 'outreach') {
    // Outreach sends self-book links, not confirmed sessions — allowed without startAt.
    return { ok: true };
  }

  if (args.intent === 'booking_confirm' || args.intent === 'reminder') {
    if (!args.startAt || !args.endAt) {
      return { ok: false, reason: 'Meeting invite requires a confirmed start and end time.' };
    }
    const startMs = Date.parse(args.startAt);
    const endMs = Date.parse(args.endAt);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return { ok: false, reason: 'Invalid meeting time window.' };
    }
  }

  return { ok: true };
}

/** Validate a slot still meets lead-time and availability rules before instant confirm. */
export function assertSlotBookable(slot: BookableSlot, durationMinutes?: BookableSlot['durationMinutes']): void {
  const settings = getCalendarBookingSettings();
  const events = listCalendarEvents();
  const open = generateDaySlots({
    dayKey: slot.dayKey,
    durationMinutes: durationMinutes ?? slot.durationMinutes,
    existingEvents: events,
    settings,
  });
  const stillOpen = open.some((s) => s.startAt === slot.startAt && s.endAt === slot.endAt);
  if (!stillOpen) {
    throw new Error('That time is no longer available — pick another slot (24h+ lead time required).');
  }
}
