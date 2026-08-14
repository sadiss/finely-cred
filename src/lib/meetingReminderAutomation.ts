/**
 * Meeting reminder hooks — email + SMS when Comms Delivery is on.
 * Runs on calendar page load (local-first); mirrors server cron later.
 *
 * Frequency-cap decision (A5): reminder SMS intentionally stays on its own
 * `SMS_SENT_KEY`/`eventId` de-dupe below and does NOT call the shared
 * `isOverFrequencyCap`/`recordSendForFrequencyCap` marketing-cadence cap — a
 * meeting reminder is time-bound to one confirmed event, not discretionary
 * outreach, so it must still fire even if the same partner already received a
 * marketing/sequence send today. `resolveFrequencyCapKey` (commsSuppressionRepo.ts)
 * is available if this decision is ever revisited.
 */
import { listCalendarEvents, sendUpcomingReminders } from '../data/calendarRepo';
import { isFeatureEnabled } from '../data/settingsRepo';
import { isSupabaseConfigured } from './supabaseClient';
import { sendMeetingInviteEmail } from './meetingInviteEmailSend';
import { sendSms } from './commsDeliveryClient';
import { getPartnerSync } from '../data/partnersRepo';
import { buildGuestMeetingJoinPath } from './meetingUrls';
import { getPublicSiteOrigin } from './funnelPublicLinks';
import { loadJson, saveJson } from '../data/localJsonStore';

const SMS_SENT_KEY = 'finely.meeting_sms_reminders.v1';

type SmsSentRow = { eventId: string; sentAt: string };

function listSmsSent(): SmsSentRow[] {
  return loadJson<SmsSentRow[]>(SMS_SENT_KEY, [], 1);
}

function markSmsSent(eventId: string) {
  const next = [{ eventId, sentAt: new Date().toISOString() }, ...listSmsSent()].slice(0, 300);
  saveJson(SMS_SENT_KEY, next, 1);
}

function extractPhoneFromDescription(desc?: string): string | undefined {
  if (!desc) return undefined;
  const m = desc.match(/Phone:\s*([+\d()\-\s]{10,})/i);
  return m?.[1]?.trim();
}

export type MeetingReminderRunResult = {
  inAppReminders: number;
  emailsSent: number;
  smsSent: number;
  skipped: number;
  errors: string[];
};

/** Process upcoming meetings — in-app notifications + optional email/SMS. */
export async function runMeetingReminderAutomation(args?: {
  withinHours?: number;
  now?: Date;
}): Promise<MeetingReminderRunResult> {
  const withinHours = Math.max(1, Math.round(args?.withinHours ?? 24));
  const now = args?.now ?? new Date();
  const nowMs = now.getTime();
  const cutoff = nowMs + withinHours * 60 * 60 * 1000;

  const inAppReminders = sendUpcomingReminders({ withinHours, now });

  const result: MeetingReminderRunResult = {
    inAppReminders,
    emailsSent: 0,
    smsSent: 0,
    skipped: 0,
    errors: [],
  };

  if (!isFeatureEnabled('commsDelivery') || !isSupabaseConfigured) {
    return result;
  }

  const smsSentIds = new Set(listSmsSent().map((r) => r.eventId));
  const events = listCalendarEvents().filter((ev) => {
    if (ev.status !== 'confirmed') return false;
    const startMs = Date.parse(ev.startAt);
    if (!Number.isFinite(startMs)) return false;
    if (startMs < nowMs || startMs > cutoff) return false;
    return true;
  });

  const origin = getPublicSiteOrigin();

  for (const ev of events) {
    const partner = getPartnerSync(ev.partnerId);
    const isPublicGuest = ev.partnerId.startsWith('public:');
    const email =
      partner?.profile.email ||
      (isPublicGuest ? ev.description?.match(/Email:\s*(\S+@\S+)/i)?.[1] : undefined);
    const phone = partner?.profile.phone || extractPhoneFromDescription(ev.description);
    const name = partner?.profile.fullName || 'Partner';
    const joinUrl = `${origin}${buildGuestMeetingJoinPath(ev.id)}`;

    if (!email && !phone) {
      result.skipped++;
      continue;
    }

    if (email && !ev.reminderSentAt) {
      try {
        const res = await sendMeetingInviteEmail({
          partnerId: ev.partnerId,
          toEmail: email,
          toName: name,
          title: `Reminder: ${ev.title}`,
          joinUrl,
          startAt: ev.startAt,
          endAt: ev.endAt,
          hostName: 'Finely Cred',
          hostRoleLabel: 'Session Coordinator',
          agenda: 'Your session is coming up — tap Join meeting (audio-first room).',
        });
        if (res.ok) result.emailsSent++;
        else result.errors.push(res.error || 'Email failed');
      } catch (e: unknown) {
        result.errors.push((e as Error)?.message || 'Email failed');
      }
    }

    if (phone && !smsSentIds.has(ev.id)) {
      try {
        const when = new Date(ev.startAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
        await sendSms({
          toPhone: phone,
          body: `Finely Cred reminder: ${ev.title} at ${when}. Join: ${joinUrl}`,
        });
        markSmsSent(ev.id);
        result.smsSent++;
      } catch (e: unknown) {
        result.errors.push((e as Error)?.message || 'SMS failed');
      }
    }
  }

  return result;
}
