import { useMemo } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { isAdminEmail } from '../auth/admin';
import { getActiveTenantId } from '../tenancy/activeTenant';
import { FINELY_TENANT_ID } from '../domain/tenants';
import {
  canManageTeam,
  canUseFinanceTools,
  canViewAllClients,
  getMembershipByUserAndTenant,
  isPlatformAdmin,
} from '../data/tenantsRepo';

export function useAdminOpsCaps() {
  const auth = useAuth();

  return useMemo(() => {
    const u = auth.user;
    if (!u) {
      return { canManageTeam: false, canManageTenants: false, canViewAllCustomers: false, canUseFinanceTools: false };
    }
    if (isAdminEmail(u.email)) {
      return { canManageTeam: true, canManageTenants: true, canViewAllCustomers: true, canUseFinanceTools: true };
    }
    const tenantId = getActiveTenantId();
    const membership =
      getMembershipByUserAndTenant(u.id, tenantId) ?? getMembershipByUserAndTenant(u.id, FINELY_TENANT_ID);
    const ok = membership?.status === 'active' && (isPlatformAdmin(membership) || membership.role === 'tenant_owner');
    return {
      canManageTeam: ok || canManageTeam(membership),
      canManageTenants: ok,
      canViewAllCustomers: ok || canViewAllClients(membership),
      canUseFinanceTools: ok || canUseFinanceTools(membership),
    };
  }, [auth.user]);
}

/** Paths hidden unless platform tenant admin capabilities apply. */
export function isAdminNavPathAllowed(path: string, caps: ReturnType<typeof useAdminOpsCaps>): boolean {
  if (caps.canManageTenants) return true;
  const platformOnly = [
    '/admin/tenants',
    '/admin/nora-capital',
    '/admin/finely-bridge-ops',
    '/admin/vault',
    '/admin/monitoring',
    '/admin/media-studio',
    '/admin/lead-intel',
    '/admin/finance',
    '/admin/testimonials',
  ];
  if (platformOnly.some((p) => path === p || path.startsWith(p + '/'))) return false;
  if (path === '/admin/team' && !caps.canManageTeam) return false;
  return true;
}
