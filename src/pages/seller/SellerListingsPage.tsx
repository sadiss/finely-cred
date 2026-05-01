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

const blobStore = getBlobStore();

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
        // Reuse the blob store layout (partners/<partnerId>/...) for seller artifacts in demo mode.
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
      // If they submit any listing, set verification into review.
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
      <SellerNav />

      {!seller ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60">No seller profile found.</div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">New listing</div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider">Bank</label>
                <input value={bank} onChange={(e) => setBank(e.target.value)} className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white text-sm" />
              </div>
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider">Limit</label>
                <input value={limit} onChange={(e) => setLimit(e.target.value)} className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white text-sm" />
              </div>
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider">Age</label>
                <input value={age} onChange={(e) => setAge(e.target.value)} className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white text-sm" />
              </div>
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider">Price (USD)</label>
                <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))} className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white text-sm font-mono" />
              </div>
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider">Bureau</label>
                <select value={bureau} onChange={(e) => setBureau(e.target.value as any)} className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white text-sm">
                  <option value="all">All</option>
                  <option value="experian">Experian</option>
                  <option value="equifax">Equifax</option>
                  <option value="transunion">TransUnion</option>
                </select>
              </div>
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider">Card type</label>
                <select value={cardType} onChange={(e) => setCardType(e.target.value as any)} className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white text-sm">
                  <option value="personal">Personal</option>
                  <option value="business">Business</option>
                  <option value="charge">Charge</option>
                  <option value="store">Store</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider">Utilization %</label>
                <input value={utilizationPct} onChange={(e) => setUtilizationPct(e.target.value.replace(/[^\d]/g, ''))} className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white text-sm font-mono" />
              </div>
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider">Statement date</label>
                <input type="date" value={statementDate} onChange={(e) => setStatementDate(e.target.value)} className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white text-sm" />
              </div>
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider">Slots available</label>
                <input value={slotsAvailable} onChange={(e) => setSlotsAvailable(e.target.value.replace(/[^\d]/g, ''))} className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white text-sm font-mono" />
              </div>
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider">Min score (optional)</label>
                <input value={minScore} onChange={(e) => setMinScore(e.target.value.replace(/[^\d]/g, ''))} className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white text-sm font-mono" />
              </div>
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider">Reporting months</label>
                <input value={reportingHistoryMonths} onChange={(e) => setReportingHistoryMonths(e.target.value.replace(/[^\d]/g, ''))} className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white text-sm font-mono" />
              </div>
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider">Opened (optional)</label>
                <input type="date" value={openedAt} onChange={(e) => setOpenedAt(e.target.value)} className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-white/60 text-xs uppercase tracking-wider">Notes (optional)</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white text-sm" placeholder="Posting windows, bureaus, utilization notes…" />
              </div>
            </div>
            <button
              type="button"
              onClick={add}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[color:var(--brand-primary)] text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              <Plus size={14} /> Add listing
            </button>
          </div>

          {uploadErr && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">{uploadErr}</div>}

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/40">Your inventory</div>
                <div className="mt-1 text-white/70 text-sm">Attach proof to submit for verification and approval.</div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/seller/contracts')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-[10px] font-black uppercase tracking-widest text-white/80 transition-all"
              >
                Contract <ArrowRight size={14} />
              </button>
            </div>

            {seller.listings.length === 0 ? (
              <div className="text-white/50 text-sm">No listings yet.</div>
            ) : (
              <div className="space-y-3">
                {seller.listings
                  .slice()
                  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                  .map((l) => (
                    <div key={l.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">
                            {l.bank} • {l.limit} • {l.age}
                          </div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            {fmtPrice(l.priceCents)} • {l.status}
                          </div>
                          <div className="mt-1 text-white/55 text-xs">
                            {(l.bureau ? `bureau: ${String(l.bureau)}` : null) ?? ''}{l.cardType ? ` • type: ${String(l.cardType)}` : ''}{' '}
                            {l.utilizationPct != null ? ` • util: ${l.utilizationPct}%` : ''}{l.slotsAvailable != null ? ` • slots: ${l.slotsAvailable}` : ''}
                          </div>
                          {l.notes ? <div className="mt-2 text-white/60 text-sm">{l.notes}</div> : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openProof(l.proofBlobRef)}
                            disabled={!l.proofBlobRef}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] text-white/70 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                          >
                            <ImageIcon size={14} /> Proof
                          </button>
                          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all">
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
    </PageShell>
  );
}

