import React, { useState } from 'react';
import { loadCmoPhase5State } from '../../data/cmoPhase5Repo';

export function CmoForecastPanel() {
  const [state] = useState(loadCmoPhase5State());
  const forecasts = state.forecasts.slice(0, 5);
  return (
    <section className="fc-panel p-5 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">Lead math</p>
        <h2 className="text-2xl font-semibold text-white">Forecast History</h2>
        <p className="mt-1 text-sm text-slate-300">CMO Prime should not guess. It should show the math and tell you where the bottleneck lives.</p>
      </div>
      <div className="grid gap-3">
        {forecasts.map((forecast) => (
          <article key={forecast.id} className="fc-card p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h3 className="font-semibold text-white">{forecast.projectedDailyLeads}/{forecast.targetDailyLeads} projected daily leads</h3>
              <span className="text-xs text-slate-400">{forecast.generatedAt}</span>
            </div>
            {forecast.bottlenecks.length ? (
              <p className="mt-2 text-sm text-amber-100">{forecast.bottlenecks[0]}</p>
            ) : <p className="mt-2 text-sm text-emerald-200">Plan is on or above target. Now execute without getting cute.</p>}
          </article>
        ))}
        {forecasts.length === 0 ? <div className="fc-card p-5 text-sm text-slate-300">No forecasts yet.</div> : null}
      </div>
    </section>
  );
}
