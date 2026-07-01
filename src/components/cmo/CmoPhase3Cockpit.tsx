import React, { useState } from 'react';
import { CmoAutopilotPanel } from './CmoAutopilotPanel';
import { CmoPlaybookBoard } from './CmoPlaybookBoard';
import { CmoLeadQuotaPanel } from './CmoLeadQuotaPanel';
import { CmoExperimentLab } from './CmoExperimentLab';
import { CmoIntegrationHealthPanel } from './CmoIntegrationHealthPanel';
import { CmoBriefingPanel } from './CmoBriefingPanel';

const TABS = ['Autopilot', 'Playbooks', 'Lead Math', 'Experiments', 'Briefs', 'Integrations'] as const;
type Tab = typeof TABS[number];

export function CmoPhase3Cockpit() {
  const [tab, setTab] = useState<Tab>('Autopilot');
  return (
    <div className="space-y-5">
      <div className="fc-panel overflow-hidden p-2">
        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button key={item} type="button" className={`rounded-xl px-4 py-2 text-sm transition ${tab === item ? 'bg-amber-300 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`} onClick={() => setTab(item)}>{item}</button>
          ))}
        </div>
      </div>
      {tab === 'Autopilot' ? <CmoAutopilotPanel /> : null}
      {tab === 'Playbooks' ? <CmoPlaybookBoard /> : null}
      {tab === 'Lead Math' ? <CmoLeadQuotaPanel /> : null}
      {tab === 'Experiments' ? <CmoExperimentLab /> : null}
      {tab === 'Briefs' ? <CmoBriefingPanel /> : null}
      {tab === 'Integrations' ? <CmoIntegrationHealthPanel /> : null}
    </div>
  );
}
