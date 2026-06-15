import { LeadMagnetFunnelShell } from '../../components/leadmagnet/LeadMagnetFunnelShell';
import { SPECIALIST_APPLY_FUNNEL } from '../../domain/leadMagnetFunnels';

export default function SpecialistApplyFunnelPage() {
  return <LeadMagnetFunnelShell config={SPECIALIST_APPLY_FUNNEL} />;
}
