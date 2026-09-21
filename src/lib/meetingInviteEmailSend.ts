/**
 * Meeting emails via existing send-email + commsDelivery flag. ICS appended in text body.
 */
import { isFeatureEnabled } from '../data/settingsRepo';
import { isSupabaseConfigured } from './supabaseClient';
import { sendEmail } from './commsDeliveryClient';
import {
  buildMeetingCancelEmail,
  buildMeetingInviteEmail,
  buildMeetingIcs,
  buildMeetingRescheduleEmail,
  defaultGuestJoinUrl,
  type MeetingInviteEmailArgs,
} from '../comms/meetingInviteEmail';
import { loadJson, saveJson } from '../data/localJsonStore';
import { newId } from '../utils/ids';

export type MeetingEmailIntent = 'booking_confirm' | 'reminder' | 'cancel' | 'reschedule';

const KEY = 'finely.meeting_email_log.v1';

type LogRow = { id: string; intent: MeetingEmailIntent; toEmail: string; eventId?: string; at: string; ok: boolean };

function logRow(row: LogRow) {
  const list = loadJson<LogRow[]>(KEY, [], 1);
  saveJson(KEY, [row, ...list].slice(0, 100), 1);
}

export async function sendMeetingLifecycleEmail(args: {
  intent: MeetingEmailIntent;
  toEmail: string;
  guestName: string;
  eventId: string;
  title: string;
  startAt?: string;
  endAt?: string;
  timezone?: string;
  agenda?: string;
  hostName?: string;
  joinUrl?: string;
  scheduleUrl?: string;
  previousStartAt?: string;
  cancelReason?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isFeatureEnabled('commsDelivery')) {
    return { ok: false, error: 'Comms delivery disabled (Feature Flags).' };
  }
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase not configured.' };
  }

  const toEmail = args.toEmail.trim().toLowerCase();
  if (!toEmail.includes('@')) return { ok: false, error: 'Invalid recipient email.' };

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://finelycred.com';
  const joinUrl = args.joinUrl || defaultGuestJoinUrl(args.eventId, origin);
  const base: MeetingInviteEmailArgs = {
    guestName: args.guestName,
    hostName: args.hostName,
    title: args.title,
    startAt: args.startAt,
    endAt: args.endAt,
    timezone: args.timezone,
    agenda: args.agenda,
    joinUrl,
    scheduleUrl: args.scheduleUrl || `${origin}/consultation`,
  };

  let content: { subject: string; text: string };
  let icsMethod: 'PUBLISH' | 'CANCEL' = 'PUBLISH';

  if (args.intent === 'cancel') {
    content = buildMeetingCancelEmail({ ...base, reason: args.cancelReason });
    icsMethod = 'CANCEL';
  } else if (args.intent === 'reschedule') {
    content = buildMeetingRescheduleEmail({ ...base, previousStartAt: args.previousStartAt });
  } else {
    content = buildMeetingInviteEmail(base);
  }

  const ics = buildMeetingIcs({
    title: args.title,
    startAt: args.startAt,
    endAt: args.endAt,
    description: [args.agenda, `Join: ${joinUrl}`].filter(Boolean).join('\n'),
    location: joinUrl,
    uid: `${args.eventId}@finelycred.com`,
    method: icsMethod,
  });

  const text = ics ? `${content.text}\n\n--- Calendar (ICS) ---\n${ics}` : content.text;

  try {
    await sendEmail({ toEmail, toName: args.guestName, subject: content.subject, text });
    logRow({ id: newId('mel'), intent: args.intent, toEmail, eventId: args.eventId, at: new Date().toISOString(), ok: true });
    return { ok: true };
  } catch (e: unknown) {
    const error = (e as Error)?.message || 'Send failed';
    logRow({ id: newId('mel'), intent: args.intent, toEmail, eventId: args.eventId, at: new Date().toISOString(), ok: false });
    return { ok: false, error };
  }
}

/** Extract guest email from public event description (scheduled from public request). */
export function extractGuestEmailFromEventDescription(description?: string): string | null {
  const m = String(description || '').match(/Email:\s*([^\s\n]+@[^\s\n]+)/i);
  return m?.[1]?.trim().toLowerCase() ?? null;
}
