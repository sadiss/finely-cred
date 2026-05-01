import type { Partner, PartnerJourneyStage, PartnerLane, PartnerRoute, PartnerRouteIntake, PartnerStatus } from '../domain/partners';
import { nowIso, normalizeEmail, FINELY_TENANT_ID } from '../domain/partners';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.partners.v1';

type Store = {
  partners: Partner[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { partners: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

/**
 * List all partners (cross-tenant - use for platform admins only)
 */
export function listPartners(): Partner[] {
  return loadStore().partners.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * List partners scoped to a specific tenant
 */
export function listPartnersByTenant(tenantId: string): Partner[] {
  return loadStore()
    .partners.filter((p) => p.tenantId === tenantId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * List partners assigned to a specific agent (within their tenant)
 */
export function listPartnersByAgent(tenantId: string, agentId: string): Partner[] {
  return loadStore()
    .partners.filter((p) => p.tenantId === tenantId && p.assignedAgentId === agentId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getPartner(id: string): Partner | null {
  return loadStore().partners.find((p) => p.id === id) ?? null;
}

/**
 * Get partner with tenant scope check (returns null if partner exists but wrong tenant)
 */
export function getPartnerInTenant(id: string, tenantId: string): Partner | null {
  const partner = loadStore().partners.find((p) => p.id === id);
  if (!partner) return null;
  if (partner.tenantId !== tenantId) return null;
  return partner;
}

export function upsertPartner(partner: Partner): Partner {
  const store = loadStore();
  const idx = store.partners.findIndex((p) => p.id === partner.id);
  const next = { ...partner, updatedAt: nowIso() };
  if (idx >= 0) store.partners[idx] = next;
  else store.partners.push(next);
  saveStore(store);
  return next;
}

export function createPartner(args: {
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
}): Partner {
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

export function findPartnerByEmail(email: string): Partner | null {
  const target = normalizeEmail(email);
  if (!target) return null;
  return loadStore().partners.find((p) => normalizeEmail(p.profile.email) === target) ?? null;
}

export function findPartnerByClaimedUserId(userId: string): Partner | null {
  const id = (userId || '').trim();
  if (!id) return null;
  return loadStore().partners.find((p) => p.claimedUserId === id) ?? null;
}

export function findPartnerByImportExternalId(args: { source: NonNullable<Partner['importSource']>; externalId: string }): Partner | null {
  const ext = (args.externalId || '').trim();
  if (!ext) return null;
  return loadStore().partners.find((p) => p.importSource === args.source && p.importExternalId === ext) ?? null;
}

export function deletePartner(id: string): boolean {
  const pid = (id || '').trim();
  if (!pid) return false;
  const store = loadStore();
  const before = store.partners.length;
  store.partners = store.partners.filter((p) => p.id !== pid);
  const changed = store.partners.length !== before;
  if (changed) saveStore(store);
  return changed;
}