import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, FileText, Plus, Search, ShieldCheck, ShieldX, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { createAuSeller, findAuSellerByEmail, listAuSellersByTenant, upsertAuSeller, upsertAuSellerListing } from '../../data/auSellerRepo';
import type { AuSeller, AuSellerListing } from '../../domain/auSeller';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { openUrlInNewTab } from '../../utils/download';

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

export default function AdminAuSellersPage() {
  const navigate = useNavigate();
  const [storeVersion, setStoreVersion] = useState(0);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const selected = useMemo(
    () => (selectedId ? sellers.find((s) => s.id === selectedId) ?? null : sellers[0] ?? null),
    [selectedId, sellers],
  );

  const updateSeller = (patch: Partial<AuSeller>) => {
    if (!selected) return;
    upsertAuSeller({ ...selected, ...patch });
    window.dispatchEvent(new Event('finely:store'));
  };

  const updateListing = (listing: AuSellerListing) => {
    if (!selected) return;
    upsertAuSellerListing({ sellerId: selected.id, listing });
    window.dispatchEvent(new Event('finely:store'));
  };

  const openProof = async (ref?: string) => {
    if (!ref) return;
    const res = await getBlobUrl(ref, {});
    if (!res?.url) return;
    openUrlInNewTab({ url: res.url, revoke: res.revoke, revokeAfterMs: 60_000 });
  };

  return (
    <PageShell
      badge="Admin"
      title="AU Sellers"
      subtitle="Review supply-side sellers, verify status, and approve/reject listings with proof artifacts."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setAddOpen(true); setAddErr(null); setAddEmail(''); setAddFullName(''); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110"
            >
              <Plus size={14} /> Add seller
            </button>
            <div className="inline-flex items-center gap-2 text-white/60">
              <Search size={14} className="text-white/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="bg-transparent outline-none w-72 max-w-full text-white/80 placeholder:text-white/20"
                placeholder="Search sellers…"
              />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
              tenant: {tenantId}
            </div>
          </div>
        </div>

        {addOpen && (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="text-white font-semibold">Add AU seller</div>
              <button type="button" onClick={() => setAddOpen(false)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white">
                <X size={16} />
              </button>
            </div>
            {addErr && <div className="text-amber-100 text-sm">{addErr}</div>}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Email</label>
                <input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="seller@example.com" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Full name</label>
                <input value={addFullName} onChange={(e) => setAddFullName(e.target.value)} placeholder="Optional" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const email = addEmail.trim().toLowerCase();
                if (!email) { setAddErr('Email required'); return; }
                if (findAuSellerByEmail(email)) { setAddErr('Seller with this email already exists'); return; }
                const seller = createAuSeller({ tenantId, email, fullName: addFullName.trim() || undefined });
                setAddOpen(false);
                setSelectedId(seller.id);
                window.dispatchEvent(new Event('finely:store'));
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110"
            >
              <Plus size={14} /> Create seller
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Sellers</div>
            {sellers.length === 0 ? (
              <div className="text-white/50 text-sm">No sellers in this tenant yet.</div>
            ) : (
              <div className="space-y-2">
                {sellers.map((s) => {
                  const active = s.id === selected?.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all ${
                        active
                          ? 'border-[rgba(var(--brand-primary-rgb),0.35)] bg-[rgba(var(--brand-primary-rgb),0.10)]'
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="text-white font-semibold truncate">{s.fullName || s.email}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                        {s.verification.status} • {s.status} • {s.listings.length} listing(s)
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-8 space-y-6">
            {!selected ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/60">Select a seller.</div>
            ) : (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Seller</div>
                      <div className="mt-2 text-white font-semibold">{selected.fullName || '—'}</div>
                      <div className="mt-1 text-white/60 text-sm font-mono">{selected.email}</div>
                      <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        created: {fmtWhen(selected.createdAt)} • contract: {selected.contract.acceptedAt ? 'accepted' : 'not accepted'}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateSeller({
                            verification: { ...selected.verification, status: 'verified', reviewedAt: new Date().toISOString() },
                            status: 'active',
                          })
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                      >
                        <ShieldCheck size={14} /> Verify seller
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateSeller({
                            verification: { ...selected.verification, status: 'rejected', reviewedAt: new Date().toISOString() },
                            status: 'suspended',
                          })
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-200 font-black uppercase tracking-widest text-[10px] hover:bg-rose-500/15 transition-all"
                      >
                        <ShieldX size={14} /> Reject
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Verification</div>
                      <div className="mt-1 text-white font-semibold capitalize">{selected.verification.status.replace(/_/g, ' ')}</div>
                      <div className="mt-1 text-white/50 text-xs">Reviewed: {fmtWhen(selected.verification.reviewedAt)}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <div className="text-[10px] uppercase tracking-widest text-white/40">Payouts</div>
                      <div className="mt-1 text-white font-semibold">{selected.payouts.method}</div>
                      <div className="mt-1 text-white/50 text-xs font-mono truncate">
                        {selected.payouts.displayName || '—'} • {selected.payouts.handleOrAccountLast4 || '—'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-amber-400">
                      <BadgeCheck size={18} />
                      <span className="text-xs font-semibold uppercase tracking-wider">Listings</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/tradelines?focus=au')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-[10px] font-black uppercase tracking-widest text-white/80 transition-all"
                    >
                      View buyer marketplace <ArrowRight size={14} />
                    </button>
                  </div>

                  {selected.listings.length === 0 ? (
                    <div className="text-white/50 text-sm">No listings.</div>
                  ) : (
                    <div className="space-y-3">
                      {selected.listings
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
                                  {fmtPrice(l.priceCents)} • {l.status} • proof:{l.proofBlobRef ? 'yes' : 'no'}
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
                                  <FileText size={14} /> Proof
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateListing({ ...l, status: 'approved' })}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                                >
                                  <ShieldCheck size={14} /> Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateListing({ ...l, status: 'rejected' })}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-200 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/15 transition-all"
                                >
                                  <ShieldX size={14} /> Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

