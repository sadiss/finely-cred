import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { CalendarEvent } from '../../domain/calendar';
import { buildGuestMeetingJoinPath, buildFinelyMeetingUrl, meetingProviderLabel } from '../../lib/meetingUrls';
import { LOUNGE_HOST_VIDEO_DEFAULTS } from '../../lib/meetingVideoQuality';

export function HubMeetingsPanel({
  events,
  lang,
}: {
  events: CalendarEvent[];
  lang: 'en' | 'ht';
}) {
  const navigate = useNavigate();
  const provider = meetingProviderLabel();

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="text-white font-semibold text-sm">Meeting lobby</div>
      <p className="mt-2 text-white/55 text-xs">
        {lang === 'ht'
          ? `Pre-join ak touch-up v1 + fon vityèl · ${provider === 'daily' ? 'Daily' : 'Jitsi'}`
          : `Pre-join lobby (touch-up v1 + virtual backgrounds) · ${provider === 'daily' ? 'Daily' : 'Jitsi'}`}
      </p>
      <p className="mt-1 text-white/40 text-[10px]">
        Host defaults: HD, touch-up {LOUNGE_HOST_VIDEO_DEFAULTS.beautyStrength}%,{' '}
        {LOUNGE_HOST_VIDEO_DEFAULTS.virtualBackground.replace(/_/g, ' ')}.
      </p>
      <ul className="mt-3 space-y-2 text-xs text-white/65">
        {events.length ? (
          events.map((e) => (
            <li key={e.id} className="rounded-lg border border-white/10 bg-black/30 p-2">
              <div className="font-semibold text-white/85">{e.title}</div>
              <div className="text-white/45">{e.startAt?.slice(0, 16).replace('T', ' ')}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/meet/${e.id}?ctx=lounge&lang=${lang}`)}
                  className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-100 border border-amber-500/30 text-[10px] font-bold uppercase"
                >
                  Host join
                </button>
                <button
                  type="button"
                  onClick={() => navigate(buildGuestMeetingJoinPath(e.id))}
                  className="px-2 py-1 rounded-lg bg-sky-500/20 text-sky-100 border border-sky-500/30 text-[10px] font-bold uppercase"
                >
                  Guest lobby
                </button>
                {e.meetingUrl ? (
                  <a
                    href={e.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 rounded-lg text-white/50 border border-white/10 text-[10px]"
                  >
                    Direct link
                  </a>
                ) : (
                  <a
                    href={buildFinelyMeetingUrl(e.id, e.title)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 rounded-lg text-white/50 border border-white/10 text-[10px]"
                  >
                    Room URL
                  </a>
                )}
              </div>
            </li>
          ))
        ) : (
          <li>No upcoming events — book via Consultation.</li>
        )}
      </ul>
      <button type="button" onClick={() => navigate('/consultation')} className="mt-3 text-amber-300 text-xs">
        Open consultation booking →
      </button>
    </div>
  );
}
