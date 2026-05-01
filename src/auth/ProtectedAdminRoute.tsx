import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { isAdminEmail } from './admin';
import { PageShell } from '../components/layout/PageShell';
import { FINELY_TENANT_ID } from '../domain/tenants';
import { canAccessAdminArea, canManageTeam, canViewAllClients, getMembershipByUserAndTenant, isPlatformAdmin } from '../data/tenantsRepo';
import { ensureFinelyPlatformAdminMembership } from '../data/tenantsRepo';
import { getActiveTenantId } from '../tenancy/activeTenant';

export function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1512] text-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  const activeTenantId = getActiveTenantId();
  const membership =
    getMembershipByUserAndTenant(user.id, activeTenantId) ?? getMembershipByUserAndTenant(user.id, FINELY_TENANT_ID);
  const allowByMembership = canAccessAdminArea(membership);

  const email =
    user.email ||
    ((user as any)?.user_metadata?.email as string | undefined) ||
    ((user as any)?.identities?.[0]?.identity_data?.email as string | undefined) ||
    '';

  const emailSource = user.email
    ? 'user.email'
    : ((user as any)?.user_metadata?.email as string | undefined)
      ? 'user.user_metadata.email'
      : ((user as any)?.identities?.[0]?.identity_data?.email as string | undefined)
        ? 'user.identities[0].identity_data.email'
        : 'none';

  const isAllowlisted = isAdminEmail(email);

  if (isAllowlisted) {
    // Demo-mode: bootstrap an actual membership record for platform admins.
    try {
      ensureFinelyPlatformAdminMembership({ userId: user.id, email: email || user.email || '' });
    } catch {
      // ignore
    }
    return <>{children}</>;
  }

  if (!allowByMembership) {
    return (
      <PageShell
        badge="Admin"
        title="Not authorized"
        subtitle={`This area is restricted to Finely Cred administrators. Signed in as: ${user.email || '—'}`}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60 text-sm">
            To access Admin modules, your account must be an allowlisted admin email or have an active team membership with admin access.
          </div>
          {membership ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/70 text-sm">
              Current membership: <span className="font-mono text-white/80">{membership.role}</span> •{' '}
              <span className="font-mono text-white/80">{membership.status}</span>
              <div className="mt-2 text-white/50 text-xs">
                Permissions: team={String(canManageTeam(membership))}, allClients={String(canViewAllClients(membership))}
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate('/onboarding')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
            >
              Switch account
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return <>{children}</>;
}

