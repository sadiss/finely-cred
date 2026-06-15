import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import type { PayoutEntry, PayoutRole, PayoutStatus } from '../domain/payoutLedger';
import type { AuSeller } from '../domain/auSeller';
import type { AuBuyerOrder } from '../domain/auBuyerOrders';
import { AU_SELLER } from '../config/auSellerProgram';
import { AF } from '../config/affiliateProgram';

const KEY = 'finely.payout_ledger.v1';

type Store = { entries: PayoutEntry[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { entries: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function nowIso() {
  return new Date().toISOString();
}

export function listPayoutEntriesByOwner(ownerId: string, role?: PayoutRole): PayoutEntry[] {
  return loadStore()
    .entries.filter((e) => e.ownerId === ownerId && (!role || e.role === role))
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertPayoutEntry(entry: PayoutEntry): PayoutEntry {
  const store = loadStore();
  const idx = store.entries.findIndex((e) => e.id === entry.id);
  const next = { ...entry, updatedAt: nowIso() };
  if (idx >= 0) store.entries[idx] = next;
  else store.entries.push(next);
  saveStore(store);
  return next;
}

export function createPayoutEntry(args: {
  role: PayoutRole;
  ownerId: string;
  ownerEmail?: string;
  amountCents: number;
  source: string;
  status?: PayoutStatus;
  referenceId?: string;
  method?: PayoutEntry['method'];
  scheduledFor?: string;
  paidAt?: string;
  notes?: string;
}): PayoutEntry {
  const now = nowIso();
  return upsertPayoutEntry({
    id: newId('payout'),
    role: args.role,
    ownerId: args.ownerId,
    ownerEmail: args.ownerEmail,
    amountCents: Math.max(0, Math.round(args.amountCents)),
    status: args.status ?? 'pending',
    source: args.source,
    referenceId: args.referenceId,
    method: args.method,
    scheduledFor: args.scheduledFor,
    paidAt: args.paidAt,
    notes: args.notes,
    createdAt: now,
    updatedAt: now,
  });
}

/** Seed demo payout history for a seller from approved listings (idempotent per seller). */
export function ensureSellerPayoutSeed(seller: AuSeller): PayoutEntry[] {
  const existing = listPayoutEntriesByOwner(seller.id, 'seller');
  if (existing.length > 0) return existing;

  const approved = seller.listings.filter((l) => l.status === 'approved');
  const entries: PayoutEntry[] = [];
  const platformPct = 100 - AU_SELLER.defaultCommissionPct;

  for (const listing of approved.slice(0, 5)) {
    const gross = listing.priceCents * Math.max(1, listing.slotsAvailable ?? 1);
    const net = Math.round((gross * AU_SELLER.defaultCommissionPct) / 100);
    if (net <= 0) continue;
    entries.push(
      createPayoutEntry({
        role: 'seller',
        ownerId: seller.id,
        ownerEmail: seller.email,
        amountCents: net,
        source: `AU placement • ${listing.bank} ${listing.limit}`,
        referenceId: listing.id,
        status: 'paid',
        method: seller.payouts.method === 'none' ? undefined : seller.payouts.method,
        paidAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        notes: `Seller share ${AU_SELLER.defaultCommissionPct}% (platform ${platformPct}%)`,
      }),
    );
  }

  if (approved.length > 0) {
    const pendingNet = Math.round(
      (approved.reduce((a, l) => a + l.priceCents * Math.max(1, l.slotsAvailable ?? 1), 0) * AU_SELLER.defaultCommissionPct) /
        100 /
        Math.max(1, approved.length),
    );
    if (pendingNet > 0) {
      const nextFriday = new Date();
      nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7));
      entries.push(
        createPayoutEntry({
          role: 'seller',
          ownerId: seller.id,
          ownerEmail: seller.email,
          amountCents: pendingNet,
          source: 'Pending AU fulfillment batch',
          status: 'pending',
          method: seller.payouts.method === 'none' ? undefined : seller.payouts.method,
          scheduledFor: nextFriday.toISOString().slice(0, 10),
        }),
      );
    }
  }

  return entries;
}

/** Seed demo affiliate commission history (idempotent per partner). */
export function ensureAffiliatePayoutSeed(ownerId: string, ownerEmail?: string): PayoutEntry[] {
  const existing = listPayoutEntriesByOwner(ownerId, 'affiliate');
  if (existing.length > 0) return existing;

  const sampleSale = 249900;
  const upfront = Math.round((sampleSale * AF.defaultCommissionPct) / 100);
  const recurring = Math.round((9900 * AF.defaultRecurringCommissionPct) / 100);

  createPayoutEntry({
    role: 'affiliate',
    ownerId,
    ownerEmail,
    amountCents: upfront,
    source: `Package referral • ${AF.defaultCommissionPct}% upfront`,
    status: 'paid',
    paidAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Restore Essentials conversion',
  });

  createPayoutEntry({
    role: 'affiliate',
    ownerId,
    ownerEmail,
    amountCents: recurring,
    source: `Membership recurring • ${AF.defaultRecurringCommissionPct}%`,
    status: 'paid',
    paidAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const nextFriday = new Date();
  nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7));
  createPayoutEntry({
    role: 'affiliate',
    ownerId,
    ownerEmail,
    amountCents: Math.round((199900 * AF.defaultCommissionPct) / 100),
    source: 'Pending package referral',
    status: 'pending',
    scheduledFor: nextFriday.toISOString().slice(0, 10),
  });

  return listPayoutEntriesByOwner(ownerId, 'affiliate');
}

/** Seed demo agent revenue-share disbursements (idempotent per user). */
export function ensureAgentPayoutSeed(ownerId: string, ownerEmail?: string): PayoutEntry[] {
  const existing = listPayoutEntriesByOwner(ownerId, 'agent');
  if (existing.length > 0) return existing;

  const clientFee = 150000;
  const agentShare = Math.round(clientFee * 0.55);
  const platformShare = clientFee - agentShare;

  createPayoutEntry({
    role: 'agent',
    ownerId,
    ownerEmail,
    amountCents: agentShare,
    source: 'Client revenue share • Restore package',
    status: 'paid',
    paidAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    notes: `Agent share on ${formatCents(clientFee)} client fee (platform ${formatCents(platformShare)})`,
  });

  const nextFriday = new Date();
  nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7));
  createPayoutEntry({
    role: 'agent',
    ownerId,
    ownerEmail,
    amountCents: Math.round(99700 * 0.6),
    source: 'Pending client milestone payout',
    status: 'pending',
    scheduledFor: nextFriday.toISOString().slice(0, 10),
  });

  return listPayoutEntriesByOwner(ownerId, 'agent');
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function computeSellerListingEarningsProjection(seller: AuSeller): {
  grossCents: number;
  sellerShareCents: number;
  platformShareCents: number;
  listingCount: number;
  slotCount: number;
} {
  const live = seller.listings.filter((l) => l.status === 'approved' || l.status === 'submitted');
  let grossCents = 0;
  let slotCount = 0;
  for (const l of live) {
    const slots = Math.max(1, l.slotsAvailable ?? 1);
    grossCents += l.priceCents * slots;
    slotCount += slots;
  }
  const sellerShareCents = Math.round((grossCents * AU_SELLER.defaultCommissionPct) / 100);
  return {
    grossCents,
    sellerShareCents,
    platformShareCents: grossCents - sellerShareCents,
    listingCount: live.length,
    slotCount,
  };
}

/** Tier 354 — create pending seller payout when AU buyer order completes (idempotent). */
export function recordSellerPayoutOnAuOrderComplete(order: AuBuyerOrder): PayoutEntry | null {
  if (order.status !== 'completed') return null;
  const sellerId = order.listing?.sellerId?.trim();
  if (!sellerId || order.listing.source !== 'seller') return null;

  const refId = `au_order:${order.id}`;
  const existing = listPayoutEntriesByOwner(sellerId, 'seller').find((e) => e.referenceId === refId);
  if (existing) return existing;

  const gross = Math.max(0, order.listing.priceCents);
  const net = Math.round((gross * AU_SELLER.defaultCommissionPct) / 100);
  if (net <= 0) return null;

  const nextFriday = new Date();
  nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7));

  return createPayoutEntry({
    role: 'seller',
    ownerId: sellerId,
    amountCents: net,
    source: `AU order fulfilled • ${order.listing.bank} ${order.listing.limit}`,
    referenceId: refId,
    status: 'pending',
    scheduledFor: nextFriday.toISOString().slice(0, 10),
    notes: `Buyer order ${order.id} completed`,
  });
}
