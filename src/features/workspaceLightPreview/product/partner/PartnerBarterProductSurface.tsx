import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Handshake,
  Plus,
  Search,
  ShieldAlert,
  Stamp,
  Store,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { getPartnerSync } from '../../../../data/partnersRepo';
import { getActiveTenantId } from '../../../../tenancy/activeTenant';
import { EntitlementGate } from '../../../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import type { BarterAgreement, BarterListing, BarterOffer } from '../../../../domain/barter';
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
} from '../../../../data/barterRepo';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import './partnerBarterSurface.css';
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
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_TOOLBAR,
} from '../../../os/finelyOsLightUi';

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

type FloorZone = 'market' | 'mine' | 'offers' | 'agreements';

const FLOOR_ZONES: Array<{
  id: FloorZone;
  label: string;
  hint: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  icon: typeof Store;
}> = [
  { id: 'market', label: 'Trading floor', hint: 'Browse active listings', accent: 'emerald', icon: Store },
  { id: 'mine', label: 'My listings', hint: 'Manage your desk', accent: 'violet', icon: BadgeCheck },
  { id: 'offers', label: 'My offers', hint: 'Sent proposals', accent: 'sky', icon: Handshake },
  { id: 'agreements', label: 'Agreements', hint: 'Signed exchanges', accent: 'rose', icon: Stamp },
];

