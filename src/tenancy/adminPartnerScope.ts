import { isAdminEmail } from '../auth/admin';
import { listPartners } from '../data/partnersRepo';
import { canViewAllClients, getMembershipByUserAndTenant, isPlatformAdmin } from '../data/tenantsRepo';
import { FINELY_TENANT_ID } from '../domain/tenants';

export async function getAccessiblePartnerIdsForAdmin(args: {
  userId: string;
  email?: string | null;
  tenantId: string;
}): Promise<Set<string>> {
  const userId = (args.userId || '').trim();
  const email = (args.email || '').trim().toLowerCase();

  // Admin emails: query all partners directly from Supabase (RLS now allows this via is_admin()).
  // No localStorage, no tenant-scoping — every admin sees the same complete list.
  if (email && isAdminEmail(email)) {
    const partners = await listPartners();
    return new Set(partners.map((p) => p.id));
  }

  if (!userId) return new Set();
  const tenantId = (args.tenantId || '').trim();
  const membership =
    getMembershipByUserAndTenant(userId, tenantId) ?? getMembershipByUserAndTenant(userId, FINELY_TENANT_ID);
  if (!membership || membership.status !== 'active') return new Set();

  if (isPlatformAdmin(membership) || membership.role === 'tenant_owner' || canViewAllClients(membership)) {
    const partners = await listPartners();
    return new Set(partners.map((p) => p.id));
  }

  if (membership.role === 'agent') {
    const assigned = (membership.permissions as any)?.assignedPartnerIds;
    if (Array.isArray(assigned)) return new Set(assigned.map((x) => String(x)));
    return new Set();
  }

  return new Set();
}


