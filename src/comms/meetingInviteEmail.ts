import { buildFinelyMeetingUrl, buildGuestMeetingJoinPath } from '../lib/meetingUrls';

export type MeetingInviteEmailArgs = {
  guestName: string;
  hostName?: string;
  title: string;
  startAt?: string;
  endAt?: string;
  timezone?: string;
  agenda?: string;
  joinUrl: string;
  scheduleUrl?: string;
};

export function buildMeetingIcs(args: {
  title: string;
  startAt?: string;
  endAt?: string;
  description?: string;
  location?: string;
  uid?: string;
  method?: 'PUBLISH' | 'CANCEL';
}): string | undefined {
  if (!args.startAt) return undefined;
  const start = new Date(args.startAt);
  if (Number.isNaN(start.getTime())) return undefined;
  const end = args.endAt ? new Date(args.endAt) : new Date(start.getTime() + 60 * 60 * 1000);
  const stamp = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z');
  const uid = args.uid || `finely-meet-${stamp(start)}@finelycred.com`;
  const method = args.method || 'PUBLISH';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Finely Cred//Meeting//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${(args.title || 'Finely meeting').replace(/\n/g, ' ')}`,
    method === 'CANCEL' ? 'STATUS:CANCELLED' : '',
    args.description ? `DESCRIPTION:${args.description.replace(/\n/g, '\\n')}` : '',
    args.location ? `LOCATION:${args.location.replace(/\n/g, ' ')}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.join('\r\n');
}

function fmtWhen(iso?: string, tz?: string): string {
  if (!iso) return 'To be confirmed';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short', timeZone: tz || undefined });
  } catch {
    return iso;
  }
}

export function buildMeetingInviteEmail(args: MeetingInviteEmailArgs) {
  const when = fmtWhen(args.startAt, args.timezone);
  const subject = `Meeting invite: ${args.title} — ${when}`;
  const text = [
    `Hi ${args.guestName},`,
    '',
    `Meeting: ${args.title}`,
    `When: ${when}`,
    args.agenda ? `Agenda: ${args.agenda}` : '',
    '',
    `Join: ${args.joinUrl}`,
    args.scheduleUrl ? `Reschedule: ${args.scheduleUrl}` : '',
    '',
    'Educational guidance · not legal advice',
  ]
    .filter(Boolean)
    .join('\n');
  return { subject, text };
}

export function buildMeetingCancelEmail(args: MeetingInviteEmailArgs & { reason?: string }) {
  const when = fmtWhen(args.startAt, args.timezone);
  const subject = `Cancelled: ${args.title} — ${when}`;
  const text = [
    `Hi ${args.guestName},`,
    '',
    `Your Finely Cred meeting "${args.title}" scheduled for ${when} has been **cancelled**.`,
    args.reason ? `Reason: ${args.reason}` : '',
    args.scheduleUrl ? `Book a new time: ${args.scheduleUrl}` : '',
    '',
    'Educational guidance · not legal advice',
  ]
    .filter(Boolean)
    .join('\n');
  return { subject, text };
}

export function buildMeetingRescheduleEmail(args: MeetingInviteEmailArgs & { previousStartAt?: string }) {
  const when = fmtWhen(args.startAt, args.timezone);
  const prev = args.previousStartAt ? fmtWhen(args.previousStartAt, args.timezone) : 'the prior slot';
  const subject = `Rescheduled: ${args.title} — ${when}`;
  const text = [
    `Hi ${args.guestName},`,
    '',
    `Your meeting "${args.title}" moved from ${prev} to **${when}**.`,
    '',
    `Join: ${args.joinUrl}`,
    args.scheduleUrl ? `Need another time? ${args.scheduleUrl}` : '',
    '',
    'Educational guidance · not legal advice',
  ]
    .filter(Boolean)
    .join('\n');
  return { subject, text };
}

export function defaultGuestJoinUrl(eventId: string, origin: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}${buildGuestMeetingJoinPath(eventId)}`;
}

export function defaultRoomJoinUrl(eventId: string, title?: string): string {
  return buildFinelyMeetingUrl(eventId, title);
}
