import React from 'react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLASS_INNER,
  finelyOsGlassShell,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

type Props = {
  badge: string;
  badgeIcon?: React.ReactNode;
  title: string;
  description: string;
  heroLabel: string;
  heroValue: string;
  heroSub?: string;
  accent?: 'sky' | 'emerald' | 'amber' | 'violet';
  children: React.ReactNode;
  footer?: React.ReactNode;
  compact?: boolean;
};

const ACCENT = {
  sky: {
    badge: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
    hero: 'border-sky-500/25 bg-sky-500/10',
    heroValue: 'text-sky-300',
    pill: 'sky' as const,
  },
  emerald: {
    badge: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    hero: 'border-emerald-500/25 bg-emerald-500/10',
    heroValue: 'text-emerald-300',
    pill: 'emerald' as const,
  },
  amber: {
    badge: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
    hero: 'border-amber-500/25 bg-amber-500/10',
    heroValue: 'text-amber-300',
    pill: 'amber' as const,
  },
  violet: {
    badge: 'text-violet-300 bg-violet-500/10 border-violet-500/30',
    hero: 'border-violet-500/25 bg-violet-500/10',
    heroValue: 'text-violet-300',
    pill: 'violet' as const,
  },
};

export function CalculatorShell({
  badge,
  badgeIcon,
  title,
  description,
  heroLabel,
  heroValue,
  heroSub,
  accent = 'sky',
  children,
  footer,
  compact,
}: Props) {
  const a = ACCENT[accent];
  return (
    <div className={`${finelyOsGlassShell('panel', accent)} ${compact ? 'p-5 sm:p-6' : 'p-6 sm:p-8'} space-y-6`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${a.badge}`}>
            {badgeIcon}
            {badge}
          </div>
          <h3 className={`mt-3 text-xl sm:text-2xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{title}</h3>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} max-w-2xl`}>{description}</p>
        </div>
        <div className={`rounded-2xl border px-5 py-4 text-right shrink-0 min-w-[140px] ${a.hero}`}>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} opacity-80`}>{heroLabel}</div>
          <div className={`text-3xl font-bold tabular-nums ${a.heroValue}`}>{heroValue}</div>
          {heroSub ? <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1 opacity-80`}>{heroSub}</div> : null}
        </div>
      </div>
      {children}
      {footer ? <div className={`pt-2 border-t border-white/[0.08] ${FINELY_OS_ENTITY_BODY} text-xs`}>{footer}</div> : null}
    </div>
  );
}

export function CalculatorField({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className={FINELY_OS_ENTITY_LABEL}>{label}</span>
      {children}
      {hint ? <span className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal font-normal`}>{hint}</span> : null}
    </label>
  );
}

export const calcInputClass = `${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} mt-0`;

export function CalculatorPresetPills<T extends string>({
  options,
  value,
  onChange,
  accent = 'sky',
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  accent?: 'sky' | 'emerald' | 'amber' | 'violet';
}) {
  const tabAccent = accent === 'amber' ? 'fuchsia' : accent;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={finelyOsViewTab(value === o.id, tabAccent)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function CalculatorMetricGrid({
  items,
  accent = 'sky',
}: {
  items: { label: string; value: string; sub?: string; highlight?: boolean }[];
  accent?: 'sky' | 'emerald' | 'amber' | 'violet';
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`${item.highlight ? finelyOsGlassShell('inner', accent) : FINELY_OS_GLASS_INNER} p-4`}
        >
          <div className={FINELY_OS_ENTITY_SUBLABEL}>{item.label}</div>
          <div className={`text-xl font-bold mt-1 tabular-nums ${item.highlight ? ACCENT[accent].heroValue : FINELY_OS_ENTITY_VALUE}`}>
            {item.value}
          </div>
          {item.sub ? <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>{item.sub}</div> : null}
        </div>
      ))}
    </div>
  );
}
