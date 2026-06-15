import { LeadMagnetFunnelShell } from '../../components/leadmagnet/LeadMagnetFunnelShell';
import { AGENCY_FUNNEL } from '../../domain/leadMagnetFunnels';

export default function AgencyGuideFunnelPage() {
  return <LeadMagnetFunnelShell config={AGENCY_FUNNEL} />;
}
