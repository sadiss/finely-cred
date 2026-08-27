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
import { finelyOsCatalogCard, finelyOsMicroStat, FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';

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

  const swarmStatAccents = ['emerald', 'violet', 'sky', 'rose'] as const;

  return (
    <section className="space-y-6">
      <FinelyOsAlertBanner
        tone="info"
        message="Simulation queue below · Live Serper imports run via Marketing Desk Find, Caleb auto-find, or Live bridge tick (marketing-hunt-tick)."
      />

      <div className={`${finelyOsCatalogCard('emerald')} relative overflow-hidden`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 text-emerald-300 text-sm font-black uppercase tracking-[0.2em]">
                <Radar size={18} /> Lead Intel practice mode
              </div>
              <span className="rounded-full border border-violet-400/40 bg-violet-500/20 px-3 py-1 text-xs font-black uppercase tracking-widest text-violet-100">
                Simulation
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-extrabold text-white">Practice queue + live Serper bridge</h2>
            <p className="mt-3 text-base font-semibold text-white/80">
              Local ticks train ops cadence. Real partner leads land in{' '}
              <strong className="text-emerald-200">Marketing Desk → Find</strong> or Caleb when Serper is wired.
            </p>
            {session ? (
              <p className="mt-3 inline-flex items-center gap-2 text-violet-200 text-sm font-semibold">
                <Clock size={16} /> Sim session · {session.jobsTotal} jobs · {session.mode}
              </p>
            ) : null}
            {enabled && phaseLabel ? (
              <p className="mt-2 text-sm text-white/60 truncate max-w-2xl">Now: {phaseLabel}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={start} disabled={busy} className={FINELY_OS_SECONDARY_BTN}>
              <Play size={14} /> {busy ? 'Queuing…' : 'Start practice queue'}
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

      <div className={`${finelyOsCatalogCard('violet')} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-white font-extrabold text-xl inline-flex items-center gap-2">
            <Zap size={20} className="text-violet-300" /> Live Serper queue bridge
          </div>
          <span className={finelyOsMicroStat('violet')}>{liveBridge.shardSummary}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {liveBridge.metroPack.map((city) => (
            <span key={city} className={finelyOsMicroStat('sky')}>{city}</span>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className={finelyOsCatalogCard('emerald')}>
            <div className="text-white/55 uppercase tracking-wider text-xs font-extrabold">Review queue</div>
            <div className="mt-2 text-3xl font-extrabold text-white">{fmt(liveBridge.stagingPending)}</div>
          </div>
          <div className={finelyOsCatalogCard('violet')}>
            <div className="text-white/55 uppercase tracking-wider text-xs font-extrabold">Last Find</div>
            <div className="mt-2 text-3xl font-extrabold text-white">
              {liveBridge.lastFindFound != null ? fmt(liveBridge.lastFindFound) : '—'}
            </div>
            <div className="mt-1 text-sm font-semibold text-white/50 truncate">{liveBridge.lastFindAt ? new Date(liveBridge.lastFindAt).toLocaleString() : 'Not run yet'}</div>
          </div>
          <div className={finelyOsCatalogCard('sky')}>
            <div className="text-white/55 uppercase tracking-wider text-xs font-extrabold">Auto-saved</div>
            <div className="mt-2 text-3xl font-extrabold text-emerald-200">
              {liveBridge.lastFindAutoSaved != null ? fmt(liveBridge.lastFindAutoSaved) : '—'}
            </div>
          </div>
          <div className={finelyOsCatalogCard('rose')}>
            <div className="text-white/55 uppercase tracking-wider text-xs font-extrabold">Worker probe</div>
            <div className="mt-2 text-lg font-extrabold text-white truncate">{liveBridge.workerMode || 'Not probed'}</div>
            <div className="mt-1 text-sm font-semibold text-white/50 truncate">{liveBridge.workerMessage || 'Run Caleb Test search'}</div>
          </div>
        </div>
        {liveMsg ? <p className="text-sm font-semibold text-violet-200">{liveMsg}</p> : null}
        <a href="/admin/marketing-desk?helper=find" className="inline-flex items-center gap-2 text-sm font-extrabold text-sky-200 hover:text-sky-100">
          Open Find for live imports <ArrowRight size={16} />
        </a>
      </div>

      <p className="text-sm font-semibold text-white/55">Simulation stats track local queue only — not CRM rows. Live bridge invokes marketing-hunt-tick when Supabase is connected.</p>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {([['jobs', stats.totalJobs], ['discovered', stats.discovered], ['enriched', stats.enriched], ['hot', stats.hot], ['imported', stats.imported], ['sources', stats.sourceCount], ['queued', stats.queued], ['running', stats.running]] as const).map(([label, value], idx) => (
          <div key={label} className={finelyOsCatalogCard(swarmStatAccents[idx % swarmStatAccents.length])} data-fc-accent={swarmStatAccents[idx % swarmStatAccents.length]}>
            <div className="text-xs uppercase tracking-[0.2em] text-white/50 font-extrabold">{label}</div>
            <div className="mt-2 text-3xl font-extrabold text-white">{fmt(Number(value))}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className={finelyOsCatalogCard('sky')}>
          <div className="flex items-center justify-between gap-3"><h3 className="text-white font-extrabold text-xl">Source adapters</h3><span className="text-white/50 text-sm font-bold">{LEAD_INTEL_SOURCE_ADAPTERS.length} configured</span></div>
          <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {LEAD_INTEL_SOURCE_ADAPTERS.slice(0, 12).map((s, idx) => {
              const runtime = getLeadIntelSourceRuntimeMode(s.id);
              const runtimeCls =
                runtime === 'live'
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-violet-400/30 bg-violet-500/10 text-violet-200';
              const rowAccent = swarmStatAccents[idx % swarmStatAccents.length];
              return (
              <div key={s.id} className={finelyOsCatalogCard(rowAccent)} data-fc-accent={rowAccent}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-white font-extrabold text-base">{s.label}</div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${runtimeCls}`}>
                        {getLeadIntelSourceRuntimeLabel(s.id)}
                      </span>
                    </div>
                    <div className="mt-2 text-white/55 text-sm font-semibold">{s.method} • {s.defaultCadenceMinutes}m</div>
                  </div>
                  <ShieldCheck size={18} className={runtime === 'live' ? 'text-emerald-300' : 'text-violet-300'} />
                </div>
              </div>
            );})}
            <p className="text-sm font-semibold text-white/45">+{LEAD_INTEL_SOURCE_ADAPTERS.length - 12} more in rotation</p>
          </div>
        </div>
        <div className={finelyOsCatalogCard('rose')}>
          <div className="flex items-center justify-between gap-3"><h3 className="text-white font-extrabold text-xl">Ops feed</h3><span className="inline-flex items-center gap-2 text-rose-200 text-sm font-extrabold"><Activity size={16} /> {enabled ? 'sim + live bridge' : 'paused'}</span></div>
          <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {feed.length === 0 ? <div className={`${finelyOsCatalogCard('violet')} text-white/70 text-base font-semibold`}>Start the practice queue or run Live bridge to see feed events.</div> : feed.map((f, idx) => (
              <div key={f.id} className={finelyOsCatalogCard(swarmStatAccents[idx % swarmStatAccents.length])} data-fc-accent={swarmStatAccents[idx % swarmStatAccents.length]}>
                <div className="flex items-start justify-between gap-3"><div className="text-white text-base font-semibold"><span className="text-violet-200 font-extrabold">{staffFeedAgentLabel(f.agent)}</span> • {f.city}</div><span className="text-xs uppercase tracking-widest text-white/45 font-extrabold">{f.severity}</span></div>
                <div className="mt-2 text-white/70 text-base">{f.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={finelyOsCatalogCard('emerald')}>
        <h3 className="text-white font-extrabold text-xl inline-flex items-center gap-2"><Search size={20} className="text-emerald-300" /> Queued simulation jobs</h3>
        <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto">
          {jobs.filter((j) => j.status !== 'done').slice(0, 25).map((j, idx) => (
            <div key={j.id} className={finelyOsCatalogCard(swarmStatAccents[idx % swarmStatAccents.length])} data-fc-accent={swarmStatAccents[idx % swarmStatAccents.length]}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-white font-extrabold text-base">{j.city} • {j.sourceId}</div>
                <div className="text-xs uppercase tracking-widest text-white/50 font-extrabold">{j.phase ?? 'discovering'} • {j.progress}%</div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${j.progress}%` }} /></div>
              <div className="mt-2 text-white/65 text-sm font-semibold">{j.message}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
