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
} from '../../data/calendarRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';

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
    <PageShell badge="Admin" title="Calendar & Scheduling" subtitle="Triage enlightenment session requests and schedule/confirm meetings.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/workflow')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70"
          >
            Workflow queue <ArrowRight size={14} />
          </button>
        </div>

        {schedulePublicReq && (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-white font-semibold">Schedule (public request)</div>
                <div className="mt-1 text-white/70 text-sm">
                  {schedulePublicReq.fullName} • {schedulePublicReq.email} • {schedulePublicReq.topic.replace('_', ' ')} • {schedulePublicReq.preferredSlotMinutes ?? 30} min
                </div>
              </div>
              <button type="button" onClick={() => setSchedulePublicFor(null)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white">
                <X size={16} />
              </button>
            </div>
            {err && <div className="text-amber-100 text-sm">{err}</div>}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Start</label>
                <input type="datetime-local" value={startAtLocal} onChange={(e) => setStartAtLocal(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Duration (min)</label>
                <input type="number" min={10} max={240} value={durationMin} onChange={(e) => setDurationMin(parseInt(e.target.value || '30', 10))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Meeting URL</label>
                <input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://meet..." className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Zoom / Phone" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30" />
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/70">
              <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="accent-amber-500" />
              Confirm immediately
            </label>
            <button type="button" onClick={schedulePublic} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110">
              <CheckCircle2 size={14} /> Schedule
            </button>
          </div>
        )}

        {scheduleReq && (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-white font-semibold">Schedule meeting</div>
                <div className="mt-1 text-white/70 text-sm">
                  {partnerById.get(scheduleReq.partnerId)?.profile.fullName ?? scheduleReq.partnerId} • {scheduleReq.topic.replace('_', ' ')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScheduleFor(null)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {err && <div className="text-amber-100 text-sm">{err}</div>}

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Start</label>
                <input
                  type="datetime-local"
                  value={startAtLocal}
                  onChange={(e) => setStartAtLocal(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Duration (min)</label>
                <input
                  type="number"
                  min={10}
                  max={240}
                  value={durationMin}
                  onChange={(e) => setDurationMin(parseInt(e.target.value || '30', 10))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Meeting URL (optional)</label>
                <input
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://meet..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Location (optional)</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Phone / Zoom / Office"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/70">
              <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="accent-amber-500" />
              Confirm immediately
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={schedule}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              >
                <CheckCircle2 size={14} /> Schedule
              </button>
            </div>
          </div>
        )}

        {pubOpen && (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-white font-semibold">Create public event</div>
                <div className="mt-1 text-white/70 text-sm">Shows on the public `/events` page for the active tenant.</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPubOpen(false);
                  setPubErr(null);
                }}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {pubErr && <div className="text-emerald-100 text-sm">{pubErr}</div>}

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Title</label>
                <input
                  value={pubTitle}
                  onChange={(e) => setPubTitle(e.target.value)}
                  placeholder="Credit Intel Live (Webinar)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Start</label>
                <input
                  type="datetime-local"
                  value={pubStartLocal}
                  onChange={(e) => setPubStartLocal(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Duration (min)</label>
                <input
                  type="number"
                  min={10}
                  max={240}
                  value={pubDurationMin}
                  onChange={(e) => setPubDurationMin(parseInt(e.target.value || '45', 10))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Description (optional)</label>
                <input
                  value={pubDesc}
                  onChange={(e) => setPubDesc(e.target.value)}
                  placeholder="What attendees will learn…"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Meeting URL (optional)</label>
                <input
                  value={pubMeetingUrl}
                  onChange={(e) => setPubMeetingUrl(e.target.value)}
                  placeholder="https://meet..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Location (optional)</label>
                <input
                  value={pubLocation}
                  onChange={(e) => setPubLocation(e.target.value)}
                  placeholder="Zoom / Meet / Office"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
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
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              >
                <CheckCircle2 size={14} /> Publish event
              </button>
            </div>
          </div>
        )}

        {openPublicRequests.length > 0 && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-emerald-400">
                <Send size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Public appointment requests (visitors)</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{openPublicRequests.length} open</div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openPublicRequests.map((r) => (
                <div key={r.id} className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
                  <div className="text-white font-semibold truncate">{r.fullName}</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                    {r.topic} • {r.status} • {fmtWhen(r.createdAt)}
                  </div>
                  <div className="text-white/70 text-sm truncate" title={r.email}>{r.email}</div>
                  <div className="text-white/70 text-sm whitespace-pre-wrap line-clamp-2">{r.availabilityNotes}</div>
                  {r.preferredSlotMinutes && <div className="text-white/50 text-xs">{r.preferredSlotMinutes} min preferred</div>}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPublicRequestStatus(r.id, 'triaged')}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    >
                      <Clock size={14} /> Triaged
                    </button>
                    <button
                      type="button"
                      onClick={() => openSchedulePublic(r.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                    >
                      <Plus size={14} /> Schedule
                    </button>
                    <button
                      type="button"
                      onClick={() => setPublicRequestStatus(r.id, 'closed')}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/60 transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Send size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Session requests</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{openRequests.length} open</div>
            </div>

            {openRequests.length === 0 ? (
              <div className="text-white/60 text-sm">No open requests.</div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {openRequests.map((r) => {
                  const p = partnerById.get(r.partnerId);
                  return (
                    <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">{p?.profile.fullName ?? r.partnerId}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            {r.topic} • {r.status} • {fmtWhen(r.createdAt)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/partners/${r.partnerId}`)}
                          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
                        >
                          Open partner <ArrowRight size={12} />
                        </button>
                      </div>

                      <div className="text-white/70 text-sm whitespace-pre-wrap">{r.availabilityNotes}</div>
                      {r.preferredDates && r.preferredDates.length > 0 && (
                        <div className="text-white/50 text-sm">Preferred: {r.preferredDates.join(', ')}</div>
                      )}
                      {r.notes && <div className="text-white/60 text-sm whitespace-pre-wrap">{r.notes}</div>}

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setRequestStatus(r.id, 'triaged')}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                        >
                          <Clock size={14} /> Triaged
                        </button>
                        <button
                          type="button"
                          onClick={() => openSchedule(r.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                        >
                          <Plus size={14} /> Schedule
                        </button>
                        <button
                          type="button"
                          onClick={() => setRequestStatus(r.id, 'closed')}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/60 transition-all"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Calendar size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Upcoming events</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                {upcomingEvents.length} scheduled
              </div>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="text-white/60 text-sm">No upcoming events.</div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {upcomingEvents.slice(0, 80).map((e) => {
                  const p = partnerById.get(e.partnerId);
                  return (
                    <div key={e.id} className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">{e.title}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            {p?.profile.fullName ?? e.partnerId} • {e.type} • {e.status}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/partners/${e.partnerId}`)}
                          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
                        >
                          Partner <ArrowRight size={12} />
                        </button>
                      </div>
                      <div className="text-white/70 text-sm">{fmtWhen(e.startAt)}</div>
                      {e.meetingUrl && (
                        <button
                          type="button"
                          onClick={() => window.open(e.meetingUrl!, '_blank', 'noopener,noreferrer')}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                        >
                          <LinkIcon size={14} /> Open link
                        </button>
                      )}
                      <details className="mt-2">
                        <summary className="cursor-pointer select-none text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white/80">
                          Meeting notes
                        </summary>
                        <div className="mt-2 space-y-2">
                          {editingNotesFor === e.id ? (
                            <>
                              <textarea
                                value={notesDraft}
                                onChange={(ev) => setNotesDraft(ev.target.value)}
                                placeholder="Add post-meeting notes..."
                                className="w-full min-h-[80px] bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 resize-y"
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
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditingNotesFor(null); setNotesDraft(''); }}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white/80"
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-white/70 text-sm whitespace-pre-wrap min-h-[24px]">
                                {e.meetingNotes || <span className="text-white/40 italic">No notes yet.</span>}
                              </div>
                              <button
                                type="button"
                                onClick={() => { setEditingNotesFor(e.id); setNotesDraft(e.meetingNotes || ''); }}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
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
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/15 text-[10px] font-black uppercase tracking-widest text-emerald-200 transition-all"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setEventStatus(e.id, 'cancelled')}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/15 text-[10px] font-black uppercase tracking-widest text-amber-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <Send size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Public events (/events)</span>
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              <Plus size={14} /> New public event
            </button>
          </div>

          {publicEvents.length === 0 ? (
            <div className="text-white/60 text-sm">No upcoming public events for this tenant.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {publicEvents.slice(0, 12).map((e) => (
                <div key={e.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                  <div className="text-white font-semibold">{e.title}</div>
                  <div className="text-white/70 text-sm">{fmtWhen(e.startAt)}</div>
                  {e.description ? <div className="text-white/60 text-sm">{e.description}</div> : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {e.meetingUrl ? (
                      <button
                        type="button"
                        onClick={() => window.open(e.meetingUrl!, '_blank', 'noopener,noreferrer')}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      >
                        <LinkIcon size={14} /> Open link
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setEventStatus(e.id, 'cancelled')}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/15 text-[10px] font-black uppercase tracking-widest text-amber-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

