import React, { useMemo, useState } from 'react';
import { BookOpen, Filter } from 'lucide-react';
import { HUMAN_STAFF_DEPARTMENTS, getHumanStaffAgent } from './humanStaffDirectory';
import { HUMAN_STAFF_KNOWLEDGE_BASE } from './staffKnowledgeBase';
import type { HumanStaffDepartmentId } from './types';

export function HumanStaffKnowledgePanel() {
  const [departmentId, setDepartmentId] = useState<HumanStaffDepartmentId | 'all'>('all');
  const cards = useMemo(() => departmentId === 'all' ? HUMAN_STAFF_KNOWLEDGE_BASE : HUMAN_STAFF_KNOWLEDGE_BASE.filter((card) => card.departmentId === departmentId), [departmentId]);
  return (
    <div className="rounded-[30px] border border-white/10 bg-black/25 p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-amber-300"><BookOpen size={18} /><span className="text-[10px] font-black uppercase tracking-widest">Extended staff knowledge</span></div>
          <h2 className="mt-2 text-2xl font-black text-white">Agents do not all answer the same anymore.</h2>
          <p className="mt-2 text-sm text-white/55 max-w-3xl">Knowledge cards define department rules, examples, handoff triggers, response boundaries, and mission-specific behavior.</p>
        </div>
        <div className="inline-flex items-center gap-2 text-white/45"><Filter size={14} /><span className="text-xs">{cards.length} cards</span></div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button type="button" onClick={() => setDepartmentId('all')} className={`shrink-0 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest ${departmentId === 'all' ? 'border-amber-400 bg-amber-500 text-black' : 'border-white/10 bg-white/[0.03] text-white/60'}`}>All</button>
        {HUMAN_STAFF_DEPARTMENTS.map((department) => <button key={department.id} type="button" onClick={() => setDepartmentId(department.id)} className={`shrink-0 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest ${departmentId === department.id ? 'border-amber-400 bg-amber-500 text-black' : 'border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06]'}`}>{department.shortName}</button>)}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {cards.map((card) => (
          <div key={card.id} className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-lg font-black text-white">{card.title}</div>
              <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[9px] uppercase tracking-widest text-white/45">{card.level}</span>
            </div>
            <p className="mt-3 text-sm text-white/65">{card.summary}</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Rules</div><ul className="mt-3 space-y-2 text-sm text-white/60 list-disc pl-4">{card.rules.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Example behavior</div><ul className="mt-3 space-y-2 text-sm text-white/60 list-disc pl-4">{card.examples.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {card.agentIds.map((id) => <span key={id} className="rounded-full border border-amber-500/15 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-100">{getHumanStaffAgent(id).name}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
