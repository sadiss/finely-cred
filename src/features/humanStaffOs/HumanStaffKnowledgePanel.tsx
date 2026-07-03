import React, { useMemo, useState } from 'react';
import { BookOpen, Filter } from 'lucide-react';
import { HUMAN_STAFF_DEPARTMENTS, getHumanStaffAgent } from './humanStaffDirectory';
import { HUMAN_STAFF_KNOWLEDGE_BASE } from './staffKnowledgeBase';
import type { HumanStaffDepartmentId } from './types';
import {
  STAFF_CMD_BODY,
  STAFF_CMD_EYEBROW,
  STAFF_CMD_KPI,
  STAFF_CMD_PANEL,
  STAFF_CMD_TITLE,
  staffCmdSelected,
} from './humanStaffOsUi';

export function HumanStaffKnowledgePanel() {
  const [departmentId, setDepartmentId] = useState<HumanStaffDepartmentId | 'all'>('all');
  const cards = useMemo(
    () =>
      departmentId === 'all'
        ? HUMAN_STAFF_KNOWLEDGE_BASE
        : HUMAN_STAFF_KNOWLEDGE_BASE.filter((card) => card.departmentId === departmentId),
    [departmentId],
  );
  return (
    <div className={STAFF_CMD_PANEL}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={`inline-flex items-center gap-2 ${STAFF_CMD_EYEBROW}`}>
            <BookOpen size={18} />
            <span>Knowledge base</span>
          </div>
          <h2 className={`mt-2 ${STAFF_CMD_TITLE}`}>Agents don&apos;t all answer the same.</h2>
          <p className={`mt-2 text-sm ${STAFF_CMD_BODY} max-w-3xl`}>
            Department rules, examples, handoff triggers, response boundaries, and mission-specific behavior.
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 ${STAFF_CMD_BODY}`}>
          <Filter size={14} />
          <span className="text-xs">{cards.length} cards</span>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setDepartmentId('all')}
          className={`shrink-0 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest ${staffCmdSelected(departmentId === 'all')}`}
        >
          All
        </button>
        {HUMAN_STAFF_DEPARTMENTS.map((department) => (
          <button
            key={department.id}
            type="button"
            onClick={() => setDepartmentId(department.id)}
            className={`shrink-0 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest ${staffCmdSelected(departmentId === department.id)}`}
          >
            {department.shortName}
          </button>
        ))}
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {cards.map((card) => (
          <div key={card.id} className={`${STAFF_CMD_KPI} p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-base font-bold text-white">{card.title}</div>
              <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[9px] uppercase tracking-widest text-white/45">
                {card.level}
              </span>
            </div>
            <p className={`mt-2 text-sm ${STAFF_CMD_BODY}`}>{card.summary}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Rules</div>
                <ul className={`mt-2 space-y-1 text-xs ${STAFF_CMD_BODY} list-disc pl-4`}>
                  {card.rules.slice(0, 4).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Examples</div>
                <ul className={`mt-2 space-y-1 text-xs ${STAFF_CMD_BODY} list-disc pl-4`}>
                  {card.examples.slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {card.agentIds.map((id) => (
                <span key={id} className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[9px] text-violet-100">
                  {getHumanStaffAgent(id).name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
