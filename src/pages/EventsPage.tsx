import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Clock, Link as LinkIcon, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { Button } from '../components/ui';
import { listCalendarEvents } from '../data/calendarRepo';
import { getActiveTenantId } from '../tenancy/activeTenant';

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function EventsPage() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const events = useMemo(() => {
    const tenantId = getActiveTenantId();
    const publicKey = `public:${tenantId}`;
    const now = Date.now();
    return listCalendarEvents()
      .filter((e) => e.partnerId === publicKey && e.type === 'ops' && e.status !== 'cancelled')
      .filter((e) => Date.parse(e.endAt) >= now)
      .slice()
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
      .slice(0, 24);
  }, [version]);

  return (
    <PageShell
      badge="Public"
      title="Events & Webinars"
      subtitle="Live trainings, Q&A, and walkthroughs — designed to help you pick the right lane and move with precision."
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="text-white/30 text-sm">Prefer 1:1 guidance? Book a free enlightenment session.</div>
          <div className="ml-auto">
            <Button onClick={() => navigate('/consultation')} size="sm">
              Book a free enlightenment session <ArrowRight size={16} />
            </Button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-white/60 text-sm">
            No upcoming public events are scheduled right now. Book a free enlightenment session and we’ll get you into the right lane.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {events.map((e) => {
              const durationMin = (() => {
                const s = Date.parse(e.startAt);
                const en = Date.parse(e.endAt);
                if (!Number.isFinite(s) || !Number.isFinite(en)) return null;
                const m = Math.max(0, Math.round((en - s) / 60000));
                return m || null;
              })();
              return (
                <div
                  key={e.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-white text-xl font-semibold">{e.title}</div>
                      <div className="text-white/60 text-sm leading-relaxed">{e.description || 'Live event'}</div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                      <Video size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Live</span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="flex items-center gap-2 text-white/60 text-xs">
                        <Calendar size={14} /> When
                      </div>
                      <div className="mt-1 text-white font-semibold">{fmtWhen(e.startAt)}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="flex items-center gap-2 text-white/60 text-xs">
                        <Clock size={14} /> Duration
                      </div>
                      <div className="mt-1 text-white font-semibold">{durationMin ? `${durationMin} min` : '—'}</div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {e.meetingUrl ? (
                      <Button onClick={() => window.open(e.meetingUrl!, '_blank', 'noopener,noreferrer')} size="sm">
                        Open event link <LinkIcon size={16} />
                      </Button>
                    ) : (
                      <Button onClick={() => navigate('/consultation')} size="sm">
                        Book a free enlightenment session <ArrowRight size={16} />
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => navigate('/tradelines')} size="sm">
                      Explore Premium Tradelines
                    </Button>
                  </div>

                  <p className="mt-4 text-white/35 text-xs leading-relaxed">
                    Schedules can change. No guarantees, outcomes vary, and educational content is not legal advice.
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}

