import React, { useState } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { SovereignCommandOverview } from '../../features/sovereignGrowthCommandStack/SovereignCommandOverview';
import { SovereignOrgIntelligencePanel } from '../../features/sovereignGrowthCommandStack/SovereignOrgIntelligencePanel';
import { SovereignMissionControlPanel } from '../../features/sovereignGrowthCommandStack/SovereignMissionControlPanel';
import { SovereignMarketingAmplifierPanel } from '../../features/sovereignGrowthCommandStack/SovereignMarketingAmplifierPanel';
import { SovereignLeadCaptureAmplifierPanel } from '../../features/sovereignGrowthCommandStack/SovereignLeadCaptureAmplifierPanel';
import { SovereignConversationCommandPanel } from '../../features/sovereignGrowthCommandStack/SovereignConversationCommandPanel';
import { SovereignGeoIntelligencePanel } from '../../features/sovereignGrowthCommandStack/SovereignGeoIntelligencePanel';

type Tab = 'overview' | 'staff' | 'missions' | 'marketing' | 'capture' | 'conversations' | 'geo';

const tabs: Array<{ id: Tab; label: string; desc: string }> = [
  { id: 'overview', label: 'Command', desc: 'Intelligence score and system readiness' },
  { id: 'staff', label: 'Staff', desc: 'Hierarchy, identity, portraits, departments' },
  { id: 'missions', label: 'Missions', desc: 'Choose 1-3 agents and run work' },
  { id: 'marketing', label: 'Marketing', desc: 'Meta, social, video, voice, creative' },
  { id: 'capture', label: 'Capture', desc: 'Short links, pages, forms, nurture' },
  { id: 'conversations', label: 'Conversations', desc: 'Human-like staff responses and memory' },
  { id: 'geo', label: 'Geo', desc: 'City cells, blockers, owners, next moves' },
];

export default function AdminSovereignGrowthCommandPage() {
  const [tab, setTab] = useState<Tab>('overview');
  return (
    <PageShell badge="Admin" title="Sovereign Growth Command Stack" subtitle="The high-command layer for staff, marketing, lead capture, video/voice, geo, conversations, and mission ownership.">
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-2 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-2xl px-4 py-3 text-left transition-all min-w-[150px] ${tab === item.id ? 'bg-amber-400 text-black' : 'bg-white/[0.03] text-white/70 hover:bg-white/[0.07]'}`}>
              <div className="text-[10px] uppercase tracking-widest font-black">{item.label}</div>
              <div className={`mt-1 text-[11px] ${tab === item.id ? 'text-black/70' : 'text-white/40'}`}>{item.desc}</div>
            </button>
          ))}
        </div>
        {tab === 'overview' && <SovereignCommandOverview />}
        {tab === 'staff' && <SovereignOrgIntelligencePanel />}
        {tab === 'missions' && <SovereignMissionControlPanel />}
        {tab === 'marketing' && <SovereignMarketingAmplifierPanel />}
        {tab === 'capture' && <SovereignLeadCaptureAmplifierPanel />}
        {tab === 'conversations' && <SovereignConversationCommandPanel />}
        {tab === 'geo' && <SovereignGeoIntelligencePanel />}
      </div>
    </PageShell>
  );
}
