import React from 'react';
import { GitBranch, Network, ShieldCheck, Sparkles } from 'lucide-react';
import { HUMAN_STAFF_AGENTS, HUMAN_STAFF_DEPARTMENTS } from './humanStaffDirectory';
import type { HumanStaffMissionPlan, HumanStaffNotification, HumanStaffThread } from './types';
import {
  STAFF_CMD_BODY,
  STAFF_CMD_EYEBROW,
  STAFF_CMD_HERO,
  STAFF_CMD_KPI,
  STAFF_CMD_TITLE,
} from './humanStaffOsUi';

export function HumanStaffOverviewPanel({
  missions,
  threads,
  notifications,
}: {
  missions: HumanStaffMissionPlan[];
  threads: HumanStaffThread[];
  notifications: HumanStaffNotification[];
}) {
  const working = HUMAN_STAFF_AGENTS.filter((agent) => agent.status === 'working').length;
  const blocked = HUMAN_STAFF_AGENTS.filter((agent) => agent.status === 'blocked').length;
  const unread = notifications.filter((note) => !note.read).length;
  const stats = [
    ['Staff profiles', HUMAN_STAFF_AGENTS.length, 'synced with roster'],
    ['Departments', HUMAN_STAFF_DEPARTMENTS.length, 'clear hierarchy'],
    ['Working now', working, 'visible operators'],
    ['Blocked', blocked, 'needs setup/keys'],
    ['Threads', threads.length, 'durable conversations'],
    ['Unread handoffs', unread, 'agent notifications'],
    ['Missions', missions.length, 'staff-run work'],
    ['Response modes', 7, 'varied tone families'],
  ];
  return (
    <div className="space-y-6">
      <div className={`${STAFF_CMD_HERO} space-y-5`}>
        <div>
          <div className={`inline-flex items-center gap-2 ${STAFF_CMD_EYEBROW}`}>
            <Sparkles size={18} />
            <span>Staff operations</span>
          </div>
          <h1 className={`mt-3 ${STAFF_CMD_TITLE}`}>Conversations, memory, and handoffs — same roster as Command Center.</h1>
          <p className={`mt-4 max-w-3xl ${STAFF_CMD_BODY}`}>
            Talk to staff, run durable mission threads, and manage inbox handoffs. Identity and photos pull from the canonical roster — not a duplicate directory.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className={`${STAFF_CMD_KPI} p-4`}>
            <Network className="text-violet-300" size={18} />
            <div className="mt-2 font-bold text-white text-sm">Agent-to-agent</div>
            <p className="mt-1 text-xs text-white/50">Staff notify each other on handoffs and blockers.</p>
          </div>
          <div className={`${STAFF_CMD_KPI} p-4`}>
            <GitBranch className="text-emerald-300" size={18} />
            <div className="mt-2 font-bold text-white text-sm">Mission threads</div>
            <p className="mt-1 text-xs text-white/50">Durable context, memory, and next action.</p>
          </div>
          <div className={`${STAFF_CMD_KPI} p-4`}>
            <ShieldCheck className="text-rose-300" size={18} />
            <div className="mt-2 font-bold text-white text-sm">Safe human feel</div>
            <p className="mt-1 text-xs text-white/50">Internal personality, compliant external voice.</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([label, value, hint]) => (
            <div key={label} className={`${STAFF_CMD_KPI} p-3`}>
              <div className="text-[10px] uppercase tracking-widest text-white/35">{label}</div>
              <div className="mt-1 text-2xl font-black text-white">{value}</div>
              <div className="text-[11px] text-white/45">{hint}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/35">Departments</div>
        {HUMAN_STAFF_DEPARTMENTS.map((department) => (
          <div key={department.id} className={`${STAFF_CMD_KPI} p-4`}>
            <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">{department.shortName}</div>
            <div className="mt-1 text-base font-bold text-white">{department.name}</div>
            <p className={`mt-2 text-sm ${STAFF_CMD_BODY}`}>{department.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {department.workProducts.slice(0, 4).map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] text-white/45">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
