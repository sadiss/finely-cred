import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, Clock, Link as LinkIcon, Plus, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { getPartner, listPartnersByTenant } from '../../data/partnersRepo';
import {
  listConsultationRequests,
  listCalendarEvents,
  listPublicAppointmentRequests,
  createPublicCalendarEvent,
  scheduleEventFromRequest,
  scheduleEventFromPublicRequest,
  setEventStatus,
  setEventMeetingNotes,
  setRequestStatus,
  setPublicRequestStatus,
  waivePublicSessionPayment,
} from '../../data/calendarRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_BOARD_SHELL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_ENTITY_ACCENT_LINK,
  finelyOsInlineListItem,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

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

export default function AdminCalendarPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const requests = useMemo(() => listConsultationRequests(), [version]);
  const publicRequests = useMemo(() => listPublicAppointmentRequests(), [version]);
  const events = useMemo(() => listCalendarEvents(), [version]);
  const [partners, setPartners] = useState<import('../../domain/partners').Partner[]>([]);
  useEffect(() => {
    const u = auth.user;
    const tenantId = getActiveTenantId();
    if (!u) { setPartners([]); return; }
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

  const openSchedule = (id: string) => {
    setErr(null);
    setScheduleFor(id);
    setSchedulePublicFor(null);
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(
      now.getMinutes(),
    )}`;
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
    const req = publicRequests.find((r) => r.id === id);
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(
      now.getMinutes(),
    )}`;
    setStartAtLocal(local);
    setDurationMin(req?.preferredSlotMinutes ?? 30);
    setMeetingUrl('');
    setLocation('');
    setConfirm(true);
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
      slotDurationMinutes: dur as 20 | 30 | 60 | 90,
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

  return (
    <PageShell badge="Admin" title="Calendar & Scheduling" subtitle="Triage strategy call requests and schedule/confirm meetings.">
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <button type="button" onClick={() => navigate('/admin/workflow')} className={FINELY_OS_SECONDARY_BTN}>
            Workflow queue <ArrowRight size={14} />
          </button>
        </div>

        <div className={FINELY_OS_BANNER}>
          <Calendar size={18} className="text-sky-600 shrink-0 mt-0.5" />
          <p className={`${FINELY_OS_ENTITY_BODY} leading-relaxed`}>
            Triage strategy call requests, schedule meetings, and manage public ops calendar slots.
          </p>
        </div>

        {schedulePublicReq && (
          <div className={`${FINELY_OS_NOTICE_SUCCESS} space-y-4`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className={FINELY_OS_ENTITY_VALUE}>Schedule (public request)</div>
                <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                  {schedulePublicReq.fullName} • {schedulePublicReq.email} • {schedulePublicReq.topic.replace('_', ' ')} • {schedulePublicReq.preferredSlotMinutes ?? 30} min
                </div>
              </div>
              <button type="button" onClick={() => setSchedulePublicFor(null)} className={`${FINELY_OS_SECONDARY_BTN} p-2`}>
                <X size={16} />
              </button>
            </div>
            {err && <div className={FINELY_OS_NOTICE_ERROR}>{err}</div>}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Start</label>
                <input type="datetime-local" value={startAtLocal} onChange={(e) => setStartAtLocal(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Duration (min)</label>
                <input type="number" min={10} max={240} value={durationMin} onChange={(e) => setDurationMin(parseInt(e.target.value || '30', 10))} className={FINELY_OS_ENTITY_INPUT} />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Meeting URL</label>
                <input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://meet..." className={`${FINELY_OS_ENTITY_INPUT} placeholder:text-white/35`} />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Zoom / Phone" className={`${FINELY_OS_ENTITY_INPUT} placeholder:text-white/35`} />
              </div>
            </div>
            <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
              <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="accent-amber-500" />
              Confirm immediately
            </label>
            <button type="button" onClick={schedulePublic} className={FINELY_OS_SUCCESS_BTN}>
              <CheckCircle2 size={14} /> Schedule
            </button>
          </div>
        )}

        {scheduleReq && (
          <div className={`${FINELY_OS_NOTICE_WARN} space-y-4`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className={FINELY_OS_ENTITY_VALUE}>Schedule meeting</div>
                <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                  {partnerById.get(scheduleReq.partnerId)?.profile.fullName ?? scheduleReq.partnerId} • {scheduleReq.topic.replace('_', ' ')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScheduleFor(null)}
                className={`${FINELY_OS_SECONDARY_BTN} p-2`}
              >
                <X size={16} />
              </button>
            </div>

            {err && <div className={FINELY_OS_NOTICE_ERROR}>{err}</div>}

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Start</label>
                <input
                  type="datetime-local"
                  value={startAtLocal}
                  onChange={(e) => setStartAtLocal(e.target.value)}
                  className={FINELY_OS_ENTITY_INPUT}
                />
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
                <input
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://meet..."
                  className={`${FINELY_OS_ENTITY_INPUT} placeholder:text-white/35`}
                />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Location (optional)</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Phone / Zoom / Office"
                  className={`${FINELY_OS_ENTITY_INPUT} placeholder:text-white/35`}
                />
              </div>
            </div>

            <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
              <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="accent-amber-500" />
              Confirm immediately
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={schedule}
                className={FINELY_OS_SUCCESS_BTN}
              >
                <CheckCircle2 size={14} /> Schedule
              </button>
            </div>
          </div>
        )}

        {pubOpen && (
          <div className={`${FINELY_OS_NOTICE_SUCCESS} space-y-4`}>
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

            {pubErr && <div className={`${FINELY_OS_ENTITY_BODY} text-rose-800`}>{pubErr}</div>}

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Title</label>
                <input
                  value={pubTitle}
                  onChange={(e) => setPubTitle(e.target.value)}
                  placeholder="Credit Intel Live (Webinar)"
                  className={`${FINELY_OS_ENTITY_INPUT} placeholder:text-white/35`}
                />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Start</label>
                <input
                  type="datetime-local"
                  value={pubStartLocal}
                  onChange={(e) => setPubStartLocal(e.target.value)}
                  className={FINELY_OS_ENTITY_INPUT}
                />
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
                <input
                  value={pubDesc}
                  onChange={(e) => setPubDesc(e.target.value)}
                  placeholder="What attendees will learn…"
                  className={`${FINELY_OS_ENTITY_INPUT} placeholder:text-white/35`}
                />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Meeting URL (optional)</label>
                <input
                  value={pubMeetingUrl}
                  onChange={(e) => setPubMeetingUrl(e.target.value)}
                  placeholder="https://meet..."
                  className={`${FINELY_OS_ENTITY_INPUT} placeholder:text-white/35`}
                />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Location (optional)</label>
                <input
                  value={pubLocation}
                  onChange={(e) => setPubLocation(e.target.value)}
                  placeholder="Zoom / Meet / Office"
                  className={`${FINELY_OS_ENTITY_INPUT} placeholder:text-white/35`}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
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
            </div>
          </div>
        )}

        {openPublicRequests.length > 0 && (
          <div className={`${finelyOsCatalogCard('violet')} !p-5 border-emerald-200/70 space-y-4`}>
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-emerald-700">
                <Send size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Public appointment requests (visitors)</span>
              </div>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{openPublicRequests.length} open</div>
            </div>
            <FinelyOsPaginatedStack
              items={openPublicRequests}
              pageSize={6}
              emptyMessage="No open public requests."
              renderItem={(r) => (
                <div key={r.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
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
                  <div className={`${FINELY_OS_ENTITY_BODY} truncate`} title={r.email}>{r.email}</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap line-clamp-2`}>{r.availabilityNotes}</div>
                  {r.preferredSlotMinutes ? <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{r.preferredSlotMinutes} min preferred</div> : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPublicRequestStatus(r.id, 'triaged')}
                      className={FINELY_OS_SECONDARY_BTN}
                    >
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
                    <button
                      type="button"
                      onClick={() => setPublicRequestStatus(r.id, 'closed')}
                      className={FINELY_OS_SECONDARY_BTN}
                    >
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
              )}
            />
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-6 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-violet-700">
                <Send size={18} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Session requests</span>
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
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/partners/${r.partnerId}`)}
                          className={FINELY_OS_ENTITY_ACCENT_LINK}
                        >
                          Open partner <ArrowRight size={12} />
                        </button>
                      </div>

                      <div className={`${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>{r.availabilityNotes}</div>
                      {r.preferredDates && r.preferredDates.length > 0 ? (
                        <div className={FINELY_OS_ENTITY_BODY}>Preferred: {r.preferredDates.join(', ')}</div>
                      ) : null}
                      {r.notes ? <div className={`${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>{r.notes}</div> : null}

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setRequestStatus(r.id, 'triaged')}
                          className={FINELY_OS_SECONDARY_BTN}
                        >
                          <Clock size={14} /> Triaged
                        </button>
                        <button
                          type="button"
                          onClick={() => openSchedule(r.id)}
                          className={FINELY_OS_PRIMARY_BTN}
                        >
                          <Plus size={14} /> Schedule
                        </button>
                        <button
                          type="button"
                          onClick={() => setRequestStatus(r.id, 'closed')}
                          className={FINELY_OS_SECONDARY_BTN}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  );
                }}
              />
            )}
          </div>

          <div className={`lg:col-span-6 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-violet-700">
                <Calendar size={18} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Upcoming events</span>
              </div>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                {upcomingEvents.length} scheduled
              </div>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className={FINELY_OS_ENTITY_BODY}>No upcoming events.</div>
            ) : (
              <FinelyOsPaginatedStack
                items={upcomingEvents}
                pageSize={8}
                emptyMessage="No upcoming events."
                renderItem={(e) => {
                  const p = partnerById.get(e.partnerId);
                  return (
                    <div key={e.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{e.title}</div>
                          <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                            {p?.profile.fullName ?? e.partnerId} • {e.type} • {e.status}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/partners/${e.partnerId}`)}
                          className={FINELY_OS_ENTITY_ACCENT_LINK}
                        >
                          Partner <ArrowRight size={12} />
                        </button>
                      </div>
                      <div className={FINELY_OS_ENTITY_BODY}>{fmtWhen(e.startAt)}</div>
                      {e.meetingUrl ? (
                        <button
                          type="button"
                          onClick={() => window.open(e.meetingUrl!, '_blank', 'noopener,noreferrer')}
                          className={FINELY_OS_SECONDARY_BTN}
                        >
                          <LinkIcon size={14} /> Open link
                        </button>
                      ) : null}
                      <details className="mt-2">
                        <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_SUBLABEL} hover:text-violet-700`}>
                          Meeting notes
                        </summary>
                        <div className="mt-2 space-y-2">
                          {editingNotesFor === e.id ? (
                            <>
                              <textarea
                                value={notesDraft}
                                onChange={(ev) => setNotesDraft(ev.target.value)}
                                placeholder="Add post-meeting notes..."
                                className={`${FINELY_OS_ENTITY_INPUT} min-h-[80px] resize-y`}
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEventMeetingNotes(e.id, notesDraft);
                                    setEditingNotesFor(null);
                                    setNotesDraft('');
                                    window.dispatchEvent(new Event('finely:store'));
                                  }}
                                  className={FINELY_OS_SUCCESS_BTN}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditingNotesFor(null); setNotesDraft(''); }}
                                  className={FINELY_OS_SECONDARY_BTN}
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className={`${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap min-h-[24px]`}>
                                {e.meetingNotes || <span className={`${FINELY_OS_ENTITY_SUBLABEL} italic`}>No notes yet.</span>}
                              </div>
                              <button
                                type="button"
                                onClick={() => { setEditingNotesFor(e.id); setNotesDraft(e.meetingNotes || ''); }}
                                className={FINELY_OS_SECONDARY_BTN}
                              >
                                {e.meetingNotes ? 'Edit' : 'Add'} notes
                              </button>
                            </>
                          )}
                        </div>
                      </details>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setEventStatus(e.id, 'confirmed')}
                          className={`${finelyOsStatusChip('ok')} cursor-pointer`}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setEventStatus(e.id, 'cancelled')}
                          className={`${finelyOsStatusChip('warn')} cursor-pointer`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                }}
              />
            )}
          </div>
        </div>

        <div className={`${FINELY_OS_BOARD_SHELL} space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-violet-700">
              <Send size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Public events (/events)</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPubErr(null);
                setPubOpen(true);
                // defaults
                const now = new Date();
                now.setMinutes(now.getMinutes() + 120);
                const pad = (n: number) => String(n).padStart(2, '0');
                const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                setPubStartLocal(local);
                setPubDurationMin(45);
              }}
              className={FINELY_OS_SUCCESS_BTN}
            >
              <Plus size={14} /> New public event
            </button>
          </div>

          {publicEvents.length === 0 ? (
            <div className={FINELY_OS_ENTITY_BODY}>No upcoming public events for this tenant.</div>
          ) : (
            <FinelyOsPaginatedStack
              items={publicEvents}
              pageSize={6}
              emptyMessage="No upcoming public events for this tenant."
              renderItem={(e) => (
                <div key={e.id} className={`${finelyOsInlineListItem()} p-5 space-y-2`}>
                  <div className={FINELY_OS_ENTITY_VALUE}>{e.title}</div>
                  <div className={`${FINELY_OS_ENTITY_BODY}`}>{fmtWhen(e.startAt)}</div>
                  {e.description ? <div className={FINELY_OS_ENTITY_BODY}>{e.description}</div> : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {e.meetingUrl ? (
                      <button
                        type="button"
                        onClick={() => window.open(e.meetingUrl!, '_blank', 'noopener,noreferrer')}
                        className={FINELY_OS_SECONDARY_BTN}
                      >
                        <LinkIcon size={14} /> Open link
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setEventStatus(e.id, 'cancelled')}
                      className={`${finelyOsStatusChip('warn')} cursor-pointer`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            />
          )}
        </div>
        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}

