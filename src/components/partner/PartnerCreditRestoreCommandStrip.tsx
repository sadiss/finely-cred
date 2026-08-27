import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import { PartnerCreditRestoreHud } from '../../features/partner/PartnerCreditRestoreHud';
import { PartnerCreditWorkloadStrip } from './PartnerCreditWorkloadStrip';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { listCasesByPartner } from '../../data/casesRepo';
import { listDebtByPartner } from '../../data/debtRepo';
import { listLettersByPartner } from '../../data/lettersRepo';
import { summarizePartnerDisputeRounds } from '../../lib/creditRestoreRoundRollup';
import { computeCreditRestorePrimaryAlert } from '../../lib/creditRestorePrimaryAlert';
import { listReportsByPartner } from '../../data/reportsRepo';
import { computeMiddleScore } from '../../domain/creditScoreMiddle';

type RestoreTabKey =
  | 'reports'
  | 'analysis'
  | 'evidence'
  | 'disputes'
  | 'letters'
  | 'tasks'
  | 'notes'
  | 'debt'
  | 'overview'
  | 'profile';

type Props = {
  partner: Partner;
  reportsCount: number;
  evidenceCount: number;
  lettersCount: number;
  openCasesCount: number;
  negativesCount?: number;
  surface?: 'dark' | 'light';
  /** When the parent page already renders the primary alert + CTAs, skip the inline banner here. */
  suppressInlineAlert?: boolean;
  /** Override default `/portal/*` tab targets (workspace-light preview). */
  navigation?: Partial<Record<RestoreTabKey, string>>;
  /** Remap guided CTA paths (debt case detail, preview shell). */
  resolvePath?: (portalPath: string) => string;
};

const TAB_ROUTES: Record<RestoreTabKey, string> = {
  reports: '/portal/reports',
  analysis: '/portal/reports',
  evidence: '/portal/evidence',
  disputes: '/portal/disputes',
  letters: '/portal/letters',
  tasks: '/portal/my-tasks',
  notes: '/portal/messages',
  debt: '/portal/debt',
  overview: '/portal/dashboard',
  profile: '/portal/account',
};

function pathToTab(path?: string): RestoreTabKey {
  if (!path) return 'letters';
  if (path.includes('/debt')) return 'debt';
  if (path.includes('/disputes')) return 'disputes';
  if (path.includes('/reports')) return 'reports';
  if (path.includes('/evidence')) return 'evidence';
  if (path.includes('/letters')) return 'letters';
  if (path.includes('/documents')) return 'evidence';
  return 'letters';
}

export function PartnerCreditRestoreCommandStrip({
  partner,
  reportsCount,
  evidenceCount,
  lettersCount,
  openCasesCount,
  negativesCount = 0,
  surface = 'dark',
  suppressInlineAlert = false,
  navigation,
  resolvePath,
}: Props) {
  const navigate = useNavigate();
  const tabRoutes = { ...TAB_ROUTES, ...navigation };
  const go = (path: string) => navigate(resolvePath ? resolvePath(path) : path);

  const debtCases = useMemo(() => listDebtByPartner(partner.id), [partner.id]);
  const letters = useMemo(() => listLettersByPartner(partner.id), [partner.id]);
  const reports = useMemo(() => listReportsByPartner(partner.id), [partner.id]);
  const middleScore = useMemo(
    () => computeMiddleScore(reports.find((r) => r.parsed?.scores?.length)?.parsed?.scores ?? []),
    [reports],
  );

  const guided = useMemo(
    () =>
      computeCreditRestorePrimaryAlert({
        reportsCount,
        hasParsedReport: reports.some((r) => Boolean(r.parsed)),
        letters,
        debtCases,
        partnerId: partner.id,
      }),
    [reportsCount, reports, letters, debtCases, partner.id],
  );

  const blocker = useMemo(() => {
    if (guided.show) return guided.message;
    if (reportsCount === 0) return 'Upload a credit report to start your restore pipeline.';
    return null;
  }, [guided, reportsCount]);

  const roundSummary = useMemo(() => {
    const cases = listCasesByPartner(partner.id);
    const s = summarizePartnerDisputeRounds(partner.id, cases);
    return {
      awaitingResponse: s.awaitingResponse,
      responsesLogged: s.responsesLogged,
      highestActiveRound: s.highestActiveRound,
      nextActionLabel: s.nextActionLabel,
      roundPhasePct: s.roundPhasePct,
    };
  }, [partner.id]);

  const primaryAction = useMemo(() => {
    if (guided.ctaPath && guided.ctaLabel) {
      return { label: guided.ctaLabel, tab: pathToTab(guided.ctaPath) };
    }
    if (reportsCount === 0) return { label: 'Upload report', tab: 'reports' as const };
    if (debtCases.some((d) => d.type === 'summons' && d.status !== 'resolved')) {
      return { label: 'Open debt / court', tab: 'debt' as const };
    }
    if (lettersCount === 0) return { label: 'Open letter studio', tab: 'letters' as const };
    if (roundSummary.awaitingResponse > 0) return { label: 'Track dispute rounds', tab: 'disputes' as const };
    return { label: 'View saved letters', tab: 'letters' as const };
  }, [guided, reportsCount, lettersCount, roundSummary.awaitingResponse, debtCases]);

  const secondaryAction = useMemo(
    () => ({
      label: guided.secondaryCtaLabel || 'Bureau letter now (optional)',
      tab: pathToTab(guided.secondaryCtaPath || '/portal/letters'),
    }),
    [guided.secondaryCtaLabel, guided.secondaryCtaPath],
  );

  return (
    <div className="space-y-6">
      {blocker && !suppressInlineAlert ? (
        <FinelyOsAlertBanner
          tone={guided.tone === 'blocking' ? 'warning' : guided.tone === 'success' ? 'success' : 'info'}
          message={blocker}
          surface={surface}
        />
      ) : null}
      <PartnerCreditWorkloadStrip partnerId={partner.id} compact />
      <PartnerCreditRestoreHud
        reportsCount={reportsCount}
        negativesCount={negativesCount}
        evidenceCount={evidenceCount}
        lettersCount={lettersCount}
        openCasesCount={openCasesCount}
        middleScore={middleScore.value}
        middleScoreLabel={middleScore.value != null ? `${middleScore.label} · Results vary` : undefined}
        roundSummary={roundSummary}
        progressRail={guided.rail}
        guidedMessage={guided.show ? guided.message : undefined}
        onOpenTab={(tab) => {
          const path = tabRoutes[tab] ?? tabRoutes.overview ?? '/portal/dashboard';
          if (guided.ctaPath && tab === pathToTab(guided.ctaPath) && guided.ctaPath.includes('/debt/')) {
            go(guided.ctaPath);
            return;
          }
          go(path);
        }}
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
        surface={surface}
      />
    </div>
  );
}
