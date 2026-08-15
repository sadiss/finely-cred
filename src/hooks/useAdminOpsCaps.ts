import { useMemo } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { isAdminEmail } from '../auth/admin';
import { isDeveloperEmail } from '../auth/developer';
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
      return {
        canManageTeam: false,
        canManageTenants: false,
        canViewAllCustomers: false,
        canUseFinanceTools: false,
        isDeveloper: false,
      };
    }
    if (isAdminEmail(u.email)) {
      return {
        canManageTeam: true,
        canManageTenants: true,
        canViewAllCustomers: true,
        canUseFinanceTools: true,
        isDeveloper: false,
      };
    }
    if (isDeveloperEmail(u.email)) {
      return {
        canManageTeam: false,
        canManageTenants: false,
        canViewAllCustomers: true,
        canUseFinanceTools: false,
        isDeveloper: true,
      };
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
      isDeveloper: false,
    };
  }, [auth.user]);
}

/** Paths developer QA can access — full launch test surface with sandbox comms. */
const DEVELOPER_QA_PATHS = [
  '/developer',
  '/admin',
  '/admin/partners',
  '/admin/partners/import',
  '/admin/mail',
  '/admin/cases',
  '/admin/dispute-collaboration',
  '/admin/comms',
  '/admin/messages',
  '/admin/growth-command',
  '/admin/growth-agents',
  '/admin/marketing-desk',
  '/admin/content-studio',
  '/admin/ops-agent',
  '/admin/crm',
  '/admin/templates',
  '/admin/parsing-lab',
  '/admin/settings',
  '/admin/workflow',
  '/admin/support-inbox',
  '/admin/automations',
  '/admin/growth-automation',
  '/admin/launch-os',
  '/admin/playbooks',
  '/admin/projects',
];

function isDeveloperQaPathAllowed(path: string): boolean {
  return DEVELOPER_QA_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Paths hidden unless platform tenant admin capabilities apply. */
export function isAdminNavPathAllowed(path: string, caps: ReturnType<typeof useAdminOpsCaps>): boolean {
  if (caps.isDeveloper) return isDeveloperQaPathAllowed(path);
  if (caps.canManageTenants) return true;
  const platformOnly = [
    '/admin/tenants',
    '/admin/nora-capital',
    '/admin/finely-bridge-ops',
    '/admin/vault',
    '/admin/monitoring',
    '/admin/content-studio',
    '/admin/lead-intel',
    '/admin/finance',
    '/admin/testimonials',
  ];
  if (platformOnly.some((p) => path === p || path.startsWith(p + '/'))) return false;
  if (path === '/admin/team' && !caps.canManageTeam) return false;
  return true;
}
