import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE } from '../../features/os/finelyOsLightUi';
import './collateralDefenseDesks.css';

export type CollateralDefenseTheme = 'foreclosure' | 'repossession';
export type CollateralDefenseLayout = 'shell' | 'mosaic' | 'runway';

const THEME: Record<
  CollateralDefenseTheme,
  {
    mesh: string;
    badge: string;
    step: string;
    stepActive: string;
    glow: string;
    iconRing: string;
    playbookRail: string;
  }
> = {
  foreclosure: {
    mesh: 'bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,rgba(14,165,233,0.22)_0%,transparent_55%),radial-gradient(ellipse_80%_60%_at_100%_100%,rgba(139,92,246,0.12)_0%,transparent_50%)]',
    badge: 'text-sky-200 bg-sky-500/15 border-sky-400/35',
    step: 'border-sky-500/20 bg-black/30 text-white/55',
    stepActive: 'border-sky-400/50 bg-sky-500/12 text-sky-100 ring-1 ring-sky-400/20',
    glow: 'shadow-[0_0_40px_-12px_rgba(14,165,233,0.35)]',
    iconRing: 'ring-sky-400/40 bg-sky-500/15 text-sky-200',
    playbookRail: 'border-sky-500/20 bg-sky-950/25',
  },
  repossession: {
    mesh: 'bg-[radial-gradient(ellipse_110%_70%_at_100%_0%,rgba(244,63,94,0.2)_0%,transparent_52%),repeating-linear-gradient(-12deg,rgba(244,63,94,0.04)_0px,rgba(244,63,94,0.04)_1px,transparent_1px,transparent_14px)]',
    badge: 'text-rose-200 bg-rose-500/15 border-rose-400/35',
    step: 'border-rose-500/20 bg-black/30 text-white/55',
    stepActive: 'border-rose-400/50 bg-rose-500/12 text-rose-100 ring-1 ring-rose-400/20',
    glow: 'shadow-[0_0_40px_-12px_rgba(244,63,94,0.35)]',
    iconRing: 'ring-rose-400/40 bg-rose-500/15 text-rose-200',
    playbookRail: 'border-rose-500/20 bg-rose-950/20',
  },
};

export type CollateralPlaybookStep = {
  id: string;
  label: string;
  detail: string;
  law?: string;
};

export function CollateralDefenseShell({
  theme,
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  steps,
  activeStepId,
  onStepClick,
  stats,
  headerActions,
  layout = 'shell',
  children,
}: {
  theme: CollateralDefenseTheme;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle: string;
  steps: CollateralPlaybookStep[];
  activeStepId?: string;
  onStepClick?: (id: string) => void;
  stats?: Array<{ label: string; value: string }>;
  headerActions?: React.ReactNode;
  layout?: CollateralDefenseLayout;
  children: React.ReactNode;
}) {
  const t = THEME[theme];

  if (layout === 'mosaic' || layout === 'runway') {
    return (
      <div className={`fc-collateral-desk fc-collateral-desk--${layout}`} data-surface-layout={layout === 'mosaic' ? 'catalog-mosaic' : 'timeline'}>
        <header className="fc-collateral-desk-head">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 relative z-[1]">
            <div className="flex gap-4 min-w-0">
              <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ring-1 ${t.iconRing}`}>
                <Icon size={22} />
              </div>
              <div className="min-w-0">
                <span className="fc-collateral-desk-kicker">{eyebrow}</span>
                <h2>{title}</h2>
                <p>{subtitle}</p>
              </div>
            </div>
            {headerActions ? <div className="flex flex-wrap gap-2 shrink-0">{headerActions}</div> : null}
          </div>
          {stats?.length ? (
            <div className="fc-collateral-desk-stats">
              {stats.map((s) => (
                <div key={s.label} className="fc-collateral-desk-stat">
                  <small>{s.label}</small>
                  <strong>{s.value}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </header>

        {layout === 'mosaic' ? (
          <div className="fc-collateral-mosaic" role="list">
            {steps.map((step, idx) => {
              const active = activeStepId === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  role="listitem"
                  data-active={active ? 'true' : undefined}
                  className="fc-collateral-mosaic-tile"
                  onClick={() => onStepClick?.(step.id)}
                >
                  <span className="fc-collateral-mosaic-n">Step {idx + 1}</span>
                  <strong>{step.label}</strong>
                  <span>{step.detail}</span>
                  {step.law ? <em>{step.law}</em> : null}
                  {active ? <em>You are here</em> : null}
                </button>
              );
            })}
          </div>
        ) : (
          <ol className="fc-collateral-runway">
            {steps.map((step, idx) => {
              const active = activeStepId === step.id;
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    data-active={active ? 'true' : undefined}
                    className="fc-collateral-runway-step"
                    onClick={() => onStepClick?.(step.id)}
                  >
                    <span className="fc-collateral-runway-n">{idx + 1}</span>
                    <span className="fc-collateral-runway-copy">
                      <strong>{step.label}</strong>
                      <span>{step.detail}</span>
                      {step.law ? <em>{step.law}</em> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}

        <div className="fc-collateral-desk-body">{children}</div>
      </div>
    );
  }

  return (
    <div className={`rounded-[1.75rem] border border-white/10 overflow-hidden ${t.glow}`}>
      <header className={`relative px-4 sm:px-6 py-5 border-b border-white/10 ${t.mesh}`}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex gap-4 min-w-0">
            <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ring-1 ${t.iconRing}`}>
              <Icon size={22} />
            </div>
            <div className="min-w-0">
              <span className={`inline-flex text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${t.badge}`}>
                {eyebrow}
              </span>
              <h2 className={`mt-2 text-xl sm:text-2xl font-bold tracking-tight ${FINELY_OS_ENTITY_VALUE}`}>{title}</h2>
              <p className={`mt-1 text-sm max-w-2xl ${FINELY_OS_ENTITY_BODY}`}>{subtitle}</p>
            </div>
          </div>
          {headerActions ? <div className="flex flex-wrap gap-2 shrink-0">{headerActions}</div> : null}
        </div>
        {stats?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 min-w-[5.5rem]">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>{s.label}</div>
                <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{s.value}</div>
              </div>
            ))}
          </div>
        ) : null}
      </header>

      <div className={`border-b border-white/10 px-3 sm:px-5 py-3 ${t.playbookRail}`}>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2 px-1`}>Your action path — tap a step to filter letters</div>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {steps.map((step, idx) => {
            const active = activeStepId === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick?.(step.id)}
                className={`shrink-0 min-w-[9.5rem] max-w-[12rem] text-left rounded-xl border px-3 py-2.5 transition-all ${active ? t.stepActive : t.step} hover:border-white/25`}
              >
                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Step {idx + 1}</div>
                <div className="text-xs font-semibold mt-0.5 leading-snug">{step.label}</div>
                {step.law ? <div className="text-[10px] mt-1 opacity-75 line-clamp-1">{step.law}</div> : null}
              </button>
            );
          })}
        </div>
      </div>

      <main className="min-w-0 p-4 sm:p-6 space-y-6 bg-black/40">{children}</main>
    </div>
  );
}
