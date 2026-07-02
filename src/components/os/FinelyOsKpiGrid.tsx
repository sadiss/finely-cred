import React from 'react';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_VALUE } from '../../features/os/finelyOsLightUi';

export type FinelyOsKpiItem = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
  onClick?: () => void;
};

export function FinelyOsKpiGrid({ items, columns = 4 }: { items: FinelyOsKpiItem[]; columns?: 2 | 3 | 4 }) {
  const colClass =
    columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4';

  return (
    <div className={`grid ${colClass} gap-3`}>
      {items.map((kpi) => {
        const Tag = kpi.onClick ? 'button' : 'div';
        return (
          <Tag
            key={kpi.label}
            type={kpi.onClick ? 'button' : undefined}
            onClick={kpi.onClick}
            className={`rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-center transition ${
              kpi.onClick ? 'hover:bg-white/[0.04] hover:border-violet-400/30 cursor-pointer' : ''
            }`}
          >
            <div className={`text-lg font-black ${kpi.accent ?? 'text-violet-300'}`}>{kpi.value}</div>
            <div className={`text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_BODY}`}>{kpi.label}</div>
            {kpi.hint ? <div className={`mt-1 text-[9px] ${FINELY_OS_ENTITY_BODY} normal-case`}>{kpi.hint}</div> : null}
          </Tag>
        );
      })}
    </div>
  );
}

export function FinelyOsEntityCard({
  title,
  subtitle,
  accent = 'text-violet-300',
  badge,
  children,
  onClick,
  active,
}: {
  title: string;
  subtitle?: string;
  accent?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition min-h-[132px] flex flex-col w-full ${
        active
          ? 'border-violet-400/50 bg-violet-500/15 ring-1 ring-violet-400/30'
          : 'border-white/10 bg-black/25 hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE} line-clamp-2`}>{title}</div>
        {badge}
      </div>
      {subtitle ? <div className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY} line-clamp-3 flex-1`}>{subtitle}</div> : null}
      {children}
    </Tag>
  );
}
