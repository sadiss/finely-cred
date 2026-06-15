import type { CalendarEvent } from '../domain/calendar';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toIcsUtc(iso: string) {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = pad2(d.getUTCMonth() + 1);
  const day = pad2(d.getUTCDate());
  const hh = pad2(d.getUTCHours());
  const mm = pad2(d.getUTCMinutes());
  const ss = pad2(d.getUTCSeconds());
  return `${y}${m}${day}T${hh}${mm}${ss}Z`;
}

function escIcs(s: string) {
  return (s || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function calendarEventToIcs(ev: CalendarEvent) {
  const uid = `${ev.id}@finelycred.local`;
  const dtStart = toIcsUtc(ev.startAt);
  const dtEnd = toIcsUtc(ev.endAt);
  const dtStamp = toIcsUtc(new Date().toISOString());
  const summary = escIcs(ev.title);
  const description = escIcs(ev.description || '');
  const location = escIcs(ev.location || '');
  const url = escIcs(ev.meetingUrl || '');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FinelyCred//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : '',
    location ? `LOCATION:${location}` : '',
    url ? `URL:${url}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n') + '\r\n';
}

