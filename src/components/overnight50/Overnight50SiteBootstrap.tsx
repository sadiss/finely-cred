import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { captureLeadAttributionFromUrl } from '../../lib/leadAttribution';

/** Site-wide first-touch attribution + geo capture (?city=, UTM, ref). */
export function Overnight50SiteBootstrap() {
  const location = useLocation();

  useEffect(() => {
    captureLeadAttributionFromUrl(location.search, location.pathname);
  }, [location.pathname, location.search]);

  return null;
}
