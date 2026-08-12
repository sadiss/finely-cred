import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, Clock, Pause, Play, Radar, RefreshCw, Search, ShieldCheck, Zap } from 'lucide-react';
import {
  enqueueLeadIntelSwarm,
  getLiveSerperBridgeSnapshot,
  getSwarmSession,
  getSwarmStats,
  isSwarmEnabled,
  listLeadIntelFeed,
  listLeadIntelJobs,
  runLiveSerperBridgeTick,
  runLocalSwarmTick,
  setSwarmEnabled,
} from './leadIntelSwarmRepo';
import { getDailyMetroShardPack } from '../marketingDesk/usMetroShardMap';
import { countMarketingStagingPending, getMarketingFindLastRun } from '../marketingDesk/marketingDeskHunt';
import { getLastGrowthWorkerProbe } from '../growthAgents/growthWorkerTick';
import { LEAD_INTEL_SOURCE_ADAPTERS, getLeadIntelSourceRuntimeLabel, getLeadIntelSourceRuntimeMode } from './sourceAdapters';
import { staffFeedAgentLabel } from '../staffCommandCenter/staffRoster';
import { FinelyOsAlertBanner } from '../os/FinelyOsAlertBanner';
import { finelyOsCatalogCardCompact, finelyOsMicroStat, FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';

function fmt(n: number) { return new Intl.NumberFormat().format(n); }

/** Local simulation tick cadence — paired with optional live Serper bridge. */
const TICK_MS = 90_000;
const LIVE_BRIDGE_MS = 20 * 60 * 1000;

export function LeadIntelSwarmDashboard() {
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [liveBusy, setLiveBusy] = useState(false);
  const [liveMsg, setLiveMsg] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(() => isSwarmEnabled());
  const jobs = useMemo(() => listLeadIntelJobs(120), [version]);
  const feed = useMemo(() => listLeadIntelFeed(80), [version]);
  const stats = useMemo(() => getSwarmStats(), [version]);
  const session = useMemo(() => getSwarmSession(), [version]);
  const liveBridge = useMemo(() => {
    void version;
    const last = getMarketingFindLastRun();
    const worker = getLastGrowthWorkerProbe();
    return getLiveSerperBridgeSnapshot({
      stagingPending: countMarketingStagingPending(),
      lastFindAt: last?.at,
      lastFindFound: last?.found,
      lastFindAutoSaved: last?.autoSaved,
      workerMode: worker?.mode,
      workerMessage: worker?.message,
      workerAt: worker?.at,
    });
  }, [version]);

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
    const simTimer = window.setInterval(tick, TICK_MS + jitter);
    const liveTimer = window.setInterval(() => {
      if (!isSwarmEnabled()) return;
      void runLiveSerperBridgeTick().then((r) => {
        if (r.ok) setLiveMsg(r.message);
        setVersion((v) => v + 1);
      });
    }, LIVE_BRIDGE_MS);
    return () => {
      window.removeEventListener('finely:store', onStore as EventListener);
      window.clearInterval(simTimer);
      window.clearInterval(liveTimer);
    };
  }, []);

  const start = async () => {
    setBusy(true);
    try {
      const metros = getDailyMetroShardPack().map((c) => c.split(',')[0]!.trim());
      await enqueueLeadIntelSwarm({ cities: metros, limit: 720, remote: true, deep: true });
      setEnabled(true);
    } finally { setBusy(false); setVersion((v) => v + 1); }
  };

  const tick = () => { runLocalSwarmTick(2); setVersion((v) => v + 1); };

  const liveTick = async () => {
    setLiveBusy(true);
    try {
      const r = await runLiveSerperBridgeTick();
      setLiveMsg(r.message);
    } finally {
      setLiveBusy(false);
      setVersion((v) => v + 1);
    }
  };

  const phaseLabel = session?.activeLabel || 'Idle';

  return (
    <section className="space-y-3">
      <FinelyOsAlertBanner
        tone="info"
        message="Simulation queue below · Live Serper imports run via Marketing Desk Find, Caleb auto-find, or Live bridge tick (marketing-hunt-tick)."
      />

      <div className={`${finelyOsCatalogCardCompact('emerald')} relative overflow-hidden`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-emerald-300 text-xs font-black uppercase tracking-[0.2em]">
              <Radar size={14} /> Lead Intel Deep Swarm
            </div>
            <h2 className="mt-2 text-xl font-black text-white">Deep swarm + live Serper bridge</h2>
            <p className="mt-2 text-white/65 text-sm">
              Local ticks train ops cadence. Real partner leads land in{' '}
              <strong className="text-emerald-200">Marketing Desk → Find</strong> or Caleb when Serper is wired.
            </p>
            {session ? (
              <p className="mt-2 inline-flex items-center gap-2 text-amber-200/90 text-xs font-semibold">
                <Clock size={14} /> Sim session · {session.jobsTotal} jobs · {session.mode}
              </p>
            ) : null}
            {enabled && phaseLabel ? (
              <p className="mt-1 text-xs text-white/50 truncate max-w-2xl">Now: {phaseLabel}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={start} disabled={busy} className={FINELY_OS_SECONDARY_BTN}>
              <Play size={14} /> {busy ? 'Queuing…' : 'Start swarm'}
            </button>
            <button type="button" onClick={() => { setSwarmEnabled(!enabled); setEnabled(!enabled); }} className={FINELY_OS_SECONDARY_BTN}>
              {enabled ? <Pause size={14} /> : <Play size={14} />} {enabled ? 'Pause' : 'Resume'}
            </button>
            <button type="button" onClick={tick} className={FINELY_OS_SECONDARY_BTN}>
              <RefreshCw size={14} /> Sim tick
            </button>
            <button type="button" onClick={liveTick} disabled={liveBusy} className={FINELY_OS_SECONDARY_BTN}>
              <Zap size={14} /> {liveBusy ? 'Live…' : 'Live bridge'}
            </button>
          </div>
        </div>
      </div>

      <div className={`${finelyOsCatalogCardCompact('sky')} space-y-2`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-white font-bold text-sm inline-flex items-center gap-2">
            <Zap size={16} className="text-sky-300" /> Live Serper queue bridge
          </div>
          <span className={finelyOsMicroStat('sky')}>{liveBridge.shardSummary}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {liveBridge.metroPack.map((city) => (
            <span key={city} className={finelyOsMicroStat('emerald')}>{city}</span>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="text-white/45 uppercase tracking-wider text-[10px]">Review queue</div>
            <div className="mt-1 text-lg font-black text-white">{fmt(liveBridge.stagingPending)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="text-white/45 uppercase tracking-wider text-[10px]">Last Find</div>
            <div className="mt-1 text-lg font-black text-white">
              {liveBridge.lastFindFound != null ? fmt(liveBridge.lastFindFound) : '—'}
            </div>
            <div className="text-white/40 truncate">{liveBridge.lastFindAt ? new Date(liveBridge.lastFindAt).toLocaleString() : 'Not run yet'}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="text-white/45 uppercase tracking-wider text-[10px]">Auto-saved</div>
            <div className="mt-1 text-lg font-black text-emerald-200">
              {liveBridge.lastFindAutoSaved != null ? fmt(liveBridge.lastFindAutoSaved) : '—'}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="text-white/45 uppercase tracking-wider text-[10px]">Worker probe</div>
            <div className="mt-1 text-sm font-bold text-white truncate">{liveBridge.workerMode || 'Not probed'}</div>
            <div className="text-white/40 truncate">{liveBridge.workerMessage || 'Run Caleb Test search'}</div>
          </div>
        </div>
        {liveMsg ? <p className="text-xs text-sky-200/90">{liveMsg}</p> : null}
        <a href="/admin/marketing-desk?helper=find" className="inline-flex items-center gap-1 text-xs text-amber-200 hover:text-amber-100">
          Open Find for live imports <ArrowRight size={12} />
        </a>
      </div>

      <p className="text-xs text-white/45">Simulation stats track local queue only — not CRM rows. Live bridge invokes marketing-hunt-tick when Supabase is connected.</p>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
        {[['jobs', stats.totalJobs], ['discovered', stats.discovered], ['enriched', stats.enriched], ['hot', stats.hot], ['imported', stats.imported], ['sources', stats.sourceCount], ['queued', stats.queued], ['running', stats.running]].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">{label}</div>
            <div className="mt-1 text-2xl font-black text-white">{fmt(Number(value))}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-center justify-between gap-3"><h3 className="text-white font-black text-sm">Source adapters</h3><span className="text-white/40 text-xs">{LEAD_INTEL_SOURCE_ADAPTERS.length} configured</span></div>
          <div className="mt-3 space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {LEAD_INTEL_SOURCE_ADAPTERS.slice(0, 12).map((s) => {
              const runtime = getLeadIntelSourceRuntimeMode(s.id);
              const runtimeCls =
                runtime === 'live'
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-amber-400/25 bg-amber-500/10 text-amber-200/90';
              return (
              <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-white/90 font-semibold text-sm">{s.label}</div>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${runtimeCls}`}>
                        {getLeadIntelSourceRuntimeLabel(s.id)}
                      </span>
                    </div>
                    <div className="mt-1 text-white/45 text-xs">{s.method} • {s.defaultCadenceMinutes}m</div>
                  </div>
                  <ShieldCheck size={14} className={runtime === 'live' ? 'text-emerald-300' : 'text-amber-300/80'} />
                </div>
              </div>
            );})}
            <p className="text-xs text-white/40">+{LEAD_INTEL_SOURCE_ADAPTERS.length - 12} more in rotation</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-center justify-between gap-3"><h3 className="text-white font-black text-sm">Ops feed</h3><span className="inline-flex items-center gap-2 text-amber-200/90 text-xs"><Activity size={14} /> {enabled ? 'sim + live bridge' : 'paused'}</span></div>
          <div className="mt-3 space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {feed.length === 0 ? <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-white/55 text-sm">Start deep swarm or run Live bridge to see feed events.</div> : feed.map((f) => (
              <div key={f.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                <div className="flex items-start justify-between gap-3"><div className="text-white/80 text-sm"><span className="text-amber-200 font-bold">{staffFeedAgentLabel(f.agent)}</span> • {f.city}</div><span className="text-[10px] uppercase tracking-widest text-white/35">{f.severity}</span></div>
                <div className="mt-1 text-white/65 text-sm">{f.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="text-white font-black text-sm inline-flex items-center gap-2"><Search size={16} className="text-amber-300" /> Queued simulation jobs</h3>
        <div className="mt-3 space-y-2 max-h-[360px] overflow-y-auto">
          {jobs.filter((j) => j.status !== 'done').slice(0, 25).map((j) => (
            <div key={j.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-white/85 font-semibold text-sm">{j.city} • {j.sourceId}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40">{j.phase ?? 'discovering'} • {j.progress}%</div>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-amber-400 transition-all duration-700" style={{ width: `${j.progress}%` }} /></div>
              <div className="mt-1 text-white/55 text-xs">{j.message}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
