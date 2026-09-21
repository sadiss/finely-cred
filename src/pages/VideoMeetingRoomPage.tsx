import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { listCalendarEvents } from '../data/calendarRepo';
import { MeetingPreJoinLobby } from '../components/meeting/MeetingPreJoinLobby';
import { useJitsiMeetingApi } from '../hooks/useJitsiMeetingApi';
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
  const [displayName, setDisplayName] = useState(
    () => auth.user?.email?.split('@')[0] || 'Host',
  );
  const [joined, setJoined] = useState(false);
  const { join, loading, error } = useJitsiMeetingApi();

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

  const onJoin = (prefs: MeetingVideoPrefs) => {
    setJoined(true);
    void join({
      roomName: room,
      displayName: displayName.trim(),
      subject: event?.title,
      email: auth.user?.email,
      prefs,
      containerId: 'finely-jitsi-host-container',
      onLeave: () => navigate('/admin/specialist-lounge'),
    });
  };

  return (
    <PageShell
      badge="Host room"
      title={event?.title ?? 'Video huddle'}
      subtitle="Premium pre-join defaults for Specialist Lounge & academy huddles."
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
        ) : (
          <div className="space-y-3">
            {loading ? <p className="text-white/50 text-sm">Connecting…</p> : null}
            {error ? <p className="text-rose-200 text-sm">{error}</p> : null}
            <div id="finely-jitsi-host-container" className="rounded-2xl overflow-hidden border border-white/10 min-h-[70vh] bg-black" />
          </div>
        )}
      </div>
    </PageShell>
  );
}
