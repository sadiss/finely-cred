import type { Partner, PartnerJourneyStage, PartnerLane, PartnerRoute, PartnerRouteIntake, PartnerStatus } from '../domain/partners';
import { nowIso, normalizeEmail, FINELY_TENANT_ID } from '../domain/partners';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export function rowToPartner(row: any): Partner {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    status: row.status || 'active',
    profile: row.profile || { fullName: 'Partner' },
    primaryRoute: row.primary_route || undefined,
    lane: row.lane || undefined,
    journeyStage: row.journey_stage || undefined,
    journeySignals: {},
    importSource: undefined,
    importExternalId: undefined,
    claimedUserId: row.claimed_user_id || undefined,
    routes: {},
    consents: {},
    assignedAgentId: row.assigned_agent_id || undefined,
    notes: undefined,
    financial: undefined,
    denefits: undefined,
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
    assigned_agent_id: p.assignedAgentId ?? null,
    claimed_user_id: p.claimedUserId ?? null,
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

const FUNCTIONS_URL = (() => {
  try {
    const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
    return url ? `${url.replace('/rest/v1', '').replace(/\/+$/, '')}/functions/v1` : null;
  } catch { return null; }
})();

/**
 * Fetch all partners as an admin — uses the admin-list-partners edge function
 * (service_role, bypasses RLS) with a fallback to direct listPartners().
 */
export async function fetchAllPartnersAsAdmin(): Promise<Partner[]> {
  if (FUNCTIONS_URL) {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (token) {
        const res = await fetch(`${FUNCTIONS_URL}/admin-list-partners`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const body = await res.json();
          if (Array.isArray(body.partners)) return body.partners.map(rowToPartner);
        }
      }
    } catch { /* fall through */ }
  }
  return listPartners();
}

/**
 * Get a single partner as admin — uses edge function (service_role, bypasses RLS).
 */
export async function adminGetPartner(id: string): Promise<Partner | null> {
  if (!id?.trim()) return null;
  if (FUNCTIONS_URL) {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (token) {
        const res = await fetch(`${FUNCTIONS_URL}/admin-list-partners?id=${encodeURIComponent(id.trim())}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const body = await res.json();
          if (body.partner) return rowToPartner(body.partner);
        }
        if (res.status === 404) return null;
      }
    } catch { /* fall through */ }
  }
  return getPartner(id);
}

/**
 * Upsert a partner as admin — uses edge function (service_role, bypasses RLS).
 * Throws on failure so callers can surface the real error.
 */
export async function adminUpsertPartner(partner: Partner): Promise<Partner> {
  const next = { ...partner, updatedAt: nowIso() };
  if (!isSupabaseConfigured) return next;
  const row = partnerToRow(next);

  if (FUNCTIONS_URL) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (token) {
      const res = await fetch(`${FUNCTIONS_URL}/admin-list-partners`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ row }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Save failed (${res.status})`);
      if (body.partner) return rowToPartner(body.partner);
      return next;
    }
  }

  // Fallback: direct upsert (RLS applies)
  const { error } = await supabase.from('partners').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(error.message);
  return next;
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
  /** Use service_role edge function (bypasses RLS) — set true for admin creates */
  asAdmin?: boolean;
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
  return args.asAdmin ? adminUpsertPartner(partner) : upsertPartner(partner);
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

/**
 * Delete a partner as admin — uses edge function (service_role, bypasses RLS).
 */
export async function adminDeletePartner(id: string): Promise<boolean> {
  const pid = (id || '').trim();
  if (!pid) return false;
  if (FUNCTIONS_URL) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (token) {
      const res = await fetch(`${FUNCTIONS_URL}/admin-list-partners?id=${encodeURIComponent(pid)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) return true;
      const body = await res.json().catch(() => ({}));
      console.warn('adminDeletePartner error:', body?.error);
      return false;
    }
  }
  return deletePartner(id);
}