import React, { useMemo } from 'react';
import { ArrowRight, BarChart3, Clock, FileText, Gavel, Scale, ShieldAlert, type LucideIcon } from 'lucide-react';
import { FinelyOsOverviewStatTile } from '../os/FinelyOsOverviewStatTile';
import { FinelyOsIconBadge } from '../os/FinelyOsIconBadge';
import {
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_CONTRAST_LABEL,
  FINELY_OS_CONTRAST_VALUE,
} from '../os/finelyOsLightUi';
import { finelyOsVisibleTintShell } from '../os/finelyOsVisibleTint';
import {
  WL_ENTITY_BODY,
  WL_ENTITY_SUBLABEL,
  WL_ENTITY_VALUE,
  WL_SOLID_ACTION_BTN,
} from '../workspaceLightPreview/wlLightUi';

type PartnerTabKey = 'overview' | 'profile' | 'reports' | 'analysis' | 'evidence' | 'letters' | 'disputes' | 'tasks' | 'notes' | 'debt';

type Props = {
  reportsCount: number;
  negativesCount: number;
  evidenceCount: number;
  lettersCount: number;
  openCasesCount: number;
  readinessScore?: number | null;
  /** Middle bureau score for the existing Reports tile — not a second strip. */
  middleScore?: number | null;
  middleScoreLabel?: string;
  roundSummary?: {
    awaitingResponse: number;
    responsesLogged: number;
    highestActiveRound: string | null;
    nextActionLabel: string;
    roundPhasePct: number;
  };
  /** Guided restore rail: waiting / ready / court */
  progressRail?: { waiting: number; ready: number; court: number };
  onOpenTab: (tab: PartnerTabKey) => void;
  primaryAction?: { label: string; tab: PartnerTabKey };
  /** Bureau never hard-locked — always offer optional path */
  secondaryAction?: { label: string; tab: PartnerTabKey };
  guidedMessage?: string;
  surface?: 'dark' | 'light';
};

const LIGHT_TILE_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

