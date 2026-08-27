import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { isAdminEmail } from './admin';
import { usePartnerSession } from './PartnerSessionContext';
import { PartnerAccessGate } from '../components/portal/PartnerAccessGate';
import { MfaGate } from './MfaGate';
import { adminPartnerFilePath, readAdminPartnerOverrideId } from '../lib/adminPartnerViewAs';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useAuth();
  const location = useLocation();
  const { partner, loading: partnerLoading } = usePartnerSession();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-fc-section text-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    const returnTo = `${location.pathname}${location.search || ''}`;
    const nextQs = returnTo.startsWith('/') ? `&next=${encodeURIComponent(returnTo)}` : '';
    return <Navigate to={`/signup?auth=signup${nextQs}`} replace state={{ from: returnTo }} />;
  }

  const email = (user as any)?.email || (user as any)?.user_metadata?.email || '';
  const isAdmin = email ? isAdminEmail(String(email)) : false;

  const isPortalRoute = location.pathname.startsWith('/portal');

  // Staff already pick a partner on Partners. Never dump them onto a second picker.
  if (isPortalRoute && isAdmin) {
    if (partnerLoading) {
      return (
        <div className="min-h-screen bg-fc-section text-white flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    if (!partner) {
      return <Navigate to={adminPartnerFilePath(readAdminPartnerOverrideId())} replace />;
    }
  }

  if (isPortalRoute && !isAdmin && partner) {
    if (partnerLoading) {
      return (
        <div className="min-h-screen bg-fc-section text-white flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    return (
      <PartnerAccessGate partner={partner}>
        <MfaGate>{children}</MfaGate>
      </PartnerAccessGate>
    );
  }

  if (isPortalRoute) {
    return <MfaGate>{children}</MfaGate>;
  }

  if (location.pathname.startsWith('/admin')) {
    return <MfaGate>{children}</MfaGate>;
  }

  return <>{children}</>;
}
