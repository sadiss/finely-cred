import React from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';

/**
 * Legacy lead-intel hire path → dedicated Marketing Desk Find room.
 * Classic labs via ?view=classic|#classic|#advanced → Leads OS intel tab.
 */
export default function AdminLeadIntelPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const wantClassic =
    searchParams.get('view') === 'classic' ||
    location.hash === '#advanced' ||
    location.hash === '#classic';

  if (wantClassic) {
    return <Navigate to="/admin/leads-os?tab=intel" replace />;
  }

  return <Navigate to="/admin/marketing-desk?helper=find" replace />;
}