function LightStatTile({
  icon,
  label,
  value,
  hint,
  accent = 'emerald',
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: (typeof LIGHT_TILE_ACCENTS)[number];
}) {
  return (
    <div className={`${finelyOsCatalogCard(accent)} min-h-[8.5rem]`}>
      <div className="flex items-start gap-4">
        <FinelyOsIconBadge icon={icon} accent={accent} size={20} className="p-3 shrink-0" />
        <div className="min-w-0">
          <div className={FINELY_OS_CONTRAST_LABEL}>{label}</div>
          <div className={`mt-2 text-3xl font-extrabold ${FINELY_OS_CONTRAST_VALUE}`}>{value}</div>
          {hint ? <div className="mt-2 text-sm font-bold text-slate-600">{hint}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function PartnerCreditRestoreHud({
  reportsCount,
  negativesCount,
  evidenceCount,
  lettersCount,
  openCasesCount,
  readinessScore,
  middleScore,
  middleScoreLabel,
  roundSummary,
  progressRail,
  onOpenTab,
  primaryAction,
  secondaryAction,
  guidedMessage,
  surface = 'dark',
}: Props) {
  const light = surface === 'light';
  const body = light ? WL_ENTITY_BODY : FINELY_OS_ENTITY_BODY;
  const sublabel = light ? WL_ENTITY_SUBLABEL : FINELY_OS_ENTITY_SUBLABEL;
  const value = light ? WL_ENTITY_VALUE : FINELY_OS_ENTITY_VALUE;
  const steps = [
    {
      key: 'court',
      label: '1. Court / summons',
      done: (progressRail?.court ?? 0) === 0,
      tab: 'debt' as PartnerTabKey,
      hint: progressRail?.court ? `${progressRail.court} open` : 'Clear or none',
    },
    {
      key: 'validation',
      label: '2. Validation (suggest)',
      done: (progressRail?.waiting ?? 0) > 0 || lettersCount > 0,
      tab: 'debt' as PartnerTabKey,
      hint: progressRail?.waiting ? `${progressRail.waiting} waiting` : 'Suggest first',
    },
    {
      key: 'wait',
      label: '3. Wait after mail',
      done: (progressRail?.waiting ?? 0) > 0 || (roundSummary?.awaitingResponse ?? 0) > 0,
      tab: 'debt' as PartnerTabKey,
      hint: progressRail?.waiting ? 'Mail logged — wait' : 'Starts when mailed',
    },
    {
      key: 'bureau',
      label: '4. Bureau (optional)',
      done: lettersCount > 0 || openCasesCount > 0,
      tab: 'letters' as PartnerTabKey,
      hint: 'Never locked',
    },
    {
      key: 'rounds',
      label: '5. Round tracking',
      done: (roundSummary?.responsesLogged ?? 0) > 0 || (roundSummary?.awaitingResponse ?? 0) > 0,
      tab: 'disputes' as PartnerTabKey,
      hint: roundSummary?.highestActiveRound ?? (openCasesCount ? `${openCasesCount} cases` : 'Mail → response'),
    },
    {
      key: 'responses',
      label: '6. Responses',
      done: (roundSummary?.responsesLogged ?? 0) > 0,
      tab: 'disputes' as PartnerTabKey,
      hint: roundSummary?.awaitingResponse
        ? `${roundSummary.awaitingResponse} awaiting`
        : roundSummary?.responsesLogged
          ? `${roundSummary.responsesLogged} logged`
          : 'Log outcomes',
    },
  ];

  const pct = useMemo(() => {
    if (readinessScore != null) return readinessScore;
    const preLetter =
      (reportsCount > 0 ? 15 : 0) +
      (negativesCount > 0 ? 12 : reportsCount > 0 ? 6 : 0) +
      (evidenceCount > 0 ? 15 : 0) +
      (lettersCount > 0 ? 18 : openCasesCount > 0 ? 10 : 0);
    const roundBoost = roundSummary ? Math.round(roundSummary.roundPhasePct * 0.4) : 0;
    return Math.min(100, preLetter + roundBoost);
  }, [readinessScore, reportsCount, negativesCount, evidenceCount, lettersCount, openCasesCount, roundSummary]);

  return (
    <div
      className={
        light
          ? `${finelyOsCatalogCard('emerald')} space-y-6`
          : `${finelyOsCatalogCard('violet')} space-y-6`
      }
      data-fc-surface={surface}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`${sublabel} ${light ? 'text-emerald-800' : 'text-fuchsia-300/90'}`}>Guided restore · never locked</p>
          <p className={`mt-1 text-lg font-semibold ${value}`}>Summons → validation → wait → bureau</p>
          <p className={`mt-1 max-w-2xl ${body}`}>
            {guidedMessage ||
              'Court first when a summons is open. Validation is the suggested default. Bureau letters stay optional anytime — never hard-locked.'}
          </p>
          {roundSummary?.nextActionLabel ? (
            <p className={`mt-2 flex items-center gap-2 text-base font-bold ${light ? 'text-violet-800' : 'text-violet-200'}`}>
              <Clock size={16} /> {roundSummary.nextActionLabel}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {primaryAction ? (
            <button type="button" onClick={() => onOpenTab(primaryAction.tab)} className={FINELY_OS_PRIMARY_BTN}>
              {primaryAction.label} <ArrowRight size={14} className="inline ml-1" />
            </button>
          ) : null}
          {secondaryAction ? (
            <button type="button" onClick={() => onOpenTab(secondaryAction.tab)} className={light ? WL_SOLID_ACTION_BTN : FINELY_OS_SECONDARY_BTN}>
              {secondaryAction.label}
            </button>
          ) : null}
        </div>
      </div>

      {progressRail ? (
        <div className="grid grid-cols-3 gap-4">
          <div className={light ? finelyOsVisibleTintShell('sky', 'p-6') : `${finelyOsCatalogCard('sky')}`}>
            <div className={`text-sm font-extrabold uppercase tracking-widest ${light ? 'text-sky-900' : 'text-sky-200'}`}>Waiting</div>
            <div className={`mt-2 text-3xl font-extrabold ${light ? 'text-sky-950' : value}`}>{progressRail.waiting}</div>
          </div>
          <div className={light ? finelyOsVisibleTintShell('emerald', 'p-6') : `${finelyOsCatalogCard('emerald')}`}>
            <div className={`text-sm font-extrabold uppercase tracking-widest ${light ? 'text-emerald-900' : 'text-emerald-200'}`}>Ready</div>
            <div className={`mt-2 text-3xl font-extrabold ${light ? 'text-emerald-950' : value}`}>{progressRail.ready}</div>
          </div>
          <div className={light ? finelyOsVisibleTintShell('rose', 'p-6') : `${finelyOsCatalogCard('rose')}`}>
            <div className={`text-sm font-extrabold uppercase tracking-widest ${light ? 'text-rose-900' : 'text-rose-200'}`}>Court</div>
            <div className={`mt-2 text-3xl font-extrabold ${light ? 'text-rose-950' : value}`}>{progressRail.court}</div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {light ? (
          <>
            <LightStatTile icon={BarChart3} label="Restore readiness" value={`${pct}%`} hint="End-to-end progress" accent="emerald" />
            <button type="button" onClick={() => onOpenTab('reports')} className="text-left w-full">
              <LightStatTile
              icon={FileText}
              label="Reports"
              value={reportsCount}
              hint={middleScore != null ? `Middle ${middleScore} · results vary` : 'Parsed credit files'}
              accent="violet"
            />
            </button>
            <button type="button" onClick={() => onOpenTab('analysis')} className="text-left w-full">
              <LightStatTile icon={Gavel} label="Negatives" value={negativesCount} hint="Dispute candidates" accent="sky" />
            </button>
            <button type="button" onClick={() => onOpenTab('evidence')} className="text-left w-full">
              <LightStatTile icon={ShieldAlert} label="Evidence" value={evidenceCount} hint="Vault files" accent="rose" />
            </button>
            <button type="button" onClick={() => onOpenTab('debt')} className="text-left w-full">
              <LightStatTile icon={Scale} label="Debt / court" value={progressRail?.court ?? 0} hint={lettersCount ? `${lettersCount} letters` : 'Validation lane'} accent="violet" />
            </button>
          </>
        ) : (
          <>
        <FinelyOsOverviewStatTile
          icon={BarChart3}
          label="Restore readiness"
          value={`${pct}%`}
          hint="End-to-end progress"
          accent="emerald"
          iconAccent="emerald"
        />
        <button type="button" onClick={() => onOpenTab('reports')} className="text-left w-full" aria-label={`Open reports — ${reportsCount} on file`}>
          <FinelyOsOverviewStatTile
            icon={FileText}
            label="Reports"
            value={reportsCount}
            hint={middleScore != null ? middleScoreLabel || `Middle ${middleScore} · results vary` : 'Parsed credit files'}
            accent="violet"
            iconAccent="violet"
          />
        </button>
        <button type="button" onClick={() => onOpenTab('analysis')} className="text-left w-full" aria-label={`Open analysis — ${negativesCount} negatives`}>
          <FinelyOsOverviewStatTile
            icon={Gavel}
            label="Negatives"
            value={negativesCount}
            hint="Dispute candidates"
            accent="fuchsia"
            iconAccent="fuchsia"
          />
        </button>
        <button type="button" onClick={() => onOpenTab('evidence')} className="text-left w-full" aria-label={`Open evidence vault — ${evidenceCount} files`}>
          <FinelyOsOverviewStatTile
            icon={ShieldAlert}
            label="Evidence"
            value={evidenceCount}
            hint="Vault files"
            accent="emerald"
            iconAccent="emerald"
          />
        </button>
        <button type="button" onClick={() => onOpenTab('debt')} className="text-left w-full" aria-label="Open debt letters">
          <FinelyOsOverviewStatTile
            icon={Scale}
            label="Debt / court"
            value={progressRail?.court ?? 0}
            hint={lettersCount ? `${lettersCount} letters` : 'Validation lane'}
            accent="sky"
            iconAccent="sky"
          />
        </button>
          </>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {steps.map((s, index) => {
          const family = (s.done ? 'emerald' : (['violet', 'sky', 'rose', 'violet'] as const)[index % 4]) as 'emerald' | 'violet' | 'sky' | 'rose';
          return (
          <button
            key={s.key}
            type="button"
            onClick={() => onOpenTab(s.tab)}
            className={`text-left ${light ? finelyOsVisibleTintShell(family, 'p-6 hover:brightness-[1.02]') : finelyOsCatalogCard(family)}`}
          >
            <div
              className={`text-sm font-extrabold uppercase tracking-widest ${
                light
                  ? family === 'emerald'
                    ? 'text-emerald-900'
                    : family === 'sky'
                      ? 'text-sky-900'
                      : family === 'rose'
                        ? 'text-rose-900'
                        : 'text-violet-900'
                  : family === 'emerald'
                    ? 'text-emerald-200'
                    : family === 'sky'
                      ? 'text-sky-200'
                      : family === 'rose'
                        ? 'text-rose-200'
                        : 'text-violet-200'
              }`}
            >
              {s.done ? 'On track' : 'Next up'}
            </div>
            <div className={`mt-2 text-lg font-extrabold ${light ? 'text-[#0a1628]' : value}`}>{s.label}</div>
            <div className={`mt-1 text-sm font-semibold ${light ? 'text-[#0a1628]/70' : body}`}>{s.hint}</div>
          </button>
          );
        })}
      </div>
      <p className={`text-xs ${light ? 'text-slate-500' : 'text-white/40'}`}>
        Educational only · not legal advice · results vary · lawsuit outcomes are never guaranteed
      </p>
    </div>
  );
}
