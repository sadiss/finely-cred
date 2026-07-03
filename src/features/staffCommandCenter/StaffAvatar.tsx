import React, { useState } from 'react';
import type { StaffMember } from './types';
import { staffFullName } from './staffRoster';
import { StaffPortraitImg } from '../../components/staff/StaffPortraitImg';

export function StaffAvatar({ staff, size = 'lg', active = false }: { staff: StaffMember; size?: 'sm' | 'md' | 'lg' | 'xl'; active?: boolean }) {
  const dims =
    size === 'sm'
      ? 'h-10 w-10 text-xs'
      : size === 'md'
        ? 'h-16 w-16 text-sm'
        : size === 'xl'
          ? 'h-28 w-28 text-lg'
          : 'h-20 w-20 text-base';
  const ring = active ? 'ring-2 ring-violet-300 ring-offset-2 ring-offset-black' : 'ring-1 ring-white/15';
  const label = `${staffFullName(staff)} — ${staff.title}`;

  return (
    <div
      className={`relative ${dims} shrink-0 rounded-2xl ${ring} shadow-xl overflow-hidden bg-zinc-900`}
      title={label}
    >
      <StaffPortraitImg
        staff={{
          id: staff.id,
          firstName: staff.firstName,
          lastName: staff.lastName,
          portraitGender: staff.portrait?.portraitGender ?? 'neutral',
          avatarPath: `staff-portrait://${staff.id}`,
        }}
        className="absolute inset-0 h-full w-full rounded-2xl"
        alt={label}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
      <div
        className={`absolute left-1 top-1 h-2.5 w-2.5 rounded-full border border-black/40 ${
          staff.status === 'working'
            ? 'bg-emerald-400'
            : staff.status === 'needs_approval'
              ? 'bg-sky-400'
              : staff.status === 'blocked'
                ? 'bg-rose-500'
                : staff.status === 'idle'
                  ? 'bg-slate-300'
                  : 'bg-zinc-500'
        }`}
      />
    </div>
  );
}

export function StaffStatusPill({ status }: { status: StaffMember['status'] }) {
  const label = status.replace(/_/g, ' ');
  const cls =
    status === 'working'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
      : status === 'needs_approval'
        ? 'border-sky-500/25 bg-sky-500/10 text-sky-100'
        : status === 'blocked'
          ? 'border-rose-500/25 bg-rose-500/10 text-rose-100'
          : status === 'idle'
            ? 'border-white/10 bg-white/[0.04] text-white/65'
            : 'border-zinc-500/25 bg-zinc-500/10 text-zinc-200';
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${cls}`}>
      {label}
    </span>
  );
}
