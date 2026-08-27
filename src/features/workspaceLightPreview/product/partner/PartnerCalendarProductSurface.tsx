import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Download,
  Link as LinkIcon,
  PlayCircle,
  Plus,
  Video,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { listEventsByPartner, listRequestsByPartner } from '../../../../data/calendarRepo';
import { getCalendarBookingSettings } from '../../../../data/calendarSettingsRepo';
import type { CalendarEvent, ConsultationRequest } from '../../../../domain/calendar';
import { runMeetingReminderAutomation } from '../../../../lib/meetingReminderAutomation';
import { calendarEventToIcs } from '../../../../utils/ics';
import { downloadText } from '../../../../utils/download';
import {
  PartnerCalendarWorkspace,
  type PartnerCalendarView,
} from '../../../../components/calendar/PartnerCalendarWorkspace';
import { StartVideoCallButton } from '../../../../components/video/StartVideoCallButton';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { accentAt } from '../workspaceAccentArrangement';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import type { WorkspaceProductAccent, WorkspaceProductStatus } from '../workspaceProductTokens';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, ProductStatusPill, type ProductMetric } from '../components/ProductUi';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import './partnerCalendarSurface.css';

const METRICS_VARIANT = 'grid' as const;
const MS_WEEK = 7 * 86_400_000;
const CALENDAR_PURPOSE =
  'Your calendar is for booking live help and joining video sessions — not another task list.';

type CalendarSurfaceView = 'runway' | PartnerCalendarView;

const WORKSTATION_TABS: Array<{ id: CalendarSurfaceView; label: string }> = [
  { id: 'runway', label: 'Runway' },
  { id: 'book', label: 'Book session' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'sessions', label: 'My sessions' },
  { id: 'settings', label: 'Settings' },
];

type TimelineEntry = {
  id: string;
  at: string;
  title: string;
  description: string;
  meta: string;
  status: WorkspaceProductStatus;
  statusLabel?: string;
  accent: WorkspaceProductAccent;
  kind: 'event' | 'request';
  event?: CalendarEvent;
  onOpen: () => void;
};

function formatShortDateTime(iso?: string): string {
  if (!iso) return 'soon';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'soon';
  return parsed.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatWeekday(iso?: string): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString(undefined, { weekday: 'short' });
}

function formatShortDate(iso?: string): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatFreshness(iso?: string): string {
  if (!iso) return 'no activity yet';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? '1 month ago' : `${months} months ago`;
}

function isUpcoming(event: CalendarEvent, nowMs: number): boolean {
  return event.status !== 'cancelled' && event.status !== 'no_show' && Date.parse(event.endAt) >= nowMs;
}

function isNeedsConfirmation(event: CalendarEvent, nowMs: number): boolean {
  return event.status === 'tentative' && Date.parse(event.startAt) >= nowMs;
}

function isWithinWeek(event: CalendarEvent, nowMs: number): boolean {
  const startMs = Date.parse(event.startAt);
  return Number.isFinite(startMs) && startMs >= nowMs && startMs - nowMs <= MS_WEEK;
}

function eventMapping(event: CalendarEvent, nowMs: number): {
  status: WorkspaceProductStatus;
  statusLabel?: string;
  meta: string;
} {
  if (event.status === 'cancelled') return { status: 'complete', statusLabel: 'Cancelled', meta: 'Cancelled' };
  if (event.status === 'no_show') return { status: 'complete', statusLabel: 'No-show', meta: 'Marked no-show' };
  if (event.status === 'completed') return { status: 'complete', meta: `Completed ${formatShortDateTime(event.endAt)}` };
  if (isNeedsConfirmation(event, nowMs)) {
    return { status: 'needs_action', statusLabel: 'Confirm', meta: `Tentative · ${formatShortDateTime(event.startAt)}` };
  }
  if (isWithinWeek(event, nowMs)) return { status: 'ready', meta: formatShortDateTime(event.startAt) };
  return { status: 'waiting', meta: formatShortDateTime(event.startAt) };
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; events: CalendarEvent[]; requests: ConsultationRequest[] };

