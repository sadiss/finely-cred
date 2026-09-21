import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MeetingPreJoinLobby } from '../components/meeting/MeetingPreJoinLobby';
import { useJitsiMeetingApi } from '../hooks/useJitsiMeetingApi';
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
  const { join, loading, error } = useJitsiMeetingApi();
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [demoWarning, setDemoWarning] = useState<string | null>(null);
  const [lookupSource, setLookupSource] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    void lookupGuestCalendarEvent(eventId).then((res) => {
      setEvent(res.event);
      setDemoWarning(res.demoWarning ?? null);
      setLookupSource(res.source);
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
          {lookupSource === 'server' ? (
            <p className="text-emerald-400/80 text-[10px] uppercase tracking-widest mt-1">Server calendar</p>
          ) : lookupSource === 'local_demo' ? (
            <p className="text-amber-400/80 text-[10px] uppercase tracking-widest mt-1">Demo calendar (this browser)</p>
          ) : null}
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
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-amber-100/90 text-xs leading-relaxed">
            {demoWarning}
          </div>
        ) : null}
        <p className="text-white/40 text-[11px]">
          {lang === 'ht'
            ? 'Touch-up v1: amelyorasyon limyè/souf — pa segmentation AI pwofesyonèl.'
            : 'Touch-up v1: soft light/smoothing — not professional AI segmentation.'}
        </p>
        {!joined && !cancelled ? (
          <MeetingPreJoinLobby
            lang={lang}
            hostContext="guest"
            displayName={displayName}
            onDisplayNameChange={setDisplayName}
            onJoin={onJoin}
          />
        ) : joined ? (
          <div className="space-y-3">
            {loading ? <p className="text-white/50 text-sm">Connecting…</p> : null}
            {error ? <p className="text-rose-200 text-sm">{error}</p> : null}
            <div id="finely-jitsi-container" className="rounded-2xl overflow-hidden border border-white/10 min-h-[70vh] bg-black" />
          </div>
        ) : null}
      </main>
    </div>
  );
}
