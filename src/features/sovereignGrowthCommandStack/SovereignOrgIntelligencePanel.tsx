import React, { useMemo, useState } from 'react';
import { sovereignAgents, sovereignDepartments } from './sovereignAgentDirectory';
import { SovereignStaffAvatar } from './SovereignStaffAvatar';
import type { SovereignDepartmentId } from './types';

export function SovereignOrgIntelligencePanel() {
  const [department, setDepartment] = useState<SovereignDepartmentId | 'all'>('all');
  const agents = useMemo(() => department === 'all' ? sovereignAgents : sovereignAgents.filter((a) => a.department === department), [department]);
  const [selectedId, setSelectedId] = useState(agents[0]?.id ?? '');
  const selected = sovereignAgents.find((a) => a.id === selectedId) ?? agents[0] ?? sovereignAgents[0];

  return (
    <div className="grid xl:grid-cols-12 gap-5">
      <div className="xl:col-span-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Department hierarchy</div>
          <h2 className="mt-2 text-2xl font-black text-white">Who works where</h2>
          <p className="mt-2 text-sm text-white/60">Lead Intel stays connected to Leads/CRM, but the staff who run it live here, organized by department and mission ownership.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setDepartment('all')} className={`rounded-xl px-3 py-2 text-[10px] uppercase tracking-widest font-black border ${department === 'all' ? 'bg-amber-400 text-black border-amber-200' : 'bg-black/30 text-white/60 border-white/10'}`}>All</button>
          {sovereignDepartments.map((d) => (
            <button key={d.id} onClick={() => setDepartment(d.id as SovereignDepartmentId)} className={`rounded-xl px-3 py-2 text-[10px] uppercase tracking-widest font-black border ${department === d.id ? 'bg-amber-400 text-black border-amber-200' : 'bg-black/30 text-white/60 border-white/10'}`}>{d.name}</button>
          ))}
        </div>
        <div className="space-y-2 max-h-[560px] overflow-auto pr-1">
          {agents.map((agent) => (
            <button key={agent.id} onClick={() => setSelectedId(agent.id)} className={`w-full text-left rounded-2xl border p-3 flex items-center gap-3 transition-all ${selected?.id === agent.id ? 'border-amber-400/40 bg-amber-500/10' : 'border-white/10 bg-black/20 hover:bg-white/[0.04]'}`}>
              <SovereignStaffAvatar agent={agent} size="sm" />
              <div className="min-w-0">
                <div className="text-white font-bold truncate">{agent.name}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 truncate">{agent.title}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="xl:col-span-8 rounded-3xl border border-white/10 bg-black/30 p-6">
        {selected && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <SovereignStaffAvatar agent={selected} size="lg" />
              <div>
                <div className="text-[10px] uppercase tracking-widest text-amber-200 font-black">{selected.department.replace(/_/g, ' ')} / {selected.tier}</div>
                <h2 className="mt-1 text-3xl font-black text-white">{selected.name}</h2>
                <div className="mt-1 text-white/60">{selected.title}</div>
                <div className="mt-3 text-sm text-white/70 max-w-3xl">{selected.mission}</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <InfoBox title="Shift" items={[selected.shift]} />
              <InfoBox title="Decision style" items={[selected.decisionStyle]} />
              <InfoBox title="Strengths" items={selected.strengths} />
              <InfoBox title="Knowledge areas" items={selected.knowledgeAreas} />
              <InfoBox title="Voice traits" items={selected.voiceTraits} />
              <InfoBox title="Can own" items={selected.canOwn.map((x) => x.replace(/_/g, ' '))} />
              <InfoBox title="Notifies" items={selected.notifies} />
              <InfoBox title="Escalates to" items={selected.escalationPartners} />
            </div>

            <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5">
              <div className="text-[10px] uppercase tracking-widest text-amber-200 font-black">Human-like internal response DNA</div>
              <div className="mt-3 grid md:grid-cols-3 gap-3">
                {selected.adminPhrasebook.map((phrase) => (
                  <div key={phrase} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">{phrase}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">{title}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-xs text-white/70">{item}</span>
        ))}
      </div>
    </div>
  );
}
