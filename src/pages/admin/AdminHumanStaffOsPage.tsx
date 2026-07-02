import React, { useMemo, useState } from 'react';
import { ArrowLeft, Bell, BookOpen, Brain, MessageSquare, Network, Rocket, Users, MapPinned } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { HumanStaffConversationPanel } from '../../features/humanStaffOs/HumanStaffConversationPanel';
import { HumanStaffDirectoryPanel } from '../../features/humanStaffOs/HumanStaffDirectoryPanel';
import { HumanStaffGeoOpsPanel } from '../../features/humanStaffOs/HumanStaffGeoOpsPanel';
import { HumanStaffKnowledgePanel } from '../../features/humanStaffOs/HumanStaffKnowledgePanel';
import { HumanStaffMissionControlPanel } from '../../features/humanStaffOs/HumanStaffMissionControlPanel';
import { HumanStaffNotificationsPanel } from '../../features/humanStaffOs/HumanStaffNotificationsPanel';
import { HumanStaffOverviewPanel } from '../../features/humanStaffOs/HumanStaffOverviewPanel';
import { loadHumanStaffStore, resetHumanStaffDemo } from '../../features/humanStaffOs/humanStaffRepo';
import { getHumanStaffAgent } from '../../features/humanStaffOs/humanStaffDirectory';
import { HumanStaffAvatar } from '../../features/humanStaffOs/HumanStaffAvatar';

type View = 'overview' | 'directory' | 'missions' | 'conversation' | 'notifications' | 'knowledge' | 'geo';

export default function AdminHumanStaffOsPage() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [view, setView] = useState<View>('overview');
  const store = useMemo(() => loadHumanStaffStore(), [version]);
  const selectedAgents = store.selectedAgentIds.map((id) => getHumanStaffAgent(id));
  const refresh = () => setVersion((v) => v + 1);
  const tabs: Array<{ id: View; label: string; icon: React.ComponentType<{ size?: number }> }> = [
    { id: 'overview', label: 'Command Floor', icon: Brain },
    { id: 'directory', label: 'Staff Directory', icon: Users },
    { id: 'missions', label: 'Mission Control', icon: Rocket },
    { id: 'conversation', label: 'Talk to Staff', icon: MessageSquare },
    { id: 'notifications', label: 'Staff Inbox', icon: Bell },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'geo', label: 'Geo Ops', icon: MapPinned },
  ];

  return (
    <PageShell
      badge="Admin"
      title="Human Staff OS"
      subtitle="A deeper staff command layer for agent identity, hierarchy, mission ownership, durable conversations, notifications, geo ownership, and response variety."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"><ArrowLeft size={16} /> Admin Dashboard</button>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/admin/staff')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/[0.08]"><Network size={13} /> Classic Staff</button>
            <button type="button" onClick={() => navigate('/admin/lead-engine-system')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/[0.08]">Lead Engine</button>
            <button type="button" onClick={() => { resetHumanStaffDemo(); refresh(); }} className="inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-100 hover:bg-amber-500/15">Reset demo</button>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-black/25 p-4 flex flex-wrap items-center gap-3">
          <div className="text-[10px] uppercase tracking-widest text-white/35 font-black mr-1">Selected mission staff</div>
          {selectedAgents.map((agent) => <div key={agent.id} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2"><HumanStaffAvatar agent={agent} size="sm" /><span className="text-xs font-bold text-white/75">{agent.name}</span></div>)}
          {!selectedAgents.length ? <div className="text-sm text-white/45">No staff selected. Mission Control will recommend a team.</div> : null}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = view === tab.id;
            return <button key={tab.id} type="button" onClick={() => setView(tab.id)} className={`shrink-0 inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'border-amber-400 bg-amber-500 text-black' : 'border-white/10 bg-black/25 text-white/65 hover:bg-white/[0.06]'}`}><Icon size={14} />{tab.label}</button>;
          })}
        </div>

        {view === 'overview' && <HumanStaffOverviewPanel missions={store.missions} threads={store.threads} notifications={store.notifications} />}
        {view === 'directory' && <HumanStaffDirectoryPanel selectedIds={store.selectedAgentIds} onChanged={refresh} />}
        {view === 'missions' && <HumanStaffMissionControlPanel selectedIds={store.selectedAgentIds} onChanged={refresh} />}
        {view === 'conversation' && <HumanStaffConversationPanel selectedIds={store.selectedAgentIds} onChanged={refresh} />}
        {view === 'notifications' && <HumanStaffNotificationsPanel notifications={store.notifications} onChanged={refresh} />}
        {view === 'knowledge' && <HumanStaffKnowledgePanel />}
        {view === 'geo' && <HumanStaffGeoOpsPanel />}
      </div>
    </PageShell>
  );
}
