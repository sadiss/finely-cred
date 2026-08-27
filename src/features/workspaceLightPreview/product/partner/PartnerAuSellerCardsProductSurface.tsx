import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CircleHelp,
  Image as ImageIcon,
  PlayCircle,
  Plus,
  UploadCloud,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { AU_SELLER } from '../../../../config/auSellerProgram';
import { createAuSellerListing, upsertAuSellerListing, upsertAuSeller } from '../../../../data/auSellerRepo';
import { getBlobStore } from '../../../../storage/getBlobStore';
import { getBlobUrl } from '../../../../storage/getBlobUrl';
import { openUrlInNewTab } from '../../../../utils/download';
import { getOrCreateSellerForSession } from '../../../../seller/getOrCreateSellerForSession';
import type { AuSeller, AuSellerListing } from '../../../../domain/auSeller';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductCardObject, productCardTierAt } from '../components/ProductCardObject';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import { useMappedPartnerNavigate, usePartnerProductPathResolver } from './usePartnerProductNavigation';
import {
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import { SellerWorkstationNav } from './PartnerAuSellerProductSurface';

const blobStore = getBlobStore();
const METRICS_VARIANT = 'inline' as const;
const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;
const formInput = FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '');
const formSelect = FINELY_OS_ENTITY_SELECT;

type ShelfFilter = 'all' | 'approved' | 'submitted' | 'draft';

function fmtPrice(cents: number) {
  const v = Math.max(0, Math.round(cents));
  return `$${(v / 100).toFixed(2)}`;
}

function listingAccent(status: AuSellerListing['status']): 'emerald' | 'violet' | 'sky' | 'rose' {
  if (status === 'approved') return 'emerald';
  if (status === 'submitted') return 'violet';
  if (status === 'draft') return 'sky';
  return 'rose';
}

export default function PartnerAuSellerCardsProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const mappedNavigate = useMappedPartnerNavigate();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Plus;
  const accent = navItem?.accent ?? 'sky';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partnerId;
  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);

  const [version, setVersion] = useState(0);
  const seller = useMemo(() => {
    if (isDemo) return null;
    return getOrCreateSellerForSession({ user: auth.user }) as AuSeller | null;
  }, [auth.user, isDemo, version]);

  const listings = useMemo(() => {
    if (isDemo) {
      return [
        {
          id: 'demo-1',
          bank: 'Chase',
          limit: '$12,000',
          age: '3 Years',
          priceCents: 280000,
          status: 'approved',
          bureau: 'all',
          cardType: 'personal',
          utilizationPct: 7,
          slotsAvailable: 2,
          proofBlobRef: 'demo',
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'demo-2',
          bank: 'Amex',
          limit: '$8,500',
          age: '2 Years',
          priceCents: 220000,
          status: 'submitted',
          bureau: 'experian',
          cardType: 'personal',
          utilizationPct: 12,
          slotsAvailable: 1,
          updatedAt: new Date().toISOString(),
        },
      ] as AuSellerListing[];
    }
    return seller?.listings.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) ?? [];
  }, [isDemo, seller]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = listings.find((l) => l.id === selectedId) ?? listings[0] ?? null;

  useEffect(() => {
    if (listings.length && !selectedId) setSelectedId(listings[0]!.id);
  }, [listings, selectedId]);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const [bank, setBank] = useState('Chase');
  const [limit, setLimit] = useState('$10,000');
  const [age, setAge] = useState('2 Years');
  const [price, setPrice] = useState('2500');
  const [bureau, setBureau] = useState<'all' | 'experian' | 'equifax' | 'transunion'>('all');
  const [cardType, setCardType] = useState<'personal' | 'business' | 'charge' | 'store' | 'other'>('personal');
  const [utilizationPct, setUtilizationPct] = useState('8');
  const [statementDate, setStatementDate] = useState('');
  const [slotsAvailable, setSlotsAvailable] = useState('1');
  const [minScore, setMinScore] = useState('0');
  const [reportingHistoryMonths, setReportingHistoryMonths] = useState('24');
  const [openedAt, setOpenedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [shelfFilter, setShelfFilter] = useState<ShelfFilter>('all');

  const contractsPath = mapPortalHref(AU_SELLER.contractsPath);

  const add = () => {
    if (!seller) return;
    const priceCents = Math.max(0, Math.round(Number(price || 0) * 100));
    createAuSellerListing({
      sellerId: seller.id,
      bank,
      limit,
      age,
      priceCents,
      bureau,
      cardType,
      utilizationPct: utilizationPct.trim() ? Number(utilizationPct) : undefined,
      statementDate: statementDate.trim() || undefined,
      slotsAvailable: slotsAvailable.trim() ? Number(slotsAvailable) : undefined,
      minScore: minScore.trim() ? Number(minScore) : undefined,
      reportingHistoryMonths: reportingHistoryMonths.trim() ? Number(reportingHistoryMonths) : undefined,
      openedAt: openedAt.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    window.dispatchEvent(new Event('finely:store'));
    setNotes('');
  };

  const attachProof = async (listingId: string, file: File) => {
    if (!seller) return;
    setUploadErr(null);
    setUploadBusy(true);
    try {
      const { ref } = await blobStore.put(file, {
        partnerId: seller.id,
        kind: 'seller_proof',
        listingId,
        caption: `AU seller proof (${listingId})`,
      });
      const cur = seller.listings.find((l) => l.id === listingId);
      if (!cur) return;
      upsertAuSellerListing({
        sellerId: seller.id,
        listing: { ...cur, proofBlobRef: ref, status: cur.status === 'draft' ? 'submitted' : cur.status },
      });
      upsertAuSeller({
        ...seller,
        verification:
          seller.verification.status === 'unverified'
            ? { ...seller.verification, status: 'in_review' }
            : seller.verification,
      });
      window.dispatchEvent(new Event('finely:store'));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Upload failed.';
      setUploadErr(message);
    } finally {
      setUploadBusy(false);
    }
  };

  const openProof = async (blobRef?: string) => {
    if (!blobRef || blobRef === 'demo') return;
    const res = await getBlobUrl(blobRef, {});
    if (!res?.url) return;
    openUrlInNewTab({ url: res.url, revoke: res.revoke, revokeAfterMs: 60_000 });
  };

  const liveCount = listings.filter((l) => l.status === 'approved').length;
  const draftCount = listings.filter((l) => l.status === 'draft').length;
  const reviewCount = listings.filter((l) => l.status === 'submitted').length;

  const shelfListings = useMemo(() => {
    if (shelfFilter === 'all') return listings;
    if (shelfFilter === 'approved') return listings.filter((l) => l.status === 'approved');
    if (shelfFilter === 'submitted') return listings.filter((l) => l.status === 'submitted');
    return listings.filter((l) => l.status === 'draft');
  }, [listings, shelfFilter]);

  const shelfFilters: Array<{ id: ShelfFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: listings.length },
    { id: 'approved', label: 'Live', count: liveCount },
    { id: 'submitted', label: 'Review', count: reviewCount },
    { id: 'draft', label: 'Draft', count: draftCount },
  ];

  const metrics: ProductMetric[] = [
    { label: 'Approved', value: liveCount, hint: 'Partner-facing inventory', accent: 'emerald', onClick: () => setSelectedId(listings.find((l) => l.status === 'approved')?.id ?? null) },
    { label: 'In review', value: reviewCount, hint: 'Awaiting admin approval', accent: 'violet', onClick: () => setSelectedId(listings.find((l) => l.status === 'submitted')?.id ?? null) },
    { label: 'Draft', value: draftCount, hint: 'Finish proof to submit', accent: 'sky', onClick: () => setSelectedId(listings.find((l) => l.status === 'draft')?.id ?? null) },
    { label: 'Total cards', value: listings.length, hint: 'Listed on your shelf', accent: 'rose', onClick: () => setSelectedId(listings[0]?.id ?? null) },
  ];

  const askFinelyPrompt = 'How do I attach proof and get a listing approved?';

  if (!isDemo && !auth.user) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Seller cards"
        title="Sign in to manage your listings"
        description="Card inventory and proof artifacts attach to your seller profile after sign-in."
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        primaryAction={<ProductPagePrimaryAction label="Sign in" onClick={() => navigate('/login')} />}
      >
        <ProductEmptyState title="Sign in required" description="Listings need your seller profile." />
      </ProductHubScaffold>
    );
  }

  if (!isDemo && !seller) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Seller cards"
        title="Create your seller profile first"
        description="Onboarding must include the AU seller lane before you can list cards."
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        archetype={archetype}
        primaryAction={<ProductPagePrimaryAction label="Open seller hub" onClick={() => mappedNavigate(mapPortalHref(AU_SELLER.hubPath))} />}
      >
        <ProductEmptyState title="No seller profile" description="Finish AU seller onboarding to add inventory." />
      </ProductHubScaffold>
    );
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow={demoSpec?.eyebrow ?? 'Seller cards'}
      title={demoSpec?.title ?? 'List cards, attach proof, and publish inventory.'}
      description={demoSpec?.description ?? 'Shelf on the left, listing editor in the center, live card preview and proof on the right.'}
      status={`${listings.length} card${listings.length === 1 ? '' : 's'} · ${isDemo ? 'demo data' : 'live data'}`}
      freshness={isDemo ? 'demo snapshot' : 'just now'}
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      archetype={archetype}
      metricsVariant={METRICS_VARIANT}
      metrics={metrics}
      metricTitle="Card inventory"
      metricDescription="Approved, in review, and draft counts — pick a card from the shelf to inspect proof."
      primaryAction={
        <ProductPagePrimaryAction
          label="Add listing"
          onClick={() => {
            if (!isDemo) add();
            else openProductCopilot({ prompt: askFinelyPrompt, contextLabel: 'Seller listings' });
          }}
        />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => mappedNavigate(contractsPath)}>
          Contract <ArrowRight size={14} />
        </button>
      }
    >
      <section className="fc-wlp-section space-y-6" data-surface-layout="compose-studio">
        <SellerWorkstationNav active="listings" mapHref={mapPortalHref} onNavigate={mappedNavigate} />

        {uploadErr ? <div className={FINELY_OS_NOTICE_ERROR}>{uploadErr}</div> : null}

        <div className="fc-wlp-seller-cards-workbench">
          <aside className={`fc-wlp-seller-cards-shelf ${finelyOsCatalogCard('sky')} p-4 lg:p-5`} data-fc-accent="sky">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Card shelf</div>
            <div className="fc-wlp-seller-cards-shelf-filters" role="tablist" aria-label="Inventory filters">
              {shelfFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={shelfFilter === filter.id}
                  className="fc-wlp-seller-cards-shelf-filter"
                  data-active={shelfFilter === filter.id ? 'true' : undefined}
                  data-fcm-accent="sky"
                  onClick={() => setShelfFilter(filter.id)}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
            <div className="fc-wlp-seller-cards-shelf-scroll">
              {shelfListings.length === 0 ? (
                <p className={`p-3 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>No cards in this lane yet.</p>
              ) : (
                shelfListings.map((listing) => {
                  const active = selected?.id === listing.id;
                  return (
                    <button
                      key={listing.id}
                      type="button"
                      className="fc-wlp-seller-cards-shelf-item"
                      data-active={active ? 'true' : undefined}
                      data-fcm-accent={listingAccent(listing.status)}
                      onClick={() => setSelectedId(listing.id)}
                    >
                      <div className={`font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{listing.bank}</div>
                      <div className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                        {listing.limit} · {fmtPrice(listing.priceCents)}
                      </div>
                      <span className={finelyOsStatusChip(listing.status === 'approved' ? 'ok' : listing.status === 'submitted' ? 'warn' : 'warn')}>
                        {listing.status.replace(/_/g, ' ')}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            {!isDemo ? (
              <button type="button" onClick={add} className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center`}>
                <Plus size={14} /> Quick add
              </button>
            ) : null}
          </aside>

          <div className="fc-wlp-seller-cards-canvas min-w-0">
            {isDemo ? (
              <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 ${FINELY_OS_ENTITY_BODY}`}>
                Demo preview — sign in to add listings, attach proof, and publish inventory to partners.
              </div>
            ) : (
              <div className={`space-y-4 ${finelyOsCatalogCard('emerald')} p-6 lg:p-8`} data-fc-accent="emerald">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Listing editor</div>
                <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Add a tradeline to your shelf</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className={formLabel}>Bank</label>
                    <input value={bank} onChange={(e) => setBank(e.target.value)} className={formInput} />
                  </div>
                  <div>
                    <label className={formLabel}>Limit</label>
                    <input value={limit} onChange={(e) => setLimit(e.target.value)} className={formInput} />
                  </div>
                  <div>
                    <label className={formLabel}>Age</label>
                    <input value={age} onChange={(e) => setAge(e.target.value)} className={formInput} />
                  </div>
                  <div>
                    <label className={formLabel}>Price (USD)</label>
                    <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))} className={`${formInput} font-mono`} />
                  </div>
                  <div>
                    <label className={formLabel}>Bureau</label>
                    <select value={bureau} onChange={(e) => setBureau(e.target.value as typeof bureau)} className={formSelect}>
                      <option value="all">All</option>
                      <option value="experian">Experian</option>
                      <option value="equifax">Equifax</option>
                      <option value="transunion">TransUnion</option>
                    </select>
                  </div>
                  <div>
                    <label className={formLabel}>Card type</label>
                    <select value={cardType} onChange={(e) => setCardType(e.target.value as typeof cardType)} className={formSelect}>
                      <option value="personal">Personal</option>
                      <option value="business">Business</option>
                      <option value="charge">Charge</option>
                      <option value="store">Store</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={formLabel}>Utilization %</label>
                    <input value={utilizationPct} onChange={(e) => setUtilizationPct(e.target.value.replace(/[^\d]/g, ''))} className={`${formInput} font-mono`} />
                  </div>
                  <div>
                    <label className={formLabel}>Statement date</label>
                    <input type="date" value={statementDate} onChange={(e) => setStatementDate(e.target.value)} className={formInput} />
                  </div>
                  <div>
                    <label className={formLabel}>Slots available</label>
                    <input value={slotsAvailable} onChange={(e) => setSlotsAvailable(e.target.value.replace(/[^\d]/g, ''))} className={`${formInput} font-mono`} />
                  </div>
                  <div>
                    <label className={formLabel}>Min score (optional)</label>
                    <input value={minScore} onChange={(e) => setMinScore(e.target.value.replace(/[^\d]/g, ''))} className={`${formInput} font-mono`} />
                  </div>
                  <div>
                    <label className={formLabel}>Reporting months</label>
                    <input value={reportingHistoryMonths} onChange={(e) => setReportingHistoryMonths(e.target.value.replace(/[^\d]/g, ''))} className={`${formInput} font-mono`} />
                  </div>
                  <div>
                    <label className={formLabel}>Opened (optional)</label>
                    <input type="date" value={openedAt} onChange={(e) => setOpenedAt(e.target.value)} className={formInput} />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className={formLabel}>Notes (optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className={`${formInput} resize-y min-h-[120px]`}
                      placeholder="Posting windows, bureaus, utilization notes…"
                    />
                  </div>
                </div>
                <button type="button" onClick={add} className={FINELY_OS_PRIMARY_BTN}>
                  <Plus size={14} /> Add listing
                </button>
              </div>
            )}
          </div>

          <aside className="fc-wlp-seller-cards-rail">
            {selected ? (
              <>
                <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
                  <ProductCardObject
                    tier={productCardTierAt(listings.findIndex((l) => l.id === selected.id))}
                    label={selected.bank}
                    sublabel={`${selected.limit} · ${selected.age}`}
                    issuer={selected.cardType ?? 'Tradeline'}
                    status={selected.status}
                    size="md"
                    showChip
                  />
                  <div className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{fmtPrice(selected.priceCents)}</div>
                  <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                    {selected.bureau ? `${String(selected.bureau)} · ` : ''}
                    {selected.slotsAvailable != null ? `${selected.slotsAvailable} slot${selected.slotsAvailable === 1 ? '' : 's'}` : 'Slots —'}
                    {selected.utilizationPct != null ? ` · ${selected.utilizationPct}% util` : ''}
                    {selected.notes ? ` — ${selected.notes}` : ''}
                  </p>
                </div>
                <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-4`} data-fc-accent="rose">
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Proof & verification</div>
                  {!isDemo ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openProof(selected.proofBlobRef)}
                        disabled={!selected.proofBlobRef}
                        className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-50`}
                      >
                        <ImageIcon size={14} /> View proof
                      </button>
                      <label className={`cursor-pointer ${FINELY_OS_SUCCESS_BTN}`}>
                        <UploadCloud size={14} /> {uploadBusy ? 'Uploading…' : 'Upload proof'}
                        <input
                          type="file"
                          className="hidden"
                          disabled={uploadBusy}
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void attachProof(selected.id, f);
                            e.currentTarget.value = '';
                          }}
                        />
                      </label>
                    </div>
                  ) : null}
                  <p className={FINELY_OS_ENTITY_BODY}>
                    Attach proof so Finely can verify age, limit, and ownership before the listing goes live for partners.
                  </p>
                </div>
              </>
            ) : (
              <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 min-h-[280px] flex flex-col justify-center`} data-fc-accent="emerald">
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Card preview</p>
                <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Pick a card from the shelf</h2>
                <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Preview status, price, and proof requirements here.</p>
              </div>
            )}
            <div className={`${finelyOsCatalogCard('sky')} p-6 space-y-3`} data-fc-accent="sky">
              <button type="button" className="fc-wlp-btn-secondary w-full justify-center" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: 'Seller listings' })}>
                <CircleHelp size={14} /> Ask Finely
              </button>
              <button type="button" className="fc-wlp-btn-secondary w-full justify-center" onClick={() => navigate('/resources#presenter-demo')}>
                <PlayCircle size={14} /> Watch how
              </button>
            </div>
          </aside>
        </div>

        {listings.length === 0 && !isDemo ? (
          <ProductEmptyState
            title="No listings yet"
            description="Add your first tradeline in the editor — attach proof so admin can verify and publish to partners."
            action={
              <button type="button" className="fc-wlp-btn-primary" onClick={add}>
                <Plus size={14} /> Add listing
              </button>
            }
          />
        ) : null}
      </section>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
