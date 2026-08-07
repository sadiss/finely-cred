import React from 'react';
import { LeadMagnetFunnelShell } from '../../components/leadmagnet/LeadMagnetFunnelShell';
import { CREDIT_FUNNEL } from '../../domain/leadMagnetFunnels';

/**
 * Public free-guide funnel (`/free-guide`).
 * Premium variant → CreditGuidePremiumLanding (champagne/ink/ivory wealth redesign).
 */
export default function FreeGuideFunnelPage() {
  return <LeadMagnetFunnelShell config={CREDIT_FUNNEL} variant="premium" />;
}
