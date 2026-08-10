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

type Props = {
  partner: Partner;
  reportsCount: number;
  evidenceCount: number;
  lettersCount: number;
  openCasesCount: number;
  negativesCount?: number;
};

const TAB_ROUTES = {
  reports: '/portal/reports',
  analysis: '/portal/analysis',
  evidence: '/portal/documents',
  disputes: '/portal/disputes',
  letters: '/portal/letters',
  tasks: '/portal/my-tasks',
  notes: '/portal/partner',
  debt: '/portal/debt',
  overview: '/portal/partner',
  profile: '/portal/partner',
} as const;

type RestoreTabKey = keyof typeof TAB_ROUTES;

function pathToTab(path?: string): RestoreTabKey {
  if (!path) return 'letters';
  if (path.includes('/debt')) return 'debt';
  if (path.includes('/disputes')) return 'disputes';
  if (path.includes('/reports')) return 'reports';
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
}: Props) {
  const navigate = useNavigate();

  const debtCases = useMemo(() => listDebtByPartner(partner.id), [partner.id]);
  const letters = useMemo(() => listLettersByPartner(partner.id), [partner.id]);
  const reports = useMemo(() => listReportsByPartner(partner.id), [partner.id]);

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
    <div className="space-y-3">
      {blocker ? (
        <FinelyOsAlertBanner
          tone={guided.tone === 'blocking' ? 'warning' : guided.tone === 'success' ? 'success' : 'info'}
          message={blocker}
        />
      ) : null}
      <PartnerCreditWorkloadStrip partnerId={partner.id} compact />
      <PartnerCreditRestoreHud
        reportsCount={reportsCount}
        negativesCount={negativesCount}
        evidenceCount={evidenceCount}
        lettersCount={lettersCount}
        openCasesCount={openCasesCount}
        roundSummary={roundSummary}
        progressRail={guided.rail}
        guidedMessage={guided.show ? guided.message : undefined}
        onOpenTab={(tab) => {
          const path = TAB_ROUTES[tab] ?? '/portal/partner';
          if (guided.ctaPath && tab === pathToTab(guided.ctaPath) && guided.ctaPath.includes('/debt/')) {
            navigate(guided.ctaPath);
            return;
          }
          navigate(path);
        }}
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
      />
    </div>
  );
}
