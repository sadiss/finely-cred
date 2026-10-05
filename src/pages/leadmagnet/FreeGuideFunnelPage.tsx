import React from 'react';
import { LeadMagnetFunnelShell } from '../../components/leadmagnet/LeadMagnetFunnelShell';
import { CREDIT_FUNNEL } from '../../domain/leadMagnetFunnels';

/**
 * Public DIY dispute-letter funnel (`/free-guide`).
 * Curious learners who want to write letters themselves.
 * Restore-for-wealth campaign lives on `/free-restore-wealth` — do not collapse this door.
 */
export default function FreeGuideFunnelPage() {
  return <LeadMagnetFunnelShell config={CREDIT_FUNNEL} variant="premium" />;
}
