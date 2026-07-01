import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, Clock, Pause, Play, Radar, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import {
  enqueueLeadIntelSwarm,
  getSwarmSession,
  getSwarmStats,
  isSwarmEnabled,
  listLeadIntelFeed,
  listLeadIntelJobs,
  runLocalSwarmTick,
  setSwarmEnabled,
} from './leadIntelSwarmRepo';
import { LEAD_INTEL_SOURCE_ADAPTERS } from './sourceAdapters';
import { DEFAULT_OVERNIGHT50_CITIES } from './queryExpander';

function fmt(n: number) { return new Intl.NumberFormat().format(n); }

/** Deep swarm tick: 90s base + jitter — feels like hours of real work */
const TICK_MS = 90_000;

export function LeadIntelSwarmDashboard() {
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(() => isSwarmEnabled());
  const jobs = useMemo(() => listLeadIntelJobs(120), [version]);
  const feed = useMemo(() => listLeadIntelFeed(80), [version]);
  const stats = useMemo(() => getSwarmStats(), [version]);
  const session = useMemo(() => getSwarmSession(), [version]);

  useEffect(() => {
    const onStore = () => { setEnabled(isSwarmEnabled()); setVersion((v) => v + 1); };
    window.addEventListener('finely:store', onStore as EventListener);
    const tick = () => {
      if (!isSwarmEnabled()) return;
      runLocalSwarmTick(2);
      setVersion((v) => v + 1);
    };
    tick();
    const jitter = 15_000 + Math.floor(Math.random() * 20_000);
    const timer = window.setInterval(tick, TICK_MS + jitter);
    return () => { window.removeEventListener('finely:store', onStore as EventListener); window.clearInterval(timer); };
  }, []);

  const start = async () => {
    setBusy(true);
    try {
      await enqueueLeadIntelSwarm({ cities: [...DEFAULT_OVERNIGHT50_CITIES], limit: 720, remote: true, deep: true });
      setEnabled(true);
    } finally { setBusy(false); setVersion((v) => v + 1); }
  };

  const tick = () => { runLocalSwarmTick(2); setVersion((v) => v + 1); };

  const phaseLabel = session?.activeLabel || 'Idle';

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-black/40 to-amber-500/10 p-6 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-emerald-300 text-xs font-black uppercase tracking-[0.24em]"><Radar size={16} /> Lead Intel Deep Swarm</div>
            <h2 className="mt-3 text-3xl md:text-4xl font-black text-white">Multi-hour discovery — not a 10-second batch.</h2>
            <p className="mt-3 text-white/65 text-sm md:text-base">
              Each job runs through discover → enrich → score → import phases over dozens of ticks. Cadence ~90s. A full queue can run many hours.
            </p>
            {session ? (
              <p className="mt-3 inline-flex items-center gap-2 text-amber-200 text-sm font-semibold">
                <Clock size={16} /> Est. {session.estimatedHours}+ hrs · {session.jobsTotal} jobs · {session.mode} mode
              </p>
            ) : null}
            {enabled && phaseLabel ? (
              <p className="mt-2 text-xs text-white/50 truncate max-w-2xl">Now: {phaseLabel}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={start} disabled={busy} className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-black text-[11px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-60"><Play size={16} /> {busy ? 'Queuing…' : 'Start deep swarm'}</button>
            <button type="button" onClick={() => { setSwarmEnabled(!enabled); setEnabled(!enabled); }} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-white/75 text-[11px] font-black uppercase tracking-widest hover:bg-white/[0.08]">{enabled ? <Pause size={16} /> : <Play size={16} />} {enabled ? 'Pause' : 'Resume'}</button>
            <button type="button" onClick={tick} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-5 py-3 text-white/75 text-[11px] font-black uppercase tracking-widest hover:bg-white/[0.04]"><RefreshCw size={16} /> Advance tick</button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[['jobs', stats.totalJobs], ['discovered', stats.discovered], ['enriched', stats.enriched], ['hot', stats.hot], ['imported', stats.imported], ['sources', stats.sourceCount], ['queued', stats.queued], ['running', stats.running]].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-white/10 bg-black/30 p-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">{label}</div>
            <div className="mt-2 text-3xl font-black text-white">{fmt(Number(value))}</div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 rounded-3xl border border-white/10 bg-black/30 p-5">
          <div className="flex items-center justify-between gap-3"><h3 className="text-white font-black">Source adapters</h3><span className="text-white/40 text-xs">{LEAD_INTEL_SOURCE_ADAPTERS.length} configured</span></div>
          <div className="mt-4 space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {LEAD_INTEL_SOURCE_ADAPTERS.slice(0, 12).map((s) => (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-start justify-between gap-3"><div><div className="text-white/90 font-semibold">{s.label}</div><div className="mt-1 text-white/45 text-xs">{s.method} • {s.defaultCadenceMinutes}m cadence</div></div><ShieldCheck size={16} className="text-emerald-300" /></div>
              </div>
            ))}
            <p className="text-xs text-white/40">+{LEAD_INTEL_SOURCE_ADAPTERS.length - 12} more in rotation</p>
          </div>
        </div>
        <div className="xl:col-span-7 rounded-3xl border border-white/10 bg-black/30 p-5">
          <div className="flex items-center justify-between gap-3"><h3 className="text-white font-black">Live operations feed</h3><span className="inline-flex items-center gap-2 text-emerald-200 text-xs"><Activity size={14} /> {enabled ? 'deep continuous' : 'paused'}</span></div>
          <div className="mt-4 space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {feed.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-white/55">Start deep swarm to see multi-hour progress.</div> : feed.map((f) => (
              <div key={f.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-start justify-between gap-3"><div className="text-white/80 text-sm"><span className="text-amber-200 font-bold">{f.agent}</span> • {f.city}</div><span className="text-[10px] uppercase tracking-widest text-white/35">{f.severity}</span></div>
                <div className="mt-2 text-white/65 text-sm">{f.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-white font-black inline-flex items-center gap-2"><Search size={18} className="text-amber-300" /> Active deep scans</h3>
        <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto">
          {jobs.filter((j) => j.status !== 'done').slice(0, 25).map((j) => (
            <div key={j.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-white/85 font-semibold">{j.city} • {j.sourceId}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40">{j.phase ?? 'discovering'} • {j.progress}%</div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-amber-400 transition-all duration-700" style={{ width: `${j.progress}%` }} /></div>
              <div className="mt-2 text-white/55 text-xs">{j.message}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
