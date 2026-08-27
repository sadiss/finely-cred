import React, { useState } from 'react';
import { CmoAutopilotPanel } from './CmoAutopilotPanel';
import { CmoPlaybookBoard } from './CmoPlaybookBoard';
import { CmoLeadQuotaPanel } from './CmoLeadQuotaPanel';
import { CmoExperimentLab } from './CmoExperimentLab';
import { CmoIntegrationHealthPanel } from './CmoIntegrationHealthPanel';
import { CmoBriefingPanel } from './CmoBriefingPanel';
import { finelyOsViewTab } from '../../features/os/finelyOsLightUi';

const TABS = ['Autopilot', 'Playbooks', 'Lead Math', 'Experiments', 'Briefs', 'Integrations'] as const;
const TAB_ACCENTS = ['rose', 'emerald', 'violet', 'sky', 'emerald', 'sky'] as const;
type Tab = typeof TABS[number];

export function CmoPhase3Cockpit() {
  const [tab, setTab] = useState<Tab>('Autopilot');
  return (
    <div className="space-y-5">
      <div className="fc-panel overflow-hidden p-2">
        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((item, idx) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              className={finelyOsViewTab(tab === item, TAB_ACCENTS[idx])}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
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
