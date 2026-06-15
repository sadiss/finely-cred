import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { captureLeadAttributionFromUrl } from '../../lib/leadAttribution';
import { recordReferralLinkVisit } from '../../lib/referralGrowthEngine';

/** Short link for cards, QR, and brochures: /g/partner-code → /free-guide?ref=partner-code */
export default function ShortReferralRedirectPage() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const ref = (code || '').trim();
    if (ref) recordReferralLinkVisit({ code: ref, path: `/g/${ref}` });
    const guide = searchParams.get('guide') ?? 'credit-dispute-letter-guide';
    const params = new URLSearchParams();
    if (ref) params.set('ref', ref);
    params.set('guide', guide);
    params.set('utm_source', searchParams.get('utm_source') ?? 'referral');
    params.set('utm_medium', searchParams.get('utm_medium') ?? 'card');
    captureLeadAttributionFromUrl(params.toString(), `/g/${ref}`);
    navigate(`/free-guide?${params.toString()}`, { replace: true });
  }, [code, navigate, searchParams]);

  return null;
}
