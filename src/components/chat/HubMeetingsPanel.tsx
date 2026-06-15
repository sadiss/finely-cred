import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, ExternalLink, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listEventsByPartner, listRequestsByPartner, sendUpcomingReminders } from '../../data/calendarRepo';
import type { CalendarEvent } from '../../domain/calendar';
import { MeetingsCalendarView } from '../calendar/MeetingsCalendarView';
import { StartVideoCallButton } from '../video/StartVideoCallButton';
import {FINELY_OS_ENTITY_BODY,
  FINELY_OS_GLASS_INNER,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,} from '../../features/os/finelyOsLightUi';

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function fmtDuration(start: string, end: string) {
  try {
    const mins = Math.round((Date.parse(end) - Date.parse(start)) / 60_000);
    if (mins < 60) return `${mins} min`;
    return `${Math.round(mins / 60)} hr`;
  } catch {
    return '';
  }
}

function MeetingCard({
  event,
  onJoin,
  onOpenCalendar,
}: {
  event: CalendarEvent;
  onJoin: (ev: CalendarEvent) => void;
  onOpenCalendar: () => void;
}) {
  const statusColor =
    event.status === 'confirmed'
      ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
      : event.status === 'tentative'
        ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
        : 'text-white/60 border-white/[0.08] bg-white/[0.03]';

  return (
    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-white font-semibold truncate">{event.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/50">
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} /> {fmtWhen(event.startAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} /> {fmtDuration(event.startAt, event.endAt)}
            </span>
          </div>
        </div>
        <span className={`shrink-0 px-2 py-1 rounded-lg border text-[10px] uppercase tracking-widest font-black ${statusColor}`}>
          {event.status}
        </span>
      </div>
      {event.description ? <p className="text-sm text-white/60 leading-relaxed line-clamp-3">{event.description}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onJoin(event)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110"
        >
          <Video size={14} /> Join video room
        </button>
        <button
          type="button"
          onClick={onOpenCalendar}
          className={`inline-flex items-center gap-1.5 px-3 py-2 ${FINELY_OS_SECONDARY_BTN}`}
        >
          Calendar <ExternalLink size={11} />
        </button>
      </div>
    </div>
  );
}

type Props = {
  partnerId?: string;
  partnerDisplayName?: string;
  compact?: boolean;
};

export function HubMeetingsPanel({ partnerId, partnerDisplayName, compact }: Props) {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    sendUpcomingReminders({ withinHours: 24 });
  }, [version]);

  const events = useMemo(() => (partnerId ? listEventsByPartner(partnerId) : []), [partnerId, version]);
  const requests = useMemo(() => (partnerId ? listRequestsByPartner(partnerId) : []), [partnerId, version]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => Date.parse(e.endAt) >= now && e.status !== 'cancelled')
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
      .slice(0, compact ? 3 : 8);
  }, [events, compact]);

  const joinMeeting = (ev: CalendarEvent) => {
    navigate(`/portal/meeting/${ev.id}`);
  };

  if (!partnerId) {
    return (
      <div className={`p-6 text-sm ${FINELY_OS_ENTITY_BODY}`}>
        Select a partner profile to view scheduled sessions and video meetings.
      </div>
    );
  }

  return (
    <div className={`space-y-4 overflow-y-auto max-h-full ${compact ? 'p-3' : 'p-4'}`}>
      <div className="rounded-2xl border border-sky-500/25 bg-sky-500/5 p-4">
        <div className="text-[10px] uppercase tracking-widest text-sky-300 font-black">📹 Video meetings</div>
        <p className="mt-2 text-sm text-white/70 leading-relaxed">
          Start an instant video call with your specialist, affiliate manager, or Finely team — or join scheduled sessions below.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {partnerId ? (
            <StartVideoCallButton
              partnerId={partnerId}
              displayName={partnerDisplayName || 'Partner'}
              defaultTitle="Finely video session"
            />
          ) : null}
          <button
            type="button"
            onClick={() => navigate('/portal/calendar')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 ${FINELY_OS_SECONDARY_BTN}`}
          >
            Open calendar <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {!compact && (
        <MeetingsCalendarView
          events={events}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onSelectEvent={(ev) => joinMeeting(ev)}
          compact
        />
      )}

      {upcoming.length === 0 ? (
        <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>
          No upcoming meetings.{' '}
          {requests.some((r) => r.status === 'new' || r.status === 'triaged') ? 'You have a pending session request.' : 'Request one from Calendar.'}
        </div>
      ) : (
        upcoming.map((e) => (
          <MeetingCard key={e.id} event={e} onJoin={joinMeeting} onOpenCalendar={() => navigate('/portal/calendar')} />
        ))
      )}
    </div>
  );
}
