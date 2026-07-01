import React from 'react';
import { Target } from 'lucide-react';
import { getCmoAutopilotSettings } from '../../data/cmoPhase3Repo';
import { buildTwoHundredLeadQuotaPlan, summarizeLeadQuota } from '../../lib/cmoPhase3/cmoLeadQuotaEngine';

export function CmoLeadQuotaPanel() {
  const settings = getCmoAutopilotSettings();
  const plan = buildTwoHundredLeadQuotaPlan(settings.dailyLeadTarget, settings.allowedChannels);
  const summary = summarizeLeadQuota(plan);
  return (
    <section className="fc-panel p-5 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-amber-300/80">200 Leads/Day Math</p>
        <h2 className="text-2xl font-semibold text-white">Lead quota engine</h2>
        <p className="mt-2 text-sm text-slate-300">This is the operating plan, not fairy dust. The CMO divides the daily number across channels and shows the required actions.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="fc-card p-4"><span className="text-xs uppercase tracking-[0.16em] text-slate-400">Target</span><p className="text-2xl font-semibold text-white">{summary.totalLeads}</p></div>
        <div className="fc-card p-4"><span className="text-xs uppercase tracking-[0.16em] text-slate-400">Projected qualified</span><p className="text-2xl font-semibold text-white">{summary.projectedQualifiedLeads}</p></div>
        <div className="fc-card p-4"><span className="text-xs uppercase tracking-[0.16em] text-slate-400">Projected booked</span><p className="text-2xl font-semibold text-white">{summary.projectedBookedCalls}</p></div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {plan.map((item) => (
          <div key={item.channel} className="fc-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2"><Target className="h-4 w-4 text-amber-300" /><h3 className="font-semibold text-white">{item.channel.replaceAll('_', ' ')}</h3></div>
              <strong className="text-amber-100">{item.dailyLeadGoal}/day</strong>
            </div>
            <p className="mt-2 text-sm text-slate-300">{item.actionLabel}</p>
            <p className="mt-2 text-xs text-slate-500">Actions/day: {item.requiredDailyActions} | Assets needed: {item.minimumAssetsNeeded}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
