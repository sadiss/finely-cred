import React, { useMemo, useState } from 'react';
import { Bot, CheckCircle2, Play, ShieldAlert, Zap } from 'lucide-react';
import { buildDailyAutopilotRun } from '../../lib/cmoPhase3/cmoAutopilotOrchestrator';
import { getCmoAutopilotSettings, listCmoRuns, updateCmoAutopilotSettings } from '../../data/cmoPhase3Repo';
import type { CmoAutonomousRun } from '../../domain/cmoPhase3';

export function CmoAutopilotPanel() {
  const [settings, setSettings] = useState(() => getCmoAutopilotSettings());
  const [runs, setRuns] = useState<CmoAutonomousRun[]>(() => listCmoRuns());
  const latest = runs[0];
  const summary = useMemo(() => {
    if (!latest) return 'No run staged yet. Start the daily autopilot run to create today\'s mission.';
    return latest.executiveSummary;
  }, [latest]);

  const runDaily = () => {
    const run = buildDailyAutopilotRun(settings);
    setRuns([run, ...listCmoRuns().filter((item) => item.id !== run.id)]);
  };

  return (
    <section className="fc-panel p-5 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-amber-300/80">Phase 3 Autopilot</p>
          <h2 className="text-2xl font-semibold text-white">CMO Autopilot Command</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">Stages the daily growth run, routes safe internal work, blocks risky actions, and keeps external publishing approval-first.</p>
        </div>
        <button type="button" className="fc-button-brand inline-flex items-center gap-2" onClick={runDaily}>
          <Play className="h-4 w-4" /> Stage Daily Run
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Daily leads" value={settings.dailyLeadTarget} />
        <Metric label="Qualified leads" value={settings.dailyQualifiedLeadTarget} />
        <Metric label="Booked calls" value={settings.dailyBookedCallTarget} />
        <Metric label="Autonomy" value={settings.autonomyLevel.replaceAll('_', ' ')} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="fc-card p-4">
          <div className="flex items-center gap-2 text-amber-200"><Zap className="h-4 w-4" /><span className="font-medium">Latest CMO orders</span></div>
          <p className="mt-3 text-sm text-slate-200">{summary}</p>
          {latest ? (
            <div className="mt-4 grid gap-2">
              {latest.nextBestActions.map((action) => (
                <div key={action} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200">{action}</div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="fc-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-200"><ShieldAlert className="h-4 w-4" /><span className="font-medium">Safety gates</span></div>
          <label className="block text-xs text-slate-400">Autonomy mode</label>
          <select
            className="fc-input w-full"
            value={settings.autonomyLevel}
            onChange={(event) => {
              const next = updateCmoAutopilotSettings({ autonomyLevel: event.target.value as typeof settings.autonomyLevel });
              setSettings(next);
            }}
          >
            <option value="manual">Manual</option>
            <option value="draft_only">Draft only</option>
            <option value="safe_internal_auto">Safe internal auto</option>
            <option value="approval_required_external">Approval-required external</option>
          </select>
          <p className="text-xs text-slate-400">External posting and outbound sending stay approval-first. The CMO can move fast without driving the brand into a ditch.</p>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="fc-card p-4">
      <div className="flex items-center gap-2 text-slate-400"><CheckCircle2 className="h-4 w-4" /><span className="text-xs uppercase tracking-[0.16em]">{label}</span></div>
      <div className="mt-2 text-2xl font-semibold text-white"><Bot className="mr-2 inline h-5 w-5 text-amber-300" />{value}</div>
    </div>
  );
}
