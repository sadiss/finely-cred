import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CircleHelp,
  CreditCard,
  FileText,
  PlayCircle,
  Receipt,
  Shield,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { isAdminEmail } from '../../../../auth/admin';
import { ENTITLEMENT_KEYS, ensurePartnerEntitlements, type EntitlementKey } from '../../../../billing/entitlements';
import { InvoiceCenterPanel } from '../../../../components/billing/InvoiceCenterPanel';
import { FieldLayoutRenderer } from '../../../../components/fields/FieldLayoutRenderer';
import { getPackageById, formatPrice, getPackagesByCategory, type PricingCategory, type PricingPackage } from '../../../../config/pricingCatalog';
import {
  createBillingAccount,
  getBillingAccountForPartner,
  listAgreementsByPartner,
  listEntitlementsByPartner,
} from '../../../../data/billingRepo';
import { listCustomFieldDefinitionsByScope } from '../../../../data/customFieldsRepo';
import { getFieldLayout } from '../../../../data/fieldLayoutsRepo';
import { getCustomFieldValues, upsertCustomFieldValues } from '../../../../data/customFieldValuesRepo';
import { listInvoicesByPartner } from '../../../../data/invoicesRepo';
import { getPartnerSync, upsertPartner } from '../../../../data/partnersRepo';
import { getFeatureFlags, isDenefitsConfigured } from '../../../../data/settingsRepo';
import { FINELY_TENANT_ID } from '../../../../domain/tenants';
import type { Agreement, Entitlement } from '../../../../domain/billing';
import type { Invoice } from '../../../../domain/invoices';
import type { Partner } from '../../../../domain/partners';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsCatalogCard,
  finelyOsStatusChip,
  finelyOsViewTab,
} from '../../../os/finelyOsLightUi';
import './partnerWorkstationSurfaceTabs.css';

type BillingSpine = 'flow' | 'plans' | 'access' | 'invoices';

const SPINE_ITEMS: Array<{ id: BillingSpine; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: 'flow', label: 'Ledger flow', icon: Receipt },
  { id: 'plans', label: 'Plan catalog', icon: Sparkles },
  { id: 'access', label: 'Module access', icon: BadgeCheck },
  { id: 'invoices', label: 'Invoices', icon: FileText },
];

const MODULE_ACCESS = [
  { key: ENTITLEMENT_KEYS.reports, title: 'Credit reports', desc: 'Upload and parse bureau files.', href: '/portal/reports' },
  { key: ENTITLEMENT_KEYS.disputes, title: 'Dispute center', desc: 'Create disputes and track rounds.', href: '/portal/disputes' },
  { key: ENTITLEMENT_KEYS.letters, title: 'Letters studio', desc: 'Generate and save dispute letters.', href: '/portal/letters' },
  { key: ENTITLEMENT_KEYS.documents, title: 'Documents vault', desc: 'Store evidence and ID documents.', href: '/portal/documents' },
  { key: ENTITLEMENT_KEYS.debt, title: 'Debt & summons', desc: 'Track debt items and deadlines.', href: '/portal/debt' },
  { key: ENTITLEMENT_KEYS.messages, title: 'Messages', desc: 'Support and case updates.', href: '/portal/messages' },
  { key: ENTITLEMENT_KEYS.escalations, title: 'Escalations', desc: 'Complaints and regulator timelines.', href: '/portal/escalations' },
  { key: ENTITLEMENT_KEYS.identityTheft, title: 'Identity theft', desc: 'Recovery steps and freezes.', href: '/portal/identity-theft' },
  { key: ENTITLEMENT_KEYS.tasks, title: 'Tasks', desc: 'Deadlines and action items.', href: '/portal/projects' },
  { key: ENTITLEMENT_KEYS.businessBuild, title: 'Credit building', desc: 'Vendor sequencing workflow.', href: '/portal/build' },
] as const;

