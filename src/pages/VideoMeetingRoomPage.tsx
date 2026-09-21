import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { listCalendarEvents } from '../data/calendarRepo';
import { MeetingPreJoinLobby } from '../components/meeting/MeetingPreJoinLobby';
import { FinelyJitsiMeetingRoom } from '../components/meeting/FinelyJitsiMeetingRoom';
import { MeetingPipelineKeepAlive } from '../components/meeting/MeetingPipelineKeepAlive';
import { hasLobbyVisualEffects } from '../lib/meetingVideoQuality';
import { buildGuestMeetingJoinPath, meetingRoomName } from '../lib/meetingUrls';
import type { MeetingHostContext } from '../lib/meetingVideoPrefs';
import type { MeetingVideoPrefs } from '../lib/meetingVideoQuality';
import { useAuth } from '../auth/AuthProvider';

/** Authenticated host room — academy huddles & lounge. */
export default function VideoMeetingRoomPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const ctx = (searchParams.get('ctx') as MeetingHostContext) || 'lounge';
  const lang = searchParams.get('lang') === 'ht' ? 'ht' : 'en';
  const [displayName, setDisplayName] = useState(() => auth.user?.email?.split('@')[0] || 'Host');
  const [joined, setJoined] = useState(false);
  const [joinPrefs, setJoinPrefs] = useState<MeetingVideoPrefs | null>(null);
  const [outboundStream, setOutboundStream] = useState<MediaStream | null>(null);

  const event = useMemo(() => {
    if (!eventId) return null;
    return listCalendarEvents().find((e) => e.id === eventId) ?? null;
  }, [eventId]);

  const hostContext: MeetingHostContext =
    ctx === 'academy_huddle' ? 'academy_huddle' : ctx === 'admin' ? 'admin' : 'lounge';

  if (!eventId) {
    return (
      <PageShell title="Meeting" subtitle="Missing event">
        <p className="text-white/60">No event id.</p>
      </PageShell>
    );
  }

  const room = meetingRoomName(eventId);
  const guestPath = buildGuestMeetingJoinPath(eventId);

  const onJoin = (prefs: MeetingVideoPrefs, stream: MediaStream | null) => {
    setJoinPrefs(prefs);
    setOutboundStream(hasLobbyVisualEffects(prefs) ? null : stream);
    setJoined(true);
  };

  return (
    <PageShell
      badge="Host room"
      title={event?.title ?? 'Video huddle'}
      subtitle="Host pre-join defaults for Specialist Lounge & academy huddles."
    >
      <div className="max-w-5xl mx-auto space-y-4">
        <p className="text-white/50 text-xs">
          Guest link (no signup):{' '}
          <button type="button" className="text-sky-300 underline" onClick={() => navigate(guestPath)}>
            {guestPath}
          </button>
        </p>
        {!joined ? (
          <MeetingPreJoinLobby
            lang={lang}
            hostContext={hostContext}
            displayName={displayName}
            onDisplayNameChange={setDisplayName}
            onJoin={onJoin}
            joinLabel={lang === 'ht' ? 'Kòmanse kòm host' : 'Join as host'}
          />
        ) : null}
        {joined && joinPrefs && hasLobbyVisualEffects(joinPrefs) ? (
          <MeetingPipelineKeepAlive prefs={joinPrefs} onStream={setOutboundStream} />
        ) : null}
        {joined && joinPrefs ? (
          <FinelyJitsiMeetingRoom
            roomName={room}
            displayName={displayName.trim()}
            subject={event?.title}
            email={auth.user?.email}
            prefs={joinPrefs}
            outboundStream={outboundStream}
            onLeave={() => navigate('/admin/specialist-lounge')}
          />
        ) : null}
      </div>
    </PageShell>
  );
}
