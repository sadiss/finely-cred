import { isStaffEmail } from '../auth/staffIdentity';
import { loadSettings } from '../data/settingsRepo';
import {
  canManageTeam,
  canPreviewAllRoles as membershipCanPreviewAllRoles,
  getMembershipByUserAndTenant,
  isPlatformAdmin,
} from '../data/tenantsRepo';
import { FINELY_TENANT_ID } from '../domain/tenants';
import { getActiveTenantId } from '../tenancy/activeTenant';

export type RolePreviewAccessContext = {
  userId?: string;
  email?: string;
};

/** Whether this signed-in user may open the role preview studio or floating switcher. */
export function canUseAdminRolePreview(ctx: RolePreviewAccessContext): boolean {
  const email = (ctx.email || '').trim();
  if (!email) return false;
  if (isStaffEmail(email)) return true;

  if (!ctx.userId) return false;
  const tenantId = getActiveTenantId();
  const membership =
    getMembershipByUserAndTenant(ctx.userId, tenantId) ??
    getMembershipByUserAndTenant(ctx.userId, FINELY_TENANT_ID);
  if (!membership || membership.status !== 'active') return false;

  if (isPlatformAdmin(membership) || membership.role === 'tenant_owner') return true;

  const security = loadSettings().security ?? { adminEmails: [] };
  const teamEnabled = (security as { teamRolePreviewEnabled?: boolean }).teamRolePreviewEnabled !== false;
  if (!teamEnabled) return false;

  return membershipCanPreviewAllRoles(membership) || canManageTeam(membership);
}

/** Whether this user may view a specific partner file as that partner (scoped impersonation). */
export function canViewPartnerAsAdmin(ctx: RolePreviewAccessContext): boolean {
  return canUseAdminRolePreview(ctx);
}
