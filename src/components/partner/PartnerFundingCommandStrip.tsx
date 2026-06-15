import React from 'react';
import { BriefcaseBusiness } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import { buildPartnerFundingReadiness, getPartnerFundingStage } from '../../lib/partnerFundingReadiness';
import { isNoraCapitalConfigured } from '../../data/settingsRepo';
import { FinelyOsRoleCommandCenter } from '../../features/os/FinelyOsRoleCommandCenter';

const STAGE_LABEL: Record<string, string> = {
  not_ready: 'Not ready',
  ready: 'Ready to apply',
  submitted: 'Submitted',
  in_review: 'In review',
  funded: 'Funded',
  declined: 'Declined',
};

type Props = {
  partner: Partner;
  reportCount?: number;
  letterCount?: number;
  onApply?: () => void;
};

export function PartnerFundingCommandStrip({ partner, reportCount, letterCount, onApply }: Props) {
  const readiness = buildPartnerFundingReadiness(partner, { reportCount, letterCount });
  const stage = getPartnerFundingStage(partner);
  const noraOn = isNoraCapitalConfigured();

  return (
    <FinelyOsRoleCommandCenter
      roleLabel="Funding · Nora Capital Group"
      headline={STAGE_LABEL[stage] ?? 'Funding pipeline'}
      subline={
        noraOn
          ? 'When your credit file is ready, apply through Nora Capital Group for business funding.'
          : 'Funding integration is being configured — your readiness score updates as you progress.'
      }
      alert={
        readiness.blockers.length && stage === 'not_ready'
          ? { tone: 'warning', message: readiness.blockers[0] }
          : readiness.ready && stage === 'ready'
            ? { tone: 'success', message: 'Your profile meets minimum readiness for a funding handoff.' }
            : undefined
      }
      tiles={[
        { id: 'score', label: 'Readiness', value: `${readiness.score}%`, accent: 'emerald' },
        { id: 'stage', label: 'Credit journey', value: partner.journeyStage ?? 'intake', accent: 'violet' },
        { id: 'reports', label: 'Reports', value: String(reportCount ?? readiness.summary.reportCount ?? 0), accent: 'sky' },
        { id: 'letters', label: 'Letters', value: String(letterCount ?? readiness.summary.letterCount ?? 0), accent: 'amber' },
      ]}
      primaryAction={
        readiness.ready && noraOn && (stage === 'ready' || stage === 'not_ready')
          ? { label: 'Apply for funding', onClick: () => onApply?.() }
          : undefined
      }
      secondaryAction={{ label: 'Wealth paths', onClick: () => window.location.assign('/portal/wealth-paths') }}
    />
  );
}

export function PartnerFundingCommandStripIcon() {
  return <BriefcaseBusiness size={16} />;
}
