import React from 'react';
import { Bot, UserRound, UserRoundPlus, Cog } from 'lucide-react';
import type { StaffKind } from './types';

const KIND_META: Record<
  StaffKind,
  { label: string; short: string; className: string; Icon: typeof Bot }
> = {
  ai_staff: {
    label: 'AI operator',
    short: 'AI',
    className: 'border-violet-400/35 bg-violet-500/15 text-violet-100',
    Icon: Bot,
  },
  human_staff: {
    label: 'Human team',
    short: 'Human',
    className: 'border-amber-400/35 bg-amber-500/12 text-amber-100',
    Icon: UserRound,
  },
  future_hire: {
    label: 'Human · hiring',
    short: 'Hiring',
    className: 'border-sky-400/35 bg-sky-500/12 text-sky-100 border-dashed',
    Icon: UserRoundPlus,
  },
  system_team: {
    label: 'System',
    short: 'System',
    className: 'border-white/15 bg-white/[0.06] text-white/60',
    Icon: Cog,
  },
};

export function isHumanStaffKind(kind: StaffKind): boolean {
  return kind === 'human_staff' || kind === 'future_hire';
}

export function StaffKindBadge({ kind, compact = false }: { kind: StaffKind; compact?: boolean }) {
  const meta = KIND_META[kind];
  const Icon = meta.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${meta.className}`}
    >
      <Icon size={compact ? 10 : 11} aria-hidden />
      {compact ? meta.short : meta.label}
    </span>
  );
}
