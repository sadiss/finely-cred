import { LeadMagnetFunnelShell } from '../../components/leadmagnet/LeadMagnetFunnelShell';
import { AFFILIATE_FUNNEL } from '../../domain/leadMagnetFunnels';

export default function AffiliateToolkitFunnelPage() {
  return <LeadMagnetFunnelShell config={AFFILIATE_FUNNEL} />;
}
