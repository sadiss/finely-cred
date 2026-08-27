import React, { useMemo } from 'react';
import './partnerRestoreWorkspace.css';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  FolderOpen,
  Gavel,
  ListChecks,
  Mail,
  Vault,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import { listReportsByPartner } from '../../data/reportsRepo';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { listTasksByPartner } from '../../data/tasksRepo';
import { listCasesByPartner } from '../../data/casesRepo';
import { listLettersByPartner } from '../../data/lettersRepo';
import { deriveDisputeCandidates } from '../../creditReports/disputeCandidates';
import { computePartnerOverallScore } from '../../utils/partnerOverallScore';
import { computeRestoreEvidenceCoverage } from '../../lib/evidenceCoverage';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import { FinelyOsPageFooter } from '../os/FinelyOsPageFooter';
import { PartnerRestoreWorkspaceDock } from './PartnerRestoreWorkspaceDock';
import { FinelyNowDoThisStrip, type NowDoThisItem } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildPortalNoticedItems } from '../../lib/finelyProactiveSignals';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../os/finelyOsLightUi';
import {
  DEFAULT_PARTNER_RESTORE_NAVIGATION,
  mapPartnerRestorePortalPath,
  type PartnerRestoreNavigation,
} from './partnerRestoreNavigation';

type RestoreAccent = 'violet' | 'emerald' | 'rose' | 'fuchsia' | 'sky';

type RestoreSequenceStep = {
  key: string;
  title: string;
  description: string;
  screenshotHint?: string;
  done: boolean;
  ctaLabel: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  restoreStep: number;
  accent: RestoreAccent;
};

export type PartnerRestoreWorkspaceProps = {
  partner: Partner;
  embedded?: boolean;
  navigation?: PartnerRestoreNavigation;
  surface?: 'dark' | 'light';
  showTours?: boolean;
  showDock?: boolean;
};

function buildNowDoItems(nav: PartnerRestoreNavigation): NowDoThisItem[] {
  return [
    {
      label: 'Upload your credit report',
      detail: 'HTML from IdentityIQ, SmartCredit, or MyScoreIQ parses tradelines and payment history best.',
      to: nav.reportsPath,
    },
    {
      label: 'Review findings and negatives',
      detail: 'Open Credit Intelligence and confirm tradelines worth disputing before you mail.',
      to: nav.reportsPath,
    },
    {
      label: 'Capture bureau screenshots',
      detail: 'Save one clean screenshot per bureau per negative into the Evidence Vault.',
      to: nav.evidencePath,
    },
    {
      label: 'Open dispute cases',
      detail: 'Track each bureau round with factual findings — not procedural commands.',
      to: nav.disputesPath,
    },
    {
      label: 'Generate credit letters',
      detail: 'Attach screenshot-backed reasons in Letter Studio before you export PDFs.',
      to: nav.lettersPath,
    },
    {
      label: 'Mail and log in Letter Vault',
      detail: 'Certified mail proof, response windows, and round history live in the vault.',
      to: nav.letterVaultPath,
    },
    {
      label: 'Complete follow-up tasks',
      detail: 'Mail letter tasks quickly — bureau reinvestigation windows are time-sensitive.',
      to: nav.projectsPath,
    },
  ];
}

