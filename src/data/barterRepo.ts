import type { BarterAgreement, BarterListing, BarterOffer } from '../domain/barter';
import { nowIso } from '../domain/barter';
import { addAuditEvent } from './auditRepo';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.barter.v1';

type Store = {
  listings: BarterListing[];
  offers: BarterOffer[];
  agreements: BarterAgreement[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { listings: [], offers: [], agreements: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listBarterListingsByTenant(tenantId: string): BarterListing[] {
  const t = (tenantId || '').trim();
  if (!t) return [];
  return loadStore()
    .listings.filter((l) => l.tenantId === t)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listBarterListingsByPartner(partnerId: string, tenantId: string): BarterListing[] {
  const p = (partnerId || '').trim();
  if (!p) return [];
  return listBarterListingsByTenant(tenantId).filter((l) => l.createdByPartnerId === p);
}

export function getBarterListing(id: string): BarterListing | null {
  return loadStore().listings.find((l) => l.id === id) ?? null;
}

export function upsertBarterListing(listing: BarterListing): BarterListing {
  const store = loadStore();
  const idx = store.listings.findIndex((x) => x.id === listing.id);
  const next: BarterListing = { ...listing, updatedAt: nowIso() };
  if (idx >= 0) store.listings[idx] = next;
  else store.listings.push(next);
  saveStore(store);
  return next;
}

export function createBarterListing(args: Omit<BarterListing, 'id' | 'createdAt' | 'updatedAt' | 'status'>): BarterListing {
  const now = nowIso();
  const created: BarterListing = {
    id: newId('barter'),
    status: 'active',
    createdAt: now,
    updatedAt: now,
    ...args,
  };
  upsertBarterListing(created);
  addAuditEvent({
    tenantId: created.tenantId,
    actorType: 'partner',
    partnerId: created.createdByPartnerId,
    action: 'barter.listing_create',
    entityType: 'barter_listing',
    entityId: created.id,
    meta: { title: created.title, visibility: created.visibility, kindOffered: created.kindOffered, kindWanted: created.kindWanted },
  });
  return created;
}

export function setBarterListingStatus(id: string, status: BarterListing['status']): BarterListing | null {
  const cur = getBarterListing(id);
  if (!cur) return null;
  const next = upsertBarterListing({ ...cur, status });
  addAuditEvent({
    tenantId: next.tenantId,
    actorType: 'partner',
    partnerId: next.createdByPartnerId,
    action: 'barter.listing_status',
    entityType: 'barter_listing',
    entityId: id,
    meta: { status },
  });
  return next;
}

export function listBarterOffersByListing(listingId: string): BarterOffer[] {
  const id = (listingId || '').trim();
  if (!id) return [];
  return loadStore()
    .offers.filter((o) => o.listingId === id)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listBarterOffersByPartner(partnerId: string, tenantId: string): BarterOffer[] {
  const p = (partnerId || '').trim();
  if (!p) return [];
  return loadStore()
    .offers.filter((o) => o.tenantId === tenantId && o.fromPartnerId === p)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function upsertBarterOffer(offer: BarterOffer): BarterOffer {
  const store = loadStore();
  const idx = store.offers.findIndex((x) => x.id === offer.id);
  const next: BarterOffer = { ...offer, updatedAt: nowIso() };
  if (idx >= 0) store.offers[idx] = next;
  else store.offers.push(next);
  saveStore(store);
  return next;
}

export function createBarterOffer(args: Omit<BarterOffer, 'id' | 'createdAt' | 'updatedAt' | 'status'>): BarterOffer {
  const now = nowIso();
  const created: BarterOffer = {
    id: newId('barter_offer'),
    status: 'sent',
    createdAt: now,
    updatedAt: now,
    ...args,
  };
  upsertBarterOffer(created);
  addAuditEvent({
    tenantId: created.tenantId,
    actorType: 'partner',
    partnerId: created.fromPartnerId,
    action: 'barter.offer_create',
    entityType: 'barter_offer',
    entityId: created.id,
    meta: { listingId: created.listingId },
  });
  return created;
}

export function setBarterOfferStatus(id: string, status: BarterOffer['status']): BarterOffer | null {
  const store = loadStore();
  const idx = store.offers.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next: BarterOffer = { ...store.offers[idx]!, status, updatedAt: nowIso() };
  store.offers[idx] = next;
  saveStore(store);
  addAuditEvent({
    tenantId: next.tenantId,
    actorType: 'partner',
    partnerId: next.fromPartnerId,
    action: 'barter.offer_status',
    entityType: 'barter_offer',
    entityId: id,
    meta: { status, listingId: next.listingId },
  });
  return next;
}

export function listBarterAgreementsByTenant(tenantId: string): BarterAgreement[] {
  const t = (tenantId || '').trim();
  if (!t) return [];
  return loadStore()
    .agreements.filter((a) => a.tenantId === t)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listBarterAgreementsByPartner(partnerId: string, tenantId: string): BarterAgreement[] {
  const p = (partnerId || '').trim();
  if (!p) return [];
  return listBarterAgreementsByTenant(tenantId).filter(
    (a) => a.parties.listingOwnerPartnerId === p || a.parties.counterpartyPartnerId === p,
  );
}

export function getBarterAgreement(id: string): BarterAgreement | null {
  return loadStore().agreements.find((a) => a.id === id) ?? null;
}

export function upsertBarterAgreement(agreement: BarterAgreement): BarterAgreement {
  const store = loadStore();
  const idx = store.agreements.findIndex((x) => x.id === agreement.id);
  const next: BarterAgreement = { ...agreement, updatedAt: nowIso() };
  if (idx >= 0) store.agreements[idx] = next;
  else store.agreements.push(next);
  saveStore(store);
  return next;
}

export function createAgreementFromOffer(args: { listingId: string; offerId: string; tenantId: string; listingOwnerPartnerId: string; counterpartyPartnerId: string; summaryTitle: string; termsText: string; listingOwnerName?: string; counterpartyName?: string }): BarterAgreement {
  const now = nowIso();
  const agreement: BarterAgreement = {
    id: newId('barter_agreement'),
    tenantId: args.tenantId,
    listingId: args.listingId,
    offerId: args.offerId,
    status: 'pending_signatures',
    summaryTitle: args.summaryTitle,
    termsText: args.termsText,
    parties: {
      listingOwnerPartnerId: args.listingOwnerPartnerId,
      counterpartyPartnerId: args.counterpartyPartnerId,
      listingOwnerName: args.listingOwnerName,
      counterpartyName: args.counterpartyName,
    },
    signatures: {},
    events: [{ at: now, title: 'Agreement created' }],
    createdAt: now,
    updatedAt: now,
  };
  upsertBarterAgreement(agreement);
  addAuditEvent({
    tenantId: agreement.tenantId,
    actorType: 'partner',
    partnerId: args.listingOwnerPartnerId,
    action: 'barter.agreement_create',
    entityType: 'barter_agreement',
    entityId: agreement.id,
    meta: { listingId: args.listingId, offerId: args.offerId, title: agreement.summaryTitle },
  });
  return agreement;
}

