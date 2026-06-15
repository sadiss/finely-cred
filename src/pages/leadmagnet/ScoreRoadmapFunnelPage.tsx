import { LeadMagnetFunnelShell } from '../../components/leadmagnet/LeadMagnetFunnelShell';
import { SCORE_ROADMAP_FUNNEL } from '../../domain/leadMagnetFunnels';

export default function ScoreRoadmapFunnelPage() {
  return <LeadMagnetFunnelShell config={SCORE_ROADMAP_FUNNEL} />;
}
