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
};

/** Rich embed URL — Daily room path or Jitsi with prejoin + display name. */
export function buildFinelyMeetingEmbedUrl(opts: MeetingEmbedOptions): string {
  const domain = dailyDomain();
  if (domain) {
    // Daily prebuilt — user name via query is limited; room URL is enough for join.
    return `https://${domain}/${encodeURIComponent(opts.roomName)}`;
  }
  const base = `https://meet.jit.si/${encodeURIComponent(opts.roomName)}`;
  const params = new URLSearchParams();
  params.set('config.prejoinPageEnabled', 'true');
  params.set('config.startWithAudioMuted', String(opts.startWithAudioMuted ?? false));
  params.set('config.startWithVideoMuted', String(opts.startWithVideoMuted ?? false));
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

/** Legacy helper — append display name to existing URL */
export function appendDisplayNameToMeetingUrl(url: string, displayName: string): string {
  if (/daily\.co\//i.test(url) || dailyDomain()) return url;
  const sep = url.includes('#') ? '&' : '#';
  return `${url}${sep}userInfo.displayName=${encodeURIComponent(displayName)}`;
}
