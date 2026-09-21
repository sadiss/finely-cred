import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { getOrCreatePartnerForSession, ADMIN_PARTNER_OVERRIDE_KEY } from '../portal/getOrCreatePartnerForSession';
import { isAdminEmail } from './admin';
import { RouteSkeleton } from '../routing/RouteSkeleton';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, user, isConfigured, isDevAuthEnabled, sessionBootstrapTimedOut } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <RouteSkeleton label="Checking your session…" />;
  }

  if (!isConfigured && !isDevAuthEnabled) {
    return (
      <div className="w-full min-h-[calc(100dvh-5rem)] bg-[#0d1512] px-6 py-12 flex justify-center">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/25 bg-rose-500/10 p-8 space-y-3 text-center">
          <div className="text-white font-semibold text-lg">Sign-in is not configured</div>
          <p className="text-white/60 text-sm">
            This environment is missing Supabase keys. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then rebuild.
          </p>
        </div>
      </div>
    );
  }

  if (sessionBootstrapTimedOut && !user) {
    return (
      <div className="w-full min-h-[calc(100dvh-5rem)] bg-[#0d1512] px-6 py-12 flex justify-center">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-black/40 p-8 space-y-4 text-center">
          <div className="text-white font-semibold text-lg">Connection is slow</div>
          <p className="text-white/60 text-sm">We couldn’t verify your session in time. Try again or sign in.</p>
          <button
            type="button"
            onClick={() => window.location.assign('/onboarding')}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm"
          >
            Go to sign in
          </button>
        </div>
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

