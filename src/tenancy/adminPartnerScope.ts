import { isAdminEmail } from '../auth/admin';
import { fetchAllPartnersAsAdmin } from '../data/partnersRepo';
import { supabase } from '../lib/supabaseClient';
import { canViewAllClients, getMembershipByUserAndTenant, isPlatformAdmin } from '../data/tenantsRepo';
import { FINELY_TENANT_ID } from '../domain/tenants';

export async function getAccessiblePartnerIdsForAdmin(args: {
  userId: string;
  email?: string | null;
  tenantId: string;
}): Promise<Set<string>> {
  const userId = (args.userId || '').trim();
  const email = (args.email || '').trim().toLowerCase();

  // Check hardcoded list first (sync), then DB admin_emails table (async).
  let adminByEmail = email ? isAdminEmail(email) : false;
  if (!adminByEmail && email) {
    const { data } = await supabase
      .from('admin_emails')
      .select('email')
      .eq('email', email)
      .maybeSingle()
      .then((r) => r, () => ({ data: null }));
    adminByEmail = Boolean(data);
  }

  if (adminByEmail) {
    const partners = await fetchAllPartnersAsAdmin();
    return new Set(partners.map((p) => p.id));
  }

  if (!userId) return new Set();
  const tenantId = (args.tenantId || '').trim();
  const membership =
    getMembershipByUserAndTenant(userId, tenantId) ?? getMembershipByUserAndTenant(userId, FINELY_TENANT_ID);
  if (!membership || membership.status !== 'active') return new Set();

  if (isPlatformAdmin(membership) || membership.role === 'tenant_owner' || canViewAllClients(membership)) {
    const partners = await fetchAllPartnersAsAdmin();
    return new Set(partners.map((p) => p.id));
  }

  if (membership.role === 'agent') {
    const assigned = (membership.permissions as any)?.assignedPartnerIds;
    if (Array.isArray(assigned)) return new Set(assigned.map((x) => String(x)));
    return new Set();
  }

  return new Set();
}


