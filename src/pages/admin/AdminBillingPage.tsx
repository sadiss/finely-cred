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
import { ensurePartnerEntitlements, entitlementsForProduct, ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { hasEntitlement, revokeEntitlementsByPartnerKey, updateAgreementStatus, grantEntitlement } from '../../data/billingRepo';
import type { Agreement, AgreementStatus, BillingProduct, PriceOption } from '../../domain/billing';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { EmptyState } from '../../components/ui';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ACTIVE_CHIP,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_SUCCESS_BTN,
  finelyOsInlineListItem,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

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
    if (!agreement?.productId) return;
    const keys = entitlementsForProduct(agreement.productId);
    ensurePartnerEntitlements({ partnerId, keys, sourceAgreementId: agreementId });
    setNotice(`Entitlements granted: ${keys.join(', ')}`);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setNotice(null), 3000);
  };

  const statusIcon = (status: AgreementStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'pending_review':
        return <Clock size={16} className="text-fuchsia-400" />;
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
      <div className={FINELY_OS_PAGE}>
        <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Admin Dashboard
        </button>

        <div className={FINELY_OS_BANNER}>
          <CreditCard size={18} className="text-violet-600 shrink-0 mt-0.5" />
          <p className={`${FINELY_OS_ENTITY_BODY} leading-relaxed`}>
            View and manage partner agreements, update statuses, and grant entitlements across Stripe and in-house financing rails.
          </p>
        </div>

        {notice && <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div>}

        <div className="grid sm:grid-cols-4 gap-4">
          <FinelyOsOverviewStatTile icon={Clock} label="Pending review" value={agreementsByStatus.pending_review.length} accent="amber" iconAccent="amber" />
          <FinelyOsOverviewStatTile icon={CheckCircle2} label="Active" value={agreementsByStatus.active.length} accent="emerald" iconAccent="emerald" />
          <FinelyOsOverviewStatTile icon={AlertTriangle} label="Past due" value={agreementsByStatus.past_due.length} accent="rose" iconAccent="rose" />
          <FinelyOsOverviewStatTile icon={CreditCard} label="Total" value={billingStore.agreements.length} accent="violet" iconAccent="violet" />
        </div>

        <details className={`${finelyOsCatalogCard('violet')} !p-5 space-y-0`}>
          <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_VALUE}`}>Denefit webhook events (diagnostics)</summary>
          <div className="mt-4 space-y-3">
            <div className={FINELY_OS_ENTITY_BODY}>
              Shows recent Denefit webhook events stored in Edge Function KV (requires Supabase + admin allowlist on Edge Functions).
            </div>
            {!isSupabaseConfigured ? (
              <div className={FINELY_OS_NOTICE_WARN}>
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
                      if (!data?.ok) throw new Error(data?.error || 'Failed to load Denefit events.');
                      setDenefitsEvents(Array.isArray(data.events) ? data.events : []);
                    } catch (e: any) {
                      setDenefitsErr(e?.message || 'Failed to load Denefit events.');
                    } finally {
                      setDenefitsBusy(false);
                    }
                  }}
                  className={FINELY_OS_PRIMARY_BTN}
                >
                  {denefitsBusy ? 'Loading…' : 'Load events'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDenefitsErr(null);
                    setDenefitsEvents(null);
                  }}
                  className={FINELY_OS_SECONDARY_BTN}
                >
                  Clear
                </button>
              </div>
            )}

            {denefitsErr ? (
              <div className={FINELY_OS_NOTICE_ERROR}>{denefitsErr}</div>
            ) : null}

            {denefitsEvents ? (
              denefitsEvents.length ? (
                <FinelyOsPaginatedStack
                  items={denefitsEvents}
                  pageSize={10}
                  emptyMessage="No events found."
                  renderItem={(evt, idx) => (
                    <div key={evt?.id || idx} className={`${finelyOsCatalogCard('emerald')} !p-4 fc-surface-harmony`} data-fc-accent="emerald">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={FINELY_OS_ENTITY_VALUE}>
                            {String(evt?.event || 'event')} <span className={`${FINELY_OS_ENTITY_BODY} font-normal`}>({String(evt?.level || 'info')})</span>
                          </div>
                          <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
                            {String(evt?.at || evt?.meta?.at || '').trim() || '—'}
                          </div>
                        </div>
                        <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
                          {evt?.meta?.agreementId ? `agreement:${evt.meta.agreementId}` : evt?.meta?.contractId ? `contract:${evt.meta.contractId}` : ''}
                        </div>
                      </div>
                      {evt?.meta ? (
                        <pre className={`mt-3 text-[11px] ${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap break-words`}>{JSON.stringify(evt.meta, null, 2)}</pre>
                      ) : null}
                    </div>
                  )}
                />
              ) : (
                <div className={FINELY_OS_ENTITY_BODY}>No events found.</div>
              )
            ) : null}
          </div>
        </details>

        {/* Pending review agreements */}
        {agreementsByStatus.pending_review.length > 0 && (
          <div className={`${FINELY_OS_NOTICE_WARN} space-y-4`}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Pending review ({agreementsByStatus.pending_review.length})</div>
            <div className="space-y-3">
              {agreementsByStatus.pending_review.map((agreement) => (
                <div
                  key={agreement.id}
                  className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className={FINELY_OS_ENTITY_VALUE}>
                        {getPartnerName(agreement.partnerId)}
                      </div>
                      <div className={FINELY_OS_ENTITY_BODY}>
                        {getProductName(agreement.productId ?? agreement.packageId)} · {getAgreementPriceLabel(agreement)}
                      </div>
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-1 normal-case tracking-normal`}>
                        Rail: {agreement.rail === 'stripe' ? 'Stripe' : 'In-house financing'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusIcon(agreement.status)}
                      <span className={finelyOsStatusChip('warn')}>
                        {agreement.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleUpdateStatus(agreement.id, 'active')}
                      className={FINELY_OS_SUCCESS_BTN}
                    >
                      Approve → Active
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(agreement.id, 'cancelled')}
                      className={FINELY_OS_DANGER_BTN}
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
        <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>All agreements</div>

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
                  className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className={FINELY_OS_ENTITY_VALUE}>
                        {getPartnerName(agreement.partnerId)}
                      </div>
                      <div className={FINELY_OS_ENTITY_BODY}>
                        {getProductName(agreement.productId ?? agreement.packageId)} · {getAgreementPriceLabel(agreement)}
                      </div>
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-1 normal-case tracking-normal`}>
                        Rail: {agreement.rail === 'stripe' ? 'Stripe' : 'In-house'} · Created:{' '}
                        {new Date(agreement.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusIcon(agreement.status)}
                      <span className={finelyOsStatusChip('warn')}>
                        {agreement.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {agreement.status === 'draft' && (
                      <button
                        onClick={() => handleUpdateStatus(agreement.id, 'active')}
                        className={FINELY_OS_SUCCESS_BTN}
                      >
                        Activate
                      </button>
                    )}
                    {agreement.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleGrantEntitlement(agreement.partnerId, agreement.id)}
                          className={FINELY_OS_SECONDARY_BTN}
                        >
                          Grant entitlement
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(agreement.id, 'past_due')}
                          className={FINELY_OS_SECONDARY_BTN}
                        >
                          Mark past due
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(agreement.id, 'completed')}
                          className={FINELY_OS_SECONDARY_BTN}
                        >
                          Complete
                        </button>
                      </>
                    )}
                    {agreement.status === 'past_due' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(agreement.id, 'active')}
                          className={FINELY_OS_SUCCESS_BTN}
                        >
                          Restore active
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(agreement.id, 'cancelled')}
                          className={FINELY_OS_DANGER_BTN}
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

        <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Entitlements</div>

          <div className={`${finelyOsCatalogCard('emerald')} !p-4 fc-surface-harmony`} data-fc-accent="emerald">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Quick grant / revoke</div>
            <div className="mt-3 grid md:grid-cols-2 gap-4 items-end">
              <label className="block">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Partner</div>
                <select value={entPartnerId} onChange={(e) => setEntPartnerId(e.target.value)} className={FINELY_OS_ENTITY_INPUT}>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.profile.fullName} ({p.profile.email ?? 'no-email'})
                    </option>
                  ))}
                </select>
              </label>
              <div className={FINELY_OS_ENTITY_BODY}>
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
                        ? FINELY_OS_ACTIVE_CHIP
                        : `${finelyOsInlineListItem()} ${FINELY_OS_ENTITY_BODY}`
                    }`}
                    title={active ? 'Click to revoke' : 'Click to grant'}
                  >
                    <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{key}</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>{active ? 'active' : 'locked'}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {billingStore.entitlements.length === 0 ? (
            <div className={FINELY_OS_ENTITY_BODY}>
              No entitlements granted yet. Grant entitlements from active agreements above.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {billingStore.entitlements.map((ent) => (
                <div
                  key={ent.id}
                  className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}
                >
                  <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{ent.key}</div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-1 normal-case tracking-normal`}>
                    Partner: {getPartnerName(ent.partnerId)}
                  </div>
                  <div className={`mt-1 ${finelyOsStatusChip(ent.status === 'active' ? 'ok' : 'warn')}`}>
                    {ent.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}
