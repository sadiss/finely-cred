import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Handshake, Plus, Search, ShieldAlert, Stamp, Store, XCircle } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
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

function fmtUsd(cents?: number) {
  if (!cents || cents <= 0) return '—';
  return `$${(Math.round(cents) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

export default function PartnerBarterPage() {
  const auth = useAuth();
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);
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
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60 text-sm">No partner profile found for this session.</div>
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
        <div className="space-y-6">
        {err && <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-rose-100 text-sm">{err}</div>}

        <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <ShieldAlert size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Compliance note</span>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen((v) => !v)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              <Plus size={14} /> New listing
            </button>
          </div>
          <div className="text-white/60 text-sm">
            This module is for **private exchanges** and record-keeping. It does not provide legal advice and does not claim to force or “fast-track” credit bureau reporting.
          </div>
        </div>

        {createOpen && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-white font-semibold">Create listing</div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              >
                <XCircle size={14} /> Close
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block md:col-span-2">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Title</div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                  placeholder="e.g., Logo + website refresh for accounting support"
                />
              </label>
              <label className="block md:col-span-2">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Description</div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2 w-full min-h-[120px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                  placeholder="Describe what you can provide, what you want, and preferred timeline."
                />
              </label>
              <label className="block">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Offering</div>
                <select
                  value={kindOffered}
                  onChange={(e) => setKindOffered(e.target.value as any)}
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm"
                >
                  <option value="service">Service</option>
                  <option value="item">Item</option>
                  <option value="money">Money</option>
                </select>
              </label>
              <label className="block">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Wanting</div>
                <select
                  value={kindWanted}
                  onChange={(e) => setKindWanted(e.target.value as any)}
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm"
                >
                  <option value="service">Service</option>
                  <option value="item">Item</option>
                  <option value="money">Money</option>
                </select>
              </label>
              <label className="block">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Estimated value (optional)</div>
                <input
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm"
                  placeholder="e.g., 1500"
                />
              </label>
              <label className="block">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Visibility</div>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm"
                >
                  <option value="tenant_only">Tenant only</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Location (optional)</div>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm"
                  placeholder="Remote / City, ST"
                />
              </label>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={createListing}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              >
                <BadgeCheck size={14} /> Publish listing
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-2">
            <Search size={14} className="text-white/30" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="bg-transparent outline-none text-white/80 placeholder:text-white/20 text-sm w-72 max-w-full"
              placeholder="Search listings…"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'market', label: 'Marketplace', icon: Store },
              { id: 'mine', label: 'My listings', icon: Handshake },
              { id: 'offers', label: 'My offers', icon: ArrowRight },
              { id: 'agreements', label: 'Agreements', icon: Stamp },
            ] as const).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                  tab === t.id ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.05]'
                }`}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'market' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {filteredMarket.length === 0 ? (
              <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-black/30 p-8 text-white/60 text-sm">No listings found.</div>
            ) : (
              filteredMarket.slice(0, 40).map((l) => (
                <div key={l.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-white font-semibold truncate">{l.title}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                        offering: {l.kindOffered} • wanting: {l.kindWanted} • value: {fmtUsd(l.estimatedValueCents)} • {l.location ?? '—'}
                      </div>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40">{l.visibility}</div>
                  </div>
                  <div className="text-white/60 text-sm whitespace-pre-wrap">{l.description}</div>

                  {l.createdByPartnerId === partner.id ? (
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/50 text-sm">
                      This is your listing. Switch to <span className="text-white/70">My listings</span> to manage offers.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={offerDraftByListingId[l.id] ?? ''}
                        onChange={(e) => setOfferDraftByListingId((cur) => ({ ...cur, [l.id]: e.target.value }))}
                        className="w-full min-h-[90px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm"
                        placeholder="Write your offer: what you can do/provide, timeline, and any constraints."
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <input
                          value={offerValueByListingId[l.id] ?? ''}
                          onChange={(e) => setOfferValueByListingId((cur) => ({ ...cur, [l.id]: e.target.value }))}
                          className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white/80 text-sm"
                          placeholder="Optional value (e.g. 1200)"
                        />
                        <button
                          type="button"
                          onClick={() => sendOffer(l)}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                        >
                          <Handshake size={14} /> Send offer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'mine' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {myListings.length === 0 ? (
              <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-black/30 p-8 text-white/60 text-sm">No listings yet.</div>
            ) : (
              myListings.slice(0, 40).map((l) => {
                const offers = listBarterOffersByListing(l.id);
                return (
                  <div key={l.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{l.title}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                          status: {l.status} • offers: {offers.length} • {fmtUsd(l.estimatedValueCents)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBarterListingStatus(l.id, l.status === 'active' ? 'paused' : 'active');
                          window.dispatchEvent(new Event('finely:store'));
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      >
                        {l.status === 'active' ? 'Pause' : 'Activate'}
                      </button>
                    </div>
                    {offers.length === 0 ? (
                      <div className="text-white/50 text-sm">No offers yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {offers.slice(0, 8).map((o) => (
                          <div key={o.id} className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-2">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="text-white/80 text-sm font-semibold">{o.fromName ?? o.fromPartnerId}</div>
                              <div className="text-[10px] uppercase tracking-widest text-white/40">{o.status}</div>
                            </div>
                            <div className="text-white/60 text-sm whitespace-pre-wrap">{o.message}</div>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="text-white/40 text-xs">Proposed value: {fmtUsd(o.proposedValueCents)}</div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBarterOfferStatus(o.id, 'rejected');
                                    window.dispatchEvent(new Event('finely:store'));
                                  }}
                                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => acceptOffer(l, o)}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                                >
                                  Accept & create agreement <ArrowRight size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'offers' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {myOffers.length === 0 ? (
              <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-black/30 p-8 text-white/60 text-sm">No offers sent yet.</div>
            ) : (
              myOffers.slice(0, 40).map((o) => {
                const listing = getBarterListing(o.listingId);
                return (
                  <div key={o.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-3">
                    <div className="text-white font-semibold">{listing?.title ?? 'Listing'}</div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{o.status} • {fmtUsd(o.proposedValueCents)}</div>
                    <div className="text-white/60 text-sm whitespace-pre-wrap">{o.message}</div>
                    <div className="flex justify-end">
                      {o.status === 'sent' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setBarterOfferStatus(o.id, 'withdrawn');
                            window.dispatchEvent(new Event('finely:store'));
                          }}
                          className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                        >
                          Withdraw
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'agreements' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {agreements.length === 0 ? (
              <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-black/30 p-8 text-white/60 text-sm">No agreements yet.</div>
            ) : (
              agreements.slice(0, 40).map((a) => {
                const canSign =
                  (partner.id === a.parties.listingOwnerPartnerId && !a.signatures.listingOwner?.signedAt) ||
                  (partner.id === a.parties.counterpartyPartnerId && !a.signatures.counterparty?.signedAt);
                return (
                  <div key={a.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{a.summaryTitle}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                          status: {a.status} • {a.id}
                        </div>
                      </div>
                      <div className="text-white/40 text-xs">{new Date(a.updatedAt).toLocaleString()}</div>
                    </div>
                    <details className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <summary className="cursor-pointer select-none">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">Terms</div>
                          <div className="text-[10px] uppercase tracking-widest text-amber-300/80">Expand</div>
                        </div>
                      </summary>
                      <div className="mt-3 text-white/60 text-sm whitespace-pre-wrap leading-relaxed">{a.termsText}</div>
                    </details>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Listing owner</div>
                        <div className="mt-2 text-white/70 text-sm">{a.signatures.listingOwner?.name ?? a.parties.listingOwnerName ?? '—'}</div>
                        <div className="mt-1 text-white/40 text-xs">{a.signatures.listingOwner?.signedAt ? `signed ${new Date(a.signatures.listingOwner.signedAt).toLocaleString()}` : 'not signed'}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Counterparty</div>
                        <div className="mt-2 text-white/70 text-sm">{a.signatures.counterparty?.name ?? a.parties.counterpartyName ?? '—'}</div>
                        <div className="mt-1 text-white/40 text-xs">{a.signatures.counterparty?.signedAt ? `signed ${new Date(a.signatures.counterparty.signedAt).toLocaleString()}` : 'not signed'}</div>
                      </div>
                    </div>
                    {canSign ? (
                      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 space-y-3">
                        <div className="text-white/80 text-sm font-semibold">Sign agreement</div>
                        <input
                          value={signingAgreementId === a.id ? signName : ''}
                          onChange={(e) => {
                            setSigningAgreementId(a.id);
                            setSignName(e.target.value);
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm"
                          placeholder="Type your name"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSigningAgreementId(a.id);
                            signAgreement();
                          }}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                        >
                          <Stamp size={14} /> Sign
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        )}
        </div>
      </EntitlementGate>
    </PageShell>
  );
}

