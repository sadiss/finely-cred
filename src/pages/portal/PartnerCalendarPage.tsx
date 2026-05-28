import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Clock, Download, Link as LinkIcon, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import {
  createConsultationRequest,
  listEventsByPartner,
  listRequestsByPartner,
  sendUpcomingReminders,
} from '../../data/calendarRepo';
import type { ConsultationTopic } from '../../domain/calendar';
import { calendarEventToIcs } from '../../utils/ics';
import { downloadText } from '../../utils/download';

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

const TOPICS: Array<{ id: ConsultationTopic; label: string; desc: string }> = [
  { id: 'credit_restore', label: 'Credit restore', desc: 'Disputes, tradelines, bureau strategy, evidence.' },
  { id: 'business_build', label: 'Business build', desc: 'Fundability, vendors, entity readiness.' },
  { id: 'debt_summons', label: 'Debt & summons', desc: 'Validation, SOL, summons workflow, legal drafts.' },
  { id: 'identity_theft', label: 'Identity theft', desc: 'Freezes, fraud alerts, blocking fraudulent items.' },
  { id: 'billing', label: 'Billing', desc: 'Plan, agreements, entitlements.' },
  { id: 'affiliate', label: 'Affiliate', desc: 'Program onboarding and terms.' },
  { id: 'other', label: 'Other', desc: 'General support and guidance.' },
];

export default function PartnerCalendarPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    // Local-first reminder pass; creates notifications when events are close.
    sendUpcomingReminders({ withinHours: 24 });
  }, [version]);

  const events = useMemo(() => (partner ? listEventsByPartner(partner.id) : []), [partner, version]);
  const requests = useMemo(() => (partner ? listRequestsByPartner(partner.id) : []), [partner, version]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => Date.parse(e.endAt) >= now && e.status !== 'cancelled')
      .slice()
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  }, [events]);

  const [topic, setTopic] = useState<ConsultationTopic>('credit_restore');
  const [availability, setAvailability] = useState('');
  const [preferredDates, setPreferredDates] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;
    setErr(null);
    const dates = preferredDates
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);
    if (!availability.trim()) {
      setErr('Please add availability notes (days/times/timezone).');
      return;
    }
    createConsultationRequest({
      partnerId: partner.id,
      topic,
      availabilityNotes: availability.trim(),
      preferredDates: dates,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notes: notes.trim() || undefined,
    });
    setSubmitted(true);
    setAvailability('');
    setPreferredDates('');
    setNotes('');
    setTimeout(() => setSubmitted(false), 2500);
  };

  return (
    <PageShell
      badge="Partner Portal"
      title="Calendar & Enlightenment Sessions"
      subtitle="Request a session, view scheduled meetings, and export events to your calendar."
    >
      {!partner ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
            No partner profile found for this account.
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => navigate('/portal/dashboard')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              title="Back to Partner Dashboard"
            >
              <ArrowLeft size={16} /> Partner Dashboard
            </button>
            <button
              onClick={() => navigate('/portal/messages')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
            >
              Message support <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Send size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Request a session</span>
              </div>

              {submitted && (
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-emerald-100 text-sm">
                  Request submitted. We’ll schedule and confirm your meeting soon.
                </div>
              )}
              {err && (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-amber-100 text-sm">
                  {err}
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Topic</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value as ConsultationTopic)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                  >
                    {TOPICS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-white/50 text-xs">{TOPICS.find((t) => t.id === topic)?.desc}</div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Availability</label>
                  <textarea
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    rows={4}
                    placeholder="Example: Mon–Wed after 2pm, Fri mornings. Timezone: America/New_York."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 resize-y"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
                    Preferred dates (optional)
                  </label>
                  <input
                    value={preferredDates}
                    onChange={(e) => setPreferredDates(e.target.value)}
                    placeholder="YYYY-MM-DD, YYYY-MM-DD"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="What do you want to accomplish on the call?"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 resize-y"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                >
                  Submit request <ArrowRight size={14} />
                </button>
              </form>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-3">
                <div className="inline-flex items-center gap-2 text-amber-400">
                  <Calendar size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Upcoming meetings</span>
                </div>
                {upcoming.length === 0 ? (
                  <div className="text-white/60 text-sm">No meetings scheduled yet.</div>
                ) : (
                  <div className="space-y-3">
                    {upcoming.slice(0, 6).map((e) => (
                      <div key={e.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                        <div className="text-white font-semibold">{e.title}</div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          {fmtWhen(e.startAt)} • {e.status}
                        </div>
                        {e.meetingUrl && (
                          <button
                            type="button"
                            onClick={() => window.open(e.meetingUrl!, '_blank', 'noopener,noreferrer')}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                          >
                            <LinkIcon size={14} /> Open meeting link
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const ics = calendarEventToIcs(e);
                            downloadText({
                              text: ics,
                              filename: `${e.title.replace(/[^\w\- ]+/g, '').slice(0, 60) || 'meeting'}.ics`,
                              mimeType: 'text/calendar;charset=utf-8',
                            });
                          }}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/15 text-[10px] font-black uppercase tracking-widest text-emerald-200 transition-all"
                          title="Download iCal (.ics)"
                        >
                          <Download size={14} /> Download iCal
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-3">
                <div className="inline-flex items-center gap-2 text-amber-400">
                  <Clock size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Your requests</span>
                </div>
                {requests.length === 0 ? (
                  <div className="text-white/60 text-sm">No requests yet.</div>
                ) : (
                  <div className="space-y-2">
                    {requests.slice(0, 6).map((r) => (
                      <div key={r.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <div className="text-white/80 font-semibold text-sm">{r.topic.replace('_', ' ')}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          {r.status} • {fmtWhen(r.createdAt)}
                        </div>
                        <div className="mt-2 text-white/60 text-sm line-clamp-3">{r.availabilityNotes}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

