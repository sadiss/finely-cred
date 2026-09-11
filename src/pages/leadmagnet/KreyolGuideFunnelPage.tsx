import { LeadMagnetFunnelShell } from '../../components/leadmagnet/LeadMagnetFunnelShell';
import { KREYOL_FUNNEL } from '../../domain/leadMagnetFunnels';

export default function KreyolGuideFunnelPage() {
  return <LeadMagnetFunnelShell config={KREYOL_FUNNEL} variant="premium" />;
}
