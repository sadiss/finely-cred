import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { listCalendarEvents } from '../data/calendarRepo';
import { MeetingPreJoinLobby } from '../components/meeting/MeetingPreJoinLobby';
import { useJitsiMeetingApi } from '../hooks/useJitsiMeetingApi';
import { meetingRoomName, meetingProviderLabel } from '../lib/meetingUrls';
import type { MeetingVideoPrefs } from '../lib/meetingVideoQuality';

/** Public guest join — no Finely signup. Route: `/meet/:eventId` */
export default function GuestMeetingJoinPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lang = searchParams.get('lang') === 'ht' ? 'ht' : 'en';
  const [displayName, setDisplayName] = useState(() => (searchParams.get('name') || '').trim());
  const [joined, setJoined] = useState(false);
  const { join, loading, error } = useJitsiMeetingApi();

  const event = useMemo(() => {
    if (!eventId) return null;
    return listCalendarEvents().find((e) => e.id === eventId) ?? null;
  }, [eventId]);

  const room = eventId ? meetingRoomName(eventId) : '';
  const provider = meetingProviderLabel();

  if (!eventId) {
    return (
      <div className="min-h-screen bg-[#0a1210] flex items-center justify-center p-6 text-white/70">
        Invalid meeting link.
      </div>
    );
  }

  const onJoin = (prefs: MeetingVideoPrefs) => {
    setJoined(true);
    void join({
      roomName: room,
      displayName: displayName.trim(),
      subject: event?.title,
      prefs,
      containerId: 'finely-jitsi-container',
      onLeave: () => navigate('/'),
    });
  };

  return (
    <div className="min-h-screen bg-[#0a1210] text-white">
      <header className="border-b border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sky-300 text-xs uppercase tracking-widest font-bold">
            {lang === 'ht' ? 'Reyinyon Finely' : 'Finely meeting'} · {provider === 'daily' ? 'Daily' : 'Jitsi'}
          </div>
          <h1 className="text-lg font-semibold truncate">{event?.title ?? 'Strategy session'}</h1>
          {event?.startAt ? <p className="text-white/50 text-sm">{new Date(event.startAt).toLocaleString()}</p> : null}
        </div>
        <button type="button" onClick={() => navigate('/enlightenment-session')} className="text-xs text-white/60 hover:text-white">
          Book a session
        </button>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        {!joined ? (
          <MeetingPreJoinLobby
            lang={lang}
            hostContext="guest"
            displayName={displayName}
            onDisplayNameChange={setDisplayName}
            onJoin={onJoin}
          />
        ) : (
          <div className="space-y-3">
            {loading ? <p className="text-white/50 text-sm">Connecting…</p> : null}
            {error ? <p className="text-rose-200 text-sm">{error}</p> : null}
            <div id="finely-jitsi-container" className="rounded-2xl overflow-hidden border border-white/10 min-h-[70vh] bg-black" />
          </div>
        )}
      </main>
    </div>
  );
}