const CONSENT_ITEMS = [
  { key: 'termsAcceptedAt' as const, label: 'I agree to the Terms', href: '/terms' },
  { key: 'privacyAcceptedAt' as const, label: 'I agree to the Privacy Policy', href: '/privacy' },
  { key: 'disclaimerAcceptedAt' as const, label: 'I acknowledge the Disclaimer', href: '/disclaimer' },
  { key: 'communicationConsentAt' as const, label: 'I consent to communication regarding my case', href: '/portal/messages' },
  { key: 'ndaAcceptedAt' as const, label: 'Mutual NDA (confidentiality)', href: '/terms#confidentiality' },
  { key: 'servicesAgreementAcceptedAt' as const, label: 'Services agreement', href: '/terms#services' },
  { key: 'debtServicesAcceptedAt' as const, label: 'Debt & collections workflow acknowledgment', href: '/disclaimer#debt' },
];

const ACTIVE_ENTITLEMENT_CARD = 'border-emerald-500/35 bg-emerald-500/10 ring-1 ring-emerald-400/20';

type LedgerRow = {
  id: string;
  title: string;
  detail: string;
  amount: string;
  status: string;
  pastDue?: boolean;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  onOpen: () => void;
};

function formatShortDate(iso?: string): string {
  if (!iso) return 'soon';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'soon';
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatFreshness(iso?: string): string {
  if (!iso) return 'no billing activity yet';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? '1 month ago' : `${months} months ago`;
}

function recommendedCategoryForAgreements(agreements: Agreement[]): PricingCategory {
  const categories = agreements
    .map((agreement) => getPackageById(agreement.packageId)?.category)
    .filter(Boolean) as PricingCategory[];
  return categories[0] ?? 'personal_credit';
}

function entitlementLabel(key: string): string {
  const labels: Record<string, string> = {
    [ENTITLEMENT_KEYS.reports]: 'Credit reports',
    [ENTITLEMENT_KEYS.documents]: 'Documents vault',
    [ENTITLEMENT_KEYS.messages]: 'Messages',
    [ENTITLEMENT_KEYS.disputes]: 'Dispute center',
    [ENTITLEMENT_KEYS.letters]: 'Letters studio',
    [ENTITLEMENT_KEYS.debt]: 'Debt & summons',
    [ENTITLEMENT_KEYS.identityTheft]: 'Identity theft',
    [ENTITLEMENT_KEYS.businessBuild]: 'Credit building',
  };
  return labels[key] ?? key;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; partner: Partner; agreements: Agreement[]; entitlements: Entitlement[]; invoices: Invoice[] };

function buildLedgerRows(
  agreements: Agreement[],
  entitlements: Entitlement[],
  invoices: Invoice[],
  mapPortalHref: (href: string) => string,
  navigate: (path: string) => void,
  setSpine: (spine: BillingSpine) => void,
): LedgerRow[] {
  const rows: LedgerRow[] = [];

  invoices
    .filter((inv) => inv.status === 'past_due' || inv.status === 'sent')
    .forEach((invoice, index) => {
      rows.push({
        id: `inv-${invoice.id}`,
        title: `Invoice ${invoice.invoiceNumber}`,
        detail: `Due ${formatShortDate(invoice.dueAt)}`,
        amount: (invoice.totalCents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' }),
        status: invoice.status === 'past_due' ? 'Past due' : 'Due',
        pastDue: invoice.status === 'past_due',
        accent: (['rose', 'violet', 'sky', 'emerald'] as const)[index % 4],
        onOpen: () => setSpine('invoices'),
      });
    });

  agreements.forEach((agreement, index) => {
    const pkg = getPackageById(agreement.packageId);
    const priceLine = pkg
      ? `${formatPrice(pkg.priceAmount)}${pkg.interval === 'month' ? '/mo' : ''}`
      : `${(agreement.amountCents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}`;
    rows.push({
      id: `agr-${agreement.id}`,
      title: pkg?.name ?? agreement.packageId,
      detail: `${agreement.rail === 'stripe' ? 'Stripe' : 'In-house'} · ${agreement.status}`,
      amount: priceLine,
      status: agreement.status,
      accent: (['emerald', 'violet', 'sky', 'rose'] as const)[index % 4],
      onOpen: () => navigate(mapPortalHref(`/portal/checkout?package=${encodeURIComponent(agreement.packageId)}`)),
    });
  });

  entitlements
    .filter((e) => e.status === 'active')
    .slice(0, 8)
    .forEach((entitlement, index) => {
      rows.push({
        id: `ent-${entitlement.id}`,
        title: entitlementLabel(entitlement.key),
        detail: entitlement.endsAt ? `Ends ${formatShortDate(entitlement.endsAt)}` : 'Active module',
        amount: 'Unlocked',
        status: 'active',
        accent: (['violet', 'sky', 'rose', 'emerald'] as const)[index % 4],
        onOpen: () => setSpine('access'),
      });
    });

  return rows;
}

export default function PartnerBillingProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const mapPortalHref = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? CreditCard;
  const livePath = mapPortalHref(navItem?.legacyPath ?? '/portal/billing');
  const accent = navItem?.accent ?? 'sky';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const isDemo = dataMode === 'demo' || !partnerId;
  const isAdmin = useMemo(() => (auth.user?.email ? isAdminEmail(String(auth.user.email)) : false), [auth.user?.email]);
  const features = useMemo(() => getFeatureFlags(), []);
  const allPortalEntitlementKeys = useMemo(() => Object.values(ENTITLEMENT_KEYS) as EntitlementKey[], []);

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [spine, setSpine] = useState<BillingSpine>('flow');
  const [planCategory, setPlanCategory] = useState<PricingCategory>('personal_credit');
  const [partnerValues, setPartnerValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    try {
      const partner = getPartnerSync(partnerId!);
      if (!partner) throw new Error('Partner profile not found.');
      const agreements = listAgreementsByPartner(partnerId!);
      const entitlements = listEntitlementsByPartner(partnerId!);
      const invoices = listInvoicesByPartner(partnerId!);
      if (!cancelled) setState({ status: 'ready', partner, agreements, entitlements, invoices });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load your billing right now.';
      if (!cancelled) setState({ status: 'error', message });
    }
    return () => {
      cancelled = true;
    };
  }, [isDemo, partnerId, retryToken]);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);

  const partner = state.status === 'ready' ? state.partner : null;
  const tenantId = (partner?.tenantId || '').trim() || FINELY_TENANT_ID;
  const billingAccount = useMemo(() => (partner ? getBillingAccountForPartner(partner.id) ?? createBillingAccount(partner.id) : null), [partner?.id]);
  const partnerFieldDefs = useMemo(() => (partner ? listCustomFieldDefinitionsByScope('partners', tenantId) : []), [partner, tenantId]);
  const partnerFieldLayout = useMemo(() => (partner ? getFieldLayout({ tenantId, scope: 'partners' }) : null), [partner, tenantId]);
  const partnerValuesRecord = useMemo(
    () => (partner ? getCustomFieldValues('partners', partner.id, tenantId) : null),
    [partner?.id, tenantId, retryToken],
  );

  useEffect(() => {
    setPartnerValues(partnerValuesRecord?.values ?? {});
  }, [partnerValuesRecord?.updatedAt, partner?.id]);

  const recommendedCategory = useMemo(() => {
    if (state.status !== 'ready') return 'personal_credit' as PricingCategory;
    return recommendedCategoryForAgreements(state.agreements);
  }, [state]);

  useEffect(() => {
    setPlanCategory(recommendedCategory);
  }, [recommendedCategory]);

  const packagesByCategory = useMemo(() => {
    return getPackagesByCategory(planCategory)
      .filter((p) => p.isPublic)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [planCategory]);

  const trial = useMemo(() => {
    if (state.status !== 'ready') return { isActive: false, endsAt: null as string | null, keys: [] as string[] };
    const now = new Date().toISOString();
    const activeTrial = state.entitlements
      .filter((e) => e.status === 'active')
      .filter((e) => e.sourceAgreementId === 'trial_30d')
      .filter((e) => !e.endsAt || e.endsAt > now);
    const endsAt = activeTrial.map((e) => e.endsAt).filter(Boolean).sort().at(-1) ?? null;
    return {
      isActive: activeTrial.length > 0,
      endsAt,
      keys: Array.from(new Set(activeTrial.map((e) => e.key))).sort(),
    };
  }, [state]);

  const askFinelyPrompt = 'What does my plan include, and what would upgrading unlock?';

  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Billing & plan' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const renderPlansPanel = (ownedPackageIds: Set<string>) => (
    <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-6`} data-fc-accent="violet">
      <div>
        <p className={FINELY_OS_ENTITY_SUBLABEL}>Plan catalog</p>
        <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Pick a service</h2>
        <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
          Every plan lists exactly which modules it unlocks — nothing stays hidden after checkout.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={FINELY_OS_VIEW_TABS}>
          {(
            [
              { id: 'personal_credit' as const, label: 'Personal' },
              { id: 'business_credit' as const, label: 'Business' },
              { id: 'debt_legal' as const, label: 'Debt & legal' },
            ] as const
          ).map((c) => (
            <button key={c.id} type="button" onClick={() => setPlanCategory(c.id)} className={finelyOsViewTab(planCategory === c.id, 'emerald')}>
              {c.label}
              {c.id === recommendedCategory ? <span className="ml-1 text-violet-600">★</span> : null}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => navigate(mapPortalHref('/portal/checkout'))} className={FINELY_OS_SECONDARY_BTN}>
          Open checkout <ArrowRight size={14} />
        </button>
      </div>
      <FinelyOsPaginatedStack
        key={planCategory}
        items={packagesByCategory}
        pageSize={6}
        itemSpacingClassName="grid md:grid-cols-2 gap-4"
        emptyMessage="No packages in this category."
        renderItem={(pkg: PricingPackage, idx) => {
          const owned = ownedPackageIds.has(pkg.id);
          const priceLine = pkg.priceAmount <= 0 ? 'Free' : `${formatPrice(pkg.priceAmount)}${pkg.interval === 'month' ? ' / month' : ''}`;
          return (
            <div key={pkg.id} className={`${finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])} p-6 space-y-3`} data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4]}>
              <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{pkg.name}</div>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>{pkg.delivery}</div>
              <div className="text-lg font-extrabold text-violet-700">{priceLine}</div>
              <p className={`${FINELY_OS_ENTITY_BODY} line-clamp-3`}>{pkg.description}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => navigate(mapPortalHref(`/portal/checkout?package=${encodeURIComponent(pkg.id)}`))} className={owned ? FINELY_OS_SECONDARY_BTN : FINELY_OS_SUCCESS_BTN}>
                  {owned ? 'View plan' : 'Select'} <ArrowRight size={14} />
                </button>
                <button type="button" onClick={() => navigate('/pricing')} className={FINELY_OS_SECONDARY_BTN}>
                  Compare
                </button>
              </div>
            </div>
          );
        }}
      />
    </div>
  );

  const renderAccessPanel = (activeKeys: Set<string>) => (
    <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-5`} data-fc-accent="emerald">
      <div>
        <p className={FINELY_OS_ENTITY_SUBLABEL}>Module access</p>
        <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>What your plan unlocks</h2>
        <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Locked modules name the plan that opens them — upgrade when you are ready.</p>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {MODULE_ACCESS.map((module, idx) => {
          const active = activeKeys.has(module.key);
          const cardAccent = (['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4];
          return (
            <div key={module.key} className={`rounded-2xl border p-5 space-y-3 ${active ? ACTIVE_ENTITLEMENT_CARD : finelyOsCatalogCard(cardAccent)}`} data-fc-accent={cardAccent}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={FINELY_OS_ENTITY_VALUE}>{module.title}</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>{module.key}</div>
                </div>
                <span className={active ? finelyOsStatusChip('ok') : finelyOsStatusChip('warn')}>{active ? 'Unlocked' : 'Locked'}</span>
              </div>
              <p className={FINELY_OS_ENTITY_BODY}>{module.desc}</p>
              <button type="button" disabled={!active} onClick={() => navigate(mapPortalHref(module.href))} className={`w-full ${active ? FINELY_OS_SUCCESS_BTN : FINELY_OS_SECONDARY_BTN} disabled:opacity-40`}>
                Open <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>
      {isAdmin && partner && activeKeys.size === 0 ? (
        <button
          type="button"
          className={FINELY_OS_SUCCESS_BTN}
          onClick={() => {
            ensurePartnerEntitlements({ partnerId: partner.id, keys: allPortalEntitlementKeys, sourceAgreementId: 'admin_demo_unlock' });
            setRetryToken((v) => v + 1);
          }}
        >
          Admin demo: unlock all modules <ArrowRight size={14} />
        </button>
      ) : null}
    </div>
  );

  const renderFlowLedger = (agreements: Agreement[], entitlements: Entitlement[], invoices: Invoice[], activePartner: Partner) => {
    const activeKeys = new Set(entitlements.filter((e) => e.status === 'active').map((e) => e.key));
    const openInvoices = invoices.filter((i) => i.status === 'sent' || i.status === 'past_due');
    const rows = buildLedgerRows(agreements, entitlements, invoices, mapPortalHref, navigate, setSpine);

    return (
      <div className="space-y-6">
        {trial.isActive ? (
          <div className={FINELY_OS_NOTICE_SUCCESS}>
            <div className={`font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>30-day free trial is active</div>
            <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              {trial.endsAt ? `Trial ends ${new Date(trial.endsAt).toLocaleDateString()}.` : 'Access is scoped to your onboarding lane.'}
            </p>
            <button type="button" onClick={() => navigate(mapPortalHref('/portal/checkout'))} className={`mt-3 ${FINELY_OS_SUCCESS_BTN}`}>
              Upgrade plan <ArrowRight size={14} />
            </button>
          </div>
        ) : null}

        <div className="fc-wlp-billing-ledger" data-fc-accent="sky">
          <div className="fc-wlp-billing-ledger-summary">
            <div>
              <strong>{agreements.filter((a) => a.status === 'active').length}</strong>
              <em>Active plans</em>
            </div>
            <div>
              <strong>{activeKeys.size}</strong>
              <em>Modules</em>
            </div>
            <div>
              <strong>{openInvoices.length}</strong>
              <em>Open invoices</em>
            </div>
            <div>
              <strong>{billingAccount?.status ?? 'new'}</strong>
              <em>Billing account</em>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="p-8">
              <ProductEmptyState
                title="No billing records yet"
                description="Pick a plan to create your first agreement and unlock portal modules."
                action={
                  <button type="button" className="fc-wlp-btn-primary" onClick={() => setSpine('plans')}>
                    Browse plans
                  </button>
                }
              />
            </div>
          ) : (
            <>
              <div className="fc-wlp-billing-ledger-head">
                <span>Entry</span>
                <span>Amount</span>
                <span>Status</span>
                <span>Action</span>
              </div>
              {rows.map((row) => (
                <button key={row.id} type="button" className="fc-wlp-billing-ledger-row" data-past-due={row.pastDue ? 'true' : undefined} onClick={row.onOpen}>
                  <div>
                    <strong>{row.title}</strong>
                    <span>{row.detail}</span>
                  </div>
                  <div className={`font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{row.amount}</div>
                  <div>{row.status}</div>
                  <span className={FINELY_OS_SECONDARY_BTN}>Open</span>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-3`} data-fc-accent="violet">
            <Wallet size={22} className="text-violet-500" />
            <h3 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Payment rails</h3>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Stripe for short-term plans · in-house financing for 12–36 month terms.</p>
            <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
              Denefit / in-house:{' '}
              {features.denefitsEnabled && isDenefitsConfigured() ? (
                <span className="text-emerald-600">Live contracts configured</span>
              ) : (
                <span className="text-violet-600">Demo — assign contracts in Admin Settings</span>
              )}
            </p>
            {activePartner.denefits?.contractUrl ? (
              <a href={activePartner.denefits.contractUrl} target="_blank" rel="noopener noreferrer" className={FINELY_OS_SUCCESS_BTN}>
                Open assigned contract <ArrowRight size={14} />
              </a>
            ) : (
              <button
                type="button"
                className={FINELY_OS_PRIMARY_BTN}
                onClick={() => navigate('/portal/checkout?package=personal_restore&rail=in_house')}
              >
                Start in-house financing <ArrowRight size={14} />
              </button>
            )}
          </div>

          <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-3`} data-fc-accent="emerald">
            <Shield size={20} className="text-emerald-500" />
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Compliance & consent</div>
            <div className="grid gap-2 max-h-[220px] overflow-y-auto pr-1">
              {CONSENT_ITEMS.slice(0, 4).map((item, idx) => {
                const acceptedAt = (activePartner.consents as Record<string, string | undefined>)?.[item.key];
                return (
                  <label key={item.key} className={`flex items-start gap-2 ${finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])} p-3 cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={Boolean(acceptedAt)}
                      onChange={(e) => {
                        const now = new Date().toISOString();
                        void upsertPartner({
                          ...activePartner,
                          consents: { ...(activePartner.consents ?? {}), [item.key]: e.target.checked ? now : undefined },
                        });
                        setRetryToken((v) => v + 1);
                      }}
                      className="mt-1"
                    />
                    <span className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{item.label}</span>
                  </label>
                );
              })}
            </div>
            <button type="button" onClick={() => navigate(livePath)} className={FINELY_OS_SECONDARY_BTN}>
              All consents <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {partnerFieldDefs.length && partnerFieldLayout ? (
          <details className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8`} data-fc-accent="sky">
            <summary className={`cursor-pointer text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Enterprise profile fields</summary>
            <div className="mt-5">
              <FieldLayoutRenderer
                layout={partnerFieldLayout}
                definitions={partnerFieldDefs}
                values={partnerValues}
                surface="ivory"
                onChangeValue={(key, next, persist) => {
                  if (!activePartner) return;
                  setPartnerValues((prev) => {
                    const merged = { ...(prev || {}), [key]: next };
                    if (persist) upsertCustomFieldValues('partners', activePartner.id, merged, tenantId);
                    return merged;
                  });
                }}
              />
            </div>
          </details>
        ) : null}
      </div>
    );
  };

  const renderBillingControlRoom = (agreements: Agreement[], entitlements: Entitlement[], invoices: Invoice[], activePartner: Partner) => {
    const activeKeys = new Set(entitlements.filter((e) => e.status === 'active').map((e) => e.key));
    const ownedPackageIds = new Set(agreements.map((a) => a.packageId));
    const openInvoices = invoices.filter((i) => i.status === 'sent' || i.status === 'past_due');
    const pastDueInvoices = openInvoices.filter((i) => i.status === 'past_due');
    const activeAgreements = agreements.filter((a) => a.status === 'active');
    const nextInvoice = [...openInvoices].sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0] ?? null;

    const statusTiles: Array<{
      id: BillingSpine;
      value: string;
      label: string;
      hint: string;
      badge?: number;
    }> = [
      {
        id: 'flow',
        value: String(activeAgreements.length),
        label: 'Active services',
        hint: activeAgreements.length ? 'On your account' : 'Pick a plan',
      },
      {
        id: 'invoices',
        value: nextInvoice ? formatShortDate(nextInvoice.dueAt) : '—',
        label: 'Next charge',
        hint: nextInvoice
          ? `${(nextInvoice.totalCents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })} due`
          : 'Nothing scheduled',
        badge: openInvoices.length > 0 ? openInvoices.length : undefined,
      },
      {
        id: 'invoices',
        value: String(openInvoices.length),
        label: 'Open invoices',
        hint: pastDueInvoices.length ? `${pastDueInvoices.length} past due` : openInvoices.length ? 'Due soon' : 'All settled',
        badge: pastDueInvoices.length > 0 ? pastDueInvoices.length : undefined,
      },
      {
        id: 'access',
        value: String(activeKeys.size),
        label: 'Modules unlocked',
        hint: activeKeys.size ? 'Across your plan' : 'Unlock with a plan',
        badge: activeKeys.size > 0 ? activeKeys.size : undefined,
      },
    ];

    return (
      <section className="fc-wlp-section space-y-6" data-surface-layout="control-room">
        <div className="fc-wlp-billing-control-room">
          {pastDueInvoices.length > 0 ? (
            <div className={`fc-wlp-billing-alert-rail ${finelyOsCatalogCard('rose')} p-6 lg:p-8`} data-fc-accent="rose">
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Payment alert</p>
                <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                  {pastDueInvoices.length} invoice{pastDueInvoices.length === 1 ? '' : 's'} past due
                </h2>
                <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Settle open invoices to keep every module active.</p>
              </div>
              <button type="button" onClick={() => setSpine('invoices')} className={FINELY_OS_PRIMARY_BTN}>
                Open invoices <ArrowRight size={14} />
              </button>
            </div>
          ) : trial.isActive ? (
            <div className={`fc-wlp-billing-alert-rail ${finelyOsCatalogCard('emerald')} p-6 lg:p-8`} data-fc-accent="emerald">
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Free trial</p>
                <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>30-day trial is active</h2>
                <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  {trial.endsAt ? `Trial ends ${new Date(trial.endsAt).toLocaleDateString()}.` : 'Access is scoped to your onboarding lane.'}
                </p>
              </div>
              <button type="button" onClick={() => navigate(mapPortalHref('/portal/checkout'))} className={FINELY_OS_SUCCESS_BTN}>
                Upgrade plan <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className={`fc-wlp-billing-alert-rail ${finelyOsCatalogCard('sky')} p-6 lg:p-8`} data-fc-accent="sky">
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Plan status</p>
                <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                  {activeAgreements.length ? `${activeAgreements.length} active service${activeAgreements.length === 1 ? '' : 's'}` : 'No active plan yet'}
                </h2>
                <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  {activeKeys.size ? `${activeKeys.size} modules unlocked` : 'Pick a plan to unlock portal modules.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {guideActions}
                <button type="button" onClick={() => setSpine('plans')} className={FINELY_OS_PRIMARY_BTN}>
                  {activeAgreements.length ? 'Add service' : 'Browse plans'}
                </button>
              </div>
            </div>
          )}

          <div className="fc-wlp-billing-status-grid" role="tablist" aria-label="Billing summary">
            {statusTiles.map((tile, idx) => {
              const accent = (['emerald', 'sky', 'rose', 'violet'] as const)[idx % 4];
              const active = spine === tile.id;
              return (
                <button
                  key={`${tile.id}-${tile.label}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`fc-wlp-billing-status-tile ${finelyOsCatalogCard(accent)}`}
                  data-fc-accent={accent}
                  data-active={active ? 'true' : undefined}
                  onClick={() => setSpine(tile.id)}
                >
                  <strong>{tile.value}</strong>
                  <em>{tile.label}</em>
                  <span>{tile.hint}</span>
                </button>
              );
            })}
          </div>

          <div className="fc-wlp-billing-stage-deck" role="tablist" aria-label="Billing sections">
            {SPINE_ITEMS.map((item) => {
              const Icon = item.icon;
              const badge =
                item.id === 'invoices' ? openInvoices.length : item.id === 'access' ? activeKeys.size : undefined;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={spine === item.id}
                  className="fc-wlp-billing-stage-chip"
                  data-fcm-accent={item.id === 'plans' ? 'violet' : item.id === 'access' ? 'emerald' : item.id === 'invoices' ? 'rose' : 'sky'}
                  data-active={spine === item.id ? 'true' : undefined}
                  onClick={() => setSpine(item.id)}
                >
                  <Icon size={16} />
                  {item.label}
                  {badge ? <span className="fc-wlp-billing-stage-chip-badge">{badge}</span> : null}
                </button>
              );
            })}
          </div>

          <div className="fc-wlp-billing-stage">
            {spine === 'flow' ? renderFlowLedger(agreements, entitlements, invoices, activePartner) : null}
            {spine === 'plans' ? renderPlansPanel(ownedPackageIds) : null}
            {spine === 'access' ? renderAccessPanel(activeKeys) : null}
            {spine === 'invoices' && partnerId ? (
              <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8`} data-fc-accent="rose">
                <InvoiceCenterPanel partnerId={partnerId} isAdmin={isAdmin} />
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => navigate(livePath)} className={FINELY_OS_SECONDARY_BTN}>
              Manage billing profile <ArrowRight size={14} />
            </button>
            <button type="button" onClick={() => navigate('/pricing')} className={FINELY_OS_SECONDARY_BTN}>
              Compare pricing
            </button>
          </div>
        </div>
      </section>
    );
  };

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow={demoSpec?.eyebrow ?? 'Billing & plan'}
        title={demoSpec?.title ?? 'See what you pay for and what it unlocks.'}
        description={demoSpec?.description ?? 'Alert rail, plan summary tiles, and billing sections in one control room.'}
        status={`${demoSpec?.status ?? 'Active · Personal Restore'} · demo data`}
        freshness="demo snapshot"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant="jewel"
        primaryAction={<ProductPagePrimaryAction label={demoSpec?.primaryLabel ?? 'Manage plan'} onClick={() => navigate(livePath)} />}
        metrics={demoSpec?.metrics.map((metric) => ({ ...metric, onClick: () => navigate(livePath) }))}
        metricTitle={demoSpec?.metricTitle}
        metricDescription={demoSpec?.metricDescription}
      >
        <section className="fc-wlp-section space-y-6" data-surface-layout="control-room">
          <div className="fc-wlp-billing-control-room">
            <div className={`fc-wlp-billing-alert-rail ${finelyOsCatalogCard('sky')} p-6 lg:p-8`} data-fc-accent="sky">
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Demo billing</p>
                <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Sample plan and invoice data</h2>
                <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Open live billing to see agreements and invoices on your account.</p>
              </div>
              <button type="button" onClick={() => navigate(livePath)} className={FINELY_OS_PRIMARY_BTN}>
                Open live billing
              </button>
            </div>
            <div className="fc-wlp-billing-stage-deck">
              {SPINE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="fc-wlp-billing-stage-chip"
                    data-active={spine === item.id ? 'true' : undefined}
                    onClick={() => setSpine(item.id)}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="fc-wlp-billing-stage">
              {spine === 'plans' ? renderPlansPanel(new Set()) : null}
            </div>
          </div>
        </section>
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (state.status === 'loading') return <ProductDashboardSkeleton label="Loading your billing" />;

  if (state.status === 'error') {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow="Billing & plan"
        title="See what you pay for and what it unlocks."
        description="Alert rail, plan summary tiles, and billing sections in one control room."
        status="Could not load your billing"
        freshness="just now"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        primaryAction={<ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((v) => v + 1)} />}
      >
        <ProductEmptyState
          title="We couldn't load your billing"
          description={state.message}
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((v) => v + 1)}>
              Try again
            </button>
          }
        />
      </ProductHubScaffold>
    );
  }

  const { agreements, entitlements, invoices, partner: loadedPartner } = state;
  const activeAgreements = agreements.filter((a) => a.status === 'active');
  const activeEntitlements = entitlements.filter((e) => e.status === 'active');
  const openInvoices = invoices.filter((i) => i.status === 'sent' || i.status === 'past_due');
  const pastDueInvoices = openInvoices.filter((i) => i.status === 'past_due');
  const nextInvoice = [...openInvoices].sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0] ?? null;

  const metrics: ProductMetric[] = [
    { label: 'Active services', value: activeAgreements.length, hint: activeAgreements.length ? 'On your account' : 'Pick a plan below', accent: 'emerald', icon: BadgeCheck, onClick: () => setSpine('flow') },
    { label: 'Next charge', value: nextInvoice ? formatShortDate(nextInvoice.dueAt) : '—', hint: nextInvoice ? `${(nextInvoice.totalCents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })} due` : 'Nothing scheduled', accent: 'sky', icon: Receipt, onClick: () => setSpine('invoices') },
    { label: 'Open invoices', value: openInvoices.length, hint: pastDueInvoices.length ? `${pastDueInvoices.length} past due` : openInvoices.length ? 'Due soon' : 'All settled', accent: 'rose', icon: AlertTriangle, onClick: () => setSpine('invoices') },
    { label: 'Modules unlocked', value: activeEntitlements.length, hint: activeEntitlements.length ? 'Across your plan' : 'Unlock with a plan', accent: 'violet', icon: Sparkles, onClick: () => setSpine('access') },
  ];

  const statusHeadline = pastDueInvoices.length
    ? `${pastDueInvoices.length} invoice${pastDueInvoices.length === 1 ? '' : 's'} past due`
    : activeAgreements.length
      ? `Active · ${activeAgreements.length} service${activeAgreements.length === 1 ? '' : 's'}`
      : 'No active plan yet';

  return (
    <ProductHubScaffold
      role={role}
      eyebrow="Billing & plan"
      title="See what you pay for and exactly what it unlocks."
      description="See charges, unlocked modules, invoices, and consents on one screen."
      status={`${statusHeadline} · live data`}
      freshness={formatFreshness(agreements[0]?.updatedAt ?? invoices[0]?.updatedAt)}
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metricsVariant="jewel"
      primaryAction={<ProductPagePrimaryAction label="Manage plan" onClick={() => navigate(livePath)} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/pricing')}>
          Compare pricing
        </button>
      }
      metrics={metrics}
      metricTitle="Plan summary"
      metricDescription="Services, next charge, invoices, and module access."
    >
      {renderBillingControlRoom(agreements, entitlements, invoices, loadedPartner)}
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
    </ProductHubScaffold>
  );
}
