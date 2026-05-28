import type { Partner, PartnerJourneyStage, PartnerLane, PartnerRoute, PartnerRouteIntake, PartnerStatus } from '../domain/partners';
import { nowIso, normalizeEmail, FINELY_TENANT_ID } from '../domain/partners';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

function rowToPartner(row: any): Partner {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    status: row.status || 'active',
    profile: row.profile || { fullName: 'Partner' },
    primaryRoute: row.primary_route || undefined,
    lane: row.lane || undefined,
    journeyStage: row.journey_stage || undefined,
    journeySignals: row.journey_signals || {},
    importSource: row.import_source || undefined,
    importExternalId: row.import_external_id || undefined,
    claimedUserId: row.claimed_user_id || undefined,
    claimedAt: row.claimed_at || undefined,
    routes: row.routes || {},
    consents: row.consents || {},
    assignedAdminId: row.assigned_admin_id || undefined,
    assignedAgentId: row.assigned_agent_id || undefined,
    notes: row.notes || undefined,
    financial: row.financial || undefined,
    denefits: row.denefits || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function partnerToRow(p: Partner): any {
  return {
    id: p.id,
    tenant_id: p.tenantId || FINELY_TENANT_ID,
    status: p.status || 'active',
    profile: p.profile ?? {},
    primary_route: p.primaryRoute ?? null,
    lane: p.lane ?? null,
    journey_stage: p.journeyStage ?? null,
    journey_signals: p.journeySignals ?? {},
    import_source: p.importSource ?? null,
    import_external_id: p.importExternalId ?? null,
    claimed_user_id: p.claimedUserId ?? null,
    claimed_at: p.claimedAt ?? null,
    routes: p.routes ?? {},
    consents: p.consents ?? {},
    assigned_admin_id: (p as any).assignedAdminId ?? null,
    assigned_agent_id: p.assignedAgentId ?? null,
    notes: p.notes ?? null,
    financial: p.financial ?? null,
    denefits: p.denefits ?? null,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

/**
 * List all partners (cross-tenant — platform admins only)
 */
export async function listPartners(): Promise<Partner[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) { console.warn('listPartners error:', error.message); return []; }
  return (data ?? []).map(rowToPartner);
}

/**
 * List partners scoped to a specific tenant
 */
export async function listPartnersByTenant(tenantId: string): Promise<Partner[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });
  if (error) { console.warn('listPartnersByTenant error:', error.message); return []; }
  return (data ?? []).map(rowToPartner);
}

/**
 * List partners assigned to a specific agent (within their tenant)
 */
export async function listPartnersByAgent(tenantId: string, agentId: string): Promise<Partner[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('assigned_agent_id', agentId)
    .order('updated_at', { ascending: false });
  if (error) { console.warn('listPartnersByAgent error:', error.message); return []; }
  return (data ?? []).map(rowToPartner);
}

export async function getPartner(id: string): Promise<Partner | null> {
  if (!isSupabaseConfigured || !id?.trim()) return null;
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('id', id.trim())
    .maybeSingle();
  if (error) { console.warn('getPartner error:', error.message); return null; }
  return data ? rowToPartner(data) : null;
}

/**
 * Get partner with tenant scope check
 */
export async function getPartnerInTenant(id: string, tenantId: string): Promise<Partner | null> {
  if (!isSupabaseConfigured || !id?.trim()) return null;
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('id', id.trim())
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (error) { console.warn('getPartnerInTenant error:', error.message); return null; }
  return data ? rowToPartner(data) : null;
}

export async function upsertPartner(partner: Partner): Promise<Partner> {
  const next = { ...partner, updatedAt: nowIso() };
  if (!isSupabaseConfigured) return next;
  const row = partnerToRow(next);
  const { error } = await supabase.from('partners').upsert(row, { onConflict: 'id' });
  if (error) { console.warn('upsertPartner error:', error.message); }
  return next;
}

export async function createPartner(args: {
  id?: string;
  tenantId?: string;
  status?: PartnerStatus;
  fullName: string;
  email?: string;
  phone?: string;
  primaryRoute?: PartnerRoute;
  lane?: PartnerLane;
  journeyStage?: PartnerJourneyStage;
  journeySignals?: Record<string, any>;
  importSource?: Partner['importSource'];
  importExternalId?: string;
  claimedUserId?: string;
  claimedAt?: string;
  intake?: PartnerRouteIntake;
  assignedAgentId?: string;
}): Promise<Partner> {
  const id =
    args.id ??
    (crypto?.randomUUID ? crypto.randomUUID() : `p_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`);
  const createdAt = nowIso();
  const partner: Partner = {
    id,
    tenantId: args.tenantId ?? FINELY_TENANT_ID,
    status: args.status ?? 'active',
    profile: {
      fullName: args.fullName,
      email: normalizeEmail(args.email),
      phone: args.phone,
    },
    primaryRoute: args.primaryRoute,
    lane: args.lane,
    journeyStage: args.journeyStage,
    journeySignals: args.journeySignals,
    importSource: args.importSource,
    importExternalId: args.importExternalId,
    claimedUserId: args.claimedUserId,
    claimedAt: args.claimedAt,
    routes: args.primaryRoute && args.intake ? { [args.primaryRoute]: args.intake } : {},
    consents: {},
    assignedAgentId: args.assignedAgentId,
    createdAt,
    updatedAt: createdAt,
  };
  return upsertPartner(partner);
}

export async function findPartnerByEmail(email: string): Promise<Partner | null> {
  const target = normalizeEmail(email);
  if (!target || !isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .filter('profile->>email', 'eq', target)
    .maybeSingle();
  if (error) { console.warn('findPartnerByEmail error:', error.message); return null; }
  return data ? rowToPartner(data) : null;
}

export async function findPartnerByClaimedUserId(userId: string): Promise<Partner | null> {
  const id = (userId || '').trim();
  if (!id || !isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('claimed_user_id', id)
    .maybeSingle();
  if (error) { console.warn('findPartnerByClaimedUserId error:', error.message); return null; }
  return data ? rowToPartner(data) : null;
}

export async function findPartnerByImportExternalId(args: {
  source: NonNullable<Partner['importSource']>;
  externalId: string;
}): Promise<Partner | null> {
  const ext = (args.externalId || '').trim();
  if (!ext || !isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('import_source', args.source)
    .eq('import_external_id', ext)
    .maybeSingle();
  if (error) { console.warn('findPartnerByImportExternalId error:', error.message); return null; }
  return data ? rowToPartner(data) : null;
}

export async function deletePartner(id: string): Promise<boolean> {
  const pid = (id || '').trim();
  if (!pid || !isSupabaseConfigured) return false;
  const { error } = await supabase.from('partners').delete().eq('id', pid);
  if (error) { console.warn('deletePartner error:', error.message); return false; }
  return true;
}