/**
 * Multi-tenant domain types
 *
 * Tenants represent workspaces. The primary tenant is Finely Cred (direct consumers).
 * Agency partners get their own tenant so their clients are isolated.
 */

export type TenantType = 'platform' | 'agency';

export type TenantStatus = 'active' | 'suspended' | 'pending';

export type Tenant = {
  id: string;
  type: TenantType;
  name: string;
  slug: string; // URL-safe identifier (e.g., "finely-cred", "acme-credit")
  status: TenantStatus;
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
};

export type TenantSettings = {
  brandName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  /**
   * Optional tenant-provided illustration/art URL to use on empty states.
   * Falls back to logo when not set.
   */
  emptyStateArtUrl?: string;
  primaryColor?: string;
  supportEmail?: string;
  customDomain?: string;
  content?: TenantContentSlots;
  features: TenantFeatureFlags;
};

export type TenantContentSlots = {
  /** Override the landing hero "kicker" (small badge text). */
  landingHeroKicker?: string;
  /** Override the landing hero subtitle (one-paragraph summary). */
  landingHeroSubtitle?: string;
};

export type TenantFeatureFlags = {
  whiteLabel: boolean;
  businessCredit: boolean;
  debtResolution: boolean;
  tradelines: boolean;
  wealthPaths: boolean;
  apiAccess: boolean;
};

/**
 * Membership links users to tenants with a role
 */
export type MembershipRole =
  | 'platform_admin' // Finely internal admin (cross-tenant access)
  | 'tenant_owner' // Agency owner (full access within tenant)
  | 'billing_admin'
  | 'support_lead'
  | 'finance_manager'
  | 'compliance_officer'
  | 'agent' // Agency staff (scoped access within tenant)
  | 'sales_rep'
  | 'marketing_manager'
  | 'course_instructor'
  | 'read_only_admin'
  | 'partner'; // End user / client (own data only)

export type MembershipStatus = 'active' | 'invited' | 'pending_approval' | 'suspended' | 'resigned' | 'archived';

export type Membership = {
  id: string;
  tenantId: string;
  userId: string; // Supabase auth user id (or local mock id)
  email: string;
  role: MembershipRole;
  status: MembershipStatus;
  permissions?: MembershipPermissions;
  /** Enterprise: department, job title, etc. */
  department?: string;
  jobTitle?: string;
  inviteExpiresAt?: string; // ISO date when invite expires
  inviteNotes?: string;
  lastActiveAt?: string; // ISO date of last activity
  createdBy?: string; // userId who invited
  createdAt: string;
  updatedAt: string;
};

/** Enterprise: 116+ granular boolean permissions. Keys from enterprisePermissions.ts. */
export type MembershipPermissions = Record<string, boolean | string[] | undefined> & {
  assignedPartnerIds?: string[]; // For agents with limited client access
};

/**
 * Constants
 */
export const FINELY_TENANT_ID = 'tenant_finely_primary';
export const FINELY_TENANT_SLUG = 'finely-cred';

/**
 * Helpers
 */
export function nowIso() {
  return new Date().toISOString();
}

export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}
