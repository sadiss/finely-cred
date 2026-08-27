import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Calendar, CheckCircle2, Clock, Link as LinkIcon, Plus, Send, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listPartnersByTenant } from '../../../../data/partnersRepo';
import {
  listConsultationRequests,
  listCalendarEvents,
  listPublicAppointmentRequests,
  createPublicCalendarEvent,
  scheduleEventFromRequest,
  scheduleEventFromPublicRequest,
  setEventStatus,
  setEventPostMeetingIntel,
  completeCalendarEvent,
  isCalendarEventPast,
  listPastCalendarEvents,
  setRequestStatus,
  setPublicRequestStatus,
  waivePublicSessionPayment,
  getConsultationRequest,
} from '../../../../data/calendarRepo';
import { createTask } from '../../../../data/tasksRepo';
import { getActiveTenantId } from '../../../../tenancy/activeTenant';
import { useAuth } from '../../../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../../../tenancy/adminPartnerScope';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import { BookingInvitePanel } from '../../../../components/calendar/BookingInvitePanel';
import { AdminMeetingComposer } from '../../../../components/calendar/AdminMeetingComposer';
import { MeetingNotesEditor } from '../../../../components/calendar/MeetingNotesEditor';
import { StartVideoCallButton } from '../../../../components/video/StartVideoCallButton';
import { runMeetingReminderAutomation } from '../../../../lib/meetingReminderAutomation';
import {
  buildFollowUpTaskFromMeeting,
  suggestMeetingNextSteps,
  summarizeMeetingNotes,
} from '../../../../lib/meetingPostCallIntelligence';
import type { CalendarEvent } from '../../../../domain/calendar';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_ENTITY_ACCENT_LINK,
  finelyOsInlineListItem,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import './adminCalendarProductSurface.css';

type Room = 'compose' | 'requests' | 'schedule' | 'wrapup' | 'public';

const ACCENT_CYCLE: Array<'emerald' | 'violet' | 'sky' | 'rose'> = ['emerald', 'violet', 'sky', 'rose'];

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function addMinutes(iso: string, minutes: number) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

function fmtShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export default function AdminCalendarProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'violet';
  const [room, setRoom] = useState<Room>('compose');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    void runMeetingReminderAutomation({ withinHours: 24 });
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const requests = useMemo(() => listConsultationRequests(), [version]);
  const publicRequests = useMemo(() => listPublicAppointmentRequests(), [version]);
  const events = useMemo(() => listCalendarEvents(), [version]);
  const [partners, setPartners] = useState<import('../../../../domain/partners').Partner[]>([]);
  useEffect(() => {
    const u = auth.user;
    const tenantId = getActiveTenantId();
    if (!u) {
      setPartners([]);
      return;
    }
    getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId })
      .then((allowed) => listPartnersByTenant(tenantId).then((all) => all.filter((p) => allowed.has(p.id))))
      .then(setPartners);
  }, [auth.user, version]);
  const partnerIds = useMemo(() => new Set(partners.map((p) => p.id)), [partners]);
  const partnerById = useMemo(() => new Map(partners.map((p) => [p.id, p])), [partners]);

  const openRequests = requests.filter((r) => partnerIds.has(r.partnerId)).filter((r) => r.status === 'new' || r.status === 'triaged');
  const openPublicRequests = publicRequests.filter((r) => r.status === 'new' || r.status === 'triaged');
  const upcomingEvents = events
    .filter((e) => partnerIds.has(e.partnerId))
    .filter((e) => Date.parse(e.endAt) >= Date.now() && e.status !== 'cancelled')
    .slice()
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  const tenantId = useMemo(() => getActiveTenantId(), [version]);
  const publicKey = `public:${tenantId}`;
  const publicEvents = useMemo(() => {
    return events
      .filter((e) => e.partnerId === publicKey && e.type === 'ops')
      .filter((e) => Date.parse(e.endAt) >= Date.now() && e.status !== 'cancelled')
      .slice()
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  }, [events, publicKey]);

  const [pubOpen, setPubOpen] = useState(false);
  const [pubTitle, setPubTitle] = useState('');
  const [pubDesc, setPubDesc] = useState('');
  const [pubStartLocal, setPubStartLocal] = useState('');
  const [pubDurationMin, setPubDurationMin] = useState(45);
  const [pubMeetingUrl, setPubMeetingUrl] = useState('');
  const [pubLocation, setPubLocation] = useState('');
  const [pubErr, setPubErr] = useState<string | null>(null);

  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const [schedulePublicFor, setSchedulePublicFor] = useState<string | null>(null);
  const scheduleReq = scheduleFor ? openRequests.find((r) => r.id === scheduleFor) ?? null : null;
  const schedulePublicReq = schedulePublicFor ? publicRequests.find((r) => r.id === schedulePublicFor) ?? null : null;

  const [startAtLocal, setStartAtLocal] = useState('');
  const [durationMin, setDurationMin] = useState(30);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [location, setLocation] = useState('');
  const [confirm, setConfirm] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [editingNotesFor, setEditingNotesFor] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [postCallFor, setPostCallFor] = useState<string | null>(null);
  const [postCallNotes, setPostCallNotes] = useState('');
  const [postCallSummary, setPostCallSummary] = useState('');
  const [postCallSteps, setPostCallSteps] = useState<string[]>([]);
  const [postCallNotice, setPostCallNotice] = useState<string | null>(null);

  const pastEvents = useMemo(
    () => listPastCalendarEvents({ partnerIds: partnerIds, limit: 12 }),
    [partnerIds, version],
  );

  const needsWrapUpCount = useMemo(
    () => pastEvents.filter((e) => e.status !== 'completed' || !e.meetingNotes).length,
    [pastEvents],
  );

  const eventTopic = useCallback((e: CalendarEvent) => {
    if (!e.sourceRequestId) return undefined;
    return getConsultationRequest(e.sourceRequestId)?.topic;
  }, []);

  const openPostCall = useCallback(
    (e: CalendarEvent) => {
      setPostCallFor(e.id);
      setPostCallNotes(e.meetingNotes || '');
      setPostCallSummary(e.postMeetingSummary || '');
      setPostCallSteps(
        e.postMeetingNextSteps?.length
          ? e.postMeetingNextSteps
          : suggestMeetingNextSteps({
              notes: e.meetingNotes || '',
              topic: eventTopic(e),
              partnerName: partnerById.get(e.partnerId)?.profile.fullName,
              eventTitle: e.title,
            }),
      );
      setPostCallNotice(null);
      setRoom('wrapup');
    },
    [eventTopic, partnerById],
  );

  const savePostCallIntel = useCallback(
    (eventId: string, args: { complete?: boolean; notes: string; summary?: string; steps?: string[] }) => {
      const fn = args.complete ? completeCalendarEvent : setEventPostMeetingIntel;
      fn(eventId, {
        meetingNotes: args.notes,
        postMeetingSummary: args.summary,
        postMeetingNextSteps: args.steps,
      });
      window.dispatchEvent(new Event('finely:store'));
    },
    [],
  );

  const createFollowUpFromEvent = useCallback(
    (e: CalendarEvent, nextStepLabel?: string) => {
      if (e.partnerId.startsWith('public:')) {
        setPostCallNotice('Public visitor sessions — create a CRM task manually from the request email.');
        return;
      }
      const task = buildFollowUpTaskFromMeeting({
        event: e,
        notes: postCallNotes,
        summary: postCallSummary,
        nextStepLabel,
      });
      createTask(task);
      setPostCallNotice(`Follow-up task created: ${task.title}`);
      window.dispatchEvent(new Event('finely:store'));
    },
    [postCallNotes, postCallSummary],
  );

  const postCallEvent = postCallFor ? events.find((e) => e.id === postCallFor) ?? null : null;

  const openSchedule = (id: string) => {
    setErr(null);
    setScheduleFor(id);
    setSchedulePublicFor(null);
    setRoom('requests');
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setStartAtLocal(local);
    setDurationMin(30);
    setMeetingUrl('');
    setLocation('');
    setConfirm(true);
  };

  const openSchedulePublic = (id: string) => {
    setErr(null);
    setSchedulePublicFor(id);
    setScheduleFor(null);
    setRoom('requests');
    const req = publicRequests.find((r) => r.id === id);
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setStartAtLocal(local);
    setDurationMin(req?.preferredSlotMinutes ?? 30);
    setMeetingUrl('');
    setLocation('');
    setConfirm(true);
  };

  const openPublicEventForm = () => {
    setPubErr(null);
    setPubOpen(true);
    setRoom('public');
    const now = new Date();
    now.setMinutes(now.getMinutes() + 120);
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setPubStartLocal(local);
    setPubDurationMin(45);
  };

  const schedulePublic = () => {
    if (!schedulePublicReq) return;
    setErr(null);
    if (!startAtLocal) {
      setErr('Pick a start time.');
      return;
    }
    const start = new Date(startAtLocal);
    if (!Number.isFinite(start.getTime())) {
      setErr('Invalid start time.');
      return;
    }
    const startIso = start.toISOString();
    const dur = Math.max(10, Math.round(durationMin || schedulePublicReq.preferredSlotMinutes || 30));
    const endIso = addMinutes(startIso, dur);
    scheduleEventFromPublicRequest({
      requestId: schedulePublicReq.id,
      startAt: startIso,
      endAt: endIso,
      meetingUrl: meetingUrl.trim() || undefined,
      location: location.trim() || undefined,
      slotDurationMinutes: dur as 15 | 30 | 60 | 90,
      confirm,
    });
    setSchedulePublicFor(null);
    window.dispatchEvent(new Event('finely:store'));
  };

  const schedule = () => {
    if (!scheduleReq) return;
    setErr(null);
    if (!startAtLocal) {
      setErr('Pick a start time.');
      return;
    }
    const start = new Date(startAtLocal);
    if (!Number.isFinite(start.getTime())) {
      setErr('Invalid start time.');
      return;
    }
    const startIso = start.toISOString();
    const endIso = addMinutes(startIso, Math.max(10, Math.round(durationMin || 30)));
    scheduleEventFromRequest({
      requestId: scheduleReq.id,
      startAt: startIso,
      endAt: endIso,
      meetingUrl: meetingUrl.trim() || undefined,
      location: location.trim() || undefined,
      confirm,
    });
    setScheduleFor(null);
    window.dispatchEvent(new Event('finely:store'));
  };

  const scheduleForm = (
    <>
      {schedulePublicReq ? (
        <div className={`${FINELY_OS_NOTICE_SUCCESS} space-y-4 p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={FINELY_OS_ENTITY_VALUE}>Schedule (public request)</div>
              <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                {schedulePublicReq.fullName} • {schedulePublicReq.email} • {schedulePublicReq.topic.replace('_', ' ')} •{' '}
                {schedulePublicReq.preferredSlotMinutes ?? 30} min
              </div>
            </div>
            <button type="button" onClick={() => setSchedulePublicFor(null)} className={`${FINELY_OS_SECONDARY_BTN} p-2`}>
              <X size={16} />
            </button>
          </div>
          {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Start</label>
              <input type="datetime-local" value={startAtLocal} onChange={(e) => setStartAtLocal(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Duration (min)</label>
              <input
                type="number"
                min={10}
                max={240}
                value={durationMin}
                onChange={(e) => setDurationMin(parseInt(e.target.value || '30', 10))}
                className={FINELY_OS_ENTITY_INPUT}
              />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Meeting URL</label>
              <input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://meet..." className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Zoom / Phone" className={FINELY_OS_ENTITY_INPUT} />
            </div>
          </div>
          <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
            <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="accent-emerald-500" />
            Confirm immediately
          </label>
          <button type="button" onClick={schedulePublic} className={FINELY_OS_SUCCESS_BTN}>
            <CheckCircle2 size={14} /> Schedule
          </button>
        </div>
      ) : null}

      {scheduleReq ? (
        <div className={`${FINELY_OS_NOTICE_WARN} space-y-4 p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={FINELY_OS_ENTITY_VALUE}>Schedule meeting</div>
              <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                {partnerById.get(scheduleReq.partnerId)?.profile.fullName ?? scheduleReq.partnerId} • {scheduleReq.topic.replace('_', ' ')}
              </div>
            </div>
            <button type="button" onClick={() => setScheduleFor(null)} className={`${FINELY_OS_SECONDARY_BTN} p-2`}>
              <X size={16} />
            </button>
          </div>
          {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Start</label>
              <input type="datetime-local" value={startAtLocal} onChange={(e) => setStartAtLocal(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Duration (min)</label>
              <input
                type="number"
                min={10}
                max={240}
                value={durationMin}
                onChange={(e) => setDurationMin(parseInt(e.target.value || '30', 10))}
                className={FINELY_OS_ENTITY_INPUT}
              />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Meeting URL (optional)</label>
              <input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://meet..." className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Location (optional)</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Phone / Zoom / Office" className={FINELY_OS_ENTITY_INPUT} />
            </div>
          </div>
          <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
            <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="accent-emerald-500" />
            Confirm immediately
          </label>
          <button type="button" onClick={schedule} className={FINELY_OS_SUCCESS_BTN}>
            <CheckCircle2 size={14} /> Schedule
          </button>
        </div>
      ) : null}
    </>
  );

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Delivery"
      title="Calendar"
      description="Triage session requests, schedule meetings, and join video rooms."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={<ProductPagePrimaryAction label="Schedule meeting" onClick={() => setRoom('compose')} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/workflow')}>
          Workflow queue
        </button>
      }
      metrics={[
        { label: 'Partner requests', value: String(openRequests.length), hint: 'Awaiting schedule', accent: 'emerald', onClick: () => setRoom('requests') },
        { label: 'Visitor requests', value: String(openPublicRequests.length), hint: 'Public intake', accent: 'violet', onClick: () => setRoom('requests') },
        { label: 'Upcoming', value: String(upcomingEvents.length), hint: 'Confirmed sessions', accent: 'sky', onClick: () => setRoom('schedule') },
        { label: 'Needs wrap-up', value: String(needsWrapUpCount), hint: 'Past sessions', accent: 'rose', onClick: () => setRoom('wrapup') },
      ]}
      metricTitle="Scheduling queue"
      metricDescription="Walk the runway — triage requests, join upcoming sessions, wrap past calls."
    >
      <section className="fc-admin-cal-surface" data-surface-layout="calendar-runway">
        <div className="fc-admin-cal-runway">
          <div className="fc-admin-cal-runway-head">
            <div>
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Session runway</span>
              <strong>
                {upcomingEvents[0]
                  ? `Next · ${upcomingEvents[0].title} · ${fmtShortDate(upcomingEvents[0].startAt)}`
                  : 'No upcoming session booked'}
              </strong>
            </div>
            {needsWrapUpCount > 0 ? (
              <span className={`${finelyOsStatusChip('warn')} fc-admin-cal-runway-badge`}>{needsWrapUpCount} need wrap-up</span>
            ) : null}
          </div>
          <div className="fc-admin-cal-runway-track" role="tablist" aria-label="Calendar runway">
            {(
              [
                { id: 'compose' as Room, label: 'Compose', title: 'Schedule and invites', count: null, accent: 'emerald' },
                {
                  id: 'requests' as Room,
                  label: 'Requests',
                  title: 'Partner and visitor intake',
                  count: openRequests.length + openPublicRequests.length,
                  accent: 'violet',
                },
                { id: 'schedule' as Room, label: 'Upcoming', title: 'Confirmed sessions', count: upcomingEvents.length, accent: 'sky' },
                { id: 'wrapup' as Room, label: 'Wrap-up', title: 'Notes and follow-ups', count: needsWrapUpCount, accent: 'rose' },
                { id: 'public' as Room, label: 'Public events', title: '/events page slots', count: publicEvents.length, accent: 'emerald' },
              ] as const
            ).map((seg) => (
              <button
                key={seg.id}
                type="button"
                role="tab"
                aria-selected={room === seg.id}
                data-active={room === seg.id ? 'true' : undefined}
                data-fc-accent={seg.accent}
                className="fc-admin-cal-runway-node"
                onClick={() => setRoom(seg.id)}
              >
                <span className="fc-admin-cal-runway-node-label">{seg.label}</span>
                <span className="fc-admin-cal-runway-node-title">{seg.title}</span>
                {seg.count !== null && seg.count > 0 ? (
                  <span className={`fc-admin-cal-runway-badge ${finelyOsStatusChip('warn')}`}>{seg.count}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {schedulePublicReq || scheduleReq ? (
          <div className="fc-admin-cal-schedule-band">{scheduleForm}</div>
        ) : null}

        <div className="fc-admin-cal-body">
      {room === 'compose' ? (
        <div className="fc-admin-cal-split">
          <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
            <h2 className="text-2xl font-extrabold">Upcoming runway</h2>
            {upcomingEvents.length === 0 ? (
              <p className={FINELY_OS_ENTITY_BODY}>No confirmed sessions yet.</p>
            ) : (
              <div className="fc-admin-cal-mini-timeline">
                {upcomingEvents.slice(0, 4).map((e, idx) => {
                  const p = partnerById.get(e.partnerId);
                  const accent = ACCENT_CYCLE[idx % ACCENT_CYCLE.length];
                  return (
                    <div key={e.id} className="fc-admin-cal-timeline-row" data-fc-accent={accent}>
                      <div className="fc-admin-cal-timeline-rail">
                        <span className="fc-admin-cal-timeline-dot" />
                        <span className="fc-admin-cal-timeline-line" />
                      </div>
                      <div className="fc-admin-cal-timeline-card">
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{e.title}</div>
                        <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                          {p?.profile.fullName ?? e.partnerId} · {fmtWhen(e.startAt)}
                        </div>
                        <button type="button" onClick={() => setRoom('schedule')} className={`mt-2 ${FINELY_OS_SECONDARY_BTN}`}>
                          Open in timeline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="space-y-6">
            {upcomingEvents[0] && !upcomingEvents[0].partnerId.startsWith('public:') ? (
              <section className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
                <h2 className="text-3xl font-extrabold">Join next session</h2>
                <p className={FINELY_OS_ENTITY_BODY}>
                  {upcomingEvents[0].title} · {fmtWhen(upcomingEvents[0].startAt)}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <StartVideoCallButton
                    partnerId={upcomingEvents[0].partnerId}
                    displayName={auth.user?.email || 'Finely staff'}
                    userRole="finely_staff"
                    defaultTitle={upcomingEvents[0].title}
                  />
                  <button type="button" onClick={() => navigate(`/portal/meeting/${upcomingEvents[0].id}`)} className={FINELY_OS_SECONDARY_BTN}>
                    Join scheduled room
                  </button>
                </div>
              </section>
            ) : null}
            <section className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
              <AdminMeetingComposer onScheduled={() => window.dispatchEvent(new Event('finely:store'))} />
            </section>
            <section className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-4`} data-fc-accent="rose">
              <BookingInvitePanel partners={partners} />
            </section>
          </div>
        </div>
      ) : null}

      {room === 'requests' ? (
        <div className="space-y-6">
          {openPublicRequests.length > 0 ? (
            <section className={`${finelyOsCatalogCard('sky')} space-y-4 p-6 lg:p-8`} data-fc-accent="sky">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-sky-700">
                  <Send size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Public appointment requests</span>
                </div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{openPublicRequests.length} open</div>
              </div>
              <div className="fc-admin-cal-mini-timeline">
                <FinelyOsPaginatedStack
                  items={openPublicRequests}
                  pageSize={6}
                  emptyMessage="No open public requests."
                  renderItem={(r, idx) => (
                    <div key={r.id} className="fc-admin-cal-timeline-row" data-fc-accent={ACCENT_CYCLE[idx % ACCENT_CYCLE.length]}>
                      <div className="fc-admin-cal-timeline-rail">
                        <span className="fc-admin-cal-timeline-dot" />
                        <span className="fc-admin-cal-timeline-line" />
                      </div>
                      <div className={`${finelyOsCatalogCard(ACCENT_CYCLE[idx % ACCENT_CYCLE.length])} fc-surface-harmony space-y-3 p-4`}>
                    <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{r.fullName}</div>
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                      {r.topic} • {r.status} • {fmtWhen(r.createdAt)}
                    </div>
                    {r.paymentRequired ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {finelyOsStatusChip(r.paymentStatus === 'paid' ? 'ok' : 'warn')}
                        <span className={FINELY_OS_ENTITY_BODY}>
                          {r.paymentStatus === 'paid'
                            ? 'Paid session'
                            : r.paymentStatus === 'waived'
                              ? 'Payment waived'
                              : `$${((r.sessionPriceCents ?? 0) / 100).toFixed(0)} due — schedule after payment`}
                        </span>
                      </div>
                    ) : r.freeSessionApplied ? (
                      <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Free strategy call</div>
                    ) : null}
                    <div className={`${FINELY_OS_ENTITY_BODY} truncate`} title={r.email}>
                      {r.email}
                    </div>
                    <div className={`${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap line-clamp-2`}>{r.availabilityNotes}</div>
                    {r.preferredSlotMinutes ? <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{r.preferredSlotMinutes} min preferred</div> : null}
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setPublicRequestStatus(r.id, 'triaged')} className={FINELY_OS_SECONDARY_BTN}>
                        <Clock size={14} /> Triaged
                      </button>
                      <button
                        type="button"
                        onClick={() => openSchedulePublic(r.id)}
                        disabled={Boolean(r.paymentRequired && r.paymentStatus !== 'paid' && r.paymentStatus !== 'waived')}
                        className={FINELY_OS_SUCCESS_BTN}
                        title={
                          r.paymentRequired && r.paymentStatus !== 'paid' && r.paymentStatus !== 'waived'
                            ? 'Awaiting Stripe payment before scheduling'
                            : undefined
                        }
                      >
                        <Plus size={14} /> Schedule
                      </button>
                      <button type="button" onClick={() => setPublicRequestStatus(r.id, 'closed')} className={FINELY_OS_SECONDARY_BTN}>
                        Close
                      </button>
                      {r.paymentRequired && r.paymentStatus !== 'paid' && r.paymentStatus !== 'waived' ? (
                        <button
                          type="button"
                          onClick={() => {
                            waivePublicSessionPayment(r.id);
                            window.dispatchEvent(new Event('finely:store'));
                          }}
                          className={FINELY_OS_SECONDARY_BTN}
                        >
                          Waive payment
                        </button>
                      ) : null}
                    </div>
                      </div>
                    </div>
                  )}
                />
              </div>
            </section>
          ) : null}

          <section className={`${finelyOsCatalogCard('emerald')} space-y-4 p-6 lg:p-8`} data-fc-accent="emerald">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-emerald-700">
                <Send size={18} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Partner session requests</span>
              </div>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{openRequests.length} open</div>
            </div>
            {openRequests.length === 0 ? (
              <div className={FINELY_OS_ENTITY_BODY}>No open requests.</div>
            ) : (
              <FinelyOsPaginatedStack
                items={openRequests}
                pageSize={6}
                emptyMessage="No open requests."
                renderItem={(r) => {
                  const p = partnerById.get(r.partnerId);
                  return (
                    <div key={r.id} className={`${finelyOsInlineListItem()} p-4 space-y-3`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{p?.profile.fullName ?? r.partnerId}</div>
                          <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                            {r.topic} • {r.status} • {fmtWhen(r.createdAt)}
                          </div>
                        </div>
                        <button type="button" onClick={() => navigate(`/admin/partners/${r.partnerId}`)} className={FINELY_OS_ENTITY_ACCENT_LINK}>
                          Open partner <ArrowRight size={12} />
                        </button>
                      </div>
                      <div className={`${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>{r.availabilityNotes}</div>
                      {r.preferredDates && r.preferredDates.length > 0 ? (
                        <div className={FINELY_OS_ENTITY_BODY}>Preferred: {r.preferredDates.join(', ')}</div>
                      ) : null}
                      {r.notes ? <div className={`${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>{r.notes}</div> : null}
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setRequestStatus(r.id, 'triaged')} className={FINELY_OS_SECONDARY_BTN}>
                          <Clock size={14} /> Triaged
                        </button>
                        <button type="button" onClick={() => openSchedule(r.id)} className={FINELY_OS_PRIMARY_BTN}>
                          <Plus size={14} /> Schedule
                        </button>
                        <button type="button" onClick={() => setRequestStatus(r.id, 'closed')} className={FINELY_OS_SECONDARY_BTN}>
                          Close
                        </button>
                      </div>
                    </div>
                  );
                }}
              />
            )}
          </section>
        </div>
      ) : null}

      {room === 'schedule' ? (
        <section className={`${finelyOsCatalogCard('violet')} space-y-4 p-6 lg:p-8`} data-fc-accent="violet">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-violet-700">
              <Calendar size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Upcoming timeline</span>
            </div>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{upcomingEvents.length} scheduled</div>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className={FINELY_OS_ENTITY_BODY}>No upcoming events.</div>
          ) : (
            <div className="fc-admin-cal-mini-timeline">
              <FinelyOsPaginatedStack
                items={upcomingEvents}
                pageSize={8}
                emptyMessage="No upcoming events."
                renderItem={(e, idx) => {
                  const p = partnerById.get(e.partnerId);
                  const accent = ACCENT_CYCLE[idx % ACCENT_CYCLE.length];
                  return (
                    <div key={e.id} className="fc-admin-cal-timeline-row" data-fc-accent={accent}>
                      <div className="fc-admin-cal-timeline-rail">
                        <span className="fc-admin-cal-timeline-dot" />
                        <span className="fc-admin-cal-timeline-line" />
                      </div>
                      <div className={`${finelyOsCatalogCard(accent)} fc-surface-harmony space-y-3 p-4`} data-fc-accent={accent}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{e.title}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                          {p?.profile.fullName ?? e.partnerId} • {e.type} • {e.status}
                        </div>
                      </div>
                      <button type="button" onClick={() => navigate(`/admin/partners/${e.partnerId}`)} className={FINELY_OS_ENTITY_ACCENT_LINK}>
                        Partner <ArrowRight size={12} />
                      </button>
                    </div>
                    <div className={FINELY_OS_ENTITY_BODY}>{fmtWhen(e.startAt)}</div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => navigate(`/portal/meeting/${e.id}`)} className={FINELY_OS_PRIMARY_BTN}>
                        Join in-app room
                      </button>
                      {!e.partnerId.startsWith('public:') ? (
                        <StartVideoCallButton
                          partnerId={e.partnerId}
                          displayName={auth.user?.email || 'Finely staff'}
                          userRole="finely_staff"
                          compact
                          defaultTitle={e.title}
                        />
                      ) : null}
                    </div>
                    {e.meetingUrl ? (
                      <button type="button" onClick={() => window.open(e.meetingUrl!, '_blank', 'noopener,noreferrer')} className={FINELY_OS_SECONDARY_BTN}>
                        <LinkIcon size={14} /> Open link
                      </button>
                    ) : null}
                    {Date.parse(e.startAt) <= Date.now() && !isCalendarEventPast(e) ? (
                      <div className={`${FINELY_OS_NOTICE_WARN} !p-3 space-y-2`}>
                        <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-rose-200`}>In session — capture live notes</div>
                        <MeetingNotesEditor
                          value={editingNotesFor === e.id ? notesDraft : e.meetingNotes || ''}
                          onChange={(v) => {
                            setEditingNotesFor(e.id);
                            setNotesDraft(v);
                          }}
                          rows={4}
                          compact
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const notes = editingNotesFor === e.id ? notesDraft : e.meetingNotes || '';
                            setEventPostMeetingIntel(e.id, { meetingNotes: notes });
                            setEditingNotesFor(null);
                            setNotesDraft('');
                            window.dispatchEvent(new Event('finely:store'));
                          }}
                          className={FINELY_OS_SECONDARY_BTN}
                        >
                          Save live notes
                        </button>
                      </div>
                    ) : null}
                    {isCalendarEventPast(e) ? (
                      <button type="button" onClick={() => openPostCall(e)} className={FINELY_OS_PRIMARY_BTN}>
                        <Sparkles size={14} /> Post-call wrap-up
                      </button>
                    ) : (
                      <details className="mt-2">
                        <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_SUBLABEL} hover:text-violet-700`}>Pre-call prep notes</summary>
                        <div className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-xs italic`}>
                          Live and post-meeting notes open after the session starts or from Post-call wrap-up.
                        </div>
                      </details>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setEventStatus(e.id, 'confirmed')} className={`${finelyOsStatusChip('ok')} cursor-pointer`}>
                        Confirm
                      </button>
                      <button type="button" onClick={() => setEventStatus(e.id, 'cancelled')} className={`${finelyOsStatusChip('warn')} cursor-pointer`}>
                        Cancel
                      </button>
                    </div>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          )}
        </section>
      ) : null}

      {room === 'wrapup' ? (
        <div className="fc-admin-cal-wrapup-split">
          {pastEvents.length > 0 ? (
            <section className={`${finelyOsCatalogCard('rose')} space-y-4 p-6 lg:p-8`} data-fc-accent="rose">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-rose-700">
                  <CheckCircle2 size={18} />
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>Past session runway</span>
                </div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{pastEvents.length} past</div>
              </div>
              <div className="fc-admin-cal-mini-timeline">
                <FinelyOsPaginatedStack
                  items={pastEvents}
                  pageSize={6}
                  emptyMessage="No past sessions."
                  renderItem={(e, idx) => {
                    const p = partnerById.get(e.partnerId);
                    const needsWrapUp = e.status !== 'completed' || !e.meetingNotes;
                    const accent = ACCENT_CYCLE[idx % ACCENT_CYCLE.length];
                    return (
                      <div key={e.id} className="fc-admin-cal-timeline-row" data-fc-accent={accent}>
                        <div className="fc-admin-cal-timeline-rail">
                          <span className="fc-admin-cal-timeline-dot" />
                          <span className="fc-admin-cal-timeline-line" />
                        </div>
                        <div className="fc-admin-cal-timeline-card space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{e.title}</div>
                              <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                                {p?.profile.fullName ?? e.partnerId} • {e.status} • {fmtWhen(e.endAt)}
                              </div>
                            </div>
                            {needsWrapUp ? finelyOsStatusChip('warn') : finelyOsStatusChip('ok')}
                          </div>
                          {e.postMeetingSummary ? <p className={`${FINELY_OS_ENTITY_BODY} text-xs line-clamp-2`}>{e.postMeetingSummary}</p> : null}
                          <button type="button" onClick={() => openPostCall(e)} className={FINELY_OS_SECONDARY_BTN}>
                            <Sparkles size={14} /> {needsWrapUp ? 'Wrap up' : 'Review notes'}
                          </button>
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            </section>
          ) : (
            <div className={FINELY_OS_ENTITY_BODY}>No past sessions yet.</div>
          )}

          {postCallEvent ? (
            <section className={`${finelyOsCatalogCard('emerald')} space-y-4 p-6 lg:p-8`} data-fc-accent="emerald">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>
                    <Sparkles size={16} /> Post-call notes
                  </div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{postCallEvent.title}</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                    {partnerById.get(postCallEvent.partnerId)?.profile.fullName ?? postCallEvent.partnerId} • {fmtWhen(postCallEvent.endAt)}
                  </div>
                </div>
                <button type="button" onClick={() => setPostCallFor(null)} className={`${FINELY_OS_SECONDARY_BTN} p-2`}>
                  <X size={16} />
                </button>
              </div>
              {postCallNotice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{postCallNotice}</div> : null}
              <MeetingNotesEditor
                value={postCallNotes}
                onChange={setPostCallNotes}
                placeholder="What happened on the call? Action items, blockers, partner goals…"
                rows={4}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const summary = summarizeMeetingNotes(postCallNotes);
                    setPostCallSummary(summary);
                    const steps = suggestMeetingNextSteps({
                      notes: postCallNotes,
                      topic: eventTopic(postCallEvent),
                      partnerName: partnerById.get(postCallEvent.partnerId)?.profile.fullName,
                      eventTitle: postCallEvent.title,
                    });
                    setPostCallSteps(steps);
                    setPostCallNotice(summary ? 'Summary and next steps updated from your notes.' : 'Add notes first, then summarize.');
                  }}
                  className={FINELY_OS_SECONDARY_BTN}
                >
                  <Sparkles size={14} /> Summarize notes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    savePostCallIntel(postCallEvent.id, {
                      complete: true,
                      notes: postCallNotes,
                      summary: postCallSummary,
                      steps: postCallSteps,
                    });
                    setPostCallNotice('Session marked complete and notes saved.');
                  }}
                  className={FINELY_OS_SUCCESS_BTN}
                >
                  <CheckCircle2 size={14} /> Mark complete
                </button>
                <button type="button" onClick={() => createFollowUpFromEvent(postCallEvent)} className={FINELY_OS_PRIMARY_BTN}>
                  <Plus size={14} /> Create follow-up task
                </button>
              </div>
              {postCallSummary ? (
                <div className={`${finelyOsCatalogCard('sky')} space-y-2 p-4`} data-fc-accent="sky">
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Summary</div>
                  <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{postCallSummary}</p>
                </div>
              ) : null}
              <div className="space-y-2">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Suggested next steps</div>
                <div className="flex flex-wrap gap-2">
                  {postCallSteps.map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => {
                        setPostCallNotes((prev) => (prev.trim() ? `${prev.trim()}\n- ${step}` : `- ${step}`));
                        createFollowUpFromEvent(postCallEvent, step);
                      }}
                      className={finelyOsStatusChip('ok')}
                    >
                      {step}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const steps = suggestMeetingNextSteps({
                        notes: postCallNotes,
                        topic: eventTopic(postCallEvent),
                        partnerName: partnerById.get(postCallEvent.partnerId)?.profile.fullName,
                        eventTitle: postCallEvent.title,
                      });
                      setPostCallSteps(steps);
                    }}
                    className={FINELY_OS_SECONDARY_BTN}
                  >
                    Refresh chips
                  </button>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {room === 'public' ? (
        <div className="space-y-6">
          {pubOpen ? (
            <section className={`${FINELY_OS_NOTICE_SUCCESS} space-y-4 p-6`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className={FINELY_OS_ENTITY_VALUE}>Create public event</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>Shows on the public `/events` page for the active tenant.</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPubOpen(false);
                    setPubErr(null);
                  }}
                  className={`${FINELY_OS_SECONDARY_BTN} p-2`}
                >
                  <X size={16} />
                </button>
              </div>
              {pubErr ? <div className={`${FINELY_OS_ENTITY_BODY} text-rose-800`}>{pubErr}</div> : null}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className={FINELY_OS_ENTITY_SUBLABEL}>Title</label>
                  <input value={pubTitle} onChange={(e) => setPubTitle(e.target.value)} placeholder="Credit Intel Live (Webinar)" className={FINELY_OS_ENTITY_INPUT} />
                </div>
                <div>
                  <label className={FINELY_OS_ENTITY_SUBLABEL}>Start</label>
                  <input type="datetime-local" value={pubStartLocal} onChange={(e) => setPubStartLocal(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
                </div>
                <div>
                  <label className={FINELY_OS_ENTITY_SUBLABEL}>Duration (min)</label>
                  <input
                    type="number"
                    min={10}
                    max={240}
                    value={pubDurationMin}
                    onChange={(e) => setPubDurationMin(parseInt(e.target.value || '45', 10))}
                    className={FINELY_OS_ENTITY_INPUT}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={FINELY_OS_ENTITY_SUBLABEL}>Description (optional)</label>
                  <input value={pubDesc} onChange={(e) => setPubDesc(e.target.value)} placeholder="What attendees will learn…" className={FINELY_OS_ENTITY_INPUT} />
                </div>
                <div>
                  <label className={FINELY_OS_ENTITY_SUBLABEL}>Meeting URL (optional)</label>
                  <input value={pubMeetingUrl} onChange={(e) => setPubMeetingUrl(e.target.value)} placeholder="https://meet..." className={FINELY_OS_ENTITY_INPUT} />
                </div>
                <div>
                  <label className={FINELY_OS_ENTITY_SUBLABEL}>Location (optional)</label>
                  <input value={pubLocation} onChange={(e) => setPubLocation(e.target.value)} placeholder="Zoom / Meet / Office" className={FINELY_OS_ENTITY_INPUT} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPubErr(null);
                  if (!pubTitle.trim()) {
                    setPubErr('Title is required.');
                    return;
                  }
                  if (!pubStartLocal) {
                    setPubErr('Pick a start time.');
                    return;
                  }
                  const start = new Date(pubStartLocal);
                  if (!Number.isFinite(start.getTime())) {
                    setPubErr('Invalid start time.');
                    return;
                  }
                  const startIso = start.toISOString();
                  const endIso = addMinutes(startIso, Math.max(10, Math.round(pubDurationMin || 45)));
                  createPublicCalendarEvent({
                    tenantId,
                    title: pubTitle.trim(),
                    description: pubDesc.trim() || undefined,
                    startAt: startIso,
                    endAt: endIso,
                    meetingUrl: pubMeetingUrl.trim() || undefined,
                    location: pubLocation.trim() || undefined,
                    status: 'confirmed',
                  });
                  setPubTitle('');
                  setPubDesc('');
                  setPubStartLocal('');
                  setPubMeetingUrl('');
                  setPubLocation('');
                  setPubOpen(false);
                  window.dispatchEvent(new Event('finely:store'));
                }}
                className={FINELY_OS_SUCCESS_BTN}
              >
                <CheckCircle2 size={14} /> Publish event
              </button>
            </section>
          ) : (
            <div className="flex justify-end">
              <button type="button" onClick={openPublicEventForm} className={FINELY_OS_SUCCESS_BTN}>
                <Plus size={14} /> New public event
              </button>
            </div>
          )}

          <section className={`${finelyOsCatalogCard('violet')} space-y-4 p-6 lg:p-8`} data-fc-accent="violet">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-violet-700">
                <Send size={18} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Public events (/events)</span>
              </div>
            </div>
            {publicEvents.length === 0 ? (
              <div className={FINELY_OS_ENTITY_BODY}>No upcoming public events for this tenant.</div>
            ) : (
              <div className="fc-admin-cal-mini-timeline">
                <FinelyOsPaginatedStack
                  items={publicEvents}
                  pageSize={6}
                  emptyMessage="No upcoming public events for this tenant."
                  renderItem={(e, idx) => {
                    const accent = ACCENT_CYCLE[idx % ACCENT_CYCLE.length];
                    return (
                      <div key={e.id} className="fc-admin-cal-timeline-row" data-fc-accent={accent}>
                        <div className="fc-admin-cal-timeline-rail">
                          <span className="fc-admin-cal-timeline-dot" />
                          <span className="fc-admin-cal-timeline-line" />
                        </div>
                        <div className="fc-admin-cal-timeline-card space-y-2">
                          <div className={FINELY_OS_ENTITY_VALUE}>{e.title}</div>
                          <div className={FINELY_OS_ENTITY_BODY}>{fmtWhen(e.startAt)}</div>
                          {e.description ? <div className={FINELY_OS_ENTITY_BODY}>{e.description}</div> : null}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {e.meetingUrl ? (
                              <button type="button" onClick={() => window.open(e.meetingUrl!, '_blank', 'noopener,noreferrer')} className={FINELY_OS_SECONDARY_BTN}>
                                <LinkIcon size={14} /> Open link
                              </button>
                            ) : null}
                            <button type="button" onClick={() => setEventStatus(e.id, 'cancelled')} className={`${finelyOsStatusChip('warn')} cursor-pointer`}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            )}
          </section>
        </div>
      ) : null}
        </div>
      </section>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
