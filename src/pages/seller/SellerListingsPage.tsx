import React, { useMemo, useState } from 'react';
import { ArrowRight, Image as ImageIcon, Plus, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { SellerNav } from '../../components/seller/SellerNav';
import { getOrCreateSellerForSession } from '../../seller/getOrCreateSellerForSession';
import { createAuSellerListing, upsertAuSellerListing, upsertAuSeller } from '../../data/auSellerRepo';
import { getBlobStore } from '../../storage/getBlobStore';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { openUrlInNewTab } from '../../utils/download';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';

const blobStore = getBlobStore();
const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;
const formInput = FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '');
const formSelect = FINELY_OS_ENTITY_SELECT;

function fmtPrice(cents: number) {
  const v = Math.max(0, Math.round(cents));
  return `$${(v / 100).toFixed(2)}`;
}

export default function SellerListingsPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const seller = useMemo(() => getOrCreateSellerForSession({ user: auth.user }), [auth.user]);

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
    } catch (e: any) {
      setUploadErr(e?.message || 'Upload failed.');
    } finally {
      setUploadBusy(false);
    }
  };

  const openProof = async (blobRef?: string) => {
    if (!blobRef) return;
    const res = await getBlobUrl(blobRef, {});
    if (!res?.url) return;
    openUrlInNewTab({ url: res.url, revoke: res.revoke, revokeAfterMs: 60_000 });
  };

  return (
    <PageShell badge="AU Seller" title="Listings" subtitle="Create supply listings and attach proof for admin review.">
      <div className={FINELY_OS_PAGE}>
        <SellerNav />

        {!seller ? (
          <div className={FINELY_OS_ENTITY_EMPTY}>No seller profile found.</div>
        ) : (
          <div className="space-y-6">
            <div className={`space-y-4 ${finelyOsCatalogCard('violet')} !p-5`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>New listing</div>
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
                  <select value={bureau} onChange={(e) => setBureau(e.target.value as any)} className={formSelect}>
                    <option value="all">All</option>
                    <option value="experian">Experian</option>
                    <option value="equifax">Equifax</option>
                    <option value="transunion">TransUnion</option>
                  </select>
                </div>
                <div>
                  <label className={formLabel}>Card type</label>
                  <select value={cardType} onChange={(e) => setCardType(e.target.value as any)} className={formSelect}>
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
                <div className="md:col-span-2">
                  <label className={formLabel}>Notes (optional)</label>
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} className={formInput} placeholder="Posting windows, bureaus, utilization notes…" />
                </div>
              </div>
              <button type="button" onClick={add} className={FINELY_OS_PRIMARY_BTN}>
                <Plus size={14} /> Add listing
              </button>
            </div>

            {uploadErr && <div className={FINELY_OS_NOTICE_ERROR}>{uploadErr}</div>}

            <div className={`space-y-4 ${finelyOsCatalogCard('violet')} !p-5`}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Your inventory</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>Attach proof to submit for verification and approval.</div>
                </div>
                <button type="button" onClick={() => navigate('/seller/contracts')} className={FINELY_OS_SECONDARY_BTN}>
                  Contract <ArrowRight size={14} />
                </button>
              </div>

              {seller.listings.length === 0 ? (
                <div className={FINELY_OS_ENTITY_BODY}>No listings yet.</div>
              ) : (
                <div className="space-y-3">
                  {seller.listings
                    .slice()
                    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                    .map((l) => (
                      <div key={l.id} className={`space-y-3 ${finelyOsInlineListItem()}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>
                              {l.bank} • {l.limit} • {l.age}
                            </div>
                            <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                              {fmtPrice(l.priceCents)} • {l.status}
                            </div>
                            <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-xs`}>
                              {(l.bureau ? `bureau: ${String(l.bureau)}` : null) ?? ''}
                              {l.cardType ? ` • type: ${String(l.cardType)}` : ''}
                              {l.utilizationPct != null ? ` • util: ${l.utilizationPct}%` : ''}
                              {l.slotsAvailable != null ? ` • slots: ${l.slotsAvailable}` : ''}
                            </div>
                            {l.notes ? <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{l.notes}</div> : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => openProof(l.proofBlobRef)} disabled={!l.proofBlobRef} className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-50`}>
                              <ImageIcon size={14} /> Proof
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
                                  if (f) void attachProof(l.id, f);
                                  e.currentTarget.value = '';
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
