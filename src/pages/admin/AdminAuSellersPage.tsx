import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, FileText, Plus, Search, ShieldCheck, ShieldX, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { createAuSeller, findAuSellerByEmail, listAuSellersByTenant, upsertAuSeller, upsertAuSellerListing } from '../../data/auSellerRepo';
import type { AuSeller, AuSellerListing } from '../../domain/auSeller';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { openUrlInNewTab } from '../../utils/download';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
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
  finelyOsListItem,
} from '../../features/os/finelyOsLightUi';

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
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => { setAddOpen(true); setAddErr(null); setAddEmail(''); setAddFullName(''); }}
              className={FINELY_OS_PRIMARY_BTN}
            >
              <Plus size={14} /> Add seller
            </button>
            <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}>
              <Search size={14} className="text-emerald-400 shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className={`bg-transparent outline-none w-72 max-w-full text-sm ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
                placeholder="Search sellers…"
              />
            </div>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
              tenant: {tenantId}
            </div>
          </div>
        </div>

        {addOpen && (
          <div className={`${FINELY_OS_NOTICE_WARN} space-y-4`}>
            <div className="flex items-start justify-between gap-4">
              <div className={FINELY_OS_ENTITY_VALUE}>Add AU seller</div>
              <button type="button" onClick={() => setAddOpen(false)} className={FINELY_OS_SECONDARY_BTN}>
                <X size={16} />
              </button>
            </div>
            {addErr && <div className={FINELY_OS_ENTITY_BODY}>{addErr}</div>}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-1`}>Email</label>
                <input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="seller@example.com" className={FINELY_OS_ENTITY_SELECT} />
              </div>
              <div>
                <label className={`block ${FINELY_OS_ENTITY_LABEL} mb-1`}>Full name</label>
                <input value={addFullName} onChange={(e) => setAddFullName(e.target.value)} placeholder="Optional" className={FINELY_OS_ENTITY_SELECT} />
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
              className={FINELY_OS_PRIMARY_BTN}
            >
              <Plus size={14} /> Create seller
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-4 ${finelyOsCatalogCard('violet')} !p-5 p-4 space-y-3`}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Sellers</div>
            {sellers.length === 0 ? (
              <div className={FINELY_OS_ENTITY_BODY}>No sellers in this tenant yet.</div>
            ) : (
              <div className="space-y-2">
                {sellers.map((s) => {
                  const active = s.id === selected?.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className={finelyOsListItem(active, 'amber')}
                    >
                      <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{s.fullName || s.email}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate normal-case tracking-normal`}>
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
              <div className={`${finelyOsCatalogCard('violet')} !p-5 ${FINELY_OS_ENTITY_BODY}`}>Select a seller.</div>
            ) : (
              <>
                <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Seller</div>
                      <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>{selected.fullName || '—'}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} font-mono`}>{selected.email}</div>
                      <div className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
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
                        className={FINELY_OS_SUCCESS_BTN}
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
                        className={FINELY_OS_DANGER_BTN}
                      >
                        <ShieldX size={14} /> Reject
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Verification</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE} capitalize`}>{selected.verification.status.replace(/_/g, ' ')}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-xs`}>Reviewed: {fmtWhen(selected.verification.reviewedAt)}</div>
                    </div>
                    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Payouts</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{selected.payouts.method}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-xs font-mono truncate`}>
                        {selected.payouts.displayName || '—'} • {selected.payouts.handleOrAccountLast4 || '—'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
                      <BadgeCheck size={18} />
                      <span>Listings</span>
                    </div>
                    <button type="button" onClick={() => navigate('/tradelines?focus=au')} className={FINELY_OS_SECONDARY_BTN}>
                      View buyer marketplace <ArrowRight size={14} />
                    </button>
                  </div>

                  {selected.listings.length === 0 ? (
                    <div className={FINELY_OS_ENTITY_BODY}>No listings.</div>
                  ) : (
                    <div className="space-y-3">
                      {selected.listings
                        .slice()
                        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                        .map((l) => (
                          <div key={l.id} className={`${finelyOsInlineListItem()} p-5 space-y-3`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>
                                  {l.bank} • {l.limit} • {l.age}
                                </div>
                                <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
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
                                <button type="button" onClick={() => updateListing({ ...l, status: 'approved' })} className={FINELY_OS_SUCCESS_BTN}>
                                  <ShieldCheck size={14} /> Approve
                                </button>
                                <button type="button" onClick={() => updateListing({ ...l, status: 'rejected' })} className={FINELY_OS_DANGER_BTN}>
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
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}

