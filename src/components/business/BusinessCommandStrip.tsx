import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import { BUSINESS_ROADMAP_STEPS } from '../../domain/businessCredit';
import { getBusinessCreditProfile, listBusinessScoreSnapshots } from '../../data/businessCreditRepo';
import { buildPartnerFundingReadiness, getPartnerFundingStage } from '../../lib/partnerFundingReadiness';
import { isNoraCapitalConfigured } from '../../data/settingsRepo';
import { FinelyOsRoleCommandCenter } from '../../features/os/FinelyOsRoleCommandCenter';

const FUNDING_STAGE_LABEL: Record<string, string> = {
  not_ready: 'Not ready',
  ready: 'Ready for handoff',
  submitted: 'Submitted',
  in_review: 'In review',
  funded: 'Funded',
  declined: 'Declined',
};

type Props = {
  partner: Partner | null;
};

export function BusinessCommandStrip({ partner }: Props) {
  const navigate = useNavigate();
  const profile = useMemo(() => (partner ? getBusinessCreditProfile(partner.id) : null), [partner?.id]);
  const roadmapDone = profile
    ? BUSINESS_ROADMAP_STEPS.filter((s) => profile.roadmap?.[s.id]?.done).length
    : 0;
  const roadmapPct = Math.round((roadmapDone / Math.max(1, BUSINESS_ROADMAP_STEPS.length)) * 100);
  const latestScore = useMemo(() => {
    if (!partner) return '—';
    const scores = listBusinessScoreSnapshots(partner.id);
    return scores[0]?.scoreValue != null ? String(scores[0].scoreValue) : '—';
  }, [partner?.id]);
  const funding = partner ? buildPartnerFundingReadiness(partner) : null;
  const stage = partner ? getPartnerFundingStage(partner) : 'not_ready';
  const noraOn = isNoraCapitalConfigured();

  return (
    <FinelyOsRoleCommandCenter
      roleLabel="Business · Role OS 2.0"
      headline={
        partner
          ? roadmapPct >= 80
            ? 'Business profile is nearly funding-ready'
            : `Roadmap ${roadmapPct}% complete`
          : 'Sign in to track business credit progress'
      }
      subline="Profile → vendors → lender logic → Nora Capital Group funding handoff when your file is ready."
      alert={
        partner && funding?.blockers.length && stage === 'not_ready'
          ? { tone: 'warning', message: funding.blockers[0] }
          : partner && funding?.ready && stage === 'ready' && noraOn
            ? { tone: 'success', message: 'Credit journey meets minimum readiness — you can request a funding handoff.' }
            : undefined
      }
      tiles={[
        {
          id: 'roadmap',
          label: 'Roadmap',
          value: partner ? `${roadmapDone}/${BUSINESS_ROADMAP_STEPS.length}` : '—',
          hint: partner ? `${roadmapPct}% done` : undefined,
          accent: 'emerald',
          onClick: partner ? () => navigate('/business/profile') : undefined,
        },
        {
          id: 'score',
          label: 'Biz score',
          value: latestScore,
          accent: 'sky',
          onClick: partner ? () => navigate('/business/documents') : undefined,
        },
        {
          id: 'vendors',
          label: 'Vendor stack',
          value: partner ? (profile?.roadmap?.vendor_tier1?.done ? 'Tier 1+' : 'Start') : '—',
          accent: 'violet',
          onClick: () => navigate('/business/vendors'),
        },
        {
          id: 'funding',
          label: 'Funding stage',
          value: FUNDING_STAGE_LABEL[stage] ?? stage,
          accent: 'amber',
          onClick: partner ? () => navigate('/portal/wealth-paths') : undefined,
        },
      ]}
      primaryAction={{ label: 'Complete profile', onClick: () => navigate('/business/profile') }}
      secondaryAction={
        noraOn && partner && (stage === 'ready' || funding?.ready)
          ? { label: 'Funding paths', onClick: () => navigate('/portal/wealth-paths') }
          : { label: 'Lender logic', onClick: () => navigate('/business/lender-logic') }
      }
    />
  );
}
