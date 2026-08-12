/**
 * Finely video room URLs.
 *
 * Default: Jitsi (meet.jit.si) — no API key.
 * Upgrade: set VITE_DAILY_DOMAIN (and optionally create rooms via Daily REST with DAILY_API_KEY on edge).
 * Daily.co gives higher A/V quality when configured; falls back to Jitsi automatically.
 */

function dailyDomain(): string {
  try {
    const raw = String((import.meta as any)?.env?.VITE_DAILY_DOMAIN || '').trim();
    if (!raw) return '';
    return raw.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  } catch {
    return '';
  }
}

export function meetingProviderLabel(): 'daily' | 'jitsi' {
  return dailyDomain() ? 'daily' : 'jitsi';
}

/** Build a stable Finely video room URL (Daily when configured, else Jitsi). */
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

export function meetingRoomName(eventId: string): string {
  return `FinelyCred-${eventId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`;
}

export type MeetingEmbedOptions = {
  roomName: string;
  displayName: string;
  email?: string;
  subject?: string;
  roomPassword?: string;
  startWithAudioMuted?: boolean;
  startWithVideoMuted?: boolean;
  /** Audio-first guest join — mic on, camera off by default */
  audioFirst?: boolean;
};

/** Rich embed URL — Daily room path or Jitsi with prejoin + display name. */
export function buildFinelyMeetingEmbedUrl(opts: MeetingEmbedOptions): string {
  const audioFirst = Boolean(opts.audioFirst);
  const startWithAudioMuted = opts.startWithAudioMuted ?? false;
  const startWithVideoMuted = opts.startWithVideoMuted ?? (audioFirst ? true : false);

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
  params.set('config.prejoinPageEnabled', 'true');
  params.set('config.startWithAudioMuted', String(startWithAudioMuted));
  params.set('config.startWithVideoMuted', String(startWithVideoMuted));
  params.set('config.disableDeepLinking', 'true');
  params.set('config.enableWelcomePage', 'false');
  params.set('config.defaultLanguage', 'en');
  if (opts.subject) params.set('config.subject', opts.subject);
  if (opts.roomPassword) {
    params.set('config.roomPassword', opts.roomPassword);
    params.set('config.enableLobby', 'true');
  }
  params.set('userInfo.displayName', opts.displayName);
  if (opts.email) params.set('userInfo.email', opts.email);
  return `${base}#${params.toString()}`;
}

/** Public guest join path — audio-first, no portal login required */
export function buildGuestMeetingJoinPath(eventId: string): string {
  return `/meet/${encodeURIComponent(eventId)}`;
}

/** Audio-first embed for public guest routes */
export function buildGuestMeetingEmbedUrl(opts: Omit<MeetingEmbedOptions, 'audioFirst'>): string {
  return buildFinelyMeetingEmbedUrl({ ...opts, audioFirst: true });
}

/** Legacy helper — append display name to existing URL */
export function appendDisplayNameToMeetingUrl(url: string, displayName: string): string {
  if (/daily\.co\//i.test(url) || dailyDomain()) return url;
  const sep = url.includes('#') ? '&' : '#';
  return `${url}${sep}userInfo.displayName=${encodeURIComponent(displayName)}`;
}
