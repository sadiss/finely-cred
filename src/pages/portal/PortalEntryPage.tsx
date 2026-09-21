import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { RouteSkeleton } from '../../routing/RouteSkeleton';

/** `/portal` — auth gate; never a 404 under partner chrome. */
export default function PortalEntryPage() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <RouteSkeleton label="Opening your portal…" />;
  }

  if (!auth.user) {
    return <Navigate to="/login?next=%2Fportal%2Fdashboard" replace />;
  }

  return <Navigate to="/portal/dashboard" replace />;
}
