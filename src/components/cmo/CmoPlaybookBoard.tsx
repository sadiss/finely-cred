import React, { useState } from 'react';
import { BookOpen, Rocket } from 'lucide-react';
import type { CmoCampaignPlaybook } from '../../domain/cmoPhase3';
import { listCmoPlaybooks, saveManyCmoPlaybooks } from '../../data/cmoPhase3Repo';
import { buildDefaultCmoPlaybooks } from '../../lib/cmoPhase3/cmoCampaignPlaybooks';
import { buildCampaignLaunchRun } from '../../lib/cmoPhase3/cmoAutopilotOrchestrator';

export function CmoPlaybookBoard() {
  const [playbooks, setPlaybooks] = useState<CmoCampaignPlaybook[]>(() => listCmoPlaybooks());
  const loadDefaults = () => setPlaybooks(saveManyCmoPlaybooks(buildDefaultCmoPlaybooks()));
  const launch = (playbook: CmoCampaignPlaybook) => {
    buildCampaignLaunchRun(playbook.id);
    setPlaybooks(listCmoPlaybooks());
  };

  return (
    <section className="fc-panel p-5 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-amber-300/80">Campaign Playbooks</p>
          <h2 className="text-2xl font-semibold text-white">Campaigns that already know where the money is supposed to go</h2>
        </div>
        <button type="button" className="fc-button-soft inline-flex items-center gap-2" onClick={loadDefaults}><BookOpen className="h-4 w-4" /> Load default playbooks</button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {playbooks.map((playbook) => (
          <article key={playbook.id} className="fc-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{playbook.name}</h3>
                <p className="mt-1 text-sm text-slate-300">{playbook.objective}</p>
              </div>
              <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-xs text-amber-100">{playbook.priorityScore}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {playbook.channels.map((channel) => <span key={channel} className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-300">{channel}</span>)}
            </div>
            <p className="text-sm text-slate-400"><strong className="text-slate-200">Lead goal:</strong> {playbook.leadTargetPerDay}/day</p>
            <p className="text-sm text-slate-400"><strong className="text-slate-200">Hypothesis:</strong> {playbook.conversionHypothesis}</p>
            <button type="button" className="fc-button-brand inline-flex items-center gap-2" onClick={() => launch(playbook)}><Rocket className="h-4 w-4" /> Stage launch run</button>
          </article>
        ))}
        {!playbooks.length ? <div className="fc-card p-6 text-sm text-slate-300">No playbooks loaded yet. Load defaults and the CMO gets its marching orders.</div> : null}
      </div>
    </section>
  );
}
