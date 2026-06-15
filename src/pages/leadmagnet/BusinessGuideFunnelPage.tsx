import { LeadMagnetFunnelShell } from '../../components/leadmagnet/LeadMagnetFunnelShell';
import { BUSINESS_FUNNEL } from '../../domain/leadMagnetFunnels';

export default function BusinessGuideFunnelPage() {
  return <LeadMagnetFunnelShell config={BUSINESS_FUNNEL} />;
}
