import type { AuSeller, AuSellerListing } from '../domain/auSeller';
import { FINELY_TENANT_ID } from '../domain/tenants';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { newId } from '../utils/ids';
import { nowIso } from '../domain/auSeller';

function rowToSeller(row: any, listings: AuSellerListing[] = []): AuSeller {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    fullName: row.full_name ?? undefined,
    phone: row.phone ?? undefined,
    businessName: row.business_name ?? undefined,
    entityType: row.entity_type ?? undefined,
    address1: row.address?.address1,
    address2: row.address?.address2,
    city: row.address?.city,
    state: row.address?.state,
    postalCode: row.address?.postalCode,
    country: row.address?.country,
    referralCode: row.referral_code ?? undefined,
    notes: row.notes ?? undefined,
    claimedUserId: row.claimed_user_id ?? undefined,
    status: row.status,
    verification: row.verification ?? { status: 'unverified' },
    contract: row.contract ?? {},
    payouts: row.payouts ?? { method: 'none' },
    listings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sellerToRow(s: AuSeller): any {
  return {
    id: s.id,
    tenant_id: s.tenantId || FINELY_TENANT_ID,
    email: s.email,
    full_name: s.fullName ?? null,
    phone: s.phone ?? null,
    business_name: s.businessName ?? null,
    entity_type: s.entityType ?? null,
    address: {
      address1: s.address1,
      address2: s.address2,
      city: s.city,
      state: s.state,
      postalCode: s.postalCode,
      country: s.country,
    },
    status: s.status,
    verification: s.verification,
    contract: s.contract,
    payouts: s.payouts,
    referral_code: s.referralCode ?? null,
    notes: s.notes ?? null,
    claimed_user_id: s.claimedUserId ?? null,
    updated_at: s.updatedAt,
    created_at: s.createdAt,
  };
}

function listingToRow(sellerId: string, l: AuSellerListing): any {
  return {
    id: l.id,
    seller_id: sellerId,
    bank: l.bank,
    credit_limit: l.limit,
    age: l.age,
    price_cents: l.priceCents,
    bureau: l.bureau ?? null,
    card_type: l.cardType ?? null,
    utilization_pct: l.utilizationPct ?? null,
    statement_date: l.statementDate ?? null,
    slots_available: l.slotsAvailable ?? null,
    min_score: l.minScore ?? null,
    reporting_history_months: l.reportingHistoryMonths ?? null,
    opened_at: l.openedAt ?? null,
    notes: l.notes ?? null,
    proof_blob_ref: l.proofBlobRef ?? null,
    status: l.status,
    created_at: l.createdAt,
    updated_at: l.updatedAt,
  };
}

function rowToListing(row: any): AuSellerListing {
  return {
    id: row.id,
    bank: row.bank,
    limit: row.credit_limit,
    age: row.age,
    priceCents: row.price_cents,
    bureau: row.bureau ?? undefined,
    cardType: row.card_type ?? undefined,
    utilizationPct: row.utilization_pct ?? undefined,
    statementDate: row.statement_date ?? undefined,
    slotsAvailable: row.slots_available ?? undefined,
    minScore: row.min_score ?? undefined,
    reportingHistoryMonths: row.reporting_history_months ?? undefined,
    openedAt: row.opened_at ?? undefined,
    notes: row.notes ?? undefined,
    proofBlobRef: row.proof_blob_ref ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function supabaseListAuSellersByTenant(tenantId: string): Promise<AuSeller[]> {
  if (!isSupabaseConfigured) return [];
  const { data: sellers, error } = await supabase.from('au_sellers').select('*').eq('tenant_id', tenantId);
  if (error) { console.warn('supabaseListAuSellersByTenant', error.message); return []; }
  const ids = (sellers ?? []).map((s) => s.id);
  if (!ids.length) return [];
  const { data: listings } = await supabase.from('au_seller_listings').select('*').in('seller_id', ids);
  const bySeller = new Map<string, AuSellerListing[]>();
  for (const l of listings ?? []) {
    const arr = bySeller.get(l.seller_id) ?? [];
    arr.push(rowToListing(l));
    bySeller.set(l.seller_id, arr);
  }
  return (sellers ?? []).map((s) => rowToSeller(s, bySeller.get(s.id) ?? []));
}

export async function supabaseUpsertAuSeller(seller: AuSeller): Promise<AuSeller> {
  const row = sellerToRow({ ...seller, updatedAt: nowIso() });
  const { error } = await supabase.from('au_sellers').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(error.message);
  for (const listing of seller.listings) {
    const lr = listingToRow(seller.id, listing);
    await supabase.from('au_seller_listings').upsert(lr, { onConflict: 'id' });
  }
  return seller;
}

export async function supabaseCreateAuSeller(args: {
  tenantId?: string;
  email: string;
  fullName?: string;
  claimedUserId?: string;
}): Promise<AuSeller> {
  const now = nowIso();
  const seller: AuSeller = {
    id: newId('seller'),
    tenantId: args.tenantId ?? FINELY_TENANT_ID,
    email: args.email.trim().toLowerCase(),
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
  return supabaseUpsertAuSeller(seller);
}

export async function supabaseFindAuSellerByEmail(email: string): Promise<AuSeller | null> {
  if (!isSupabaseConfigured) return null;
  const e = email.trim().toLowerCase();
  const { data, error } = await supabase.from('au_sellers').select('*').eq('email', e).maybeSingle();
  if (error || !data) return null;
  const { data: listings } = await supabase.from('au_seller_listings').select('*').eq('seller_id', data.id);
  return rowToSeller(data, (listings ?? []).map(rowToListing));
}

export async function supabaseListApprovedMarketplaceListings(tenantId: string): Promise<Array<AuSellerListing & { sellerId: string; sellerName?: string }>> {
  const sellers = await supabaseListAuSellersByTenant(tenantId);
  const out: Array<AuSellerListing & { sellerId: string; sellerName?: string }> = [];
  for (const s of sellers) {
    if (s.status !== 'active' || s.verification.status !== 'verified') continue;
    for (const l of s.listings) {
      if (l.status === 'approved') out.push({ ...l, sellerId: s.id, sellerName: s.fullName });
    }
  }
  return out;
}
