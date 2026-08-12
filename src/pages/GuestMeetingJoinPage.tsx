import React, { useEffect, useMemo, useState } from 'react';
import { Mic, Video } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { listCalendarEvents } from '../data/calendarRepo';
import { buildGuestMeetingEmbedUrl, meetingProviderLabel, meetingRoomName } from '../lib/meetingUrls';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PAGE,
  FINELY_OS_SECONDARY_BTN,
} from '../features/os/finelyOsLightUi';

/** Public audio-first guest join — no portal login. Route: `/meet/:eventId` */
export default function GuestMeetingJoinPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(() => (searchParams.get('name') || '').trim());

  const event = useMemo(() => {
    if (!eventId) return null;
    return listCalendarEvents().find((e) => e.id === eventId) ?? null;
  }, [eventId]);

  const room = eventId ? meetingRoomName(eventId) : '';
  const provider = meetingProviderLabel();
  const canJoin = displayName.trim().length >= 2;
  const embedSrc = canJoin && eventId
    ? buildGuestMeetingEmbedUrl({
        roomName: room,
        displayName: displayName.trim(),
        subject: event?.title,
      })
    : '';

  useEffect(() => {
    document.title = event?.title ? `${event.title} — Join meeting` : 'Join Finely meeting';
  }, [event?.title]);

  if (!eventId) {
    return (
      <div className="min-h-screen bg-[#0a1210] flex items-center justify-center p-6">
        <div className={FINELY_OS_PAGE}>
          <div className={FINELY_OS_LUXURY_EMPTY}>Invalid meeting link.</div>
          <button type="button" onClick={() => navigate('/')} className={FINELY_OS_SECONDARY_BTN}>
            Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1210] flex flex-col">
      <div className="shrink-0 border-b border-white/[0.08] bg-fc-input px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-sky-300 inline-flex items-center gap-2`}>
            <Mic size={14} /> Audio-first join · {provider === 'daily' ? 'Daily' : 'Jitsi'}
          </div>
          <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{event?.title ?? 'Strategy session'}</div>
          {event?.startAt ? (
            <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
              {new Date(event.startAt).toLocaleString()}
            </div>
          ) : null}
        </div>
        <button type="button" onClick={() => navigate('/enlightenment-session')} className={FINELY_OS_SECONDARY_BTN}>
          Book a session
        </button>
      </div>

      {!canJoin ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-sky-500/20 bg-black/30 p-5">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-200`}>
              <Video size={14} /> Join your session
            </div>
            <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
              Enter your name to join. Camera stays off — mic on by default. You can turn video on anytime.
            </p>
            <label className="block">
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Your name</span>
              <input
                className="mt-1 w-full rounded-xl border border-sky-400/30 bg-black/35 px-3 py-2 text-sm text-white placeholder:text-white/35"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="First and last name"
                autoFocus
              />
            </label>
            <button
              type="button"
              disabled={displayName.trim().length < 2}
              onClick={() => setDisplayName((n) => n.trim())}
              className="w-full rounded-xl bg-sky-500/20 border border-sky-400/40 px-4 py-2.5 text-sm font-semibold text-sky-100 disabled:opacity-50"
            >
              Continue to room
            </button>
            <button type="button" onClick={() => navigate(-1)} className={FINELY_OS_BACK_LINK}>
              Go back
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 p-2 md:p-4">
          <iframe
            title={event?.title ?? 'Video meeting'}
            src={embedSrc}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-[calc(100vh-88px)] min-h-[480px] rounded-2xl border border-sky-500/20 bg-black"
          />
        </div>
      )}

      <div className="shrink-0 px-4 py-2 text-[10px] text-white/40 text-center">
        Results vary · not legal advice · secure browser video
      </div>
    </div>
  );
}
