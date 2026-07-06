import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import type { GuardContext } from './edgeGuard.ts';
import { parseAllowlist, requireEnv } from './edgeGuard.ts';

const STAFF_ROLES = new Set([
  'platform_admin',
  'tenant_owner',
  'billing_admin',
  'support_lead',
  'finance_manager',
  'compliance_officer',
  'agent',
  'sales_rep',
  'marketing_manager',
  'course_instructor',
  'read_only_admin',
]);

export type StaffActor = {
  isFullAdmin: boolean;
  membershipRole?: string;
  canViewAllClients: boolean;
  canSendPartnerInvites: boolean;
  assignedPartnerIds: string[];
};

function permBool(v: unknown): boolean {
  return v === true;
}

function adminClient() {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function isBootstrapAdmin(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  const allow = parseAllowlist(Deno.env.get('EDGE_ADMIN_EMAILS') || '');
  if (allow.has(normalized)) return true;
  const admin = adminClient();
  const { data } = await admin.from('admin_emails').select('email').eq('email', normalized).maybeSingle();
  return Boolean(data);
}

export async function resolveStaffActor(ctx: GuardContext): Promise<StaffActor | null> {
  const email = (ctx.user.email || '').trim().toLowerCase();
  if (!email || ctx.user.id.startsWith('anon:')) return null;

  if (await isBootstrapAdmin(email)) {
    return {
      isFullAdmin: true,
      canViewAllClients: true,
      canSendPartnerInvites: true,
      assignedPartnerIds: [],
    };
  }

  const admin = adminClient();
  const { data: memberships } = await admin
    .from('memberships')
    .select('role, status, permissions, tenant_id')
    .eq('user_id', ctx.user.id)
    .eq('status', 'active');

  const membership =
    (memberships ?? []).find((m: any) => m.tenant_id === 'tenant_finely_primary') ?? (memberships ?? [])[0];
  if (!membership || !STAFF_ROLES.has(String(membership.role || ''))) return null;

  const perms = (membership.permissions && typeof membership.permissions === 'object')
    ? membership.permissions as Record<string, unknown>
    : {};
  const role = String(membership.role || '');
  const canViewAllClients =
    role === 'platform_admin' ||
    role === 'tenant_owner' ||
    permBool(perms.canViewAllClients);
  const assignedPartnerIds = Array.isArray(perms.assignedPartnerIds)
    ? perms.assignedPartnerIds.map((x) => String(x))
    : [];
  const canSendPartnerInvites =
    canViewAllClients ||
    role === 'platform_admin' ||
    role === 'tenant_owner' ||
    permBool(perms.canSendPartnerInvites) ||
    (role === 'agent' && assignedPartnerIds.length > 0);

  return {
    isFullAdmin: role === 'platform_admin' || role === 'tenant_owner',
    membershipRole: role,
    canViewAllClients,
    canSendPartnerInvites,
    assignedPartnerIds,
  };
}

export function canStaffAccessPartner(actor: StaffActor, partnerId: string): boolean {
  if (actor.isFullAdmin || actor.canViewAllClients) return true;
  if (actor.membershipRole === 'agent') {
    return actor.assignedPartnerIds.includes(partnerId);
  }
  if (actor.canSendPartnerInvites) return true;
  return false;
}

export async function requireStaffActor(ctx: GuardContext): Promise<StaffActor> {
  const actor = await resolveStaffActor(ctx);
  if (!actor) throw new Error('Forbidden');
  return actor;
}

/** Staff may send partner comms only when they can access that partner file. */
export async function requireStaffCommsActor(
  ctx: GuardContext,
  args: { partnerId: string },
): Promise<StaffActor> {
  const partnerId = String(args.partnerId || '').trim();
  if (!partnerId) throw new Error('Missing partnerId');
  const actor = await requireStaffActor(ctx);
  if (!actor.canSendPartnerInvites) throw new Error('Forbidden');
  if (!canStaffAccessPartner(actor, partnerId)) throw new Error('Forbidden');
  return actor;
}
