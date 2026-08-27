import React, { useMemo } from 'react';
import { Check, Mail, PenLine, ScrollText } from 'lucide-react';
import type { LettersStudioTab } from './LettersCommandCenter';
import { LetterTrackTabs, type LetterTrackTabItem } from './LetterTrackTabs';
import { FINELY_OS_PLATINUM_BTN, FINELY_OS_SUCCESS_BTN } from '../../features/os/finelyOsLightUi';
import './partnerLetterStudio.css';

export type LetterStudioKpi = {
  label: string;
  value: string;
  hint?: string;
  accent?: 'emerald' | 'violet' | 'sky' | 'fuchsia' | 'rose';
};

export type LetterStudioPhase = 'build' | 'review' | 'mail';

function resolveActivePhase(tab: LettersStudioTab): LetterStudioPhase {
  if (tab === 'dispute') return 'review';
  if (tab === 'overview' || tab === 'templates') return 'build';
  return 'build';
}

/**
 * Luxury compose-studio chrome for Credit Letter Studio — big track, Build/Review/Mail rail,
 * signal KPIs, and vault handoff. Replaces generic FinelyUnifiedHubLayout on letter surfaces.
 */
export function PartnerLetterStudioChrome({
  studioTab,
  trackTabs,
  onTabChange,
  kpis,
  showKpis = true,
  primaryAction,
  secondaryAction,
  onOpenVault,
  onPhaseChange,
  surface = 'dark',
  contentFlush = false,
  children,
}: {
  studioTab: LettersStudioTab;
  trackTabs: LetterTrackTabItem[];
  onTabChange: (id: LettersStudioTab) => void;
  kpis?: LetterStudioKpi[];
  showKpis?: boolean;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  onOpenVault?: () => void;
  onPhaseChange?: (phase: LetterStudioPhase) => void;
  surface?: 'dark' | 'light';
  contentFlush?: boolean;
  children: React.ReactNode;
}) {
  const activePhase = resolveActivePhase(studioTab);

  const phases = useMemo(
    () =>
      [
        {
          id: 'build' as const,
          label: 'Build',
          hint: 'Pick track, tradelines, and reasons',
          icon: PenLine,
        },
        {
          id: 'review' as const,
          label: 'Review',
          hint: 'Paper preview, edit, mark final',
          icon: ScrollText,
        },
        {
          id: 'mail' as const,
          label: 'Mail',
          hint: 'Vault, certified send, responses',
          icon: Mail,
        },
      ] as const,
    [],
  );

  const phaseIndex = phases.findIndex((phase) => phase.id === activePhase);

  return (
    <section
      className="space-y-6 min-w-0"
      data-fc-letter-studio-shell="1"
      data-fc-studio-surface={surface}
      data-fc-studio-accent="violet"
      data-surface-layout="compose-studio"
      data-surface-kind="letters-studio"
    >
      <header className="fc-studio-hero">
        <div className="relative z-[1] flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="fc-studio-eyebrow">Letter Studio</p>
            <h1 className="fc-studio-title">Build bureau dispute letters</h1>
            <p className="fc-studio-subtitle">
              Pick tradelines, attach screenshot proof, edit the paper preview, and save PDFs to your Letters Vault. Debt
              validation and court letters live under Debt Letters.
            </p>
          </div>
          <div className="relative z-[1] flex shrink-0 flex-wrap items-center gap-2">
            {secondaryAction ? (
              <button type="button" onClick={secondaryAction.onClick} className={FINELY_OS_PLATINUM_BTN}>
                {secondaryAction.label}
              </button>
            ) : null}
            {primaryAction ? (
              <button type="button" onClick={primaryAction.onClick} className={FINELY_OS_SUCCESS_BTN}>
                <ScrollText size={14} /> {primaryAction.label}
              </button>
            ) : null}
          </div>
        </div>

        {showKpis && kpis?.length ? (
          <div className="relative z-[1] mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="fc-studio-kpi" data-accent={kpi.accent ?? 'violet'}>
                <div className="fc-studio-kpi-value">{kpi.value}</div>
                <div className="fc-studio-kpi-label">{kpi.label}</div>
                {kpi.hint ? <div className="fc-studio-kpi-hint">{kpi.hint}</div> : null}
              </div>
            ))}
          </div>
        ) : null}
      </header>

      <div className="space-y-3">
        <div className="fc-studio-phase-rail" role="group" aria-label="Letter workflow">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            const isActive = phase.id === activePhase;
            const isDone = index < phaseIndex;
            const isMail = phase.id === 'mail';
            return (
              <button
                key={phase.id}
                type="button"
                className="fc-studio-phase"
                data-active={isActive ? 'true' : 'false'}
                data-done={isDone ? 'true' : 'false'}
                onClick={() => {
                  if (phase.id === 'mail') onOpenVault?.();
                  else onPhaseChange?.(phase.id);
                }}
                title={phase.hint}
              >
                <span className="inline-flex items-center gap-2">
                  {isDone ? <Check size={14} /> : <Icon size={14} />}
                  {phase.label}
                </span>
                <small>{phase.hint}</small>
              </button>
            );
          })}
        </div>

        <div className="fc-studio-track-wrap">
          <LetterTrackTabs tabs={trackTabs} activeTab={studioTab} onTabChange={onTabChange} aria-label="Credit letter tracks" />
        </div>
      </div>

      <div className={`fc-studio-workbench${contentFlush ? ' fc-studio-workbench--flush' : ''}`}>{children}</div>
    </section>
  );
}
