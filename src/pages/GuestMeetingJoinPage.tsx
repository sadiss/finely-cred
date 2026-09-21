import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MeetingPreJoinLobby } from '../components/meeting/MeetingPreJoinLobby';
import { FinelyJitsiMeetingRoom } from '../components/meeting/FinelyJitsiMeetingRoom';
import { MeetingPipelineKeepAlive } from '../components/meeting/MeetingPipelineKeepAlive';
import { hasLobbyVisualEffects } from '../lib/meetingVideoQuality';
import { lookupGuestCalendarEvent } from '../lib/calendarGuestLookup';
import { meetingRoomName, meetingProviderLabel } from '../lib/meetingUrls';
import type { MeetingVideoPrefs } from '../lib/meetingVideoQuality';
import type { CalendarEvent } from '../domain/calendar';

/** Public guest join — no Finely signup. Route: `/meet/:eventId` */
export default function GuestMeetingJoinPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lang = searchParams.get('lang') === 'ht' ? 'ht' : 'en';
  const [displayName, setDisplayName] = useState(() => (searchParams.get('name') || '').trim());
  const [joined, setJoined] = useState(false);
  const [joinPrefs, setJoinPrefs] = useState<MeetingVideoPrefs | null>(null);
  const [outboundStream, setOutboundStream] = useState<MediaStream | null>(null);
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [demoWarning, setDemoWarning] = useState<string | null>(null);
  const [blockJoin, setBlockJoin] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    void lookupGuestCalendarEvent(eventId).then((res) => {
      setEvent(res.event);
      setDemoWarning(res.demoWarning ?? null);
      setBlockJoin(Boolean(res.blockJoin));
      setCancelled(Boolean(res.cancelled));
    });
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

  const onJoin = (prefs: MeetingVideoPrefs, stream: MediaStream | null) => {
    setJoinPrefs(prefs);
    setOutboundStream(hasLobbyVisualEffects(prefs) ? null : stream);
    setJoined(true);
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
        {cancelled ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-100 text-sm">
            {lang === 'ht'
              ? 'Reyinyon an anile. Kontakte host ou pou nouvo lè.'
              : 'This meeting was cancelled. Contact your host to reschedule.'}
          </div>
        ) : null}
        {demoWarning ? (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-amber-100/90 text-xs leading-relaxed whitespace-pre-wrap">
            {demoWarning}
          </div>
        ) : null}
        {!cancelled && !blockJoin && !joined ? (
          <MeetingPreJoinLobby
            lang={lang}
            hostContext="guest"
            displayName={displayName}
            onDisplayNameChange={setDisplayName}
            onJoin={onJoin}
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
            prefs={joinPrefs}
            outboundStream={outboundStream}
            onLeave={() => navigate('/')}
          />
        ) : null}
      </main>
    </div>
  );
}
