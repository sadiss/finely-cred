import React, { useMemo, useState } from 'react';
import { Activity, CheckCircle2, Play, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { DEFAULT_LEAD_ENGINE_CITIES, LEAD_ENGINE_SOURCE_PLANS } from './citySourceVault';
import { buildLeadEngineReport, loadLeadEngineStore, updateLeadEngineSettings } from './leadEngineSystemRepo';
import { runLocalSwarmTick, startContinuousSwarm, summarizeSwarmStatus } from './swarmRuntime';

export function LeadIntelDeepSwarmPanel() {
  const [version, setVersion] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const store = useMemo(() => loadLeadEngineStore(), [version]);
  const status = useMemo(() => summarizeSwarmStatus(), [version]);
  const report = useMemo(() => buildLeadEngineReport('Live'), [version]);

  const refresh = () => setVersion((v) => v + 1);

  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-amber-300 text-[10px] uppercase tracking-widest font-black">
            <Activity size={16} /> Continuous Lead Intel Swarm
          </div>
          <h2 className="mt-2 text-2xl font-black text-white">Start the real background search engine</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/60">
            This is the dev-side replacement for the quick one-shot search. It creates a rotating job queue across cities, sources, funnels, and query variants, then feeds the Action Center.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const jobs = startContinuousSwarm({ maxPerCity: 80 });
              setNotice(`Queued ${jobs.length} continuous swarm jobs. Run ticks locally or deploy Supabase worker tick.`);
              refresh();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-black hover:brightness-110"
          >
            <Play size={14} /> Start Swarm
          </button>
          <button
            type="button"
            onClick={() => {
              const res = runLocalSwarmTick({ maxJobs: 8 });
              setNotice(`Processed ${res.jobsProcessed} jobs and produced ${res.candidates.length} candidate records.`);
              refresh();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/75 hover:bg-white/[0.08]"
          >
            <RefreshCw size={14} /> Run Tick
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          {notice}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-6">
        {[
          ['Queued', status.queued],
          ['Running', status.running],
          ['Done', status.done],
          ['Candidates', status.candidates],
          ['Hot', status.hot],
          ['Action backlog', status.actionBacklog],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">{label}</div>
            <div className="mt-2 text-2xl font-black text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="inline-flex items-center gap-2 text-white font-bold"><Search size={16} className="text-amber-300" /> City focus</div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {DEFAULT_LEAD_ENGINE_CITIES.slice(0, 12).map((city) => {
              const checked = store.settings.cities.includes(city.id);
              return (
                <label key={city.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked ? Array.from(new Set([...store.settings.cities, city.id])) : store.settings.cities.filter((id) => id !== city.id);
                      updateLeadEngineSettings({ cities: next });
                      refresh();
                    }}
                  />
                  <span>{city.label}, {city.state}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="inline-flex items-center gap-2 text-white font-bold"><ShieldCheck size={16} className="text-emerald-300" /> Source controls</div>
          <div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {LEAD_ENGINE_SOURCE_PLANS.map((source) => {
              const checked = store.settings.sources.includes(source.id);
              return (
                <label key={source.id} className="block rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked ? Array.from(new Set([...store.settings.sources, source.id])) : store.settings.sources.filter((id) => id !== source.id);
                        updateLeadEngineSettings({ sources: next as any });
                        refresh();
                      }}
                    />
                    <div>
                      <div className="text-white/90 font-semibold">{source.label}</div>
                      <div className="mt-1 text-xs text-white/45">{source.complianceNote}</div>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="inline-flex items-center gap-2 text-white font-bold"><CheckCircle2 size={16} className="text-emerald-300" /> Live bottlenecks</div>
        <div className="mt-3 space-y-2 text-sm text-white/65">
          {report.bottlenecks.length ? report.bottlenecks.map((b) => <div key={b} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-100">{b}</div>) : <div>No bottlenecks yet. Keep ticks running and review Action Center.</div>}
        </div>
      </div>
    </div>
  );
}
