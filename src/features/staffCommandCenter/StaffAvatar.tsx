import React from 'react';
import type { StaffMember } from './types';

export function StaffAvatar({ staff, size = 'lg', active = false }: { staff: StaffMember; size?: 'sm' | 'md' | 'lg' | 'xl'; active?: boolean }) {
  const dims = size === 'sm' ? 'h-10 w-10 text-base' : size === 'md' ? 'h-14 w-14 text-xl' : size === 'xl' ? 'h-24 w-24 text-4xl' : 'h-18 w-18 text-3xl';
  const ring = active ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-black' : 'ring-1 ring-white/10';
  return (
    <div className={`relative ${dims} shrink-0 rounded-3xl bg-gradient-to-br ${staff.portrait.gradient} ${ring} shadow-xl ${staff.portrait.glow} overflow-hidden`} title={`${staff.name} — ${staff.title}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,.48),transparent_28%),linear-gradient(160deg,rgba(0,0,0,.05),rgba(0,0,0,.55))]" />
      <div className="absolute inset-0 flex items-center justify-center drop-shadow-2xl" aria-hidden="true">{staff.portrait.emoji}</div>
      <div className="absolute bottom-1 right-1 rounded-full border border-black/30 bg-black/55 px-1.5 py-0.5 text-[9px] font-black text-white/90 backdrop-blur">
        {staff.portrait.initials}
      </div>
      <div className={`absolute left-1 top-1 h-2.5 w-2.5 rounded-full border border-black/40 ${staff.status === 'working' ? 'bg-emerald-400' : staff.status === 'needs_approval' ? 'bg-amber-400' : staff.status === 'blocked' ? 'bg-rose-500' : staff.status === 'idle' ? 'bg-slate-300' : 'bg-zinc-500'}`} />
    </div>
  );
}

export function StaffStatusPill({ status }: { status: StaffMember['status'] }) {
  const label = status.replace(/_/g, ' ');
  const cls = status === 'working'
    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
    : status === 'needs_approval'
      ? 'border-amber-500/25 bg-amber-500/10 text-amber-100'
      : status === 'blocked'
        ? 'border-rose-500/25 bg-rose-500/10 text-rose-100'
        : status === 'idle'
          ? 'border-white/10 bg-white/[0.04] text-white/65'
          : 'border-zinc-500/25 bg-zinc-500/10 text-zinc-200';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${cls}`}>{label}</span>;
}
