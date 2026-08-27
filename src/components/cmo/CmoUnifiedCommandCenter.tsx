import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Bot,
  BrainCircuit,
  Crown,
  Eye,
  FlaskConical,
  HeartPulse,
  LineChart,
  MessageSquareText,
  Moon,
  PieChart,
  Play,
  Send,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { CmoStaffRoom } from './CmoStaffRoom';
import { CMOSiteWatchPanel } from './CMOSiteWatchPanel';
import { CMOMLCommandPanel } from './CMOMLCommandPanel';
import { CmoAutopilotPanel } from './CmoAutopilotPanel';
import { CmoPlaybookBoard } from './CmoPlaybookBoard';
import { CmoExperimentLab } from './CmoExperimentLab';
import { CmoAccountOpsPanel } from './CmoAccountOpsPanel';
import { CmoPublishingQueuePanel } from './CmoPublishingQueuePanel';
import { CmoAccountHealthPanel } from './CmoAccountHealthPanel';
import { CmoScaleCommandPanel } from './CmoScaleCommandPanel';
import { CmoForecastPanel } from './CmoForecastPanel';
import { CmoLeadQuotaPanel } from './CmoLeadQuotaPanel';
import { CmoBriefingPanel } from './CmoBriefingPanel';
import { CmoActionGate } from './CmoActionGate';
import { CmoBudgetAllocatorPanel } from './CmoBudgetAllocatorPanel';
import { CmoIntegrationHealthPanel } from './CmoIntegrationHealthPanel';
import { Overnight50AdminNav } from '../overnight50/Overnight50AdminNav';
import { LeadIntelSwarmDashboard } from '../../features/overnight50/LeadIntelSwarmDashboard';
import { SyntheticStaffFloor } from '../../features/overnight50/SyntheticStaffFloor';
import { finelyOsViewTab } from '../../features/os/finelyOsLightUi';

const TAB_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

export type CmoCommandTab =
  | 'staff'
  | 'watch'
  | 'ml'
  | 'autopilot'
  | 'playbooks'
  | 'quota'
  | 'experiments'
  | 'accounts'
  | 'publishing'
  | 'health'
  | 'scale'
  | 'forecasts'
  | 'briefs'
  | 'budget'
  | 'integrations'
  | 'brief'
  | 'gates'
  | 'overnight';

const TABS: Array<{ id: CmoCommandTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'staff', label: 'Staff Room', icon: MessageSquareText },
  { id: 'watch', label: 'Site Watch', icon: Eye },
  { id: 'ml', label: 'ML / Copy', icon: BrainCircuit },
  { id: 'autopilot', label: 'Autopilot', icon: Play },
  { id: 'playbooks', label: 'Playbooks', icon: Crown },
  { id: 'quota', label: 'Lead Math', icon: PieChart },
  { id: 'experiments', label: 'Experiments', icon: FlaskConical },
  { id: 'accounts', label: 'Accounts', icon: Users },
  { id: 'publishing', label: 'Publishing', icon: Send },
  { id: 'health', label: 'Acct Health', icon: HeartPulse },
  { id: 'scale', label: 'Scale Brain', icon: Activity },
  { id: 'forecasts', label: 'Forecasts', icon: LineChart },
  { id: 'briefs', label: 'Briefs', icon: BarChart3 },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'integrations', label: 'Integrations', icon: PieChart },
  { id: 'gates', label: 'Gates', icon: ShieldCheck },
  { id: 'overnight', label: 'Overnight50', icon: Moon },
];

type Props = {
  embedded?: boolean;
  defaultTab?: CmoCommandTab;
};

export function CmoUnifiedCommandCenter({ embedded = false, defaultTab = 'staff' }: Props) {
  const [tab, setTab] = useState<CmoCommandTab>(defaultTab);

  return (
    <div className={embedded ? 'space-y-4' : 'space-y-6'}>
      {!embedded ? (
        <header className="fc-panel rounded-3xl border border-violet-500/30 bg-violet-500/10 p-5 lg:p-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-violet-300">
            <Bot className="h-4 w-4" /> CMO Command
          </div>
          <h1 className="mt-2 text-2xl font-black text-white md:text-3xl">Finely Cred growth operating system</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
            Eyes, hands, daily rhythm, accounts, publishing governance, scale intelligence, and 200-lead/day forecasting —
            approval-first for outbound and external publish.
          </p>
        </header>
      ) : null}

      <div className="fc-panel overflow-hidden rounded-2xl border border-sky-500/20 p-2">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
          {TABS.map((t, idx) => {
            const Icon = t.icon;
            const active = tab === t.id;
            const accent = TAB_ACCENTS[idx % TAB_ACCENTS.length];
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`shrink-0 ${finelyOsViewTab(active, accent)} !min-w-0 gap-1.5 !px-3 !py-2 !text-[10px] !uppercase !tracking-wider sm:!text-[11px]`}
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-w-0">
        {tab === 'staff' ? <CmoStaffRoom /> : null}
        {tab === 'watch' ? <CMOSiteWatchPanel /> : null}
        {tab === 'ml' ? <CMOMLCommandPanel /> : null}
        {tab === 'autopilot' ? <CmoAutopilotPanel /> : null}
        {tab === 'playbooks' ? <CmoPlaybookBoard /> : null}
        {tab === 'quota' ? <CmoLeadQuotaPanel /> : null}
        {tab === 'experiments' ? <CmoExperimentLab /> : null}
        {tab === 'accounts' ? <CmoAccountOpsPanel /> : null}
        {tab === 'publishing' ? <CmoPublishingQueuePanel /> : null}
        {tab === 'health' ? <CmoAccountHealthPanel /> : null}
        {tab === 'scale' ? <CmoScaleCommandPanel /> : null}
        {tab === 'forecasts' ? <CmoForecastPanel /> : null}
        {tab === 'briefs' ? <CmoBriefingPanel /> : null}
        {tab === 'budget' ? <CmoBudgetAllocatorPanel /> : null}
        {tab === 'integrations' ? <CmoIntegrationHealthPanel /> : null}
        {tab === 'gates' ? <CmoActionGate /> : null}
        {tab === 'overnight' ? (
          <div className="space-y-6">
            <Overnight50AdminNav />
            <LeadIntelSwarmDashboard />
            <SyntheticStaffFloor />
          </div>
        ) : null}
      </div>
    </div>
  );
}
