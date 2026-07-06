import { isAdminEmail } from '../auth/admin';
import type { Membership } from '../domain/tenants';
import type { Partner } from '../domain/partners';
import {
  canViewAllClients,
  getMembershipByUserAndTenant,
  hasPermission,
  isPlatformAdmin,
} from '../data/tenantsRepo';
import { FINELY_TENANT_ID } from '../domain/tenants';
import { careerRoleForPartner } from './partnerInviteRouting';

export type StaffCommsCapabilities = {
  isFullAdmin: boolean;
  canAccessAdminArea: boolean;
  canViewAllPartners: boolean;
  canManagePartnerAccess: boolean;
  canSendPartnerComms: (partner: Partner) => boolean;
  canDeletePartners: boolean;
  canCreatePartners: boolean;
};

function activeMembership(userId: string, tenantId: string): Membership | null {
  const m = getMembershipByUserAndTenant(userId, tenantId) ?? getMembershipByUserAndTenant(userId, FINELY_TENANT_ID);
  return m?.status === 'active' ? m : null;
}

/** Client-side staff comms + admin capability matrix for partner files. */
export function getStaffCommsCapabilities(args: {
  userId?: string | null;
  email?: string | null;
  tenantId: string;
}): StaffCommsCapabilities {
  const email = (args.email || '').trim().toLowerCase();
  const bootstrapAdmin = email ? isAdminEmail(email) : false;
  const membership = args.userId ? activeMembership(args.userId, args.tenantId) : null;

  const isFullAdmin =
    bootstrapAdmin ||
    isPlatformAdmin(membership) ||
    membership?.role === 'tenant_owner' ||
    canViewAllClients(membership);

  const canViewAllPartners = isFullAdmin;
  const canManagePartnerAccess = isFullAdmin;
  const canDeletePartners = isFullAdmin;
  const canCreatePartners = isFullAdmin;

  const agentAssigned =
    membership?.role === 'agent' && Array.isArray(membership.permissions?.assignedPartnerIds)
      ? membership.permissions!.assignedPartnerIds!.map(String)
      : [];

  const staffMaySend =
    isFullAdmin ||
    hasPermission(membership, 'canSendPartnerInvites') ||
    (membership?.role === 'agent' && agentAssigned.length > 0);

  const canSendPartnerComms = (partner: Partner): boolean => {
    if (!staffMaySend) return false;
    if (isFullAdmin) return true;
    if (membership?.role === 'agent') {
      if (!agentAssigned.includes(partner.id)) return false;
      const role = careerRoleForPartner(partner);
      return role === 'client' || role === 'au_seller';
    }
    if (hasPermission(membership, 'canSendPartnerInvites') || canViewAllClients(membership)) {
      return true;
    }
    return false;
  };

  return {
    isFullAdmin,
    canAccessAdminArea: Boolean(bootstrapAdmin || membership),
    canViewAllPartners,
    canManagePartnerAccess,
    canSendPartnerComms,
    canDeletePartners,
    canCreatePartners,
  };
}
