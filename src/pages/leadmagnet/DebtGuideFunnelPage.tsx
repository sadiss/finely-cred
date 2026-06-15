import { LeadMagnetFunnelShell } from '../../components/leadmagnet/LeadMagnetFunnelShell';
import { DEBT_FUNNEL } from '../../domain/leadMagnetFunnels';

export default function DebtGuideFunnelPage() {
  return <LeadMagnetFunnelShell config={DEBT_FUNNEL} />;
}
