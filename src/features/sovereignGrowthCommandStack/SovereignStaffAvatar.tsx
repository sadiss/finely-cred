import React from 'react';
import type { SovereignAgentProfile } from './types';

const gradients: Record<string, string> = {
  executive: 'from-amber-300/30 via-yellow-500/15 to-white/5',
  growth: 'from-fuchsia-300/25 via-amber-500/15 to-white/5',
  lead_intel: 'from-sky-300/25 via-blue-500/15 to-white/5',
  geo: 'from-emerald-300/25 via-green-500/15 to-white/5',
  capture: 'from-orange-300/25 via-amber-500/15 to-white/5',
  nurture: 'from-pink-300/25 via-rose-500/15 to-white/5',
  appointments: 'from-cyan-300/25 via-sky-500/15 to-white/5',
  sales: 'from-red-300/25 via-rose-500/15 to-white/5',
  social: 'from-purple-300/25 via-indigo-500/15 to-white/5',
  video_voice: 'from-violet-300/25 via-fuchsia-500/15 to-white/5',
  partnerships: 'from-lime-300/25 via-emerald-500/15 to-white/5',
  pr: 'from-blue-300/25 via-slate-500/15 to-white/5',
  analytics: 'from-teal-300/25 via-cyan-500/15 to-white/5',
  compliance: 'from-stone-300/25 via-amber-500/15 to-white/5',
  automation: 'from-slate-300/25 via-zinc-500/15 to-white/5',
};

export function SovereignStaffAvatar({ agent, size = 'md' }: { agent: SovereignAgentProfile; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'h-20 w-20 text-2xl' : size === 'sm' ? 'h-10 w-10 text-sm' : 'h-14 w-14 text-lg';
  const initials = agent.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={`${dims} rounded-2xl border border-white/15 bg-gradient-to-br ${gradients[agent.department] ?? gradients.executive} flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.08)] relative overflow-hidden`} title={agent.portraitPrompt}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_35%)]" />
      <div className="relative font-black text-white tracking-widest">{initials}</div>
      <div className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />
    </div>
  );
}
