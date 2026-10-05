import { Navigate, useLocation } from 'react-router-dom';
import { LeadMagnetFunnelShell } from '../../components/leadmagnet/LeadMagnetFunnelShell';
import { PARTNER_REFER_FUNNEL } from '../../domain/leadMagnetFunnels';

/** Public partner-referral warm capture (`/partners/refer`). Phone + consent required. */
export default function PartnersReferFunnelPage() {
  return <LeadMagnetFunnelShell config={PARTNER_REFER_FUNNEL} variant="premium" />;
}

/** Alias `/partner-refer` → `/partners/refer` (keeps ref / UTM query). */
export function PartnersReferAliasRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/partners/refer${search}`} replace />;
}
