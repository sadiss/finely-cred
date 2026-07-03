import type { Partner, PartnerConsents, PartnerJourneyStage, PartnerLane, PartnerRoute, PartnerRouteIntake, PartnerStatus } from '../domain/partners';
import { nowIso, normalizeEmail, FINELY_TENANT_ID } from '../domain/partners';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { loadJson, saveJson } from './localJsonStore';

// -------------------------------------------------------------------
// Local-only fallback store.
// Used ONLY when Supabase is not configured (e.g. local development without
// backend keys), mirroring the localStorage pattern used by letters/evidence.
// This makes the app fully usable for building & testing with no backend.
// When Supabase IS configured (live), none of this runs and behavior is
// unchanged.
// -------------------------------------------------------------------
const LOCAL_PARTNERS_KEY = 'finely.partners.v1';

function loadLocalPartners(): Partner[] {
  return loadJson<{ partners: Partner[] }>(LOCAL_PARTNERS_KEY, { partners: [] }, 1).partners ?? [];
}

function saveLocalPartners(partners: Partner[]) {
  saveJson(LOCAL_PARTNERS_KEY, { partners }, 1);
}

function localUpsertPartner(partner: Partner): Partner {
  const partners = loadLocalPartners();
  const idx = partners.findIndex((p) => p.id === partner.id);
  if (idx >= 0) partners[idx] = partner;
  else partners.unshift(partner);
  saveLocalPartners(partners);
  return partner;
}

function sortByUpdatedDesc(a: Partner, b: Partner): number {
  return String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? ''));
}

