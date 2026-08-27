import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import {
  fcAdminKpi,
  fcAdminOnSolidMuted,
  fcAdminOnSolidSublabel,
  fcAdminOnSolidValue,
  fcAdminScoreCell,
  type FcAdminTone,
} from '../../os/finelyOsAdminSurface';
import { FINELY_OS_SIDE_RAIL_GLOW } from '../../os/finelyOsLightUi';

/** Metallic obsidian command / chart / workstation slab. */
export function WlObsidianSlab({
  children,
  className = '',
  glow = true,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={`fc-wl-obsidian-slab fc-admin-ink-panel relative overflow-hidden rounded-2xl border p-4 sm:p-5 ${className}`}>
      {glow ? <div className={`pointer-events-none absolute inset-0 opacity-90 ${FINELY_OS_SIDE_RAIL_GLOW}`} aria-hidden /> : null}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

/** Full saturated KPI tile — NOT white. */
export function WlSolidKpi({
  label,
  value,
  hint,
  tone,
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone: FcAdminTone;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <p className={fcAdminOnSolidSublabel(tone)}>{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums leading-none ${fcAdminOnSolidValue(tone)}`}>{value}</p>
      {hint ? <p className={`mt-1.5 text-[11px] ${fcAdminOnSolidMuted(tone)}`}>{hint}</p> : null}
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${fcAdminKpi(tone, 'solid')} fc-wl-solid-kpi text-left transition-transform hover:-translate-y-0.5`}>
        {inner}
      </button>
    );
  }
  return <div className={`${fcAdminKpi(tone, 'solid')} fc-wl-solid-kpi`}>{inner}</div>;
}

/** Bureau score cell (EXP / EQF / TU). */
export function WlScoreCell({ label, value, tone }: { label: string; value: string | number; tone: FcAdminTone }) {
  return (
    <div className={fcAdminScoreCell(tone)}>
      <div className={`text-[10px] font-bold uppercase tracking-wider ${fcAdminOnSolidMuted(tone)}`}>{label}</div>
      <div className={`mt-1 text-2xl font-bold font-mono ${fcAdminOnSolidValue(tone)}`}>{value}</div>
    </div>
  );
}

/** Featured / module deck — solid accent fill. */
export function WlSolidDeck({
  tone,
  icon: Icon,
  title,
  description,
  stat,
  onClick,
}: {
  tone: FcAdminTone;
  icon: LucideIcon;
  title: string;
  description?: string;
  stat?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${fcAdminKpi(tone, 'solid')} fc-wl-solid-deck w-full p-4 text-left transition-transform hover:-translate-y-1`}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-white/25 bg-white/10 p-2.5">
          <Icon size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-base font-semibold ${fcAdminOnSolidValue(tone)}`}>{title}</span>
            {stat ? (
              <span className="rounded-md border border-white/25 bg-black/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/85">
                {stat}
              </span>
            ) : null}
          </div>
          {description ? <p className={`mt-1 text-sm line-clamp-2 ${fcAdminOnSolidMuted(tone)}`}>{description}</p> : null}
          <span className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${fcAdminOnSolidValue(tone)}`}>
            Open <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </button>
  );
}

/** Full-width rose alert slab. */
export function WlRoseAlertSlab({ children }: { children: React.ReactNode }) {
  return <div className="fc-admin-solid-rose fc-wl-rose-slab rounded-2xl border p-4 text-white">{children}</div>;
}

/** Sky-tinted shelf for featured modules. */
export function WlSkyShelf({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow?: string }) {
  return (
    <div className="fc-wl-sky-shelf fc-admin-soft-sky rounded-2xl border p-4">
      {eyebrow ? <div className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-900/55">{eyebrow}</div> : null}
      <h3 className="mt-1 font-serif text-xl font-bold tracking-tight text-sky-950">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
