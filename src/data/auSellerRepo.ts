import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import type { AuSeller, AuSellerListing } from '../domain/auSeller';
import { nowIso } from '../domain/auSeller';
import { FINELY_TENANT_ID } from '../domain/tenants';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import {
  supabaseCreateAuSeller,
  supabaseFindAuSellerByEmail,
  supabaseListAuSellersByTenant,
  supabaseUpsertAuSeller,
} from './auSellerSupabaseRepo';

const KEY = 'finely.au_sellers.v1';

type Store = { sellers: AuSeller[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { sellers: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function normalizeEmail(email?: string | null) {
  return (email || '').trim().toLowerCase();
}

export function listAuSellers(): AuSeller[] {
  return loadStore().sellers.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listAuSellersByTenantAsync(tenantId: string): Promise<AuSeller[]> {
  if (isSupabaseConfigured) {
    const remote = await supabaseListAuSellersByTenant(tenantId);
    if (remote.length) return remote;
  }
  return listAuSellersByTenant(tenantId);
}

export function listAuSellersByTenant(tenantId: string): AuSeller[] {
  return loadStore()
    .sellers.filter((s) => s.tenantId === tenantId)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getAuSeller(id: string): AuSeller | null {
  return loadStore().sellers.find((s) => s.id === id) ?? null;
}

export function findAuSellerByEmail(email: string): AuSeller | null {
  const e = normalizeEmail(email);
  if (!e) return null;
  return loadStore().sellers.find((s) => normalizeEmail(s.email) === e) ?? null;
}

export async function findAuSellerByEmailAsync(email: string): Promise<AuSeller | null> {
  if (isSupabaseConfigured) {
    const remote = await supabaseFindAuSellerByEmail(email);
    if (remote) return remote;
  }
  return findAuSellerByEmail(email);
}

export function findAuSellerByClaimedUserId(userId: string): AuSeller | null {
  const u = (userId || '').trim();
  if (!u) return null;
  return loadStore().sellers.find((s) => s.claimedUserId === u) ?? null;
}

export function upsertAuSeller(seller: AuSeller): AuSeller {
  const store = loadStore();
  const idx = store.sellers.findIndex((s) => s.id === seller.id);
  const next = { ...seller, updatedAt: nowIso() };
  if (idx >= 0) store.sellers[idx] = next;
  else store.sellers.push(next);
  saveStore(store);
  if (isSupabaseConfigured) {
    void supabaseUpsertAuSeller(next).catch((e) => console.warn('auSeller supabase sync', e));
  }
  return next;
}

export function createAuSeller(args: {
  tenantId?: string;
  email: string;
  fullName?: string;
  claimedUserId?: string;
}): AuSeller {
  const now = nowIso();
  const seller: AuSeller = {
    id: newId('seller'),
    tenantId: args.tenantId ?? FINELY_TENANT_ID,
    email: normalizeEmail(args.email),
    fullName: args.fullName,
    claimedUserId: args.claimedUserId,
    status: 'pending',
    verification: { status: 'unverified' },
    contract: {},
    payouts: { method: 'none' },
    listings: [],
    createdAt: now,
    updatedAt: now,
  };
  return upsertAuSeller(seller);
}

export async function createAuSellerAsync(args: {
  tenantId?: string;
  email: string;
  fullName?: string;
  claimedUserId?: string;
}): Promise<AuSeller> {
  if (isSupabaseConfigured) {
    try {
      return await supabaseCreateAuSeller(args);
    } catch (e) {
      console.warn('createAuSellerAsync supabase fallback', e);
    }
  }
  return createAuSeller(args);
}

export function updateAuSeller(id: string, patch: Partial<AuSeller>): AuSeller | null {
  const cur = getAuSeller(id);
  if (!cur) return null;
  return upsertAuSeller({ ...cur, ...patch });
}

export function upsertAuSellerListing(args: { sellerId: string; listing: AuSellerListing }): AuSellerListing | null {
  const cur = getAuSeller(args.sellerId);
  if (!cur) return null;
  const idx = cur.listings.findIndex((l) => l.id === args.listing.id);
  const now = nowIso();
  const nextListing: AuSellerListing = { ...args.listing, updatedAt: now };
  const listings = cur.listings.slice();
  if (idx >= 0) listings[idx] = nextListing;
  else listings.push({ ...nextListing, createdAt: now, updatedAt: now });
  upsertAuSeller({ ...cur, listings });
  return nextListing;
}

export function createAuSellerListing(args: {
  sellerId: string;
  bank: string;
  limit: string;
  age: string;
  priceCents: number;
  bureau?: AuSellerListing['bureau'];
  cardType?: AuSellerListing['cardType'];
  utilizationPct?: number;
  statementDate?: string;
  slotsAvailable?: number;
  minScore?: number;
  reportingHistoryMonths?: number;
  openedAt?: string;
  notes?: string;
}): AuSellerListing | null {
  const now = nowIso();
  const listing: AuSellerListing = {
    id: newId('listing'),
    createdAt: now,
    updatedAt: now,
    bank: args.bank,
    limit: args.limit,
    age: args.age,
    priceCents: Math.max(0, Math.round(args.priceCents)),
    bureau: args.bureau,
    cardType: args.cardType,
    utilizationPct: args.utilizationPct != null ? Math.max(0, Math.min(100, Math.round(Number(args.utilizationPct) || 0))) : undefined,
    statementDate: (args.statementDate || '').trim() || undefined,
    slotsAvailable: args.slotsAvailable != null ? Math.max(0, Math.min(25, Math.round(Number(args.slotsAvailable) || 0))) : undefined,
    minScore: args.minScore != null ? Math.max(0, Math.min(900, Math.round(Number(args.minScore) || 0))) : undefined,
    reportingHistoryMonths:
      args.reportingHistoryMonths != null ? Math.max(0, Math.min(240, Math.round(Number(args.reportingHistoryMonths) || 0))) : undefined,
    openedAt: (args.openedAt || '').trim() || undefined,
    notes: args.notes,
    status: 'draft',
  };
  return upsertAuSellerListing({ sellerId: args.sellerId, listing });
}

