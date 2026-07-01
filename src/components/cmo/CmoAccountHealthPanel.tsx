import React, { useState } from 'react';
import { addCmoAccountHealthReport, loadCmoPhase4State } from '../../data/cmoPhase4Repo';
import { buildCmoAccountHealthReport, rankCmoAccountsByOpportunity } from '../../lib/cmoPhase4/cmoAccountHealthEngine';

export function CmoAccountHealthPanel() {
  const [state, setState] = useState(loadCmoPhase4State());

  function runHealthCheck() {
    let nextState = state;
    for (const account of state.accounts) {
      nextState = addCmoAccountHealthReport(
        buildCmoAccountHealthReport({ account, recentJobs: state.queue, recentEvents: state.webhookEvents }),
      );
    }
    setState(nextState);
  }

  const ranked = rankCmoAccountsByOpportunity(state.healthReports).slice(0, 8);

  return (
    <section className="fc-panel p-5 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">Account intelligence</p>
          <h2 className="text-2xl font-semibold text-white">CMO Account Health</h2>
          <p className="mt-1 text-sm text-slate-300">Find broken auth, weak velocity, missing lead paths, and compliance blocks before they cost money.</p>
        </div>
        <button type="button" className="fc-button-brand" onClick={runHealthCheck}>
          Run health check
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {ranked.map((report) => (
          <article key={report.id} className="fc-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{report.platform}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">Health score {report.healthScore}</h3>
              </div>
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">{report.checkedAt.slice(0, 10)}</span>
            </div>
            {report.warnings.length ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {report.warnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            ) : <p className="mt-3 text-sm text-slate-300">No warnings. Keep feeding the machine.</p>}
            {report.recommendedActions.length ? (
              <p className="mt-3 text-sm text-amber-100">Next: {report.recommendedActions[0]}</p>
            ) : null}
          </article>
        ))}
        {ranked.length === 0 ? <div className="fc-card p-5 text-sm text-slate-300">Run a health check to see account risks.</div> : null}
      </div>
    </section>
  );
}
