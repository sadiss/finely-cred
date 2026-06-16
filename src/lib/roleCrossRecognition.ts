import type { MembershipRole } from '../domain/tenants';
import type { SecretVaultShareRole } from '../domain/secretVault';

export type CrossRoleIdentity = {
  membershipRole: MembershipRole | null;
  marketingLane: string | null;
  videoRole: string | null;
  ncgLane: boolean;
  canAccessVault: boolean;
  canShareAcrossTenants: boolean;
  recognitionLabel: string;
  sharedIntelScopes: string[];
};

const MEMBERSHIP_TO_VAULT: Partial<Record<MembershipRole, SecretVaultShareRole[]>> = {
  platform_admin: ['platform_admin', 'tenant_owner', 'ncg_ops', 'finely_staff'],
  tenant_owner: ['tenant_owner', 'ncg_ops'],
  agent: ['agent', 'finely_staff'],
  partner: ['partner'],
};

/** Map membership + context into vault share roles and cross-org recognition. */
export function resolveCrossRoleIdentity(args: {
  membershipRole?: MembershipRole | null;
  marketingLane?: string | null;
  email?: string | null;
  isAdmin?: boolean;
  ncgTenant?: boolean;
}): CrossRoleIdentity {
  const role = args.membershipRole ?? null;
  const isAdmin = Boolean(args.isAdmin);
  const ncg = Boolean(args.ncgTenant);

  let recognitionLabel = 'Guest';
  if (isAdmin || role === 'platform_admin') recognitionLabel = 'Platform Admin';
  else if (role === 'tenant_owner') recognitionLabel = 'Owner';
  else if (role === 'agent') recognitionLabel = 'Credit Specialist';
  else if (role === 'partner') recognitionLabel = 'Partner';
  else if (args.marketingLane === 'affiliate') recognitionLabel = 'Affiliate';
  else if (ncg) recognitionLabel = 'Nora Capital Group';

  const sharedIntelScopes: string[] = ['finely_cred'];
  if (ncg || role === 'platform_admin' || role === 'tenant_owner') sharedIntelScopes.push('nora_capital');
  if (args.marketingLane === 'heta_society') sharedIntelScopes.push('heta_society');

  return {
    membershipRole: role,
    marketingLane: args.marketingLane ?? null,
    videoRole: isAdmin ? 'admin' : role === 'agent' ? 'specialist' : role === 'partner' ? 'partner' : 'client',
    ncgLane: ncg || sharedIntelScopes.includes('nora_capital'),
    canAccessVault: isAdmin || role === 'platform_admin' || role === 'tenant_owner' || role === 'agent',
    canShareAcrossTenants: isAdmin || role === 'platform_admin',
    recognitionLabel,
    sharedIntelScopes,
  };
}

/** Whether a vault item is visible to the viewer's cross-role identity. */
export function vaultItemVisibleToRole(
  item: { sharedWithRoles?: SecretVaultShareRole[]; shareWithNcg?: boolean },
  viewer: CrossRoleIdentity,
): boolean {
  if (viewer.canAccessVault && (viewer.membershipRole === 'platform_admin' || viewer.membershipRole === 'tenant_owner')) {
    return true;
  }
  const shared = item.sharedWithRoles ?? [];
  if (!shared.length && !item.shareWithNcg) return viewer.membershipRole === 'platform_admin' || viewer.membershipRole === 'tenant_owner';

  const vaultRoles = viewer.membershipRole ? MEMBERSHIP_TO_VAULT[viewer.membershipRole] ?? [] : [];
  if (shared.some((r) => vaultRoles.includes(r))) return true;
  if (item.shareWithNcg && viewer.ncgLane) return true;
  return false;
}

export function defaultShareRolesForMedia(mediaKind: string): SecretVaultShareRole[] {
  if (mediaKind === 'youtube' || mediaKind === 'video' || mediaKind === 'ebook') {
    return ['tenant_owner', 'agent', 'finely_staff'];
  }
  return ['tenant_owner', 'agent'];
}
