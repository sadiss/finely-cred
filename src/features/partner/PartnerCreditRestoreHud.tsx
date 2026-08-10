import React, { useMemo } from 'react';
import { ArrowRight, BarChart3, Clock, FileText, Gavel, Scale, ShieldAlert } from 'lucide-react';
import { FinelyOsOverviewStatTile } from '../os/FinelyOsOverviewStatTile';
import {
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../os/finelyOsLightUi';

type PartnerTabKey = 'overview' | 'profile' | 'reports' | 'analysis' | 'evidence' | 'letters' | 'disputes' | 'tasks' | 'notes' | 'debt';

type Props = {
  reportsCount: number;
  negativesCount: number;
  evidenceCount: number;
  lettersCount: number;
  openCasesCount: number;
  readinessScore?: number | null;
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
};

export function PartnerCreditRestoreHud({
  reportsCount,
  negativesCount,
  evidenceCount,
  lettersCount,
  openCasesCount,
  readinessScore,
  roundSummary,
  progressRail,
  onOpenTab,
  primaryAction,
  secondaryAction,
  guidedMessage,
}: Props) {
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
    <div className={`${finelyOsCatalogCard('violet')} !p-4 space-y-3`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300/90`}>Guided restore · never locked</p>
          <p className={`mt-1 text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Summons → validation → wait → bureau</p>
          <p className={`mt-1 max-w-2xl ${FINELY_OS_ENTITY_BODY}`}>
            {guidedMessage ||
              'Court first when a summons is open. Validation is the suggested default. Bureau letters stay optional anytime — never hard-locked.'}
          </p>
          {roundSummary?.nextActionLabel ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-amber-200/90">
              <Clock size={14} /> {roundSummary.nextActionLabel}
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
            <button type="button" onClick={() => onOpenTab(secondaryAction.tab)} className={FINELY_OS_SECONDARY_BTN}>
              {secondaryAction.label}
            </button>
          ) : null}
        </div>
      </div>

      {progressRail ? (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-200/80">Waiting</div>
            <div className={`mt-0.5 text-xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{progressRail.waiting}</div>
          </div>
          <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-200/80">Ready</div>
            <div className={`mt-0.5 text-xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{progressRail.ready}</div>
          </div>
          <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-rose-200/80">Court</div>
            <div className={`mt-0.5 text-xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{progressRail.court}</div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <FinelyOsOverviewStatTile
          icon={BarChart3}
          label="Restore readiness"
          value={`${pct}%`}
          hint="End-to-end progress"
          accent="amber"
          iconAccent="amber"
        />
        <button type="button" onClick={() => onOpenTab('reports')} className="text-left w-full" aria-label={`Open reports — ${reportsCount} on file`}>
          <FinelyOsOverviewStatTile
            icon={FileText}
            label="Reports"
            value={reportsCount}
            hint="Parsed credit files"
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
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
        {steps.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => onOpenTab(s.tab)}
            className={
              'text-left rounded-2xl border p-3 transition-all ' +
              (s.done
                ? 'border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/15'
                : 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15')
            }
          >
            <div className={`text-[10px] font-black uppercase tracking-widest ${s.done ? 'text-emerald-300' : 'text-amber-300'}`}>
              {s.done ? 'On track' : 'Next up'}
            </div>
            <div className={`mt-1 text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{s.label}</div>
            <div className={`mt-0.5 text-xs ${FINELY_OS_ENTITY_BODY}`}>{s.hint}</div>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-white/40">
        Educational only · not legal advice · results vary · lawsuit outcomes are never guaranteed
      </p>
    </div>
  );
}
