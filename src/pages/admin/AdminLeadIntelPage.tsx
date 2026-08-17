import React from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';

/**
 * Legacy lead-intel hire path → Marketing Department Find room.
 * Classic labs via ?view=classic|#classic|#advanced → Owner Leads Ops intel tab.
 */
export default function AdminLeadIntelPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const wantClassic =
    searchParams.get('view') === 'classic' ||
    location.hash === '#advanced' ||
    location.hash === '#classic';

  if (wantClassic) {
    return <Navigate to="/admin/leads?tab=intel" replace />;
  }

  return <Navigate to="/admin/marketing?tab=desk&helper=find" replace />;
}
