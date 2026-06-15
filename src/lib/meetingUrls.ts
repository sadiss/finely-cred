/** Build a stable Finely video room URL (Jitsi Meet — no API key required). */
export function buildFinelyMeetingUrl(eventId: string, title?: string): string {
  const slug = meetingRoomName(eventId);
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

/** Rich Jitsi embed URL with prejoin, display name, optional room password. */
export function buildFinelyMeetingEmbedUrl(opts: MeetingEmbedOptions): string {
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
  const sep = url.includes('#') ? '&' : '#';
  return `${url}${sep}userInfo.displayName=${encodeURIComponent(displayName)}`;
}
