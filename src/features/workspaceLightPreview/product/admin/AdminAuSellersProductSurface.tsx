import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  FileText,
  Plus,
  Search,
  ShieldCheck,
  ShieldX,
  Store,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getActiveTenantId } from '../../../../tenancy/activeTenant';
import {
  createAuSeller,
  findAuSellerByEmail,
  listAuSellersByTenant,
  upsertAuSeller,
  upsertAuSellerListing,
} from '../../../../data/auSellerRepo';
import type { AuSeller, AuSellerListing } from '../../../../domain/auSeller';
import { getBlobUrl } from '../../../../storage/getBlobUrl';
import { openUrlInNewTab } from '../../../../utils/download';
import {
  FINELY_OS_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_DANGER_BTN,
  finelyOsInlineListItem,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import type { ProductMetric } from '../components/ProductUi';
import './adminAuSellersProductSurface.css';

function fmtPrice(cents: number) {
  const v = Math.max(0, Math.round(cents));
  return `$${(v / 100).toFixed(2)}`;
}

function fmtWhen(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

type QueueFilter = 'all' | 'verification' | 'listings';
type Focus =
  | { kind: 'seller'; sellerId: string }
  | { kind: 'listing'; sellerId: string; listingId: string }
  | null;

export default function AdminAuSellersProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'violet';
  const PageIcon = navItem?.icon ?? Store;

  const [storeVersion, setStoreVersion] = useState(0);
  const [q, setQ] = useState('');
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all');
  const [focus, setFocus] = useState<Focus>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addFullName, setAddFullName] = useState('');
  const [addErr, setAddErr] = useState<string | null>(null);
  const tenantId = useMemo(() => getActiveTenantId(), [storeVersion]);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const sellers = useMemo(() => {
    const all = listAuSellersByTenant(tenantId);
    const query = q.trim().toLowerCase();
    if (!query) return all;
    return all.filter((s) => `${s.email} ${s.fullName ?? ''} ${s.id}`.toLowerCase().includes(query));
  }, [q, tenantId, storeVersion]);

  const verificationQueue = useMemo(
    () => sellers.filter((s) => s.verification.status !== 'verified'),
    [sellers],
  );

  const listingQueue = useMemo(
    () =>
      sellers.flatMap((seller) =>
        seller.listings
          .filter((l) => l.status === 'submitted' || l.status === 'draft')
          .map((listing) => ({ seller, listing })),
      ),
    [sellers],
  );

  const selectedSeller = useMemo(() => {
    if (!focus) return sellers[0] ?? null;
    const id = focus.kind === 'seller' ? focus.sellerId : focus.sellerId;
    return sellers.find((s) => s.id === id) ?? null;
  }, [focus, sellers]);

  const selectedListing = useMemo(() => {
    if (focus?.kind !== 'listing' || !selectedSeller) return null;
    return selectedSeller.listings.find((l) => l.id === focus.listingId) ?? null;
  }, [focus, selectedSeller]);

  useEffect(() => {
    if (focus || sellers.length === 0) return;
    if (verificationQueue[0]) {
      setFocus({ kind: 'seller', sellerId: verificationQueue[0].id });
    } else if (listingQueue[0]) {
      setFocus({ kind: 'listing', sellerId: listingQueue[0].seller.id, listingId: listingQueue[0].listing.id });
    } else {
      setFocus({ kind: 'seller', sellerId: sellers[0].id });
    }
  }, [focus, sellers, verificationQueue, listingQueue]);

  const verifiedCount = sellers.filter((s) => s.verification.status === 'verified').length;
  const pendingListings = listingQueue.length;

  const metrics: ProductMetric[] = [
    { label: 'Sellers', value: sellers.length, hint: 'In tenant', accent: 'emerald', icon: Store },
    { label: 'Verified', value: verifiedCount, hint: 'Active supply', accent: 'sky', icon: ShieldCheck },
    {
      label: 'Listings',
      value: sellers.reduce((n, s) => n + s.listings.length, 0),
      hint: 'Total inventory',
      accent: 'violet',
      icon: BadgeCheck,
    },
    {
      label: 'Pending review',
      value: pendingListings,
      hint: pendingListings ? 'Needs approval' : 'Clear',
      accent: 'rose',
      icon: FileText,
    },
  ];

  const updateSeller = (patch: Partial<AuSeller>) => {
    if (!selectedSeller) return;
    upsertAuSeller({ ...selectedSeller, ...patch });
    window.dispatchEvent(new Event('finely:store'));
  };

  const updateListing = (listing: AuSellerListing) => {
    if (!selectedSeller) return;
    upsertAuSellerListing({ sellerId: selectedSeller.id, listing });
    window.dispatchEvent(new Event('finely:store'));
  };

  const openProof = async (ref?: string) => {
    if (!ref) return;
    const res = await getBlobUrl(ref, {});
    if (!res?.url) return;
    openUrlInNewTab({ url: res.url, revoke: res.revoke, revokeAfterMs: 60_000 });
  };

  const openAddSeller = () => {
    setAddOpen(true);
    setAddErr(null);
    setAddEmail('');
    setAddFullName('');
  };

  const showVerificationLane = queueFilter === 'all' || queueFilter === 'verification';
  const showListingsLane = queueFilter === 'all' || queueFilter === 'listings';

  const QUEUE_FILTERS: Array<{ id: QueueFilter; label: string }> = [
    { id: 'all', label: 'All lanes' },
    { id: 'verification', label: 'Verification' },
    { id: 'listings', label: 'Listings' },
  ];

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Authorized user supply"
      title="Review sellers, verify status, and approve listings with proof."
      description="Command deck with verification and listing approval lanes — inspect and act below."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="Supply command deck"
      metricDescription="Pending verification and listing review counts drive the lanes below."
      primaryAction={<ProductPagePrimaryAction label="Add seller" onClick={openAddSeller} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/tradelines?focus=au')}>
          Partner marketplace <ArrowRight size={14} />
        </button>
      }
    >
      <section className={`fc-wlp-section ${FINELY_OS_PAGE} fc-admin-au-command`} data-surface-layout="command-deck">
        <div className="fc-admin-au-command-strip">
          <div className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}>
            <Search size={16} className="text-emerald-500 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className={`bg-transparent outline-none w-72 max-w-full text-base font-bold ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
              placeholder="Search sellers…"
              aria-label="Search sellers"
            />
          </div>
          <div className="fc-admin-au-filter-row" role="group" aria-label="Queue filters">
            {QUEUE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setQueueFilter(filter.id)}
                className="fc-admin-au-filter-chip"
                data-active={queueFilter === filter.id ? 'true' : undefined}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal text-sm`}>
            tenant: {tenantId}
          </div>
        </div>

        <div className="fc-admin-au-alert-rail">
          <button
            type="button"
            className="fc-admin-au-alert-chip"
            data-tone={verificationQueue.length ? 'rose' : 'emerald'}
            onClick={() => {
              setQueueFilter('verification');
              if (verificationQueue[0]) setFocus({ kind: 'seller', sellerId: verificationQueue[0].id });
            }}
          >
            <span>
              <span className="block text-xs font-extrabold uppercase tracking-wide opacity-70">Verification queue</span>
              <span className="block text-2xl font-extrabold mt-1">{verificationQueue.length}</span>
            </span>
            <ShieldCheck size={22} />
          </button>
          <button
            type="button"
            className="fc-admin-au-alert-chip"
            data-tone={pendingListings ? 'sky' : 'emerald'}
            onClick={() => {
              setQueueFilter('listings');
              if (listingQueue[0]) {
                setFocus({
                  kind: 'listing',
                  sellerId: listingQueue[0].seller.id,
                  listingId: listingQueue[0].listing.id,
                });
              }
            }}
          >
            <span>
              <span className="block text-xs font-extrabold uppercase tracking-wide opacity-70">Listing approvals</span>
              <span className="block text-2xl font-extrabold mt-1">{pendingListings}</span>
            </span>
            <BadgeCheck size={22} />
          </button>
          <button
            type="button"
            className="fc-admin-au-alert-chip"
            data-tone="emerald"
            onClick={() => navigate('/tradelines?focus=au')}
          >
            <span>
              <span className="block text-xs font-extrabold uppercase tracking-wide opacity-70">Live marketplace</span>
              <span className="block text-base font-extrabold mt-1">Open shelf</span>
            </span>
            <ArrowRight size={22} />
          </button>
        </div>

        {addOpen ? (
          <div className={`${FINELY_OS_NOTICE_WARN} space-y-4`}>
            <div className="flex items-start justify-between gap-4">
              <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Add AU seller</div>
              <button type="button" onClick={() => setAddOpen(false)} className={FINELY_OS_SECONDARY_BTN}>
                <X size={16} />
              </button>
            </div>
            {addErr ? <div className={FINELY_OS_ENTITY_BODY}>{addErr}</div> : null}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-1`}>Email</label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="seller@example.com"
                  className={FINELY_OS_ENTITY_SELECT}
                />
              </div>
              <div>
                <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-1`}>Full name</label>
                <input
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  placeholder="Optional"
                  className={FINELY_OS_ENTITY_SELECT}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const email = addEmail.trim().toLowerCase();
                if (!email) {
                  setAddErr('Email required');
                  return;
                }
                if (findAuSellerByEmail(email)) {
                  setAddErr('Seller with this email already exists');
                  return;
                }
                const seller = createAuSeller({ tenantId, email, fullName: addFullName.trim() || undefined });
                setAddOpen(false);
                setFocus({ kind: 'seller', sellerId: seller.id });
                window.dispatchEvent(new Event('finely:store'));
              }}
              className={FINELY_OS_PRIMARY_BTN}
            >
              <Plus size={14} /> Create seller
            </button>
          </div>
        ) : null}

        <div className="fc-admin-au-lanes">
          {showVerificationLane ? (
            <div className="fc-admin-au-lane" data-fc-accent="rose">
              <div className="fc-admin-au-lane-head">
                <div className="fc-admin-au-lane-title">Verification lane</div>
                <button type="button" onClick={openAddSeller} className={FINELY_OS_SECONDARY_BTN}>
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="fc-admin-au-lane-scroll">
                {verificationQueue.length === 0 ? (
                  <div className={`${FINELY_OS_ENTITY_BODY} p-4`}>All sellers verified — lane clear.</div>
                ) : (
                  verificationQueue.map((s) => {
                    const active = focus?.kind === 'seller' && focus.sellerId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className="fc-admin-au-lane-card"
                        data-active={active ? 'true' : undefined}
                        onClick={() => setFocus({ kind: 'seller', sellerId: s.id })}
                      >
                        <div className={`text-lg font-extrabold truncate ${FINELY_OS_ENTITY_VALUE}`}>
                          {s.fullName || s.email}
                        </div>
                        <div className={`text-sm font-bold capitalize ${FINELY_OS_ENTITY_BODY}`}>
                          {s.verification.status.replace(/_/g, ' ')}
                        </div>
                        <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
                          {s.listings.length} listing(s)
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : null}

          {showListingsLane ? (
            <div className="fc-admin-au-lane" data-fc-accent="sky">
              <div className="fc-admin-au-lane-head">
                <div className="fc-admin-au-lane-title">Listing approval lane</div>
                <button type="button" onClick={() => navigate('/tradelines?focus=au')} className={FINELY_OS_SECONDARY_BTN}>
                  Marketplace <ArrowRight size={14} />
                </button>
              </div>
              <div className="fc-admin-au-lane-scroll">
                {listingQueue.length === 0 ? (
                  <div className={`${FINELY_OS_ENTITY_BODY} p-4`}>No listings awaiting review.</div>
                ) : (
                  listingQueue.map(({ seller, listing }) => {
                    const active =
                      focus?.kind === 'listing' &&
                      focus.sellerId === seller.id &&
                      focus.listingId === listing.id;
                    return (
                      <button
                        key={`${seller.id}-${listing.id}`}
                        type="button"
                        className="fc-admin-au-lane-card"
                        data-active={active ? 'true' : undefined}
                        onClick={() => setFocus({ kind: 'listing', sellerId: seller.id, listingId: listing.id })}
                      >
                        <div className={`text-lg font-extrabold truncate ${FINELY_OS_ENTITY_VALUE}`}>
                          {listing.bank} • {listing.limit}
                        </div>
                        <div className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                          {fmtPrice(listing.priceCents)} · {listing.status}
                        </div>
                        <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal truncate`}>
                          {seller.fullName || seller.email}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="fc-admin-au-inspector">
          {!selectedSeller ? (
            <div className={FINELY_OS_ENTITY_BODY}>No sellers in this tenant yet. Add one to start review.</div>
          ) : (
            <>
              <div className="fc-admin-au-inspector-head">
                {selectedListing
                  ? `Listing review — ${selectedListing.bank}`
                  : `Seller review — ${selectedSeller.fullName || selectedSeller.email}`}
              </div>

              <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4 mb-6`} data-fc-accent="violet">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Seller file</div>
                    <div className={`mt-2 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                      {selectedSeller.fullName || '—'}
                    </div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} font-mono text-base`}>{selectedSeller.email}</div>
                    <div className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal text-sm`}>
                      created: {fmtWhen(selectedSeller.createdAt)} • contract:{' '}
                      {selectedSeller.contract.acceptedAt ? 'accepted' : 'not accepted'}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateSeller({
                          verification: {
                            ...selectedSeller.verification,
                            status: 'verified',
                            reviewedAt: new Date().toISOString(),
                          },
                          status: 'active',
                        })
                      }
                      className={FINELY_OS_SUCCESS_BTN}
                    >
                      <ShieldCheck size={14} /> Verify seller
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSeller({
                          verification: {
                            ...selectedSeller.verification,
                            status: 'rejected',
                            reviewedAt: new Date().toISOString(),
                          },
                          status: 'suspended',
                        })
                      }
                      className={FINELY_OS_DANGER_BTN}
                    >
                      <ShieldX size={14} /> Reject
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className={`${finelyOsCatalogCard('emerald')} fc-surface-harmony p-5 lg:p-6`} data-fc-accent="emerald">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Verification</div>
                    <div className={`mt-1 text-xl font-extrabold capitalize ${FINELY_OS_ENTITY_VALUE}`}>
                      {selectedSeller.verification.status.replace(/_/g, ' ')}
                    </div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>
                      Reviewed: {fmtWhen(selectedSeller.verification.reviewedAt)}
                    </div>
                  </div>
                  <div className={`${finelyOsCatalogCard('rose')} fc-surface-harmony p-5 lg:p-6`} data-fc-accent="rose">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Payouts</div>
                    <div className={`mt-1 text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                      {selectedSeller.payouts.method}
                    </div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm font-mono truncate`}>
                      {selectedSeller.payouts.displayName || '—'} • {selectedSeller.payouts.handleOrAccountLast4 || '—'}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
                <div className="flex items-center justify-between gap-3">
                  <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    <BadgeCheck size={18} />
                    <span className="text-base font-extrabold">Listings</span>
                  </div>
                  <button type="button" onClick={() => navigate('/tradelines?focus=au')} className={FINELY_OS_SECONDARY_BTN}>
                    Partner marketplace <ArrowRight size={14} />
                  </button>
                </div>

                {selectedSeller.listings.length === 0 ? (
                  <div className={FINELY_OS_ENTITY_BODY}>No listings.</div>
                ) : (
                  <div className="space-y-3">
                    {selectedSeller.listings
                      .slice()
                      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                      .map((l) => {
                        const highlighted = selectedListing?.id === l.id;
                        return (
                          <div
                            key={l.id}
                            className={`${finelyOsInlineListItem()} p-5 lg:p-6 space-y-3`}
                            data-active={highlighted ? 'true' : undefined}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className={`text-lg font-extrabold truncate ${FINELY_OS_ENTITY_VALUE}`}>
                                  {l.bank} • {l.limit} • {l.age}
                                </div>
                                <div
                                  className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal text-sm`}
                                >
                                  {fmtPrice(l.priceCents)} • {l.status} • proof:{l.proofBlobRef ? 'yes' : 'no'}
                                </div>
                                {l.notes ? <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{l.notes}</div> : null}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => openProof(l.proofBlobRef)}
                                  disabled={!l.proofBlobRef}
                                  className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-50`}
                                >
                                  <FileText size={14} /> Proof
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateListing({ ...l, status: 'approved' })}
                                  className={FINELY_OS_SUCCESS_BTN}
                                >
                                  <ShieldCheck size={14} /> Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateListing({ ...l, status: 'rejected' })}
                                  className={FINELY_OS_DANGER_BTN}
                                >
                                  <ShieldX size={14} /> Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </ProductHubScaffold>
  );
}
