import React, { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, finelyOsGlowTile } from './finelyOsLightUi';
import type { FinelyOsGlowAccent } from './finelyOsLightUi';

export type FinelyOsCoachChip = {
  id: string;
  label: string;
  prompt: string;
};

export function FinelyOsOnPageCoachShell({
  accent = 'violet',
  kicker,
  title,
  subtitle,
  headerExtra,
  chips,
  onChipSelect,
  visibleChipCount = 4,
  composer,
  footer,
  children,
}: {
  accent?: FinelyOsGlowAccent;
  kicker?: string;
  title: string;
  subtitle?: string;
  headerExtra?: React.ReactNode;
  chips: FinelyOsCoachChip[];
  onChipSelect: (chip: FinelyOsCoachChip) => void;
  visibleChipCount?: number;
  composer: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? chips : chips.slice(0, visibleChipCount);
  const hiddenCount = chips.length - visibleChipCount;

  const accentRing =
    accent === 'emerald'
      ? 'border-emerald-400/35 shadow-[0_0_48px_-12px_rgba(52,211,153,0.35)]'
      : accent === 'fuchsia'
        ? 'border-fuchsia-400/35 shadow-[0_0_48px_-12px_rgba(217,70,239,0.35)]'
        : accent === 'amber'
          ? 'border-amber-400/35 shadow-[0_0_48px_-12px_rgba(251,191,36,0.3)]'
          : 'border-violet-400/35 shadow-[0_0_48px_-12px_rgba(139,92,246,0.35)]';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[#0c1018] via-[#0a0e14] to-[#06080c] p-4 sm:p-5 ${accentRing}`}
      data-fc-on-page-coach="1"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,255,255,0.06),transparent_55%)]"
        aria-hidden
      />
      <div className="relative space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            {kicker ? <div className={FINELY_OS_ENTITY_SUBLABEL}>{kicker}</div> : null}
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-violet-300 shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">{title}</h3>
            </div>
            {subtitle ? <p className={`text-xs sm:text-sm max-w-2xl ${FINELY_OS_ENTITY_BODY}`}>{subtitle}</p> : null}
          </div>
          {headerExtra ? <div className="shrink-0">{headerExtra}</div> : null}
        </div>

        <div className="-mx-1 px-1 overflow-x-auto">
          <div className="flex gap-2 min-w-min pb-1">
            {visible.map((chip) => (
              <button
                key={chip.id}
                type="button"
                title={chip.prompt}
                className={`${finelyOsGlowTile(accent)} shrink-0 max-w-[min(100%,14rem)] text-left !px-3 !py-2.5 hover:brightness-110 transition-all`}
                onClick={() => onChipSelect(chip)}
              >
                <span className="block text-[10px] font-black uppercase tracking-wider text-white/50">Suggestion</span>
                <span className="block text-xs font-semibold text-white/95 line-clamp-2 leading-snug mt-0.5">{chip.label}</span>
              </button>
            ))}
            {hiddenCount > 0 && !expanded ? (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className={`${finelyOsGlowTile('sky')} shrink-0 !px-3 !py-2.5 inline-flex items-center gap-1 text-xs font-bold text-sky-100`}
              >
                +{hiddenCount} more <ChevronDown size={14} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/35 p-3 sm:p-4 space-y-3">{composer}</div>

        {children}
        {footer}
      </div>
    </div>
  );
}
