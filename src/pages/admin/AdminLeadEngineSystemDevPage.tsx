import React, { useState } from 'react';
import { ArrowLeft, ClipboardList, Link2, RadioTower, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { LeadIntelActionCenter } from '../../features/leadEngineSystemDev/LeadIntelActionCenter';
import { LeadIntelDeepSwarmPanel } from '../../features/leadEngineSystemDev/LeadIntelDeepSwarmPanel';
import { TrackedLinksReportPanel } from '../../features/leadEngineSystemDev/TrackedLinksReportPanel';

type Tab = 'swarm' | 'actions' | 'links';

export default function AdminLeadEngineSystemDevPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('swarm');
  const tabs: Array<{ id: Tab; label: string; Icon: LucideIcon }> = [
    { id: 'swarm', label: 'Continuous Swarm', Icon: RadioTower },
    { id: 'actions', label: 'Action Center', Icon: ClipboardList },
    { id: 'links', label: 'Tracked Links', Icon: Link2 },
  ];
  return (
    <PageShell badge="Admin" title="Lead Engine System Dev" subtitle="Continuous Lead Intel, action recommendations, tracked links, CRM handoff, and reporting. This is the missing execution layer after Start Swarm.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"><ArrowLeft size={16} /> Admin Dashboard</button>
          <button onClick={() => navigate('/admin/lead-intel')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/[0.08]">Open current Lead Intel</button>
        </div>
        <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/30 p-2">
          {tabs.map((x) => {
            const Icon = x.Icon;
            const active = tab === x.id;
            return (
              <button key={x.id} type="button" onClick={() => setTab(x.id)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-amber-500 text-black' : 'text-white/60 hover:bg-white/[0.06] hover:text-white'}`}><Icon size={14} /> {x.label}</button>
            );
          })}
        </div>
        {tab === 'swarm' && <LeadIntelDeepSwarmPanel />}
        {tab === 'actions' && <LeadIntelActionCenter />}
        {tab === 'links' && <TrackedLinksReportPanel />}
      </div>
    </PageShell>
  );
}
