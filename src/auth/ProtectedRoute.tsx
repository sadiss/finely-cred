import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { getOrCreatePartnerForSession, ADMIN_PARTNER_OVERRIDE_KEY } from '../portal/getOrCreatePartnerForSession';
import { isAdminEmail } from './admin';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-fc-section text-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  // Partner-portal guard for platform admins (dev/demo): require selecting a partner to view.
  // This prevents the portal from looking "broken" due to missing partner context.
  if (location.pathname.startsWith('/portal') && !location.pathname.startsWith('/portal/select-partner')) {
    const email = (user as any)?.email || (user as any)?.user_metadata?.email || '';
    const isAdmin = email ? isAdminEmail(String(email)) : false;
    if (isAdmin) {
      const p = getOrCreatePartnerForSession({ user });
      if (!p) {
        const overrideId = (localStorage.getItem(ADMIN_PARTNER_OVERRIDE_KEY) || '').trim();
        const next = encodeURIComponent(`${location.pathname}${location.search || ''}`);
        return <Navigate to={`/portal/select-partner?next=${next}`} replace />;
      }
    }
  }

  return <>{children}</>;
}

