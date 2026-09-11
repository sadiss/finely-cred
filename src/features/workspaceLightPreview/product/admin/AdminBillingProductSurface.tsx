import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Receipt,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadJson } from '../../../../data/localJsonStore';
import { listPartners } from '../../../../data/partnersRepo';
import type { Partner } from '../../../../domain/partners';
import { ensurePartnerEntitlements, entitlementsForProduct, ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import { entitlementLabel } from '../../../../billing/entitlementLabels';
import { hasEntitlement, revokeEntitlementsByPartnerKey, updateAgreementStatus, grantEntitlement } from '../../../../data/billingRepo';
import type { Agreement, AgreementStatus, BillingProduct, PriceOption } from '../../../../domain/billing';
import { supabase, isSupabaseConfigured } from '../../../../lib/supabaseClient';
import { EmptyState } from '../../../../components/ui';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

type DeckLane = 'review' | 'plans' | 'entitlements' | 'denefits';

type BillingStore = {
  billingAccounts: { id: string; partnerId: string; status: string }[];
  products: BillingProduct[];
  priceOptions: PriceOption[];
  agreements: Agreement[];
  agreementEvents: { id: string; agreementId: string; kind: string; createdAt: string }[];
  entitlements: { id: string; partnerId: string; key: string; status: string }[];
};

const TILE_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

const LANES: { id: DeckLane; label: string; hint: string; accent: 'rose' | 'violet' | 'emerald' | 'sky' }[] = [
  { id: 'review', label: 'Pending review', hint: 'Needs approval', accent: 'rose' },
  { id: 'plans', label: 'All plans', hint: 'Every agreement', accent: 'violet' },
  { id: 'entitlements', label: 'Entitlements', hint: 'Module grants', accent: 'emerald' },
  { id: 'denefits', label: 'Denefit events', hint: 'Webhook log', accent: 'sky' },
];

export default function AdminBillingProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'violet';
  const [lane, setLane] = useState<DeckLane>('review');
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [planQuery, setPlanQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [entPartnerId, setEntPartnerId] = useState<string>('');
  const [denefitsBusy, setDenefitsBusy] = useState(false);
  const [denefitsErr, setDenefitsErr] = useState<string | null>(null);
  const [denefitsEvents, setDenefitsEvents] = useState<Record<string, unknown>[] | null>(null);
  const [selectedDenefit, setSelectedDenefit] = useState<Record<string, unknown> | null>(null);

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
  useEffect(() => {
    listPartners().then(setPartners);
  }, [refreshKey]);
  useEffect(() => {
    if (!entPartnerId && partners[0]?.id) setEntPartnerId(partners[0].id);
  }, [partners, entPartnerId]);

  useEffect(() => {
    if (!inspectorOpen && !selectedDenefit) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setInspectorOpen(false);
      setSelectedDenefit(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inspectorOpen, selectedDenefit]);

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

  const navigatorAgreements = useMemo(() => {
    const base = lane === 'review' ? agreementsByStatus.pending_review : billingStore.agreements;
    const q = planQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter((a) => {
      const hay = `${getPartnerName(a.partnerId)} ${getProductName(a.productId ?? a.packageId)} ${a.status} ${a.rail}`.toLowerCase();
      return hay.includes(q);
    });
  }, [lane, agreementsByStatus.pending_review, billingStore.agreements, planQuery, partners]);

  const selectedAgreement = useMemo(
    () => (selectedAgreementId ? billingStore.agreements.find((a) => a.id === selectedAgreementId) ?? null : null),
    [selectedAgreementId, billingStore.agreements],
  );

  const openAgreement = (agreementId: string) => {
    setSelectedAgreementId(agreementId);
    setInspectorOpen(true);
  };

  const setDeckLane = (next: DeckLane) => {
    setLane(next);
    setInspectorOpen(false);
    setSelectedDenefit(null);
  };

  const renderAgreementActions = (agreement: Agreement) => (
    <div className="mt-4 flex flex-wrap gap-2">
      {agreement.status === 'pending_review' ? (
        <>
          <button type="button" onClick={() => handleUpdateStatus(agreement.id, 'active')} className={FINELY_OS_SUCCESS_BTN}>
            Approve → Active
          </button>
          <button type="button" onClick={() => handleUpdateStatus(agreement.id, 'cancelled')} className={FINELY_OS_DANGER_BTN}>
            Reject
          </button>
        </>
      ) : null}
      {agreement.status === 'draft' ? (
        <button type="button" onClick={() => handleUpdateStatus(agreement.id, 'active')} className={FINELY_OS_SUCCESS_BTN}>
          Activate
        </button>
      ) : null}
      {agreement.status === 'active' ? (
        <>
          <button type="button" onClick={() => handleGrantEntitlement(agreement.partnerId, agreement.id)} className={FINELY_OS_SECONDARY_BTN}>
            Grant entitlement
          </button>
          <button type="button" onClick={() => handleUpdateStatus(agreement.id, 'past_due')} className={FINELY_OS_SECONDARY_BTN}>
            Mark past due
          </button>
          <button type="button" onClick={() => handleUpdateStatus(agreement.id, 'completed')} className={FINELY_OS_SECONDARY_BTN}>
            Complete
          </button>
        </>
      ) : null}
      {agreement.status === 'past_due' ? (
        <>
          <button type="button" onClick={() => handleUpdateStatus(agreement.id, 'active')} className={FINELY_OS_SUCCESS_BTN}>
            Restore active
          </button>
          <button type="button" onClick={() => handleUpdateStatus(agreement.id, 'cancelled')} className={FINELY_OS_DANGER_BTN}>
            Cancel
          </button>
        </>
      ) : null}
    </div>
  );

  const laneBadge = (id: DeckLane) => {
    if (id === 'review') return agreementsByStatus.pending_review.length;
    if (id === 'plans') return billingStore.agreements.length;
    if (id === 'entitlements') return billingStore.entitlements.length;
    return denefitsEvents?.length ?? 0;
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Finance"
      title="Billing and agreements"
      description="Approve agreements, grant entitlements, and review Denefit events."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={<ProductPagePrimaryAction label="Review pending" onClick={() => setDeckLane('review')} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/products')}>
          Products and pricing
        </button>
      }
      metrics={[
        { label: 'Pending review', value: String(agreementsByStatus.pending_review.length), hint: 'Needs approval', accent: 'rose', onClick: () => setDeckLane('review') },
        { label: 'Active', value: String(agreementsByStatus.active.length), hint: 'Paying partners', accent: 'emerald', onClick: () => setDeckLane('plans') },
        { label: 'Past due', value: String(agreementsByStatus.past_due.length), hint: 'Follow up', accent: 'violet', onClick: () => setDeckLane('plans') },
        { label: 'Entitlements', value: String(billingStore.entitlements.length), hint: 'Module grants', accent: 'sky', onClick: () => setDeckLane('entitlements') },
      ]}
      metricTitle="Payment health"
      metricDescription="Approve pending agreements first, then grant entitlements so partners unlock the right modules."
    >
      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}

      <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="command-deck">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="tablist" aria-label="Billing desk">
          {LANES.map((tab) => {
            const active = lane === tab.id;
            const badge = laneBadge(tab.id);
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setDeckLane(tab.id)}
                className={`${finelyOsCatalogCard(tab.accent)} p-6 lg:p-8 text-left min-h-[160px] flex flex-col gap-3 transition-all ${
                  active ? 'ring-2 ring-white/30 scale-[1.01]' : 'hover:shadow-lg'
                }`}
                data-fc-accent={tab.accent}
              >
                <div className={`text-4xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{badge}</div>
                <div>
                  <div className="text-xl font-extrabold">{tab.label}</div>
                  <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{tab.hint}</p>
                </div>
              </button>
            );
          })}
        </div>

        {lane === 'review' || lane === 'plans' ? (
          <>
            <div className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 w-full max-w-xl ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}>
              <Search size={16} className="text-violet-400 shrink-0" />
              <input
                value={planQuery}
                onChange={(e) => setPlanQuery(e.target.value)}
                className={`bg-transparent outline-none w-full text-base font-bold ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
                placeholder="Search plans…"
                aria-label="Search plans"
              />
            </div>

            {navigatorAgreements.length === 0 ? (
              lane === 'review' ? (
                <p className={FINELY_OS_ENTITY_BODY}>No agreements waiting for review.</p>
              ) : billingStore.agreements.length === 0 ? (
                <EmptyState
                  title="No agreements yet"
                  description="Partners create agreements from the checkout flow. Once you have activity, you will see Stripe and in-house rails here."
                />
              ) : (
                <p className={FINELY_OS_ENTITY_BODY}>No plans match your search.</p>
              )
            ) : (
              <FinelyOsPaginatedStack
                items={navigatorAgreements}
                pageSize={8}
                emptyMessage="No agreements yet."
                itemSpacingClassName="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                renderItem={(agreement, idx) => {
                  const tileAccent = TILE_ACCENTS[idx % TILE_ACCENTS.length];
                  return (
                    <button
                      key={agreement.id}
                      type="button"
                      onClick={() => openAgreement(agreement.id)}
                      className={`${finelyOsCatalogCard(tileAccent)} p-6 lg:p-7 text-left min-h-[160px] flex flex-col gap-3`}
                      data-fc-accent={tileAccent}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE} truncate`}>{getPartnerName(agreement.partnerId)}</div>
                        <span className="inline-flex items-center gap-1 shrink-0">
                          {statusIcon(agreement.status)}
                        </span>
                      </div>
                      <div className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                        {getProductName(agreement.productId ?? agreement.packageId)}
                      </div>
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                        {agreement.status} · {getAgreementPriceLabel(agreement)}
                      </div>
                    </button>
                  );
                }}
              />
            )}
          </>
        ) : null}

        {lane === 'entitlements' ? (
          <>
            <div className="flex flex-wrap items-end gap-4">
              <label className="block min-w-[240px]">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Partner</div>
                <select value={entPartnerId} onChange={(e) => setEntPartnerId(e.target.value)} className={FINELY_OS_ENTITY_INPUT}>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.profile.fullName} ({p.profile.email ?? 'no-email'})
                    </option>
                  ))}
                </select>
              </label>
              <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Click a module tile to grant or revoke access for the selected partner.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(ENTITLEMENT_KEYS).map((key, idx) => {
                const active = entPartnerId ? hasEntitlement(entPartnerId, key) : false;
                const tileAccent = TILE_ACCENTS[idx % TILE_ACCENTS.length];
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
                    className={`${finelyOsCatalogCard(tileAccent)} p-6 lg:p-7 text-left min-h-[140px] flex flex-col gap-2 ${
                      active ? 'ring-2 ring-white/30' : ''
                    }`}
                    data-fc-accent={tileAccent}
                    title={active ? 'Click to revoke' : 'Click to grant'}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <ShieldCheck size={18} />
                      <span className={finelyOsStatusChip(active ? 'ok' : 'warn')}>{active ? 'active' : 'locked'}</span>
                    </div>
                    <div className={`${FINELY_OS_ENTITY_VALUE} text-lg font-extrabold`}>{entitlementLabel(key)}</div>
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal font-mono`}>{key}</div>
                  </button>
                );
              })}
            </div>

            {billingStore.entitlements.length === 0 ? (
              <p className={FINELY_OS_ENTITY_BODY}>No entitlements granted yet. Grant entitlements from active agreements.</p>
            ) : (
              <FinelyOsPaginatedStack
                items={billingStore.entitlements}
                pageSize={9}
                emptyMessage="No entitlements granted yet."
                itemSpacingClassName="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                renderItem={(ent, idx) => {
                  const tileAccent = TILE_ACCENTS[idx % TILE_ACCENTS.length];
                  return (
                    <div key={ent.id} className={`${finelyOsCatalogCard(tileAccent)} p-6`} data-fc-accent={tileAccent}>
                      <div className={`${FINELY_OS_ENTITY_VALUE} text-lg font-extrabold`}>{entitlementLabel(ent.key)}</div>
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-2 normal-case tracking-normal`}>
                        Partner: {getPartnerName(ent.partnerId)}
                      </div>
                      <div className={`mt-2 ${finelyOsStatusChip(ent.status === 'active' ? 'ok' : 'warn')}`}>{ent.status}</div>
                    </div>
                  );
                }}
              />
            )}
          </>
        ) : null}

        {lane === 'denefits' ? (
          <>
            <div>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <CreditCard size={16} />
                <span>Denefit webhook events</span>
              </div>
              <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Recent Denefit webhook events stored in Edge Function KV (requires Supabase and admin allowlist on Edge Functions).
              </p>
            </div>
            {!isSupabaseConfigured ? (
              <div className={FINELY_OS_NOTICE_WARN}>
                Supabase is not configured. Set <span className="font-mono">VITE_SUPABASE_URL</span> and{' '}
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
                      const { data, error } = await supabase.functions.invoke('denefits-webhook', { method: 'GET' });
                      if (error) throw error;
                      if (!data?.ok) throw new Error(data?.error || 'Failed to load Denefit events.');
                      setDenefitsEvents(Array.isArray(data.events) ? data.events : []);
                    } catch (e: unknown) {
                      setDenefitsErr(e instanceof Error ? e.message : 'Failed to load Denefit events.');
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
                    setSelectedDenefit(null);
                  }}
                  className={FINELY_OS_SECONDARY_BTN}
                >
                  Clear
                </button>
              </div>
            )}
            {denefitsErr ? <div className={FINELY_OS_NOTICE_ERROR}>{denefitsErr}</div> : null}
            {denefitsEvents ? (
              denefitsEvents.length ? (
                <FinelyOsPaginatedStack
                  items={denefitsEvents}
                  pageSize={9}
                  emptyMessage="No events found."
                  itemSpacingClassName="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                  renderItem={(evt, idx) => {
                    const tileAccent = TILE_ACCENTS[idx % TILE_ACCENTS.length];
                    const meta = evt?.meta as Record<string, unknown> | undefined;
                    return (
                      <button
                        key={String(evt?.id ?? idx)}
                        type="button"
                        onClick={() => setSelectedDenefit(evt)}
                        className={`${finelyOsCatalogCard(tileAccent)} p-6 lg:p-7 text-left min-h-[160px] flex flex-col gap-2`}
                        data-fc-accent={tileAccent}
                      >
                        <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                          {String(evt?.event || 'event')}
                        </div>
                        <div className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{String(evt?.level || 'info')}</div>
                        <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
                          {String(evt?.at || meta?.at || '').trim() || '—'}
                        </div>
                        {meta?.agreementId || meta?.contractId ? (
                          <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
                            {meta?.agreementId ? `agreement:${String(meta.agreementId)}` : `contract:${String(meta.contractId)}`}
                          </div>
                        ) : null}
                      </button>
                    );
                  }}
                />
              ) : (
                <p className={FINELY_OS_ENTITY_BODY}>No events found.</p>
              )
            ) : null}
          </>
        ) : null}
      </section>

      {inspectorOpen && selectedAgreement ? (
        <div
          className="fc-wlp-local-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Invoice inspector"
          onClick={() => setInspectorOpen(false)}
        >
          <div className="fc-wlp-local-modal fc-wlp-wide-drawer p-6 lg:p-8 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  <Receipt size={16} />
                  <span>Invoice inspector</span>
                </div>
                <h2 className={`mt-2 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{getPartnerName(selectedAgreement.partnerId)}</h2>
                <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  {getProductName(selectedAgreement.productId ?? selectedAgreement.packageId)} · {getAgreementPriceLabel(selectedAgreement)}
                </p>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-2 normal-case tracking-normal`}>
                  Rail: {selectedAgreement.rail === 'stripe' ? 'Stripe' : 'In-house financing'} · Created{' '}
                  {new Date(selectedAgreement.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {statusIcon(selectedAgreement.status)}
                <span className={finelyOsStatusChip('warn')}>{selectedAgreement.status}</span>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setInspectorOpen(false)} aria-label="Close invoice inspector">
                  <X size={14} /> Close
                </button>
              </div>
            </div>
            {renderAgreementActions(selectedAgreement)}
          </div>
        </div>
      ) : null}

      {selectedDenefit ? (
        <div
          className="fc-wlp-local-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Denefit event"
          onClick={() => setSelectedDenefit(null)}
        >
          <div className="fc-wlp-local-modal fc-wlp-wide-drawer p-6 lg:p-8 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Denefit event</p>
                <h2 className={`mt-2 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{String(selectedDenefit.event || 'event')}</h2>
                <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{String(selectedDenefit.level || 'info')}</p>
              </div>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setSelectedDenefit(null)} aria-label="Close Denefit event">
                <X size={14} /> Close
              </button>
            </div>
            {selectedDenefit.meta ? (
              <pre className={`text-sm font-mono ${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap break-words`}>
                {JSON.stringify(selectedDenefit.meta, null, 2)}
              </pre>
            ) : (
              <p className={FINELY_OS_ENTITY_BODY}>No metadata on this event.</p>
            )}
          </div>
        </div>
      ) : null}

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
