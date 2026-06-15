import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import { PartnerCreditRestoreHud } from '../../features/partner/PartnerCreditRestoreHud';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';

type Props = {
  partner: Partner;
  reportsCount: number;
  evidenceCount: number;
  lettersCount: number;
  openCasesCount: number;
  negativesCount?: number;
};

const TAB_ROUTES: Record<string, string> = {
  reports: '/portal/reports',
  analysis: '/portal/reports',
  evidence: '/portal/evidence',
  disputes: '/portal/disputes',
  letters: '/portal/letters',
  tasks: '/portal/projects',
  notes: '/portal/partner',
  debt: '/portal/debt',
  overview: '/portal/partner',
};

export function PartnerCreditRestoreCommandStrip({
  partner,
  reportsCount,
  evidenceCount,
  lettersCount,
  openCasesCount,
  negativesCount = 0,
}: Props) {
  const navigate = useNavigate();

  const blocker = useMemo(() => {
    if (reportsCount === 0) return 'Upload a credit report to start your restore pipeline.';
    if (evidenceCount === 0 && reportsCount > 0) return 'Add identity and proof documents in Evidence before mailing disputes.';
    if (lettersCount === 0 && reportsCount > 0 && evidenceCount > 0) return 'Your file is ready — draft dispute letters in Letter Studio.';
    return null;
  }, [reportsCount, evidenceCount, lettersCount]);

  const primaryAction = useMemo(() => {
    if (reportsCount === 0) return { label: 'Upload report', tab: 'reports' as const };
    if (lettersCount === 0) return { label: 'Open dispute letters', tab: 'disputes' as const };
    return { label: 'View saved letters', tab: 'letters' as const };
  }, [reportsCount, lettersCount]);

  return (
    <div className="space-y-3">
      {blocker ? <FinelyOsAlertBanner tone={reportsCount === 0 ? 'warning' : 'info'} message={blocker} /> : null}
      <PartnerCreditRestoreHud
        reportsCount={reportsCount}
        negativesCount={negativesCount}
        evidenceCount={evidenceCount}
        lettersCount={lettersCount}
        openCasesCount={openCasesCount}
        onOpenTab={(tab) => navigate(TAB_ROUTES[tab] ?? '/portal/partner')}
        primaryAction={primaryAction}
      />
    </div>
  );
}
