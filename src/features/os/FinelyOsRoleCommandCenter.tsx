import React from 'react';
import { ArrowRight } from 'lucide-react';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE, FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN, finelyOsKpiTile } from './finelyOsLightUi';

export type RoleCommandTile = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  accent?: 'violet' | 'emerald' | 'amber' | 'fuchsia' | 'sky' | 'rose';
  onClick?: () => void;
};

export type RoleCommandAction = {
  label: string;
  onClick: () => void;
  primary?: boolean;
};

type Props = {
  roleLabel: string;
  headline: string;
  subline?: string;
  tiles: RoleCommandTile[];
  primaryAction?: RoleCommandAction;
  secondaryAction?: RoleCommandAction;
  alert?: { tone: 'info' | 'warning' | 'success'; message: string };
};

const accentRing: Record<NonNullable<RoleCommandTile['accent']>, string> = {
  violet: 'border-violet-500/30 bg-violet-500/10',
  emerald: 'border-emerald-500/30 bg-emerald-500/10',
  amber: 'border-amber-500/30 bg-amber-500/10',
  fuchsia: 'border-fuchsia-500/30 bg-fuchsia-500/10',
  sky: 'border-sky-500/30 bg-sky-500/10',
  rose: 'border-rose-500/30 bg-rose-500/10',
};

export function FinelyOsRoleCommandCenter({
  roleLabel,
  headline,
  subline,
  tiles,
  primaryAction,
  secondaryAction,
  alert,
}: Props) {
  return (
    <div className="fc-light-glass-panel fc-light-chrome-panel p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>{roleLabel}</div>
          <div className={`text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{headline}</div>
          {subline ? <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{subline}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {secondaryAction ? (
            <button type="button" onClick={secondaryAction.onClick} className={FINELY_OS_SECONDARY_BTN}>
              {secondaryAction.label}
            </button>
          ) : null}
          {primaryAction ? (
            <button type="button" onClick={primaryAction.onClick} className={FINELY_OS_PRIMARY_BTN}>
              {primaryAction.label} <ArrowRight size={14} />
            </button>
          ) : null}
        </div>
      </div>

      {alert ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            alert.tone === 'warning'
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
              : alert.tone === 'success'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
                : 'border-sky-500/40 bg-sky-500/10 text-sky-100'
          }`}
        >
          {alert.message}
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {tiles.map((t) => {
          const cls = accentRing[t.accent ?? 'violet'];
          const inner = (
            <div className={`${finelyOsKpiTile} ${cls} h-full text-left`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>{t.label}</div>
              <div className={`text-xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{t.value}</div>
              {t.hint ? <div className={`text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>{t.hint}</div> : null}
            </div>
          );
          if (t.onClick) {
            return (
              <button key={t.id} type="button" onClick={t.onClick} className="text-left">
                {inner}
              </button>
            );
          }
          return <div key={t.id}>{inner}</div>;
        })}
      </div>
    </div>
  );
}
