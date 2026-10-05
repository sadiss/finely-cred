import { LeadMagnetFunnelShell } from '../../components/leadmagnet/LeadMagnetFunnelShell';
import { RESTORE_WEALTH_FUNNEL } from '../../domain/leadMagnetFunnels';

/**
 * Campaign door for the wealth / funding mindset (`/free-restore-wealth`).
 * Separate from `/free-guide` (DIY dispute-letter learners).
 */
export default function RestoreWealthFunnelPage() {
  return <LeadMagnetFunnelShell config={RESTORE_WEALTH_FUNNEL} variant="premium" />;
}
