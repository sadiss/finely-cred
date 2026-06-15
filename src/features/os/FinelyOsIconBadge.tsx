import type { LucideIcon } from 'lucide-react';
import { FINELY_OS_ENTITY_SUBLABEL } from './finelyOsLightUi';

const ACCENTS = {
  violet: {
    shell: 'border-violet-300/55 bg-gradient-to-br from-violet-300/28 via-violet-500/12 to-black/20',
    glow: 'shadow-[0_0_38px_-8px_rgba(139,92,246,0.72),inset_0_1px_0_rgba(255,255,255,0.20)]',
    icon: 'text-violet-200',
    aura: 'bg-violet-400/32',
  },
  emerald: {
    shell: 'border-emerald-300/55 bg-gradient-to-br from-emerald-300/28 via-emerald-500/12 to-black/20',
    glow: 'shadow-[0_0_38px_-8px_rgba(16,185,129,0.70),inset_0_1px_0_rgba(255,255,255,0.20)]',
    icon: 'text-emerald-200',
    aura: 'bg-emerald-400/30',
  },
  sky: {
    shell: 'border-sky-300/55 bg-gradient-to-br from-sky-300/28 via-sky-500/12 to-black/20',
    glow: 'shadow-[0_0_38px_-8px_rgba(14,165,233,0.68),inset_0_1px_0_rgba(255,255,255,0.20)]',
    icon: 'text-sky-200',
    aura: 'bg-sky-400/30',
  },
  amber: {
    shell: 'border-amber-300/55 bg-gradient-to-br from-amber-300/28 via-amber-500/12 to-black/20',
    glow: 'shadow-[0_0_38px_-8px_rgba(245,158,11,0.78),inset_0_1px_0_rgba(255,255,255,0.20)]',
    icon: 'text-amber-200',
    aura: 'bg-amber-400/34',
  },
  rose: {
    shell: 'border-rose-300/55 bg-gradient-to-br from-rose-300/28 via-rose-500/12 to-black/20',
    glow: 'shadow-[0_0_38px_-8px_rgba(244,63,94,0.66),inset_0_1px_0_rgba(255,255,255,0.20)]',
    icon: 'text-rose-200',
    aura: 'bg-rose-400/30',
  },
  fuchsia: {
    shell: 'border-fuchsia-300/55 bg-gradient-to-br from-fuchsia-300/28 via-fuchsia-500/12 to-black/20',
    glow: 'shadow-[0_0_38px_-8px_rgba(217,70,239,0.70),inset_0_1px_0_rgba(255,255,255,0.20)]',
    icon: 'text-fuchsia-200',
    aura: 'bg-fuchsia-400/30',
  },
} as const;

export type FinelyOsIconAccent = keyof typeof ACCENTS;

type IconBadgeProps = {
  icon: LucideIcon;
  accent?: FinelyOsIconAccent;
  size?: number;
  className?: string;
};

export function FinelyOsIconBadge({ icon: Icon, accent = 'violet', size = 23, className = '' }: IconBadgeProps) {
  const a = ACCENTS[accent];
  return (
    <span
      className={`relative isolate inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border backdrop-blur-md ring-1 ring-inset ring-white/15 ${a.shell} ${a.glow} ${className}`}
    >
      <span className={`absolute -inset-4 rounded-full blur-2xl ${a.aura} opacity-70 pointer-events-none`} />
      <span className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.32),transparent_35%),linear-gradient(145deg,rgba(255,255,255,0.15),transparent_45%,rgba(0,0,0,0.24))] pointer-events-none" />
      <span className="absolute inset-[3px] rounded-[inherit] border border-white/12 pointer-events-none" />
      <Icon size={size} className={`relative z-[1] ${a.icon} drop-shadow-[0_0_12px_rgba(255,255,255,0.20)]`} strokeWidth={1.85} />
    </span>
  );
}

type SectionTitleProps = {
  icon: LucideIcon;
  label: string;
  accent?: FinelyOsIconAccent;
};

export function FinelyOsSectionTitle({ icon, label, accent = 'violet' }: SectionTitleProps) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <FinelyOsIconBadge icon={icon} accent={accent} size={20} className="p-3" />
      <span className={FINELY_OS_ENTITY_SUBLABEL}>{label}</span>
    </div>
  );
}
