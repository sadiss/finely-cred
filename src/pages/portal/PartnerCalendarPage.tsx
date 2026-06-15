import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Clock, Download, Link as LinkIcon, Video, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { listEventsByPartner, listRequestsByPartner, sendUpcomingReminders } from '../../data/calendarRepo';
import type { CalendarEvent } from '../../domain/calendar';
import { calendarEventToIcs } from '../../utils/ics';
import { downloadText } from '../../utils/download';
import { MeetingsCalendarView } from '../../components/calendar/MeetingsCalendarView';
import { CommunicationWorkspaceNav } from '../../components/comms/CommunicationWorkspaceNav';
import { MeetingBookingPanel } from '../../components/calendar/MeetingBookingPanel';
import { CalendarSettingsPanel } from '../../components/calendar/CalendarSettingsPanel';
import { getCalendarBookingSettings } from '../../data/calendarSettingsRepo';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsEmptyState } from '../../features/os/FinelyOsEmptyState';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildCalendarNoticedItems } from '../../lib/finelyProactiveSignals';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

type CalendarView = 'calendar' | 'book' | 'sessions' | 'settings';

export default function PartnerCalendarPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);
  const [view, setView] = useState<CalendarView>('book');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [focusEvent, setFocusEvent] = useState<CalendarEvent | null>(null);
  const [settings, setSettings] = useState(() => getCalendarBookingSettings());

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    sendUpcomingReminders({ withinHours: 24 });
  }, [version]);

  const events = useMemo(() => (partner ? listEventsByPartner(partner.id) : []), [partner, version]);
  const requests = useMemo(() => (partner ? listRequestsByPartner(partner.id) : []), [partner, version]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => Date.parse(e.endAt) >= now && e.status !== 'cancelled')
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  }, [events]);

  const joinMeeting = (ev: CalendarEvent) => {
    navigate(`/portal/meeting/${ev.id}`);
  };

  return (
    <PageShell
      badge="Partner Portal"
      title="Calendar & video meetings"
      subtitle="Calendly-style booking with time slots, agenda, voice notes, and in-app video rooms — same look as Tasks & Projects."
    >
      {!partner ? (
        <FinelyOsEmptyState
          icon={Calendar}
          title="No partner profile"
          description="Sign in with a partner account to book sessions and view your calendar."
          primaryAction={{ label: 'Back to dashboard', onClick: () => navigate('/dashboard') }}
        />
      ) : (
        <div className={FINELY_OS_PAGE}>
          <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Partner Dashboard
          </button>

          <CommunicationWorkspaceNav active="calendar" />

          <FinelyNoticedStrip items={buildCalendarNoticedItems({ upcomingCount: upcoming.length })} />
          <FinelyNowDoThisStrip currentIndex={view === 'sessions' ? 2 : view === 'calendar' ? 1 : 0} />

          <FinelyUnifiedHubLayout
            eyebrow="Calendar & meetings"
            title="Book strategy calls"
            subtitle="Pick a time slot, join video rooms, and export calendar invites — paired with Communication Hub."
            accent="emerald"
            kpis={[
              { label: 'Upcoming', value: String(upcoming.length), hint: 'Scheduled', accent: 'emerald' },
              { label: 'All events', value: String(events.length), hint: 'On calendar', accent: 'violet' },
              { label: 'Requests', value: String(requests.length), hint: 'Pending', accent: 'amber' },
              { label: 'Duration', value: `${settings.defaultDuration ?? 30}m`, hint: 'Default slot', accent: 'sky' },
            ]}
            tabs={[
              { id: 'book', label: 'Book session' },
              { id: 'calendar', label: 'Calendar' },
              { id: 'sessions', label: 'My sessions', badge: upcoming.length || undefined },
              { id: 'settings', label: 'Settings' },
            ]}
            activeTab={view}
            onTabChange={(id) => setView(id as CalendarView)}
            primaryAction={{ label: 'Communication hub', onClick: () => navigate('/portal/messages') }}
            secondaryAction={{ label: 'Partner dashboard', onClick: () => navigate('/portal/dashboard') }}
          >
          {view === 'book' ? (
            <div className={FINELY_OS_BANNER}>
              <MeetingBookingPanel partnerId={partner.id} settings={settings} onBooked={() => setVersion((v) => v + 1)} />
            </div>
          ) : null}

          {view === 'settings' ? (
            <CalendarSettingsPanel
              settings={settings}
              onChange={(next) => {
                setSettings(next);
                setVersion((v) => v + 1);
              }}
            />
          ) : null}

          {view === 'calendar' ? (
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
                    <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL} mt-1`}>
                      {fmtWhen(focusEvent.startAt)} · {focusEvent.status}
                    </div>
                    {focusEvent.meetingAgenda ? (
                      <div className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>{focusEvent.meetingAgenda}</div>
                    ) : null}
                  </div>
                  <button type="button" onClick={() => joinMeeting(focusEvent)} className={FINELY_OS_SUCCESS_BTN}>
                    <Video size={14} /> Join video room
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {view === 'sessions' ? (
            <div className="grid lg:grid-cols-12 gap-6">
              <div className={`lg:col-span-7 min-w-0 ${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
                <div className="inline-flex items-center gap-2 text-violet-400">
                  <Video size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Upcoming video sessions</span>
                </div>
                {upcoming.length === 0 ? (
                  <FinelyOsEmptyState
                    icon={Video}
                    title="No upcoming sessions"
                    description="Book a video session with your team — reminders and join links appear here."
                    primaryAction={{ label: 'Book a strategy call', onClick: () => setView('book') }}
                    secondaryAction={{ label: 'Open calendar', onClick: () => setView('calendar') }}
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
                          <div className={`text-xs ${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap border-l-2 border-fuchsia-400/50 pl-3`}>
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
                <div className="inline-flex items-center gap-2 text-violet-400">
                  <Clock size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Your requests</span>
                </div>
                {requests.length === 0 ? (
                  <FinelyOsEmptyState
                    icon={Clock}
                    title="No booking requests yet"
                    description="When you request a session, status updates appear here."
                    primaryAction={{ label: 'Book a strategy call', onClick: () => setView('book') }}
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
                          <div className="mt-1 text-xs text-emerald-700">Slot: {fmtWhen(r.selectedSlotStartAt)}</div>
                        ) : null}
                        {r.meetingAgenda ? <div className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY} line-clamp-3`}>{r.meetingAgenda}</div> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
          </FinelyUnifiedHubLayout>

          <FinelyOsPageFooter />
        </div>
      )}
    </PageShell>
  );
}