export function PartnerRestoreWorkspace({
  partner,
  embedded = false,
  navigation = DEFAULT_PARTNER_RESTORE_NAVIGATION,
  surface = 'dark',
  showTours = true,
  showDock = true,
}: PartnerRestoreWorkspaceProps) {
  const navigate = useNavigate();

  const go = (path: string) => navigate(path);
  const mapPortalPath = (path: string) => mapPartnerRestorePortalPath(path, navigation);
  const goPortal = (path: string) => go(mapPortalPath(path));

  const reports = useMemo(() => listReportsByPartner(partner.id), [partner.id]);
  const evidence = useMemo(() => listEvidenceByPartner(partner.id), [partner.id]);
  const tasks = useMemo(() => listTasksByPartner(partner.id), [partner.id]);
  const cases = useMemo(() => listCasesByPartner(partner.id), [partner.id]);
  const letters = useMemo(() => listLettersByPartner(partner.id), [partner.id]);

  const openTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const openCases = cases.filter((c) => c.status === 'open');

  const latestParsed = useMemo(() => reports.find((r) => r.parsed) ?? null, [reports]);
  const candidates = useMemo(() => {
    if (!latestParsed?.parsed) return [];
    return deriveDisputeCandidates(latestParsed.parsed as any, latestParsed.id);
  }, [latestParsed]);

  const evidenceCoverage = useMemo(
    () =>
      computeRestoreEvidenceCoverage({
        candidates,
        evidenceCount: evidence.length,
        letters,
      }),
    [candidates, evidence.length, letters],
  );

  const screenshotCount = evidence.filter((e) => e.type === 'screenshot').length;

  const steps: RestoreSequenceStep[] = useMemo(
    () => [
      {
        key: 'report_uploaded',
        title: 'Upload at least one credit report',
        description: 'HTML is best for structured extraction. PDF is accepted (text extraction depends on the export).',
        done: reports.length > 0,
        ctaLabel: 'Open credit reports',
        path: navigation.reportsPath,
        icon: FileText,
        restoreStep: 1,
        accent: 'violet',
      },
      {
        key: 'report_reviewed',
        title: 'Review report analysis and negatives',
        description: 'Open Credit Intelligence to confirm tradelines, scores, and items worth disputing before you mail.',
        done: reports.some((r) => Boolean(r.parsed)),
        ctaLabel: 'Review findings',
        path: navigation.reportsPath,
        icon: FileText,
        restoreStep: 2,
        accent: 'sky',
      },
      {
        key: 'evidence_uploaded',
        title: 'Capture source proof in Evidence Vault',
        description:
          'Evidence Vault holds report crops, bureau responses, creditor correspondence, and other source proof. ID, proof of address, and statements stay in Documents.',
        screenshotHint:
          'Capture bureau negatives with clean crops — one screenshot per bureau per account so dispute reasons can say “As you can see here on Equifax…”',
        done: evidence.length > 0,
        ctaLabel: 'Open evidence vault',
        path: navigation.evidencePath,
        icon: Vault,
        restoreStep: 3,
        accent: 'emerald',
      },
      {
        key: 'screenshot_proof',
        title: 'Link screenshot proof to dispute items',
        description: evidenceCoverage.summary,
        screenshotHint:
          screenshotCount > 0
            ? `${screenshotCount} screenshot(s) on file — attach each exhibit to the matching tradeline in Letter Studio.`
            : 'Use report crops or tradeline screenshots so every auto-picked reason references what the bureau actually shows.',
        done: evidenceCoverage.withProof > 0 || (candidates.length === 0 && screenshotCount > 0),
        ctaLabel: 'Capture screenshots',
        path: navigation.reportsPath,
        icon: FolderOpen,
        restoreStep: 4,
        accent: 'rose',
      },
      {
        key: 'case_created',
        title: 'Have an active dispute case created',
        description: 'Cases are tracked per bureau and round once a dispute letter is generated with evidence and reasons.',
        done: openCases.length > 0,
        ctaLabel: 'Open disputes',
        path: navigation.disputesPath,
        icon: Gavel,
        restoreStep: 5,
        accent: 'violet',
      },
      {
        key: 'letter_generated',
        title: 'Generate credit letters on time',
        description: 'If your specialist generates letters for you, you will still see tasks for mailing and follow-up deadlines.',
        done: letters.length > 0,
        ctaLabel: 'Open credit letters',
        path: navigation.lettersPath,
        icon: Mail,
        restoreStep: 6,
        accent: 'sky',
      },
      {
        key: 'letter_vault',
        title: 'Mail and track in Letter Vault',
        description: 'Saved PDFs, certified mail proof, bureau response windows, and round outcomes stay in the vault.',
        done: letters.some((l) => l.status === 'mailed' || l.status === 'mail_pending'),
        ctaLabel: 'Open letter vault',
        path: navigation.letterVaultPath,
        icon: Mail,
        restoreStep: 7,
        accent: 'emerald',
      },
      {
        key: 'tasks_progress',
        title: 'Complete tasks as they appear',
        description: 'Mail letter tasks should be done quickly; follow-up tasks align with your reinvestigation window.',
        done: openTasks.length === 0 && completedTasks.length > 0,
        ctaLabel: 'Open tasks',
        path: navigation.projectsPath,
        icon: ListChecks,
        restoreStep: 6,
        accent: 'rose',
      },
    ],
    [
      reports,
      evidence.length,
      evidenceCoverage,
      screenshotCount,
      candidates.length,
      openCases.length,
      letters,
      openTasks.length,
      completedTasks.length,
      navigation,
    ],
  );

  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const currentStepIndex = steps.findIndex((s) => !s.done);

  const nowDoItems = useMemo(() => buildNowDoItems(navigation), [navigation]);
  const nowDoIndex = useMemo(() => {
    const checklistDone = [
      reports.length > 0,
      reports.some((r) => Boolean(r.parsed)),
      evidenceCoverage.withProof > 0 || screenshotCount > 0,
      openCases.length > 0,
      letters.length > 0,
      letters.some((l) => l.status === 'mailed' || l.status === 'mail_pending'),
      openTasks.length === 0 && completedTasks.length > 0,
    ];
    const idx = checklistDone.findIndex((done) => !done);
    return idx === -1 ? checklistDone.length - 1 : idx;
  }, [reports, evidenceCoverage.withProof, screenshotCount, openCases.length, letters, openTasks.length, completedTasks.length]);

  const overallScore = useMemo(
    () =>
      computePartnerOverallScore({
        partner,
        counts: {
          reports: reports.length,
          evidence: evidence.length,
          tasksOpen: openTasks.length,
          tasksDone: completedTasks.length,
          casesOpen: openCases.length,
          lettersGenerated: letters.length,
        },
      }),
    [partner, reports.length, evidence.length, openTasks.length, completedTasks.length, openCases.length, letters.length],
  );

  const noticedItems = useMemo(
    () =>
      buildPortalNoticedItems({
        reportsCount: reports.length,
        lettersCount: letters.length,
        openCasesCount: openCases.length,
        evidenceCount: evidence.length,
        overallScore: overallScore.overall,
      }).map((item) => ({ ...item, to: mapPortalPath(item.to) })),
    [reports.length, letters.length, openCases.length, evidence.length, overallScore.overall, navigation],
  );

  return (
    <div
      className={FINELY_OS_COMPACT_PAGE}
      data-surface-kind="real"
      data-surface-key="partner:checklist"
      data-fc-partner-portal="1"
      data-fc-restore-workspace="1"
      data-fc-restore-surface={surface}
    >
      {!embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={() => go(navigation.dashboardPath)} className={FINELY_OS_BACK_LINK} title="Back to Partner Dashboard">
            <ArrowLeft size={16} /> Partner Dashboard
          </button>
          <button type="button" onClick={() => go('/dashboard')} className={FINELY_OS_BACK_LINK} title="Back to Finely Cred Dashboard">
            <ArrowLeft size={16} /> Finely Cred
          </button>
        </div>
      ) : null}

      <div className={`${finelyOsCatalogCard('emerald')} space-y-3 p-6 lg:p-8`} data-accent="emerald">
        <p className="fc-restore-eyebrow">Personal Credit Restore</p>
        <h1 className="fc-restore-section-title text-3xl font-extrabold tracking-tight">Your restore sequence</h1>
        <p className={FINELY_OS_ENTITY_BODY}>
          You are here — step {Math.min(nowDoIndex + 1, nowDoItems.length)} of {nowDoItems.length}. Finish reports → findings →
          evidence → disputes → letters → vault in order.
        </p>
      </div>

      {showTours ? (
        <>
          <FinelyNoticedStrip items={noticedItems} surface={surface} />
          <FinelyNowDoThisStrip items={nowDoItems} currentIndex={nowDoIndex} surface={surface} />
        </>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="fc-restore-kpi" data-accent="emerald">
          <span className="fc-restore-kpi-icon" aria-hidden="true">
            <ListChecks size={20} />
          </span>
          <div className="fc-restore-kpi-copy">
            <div className="fc-restore-kpi-label">Readiness</div>
            <div className="fc-restore-kpi-value">{pct}%</div>
            <div className="fc-restore-kpi-sub">Restore sequence completion</div>
            <div className="fc-restore-kpi-bar">
              <div className="fc-restore-kpi-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
        <div className="fc-restore-kpi" data-accent="violet">
          <span className="fc-restore-kpi-icon" aria-hidden="true">
            <CheckCircle2 size={20} />
          </span>
          <div className="fc-restore-kpi-copy">
            <div className="fc-restore-kpi-label">Milestones</div>
            <div className="fc-restore-kpi-value">
              {doneCount} / {steps.length}
            </div>
            <div className="fc-restore-kpi-sub">Steps completed in order</div>
          </div>
        </div>
        <div className="fc-restore-kpi" data-accent="sky">
          <span className="fc-restore-kpi-icon" aria-hidden="true">
            <FolderOpen size={20} />
          </span>
          <div className="fc-restore-kpi-copy">
            <div className="fc-restore-kpi-label">Proof on file</div>
            <div className="fc-restore-kpi-value">{evidence.length}</div>
            <div className="fc-restore-kpi-sub">{screenshotCount} screenshots</div>
          </div>
        </div>
        <div className="fc-restore-kpi" data-accent="rose">
          <span className="fc-restore-kpi-icon" aria-hidden="true">
            <Gavel size={20} />
          </span>
          <div className="fc-restore-kpi-copy">
            <div className="fc-restore-kpi-label">Open work</div>
            <div className="fc-restore-kpi-value">{openTasks.length}</div>
            <div className="fc-restore-kpi-sub">{openCases.length} active disputes</div>
          </div>
        </div>
      </div>

      <div className={`${finelyOsCatalogCard('sky')} fc-restore-capture-band`} data-accent="sky">
        <div className="relative z-[1] flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="fc-restore-eyebrow">Bureau screenshot capture</p>
            <p className={FINELY_OS_ENTITY_BODY}>
              Clean per-bureau crops make dispute reasons factual — one screenshot per bureau per negative so letters can
              reference what Equifax, Experian, or TransUnion actually show.
            </p>
            <p className={`${FINELY_OS_ENTITY_SUBLABEL}`}>
              {screenshotCount} screenshot{screenshotCount === 1 ? '' : 's'} currently on file
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button type="button" onClick={() => go(navigation.reportsPath)} className="fc-restore-action-btn">
              Open credit reports to crop <ArrowRight size={14} />
            </button>
            <button type="button" onClick={() => go(navigation.evidencePath)} className={FINELY_OS_SECONDARY_BTN}>
              Open Evidence Vault <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <section className="space-y-4" aria-labelledby="restore-stations-title" data-accent="violet">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="fc-restore-eyebrow">Your complete route</p>
            <h2 id="restore-stations-title" className="mt-1 fc-restore-section-title">
              Every restore workstation, in the order you use it
            </h2>
            <p className="mt-1 fc-restore-section-sub">
              Finish the highlighted step, then move down the line.
            </p>
          </div>
          <span
            className="fc-restore-progress-chip"
            data-accent={doneCount === steps.length ? 'emerald' : 'violet'}
          >
            {doneCount} of {steps.length} milestones complete
          </span>
        </div>

        <ol className="fc-restore-station-grid">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isDone = step.done;
            const isCurrent = !isDone && index === currentStepIndex;
            const cardClass = [
              'fc-restore-station-card',
              isDone ? 'fc-restore-station-card--done' : '',
              isCurrent ? 'fc-restore-station-card--active' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <li
                key={step.key}
                className={cardClass}
                data-accent={isDone ? 'emerald' : step.accent}
                data-you-are-here={isCurrent ? 'true' : undefined}
              >
                <div className="fc-restore-station-top">
                  <span className="fc-restore-station-medallion">
                    {isDone ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                  </span>
                  <span className="fc-restore-station-chip">Step {step.restoreStep}</span>
                  {isDone ? (
                    <span className="fc-restore-station-pill fc-restore-station-pill--done">
                      <CheckCircle2 size={10} className="inline mr-0.5" /> Done
                    </span>
                  ) : isCurrent ? (
                    <span className="fc-restore-station-pill fc-restore-station-pill--active">You are here</span>
                  ) : (
                    <span className="fc-restore-station-pill">To do</span>
                  )}
                </div>
                <h3 className={`fc-restore-station-title ${FINELY_OS_ENTITY_VALUE}`}>{step.title}</h3>
                <p className={`fc-restore-station-body ${FINELY_OS_ENTITY_BODY}`}>{step.description}</p>
                {step.screenshotHint ? (
                  <p className="fc-restore-station-hint">{step.screenshotHint}</p>
                ) : null}
                <div className="fc-restore-station-footer">
                  <button type="button" onClick={() => go(step.path)} className="fc-restore-action-btn">
                    {step.ctaLabel} <ArrowRight size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <details className={`${finelyOsCatalogCard('sky')}`} data-accent="sky">
        <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_VALUE}`}>Score breakdown and fast improvements</summary>
        <div className="mt-4 space-y-4">
          <div className={`${finelyOsCatalogCard('violet')}`}>
            <div className="fc-restore-eyebrow">Overall score</div>
            <div className={`mt-2 text-2xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{overallScore.overall}</div>
            <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>Route-aware categories include execution signals from this restore sequence.</p>
          </div>
          {overallScore.topActions.length ? (
            <FinelyOsPaginatedStack
              items={overallScore.topActions.slice(0, 6)}
              pageSize={4}
              itemSpacingClassName="space-y-2"
              renderItem={(action) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => goPortal(action.path || '/portal/billing')}
                  className={`${finelyOsCatalogCard('rose')} w-full text-left`}
                >
                  <div className={FINELY_OS_ENTITY_VALUE}>{action.title}</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{action.desc}</div>
                </button>
              )}
            />
          ) : (
            <div className={FINELY_OS_ENTITY_BODY}>Complete more restore milestones to surface improvement suggestions.</div>
          )}
        </div>
      </details>

      {!embedded ? (
        <div className={`${finelyOsCatalogCard('emerald')} space-y-4`} data-accent="emerald">
          <p className="fc-restore-eyebrow">Need the full workstation?</p>
          <p className={FINELY_OS_ENTITY_BODY}>Jump directly into credit reports, evidence, disputes, or Letter Studio from the restore dock.</p>
          <button type="button" onClick={() => go(navigation.reportsPath)} className="fc-restore-action-btn">
            Open credit reports <ArrowRight size={14} />
          </button>
        </div>
      ) : null}

      {showDock && !embedded ? (
        <PartnerRestoreWorkspaceDock variant="portal" className="mt-4 sticky bottom-3 z-20" />
      ) : null}

      {!embedded ? <FinelyOsPageFooter /> : null}
    </div>
  );
}
