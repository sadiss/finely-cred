import React from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { isFeatureEnabled } from '../../data/settingsRepo';

/**
 * Hire / daily hunt path → Marketing Desk Find.
 * Classic / advanced labs only via ?view=classic|#classic|#advanced → Owner Leads Ops intel.
 * Note: #lead-hunt is NOT classic — many CTAs still deep-link that hash for the live hunt.
 * When marketingDesk flag is off, fall through to Owner Leads Ops.
 */
export default function AdminLeadIntelPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const wantClassic =
    searchParams.get('view') === 'classic' ||
    location.hash === '#advanced' ||
    location.hash === '#classic';
  const deskOn = isFeatureEnabled('marketingDesk');

  if (wantClassic || !deskOn) {
    return <Navigate to="/admin/leads?tab=intel" replace />;
  }

  return <Navigate to="/admin/growth-agents/lead-discovery" replace />;
}
