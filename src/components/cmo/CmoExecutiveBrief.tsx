import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowRight, BarChart3, CalendarClock, Crown, Sparkles, Target } from 'lucide-react';
import { cmoSummary, listCmoCampaigns, listCmoDirectives, listCmoScheduledPosts } from '../../data/cmoPhase2Repo';
import { recommendChannels, trainCmoModelFromEvents } from '../../lib/cmoPhase2/cmoLearningEngine';

export function CmoExecutiveBrief({ compact = false }: { compact?: boolean }) {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const data = useMemo(() => {
    const summary = cmoSummary();
    const campaigns = listCmoCampaigns().slice(0, 3);
    const directives = listCmoDirectives(5).filter((d) => d.status === 'needs_review' || d.status === 'draft');
    const posts = listCmoScheduledPosts().filter((p) => ['needs_review', 'approved', 'scheduled'].includes(p.status)).slice(0, 5);
    const model = trainCmoModelFromEvents();
    const channels = recommendChannels({ limit: 4 });
    return { summary, campaigns, directives, posts, model, channels };
  }, [version]);

  return (
    <section className="fc-panel p-5 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-white/[0.03]" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-amber-200">
            <Crown size={14} /> CMO Prime Brief
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Growth OS is watching the money paths.</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/62">
            Campaigns, lead motion, scheduler, comms, media, and site-watch signals in one staff-style cockpit. The CMO can be funny, but the numbers are not doing stand-up.
          </p>
        </div>
        <button type="button" onClick={() => setVersion((v) => v + 1)} className="fc-button-soft text-xs">
          Refresh brief
        </button>
      </div>

      <div className="relative mt-5 grid gap-3 md:grid-cols-4">
        <Metric icon={Target} label="Leads tracked" value={data.summary.leads} hint="local + emitted events" />
        <Metric icon={CalendarClock} label="Posts queued" value={data.summary.scheduled} hint="approval/schedule queue" />
        <Metric icon={Sparkles} label="Directives" value={data.summary.pendingDirectives} hint="needs review" />
        <Metric icon={BarChart3} label="Booked calls" value={data.summary.booked} hint="event-based" />
      </div>

      {!compact ? (
        <div className="relative mt-5 grid gap-4 lg:grid-cols-3">
          <div className="fc-card p-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/45"><Activity size={14} /> Recommended channels</div>
            <div className="mt-3 space-y-2">
              {data.channels.map((x) => (
                <div key={x.channel} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-3 py-2">
                  <span className="text-sm font-semibold text-white capitalize">{x.channel.replace(/_/g, ' ')}</span>
                  <span className="text-xs font-black text-amber-200">{x.score}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="fc-card p-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/45"><AlertTriangle size={14} /> Work queue</div>
            <div className="mt-3 space-y-2">
              {data.directives.length ? data.directives.slice(0, 4).map((d) => (
                <div key={d.id} className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2">
                  <div className="text-sm font-semibold text-white">{d.title}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-widest text-white/45">{d.priority} • {d.status}</div>
                </div>
              )) : <p className="text-sm text-white/55">No pending directives. Suspiciously peaceful.</p>}
            </div>
          </div>
          <div className="fc-card p-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/45"><ArrowRight size={14} /> Active campaigns</div>
            <div className="mt-3 space-y-2">
              {data.campaigns.length ? data.campaigns.map((c) => (
                <div key={c.id} className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2">
                  <div className="text-sm font-semibold text-white">{c.title}</div>
                  <div className="mt-1 text-[11px] text-white/45">{c.objective.replace(/_/g, ' ')} • score {c.score150 ?? '—'}</div>
                </div>
              )) : <p className="text-sm text-white/55">No campaigns staged yet. The machine is waiting for orders.</p>}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Metric({ icon: Icon, label, value, hint }: { icon: any; label: string; value: number | string; hint: string }) {
  return (
    <div className="fc-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">{label}</div>
          <div className="mt-2 text-2xl font-black text-white">{value}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-200"><Icon size={18} /></div>
      </div>
      <div className="mt-2 text-xs text-white/45">{hint}</div>
    </div>
  );
}
