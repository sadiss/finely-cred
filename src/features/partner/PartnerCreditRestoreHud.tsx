import React, { useMemo } from 'react';
import { ArrowRight, BarChart3, Clock, FileText, Gavel, PenLine, ShieldAlert } from 'lucide-react';
import { FinelyOsOverviewStatTile } from '../os/FinelyOsOverviewStatTile';
import {
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
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
  onOpenTab: (tab: PartnerTabKey) => void;
  primaryAction?: { label: string; tab: PartnerTabKey };
};

export function PartnerCreditRestoreHud({
  reportsCount,
  negativesCount,
  evidenceCount,
  lettersCount,
  openCasesCount,
  readinessScore,
  roundSummary,
  onOpenTab,
  primaryAction,
}: Props) {
  const steps = [
    {
      key: 'report',
      label: '1. Upload report',
      done: reportsCount > 0,
      tab: 'reports' as PartnerTabKey,
      hint: reportsCount ? `${reportsCount} on file` : 'Start here',
    },
    {
      key: 'analysis',
      label: '2. Analyze',
      done: reportsCount > 0 && negativesCount >= 0,
      tab: 'analysis' as PartnerTabKey,
      hint: negativesCount ? `${negativesCount} negatives` : 'Run analysis',
    },
    {
      key: 'evidence',
      label: '3. Evidence',
      done: evidenceCount > 0,
      tab: 'evidence' as PartnerTabKey,
      hint: evidenceCount ? `${evidenceCount} files` : 'Capture proof',
    },
    {
      key: 'letters',
      label: '4. Dispute letters',
      done: lettersCount > 0 || openCasesCount > 0,
      tab: 'letters' as PartnerTabKey,
      hint: lettersCount ? `${lettersCount} letters` : 'Draft & mail',
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
      label: '6. Bureau responses',
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
    <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300/90`}>Restore command path</p>
          <p className={`mt-2 text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Credit repair workflow status</p>
          <p className={`mt-1 max-w-2xl ${FINELY_OS_ENTITY_BODY}`}>
            Follow the steps — reports through dispute letters, then round mail tracking and bureau response handling through R4 and beyond.
          </p>
          {roundSummary?.nextActionLabel ? (
            <p className={`mt-2 flex items-center gap-2 text-sm text-amber-200/90`}>
              <Clock size={14} /> {roundSummary.nextActionLabel}
            </p>
          ) : null}
        </div>
        {primaryAction ? (
          <button type="button" onClick={() => onOpenTab(primaryAction.tab)} className={FINELY_OS_PRIMARY_BTN}>
            {primaryAction.label} <ArrowRight size={14} className="inline ml-1" />
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
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
        <button type="button" onClick={() => onOpenTab('letters')} className="text-left w-full" aria-label={`Open letters — ${lettersCount} saved`}>
          <FinelyOsOverviewStatTile
            icon={PenLine}
            label="Letters"
            value={lettersCount}
            hint={openCasesCount ? `${openCasesCount} open cases` : 'Generated PDFs'}
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
              'text-left rounded-2xl border p-4 transition-all ' +
              (s.done
                ? 'border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/15'
                : 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15')
            }
          >
            <div className={`text-[10px] font-black uppercase tracking-widest ${s.done ? 'text-emerald-300' : 'text-amber-300'}`}>
              {s.done ? 'Complete' : 'Next up'}
            </div>
            <div className={`mt-2 text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{s.label}</div>
            <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{s.hint}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
