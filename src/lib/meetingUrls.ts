/**
 * Finely video room URLs — Jitsi default; Daily when VITE_DAILY_DOMAIN is set.
 */

function dailyDomain(): string {
  try {
    const raw = String(import.meta.env.VITE_DAILY_DOMAIN || '').trim();
    if (!raw) return '';
    return raw.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  } catch {
    return '';
  }
}

export function meetingProviderLabel(): 'daily' | 'jitsi' {
  return dailyDomain() ? 'daily' : 'jitsi';
}

export function meetingRoomName(eventId: string): string {
  return `FinelyCred-${eventId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`;
}

export function buildFinelyMeetingUrl(eventId: string, title?: string): string {
  const slug = meetingRoomName(eventId);
  const domain = dailyDomain();
  if (domain) {
    const q = title ? `?t=${encodeURIComponent(title.slice(0, 80))}` : '';
    return `https://${domain}/${encodeURIComponent(slug)}${q}`;
  }
  const room = encodeURIComponent(slug);
  const subject = title ? `#config.subject=${encodeURIComponent(title)}` : '';
  return `https://meet.jit.si/${room}${subject}`;
}

export type MeetingEmbedOptions = {
  roomName: string;
  displayName: string;
  email?: string;
  subject?: string;
  audioFirst?: boolean;
  startWithAudioMuted?: boolean;
  startWithVideoMuted?: boolean;
};

export function buildFinelyMeetingEmbedUrl(opts: MeetingEmbedOptions): string {
  const audioFirst = Boolean(opts.audioFirst);
  const startWithVideoMuted = opts.startWithVideoMuted ?? (audioFirst ? true : false);
  const startWithAudioMuted = opts.startWithAudioMuted ?? false;

  const domain = dailyDomain();
  if (domain) {
    const q = new URLSearchParams();
    if (audioFirst) {
      q.set('startVideoOff', 'true');
      q.set('startAudioOff', 'false');
    }
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return `https://${domain}/${encodeURIComponent(opts.roomName)}${suffix}`;
  }

  const base = `https://meet.jit.si/${encodeURIComponent(opts.roomName)}`;
  const params = new URLSearchParams();
  params.set('config.prejoinPageEnabled', 'false');
  params.set('config.startWithAudioMuted', String(startWithAudioMuted));
  params.set('config.startWithVideoMuted', String(startWithVideoMuted));
  params.set('config.disableDeepLinking', 'true');
  params.set('config.enableWelcomePage', 'false');
  params.set('config.defaultLanguage', 'en');
  if (opts.subject) params.set('config.subject', opts.subject);
  params.set('userInfo.displayName', opts.displayName);
  if (opts.email) params.set('userInfo.email', opts.email);
  return `${base}#${params.toString()}`;
}

export function buildGuestMeetingJoinPath(eventId: string): string {
  return `/meet/${encodeURIComponent(eventId)}`;
}

export function buildGuestMeetingEmbedUrl(opts: Omit<MeetingEmbedOptions, 'audioFirst'>): string {
  return buildFinelyMeetingEmbedUrl({ ...opts, audioFirst: true });
}

/** Jitsi domain for External API embed (Finely pre-join owns lobby). */
export function jitsiMeetDomain(): string {
  const custom = String(import.meta.env.VITE_JITSI_DOMAIN || '').trim();
  if (custom) return custom.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  return 'meet.jit.si';
}