function CalendarWorkstationTabs({
  activeView,
  onViewChange,
  sessionsBadge,
}: {
  activeView: CalendarSurfaceView;
  onViewChange: (view: CalendarSurfaceView) => void;
  sessionsBadge?: number;
}) {
  return (
    <div className="fc-wlp-calendar-tabs" role="tablist" aria-label="Calendar tools">
      {WORKSTATION_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeView === tab.id}
          className="fc-wlp-calendar-tab fcm-glow-ring"
          data-active={activeView === tab.id ? 'true' : undefined}
          data-fcm-accent={
            tab.id === 'book' ? 'emerald' : tab.id === 'sessions' ? 'violet' : tab.id === 'settings' ? 'sky' : 'graphite'
          }
          onClick={() => onViewChange(tab.id)}
        >
          {tab.label}
          {tab.id === 'sessions' && sessionsBadge ? (
            <span className="fc-wlp-calendar-tab-badge">{sessionsBadge}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function CalendarRunwayStrip({
  upcoming,
  nextEvent,
  onSelectEvent,
  onBook,
}: {
  upcoming: CalendarEvent[];
  nextEvent: CalendarEvent | null;
  onSelectEvent: (event: CalendarEvent) => void;
  onBook: () => void;
}) {
  const nodes = upcoming.slice(0, 5);
  return (
    <div className="fc-wlp-calendar-runway" aria-label="Session runway">
      <div className="fc-wlp-calendar-runway-label">
        <span className="fc-wlp-eyebrow">Your runway</span>
        <strong>{nextEvent ? `Next · ${formatShortDate(nextEvent.startAt)}` : 'No session booked'}</strong>
      </div>
      <div className="fc-wlp-calendar-runway-track">
        <div className="fc-wlp-calendar-runway-rail" aria-hidden />
        {nodes.map((event, index) => {
          const accent = accentAt(index);
          const isNext = event.id === nextEvent?.id;
          return (
            <button
              key={event.id}
              type="button"
              className="fc-wlp-calendar-runway-node"
              data-fcm-accent={accent}
              data-next={isNext ? 'true' : undefined}
              onClick={() => onSelectEvent(event)}
            >
              <span className="fc-wlp-calendar-runway-dot" aria-hidden />
              <span className="fc-wlp-calendar-runway-date">{formatShortDate(event.startAt)}</span>
              <span className="fc-wlp-calendar-runway-title">{event.title}</span>
            </button>
          );
        })}
        <button type="button" className="fc-wlp-calendar-runway-node fc-wlp-calendar-runway-book" data-fcm-accent="emerald" onClick={onBook}>
          <span className="fc-wlp-calendar-runway-dot" aria-hidden />
          <Plus size={16} />
          <span className="fc-wlp-calendar-runway-title">Book next</span>
        </button>
      </div>
    </div>
  );
}

function CalendarTimeline({
  entries,
  onJoin,
  onBook,
}: {
  entries: TimelineEntry[];
  onJoin: (event: CalendarEvent) => void;
  onBook: () => void;
}) {
  if (entries.length === 0) {
    return (
      <ProductEmptyState
        title="Nothing on your runway yet"
        description="Book a session with your specialist to get your first meeting on the calendar."
        action={
          <button type="button" className="fc-wlp-btn-primary" onClick={onBook}>
            Book a strategy call
          </button>
        }
      />
    );
  }

  return (
    <div className="fc-wlp-calendar-timeline" aria-label="Calendar timeline">
      {entries.map((entry) => (
        <div key={entry.id} className="fc-wlp-calendar-timeline-row" data-fcm-accent={entry.accent}>
          <div className="fc-wlp-calendar-timeline-rail" aria-hidden>
            <span className="fc-wlp-calendar-timeline-dot" />
            <span className="fc-wlp-calendar-timeline-line" />
          </div>
          <article className="fc-wlp-calendar-timeline-card">
            <div className="fc-wlp-calendar-timeline-card-head">
              <ProductStatusPill status={entry.status} label={entry.statusLabel} />
              <time className="fc-wlp-calendar-timeline-when">{formatShortDateTime(entry.at)}</time>
            </div>
            <button type="button" className="fc-wlp-calendar-timeline-open" onClick={entry.onOpen}>
              <strong>{entry.title}</strong>
              <p>{entry.description}</p>
              <em>{entry.meta}</em>
            </button>
            {entry.event && entry.event.type === 'consultation' && entry.event.status !== 'cancelled' ? (
              <div className="fc-wlp-calendar-timeline-actions">
                <button type="button" className="fc-wlp-btn-primary fc-wlp-calendar-join-btn" onClick={() => onJoin(entry.event!)}>
                  <Video size={14} /> Join video room
                </button>
                {entry.event.meetingUrl ? (
                  <button
                    type="button"
                    className="fc-wlp-btn-secondary"
                    onClick={() => window.open(entry.event!.meetingUrl!, '_blank', 'noopener,noreferrer')}
                  >
                    <LinkIcon size={14} /> External
                  </button>
                ) : null}
                <button
                  type="button"
                  className="fc-wlp-btn-secondary"
                  onClick={() => {
                    const ev = entry.event!;
                    downloadText({
                      text: calendarEventToIcs(ev),
                      filename: `${ev.title.replace(/[^\w\- ]+/g, '').slice(0, 60) || 'meeting'}.ics`,
                      mimeType: 'text/calendar;charset=utf-8',
                    });
                  }}
                >
                  <Download size={14} /> iCal
                </button>
              </div>
            ) : null}
          </article>
        </div>
      ))}
    </div>
  );
}

export default function PartnerCalendarProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const { partner: sessionPartner } = usePartnerSession();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Calendar;
  const accent = navItem?.accent ?? 'emerald';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partnerId;
  const effectivePartnerId = partnerId ?? sessionPartner?.id;
  const displayName = sessionPartner?.profile?.fullName ?? 'Partner';
  const [settings] = useState(() => getCalendarBookingSettings());

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [activeView, setActiveView] = useState<CalendarSurfaceView>('runway');

  useEffect(() => {
    if (isDemo) return;
    const onStore = () => setRetryToken((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, [isDemo]);

  useEffect(() => {
    if (isDemo) return;
    void runMeetingReminderAutomation({ withinHours: 24 });
  }, [isDemo, retryToken]);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    try {
      const events = listEventsByPartner(partnerId!);
      const requests = listRequestsByPartner(partnerId!);
      if (!cancelled) setState({ status: 'ready', events, requests });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load your calendar right now.';
      if (!cancelled) setState({ status: 'error', message });
    }
    return () => {
      cancelled = true;
    };
  }, [isDemo, partnerId, retryToken]);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);

  const askFinelyPrompt = 'What should I prepare before my next session?';

  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button
        type="button"
        onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Calendar' })}
      >
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const openBookTab = () => setActiveView('book');

  const buildTimelineEntries = (
    events: CalendarEvent[],
    requests: ConsultationRequest[],
    nowMs: number,
    openPath: (event: CalendarEvent, tags: string[]) => void,
  ): TimelineEntry[] => {
    const messagesPath = mapPortalHref('/portal/messages');

    const eventEntries: TimelineEntry[] = events.map((event, index) => {
      const mapped = eventMapping(event, nowMs);
      const tags =
        event.type === 'consultation'
          ? ['Video meeting']
          : event.type === 'follow_up'
            ? ['Follow-up']
            : ['Automatic'];
      return {
        id: event.id,
        at: event.startAt,
        title: event.title,
        description: event.description?.trim() || event.meetingAgenda?.trim() || 'Open this event to see the full agenda.',
        meta: mapped.meta,
        status: mapped.status,
        statusLabel: mapped.statusLabel,
        accent: accentAt(index, { parent: accent }),
        kind: 'event',
        event,
        onOpen: () => openPath(event, tags),
      };
    });

    const pendingRequests = requests.filter((r) => r.status === 'new' || r.status === 'triaged');
    const requestEntries: TimelineEntry[] = pendingRequests.map((request, index) => ({
      id: request.id,
      at: request.selectedSlotStartAt ?? request.createdAt,
      title: `${request.topic.replaceAll('_', ' ')} request`,
      description: request.meetingAgenda?.trim() || 'Your request is waiting to be scheduled — Finely will confirm a time soon.',
      meta: request.selectedSlotStartAt ? `Slot picked · ${formatShortDateTime(request.selectedSlotStartAt)}` : 'Awaiting scheduling',
      status: 'waiting' as WorkspaceProductStatus,
      statusLabel: 'Pending',
      accent: accentAt(index + eventEntries.length, { parent: accent }),
      kind: 'request',
      onOpen: () => setActiveView('sessions'),
    }));

    return [...eventEntries, ...requestEntries].sort((left, right) => left.at.localeCompare(right.at));
  };

  const demoTimeline: TimelineEntry[] = useMemo(
    () =>
      (demoSpec?.items ?? []).map((item, index) => ({
        id: item.id,
        at: new Date(Date.now() + index * 86_400_000 * 2).toISOString(),
        title: item.title,
        description: item.description,
        meta: item.meta,
        status: item.status,
        statusLabel: item.statusLabel,
        accent: accentAt(index, { parent: accent }),
        kind: 'event' as const,
        onOpen: () => navigate(item.target ?? mapPortalHref('/portal/calendar')),
      })),
    [accent, demoSpec, mapPortalHref, navigate],
  );

  const runwayQuickActions = effectivePartnerId && !isDemo ? (
    <div className="fc-wlp-calendar-quick-actions">
      <StartVideoCallButton partnerId={effectivePartnerId} displayName={displayName} userRole="partner" defaultTitle="Strategy video session" />
      <button type="button" className="fc-wlp-btn-secondary" onClick={openBookTab}>
        <Calendar size={14} /> Book a session
      </button>
    </div>
  ) : null;

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        pageId="calendar"
        eyebrow={demoSpec?.eyebrow ?? 'Calendar'}
        title={demoSpec?.title ?? 'See what is due and what is coming up.'}
        description={demoSpec?.description ?? CALENDAR_PURPOSE}
        status={`${demoSpec?.status ?? 'Next session Tuesday'} · demo data`}
        freshness="demo snapshot"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        metricsVariant={METRICS_VARIANT}
        primaryAction={
          <ProductPagePrimaryAction label={demoSpec?.primaryLabel ?? 'Book a strategy call'} onClick={openBookTab} />
        }
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => setActiveView('sessions')}>
            My sessions
          </button>
        }
        metrics={demoSpec?.metrics.map((metric) => ({ ...metric, onClick: () => setActiveView('runway') }))}
        metricTitle={demoSpec?.metricTitle}
        metricDescription={demoSpec?.metricDescription}
      >
        <section className="fc-wlp-section" data-surface-layout="calendar-runway">
          <div className="fc-wlp-module-layout">
            <div className="fc-wlp-module-primary">
              <CalendarRunwayStrip upcoming={[]} nextEvent={null} onSelectEvent={() => setActiveView('sessions')} onBook={openBookTab} />
              {runwayQuickActions}
              <CalendarWorkstationTabs activeView={activeView} onViewChange={setActiveView} sessionsBadge={2} />
              {activeView === 'runway' ? <CalendarTimeline entries={demoTimeline} onJoin={() => navigate('/login')} onBook={openBookTab} /> : null}
              {activeView !== 'runway' ? (
                <ProductEmptyState
                  title="Sign in to book live sessions"
                  description="Demo mode shows the runway timeline — sign in to pick time slots, join video rooms, and export invites."
                  action={
                    <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
                      Sign in
                    </button>
                  }
                />
              ) : null}
            </div>
            <aside className="fc-wlp-page-guide">
              <div className="fc-wlp-page-guide-icon">
                <PageIcon size={22} strokeWidth={2.05} />
              </div>
              <div className="fc-wlp-eyebrow">What to do next</div>
              <h2>{demoSpec?.guideTitle ?? 'Start with what is due today'}</h2>
              <p>{demoSpec?.guideDescription ?? 'The next node on your runway is your nearest session — open it, finish the step, then prepare.'}</p>
              <ol>
                {(demoSpec?.guideSteps ?? [
                  'Open the next runway node and finish what it asks for.',
                  'Review the agenda before your next session.',
                  'Book a strategy call when you need live help.',
                ]).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              {guideActions}
            </aside>
          </div>
        </section>
        <p className="fc-wlp-section-description fc-wlp-compliance-line">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
    );
  }

  if (state.status === 'loading') {
    return <ProductDashboardSkeleton label="Loading your calendar" />;
  }

  if (state.status === 'error') {
    return (
      <ProductHubScaffold
        role={role}
        pageId="calendar"
        eyebrow="Calendar"
        title="See what is due and what is coming up."
        description={CALENDAR_PURPOSE}
        status="Could not load your calendar"
        freshness="just now"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        primaryAction={<ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((value) => value + 1)} />}
      >
        <section className="fc-wlp-section">
          <ProductEmptyState
            title="We couldn't load your calendar"
            description={state.message}
            action={
              <button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((value) => value + 1)}>
                Try again
              </button>
            }
          />
        </section>
      </ProductHubScaffold>
    );
  }

  const { events, requests } = state;
  const nowMs = Date.now();
  const upcoming = events.filter((event) => isUpcoming(event, nowMs)).sort((a, b) => a.startAt.localeCompare(b.startAt));
  const nextEvent = upcoming[0] ?? null;
  const needsConfirmation = upcoming.filter((event) => isNeedsConfirmation(event, nowMs));
  const withinWeek = upcoming.filter((event) => isWithinWeek(event, nowMs));
  const completed = events.filter((event) => event.status === 'completed');
  const pendingRequests = requests.filter((request) => request.status === 'new' || request.status === 'triaged');
  const latestActivity = [...events].map((event) => event.updatedAt).sort().reverse()[0];

  const messagesPath = mapPortalHref('/portal/messages');

  const resolveEventOpen = (event: CalendarEvent, tags: string[]) => {
    const tag = (tags[0] ?? '').trim().toLowerCase();
    if (tag === 'video meeting' || event.type === 'consultation') {
      navigate(mapPortalHref(`/portal/meeting/${event.id}`));
      return;
    }
    if (tag === 'document') {
      navigate(mapPortalHref('/portal/documents'));
      return;
    }
    if (tag === 'letters') {
      navigate(mapPortalHref('/portal/letters'));
      return;
    }
    if (tag === 'history' || tag === 'follow-up') {
      navigate(messagesPath);
      return;
    }
    setActiveView('sessions');
  };

  const timelineEntries = buildTimelineEntries(events, requests, nowMs, resolveEventOpen);

  const joinMeeting = (event: CalendarEvent) => {
    navigate(mapPortalHref(`/portal/meeting/${event.id}`));
  };

  const metrics: ProductMetric[] = [
    {
      label: 'Your next session',
      value: nextEvent ? formatWeekday(nextEvent.startAt) : '—',
      hint: nextEvent ? formatShortDateTime(nextEvent.startAt) : 'No sessions booked yet',
      accent: 'emerald',
      icon: Calendar,
      onClick: () => setActiveView(nextEvent ? 'sessions' : 'book'),
    },
    {
      label: 'Sessions to confirm',
      value: needsConfirmation.length,
      hint: needsConfirmation.length
        ? `${needsConfirmation[0]?.title ?? 'Tentative session'} — confirm the time`
        : 'Nothing waiting on you',
      accent: 'rose',
      icon: AlertTriangle,
      onClick: () => setActiveView('sessions'),
    },
    {
      label: 'Due in the next 7 days',
      value: withinWeek.length,
      hint: withinWeek.length ? `${withinWeek.length} on your calendar this week` : 'Nothing scheduled this week',
      accent: 'sky',
      icon: Clock3,
      onClick: () => setActiveView('calendar'),
    },
    {
      label: 'Default slot',
      value: `${settings.defaultDuration ?? 30}m`,
      hint: completed.length ? `${completed.length} sessions completed` : 'Pick a time when you book',
      accent: 'violet',
      icon: CheckCircle2,
      onClick: () => setActiveView('settings'),
    },
  ];

  const statusHeadline = needsConfirmation.length
    ? `${needsConfirmation.length} session${needsConfirmation.length === 1 ? '' : 's'} need confirmation`
    : nextEvent
      ? `Next session ${formatWeekday(nextEvent.startAt)}`
      : pendingRequests.length
        ? `${pendingRequests.length} request${pendingRequests.length === 1 ? '' : 's'} pending`
        : 'No sessions booked yet';

  const guideTitle = needsConfirmation.length
    ? 'Confirm your tentative session'
    : pendingRequests.length
      ? 'Your request is being scheduled'
      : nextEvent
        ? 'Prepare for your next session'
        : 'Book your first session';
  const guideDescription = needsConfirmation.length
    ? `${needsConfirmation[0]?.title ?? 'A session'} is tentative — confirm it so it locks onto the calendar.`
    : pendingRequests.length
      ? 'Finely reviews new requests and confirms a time — you will see it move to a scheduled session here.'
      : nextEvent
        ? `${nextEvent.title} is coming up ${formatShortDateTime(nextEvent.startAt)}.`
        : 'Booking a session connects you with your specialist for the next step in your plan.';
  const guideSteps = needsConfirmation.length
    ? ['Open the tentative session below.', 'Confirm the time works for you.', 'Message your specialist if it does not.']
    : pendingRequests.length
      ? ['Wait for Finely to confirm a time.', 'Check messages for scheduling updates.', 'Book a different time if it is urgent.']
      : nextEvent
        ? ['Review the agenda before the session.', 'Gather any documents it references.', 'Message your specialist with questions beforehand.']
        : ['Pick a topic and choose a time slot.', 'Add a short agenda so your specialist is prepared.', 'Join the video room when the session starts.'];

  const workstationView: PartnerCalendarView = activeView === 'runway' ? 'sessions' : activeView;

  return (
    <ProductHubScaffold
      role={role}
      pageId="calendar"
      eyebrow="Calendar"
      title="See what is due and what is coming up."
      description={CALENDAR_PURPOSE}
      status={`${statusHeadline} · live data`}
      freshness={formatFreshness(latestActivity)}
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      archetype={archetype}
      metricsVariant={METRICS_VARIANT}
      primaryAction={<ProductPagePrimaryAction label="Book a strategy call" onClick={openBookTab} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => setActiveView('sessions')}>
          My sessions
        </button>
      }
      metrics={metrics}
      metricTitle="Quick summary"
      metricDescription="Walk the runway — next session, confirmations, and your week ahead."
    >
      <section className="fc-wlp-section" data-surface-layout="calendar-runway">
        <div className="fc-wlp-module-layout">
          <div className="fc-wlp-module-primary">
            <CalendarRunwayStrip
              upcoming={upcoming}
              nextEvent={nextEvent}
              onSelectEvent={(event) => {
                joinMeeting(event);
              }}
              onBook={openBookTab}
            />
            {runwayQuickActions}
            <CalendarWorkstationTabs
              activeView={activeView}
              onViewChange={setActiveView}
              sessionsBadge={upcoming.length || undefined}
            />
            {activeView === 'runway' ? (
              <CalendarTimeline entries={timelineEntries} onJoin={joinMeeting} onBook={openBookTab} />
            ) : (
              <PartnerCalendarWorkspace
                partnerId={partnerId!}
                view={workstationView}
                onBooked={() => setRetryToken((v) => v + 1)}
              />
            )}
          </div>
          <aside className="fc-wlp-page-guide">
            <div className="fc-wlp-page-guide-icon">
              <PageIcon size={22} strokeWidth={2.05} />
            </div>
            <div className="fc-wlp-eyebrow">What to do next</div>
            <h2>{guideTitle}</h2>
            <p>{guideDescription}</p>
            <ol>
              {guideSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {guideActions}
          </aside>
        </div>
      </section>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
