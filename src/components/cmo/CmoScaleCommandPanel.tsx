import React, { useState } from 'react';
import { addCmoBudgetAllocation, addCmoLeadForecast, loadCmoPhase5State, saveCmoChannelModels } from '../../data/cmoPhase5Repo';
import { buildCmoBudgetAllocation } from '../../lib/cmoPhase5/cmoBudgetAllocator';
import { buildCmoLeadForecast } from '../../lib/cmoPhase5/cmoGrowthForecastEngine';
import { buildCmoChannelModels, generateDemoCmoGrowthEvents } from '../../lib/cmoPhase5/cmoPredictiveLeadEngine';

export function CmoScaleCommandPanel() {
  const [state, setState] = useState(loadCmoPhase5State());
  const latestForecast = state.forecasts[0];
  const latestBudget = state.budgetAllocations[0];

  function runScaleBrain() {
    const sourceEvents = state.events.length ? state.events : generateDemoCmoGrowthEvents();
    const models = buildCmoChannelModels(sourceEvents);
    saveCmoChannelModels(models);
    const forecast = buildCmoLeadForecast(models, 200);
    addCmoLeadForecast(forecast);
    const budget = buildCmoBudgetAllocation(models, 0);
    const next = addCmoBudgetAllocation(budget);
    setState(next);
  }

  return (
    <section className="fc-panel p-5 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">Phase 5</p>
          <h2 className="text-2xl font-semibold text-white">CMO Scale Intelligence</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-300">
            Forecast leads, rank channels, protect spend, and tell the CMO what to scale, fix, kill, or test next.
          </p>
        </div>
        <button type="button" className="fc-button-brand" onClick={runScaleBrain}>Run scale brain</button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Target leads/day" value={latestForecast?.targetDailyLeads ?? 200} />
        <Metric label="Projected leads/day" value={latestForecast?.projectedDailyLeads ?? 0} />
        <Metric label="Projected booked calls" value={latestForecast?.projectedBookedCalls ?? 0} />
        <Metric label="Confidence" value={Math.round((latestForecast?.confidence ?? 0) * 100)} suffix="%" />
      </div>

      {latestForecast ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {latestForecast.requiredActions.map((action) => (
            <article key={`${action.channel}-${action.action}`} className="fc-card p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-200/60">{action.channel}</p>
              <h3 className="mt-1 font-semibold text-white">{action.expectedLeads} expected leads</h3>
              <p className="mt-2 text-sm text-slate-300">{action.action}</p>
              <p className="mt-2 text-xs text-slate-400">Daily volume: {action.dailyVolume} · Owner: {action.owner}</p>
            </article>
          ))}
        </div>
      ) : <div className="fc-card p-5 text-sm text-slate-300">Run the scale brain to generate today's lead forecast and orders.</div>}

      {latestBudget ? (
        <div className="fc-card p-4">
          <h3 className="text-lg font-semibold text-white">Budget + effort guardrails</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
            {latestBudget.guardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="fc-card p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}{suffix}</p>
    </div>
  );
}
