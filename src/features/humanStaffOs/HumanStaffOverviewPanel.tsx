import React from 'react';
import { GitBranch, Network, ShieldCheck, Sparkles } from 'lucide-react';
import { HUMAN_STAFF_AGENTS, HUMAN_STAFF_DEPARTMENTS } from './humanStaffDirectory';
import type { HumanStaffMissionPlan, HumanStaffNotification, HumanStaffThread } from './types';

export function HumanStaffOverviewPanel({ missions, threads, notifications }: { missions: HumanStaffMissionPlan[]; threads: HumanStaffThread[]; notifications: HumanStaffNotification[] }) {
  const working = HUMAN_STAFF_AGENTS.filter((agent) => agent.status === 'working').length;
  const blocked = HUMAN_STAFF_AGENTS.filter((agent) => agent.status === 'blocked').length;
  const unread = notifications.filter((note) => !note.read).length;
  const stats = [
    ['Staff profiles', HUMAN_STAFF_AGENTS.length, 'AI + future staff'],
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
      <div className="rounded-[36px] border border-white/10 bg-gradient-to-br from-amber-500/15 via-white/[0.04] to-emerald-500/10 p-6 overflow-hidden relative">
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <div className="inline-flex items-center gap-2 text-amber-300"><Sparkles size={18} /><span className="text-[10px] font-black uppercase tracking-[0.34em]">Human Staff OS</span></div>
            <h1 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-white">A real staff floor for your AI company.</h1>
            <p className="mt-4 max-w-3xl text-white/65">This upgrade turns agents into identifiable departments with knowledge, personalities, response variety, handoffs, conversations, notifications, and mission memory. Lead Intel becomes a staff-owned operation instead of a mystery button.</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><Network className="text-amber-300" size={18} /><div className="mt-2 font-black text-white">Agent-to-agent</div><p className="mt-1 text-xs text-white/50">Staff notify each other on handoffs and blockers.</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><GitBranch className="text-emerald-300" size={18} /><div className="mt-2 font-black text-white">Mission threads</div><p className="mt-1 text-xs text-white/50">Durable context, memory, and next action.</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><ShieldCheck className="text-rose-300" size={18} /><div className="mt-2 font-black text-white">Safe human feel</div><p className="mt-1 text-xs text-white/50">Internal personality, compliant external voice.</p></div>
            </div>
          </div>
          <div className="xl:col-span-5 grid gap-3 md:grid-cols-2">
            {stats.map(([label, value, hint]) => <div key={label} className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-[10px] uppercase tracking-widest text-white/35">{label}</div><div className="mt-2 text-3xl font-black text-white">{value}</div><div className="text-xs text-white/45">{hint}</div></div>)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {HUMAN_STAFF_DEPARTMENTS.slice(0, 12).map((department) => (
          <div key={department.id} className="rounded-3xl border border-white/10 bg-black/25 p-5">
            <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">{department.shortName}</div>
            <div className="mt-2 text-lg font-black text-white">{department.name}</div>
            <p className="mt-2 text-sm text-white/55 line-clamp-3">{department.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">{department.workProducts.slice(0, 3).map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-white/45">{item}</span>)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
