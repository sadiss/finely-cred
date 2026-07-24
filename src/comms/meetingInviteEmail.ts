/**
 * Premium Finely Cred meeting invite HTML email.
 * Partner terminology · one obvious Join / Schedule CTA · calendar-friendly links (no paid deps).
 */
import {
  buildPrimaryCtaButton,
  buildSecondaryCtaLink,
  wrapFinelyEmailHtml,
  FINELY_EMAIL,
} from './prebuiltHtmlEmailLayout';
import { getPublicSiteOrigin } from '../lib/funnelPublicLinks';

export type MeetingInviteEmailArgs = {
  partnerName: string;
  hostName?: string;
  hostRoleLabel?: string;
  title: string;
  /** ISO start */
  startAt?: string;
  /** ISO end */
  endAt?: string;
  timezone?: string;
  agenda?: string;
  /** Absolute or path join URL */
  joinUrl: string;
  /** Optional schedule / reschedule path */
  scheduleUrl?: string;
  previewText?: string;
};

function esc(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtWhen(iso?: string, tz?: string): string {
  if (!iso) return 'To be confirmed';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: tz || undefined,
    });
  } catch {
    return iso;
  }
}

/** Google Calendar deep link (no API key). */
export function buildGoogleCalendarUrl(args: {
  title: string;
  startAt?: string;
  endAt?: string;
  details?: string;
  location?: string;
}): string | undefined {
  if (!args.startAt) return undefined;
  const start = new Date(args.startAt);
  if (Number.isNaN(start.getTime())) return undefined;
  const end = args.endAt ? new Date(args.endAt) : new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: args.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: args.details || '',
    location: args.location || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Minimal ICS body for mailto / download (no attachment API required). */
export function buildMeetingIcs(args: {
  title: string;
  startAt?: string;
  endAt?: string;
  description?: string;
  location?: string;
  uid?: string;
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
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Finely Cred//Meeting//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${(args.title || 'Finely Cred meeting').replace(/\n/g, ' ')}`,
    args.description ? `DESCRIPTION:${args.description.replace(/\n/g, '\\n')}` : '',
    args.location ? `LOCATION:${args.location.replace(/\n/g, ' ')}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.join('\r\n');
}

export function absolutizeUrl(url: string, origin?: string): string {
  const u = String(url || '').trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  const base = (origin || getPublicSiteOrigin()).replace(/\/$/, '');
  return `${base}${u.startsWith('/') ? u : `/${u}`}`;
}

export function buildMeetingInviteEmail(args: MeetingInviteEmailArgs): {
  subject: string;
  text: string;
  html: string;
  previewText: string;
} {
  const origin = getPublicSiteOrigin();
  const joinUrl = absolutizeUrl(args.joinUrl, origin);
  const scheduleUrl = args.scheduleUrl ? absolutizeUrl(args.scheduleUrl, origin) : undefined;
  const when = fmtWhen(args.startAt, args.timezone);
  const host =
    [args.hostName, args.hostRoleLabel].filter(Boolean).join(' · ') || 'Your Finely Cred care team';
  const partner = args.partnerName.trim() || 'Partner';
  const title = args.title.trim() || 'Finely Cred video meeting';
  const preview =
    args.previewText ||
    `${title} — ${when}. Tap Join meeting to connect with ${host}.`;

  const gcal = buildGoogleCalendarUrl({
    title,
    startAt: args.startAt,
    endAt: args.endAt,
    details: [args.agenda, `Join: ${joinUrl}`].filter(Boolean).join('\n\n'),
    location: joinUrl,
  });

  const subject = args.startAt
    ? `Meeting invite: ${title} — ${when}`
    : `Join your Finely Cred meeting: ${title}`;

  const bodyHtml = `
<p style="margin:0 0 16px;">Hi ${esc(partner)},</p>
<p style="margin:0 0 16px;">You have a video meeting with <strong>${esc(host)}</strong>.</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
  <tr><td style="padding:16px 18px;">
    <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${FINELY_EMAIL.slate500};font-weight:700;">What</div>
    <div style="font-size:16px;font-weight:700;color:${FINELY_EMAIL.slate900};margin-top:4px;">${esc(title)}</div>
    <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${FINELY_EMAIL.slate500};font-weight:700;margin-top:14px;">When</div>
    <div style="font-size:15px;color:${FINELY_EMAIL.slate700};margin-top:4px;">${esc(when)}${args.timezone ? ` <span style="color:${FINELY_EMAIL.slate500}">(${esc(args.timezone)})</span>` : ''}</div>
    <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${FINELY_EMAIL.slate500};font-weight:700;margin-top:14px;">Who</div>
    <div style="font-size:15px;color:${FINELY_EMAIL.slate700};margin-top:4px;">${esc(host)} · with ${esc(partner)}</div>
    ${
      args.agenda
        ? `<div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${FINELY_EMAIL.slate500};font-weight:700;margin-top:14px;">Agenda</div>
    <div style="font-size:14px;color:${FINELY_EMAIL.slate600};margin-top:4px;white-space:pre-wrap;">${esc(args.agenda)}</div>`
        : ''
    }
  </td></tr>
</table>
${buildPrimaryCtaButton({ label: 'Join meeting', href: joinUrl, color: '#0ea5e9' })}
${scheduleUrl ? buildSecondaryCtaLink({ label: 'Need a different time? Open schedule', href: scheduleUrl }) : ''}
${gcal ? buildSecondaryCtaLink({ label: 'Add to Google Calendar', href: gcal }) : ''}
<p style="margin:20px 0 0;font-size:13px;color:${FINELY_EMAIL.slate500};">One tap joins your secure Finely Cred video room. If the button does not work, copy this link:<br/><a href="${esc(joinUrl)}" style="color:${FINELY_EMAIL.violet};word-break:break-all;">${esc(joinUrl)}</a></p>
<p style="margin:16px 0 0;font-size:12px;color:${FINELY_EMAIL.slate500};">Educational guidance · not legal advice · results vary</p>
`;

  const html = wrapFinelyEmailHtml({
    preheader: preview,
    headline: 'Your meeting is ready',
    subheadline: title,
    bodyHtml,
    headerTheme: 'violet',
    origin,
  });

  const text = [
    `Hi ${partner},`,
    '',
    `Meeting: ${title}`,
    `When: ${when}`,
    `Who: ${host}`,
    args.agenda ? `Agenda: ${args.agenda}` : '',
    '',
    `Join: ${joinUrl}`,
    scheduleUrl ? `Schedule / reschedule: ${scheduleUrl}` : '',
    gcal ? `Google Calendar: ${gcal}` : '',
    '',
    'Educational · not legal advice · results vary',
  ]
    .filter(Boolean)
    .join('\n');

  return { subject, text, html, previewText: preview };
}
