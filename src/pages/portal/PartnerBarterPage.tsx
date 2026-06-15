import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Handshake, Plus, Search, ShieldAlert, Stamp, Store, XCircle } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import type { BarterAgreement, BarterListing, BarterOffer } from '../../domain/barter';
import {
  createAgreementFromOffer,
  createBarterListing,
  createBarterOffer,
  getBarterAgreement,
  getBarterListing,
  listBarterAgreementsByPartner,
  listBarterListingsByTenant,
  listBarterOffersByListing,
  listBarterOffersByPartner,
  setBarterListingStatus,
  setBarterOfferStatus,
  upsertBarterAgreement,
} from '../../data/barterRepo';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_TOOLBAR,
} from '../../features/os/finelyOsLightUi';

function fmtUsd(cents?: number) {
  if (!cents || cents <= 0) return '—';
  return `$${(Math.round(cents) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;
const formInput = FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '');
const formSelect = FINELY_OS_ENTITY_SELECT;

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

export default function PartnerBarterPage() {
  const { partner } = usePartnerSession();
  const [version, setVersion] = useState(0);
  const tenantId = useMemo(() => getActiveTenantId(), [version]);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const [tab, setTab] = useState<'market' | 'mine' | 'offers' | 'agreements'>('market');
  const [q, setQ] = useState('');

  const listings = useMemo(() => listBarterListingsByTenant(tenantId), [tenantId, version]);
  const myListings = useMemo(() => (partner ? listings.filter((l) => l.createdByPartnerId === partner.id) : []), [partner?.id, listings]);
  const myOffers = useMemo(() => (partner ? listBarterOffersByPartner(partner.id, tenantId) : []), [partner?.id, tenantId, version]);
  const agreements = useMemo(() => (partner ? listBarterAgreementsByPartner(partner.id, tenantId) : []), [partner?.id, tenantId, version]);

  const filteredMarket = useMemo(() => {
    const query = q.trim().toLowerCase();
    const visible = listings.filter((l) => l.status === 'active' && (l.visibility === 'public' || l.visibility === 'tenant_only'));
    if (!query) return visible;
    return visible.filter((l) => `${l.title} ${l.description} ${l.kindOffered} ${l.kindWanted} ${(l.tags || []).join(' ')}`.toLowerCase().includes(query));
  }, [listings, q]);

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [kindOffered, setKindOffered] = useState<BarterListing['kindOffered']>('service');
  const [kindWanted, setKindWanted] = useState<BarterListing['kindWanted']>('service');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [visibility, setVisibility] = useState<BarterListing['visibility']>('tenant_only');
  const [location, setLocation] = useState('Remote');
  const [err, setErr] = useState<string | null>(null);

  const [offerDraftByListingId, setOfferDraftByListingId] = useState<Record<string, string>>({});
  const [offerValueByListingId, setOfferValueByListingId] = useState<Record<string, string>>({});

  const [signingAgreementId, setSigningAgreementId] = useState<string | null>(null);
  const [signName, setSignName] = useState('');

  if (!partner) {
    return (
      <PageShell badge="Partner Portal" title="Barter Exchange" subtitle="Sign in required.">
        <div className={`${FINELY_OS_LUXURY_EMPTY} text-left text-sm`}>No partner profile found for this session.</div>
      </PageShell>
    );
  }

  const createListing = () => {
    setErr(null);
    const t = title.trim();
    const d = description.trim();
    if (!t || !d) {
      setErr('Title and description are required.');
      return;
    }
    const v = Number(String(estimatedValue || '').replace(/[^\d.]/g, ''));
    const cents = Number.isFinite(v) && v > 0 ? Math.round(v * 100) : undefined;
    createBarterListing({
      tenantId,
      createdByPartnerId: partner.id,
      createdByName: partner.profile.fullName,
      partyType: 'business',
      title: t,
      description: d,
      kindOffered,
      kindWanted,
      estimatedValueCents: cents,
      visibility,
      location: location.trim() || undefined,
      tags: [],
    });
    window.dispatchEvent(new Event('finely:store'));
    setTitle('');
    setDescription('');
    setEstimatedValue('');
    setCreateOpen(false);
    setTab('mine');
  };

  const sendOffer = (listing: BarterListing) => {
    setErr(null);
    const msg = (offerDraftByListingId[listing.id] || '').trim();
    if (!msg) {
      setErr('Write a short offer message.');
      return;
    }
    const v = Number(String(offerValueByListingId[listing.id] || '').replace(/[^\d.]/g, ''));
    const cents = Number.isFinite(v) && v > 0 ? Math.round(v * 100) : undefined;
    createBarterOffer({
      tenantId,
      listingId: listing.id,
      fromPartnerId: partner.id,
      fromName: partner.profile.fullName,
      message: msg,
      proposedValueCents: cents,
    });
    setOfferDraftByListingId((cur) => ({ ...cur, [listing.id]: '' }));
    window.dispatchEvent(new Event('finely:store'));
    setTab('offers');
  };

  const acceptOffer = (listing: BarterListing, offer: BarterOffer) => {
    // Close listing, accept offer, create agreement.
    setBarterOfferStatus(offer.id, 'accepted');
    setBarterListingStatus(listing.id, 'closed');
    const termsText =
      `This agreement records a private exchange between two parties inside the Finely Cred platform.\n\n` +
      `Listing: ${listing.title}\nOffered: ${listing.kindOffered}\nWanted: ${listing.kindWanted}\nEstimated value: ${fmtUsd(listing.estimatedValueCents)}\n\n` +
      `Offer message:\n${offer.message}\n\n` +
      `Important: This is an operational record for the parties. It does not claim or guarantee credit bureau reporting, and it is not legal advice.\n`;
    const a = createAgreementFromOffer({
      tenantId,
      listingId: listing.id,
      offerId: offer.id,
      listingOwnerPartnerId: listing.createdByPartnerId,
      counterpartyPartnerId: offer.fromPartnerId,
      summaryTitle: `Exchange: ${listing.title}`,
      termsText,
      listingOwnerName: listing.createdByName,
      counterpartyName: offer.fromName,
    });
    window.dispatchEvent(new Event('finely:store'));
    setSigningAgreementId(a.id);
    setTab('agreements');
  };

  const signAgreement = () => {
    if (!signingAgreementId) return;
    const name = signName.trim();
    if (!name) {
      setErr('Type your name to sign.');
      return;
    }
    setErr(null);
    const cur = getBarterAgreement(signingAgreementId);
    if (!cur) {
      setErr('Agreement not found.');
      return;
    }
    const next: BarterAgreement = clone(cur);
    const now = new Date().toISOString();
    if (partner.id === next.parties.listingOwnerPartnerId) next.signatures.listingOwner = { name, signedAt: now };
    else if (partner.id === next.parties.counterpartyPartnerId) next.signatures.counterparty = { name, signedAt: now };
    next.events = [{ at: now, title: 'Signed', note: name }, ...next.events].slice(0, 120);
    const bothSigned = Boolean(next.signatures.listingOwner?.signedAt) && Boolean(next.signatures.counterparty?.signedAt);
    if (bothSigned) next.status = 'active';
    upsertBarterAgreement(next);
    window.dispatchEvent(new Event('finely:store'));
    setSignName('');
  };

  return (
    <PageShell
      badge="Partner Portal"
      title="Barter Exchange"
      subtitle="Create listings, send offers, and generate simple agreements with an audit trail. (No loopholes / no bureau-reporting claims.)"
    >
      <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.barter]}>
        <div className={FINELY_OS_PAGE}>
        {err && <div className={FINELY_OS_NOTICE_ERROR}>{err}</div>}

        <div className={`${FINELY_OS_NOTICE_WARN} space-y-4`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="inline-flex items-center gap-2 text-fuchsia-300">
              <ShieldAlert size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Compliance note</span>
            </div>
            <button type="button" onClick={() => setCreateOpen((v) => !v)} className={FINELY_OS_SUCCESS_BTN}>
              <Plus size={14} /> New listing
            </button>
          </div>
          <div className={FINELY_OS_ENTITY_BODY}>
            This module is for private exchanges and record-keeping. It does not provide legal advice and does not claim to force or fast-track credit bureau reporting.
          </div>
        </div>

        {createOpen && (
          <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <div className="flex items-center justify-between gap-3">
              <div className={FINELY_OS_ENTITY_VALUE}>Create listing</div>
              <button type="button" onClick={() => setCreateOpen(false)} className={FINELY_OS_SECONDARY_BTN}>
                <XCircle size={14} /> Close
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block md:col-span-2">
                <div className={formLabel}>Title</div>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={formInput} placeholder="e.g., Logo + website refresh for accounting support" />
              </label>
              <label className="block md:col-span-2">
                <div className={formLabel}>Description</div>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${formInput} min-h-[120px]`} placeholder="Describe what you can provide, what you want, and preferred timeline." />
              </label>
              <label className="block">
                <div className={formLabel}>Offering</div>
                <select value={kindOffered} onChange={(e) => setKindOffered(e.target.value as any)} className={formSelect}>
                  <option value="service">Service</option>
                  <option value="item">Item</option>
                  <option value="money">Money</option>
                </select>
              </label>
              <label className="block">
                <div className={formLabel}>Wanting</div>
                <select value={kindWanted} onChange={(e) => setKindWanted(e.target.value as any)} className={formSelect}>
                  <option value="service">Service</option>
                  <option value="item">Item</option>
                  <option value="money">Money</option>
                </select>
              </label>
              <label className="block">
                <div className={formLabel}>Estimated value (optional)</div>
                <input value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} className={formInput} placeholder="e.g., 1500" />
              </label>
              <label className="block">
                <div className={formLabel}>Visibility</div>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value as any)} className={formSelect}>
                  <option value="tenant_only">Tenant only</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <div className={formLabel}>Location (optional)</div>
                <input value={location} onChange={(e) => setLocation(e.target.value)} className={formInput} placeholder="Remote / City, ST" />
              </label>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={createListing} className={FINELY_OS_SUCCESS_BTN}>
                <BadgeCheck size={14} /> Publish listing
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={`${FINELY_OS_TOOLBAR} !p-2`}>
            <Search size={14} className="text-white/45 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="bg-transparent outline-none text-white/85 placeholder:text-white/35 text-sm w-72 max-w-full min-w-0"
              placeholder="Search listings…"
            />
          </div>
        </div>

        <FinelyUnifiedHubLayout
          eyebrow="Barter exchange"
          title="Listings, offers & agreements"
          subtitle="Private exchanges with audit trail — no bureau-reporting claims, no legal advice."
          accent="emerald"
          kpis={[
            { label: 'Market', value: String(filteredMarket.length), hint: 'Active listings', accent: 'emerald' },
            { label: 'Mine', value: String(myListings.length), hint: 'Your listings', accent: 'violet' },
            { label: 'Offers', value: String(myOffers.length), hint: 'Sent', accent: 'amber' },
            { label: 'Agreements', value: String(agreements.length), hint: 'Signed', accent: 'sky' },
          ]}
          tabs={[
            { id: 'market', label: 'Marketplace', badge: filteredMarket.length || undefined },
            { id: 'mine', label: 'My listings', badge: myListings.length || undefined },
            { id: 'offers', label: 'My offers', badge: myOffers.length || undefined },
            { id: 'agreements', label: 'Agreements', badge: agreements.length || undefined },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as typeof tab)}
          primaryAction={{ label: 'New listing', onClick: () => setCreateOpen(true) }}
          secondaryAction={{ label: 'Partner dashboard', onClick: () => window.location.assign('/portal/dashboard') }}
        >

        {tab === 'market' && (
          filteredMarket.length === 0 ? (
            <div className={`${FINELY_OS_LUXURY_EMPTY} text-sm`}>No listings found.</div>
          ) : (
            <FinelyOsPaginatedStack
              items={filteredMarket}
              pageSize={6}
              emptyMessage="No listings found."
              itemSpacingClassName="grid lg:grid-cols-2 gap-6"
              renderItem={(l) => (
                <div key={l.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{l.title}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate`}>
                        offering: {l.kindOffered} • wanting: {l.kindWanted} • value: {fmtUsd(l.estimatedValueCents)} • {l.location ?? '—'}
                      </div>
                    </div>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>{l.visibility}</div>
                  </div>
                  <div className={`${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>{l.description}</div>

                  {l.createdByPartnerId === partner.id ? (
                    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony ${FINELY_OS_ENTITY_BODY}`}>
                      This is your listing. Switch to <span className={FINELY_OS_ENTITY_VALUE}>My listings</span> to manage offers.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={offerDraftByListingId[l.id] ?? ''}
                        onChange={(e) => setOfferDraftByListingId((cur) => ({ ...cur, [l.id]: e.target.value }))}
                        className={`${formInput} min-h-[90px]`}
                        placeholder="Write your offer: what you can do/provide, timeline, and any constraints."
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <input
                          value={offerValueByListingId[l.id] ?? ''}
                          onChange={(e) => setOfferValueByListingId((cur) => ({ ...cur, [l.id]: e.target.value }))}
                          className={formInput}
                          placeholder="Optional value (e.g. 1200)"
                        />
                        <button type="button" onClick={() => sendOffer(l)} className={FINELY_OS_SUCCESS_BTN}>
                          <Handshake size={14} /> Send offer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            />
          )
        )}

        {tab === 'mine' && (
          myListings.length === 0 ? (
            <div className={`${FINELY_OS_LUXURY_EMPTY} text-sm`}>No listings yet.</div>
          ) : (
            <FinelyOsPaginatedStack
              items={myListings}
              pageSize={6}
              emptyMessage="No listings yet."
              itemSpacingClassName="grid lg:grid-cols-2 gap-6"
              renderItem={(l) => {
                const offers = listBarterOffersByListing(l.id);
                return (
                  <div key={l.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{l.title}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate`}>
                          status: {l.status} • offers: {offers.length} • {fmtUsd(l.estimatedValueCents)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBarterListingStatus(l.id, l.status === 'active' ? 'paused' : 'active');
                          window.dispatchEvent(new Event('finely:store'));
                        }}
                        className={FINELY_OS_SECONDARY_BTN}
                      >
                        {l.status === 'active' ? 'Pause' : 'Activate'}
                      </button>
                    </div>
                    {offers.length === 0 ? (
                      <div className={FINELY_OS_ENTITY_BODY}>No offers yet.</div>
                    ) : (
                      <FinelyOsPaginatedStack
                        items={offers}
                        pageSize={4}
                        emptyMessage="No offers yet."
                        itemSpacingClassName="space-y-3"
                        renderItem={(o) => (
                          <div key={o.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{o.fromName ?? o.fromPartnerId}</div>
                              <div className={FINELY_OS_ENTITY_SUBLABEL}>{o.status}</div>
                            </div>
                            <div className={`${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>{o.message}</div>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>Proposed value: {fmtUsd(o.proposedValueCents)}</div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBarterOfferStatus(o.id, 'rejected');
                                    window.dispatchEvent(new Event('finely:store'));
                                  }}
                                  className={FINELY_OS_SECONDARY_BTN}
                                >
                                  Reject
                                </button>
                                <button type="button" onClick={() => acceptOffer(l, o)} className={FINELY_OS_SUCCESS_BTN}>
                                  Accept & create agreement <ArrowRight size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      />
                    )}
                  </div>
                );
              }}
            />
          )
        )}

        {tab === 'offers' && (
          myOffers.length === 0 ? (
            <div className={`${FINELY_OS_LUXURY_EMPTY} text-sm`}>No offers sent yet.</div>
          ) : (
            <FinelyOsPaginatedStack
              items={myOffers}
              pageSize={6}
              emptyMessage="No offers sent yet."
              itemSpacingClassName="grid lg:grid-cols-2 gap-6"
              renderItem={(o) => {
                const listing = getBarterListing(o.listingId);
                return (
                  <div key={o.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                    <div className={FINELY_OS_ENTITY_VALUE}>{listing?.title ?? 'Listing'}</div>
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{o.status} • {fmtUsd(o.proposedValueCents)}</div>
                    <div className={`${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>{o.message}</div>
                    <div className="flex justify-end">
                      {o.status === 'sent' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setBarterOfferStatus(o.id, 'withdrawn');
                            window.dispatchEvent(new Event('finely:store'));
                          }}
                          className={FINELY_OS_SECONDARY_BTN}
                        >
                          Withdraw
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              }}
            />
          )
        )}

        {tab === 'agreements' && (
          agreements.length === 0 ? (
            <div className={`${FINELY_OS_LUXURY_EMPTY} text-sm`}>No agreements yet.</div>
          ) : (
            <FinelyOsPaginatedStack
              items={agreements}
              pageSize={6}
              emptyMessage="No agreements yet."
              itemSpacingClassName="grid lg:grid-cols-2 gap-6"
              renderItem={(a) => {
                const canSign =
                  (partner.id === a.parties.listingOwnerPartnerId && !a.signatures.listingOwner?.signedAt) ||
                  (partner.id === a.parties.counterpartyPartnerId && !a.signatures.counterparty?.signedAt);
                return (
                  <div key={a.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{a.summaryTitle}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate`}>
                          status: {a.status} • {a.id}
                        </div>
                      </div>
                      <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>{new Date(a.updatedAt).toLocaleString()}</div>
                    </div>
                    <details className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                      <summary className="cursor-pointer select-none">
                        <div className="flex items-center justify-between gap-3">
                          <div className={FINELY_OS_ENTITY_SUBLABEL}>Terms</div>
                          <div className="text-[10px] uppercase tracking-widest text-violet-300">Expand</div>
                        </div>
                      </summary>
                      <div className={`mt-3 ${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap leading-relaxed`}>{a.termsText}</div>
                    </details>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>Listing owner</div>
                        <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{a.signatures.listingOwner?.name ?? a.parties.listingOwnerName ?? '—'}</div>
                        <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>{a.signatures.listingOwner?.signedAt ? `signed ${new Date(a.signatures.listingOwner.signedAt).toLocaleString()}` : 'not signed'}</div>
                      </div>
                      <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>Counterparty</div>
                        <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{a.signatures.counterparty?.name ?? a.parties.counterpartyName ?? '—'}</div>
                        <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>{a.signatures.counterparty?.signedAt ? `signed ${new Date(a.signatures.counterparty.signedAt).toLocaleString()}` : 'not signed'}</div>
                      </div>
                    </div>
                    {canSign ? (
                      <div className={`${FINELY_OS_NOTICE_WARN} space-y-3`}>
                        <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>Sign agreement</div>
                        <input
                          value={signingAgreementId === a.id ? signName : ''}
                          onChange={(e) => {
                            setSigningAgreementId(a.id);
                            setSignName(e.target.value);
                          }}
                          className={formInput}
                          placeholder="Type your name"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSigningAgreementId(a.id);
                            signAgreement();
                          }}
                          className={FINELY_OS_SUCCESS_BTN}
                        >
                          <Stamp size={14} /> Sign
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              }}
            />
          )
        )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
        </div>
      </EntitlementGate>
    </PageShell>
  );
}

