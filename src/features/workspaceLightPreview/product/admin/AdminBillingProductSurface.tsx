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
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadJson } from '../../../../data/localJsonStore';
import { listPartners } from '../../../../data/partnersRepo';
import type { Partner } from '../../../../domain/partners';
import { ensurePartnerEntitlements, entitlementsForProduct, ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import { hasEntitlement, revokeEntitlementsByPartnerKey, updateAgreementStatus, grantEntitlement } from '../../../../data/billingRepo';
import type { Agreement, AgreementStatus, BillingProduct, PriceOption } from '../../../../domain/billing';
import { supabase, isSupabaseConfigured } from '../../../../lib/supabaseClient';
import { EmptyState } from '../../../../components/ui';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ACTIVE_CHIP,
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
  finelyOsInlineListItem,
  finelyOsListItem,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

type WorkbenchLane = 'review' | 'plans' | 'entitlements' | 'denefits';

type BillingStore = {
  billingAccounts: { id: string; partnerId: string; status: string }[];
  products: BillingProduct[];
  priceOptions: PriceOption[];
  agreements: Agreement[];
  agreementEvents: { id: string; agreementId: string; kind: string; createdAt: string }[];
  entitlements: { id: string; partnerId: string; key: string; status: string }[];
};

const LANES: { id: WorkbenchLane; label: string; accent: 'rose' | 'violet' | 'emerald' | 'sky' }[] = [
  { id: 'review', label: 'Pending review', accent: 'rose' },
  { id: 'plans', label: 'All plans', accent: 'violet' },
  { id: 'entitlements', label: 'Entitlements', accent: 'emerald' },
  { id: 'denefits', label: 'Denefit events', accent: 'sky' },
];

export default function AdminBillingProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'violet';
  const [lane, setLane] = useState<WorkbenchLane>('review');
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [planQuery, setPlanQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [entPartnerId, setEntPartnerId] = useState<string>('');
  const [denefitsBusy, setDenefitsBusy] = useState(false);
  const [denefitsErr, setDenefitsErr] = useState<string | null>(null);
  const [denefitsEvents, setDenefitsEvents] = useState<Record<string, unknown>[] | null>(null);

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
    () => (selectedAgreementId ? billingStore.agreements.find((a) => a.id === selectedAgreementId) ?? null : navigatorAgreements[0] ?? null),
    [selectedAgreementId, billingStore.agreements, navigatorAgreements],
  );

  useEffect(() => {
    if (lane === 'review' || lane === 'plans') {
      if (navigatorAgreements.length && !navigatorAgreements.some((a) => a.id === selectedAgreementId)) {
        setSelectedAgreementId(navigatorAgreements[0]?.id ?? null);
      }
    }
  }, [lane, navigatorAgreements, selectedAgreementId]);

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

  const renderPlanInspector = () => {
    if (!selectedAgreement) {
      return (
        <div className={`${finelyOsCatalogCard('sky')} p-8 ${FINELY_OS_ENTITY_BODY}`} data-fc-accent="sky">
          {lane === 'review' ? 'No agreements waiting for review.' : 'Select a plan from the navigator.'}
        </div>
      );
    }
    return (
      <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Receipt size={16} />
              <span>Invoice inspector</span>
            </div>
            <h2 className={`mt-2 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{getPartnerName(selectedAgreement.partnerId)}</h2>
            <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
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
          </div>
        </div>
        {renderAgreementActions(selectedAgreement)}
      </div>
    );
  };

  const renderEntitlementsInspector = () => (
    <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-6`} data-fc-accent="emerald">
      <div>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
          <ShieldCheck size={16} />
          <span>Entitlement inspector</span>
        </div>
        <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>Toggle module access for a partner. Revoking sets active entitlements to revoked.</p>
      </div>

      <div className={`${finelyOsCatalogCard('violet')} p-6 space-y-4`} data-fc-accent="violet">
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Quick grant or revoke</div>
        <div className="grid md:grid-cols-2 gap-4 items-end">
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
          <div className={FINELY_OS_ENTITY_BODY}>Click a module tile to grant or revoke access for the selected partner.</div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                  active ? FINELY_OS_ACTIVE_CHIP : `${finelyOsInlineListItem()} ${FINELY_OS_ENTITY_BODY}`
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
        <p className={FINELY_OS_ENTITY_BODY}>No entitlements granted yet. Grant entitlements from active agreements.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {billingStore.entitlements.map((ent) => (
            <div key={ent.id} className={`${finelyOsCatalogCard('sky')} p-4`} data-fc-accent="sky">
              <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{ent.key}</div>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-1 normal-case tracking-normal`}>Partner: {getPartnerName(ent.partnerId)}</div>
              <div className={`mt-1 ${finelyOsStatusChip(ent.status === 'active' ? 'ok' : 'warn')}`}>{ent.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDenefitsInspector = () => (
    <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
      <div>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
          <CreditCard size={16} />
          <span>Denefit webhook inspector</span>
        </div>
        <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
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
            pageSize={10}
            emptyMessage="No events found."
            renderItem={(evt, idx) => (
              <div key={String(evt?.id ?? idx)} className={`${finelyOsCatalogCard('emerald')} p-4`} data-fc-accent="emerald">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className={FINELY_OS_ENTITY_VALUE}>
                      {String(evt?.event || 'event')}{' '}
                      <span className={`${FINELY_OS_ENTITY_BODY} font-normal`}>({String(evt?.level || 'info')})</span>
                    </div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
                      {String(evt?.at || (evt?.meta as Record<string, unknown>)?.at || '').trim() || '—'}
                    </div>
                  </div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
                    {(evt?.meta as Record<string, unknown>)?.agreementId
                      ? `agreement:${String((evt.meta as Record<string, unknown>).agreementId)}`
                      : (evt?.meta as Record<string, unknown>)?.contractId
                        ? `contract:${String((evt.meta as Record<string, unknown>).contractId)}`
                        : ''}
                  </div>
                </div>
                {evt?.meta ? (
                  <pre className={`mt-3 text-[11px] ${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap break-words`}>
                    {JSON.stringify(evt.meta, null, 2)}
                  </pre>
                ) : null}
              </div>
            )}
          />
        ) : (
          <p className={FINELY_OS_ENTITY_BODY}>No events found.</p>
        )
      ) : null}
    </div>
  );

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Finance"
      title="Billing and agreements"
      description="Plan navigator on the left — invoice and entitlement inspection on the right."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={<ProductPagePrimaryAction label="Review pending" onClick={() => setLane('review')} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/products')}>
          Products and pricing
        </button>
      }
      metrics={[
        { label: 'Pending review', value: String(agreementsByStatus.pending_review.length), hint: 'Needs approval', accent: 'rose', onClick: () => setLane('review') },
        { label: 'Active', value: String(agreementsByStatus.active.length), hint: 'Paying partners', accent: 'emerald', onClick: () => setLane('plans') },
        { label: 'Past due', value: String(agreementsByStatus.past_due.length), hint: 'Follow up', accent: 'violet', onClick: () => setLane('plans') },
        { label: 'Entitlements', value: String(billingStore.entitlements.length), hint: 'Module grants', accent: 'sky', onClick: () => setLane('entitlements') },
      ]}
      metricTitle="Payment health"
      metricDescription="Approve pending agreements first, then grant entitlements so partners unlock the right modules."
    >
      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}

      <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="split-workbench">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Billing workbench lanes">
          {LANES.map((tab) => {
            const active = lane === tab.id;
            const badge =
              tab.id === 'review'
                ? agreementsByStatus.pending_review.length
                : tab.id === 'plans'
                  ? billingStore.agreements.length
                  : tab.id === 'entitlements'
                    ? billingStore.entitlements.length
                    : null;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setLane(tab.id)}
                className={`rounded-full border px-4 py-2 text-xs font-extrabold transition ${
                  active
                    ? tab.accent === 'rose'
                      ? 'border-rose-400 bg-rose-500/15 text-rose-900'
                      : tab.accent === 'violet'
                        ? 'border-violet-400 bg-violet-500/15 text-violet-900'
                        : tab.accent === 'emerald'
                          ? 'border-emerald-400 bg-emerald-500/15 text-emerald-900'
                          : 'border-sky-400 bg-sky-500/15 text-sky-900'
                    : 'border-black/10 bg-white/60 text-slate-800 hover:border-violet-300'
                }`}
              >
                {tab.label}
                {badge != null && badge > 0 ? ` (${badge})` : ''}
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-[minmax(260px,320px)_1fr] gap-6 items-start">
          {lane === 'review' || lane === 'plans' ? (
            <>
              <div className={`${finelyOsCatalogCard('violet')} p-5 lg:p-6 space-y-4 min-h-[320px]`} data-fc-accent="violet">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Plan navigator</div>
                <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 w-full ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}>
                  <Search size={14} className="text-violet-400 shrink-0" />
                  <input
                    value={planQuery}
                    onChange={(e) => setPlanQuery(e.target.value)}
                    className={`bg-transparent outline-none w-full text-sm font-bold ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
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
                  <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                    {navigatorAgreements.map((agreement) => {
                      const active = agreement.id === selectedAgreement?.id;
                      return (
                        <button
                          key={agreement.id}
                          type="button"
                          onClick={() => setSelectedAgreementId(agreement.id)}
                          className={finelyOsListItem(active, 'violet')}
                        >
                          <div className={`${FINELY_OS_ENTITY_VALUE} truncate font-extrabold`}>{getPartnerName(agreement.partnerId)}</div>
                          <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate normal-case tracking-normal`}>
                            {agreement.status} · {getAgreementPriceLabel(agreement)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="min-w-0">{renderPlanInspector()}</div>
            </>
          ) : null}

          {lane === 'entitlements' ? (
            <>
              <div className={`${finelyOsCatalogCard('emerald')} p-5 lg:p-6 space-y-4 min-h-[320px]`} data-fc-accent="emerald">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Partners</div>
                <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                  {partners.map((p) => {
                    const active = p.id === entPartnerId;
                    const grantCount = billingStore.entitlements.filter((e) => e.partnerId === p.id && e.status === 'active').length;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setEntPartnerId(p.id)}
                        className={finelyOsListItem(active, 'emerald')}
                      >
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate font-extrabold`}>{p.profile.fullName}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate normal-case tracking-normal`}>
                          {grantCount} active grant{grantCount === 1 ? '' : 's'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="min-w-0">{renderEntitlementsInspector()}</div>
            </>
          ) : null}

          {lane === 'denefits' ? (
            <div className="lg:col-span-2 min-w-0">{renderDenefitsInspector()}</div>
          ) : null}
        </div>
      </section>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
