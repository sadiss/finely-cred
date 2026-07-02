import React, { useMemo, useState } from 'react';
import { Brain, ChevronRight, Search, Users } from 'lucide-react';
import { HUMAN_STAFF_AGENTS, HUMAN_STAFF_DEPARTMENTS, getAgentsByDepartment } from './humanStaffDirectory';
import { setSelectedHumanStaff } from './humanStaffRepo';
import { HumanStaffAvatar } from './HumanStaffAvatar';
import type { HumanStaffAgentId, HumanStaffDepartmentId } from './types';

export function HumanStaffDirectoryPanel({ selectedIds, onChanged }: { selectedIds: HumanStaffAgentId[]; onChanged: () => void }) {
  const [departmentId, setDepartmentId] = useState<HumanStaffDepartmentId | 'all'>('all');
  const [query, setQuery] = useState('');
  const agents = useMemo(() => {
    const base = departmentId === 'all' ? HUMAN_STAFF_AGENTS : getAgentsByDepartment(departmentId);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((agent) => [agent.name, agent.title, agent.mission, agent.departmentId, ...agent.coreKnowledge].join(' ').toLowerCase().includes(q));
  }, [departmentId, query]);

  function toggle(id: HumanStaffAgentId) {
    const next = selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id].slice(-3);
    setSelectedHumanStaff(next as HumanStaffAgentId[]);
    onChanged();
  }

  return (
    <div className="rounded-[30px] border border-white/10 bg-black/25 p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-amber-300"><Users size={18} /><span className="text-[10px] font-black uppercase tracking-widest">Human-feeling staff directory</span></div>
          <h2 className="mt-2 text-2xl font-black text-white">Pick 1-3 staff like a real operating floor.</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/55">Each profile has a department, reporting line, shift, personality, knowledge, capabilities, response style, and escalation partners.</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-100 text-xs font-bold">Selected {selectedIds.length}/3</div>
      </div>

      <div className="grid gap-3 lg:grid-cols-12">
        <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 flex items-center gap-2">
          <Search size={16} className="text-white/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search staff, role, skill..." className="w-full bg-transparent outline-none text-sm text-white/80 placeholder:text-white/30 py-2" />
        </div>
        <div className="lg:col-span-8 flex gap-2 overflow-x-auto pb-1">
          <button type="button" onClick={() => setDepartmentId('all')} className={`shrink-0 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest ${departmentId === 'all' ? 'border-amber-400 bg-amber-500 text-black' : 'border-white/10 bg-white/[0.03] text-white/60'}`}>All</button>
          {HUMAN_STAFF_DEPARTMENTS.map((department) => (
            <button key={department.id} type="button" onClick={() => setDepartmentId(department.id)} className={`shrink-0 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest ${departmentId === department.id ? 'border-amber-400 bg-amber-500 text-black' : 'border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06]'}`}>{department.shortName}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {agents.map((agent) => {
          const active = selectedIds.includes(agent.id);
          return (
            <button key={agent.id} type="button" onClick={() => toggle(agent.id)} className={`group text-left rounded-[26px] border p-5 transition-all ${active ? 'border-amber-400/70 bg-amber-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}>
              <div className="flex gap-4">
                <HumanStaffAvatar agent={agent} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-black text-white">{agent.name}</div>
                    <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${agent.status === 'blocked' ? 'border-rose-500/30 bg-rose-500/10 text-rose-100' : agent.status === 'working' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-white/[0.04] text-white/50'}`}>{agent.status.replaceAll('_', ' ')}</span>
                  </div>
                  <div className="mt-1 text-sm text-amber-100/80 font-semibold">{agent.title}</div>
                  <p className="mt-3 text-sm text-white/60 line-clamp-3">{agent.mission}</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-[9px] uppercase tracking-widest text-white/35">Voice</div><div className="mt-1 text-xs text-white/65">{agent.personality.voice}</div></div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-[9px] uppercase tracking-widest text-white/35">Shift</div><div className="mt-1 text-xs text-white/65">{agent.shift.label}</div></div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {agent.coreKnowledge.slice(0, 4).map((skill) => <span key={skill} className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-white/50">{skill}</span>)}
                  </div>
                </div>
                <ChevronRight size={18} className="mt-2 text-white/30 group-hover:text-amber-300" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-start gap-3">
        <Brain size={18} className="text-amber-300 mt-1" />
        <div className="text-sm text-white/60"><span className="text-white font-bold">Why this matters:</span> Lead Intel is now treated like a staff-operated department. You can pick Pipeline Titan + Scout Supreme + Switchboard for swarm execution, or Appointment Architect + Liora + Revenue Captain for booking and sales handoff.</div>
      </div>
    </div>
  );
}
