import React from 'react';
import { LeadMagnetFunnelShell } from '../../components/leadmagnet/LeadMagnetFunnelShell';
import { CREDIT_FUNNEL } from '../../domain/leadMagnetFunnels';

export default function FreeGuideFunnelPage() {
  return <LeadMagnetFunnelShell config={CREDIT_FUNNEL} variant="premium" />;
}
