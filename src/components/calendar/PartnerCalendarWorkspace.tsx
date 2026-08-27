import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Download, Link as LinkIcon, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listEventsByPartner, listRequestsByPartner } from '../../data/calendarRepo';
import { runMeetingReminderAutomation } from '../../lib/meetingReminderAutomation';
import type { CalendarEvent } from '../../domain/calendar';
import { calendarEventToIcs } from '../../utils/ics';
import { downloadText } from '../../utils/download';
import { MeetingsCalendarView } from './MeetingsCalendarView';
import { MeetingBookingPanel } from './MeetingBookingPanel';
import { CalendarSettingsPanel } from './CalendarSettingsPanel';
import { getCalendarBookingSettings } from '../../data/calendarSettingsRepo';
import { FinelyOsEmptyState } from '../../features/os/FinelyOsEmptyState';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

export type PartnerCalendarView = 'book' | 'calendar' | 'sessions' | 'settings';

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

type Props = {
  partnerId: string;
  view: PartnerCalendarView;
  onBooked?: () => void;
};

/** Live calendar workstation — booking, grid, sessions, settings, and video join. */
export function PartnerCalendarWorkspace({ partnerId, view, onBooked }: Props) {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [focusEvent, setFocusEvent] = useState<CalendarEvent | null>(null);
  const [settings, setSettings] = useState(() => getCalendarBookingSettings());

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    void runMeetingReminderAutomation({ withinHours: 24 });
  }, [version]);

  const events = useMemo(() => listEventsByPartner(partnerId), [partnerId, version]);
  const requests = useMemo(() => listRequestsByPartner(partnerId), [partnerId, version]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => Date.parse(e.endAt) >= now && e.status !== 'cancelled')
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  }, [events]);

  const joinMeeting = (ev: CalendarEvent) => {
    navigate(`/portal/meeting/${ev.id}`);
  };

  const bumpVersion = () => {
    setVersion((v) => v + 1);
    onBooked?.();
  };

  if (view === 'book') {
    return (
      <MeetingBookingPanel partnerId={partnerId} settings={settings} onBooked={bumpVersion} />
    );
  }

  if (view === 'settings') {
    return (
      <CalendarSettingsPanel
        settings={settings}
        onChange={(next) => {
          setSettings(next);
          bumpVersion();
        }}
      />
    );
  }

  if (view === 'calendar') {
    return (
      <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
        <MeetingsCalendarView
          events={events}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onSelectEvent={(ev) => {
            setFocusEvent(ev);
            setSelectedDay(ev.startAt.slice(0, 10));
          }}
        />
        {focusEvent ? (
          <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony flex flex-wrap items-center justify-between gap-3`}>
            <div>
              <div className={FINELY_OS_ENTITY_VALUE}>{focusEvent.title}</div>
              <div className={`text-sm ${FINELY_OS_ENTITY_SUBLABEL} mt-1`}>
                {fmtWhen(focusEvent.startAt)} · {focusEvent.status}
              </div>
              {focusEvent.meetingAgenda ? (
                <div className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>{focusEvent.meetingAgenda}</div>
              ) : null}
            </div>
            <button type="button" onClick={() => joinMeeting(focusEvent)} className={FINELY_OS_SUCCESS_BTN}>
              <Video size={14} /> Join video room
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-12 gap-4">
      <div className={`lg:col-span-7 min-w-0 ${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
        <div className="inline-flex items-center gap-2 text-violet-600">
          <Video size={18} />
          <span className="text-sm font-semibold uppercase tracking-wider">Upcoming video sessions</span>
        </div>
        {upcoming.length === 0 ? (
          <FinelyOsEmptyState
            icon={Video}
            title="No upcoming sessions"
            description="Book a video session with your specialist — reminders and join links appear here."
          />
        ) : (
          <div className="space-y-3">
            {upcoming.map((e) => (
              <div key={e.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                <div className={FINELY_OS_ENTITY_VALUE}>{e.title}</div>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>
                  {fmtWhen(e.startAt)} • {e.status}
                </div>
                {e.meetingAgenda ? (
                  <div className={`text-sm ${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap border-l-2 border-fuchsia-400/50 pl-3`}>
                    {e.meetingAgenda}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => joinMeeting(e)} className={FINELY_OS_SUCCESS_BTN}>
                    <Video size={14} /> Join in app
                  </button>
                  {e.meetingUrl ? (
                    <button
                      type="button"
                      onClick={() => window.open(e.meetingUrl!, '_blank', 'noopener,noreferrer')}
                      className={FINELY_OS_SECONDARY_BTN}
                    >
                      <LinkIcon size={14} /> External
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      downloadText({
                        text: calendarEventToIcs(e),
                        filename: `${e.title.replace(/[^\w\- ]+/g, '').slice(0, 60) || 'meeting'}.ics`,
                        mimeType: 'text/calendar;charset=utf-8',
                      });
                    }}
                    className={FINELY_OS_SECONDARY_BTN}
                  >
                    <Download size={14} /> iCal
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`lg:col-span-5 min-w-0 ${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
        <div className="inline-flex items-center gap-2 text-violet-600">
          <Clock size={18} />
          <span className="text-sm font-semibold uppercase tracking-wider">Your requests</span>
        </div>
        {requests.length === 0 ? (
          <FinelyOsEmptyState
            icon={Clock}
            title="No booking requests yet"
            description="When you request a session, status updates appear here."
          />
        ) : (
          <div className="space-y-2">
            {requests.slice(0, 8).map((r) => (
              <div key={r.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{r.topic.replace(/_/g, ' ')}</div>
                <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  {r.status} • {fmtWhen(r.createdAt)}
                </div>
                {r.selectedSlotStartAt ? (
                  <div className="mt-1 text-sm text-emerald-700">Slot: {fmtWhen(r.selectedSlotStartAt)}</div>
                ) : null}
                {r.meetingAgenda ? <div className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY} line-clamp-3`}>{r.meetingAgenda}</div> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
