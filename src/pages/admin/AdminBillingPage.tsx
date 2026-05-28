import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  BadgeCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { loadJson } from '../../data/localJsonStore';
import { listPartners } from '../../data/partnersRepo';
import type { Partner } from '../../domain/partners';
import { hasEntitlement, revokeEntitlementsByPartnerKey, updateAgreementStatus, grantEntitlement } from '../../data/billingRepo';
import type { Agreement, AgreementStatus, BillingProduct, PriceOption } from '../../domain/billing';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { EmptyState } from '../../components/ui';

type BillingStore = {
  billingAccounts: { id: string; partnerId: string; status: string }[];
  products: BillingProduct[];
  priceOptions: PriceOption[];
  agreements: Agreement[];
  agreementEvents: { id: string; agreementId: string; kind: string; createdAt: string }[];
  entitlements: { id: string; partnerId: string; key: string; status: string }[];
};

export default function AdminBillingPage() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [entPartnerId, setEntPartnerId] = useState<string>('');
  const [denefitsBusy, setDenefitsBusy] = useState(false);
  const [denefitsErr, setDenefitsErr] = useState<string | null>(null);
  const [denefitsEvents, setDenefitsEvents] = useState<any[] | null>(null);

  const billingStore = useMemo(() => {
    return loadJson<BillingStore>(
      'finely.billing.v1',
      {
        billingAccounts: [],
        products: [],
        priceOptions: [],
        agreements: [],
        agreementEvents: [],
        entitlements: [],
      },
      1,
    );
  }, [refreshKey]);

  const [partners, setPartners] = useState<Partner[]>([]);
  useEffect(() => { listPartners().then(setPartners); }, [refreshKey]);
  useEffect(() => {
    if (!entPartnerId && partners[0]?.id) setEntPartnerId(partners[0].id);
  }, [partners, entPartnerId]);

  const getPartnerName = (partnerId: string) => {
    const p = partners.find((x) => x.id === partnerId);
    return p?.profile.fullName ?? partnerId;
  };

  const getProductName = (productId?: string) => {
    if (!productId) return '—';
    const p = billingStore.products.find((x) => x.id === productId);
    return p?.name ?? productId;
  };

  const getPriceLabel = (priceOptionId?: string) => {
    if (!priceOptionId) return '—';
    const p = billingStore.priceOptions.find((x) => x.id === priceOptionId);
    return p ? `$${p.amount} / ${p.interval ?? 'one-time'}` : priceOptionId;
  };

  const getAgreementPriceLabel = (agreement: Agreement) => {
    if (agreement.priceOptionId) return getPriceLabel(agreement.priceOptionId);
    if (agreement.amountCents > 0) return `$${(agreement.amountCents / 100).toLocaleString()} (${agreement.rail})`;
    return '—';
  };

  const handleUpdateStatus = (agreementId: string, status: AgreementStatus) => {
    updateAgreementStatus(agreementId, status);
    setNotice(`Agreement status updated to ${status}`);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleGrantEntitlement = (partnerId: string, agreementId: string) => {
    const agreement = billingStore.agreements.find((a) => a.id === agreementId);
    if (!agreement) return;
    const product = billingStore.products.find((p) => p.id === agreement.productId);
    const key = product?.category ?? 'service';
    grantEntitlement({
      partnerId,
      key: `${key}_access`,
      sourceAgreementId: agreementId,
    });
    setNotice(`Entitlement granted: ${key}_access`);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setNotice(null), 3000);
  };

  const statusIcon = (status: AgreementStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'pending_review':
        return <Clock size={16} className="text-amber-400" />;
      case 'past_due':
        return <AlertTriangle size={16} className="text-red-400" />;
      case 'cancelled':
        return <XCircle size={16} className="text-white/40" />;
      case 'completed':
        return <BadgeCheck size={16} className="text-blue-400" />;
      default:
        return <Clock size={16} className="text-white/40" />;
    }
  };

  const agreementsByStatus = useMemo(() => {
    const groups: Record<string, Agreement[]> = {
      pending_review: [],
      active: [],
      past_due: [],
      draft: [],
      cancelled: [],
      completed: [],
    };
    for (const a of billingStore.agreements) {
      if (groups[a.status]) groups[a.status].push(a);
      else groups[a.status] = [a];
    }
    return groups;
  }, [billingStore.agreements]);

  return (
    <PageShell
      badge="Admin"
      title="Billing & Agreements"
      subtitle="View and manage partner agreements, update statuses, and grant entitlements."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
        </div>

        {notice && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            {notice}
          </div>
        )}

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">
              Pending review
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-400">
              {agreementsByStatus.pending_review.length}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Active</div>
            <div className="mt-2 text-2xl font-bold text-emerald-400">
              {agreementsByStatus.active.length}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Past due</div>
            <div className="mt-2 text-2xl font-bold text-red-400">
              {agreementsByStatus.past_due.length}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Total</div>
            <div className="mt-2 text-2xl font-bold text-white">
              {billingStore.agreements.length}
            </div>
          </div>
        </div>

        {/* Denefits diagnostics (Edge Function) */}
        <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <summary className="cursor-pointer select-none text-white font-semibold">Denefits webhook events (diagnostics)</summary>
          <div className="mt-4 space-y-3">
            <div className="text-white/60 text-sm">
              Shows recent Denefits webhook events stored in Edge Function KV (requires Supabase + admin allowlist on Edge Functions).
            </div>
            {!isSupabaseConfigured ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                Supabase is not configured in this environment. Set <span className="font-mono">VITE_SUPABASE_URL</span> and{' '}
                <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> to load events.
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={denefitsBusy}
                  onClick={async () => {
                    setDenefitsErr(null);
                    setDenefitsBusy(true);
                    try {
                      const { data, error } = await supabase.functions.invoke('denefits-webhook', {
                        method: 'GET',
                      });
                      if (error) throw error;
                      if (!data?.ok) throw new Error(data?.error || 'Failed to load Denefits events.');
                      setDenefitsEvents(Array.isArray(data.events) ? data.events : []);
                    } catch (e: any) {
                      setDenefitsErr(e?.message || 'Failed to load Denefits events.');
                    } finally {
                      setDenefitsBusy(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60"
                >
                  {denefitsBusy ? 'Loading…' : 'Load events'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDenefitsErr(null);
                    setDenefitsEvents(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                >
                  Clear
                </button>
              </div>
            )}

            {denefitsErr ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{denefitsErr}</div>
            ) : null}

            {denefitsEvents ? (
              denefitsEvents.length ? (
                <div className="space-y-2">
                  {denefitsEvents.slice(0, 60).map((evt, idx) => (
                    <div key={evt?.id || idx} className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white font-semibold">
                            {String(evt?.event || 'event')} <span className="text-white/40 font-normal">({String(evt?.level || 'info')})</span>
                          </div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            {String(evt?.at || evt?.meta?.at || '').trim() || '—'}
                          </div>
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          {evt?.meta?.agreementId ? `agreement:${evt.meta.agreementId}` : evt?.meta?.contractId ? `contract:${evt.meta.contractId}` : ''}
                        </div>
                      </div>
                      {evt?.meta ? (
                        <pre className="mt-3 text-[11px] text-white/60 whitespace-pre-wrap break-words">{JSON.stringify(evt.meta, null, 2)}</pre>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-white/60 text-sm">No events found.</div>
              )
            ) : null}
          </div>
        </details>

        {/* Pending review agreements */}
        {agreementsByStatus.pending_review.length > 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Clock size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Pending review ({agreementsByStatus.pending_review.length})
              </span>
            </div>
            <div className="space-y-3">
              {agreementsByStatus.pending_review.map((agreement) => (
                <div
                  key={agreement.id}
                  className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-white font-semibold">
                        {getPartnerName(agreement.partnerId)}
                      </div>
                      <div className="text-white/60 text-sm">
                        {getProductName(agreement.productId ?? agreement.packageId)} · {getAgreementPriceLabel(agreement)}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1">
                        Rail: {agreement.rail === 'stripe' ? 'Stripe' : 'In-house financing'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusIcon(agreement.status)}
                      <span className="text-[10px] uppercase tracking-widest text-white/50">
                        {agreement.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleUpdateStatus(agreement.id, 'active')}
                      className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                    >
                      Approve → Active
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(agreement.id, 'cancelled')}
                      className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All agreements */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <CreditCard size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">All agreements</span>
          </div>

          {billingStore.agreements.length === 0 ? (
            <EmptyState
              title="No agreements yet"
              description="Partners create agreements from the checkout flow. Once you have activity, you’ll see Stripe and in-house rails here."
            />
          ) : (
            <div className="space-y-3">
              {billingStore.agreements.map((agreement) => (
                <div
                  key={agreement.id}
                  className="rounded-xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-white font-semibold">
                        {getPartnerName(agreement.partnerId)}
                      </div>
                      <div className="text-white/60 text-sm">
                        {getProductName(agreement.productId ?? agreement.packageId)} · {getAgreementPriceLabel(agreement)}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1">
                        Rail: {agreement.rail === 'stripe' ? 'Stripe' : 'In-house'} · Created:{' '}
                        {new Date(agreement.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusIcon(agreement.status)}
                      <span className="text-[10px] uppercase tracking-widest text-white/50">
                        {agreement.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {agreement.status === 'draft' && (
                      <button
                        onClick={() => handleUpdateStatus(agreement.id, 'active')}
                        className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                      >
                        Activate
                      </button>
                    )}
                    {agreement.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleGrantEntitlement(agreement.partnerId, agreement.id)}
                          className="px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-all"
                        >
                          Grant entitlement
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(agreement.id, 'past_due')}
                          className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500/20 transition-all"
                        >
                          Mark past due
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(agreement.id, 'completed')}
                          className="px-3 py-1.5 rounded-lg border border-white/20 bg-white/5 text-white/60 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                          Complete
                        </button>
                      </>
                    )}
                    {agreement.status === 'past_due' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(agreement.id, 'active')}
                          className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                        >
                          Restore active
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(agreement.id, 'cancelled')}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Entitlements */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Building2 size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Entitlements</span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Quick grant / revoke</div>
            <div className="mt-3 grid md:grid-cols-2 gap-4 items-end">
              <label className="block">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Partner</div>
                <select
                  value={entPartnerId}
                  onChange={(e) => setEntPartnerId(e.target.value)}
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.profile.fullName} ({p.profile.email ?? 'no-email'})
                    </option>
                  ))}
                </select>
              </label>
              <div className="text-white/50 text-sm">
                Toggle module access for the selected partner. Revoking sets existing active entitlements to <span className="font-mono">revoked</span>.
              </div>
            </div>

            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.values(ENTITLEMENT_KEYS).map((key) => {
                const active = entPartnerId ? hasEntitlement(entPartnerId, key) : false;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (!entPartnerId) return;
                      const p = partners.find((x) => x.id === entPartnerId);
                      if (active) {
                        revokeEntitlementsByPartnerKey({ partnerId: entPartnerId, key });
                        setNotice(`Revoked: ${key}`);
                      } else {
                        grantEntitlement({ tenantId: p?.tenantId, partnerId: entPartnerId, key, sourceAgreementId: 'manual_admin', status: 'active' });
                        setNotice(`Granted: ${key}`);
                      }
                      window.dispatchEvent(new Event('finely:store'));
                      setRefreshKey((k) => k + 1);
                      setTimeout(() => setNotice(null), 2500);
                    }}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      active
                        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
                        : 'border-white/10 bg-black/30 text-white/70 hover:bg-white/[0.03]'
                    }`}
                    title={active ? 'Click to revoke' : 'Click to grant'}
                  >
                    <div className="text-white font-medium text-sm">{key}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">{active ? 'active' : 'locked'}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {billingStore.entitlements.length === 0 ? (
            <div className="text-white/60 text-sm">
              No entitlements granted yet. Grant entitlements from active agreements above.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {billingStore.entitlements.map((ent) => (
                <div
                  key={ent.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                >
                  <div className="text-white font-medium text-sm">{ent.key}</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1">
                    Partner: {getPartnerName(ent.partnerId)}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-emerald-400/70 mt-1">
                    {ent.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
