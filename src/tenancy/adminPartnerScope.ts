import { isAdminEmail } from '../auth/admin';
import { listPartnersByTenant } from '../data/partnersRepo';
import { canViewAllClients, getMembershipByUserAndTenant, isPlatformAdmin } from '../data/tenantsRepo';
import { FINELY_TENANT_ID } from '../domain/tenants';

export function getAccessiblePartnerIdsForAdmin(args: {
  userId: string;
  email?: string | null;
  tenantId: string;
}): Set<string> {
  const tenantId = (args.tenantId || '').trim();
  const userId = (args.userId || '').trim();
  const email = (args.email || '').trim().toLowerCase();
  if (!tenantId) return new Set();

  // Hard allowlist for bootstrap admins (demo-mode).
  if (email && isAdminEmail(email)) {
    return new Set(listPartnersByTenant(tenantId).map((p) => p.id));
  }

  if (!userId) return new Set();
  const membership =
    getMembershipByUserAndTenant(userId, tenantId) ?? getMembershipByUserAndTenant(userId, FINELY_TENANT_ID);
  if (!membership || membership.status !== 'active') return new Set();

  if (isPlatformAdmin(membership) || membership.role === 'tenant_owner' || canViewAllClients(membership)) {
    return new Set(listPartnersByTenant(tenantId).map((p) => p.id));
  }

  if (membership.role === 'agent') {
    const assigned = (membership.permissions as any)?.assignedPartnerIds;
    if (Array.isArray(assigned)) return new Set(assigned.map((x) => String(x)));
    return new Set();
  }

  return new Set();
}

