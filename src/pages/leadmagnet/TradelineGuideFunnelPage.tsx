import { LeadMagnetFunnelShell } from '../../components/leadmagnet/LeadMagnetFunnelShell';
import { TRADELINE_FUNNEL } from '../../domain/leadMagnetFunnels';

export default function TradelineGuideFunnelPage() {
  return <LeadMagnetFunnelShell config={TRADELINE_FUNNEL} variant="premium" />;
}
