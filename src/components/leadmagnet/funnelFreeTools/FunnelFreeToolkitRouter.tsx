import React from 'react';
import { FunnelBusinessCreditToolkit } from './FunnelBusinessCreditToolkit';
import { FunnelDebtValidationToolkit } from './FunnelDebtValidationToolkit';
import { FunnelScoreRoadmapWorksheet } from './FunnelScoreRoadmapWorksheet';
import {
  FunnelAgencyActivationToolkit,
  FunnelAffiliateReferralToolkit,
  FunnelSpecialistActivationToolkit,
  FunnelTradelineTimingPlanner,
} from './FunnelLaneToolkits';

type Props = {
  funnelId: string;
  leadId: string;
  email: string;
};

/** Interactive free toolkits per funnel — credit/dispute guide excluded (already has dispute panel). */
export function FunnelFreeToolkitRouter({ funnelId, leadId, email }: Props) {
  if (!leadId) return null;

  switch (funnelId) {
    case 'business':
      return <FunnelBusinessCreditToolkit leadId={leadId} email={email} />;
    case 'debt':
      return <FunnelDebtValidationToolkit leadId={leadId} email={email} />;
    case 'tradeline':
      return <FunnelTradelineTimingPlanner />;
    case 'score_roadmap':
      return <FunnelScoreRoadmapWorksheet leadId={leadId} email={email} />;
    case 'agency':
      return <FunnelAgencyActivationToolkit leadId={leadId} email={email} />;
    case 'specialist_apply':
      return <FunnelSpecialistActivationToolkit leadId={leadId} email={email} />;
    case 'affiliate':
      return <FunnelAffiliateReferralToolkit leadId={leadId} email={email} />;
    default:
      return null;
  }
}