export default function PartnerBarterProductSurface({
  role,
  pageId,
  partnerId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const { partner: sessionPartner } = usePartnerSession();
  const partner = useMemo(
    () => (partnerId ? getPartnerSync(partnerId) ?? sessionPartner : sessionPartner),
    [partnerId, sessionPartner],
  );
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Store;
  const accent = navItem?.accent ?? 'emerald';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partner;
  const demoSpec = getWorkspaceProductPageSpec('partner', pageId);

  const [version, setVersion] = useState(0);
  const tenantId = useMemo(() => getActiveTenantId(), [version]);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const [zone, setZone] = useState<FloorZone>('market');
  const [q, setQ] = useState('');

  const listings = useMemo(() => (isDemo ? [] : listBarterListingsByTenant(tenantId)), [tenantId, version, isDemo]);
  const myListings = useMemo(
    () => (partner && !isDemo ? listings.filter((l) => l.createdByPartnerId === partner.id) : []),
    [partner?.id, listings, isDemo],
  );
  const myOffers = useMemo(
    () => (partner && !isDemo ? listBarterOffersByPartner(partner.id, tenantId) : []),
    [partner?.id, tenantId, version, isDemo],
  );
  const agreements = useMemo(
    () => (partner && !isDemo ? listBarterAgreementsByPartner(partner.id, tenantId) : []),
    [partner?.id, tenantId, version, isDemo],
  );

  const filteredMarket = useMemo(() => {
    const query = q.trim().toLowerCase();
    const visible = listings.filter(
      (l) => l.status === 'active' && (l.visibility === 'public' || l.visibility === 'tenant_only'),
    );
    if (!query) return visible;
    return visible.filter((l) =>
      `${l.title} ${l.description} ${l.kindOffered} ${l.kindWanted} ${(l.tags || []).join(' ')}`
        .toLowerCase()
        .includes(query),
    );
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

  const demoMarketCount = 6;
  const demoMineCount = 1;
  const demoOffersCount = 2;
  const demoAgreementsCount = 0;

  const metrics: ProductMetric[] = [
    {
      label: 'Market',
      value: isDemo ? demoMarketCount : filteredMarket.length,
      hint: 'Active listings',
      accent: 'emerald',
      icon: Store,
      onClick: () => setZone('market'),
    },
    {
      label: 'Mine',
      value: isDemo ? demoMineCount : myListings.length,
      hint: 'Your listings',
      accent: 'violet',
      icon: BadgeCheck,
      onClick: () => setZone('mine'),
    },
    {
      label: 'Offers',
      value: isDemo ? demoOffersCount : myOffers.length,
      hint: 'Sent',
      accent: 'sky',
      icon: Handshake,
      onClick: () => setZone('offers'),
    },
    {
      label: 'Agreements',
      value: isDemo ? demoAgreementsCount : agreements.length,
      hint: 'Signed',
      accent: 'rose',
      icon: Stamp,
      onClick: () => setZone('agreements'),
    },
  ];

  const zoneBadges: Record<FloorZone, number> = {
    market: isDemo ? demoMarketCount : filteredMarket.length,
    mine: isDemo ? demoMineCount : myListings.length,
    offers: isDemo ? demoOffersCount : myOffers.length,
    agreements: isDemo ? demoAgreementsCount : agreements.length,
  };

  const createListing = () => {
    if (!partner) return;
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
    setZone('mine');
  };

  const sendOffer = (listing: BarterListing) => {
    if (!partner) return;
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
    setZone('offers');
  };

  const acceptOffer = (listing: BarterListing, offer: BarterOffer) => {
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
    setZone('agreements');
  };

  const signAgreement = () => {
    if (!partner || !signingAgreementId) return;
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

  const renderMarketMosaic = () => {
    if (isDemo) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[
            { title: 'Logo refresh for bookkeeping', offered: 'design', wanted: 'service', value: '$1,500' },
            { title: 'Social media bundle', offered: 'service', wanted: 'service', value: '$900' },
            { title: 'Office deep clean', offered: 'service', wanted: 'money', value: '$600' },
          ].map((card, idx) => (
            <div
              key={card.title}
              className={`${finelyOsCatalogCard((['emerald', 'violet', 'sky'] as const)[idx % 3])} p-6 lg:p-8 space-y-3 min-h-[220px]`}
              data-fc-accent={(['emerald', 'violet', 'sky'] as const)[idx % 3]}
            >
              <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{card.title}</div>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>
                offering: {card.offered} · wanting: {card.wanted} · {card.value}
              </div>
              <p className={FINELY_OS_ENTITY_BODY}>Demo listing — sign in to send real offers on the trading floor.</p>
            </div>
          ))}
        </div>
      );
    }

    if (filteredMarket.length === 0) {
      return <div className={`${FINELY_OS_LUXURY_EMPTY} text-sm`}>No listings found.</div>;
    }

    return (
      <FinelyOsPaginatedStack
        items={filteredMarket}
        pageSize={9}
        emptyMessage="No listings found."
        itemSpacingClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        renderItem={(l, idx) => (
          <div
            key={l.id}
            className={`${finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])} fc-surface-harmony space-y-4 p-6 lg:p-8 min-h-[280px]`}
            data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4]}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className={`${FINELY_OS_ENTITY_VALUE} text-xl font-extrabold truncate`}>{l.title}</div>
                <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate`}>
                  offering: {l.kindOffered} • wanting: {l.kindWanted} • value: {fmtUsd(l.estimatedValueCents)} •{' '}
                  {l.location ?? '—'}
                </div>
              </div>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>{l.visibility}</div>
            </div>
            <div className={`${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap line-clamp-4`}>{l.description}</div>

            {partner && l.createdByPartnerId === partner.id ? (
              <div className={`${finelyOsCatalogCard('rose')} fc-surface-harmony ${FINELY_OS_ENTITY_BODY}`} data-fc-accent="rose">
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
    );
  };

  const renderMineMosaic = () => {
    if (isDemo) {
      return (
        <div className={`${finelyOsCatalogCard('violet')} p-6 ${FINELY_OS_ENTITY_BODY}`}>
          Demo — publish a listing to see offers arrive on your desk.
        </div>
      );
    }
    if (myListings.length === 0) {
      return <div className={`${FINELY_OS_LUXURY_EMPTY} text-sm`}>No listings yet.</div>;
    }
    return (
      <FinelyOsPaginatedStack
        items={myListings}
        pageSize={6}
        emptyMessage="No listings yet."
        itemSpacingClassName="grid grid-cols-1 lg:grid-cols-2 gap-6"
        renderItem={(l, idx) => {
          const offers = listBarterOffersByListing(l.id);
          return (
            <div
              key={l.id}
              className={`${finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])} fc-surface-harmony space-y-4 p-6 lg:p-8`}
              data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4]}
            >
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
                  renderItem={(o, oIdx) => (
                    <div
                      key={o.id}
                      className={`${finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[oIdx % 4])} fc-surface-harmony space-y-2 p-4`}
                      data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[oIdx % 4]}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{o.fromName ?? o.fromPartnerId}</div>
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>{o.status}</div>
                      </div>
                      <div className={`${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>{o.message}</div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          Proposed value: {fmtUsd(o.proposedValueCents)}
                        </div>
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
    );
  };

  const renderOffersMosaic = () => {
    if (isDemo) {
      return (
        <div className={`${finelyOsCatalogCard('sky')} p-6 ${FINELY_OS_ENTITY_BODY}`}>
          Demo — your sent offers appear here with status and withdraw controls.
        </div>
      );
    }
    if (myOffers.length === 0) {
      return <div className={`${FINELY_OS_LUXURY_EMPTY} text-sm`}>No offers sent yet.</div>;
    }
    return (
      <FinelyOsPaginatedStack
        items={myOffers}
        pageSize={6}
        emptyMessage="No offers sent yet."
        itemSpacingClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        renderItem={(o, idx) => {
          const listing = getBarterListing(o.listingId);
          return (
            <div
              key={o.id}
              className={`${finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])} fc-surface-harmony space-y-3 p-6 lg:p-8`}
              data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4]}
            >
              <div className={FINELY_OS_ENTITY_VALUE}>{listing?.title ?? 'Listing'}</div>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                {o.status} • {fmtUsd(o.proposedValueCents)}
              </div>
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
    );
  };

  const renderAgreementsMosaic = () => {
    if (isDemo) {
      return (
        <div className={`${finelyOsCatalogCard('rose')} p-6 ${FINELY_OS_ENTITY_BODY}`}>
          Demo — signed exchanges show terms and both party signatures here.
        </div>
      );
    }
    if (agreements.length === 0) {
      return <div className={`${FINELY_OS_LUXURY_EMPTY} text-sm`}>No agreements yet.</div>;
    }
    if (!partner) return null;
    return (
      <FinelyOsPaginatedStack
        items={agreements}
        pageSize={6}
        emptyMessage="No agreements yet."
        itemSpacingClassName="grid grid-cols-1 lg:grid-cols-2 gap-6"
        renderItem={(a, idx) => {
          const canSign =
            (partner.id === a.parties.listingOwnerPartnerId && !a.signatures.listingOwner?.signedAt) ||
            (partner.id === a.parties.counterpartyPartnerId && !a.signatures.counterparty?.signedAt);
          return (
            <div
              key={a.id}
              className={`${finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])} fc-surface-harmony space-y-3 p-6 lg:p-8`}
              data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4]}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{a.summaryTitle}</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate`}>
                    status: {a.status} • {a.id}
                  </div>
                </div>
                <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>{new Date(a.updatedAt).toLocaleString()}</div>
              </div>
              <details className={`${finelyOsCatalogCard('violet')} fc-surface-harmony p-4`} data-fc-accent="violet">
                <summary className="cursor-pointer select-none">
                  <div className="flex items-center justify-between gap-3">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Terms</div>
                    <div className="text-[10px] uppercase tracking-widest text-violet-300">Expand</div>
                  </div>
                </summary>
                <div className={`mt-3 ${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap leading-relaxed`}>{a.termsText}</div>
              </details>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className={`${finelyOsCatalogCard('emerald')} fc-surface-harmony p-4`} data-fc-accent="emerald">
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Listing owner</div>
                  <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                    {a.signatures.listingOwner?.name ?? a.parties.listingOwnerName ?? '—'}
                  </div>
                  <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    {a.signatures.listingOwner?.signedAt
                      ? `signed ${new Date(a.signatures.listingOwner.signedAt).toLocaleString()}`
                      : 'not signed'}
                  </div>
                </div>
                <div className={`${finelyOsCatalogCard('rose')} fc-surface-harmony p-4`} data-fc-accent="rose">
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Counterparty</div>
                  <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                    {a.signatures.counterparty?.name ?? a.parties.counterpartyName ?? '—'}
                  </div>
                  <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    {a.signatures.counterparty?.signedAt
                      ? `signed ${new Date(a.signatures.counterparty.signedAt).toLocaleString()}`
                      : 'not signed'}
                  </div>
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
    );
  };

  const activeZone = FLOOR_ZONES.find((z) => z.id === zone) ?? FLOOR_ZONES[0];

  const floorBody = (
    <section className="fc-wlp-section fc-barter-workbench" data-surface-layout="split-workbench">
      {err ? <div className={FINELY_OS_NOTICE_ERROR}>{err}</div> : null}

      <div className={`fc-barter-alert-rail ${finelyOsCatalogCard('rose')} p-6 lg:p-8`} data-fc-accent="rose">
        <div className="inline-flex items-start gap-3 min-w-0">
          <ShieldAlert size={22} className="text-rose-300 shrink-0 mt-0.5" />
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Private exchange record</div>
            <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              This module is for private exchanges and record-keeping. It does not provide legal advice and does not claim
              to force or fast-track credit bureau reporting.
            </p>
          </div>
        </div>
        {!isDemo && partner ? (
          <button type="button" onClick={() => setCreateOpen((v) => !v)} className={FINELY_OS_SUCCESS_BTN}>
            <Plus size={14} /> New listing
          </button>
        ) : null}
      </div>

      {!isDemo && createOpen ? (
        <div className={`${finelyOsCatalogCard('violet')} space-y-4 p-6 lg:p-8`} data-fc-accent="violet">
          <div className="flex items-center justify-between gap-3">
            <div className={`${FINELY_OS_ENTITY_VALUE} text-xl font-extrabold`}>Create listing</div>
            <button type="button" onClick={() => setCreateOpen(false)} className={FINELY_OS_SECONDARY_BTN}>
              <XCircle size={14} /> Close
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block md:col-span-2">
              <div className={formLabel}>Title</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={formInput}
                placeholder="e.g., Logo + website refresh for accounting support"
              />
            </label>
            <label className="block md:col-span-2">
              <div className={formLabel}>Description</div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${formInput} min-h-[120px]`}
                placeholder="Describe what you can provide, what you want, and preferred timeline."
              />
            </label>
            <label className="block">
              <div className={formLabel}>Offering</div>
              <select value={kindOffered} onChange={(e) => setKindOffered(e.target.value as BarterListing['kindOffered'])} className={formSelect}>
                <option value="service">Service</option>
                <option value="item">Item</option>
                <option value="money">Money</option>
              </select>
            </label>
            <label className="block">
              <div className={formLabel}>Wanting</div>
              <select value={kindWanted} onChange={(e) => setKindWanted(e.target.value as BarterListing['kindWanted'])} className={formSelect}>
                <option value="service">Service</option>
                <option value="item">Item</option>
                <option value="money">Money</option>
              </select>
            </label>
            <label className="block">
              <div className={formLabel}>Estimated value (optional)</div>
              <input
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                className={formInput}
                placeholder="e.g., 1500"
              />
            </label>
            <label className="block">
              <div className={formLabel}>Visibility</div>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as BarterListing['visibility'])}
                className={formSelect}
              >
                <option value="tenant_only">Tenant only</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </label>
            <label className="block md:col-span-2">
              <div className={formLabel}>Location (optional)</div>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={formInput}
                placeholder="Remote / City, ST"
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={createListing} className={FINELY_OS_SUCCESS_BTN}>
              <BadgeCheck size={14} /> Publish listing
            </button>
          </div>
        </div>
      ) : null}

      <div className="fc-barter-workbench-grid">
        <aside className="fc-barter-lane-rail" aria-label="Deal lanes">
          {FLOOR_ZONES.map((z) => {
            const Icon = z.icon;
            const active = zone === z.id;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setZone(z.id)}
                className={`fc-barter-lane-tile ${finelyOsCatalogCard(z.accent)}`}
                data-fc-accent={z.accent}
                data-active={active ? 'true' : undefined}
              >
                <div className="fc-barter-lane-tile-head">
                  <Icon size={18} />
                  <span className={`fc-barter-lane-tile-count ${FINELY_OS_ENTITY_VALUE}`}>{zoneBadges[z.id]}</span>
                </div>
                <span className={`fc-barter-lane-tile-label ${FINELY_OS_ENTITY_VALUE}`}>{z.label}</span>
                <span className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{z.hint}</span>
              </button>
            );
          })}
        </aside>

        <div className="fc-barter-inspector">
          <div className="fc-barter-inspector-head">
            <h2 className={`fc-barter-inspector-title ${FINELY_OS_ENTITY_VALUE}`}>{activeZone.label}</h2>
            {zone === 'market' ? (
              <div className={`${FINELY_OS_TOOLBAR} !p-2 flex-1 min-w-[200px] max-w-md`}>
                <Search size={14} className={`${FINELY_OS_ENTITY_SUBLABEL} shrink-0`} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className={`bg-transparent outline-none text-sm w-full min-w-0 ${FINELY_OS_ENTITY_BODY} placeholder:text-[color:var(--fc-os-entity-faint)]`}
                  placeholder="Search listings…"
                  disabled={isDemo}
                />
              </div>
            ) : null}
          </div>
          <div className={`fc-barter-inspector-body ${finelyOsCatalogCard('sky')} p-6 lg:p-8`} data-fc-accent="sky">
            {zone === 'market' ? renderMarketMosaic() : null}
            {zone === 'mine' ? renderMineMosaic() : null}
            {zone === 'offers' ? renderOffersMosaic() : null}
            {zone === 'agreements' ? renderAgreementsMosaic() : null}
          </div>
        </div>
      </div>
    </section>
  );

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow={demoSpec?.eyebrow ?? 'Barter exchange'}
        title={demoSpec?.title ?? 'Trade services to offset the cost of your program.'}
        description={
          demoSpec?.description ??
          'Private exchanges with audit trail — no bureau-reporting claims, no legal advice.'
        }
        status={`${demoMarketCount} listings on the floor · demo data`}
        freshness="demo snapshot"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        metrics={metrics}
        metricTitle="Trading floor"
        metricDescription="Browse the mosaic, send offers, and sign agreements when both parties accept."
        primaryAction={
          <ProductPagePrimaryAction label="Sign in to trade" onClick={() => navigate('/login')} />
        }
      >
        {floorBody}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </ProductHubScaffold>
    );
  }

  if (!partner) {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow="Barter exchange"
        title="Sign in to use the trading floor"
        description="Trade services to offset the cost of your program."
        status="Sign in required"
        freshness="just now"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        primaryAction={<ProductPagePrimaryAction label="Sign in" onClick={() => navigate('/login')} />}
      >
        <ProductEmptyState
          title="No partner profile found"
          description="Sign in with your partner account to browse listings and send offers."
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => navigate('/login')}>
              Sign in
            </button>
          }
        />
      </ProductHubScaffold>
    );
  }

  return (
    <ProductHubScaffold
      role={role}
      eyebrow="Barter exchange"
      title="Listings, offers & agreements"
      description="Private exchanges with audit trail — no bureau-reporting claims, no legal advice."
      status={`${filteredMarket.length} on the floor · live data`}
      freshness="just now"
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      archetype={archetype}
      metrics={metrics}
      metricTitle="Trading floor"
        metricDescription="Pick a deal lane — trading floor, your desk, sent offers, or signed agreements."
      primaryAction={<ProductPagePrimaryAction label="New listing" onClick={() => setCreateOpen(true)} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(mapPortalHref('/portal/dashboard'))}>
          Partner dashboard
        </button>
      }
    >
      <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.barter]}>
        {floorBody}
      </EntitlementGate>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