export function rowToPartner(row: any): Partner {
  const profile = row.profile || { fullName: 'Partner' };
  const routes = row.routes && typeof row.routes === 'object' ? row.routes : {};
  const p = {
    id: row.id,
    tenantId: row.tenant_id,
    status: row.status || 'active',
    profile,
    primaryRoute: row.primary_route || undefined,
    lane: row.lane || undefined,
    journeyStage: row.journey_stage || undefined,
    journeySignals: row.journey_signals && typeof row.journey_signals === 'object' ? row.journey_signals : {},
    importSource: row.import_source || undefined,
    importExternalId: row.import_external_id || undefined,
    claimedUserId: row.claimed_user_id || undefined,
    claimedAt: row.claimed_at || undefined,
    routes,
    consents: row.consents && typeof row.consents === 'object' ? row.consents : {},
    assignedAgentId: row.assigned_agent_id || undefined,
    notes: row.notes || undefined,
    financial: undefined,
    denefits: undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as Partner;
  if (row.funding_stage) {
    p.fundingStage = row.funding_stage;
    p.journeySignals = { ...p.journeySignals, fundingStage: row.funding_stage };
  }
  if (row.funding_meta && typeof row.funding_meta === 'object') {
    p.journeySignals = { ...p.journeySignals, fundingMeta: row.funding_meta };
  }
  return p;
}

function partnerToRow(p: Partner): any {
  const signals = { ...(p.journeySignals ?? {}) };
  const fundingStage = p.fundingStage ?? (signals.fundingStage as string | undefined) ?? null;
  const fundingMeta = (signals.fundingMeta as Record<string, unknown> | undefined) ?? {};
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
    notes: p.notes ?? null,
    routes: p.routes ?? {},
    consents: p.consents ?? {},
    funding_stage: fundingStage,
    funding_meta: fundingMeta,
    assigned_agent_id: p.assignedAgentId ?? null,
    claimed_user_id: p.claimedUserId ?? null,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

export function listPartnersLocal(): Partner[] {
  return [...loadLocalPartners()].sort(sortByUpdatedDesc);
}

/**
 */
export async function listPartners(): Promise<Partner[]> {
  if (!isSupabaseConfigured) return loadLocalPartners().slice().sort(sortByUpdatedDesc);
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
 * Claim (link) a partner to the current authenticated user via the claim-profile
 * edge function (service_role, bypasses RLS). Needed on LIVE because a direct client
 * update of an unclaimed partner row is blocked by RLS. Returns the claimed partner,
 * or null if it couldn't be claimed (caller can fall back to local behavior).
 */
export async function claimPartnerViaEdge(args: { partnerId?: string }): Promise<Partner | null> {
  if (!isSupabaseConfigured || !FUNCTIONS_URL) return null;
  try {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return null;
    const res = await fetch(`${FUNCTIONS_URL}/claim-profile`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerId: args.partnerId || undefined }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn('claimPartnerViaEdge error:', body?.error || `status ${res.status}`);
      return null;
    }
    return body?.partner ? rowToPartner(body.partner) : null;
  } catch (e: any) {
    console.warn('claimPartnerViaEdge error:', e?.message || String(e));
    return null;
  }
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
  if (!isSupabaseConfigured) return localUpsertPartner(next);
  const row = partnerToRow(next);

  if (FUNCTIONS_URL) {
    let session = await supabase.auth.getSession();
    // Silently refresh if the session token is missing/expired.
    if (!session.data.session) {
      const refreshed = await supabase.auth.refreshSession();
      if (refreshed.data.session) session = { data: { session: refreshed.data.session }, error: null };
    }
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
    // No token — session expired. Surface a clear error rather than silently
    // falling back to a direct upsert that will fail RLS for admin-created rows.
    throw new Error('Your session has expired. Please sign out and sign back in, then try again.');
  }

  // Fallback: only reached when Supabase is configured but no edge functions URL
  // (should not happen in production).
  const { error } = await supabase.from('partners').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(error.message);
  return next;
}

/**
 * List partners scoped to a specific tenant
 */
export async function listPartnersByTenant(tenantId: string): Promise<Partner[]> {
  if (!isSupabaseConfigured) {
    return loadLocalPartners().filter((p) => p.tenantId === tenantId).sort(sortByUpdatedDesc);
  }
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
  if (!isSupabaseConfigured) {
    return loadLocalPartners()
      .filter((p) => p.tenantId === tenantId && p.assignedAgentId === agentId)
      .sort(sortByUpdatedDesc);
  }
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('assigned_agent_id', agentId)
    .order('updated_at', { ascending: false });
  if (error) { console.warn('listPartnersByAgent error:', error.message); return []; }
  return (data ?? []).map(rowToPartner);
}

export function getPartnerSync(id: string): Partner | null {
  if (!id?.trim()) return null;
  if (!isSupabaseConfigured) return loadLocalPartners().find((p) => p.id === id.trim()) ?? null;
  return null;
}

/**
 * Link an invited partner record to the authenticated user (local fallback when edge unavailable).
 */
export async function claimPartnerForUser(args: {
  partnerId: string;
  userId: string;
  email?: string;
}): Promise<Partner | null> {
  const partnerId = args.partnerId?.trim();
  const userId = args.userId?.trim();
  if (!partnerId || !userId) return null;

  const existing = (await getPartner(partnerId)) ?? getPartnerSync(partnerId);
  if (!existing) return null;
  if (existing.claimedUserId && existing.claimedUserId !== userId) {
    throw new Error('This invite was already claimed by another account. Sign in with that account or ask admin to resend.');
  }

  const edgeClaimed = await claimPartnerViaEdge({ partnerId });
  if (edgeClaimed) return edgeClaimed;

  if (!isSupabaseConfigured) {
    const email = normalizeEmail(args.email) || existing.profile.email;
    return upsertPartner({
      ...existing,
      claimedUserId: userId,
      claimedAt: new Date().toISOString(),
      profile: { ...existing.profile, email: email || existing.profile.email },
    });
  }

  return null;
}

export async function getPartner(id: string): Promise<Partner | null> {
  if (!id?.trim()) return null;
  if (!isSupabaseConfigured) return loadLocalPartners().find((p) => p.id === id.trim()) ?? null;
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
  if (!id?.trim()) return null;
  if (!isSupabaseConfigured) {
    return loadLocalPartners().find((p) => p.id === id.trim() && p.tenantId === tenantId) ?? null;
  }
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
  if (!isSupabaseConfigured) return localUpsertPartner(next);
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
  consents?: PartnerConsents;
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
    consents: args.consents ?? {},
    assignedAgentId: args.assignedAgentId,
    createdAt,
    updatedAt: createdAt,
  };
  return args.asAdmin ? adminUpsertPartner(partner) : upsertPartner(partner);
}

export async function findPartnerByEmail(email: string): Promise<Partner | null> {
  const target = normalizeEmail(email);
  if (!target) return null;
  if (!isSupabaseConfigured) {
    return loadLocalPartners().find((p) => normalizeEmail((p.profile as any)?.email) === target) ?? null;
  }
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
  if (!id) return null;
  if (!isSupabaseConfigured) return loadLocalPartners().find((p) => p.claimedUserId === id) ?? null;
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
  if (!ext) return null;
  if (!isSupabaseConfigured) {
    return loadLocalPartners().find((p) => p.importSource === args.source && p.importExternalId === ext) ?? null;
  }
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
  if (!pid) return false;
  if (!isSupabaseConfigured) {
    const partners = loadLocalPartners();
    const next = partners.filter((p) => p.id !== pid);
    if (next.length === partners.length) return false;
    saveLocalPartners(next);
    return true;
  }
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