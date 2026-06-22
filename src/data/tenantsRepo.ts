import type {
  Tenant,
  TenantType,
  TenantStatus,
  TenantSettings,
  Membership,
  MembershipRole,
  MembershipStatus,
  MembershipPermissions,
} from '../domain/tenants';
import {
  FINELY_TENANT_ID,
  FINELY_TENANT_SLUG,
  nowIso,
  createSlug,
} from '../domain/tenants';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.tenants.v1';

type Store = {
  tenants: Tenant[];
  memberships: Membership[];
};

const DEFAULT_FINELY_TENANT: Tenant = {
  id: FINELY_TENANT_ID,
  type: 'platform',
  name: 'Finely Cred',
  slug: FINELY_TENANT_SLUG,
  status: 'active',
  settings: {
    brandName: 'Finely Cred',
    supportEmail: 'support@finelycred.com',
    features: {
      whiteLabel: false,
      businessCredit: true,
      debtResolution: true,
      tradelines: true,
      wealthPaths: true,
      apiAccess: true,
    },
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

function loadStore(): Store {
  const store = loadJson<Store>(KEY, { tenants: [], memberships: [] }, 1);
  // Ensure Finely tenant always exists
  if (!store.tenants.find((t) => t.id === FINELY_TENANT_ID)) {
    store.tenants.push(DEFAULT_FINELY_TENANT);
  }
  return store;
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tenant CRUD
// ─────────────────────────────────────────────────────────────────────────────

export function listTenants(): Tenant[] {
  return loadStore().tenants.sort((a, b) => a.name.localeCompare(b.name));
}

export function getTenant(id: string): Tenant | null {
  return loadStore().tenants.find((t) => t.id === id) ?? null;
}

export function getTenantBySlug(slug: string): Tenant | null {
  return loadStore().tenants.find((t) => t.slug === slug) ?? null;
}

export function getFinelyCredTenant(): Tenant {
  return getTenant(FINELY_TENANT_ID) ?? DEFAULT_FINELY_TENANT;
}

export function createTenant(args: {
  name: string;
  type?: TenantType;
  status?: TenantStatus;
  settings?: Partial<TenantSettings>;
}): Tenant {
  const store = loadStore();
  const now = nowIso();
  const slug = createSlug(args.name);

  // Ensure unique slug
  let finalSlug = slug;
  let counter = 1;
  while (store.tenants.some((t) => t.slug === finalSlug)) {
    finalSlug = `${slug}-${counter++}`;
  }

  const tenant: Tenant = {
    id: newId('tenant'),
    type: args.type ?? 'agency',
    name: args.name,
    slug: finalSlug,
    status: args.status ?? 'active',
    settings: {
      features: {
        whiteLabel: true,
        businessCredit: true,
        debtResolution: true,
        tradelines: false,
        wealthPaths: false,
        apiAccess: false,
      },
      ...args.settings,
    },
    createdAt: now,
    updatedAt: now,
  };

  store.tenants.push(tenant);
  saveStore(store);
  return tenant;
}

export function updateTenant(
  id: string,
  patch: Partial<Pick<Tenant, 'name' | 'status' | 'settings'>>
): Tenant | null {
  const store = loadStore();
  const idx = store.tenants.findIndex((t) => t.id === id);
  if (idx < 0) return null;

  const updated: Tenant = {
    ...store.tenants[idx]!,
    ...patch,
    settings: {
      ...store.tenants[idx]!.settings,
      ...(patch.settings ?? {}),
      features: {
        ...store.tenants[idx]!.settings.features,
        ...(patch.settings?.features ?? {}),
      },
    },
    updatedAt: nowIso(),
  };
  store.tenants[idx] = updated;
  saveStore(store);
  return updated;
}

// ─────────────────────────────────────────────────────────────────────────────
// Membership CRUD
// ─────────────────────────────────────────────────────────────────────────────

export function listMemberships(tenantId?: string): Membership[] {
  const all = loadStore().memberships;
  return tenantId ? all.filter((m) => m.tenantId === tenantId) : all;
}

export function getMembership(id: string): Membership | null {
  return loadStore().memberships.find((m) => m.id === id) ?? null;
}

export function getMembershipByUserAndTenant(
  userId: string,
  tenantId: string
): Membership | null {
  return (
    loadStore().memberships.find(
      (m) => m.userId === userId && m.tenantId === tenantId
    ) ?? null
  );
}

export function listMembershipsByUser(userId: string): Membership[] {
  return loadStore().memberships.filter((m) => m.userId === userId);
}

export function createMembership(args: {
  tenantId: string;
  userId: string;
  email: string;
  role: MembershipRole;
  status?: MembershipStatus;
  permissions?: MembershipPermissions;
  department?: string;
  jobTitle?: string;
  inviteExpiresAt?: string;
  inviteNotes?: string;
  createdBy?: string;
}): Membership {
  const store = loadStore();
  const now = nowIso();

  // Check if membership already exists
  const existing = store.memberships.find(
    (m) => m.userId === args.userId && m.tenantId === args.tenantId
  );
  if (existing) return existing;

  const membership: Membership = {
    id: newId('member'),
    tenantId: args.tenantId,
    userId: args.userId,
    email: args.email,
    role: args.role,
    status: args.status ?? 'active',
    permissions: args.permissions,
    department: args.department,
    jobTitle: args.jobTitle,
    inviteExpiresAt: args.inviteExpiresAt,
    inviteNotes: args.inviteNotes,
    createdBy: args.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  store.memberships.push(membership);
  saveStore(store);
  return membership;
}

export function updateMembership(
  id: string,
  patch: Partial<Pick<Membership, 'role' | 'status' | 'permissions' | 'department' | 'jobTitle' | 'inviteExpiresAt' | 'inviteNotes' | 'lastActiveAt'>>
): Membership | null {
  const store = loadStore();
  const idx = store.memberships.findIndex((m) => m.id === id);
  if (idx < 0) return null;

  const updated: Membership = {
    ...store.memberships[idx]!,
    ...patch,
    updatedAt: nowIso(),
  };
  store.memberships[idx] = updated;
  saveStore(store);
  return updated;
}

export function deleteMembership(id: string): boolean {
  const store = loadStore();
  const idx = store.memberships.findIndex((m) => m.id === id);
  if (idx < 0) return false;
  store.memberships.splice(idx, 1);
  saveStore(store);
  return true;
}

/**
 * Claim an invited membership by email for the active user.
 * This is demo-mode behavior to support “invite by email” before the user signs in.
 */
export function claimInvitedMembershipForUser(args: { userId: string; email: string }): number {
  const userId = (args.userId || '').trim();
  const email = (args.email || '').trim().toLowerCase();
  if (!userId || !email) return 0;
  const store = loadStore();
  let changed = 0;
  for (let i = 0; i < store.memberships.length; i++) {
    const m = store.memberships[i]!;
    if ((m.email || '').trim().toLowerCase() !== email) continue;
    if (m.userId === userId) continue;
    if (!String(m.userId || '').startsWith('invited:')) continue;
    store.memberships[i] = {
      ...m,
      userId,
      status: 'active',
      updatedAt: nowIso(),
    };
    changed++;
  }
  if (changed) saveStore(store);
  return changed;
}

/** Ensure the current user has a platform admin membership in Finely tenant (demo-mode). */
export function ensureFinelyPlatformAdminMembership(args: { userId: string; email: string }): Membership {
  return createMembership({
    tenantId: FINELY_TENANT_ID,
    userId: args.userId,
    email: args.email,
    role: 'platform_admin',
    status: 'active',
    permissions: {
      canManageTeam: true,
      canManageBilling: true,
      canViewAllCustomers: true,
      canExportData: true,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Permission helpers
// ─────────────────────────────────────────────────────────────────────────────

export function canAccessTenant(membership: Membership | null): boolean {
  if (!membership) return false;
  return membership.status === 'active';
}

export function isPlatformAdmin(membership: Membership | null): boolean {
  return membership?.role === 'platform_admin';
}

function permBool(p: unknown): boolean {
  return p === true;
}

export function canManageTeam(membership: Membership | null): boolean {
  if (!membership || membership.status !== 'active') return false;
  if (membership.role === 'platform_admin' || membership.role === 'tenant_owner')
    return true;
  return permBool(membership.permissions?.canManageTeam);
}

export function canViewAllClients(membership: Membership | null): boolean {
  if (!membership || membership.status !== 'active') return false;
  if (
    membership.role === 'platform_admin' ||
    membership.role === 'tenant_owner'
  )
    return true;
  return permBool(membership.permissions?.canViewAllClients);
}

/** Coarse admin-area gate (used for route/module access). */
export function canAccessAdminArea(membership: Membership | null): boolean {
  if (!membership || membership.status !== 'active') return false;
  const staffRoles: Membership['role'][] = [
    'platform_admin', 'tenant_owner', 'billing_admin', 'support_lead', 'finance_manager',
    'compliance_officer', 'agent', 'sales_rep', 'marketing_manager', 'course_instructor', 'read_only_admin',
  ];
  if (staffRoles.includes(membership.role)) return true;
  if (membership.permissions?.canAccessAdminArea === true) return true;
  return false;
}

export function canAccessVault(membership: Membership | null): boolean {
  if (!membership || membership.status !== 'active') return false;
  if (membership.role === 'platform_admin' || membership.role === 'tenant_owner') return true;
  return permBool(membership.permissions?.canAccessVault);
}

export function canUseFinanceTools(membership: Membership | null): boolean {
  if (!membership || membership.status !== 'active') return false;
  if (membership.role === 'platform_admin' || membership.role === 'tenant_owner') return true;
  return permBool(membership.permissions?.canUseFinanceTools);
}

export function canDeleteLetters(membership: Membership | null): boolean {
  if (!membership || membership.status !== 'active') return false;
  if (membership.role === 'platform_admin' || membership.role === 'tenant_owner') return true;
  return permBool(membership.permissions?.canDeleteLetters);
}

export function canManageCustomFields(membership: Membership | null): boolean {
  if (!membership || membership.status !== 'active') return false;
  if (membership.role === 'platform_admin' || membership.role === 'tenant_owner') return true;
  return permBool(membership.permissions?.canManageCustomFields);
}

export function canManageFieldLayouts(membership: Membership | null): boolean {
  if (!membership || membership.status !== 'active') return false;
  if (membership.role === 'platform_admin' || membership.role === 'tenant_owner') return true;
  return permBool(membership.permissions?.canManageFieldLayouts);
}

export function canAccessPartner(
  membership: Membership | null,
  partnerId: string
): boolean {
  if (!membership || membership.status !== 'active') return false;
  if (canViewAllClients(membership)) return true;
  // Agents with limited access
  if (membership.role === 'agent') {
    const ids = membership.permissions?.assignedPartnerIds;
    return Array.isArray(ids) ? ids.includes(partnerId) : false;
  }
  // Partners can only access their own record
  if (membership.role === 'partner') {
    // The partnerId check would be done at the caller level
    return true;
  }
  return false;
}

/** Enterprise: check any granular permission by key. */
export function hasPermission(
  membership: Membership | null,
  key: string
): boolean {
  if (!membership || membership.status !== 'active') return false;
  if (membership.role === 'platform_admin' || membership.role === 'tenant_owner') return true;
  const v = membership.permissions?.[key];
  return v === true;
}
