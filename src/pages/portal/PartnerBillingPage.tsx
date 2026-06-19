import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CreditCard, Shield, BadgeCheck, Clock, CheckCircle2, ArrowRight, Star, ExternalLink, Building2 } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { upsertPartner } from '../../data/partnersRepo';
import { ENTITLEMENT_KEYS, ensurePartnerEntitlements, type EntitlementKey } from '../../billing/entitlements';
import { getFeatureFlags, isDenefitsConfigured } from '../../data/settingsRepo';
import {
  createBillingAccount,
  getBillingAccountForPartner,
  getAgreement,
  addAgreementEvent,
  listAgreementsByPartner,
  listEntitlementsByPartner,
  patchAgreement,
  updateAgreementStatus,
  grantEntitlementsFromPackage,
} from '../../data/billingRepo';
import { finalizeStripeCheckout } from '../../lib/commerceStripeBridge';
import { isAdminEmail } from '../../auth/admin';
import { listCustomFieldDefinitionsByScope } from '../../data/customFieldsRepo';
import { getFieldLayout } from '../../data/fieldLayoutsRepo';
import { getCustomFieldValues, upsertCustomFieldValues } from '../../data/customFieldValuesRepo';
import { FieldLayoutRenderer } from '../../components/fields/FieldLayoutRenderer';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { getPackageById, getPackagesByCategory, formatPrice, type PricingCategory } from '../../config/pricingCatalog';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildBillingNoticedItems } from '../../lib/finelyProactiveSignals';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyOsEmptyState } from '../../features/os/FinelyOsEmptyState';
import { InvoiceCenterPanel } from '../../components/billing/InvoiceCenterPanel';
import type { PricingPackage } from '../../config/pricingCatalog';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsInlineListItem,
  finelyOsStatusChip,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

const ACTIVE_ENTITLEMENT_CARD =
  'border-emerald-500/35 bg-emerald-500/10 ring-1 ring-emerald-400/20';

export default function PartnerBillingPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = auth.user?.email || '';
  const { partner } = usePartnerSession();
  const [refreshKey, setRefreshKey] = useState(0);
  const [storeVersion, setStoreVersion] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [stripeHandled, setStripeHandled] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');
  const features = useMemo(() => getFeatureFlags(), []);
  const isAdmin = useMemo(() => (email ? isAdminEmail(String(email)) : false), [email]);
  const allPortalEntitlementKeys = useMemo(() => Object.values(ENTITLEMENT_KEYS) as EntitlementKey[], []);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    setPhoneDraft(partner?.profile.phone ?? '');
  }, [partner?.id]);

  const billingAccount = useMemo(() => {
    if (!partner) return null;
    return getBillingAccountForPartner(partner.id) ?? createBillingAccount(partner.id);
  }, [partner]);

  const tenantId = (partner?.tenantId || '').trim() || FINELY_TENANT_ID;
  const partnerFieldDefs = useMemo(() => listCustomFieldDefinitionsByScope('partners', tenantId), [tenantId, storeVersion]);
  const partnerFieldLayout = useMemo(() => getFieldLayout({ tenantId, scope: 'partners' }), [tenantId, storeVersion]);
  const partnerValuesRecord = useMemo(
    () => (partner ? getCustomFieldValues('partners', partner.id, tenantId) : null),
    [partner?.id, tenantId, storeVersion],
  );
  const [partnerValues, setPartnerValues] = useState<Record<string, any>>(partnerValuesRecord?.values ?? {});

  useEffect(() => {
    setPartnerValues(partnerValuesRecord?.values ?? {});
  }, [partnerValuesRecord?.updatedAt, partner?.id]);

  useEffect(() => {
    if (!auth.user || !partner) return;
    if (stripeHandled) return;

    let stripe: string | null = null;
    let sessionId: string | null = null;
    let agreementId: string | null = null;
    try {
      const sp = new URLSearchParams(location.search);
      stripe = sp.get('stripe');
      sessionId = sp.get('session_id');
      agreementId = sp.get('agreementId');
    } catch {
      stripe = null;
      sessionId = null;
      agreementId = null;
    }

    if (!stripe) return;

    // Cancel: just show message and clean URL.
    if (stripe === 'cancel') {
      setStripeHandled(true);
      setNotice('Checkout cancelled. If you had questions, book a free strategy call and we’ll match the safest plan.');
      navigate('/portal/billing', { replace: true });
      return;
    }

    // Success: verify with Stripe, then activate local agreement + grant entitlements.
    if (stripe === 'success' && sessionId && agreementId) {
      setStripeHandled(true);
      (async () => {
        try {
          setNotice('Payment verified. Activating your plan…');
          const result = await finalizeStripeCheckout({
            partnerId: partner.id,
            sessionId,
            agreementId,
          });
          if (!result.ok) {
            setNotice(result.message);
          } else {
            setNotice(result.message);
          }
          setRefreshKey((k) => k + 1);
        } catch (e: any) {
          setNotice(e?.message || 'Could not verify payment. Please contact support.');
        } finally {
          navigate('/portal/billing', { replace: true });
        }
      })();
    }
  }, [auth.user, location.search, navigate, partner, stripeHandled]);

  const agreements = useMemo(
    () => (partner ? listAgreementsByPartner(partner.id) : []),
    [partner, refreshKey],
  );
  const entitlements = useMemo(
    () => (partner ? listEntitlementsByPartner(partner.id) : []),
    [partner, refreshKey],
  );
  const activeEntitlementKeys = useMemo(
    () => new Set(entitlements.filter((e) => e.status === 'active').map((e) => e.key)),
    [entitlements],
  );
  const trial = useMemo(() => {
    const now = new Date().toISOString();
    const activeTrial = entitlements
      .filter((e) => e.status === 'active')
      .filter((e) => e.sourceAgreementId === 'trial_30d')
      .filter((e) => !e.endsAt || e.endsAt > now);
    const endsAt = activeTrial.map((e) => e.endsAt).filter(Boolean).sort().at(-1) ?? null;
    return {
      isActive: activeTrial.length > 0,
      endsAt,
      keys: Array.from(new Set(activeTrial.map((e) => e.key))).sort(),
    };
  }, [entitlements]);
  const entitlementLabel = useMemo(() => {
    const m: Record<string, string> = {
      [ENTITLEMENT_KEYS.reports]: 'Credit reports',
      [ENTITLEMENT_KEYS.documents]: 'Documents vault',
      [ENTITLEMENT_KEYS.messages]: 'Messages & support',
      [ENTITLEMENT_KEYS.tasks]: 'Tasks & notifications',
      [ENTITLEMENT_KEYS.disputes]: 'Dispute center',
      [ENTITLEMENT_KEYS.letters]: 'Letters (studio + vault)',
      [ENTITLEMENT_KEYS.debt]: 'Debt & summons',
      [ENTITLEMENT_KEYS.escalations]: 'Complaints & escalations',
      [ENTITLEMENT_KEYS.identityTheft]: 'Identity theft center',
      [ENTITLEMENT_KEYS.businessBuild]: 'Credit building center',
      [ENTITLEMENT_KEYS.packBankruptcy]: 'Letter Pack: Bankruptcy',
      [ENTITLEMENT_KEYS.packRepossession]: 'Letter Pack: Repossession',
      [ENTITLEMENT_KEYS.packForeclosure]: 'Letter Pack: Foreclosure',
      [ENTITLEMENT_KEYS.packStudentLoans]: 'Letter Pack: Student loans',
      [ENTITLEMENT_KEYS.packInquiries]: 'Letter Pack: Inquiries',
    };
    return (key: string) => m[key] ?? key;
  }, []);

  const recommendedCategory = useMemo<PricingCategory>(() => {
    const lane = String((partner as any)?.lane || '').trim();
    const route = String(partner?.primaryRoute || '').trim();
    const intake = partner?.primaryRoute ? (partner?.routes as any)?.[partner.primaryRoute] : null;
    const goal = String(intake?.goal || '').trim();
    if (lane === 'business_credit' || route === 'business_build' || goal === 'business') return 'business_credit';
    if (lane === 'debt_kill' || goal === 'debt') return 'debt_legal';
    return 'personal_credit';
  }, [partner]);

  const planCategories: Array<{ id: PricingCategory; label: string; hint: string }> = useMemo(
    () => [
      { id: 'personal_credit', label: 'Personal', hint: 'Free/Core/Restore + letter packs' },
      { id: 'business_credit', label: 'Business', hint: 'Fundability + vendor sequencing' },
      { id: 'debt_legal', label: 'Debt & Legal', hint: 'DV, court answers, summons workflow' },
    ],
    [],
  );

  const [planCategory, setPlanCategory] = useState<PricingCategory>(recommendedCategory);
  type BillingTab = 'profile' | 'account' | 'access' | 'plans' | 'invoices';
  const [searchParams] = useSearchParams();
  const [billingTab, setBillingTab] = useState<BillingTab>(() => {
    const t = searchParams.get('tab');
    if (t === 'invoices' || t === 'account' || t === 'access' || t === 'plans') return t;
    return 'profile';
  });

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'invoices' || t === 'account' || t === 'access' || t === 'plans' || t === 'profile') {
      setBillingTab(t);
    }
  }, [searchParams]);

  useEffect(() => {
    setPlanCategory(recommendedCategory);
  }, [recommendedCategory]);

  const packagesByCategory = useMemo(() => {
    const list = getPackagesByCategory(planCategory).filter((p) => p.isPublic);
    return list.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [planCategory, refreshKey]);

  return (
    <PageShell
      badge="Partner Portal"
      title="Profile & Billing"
      subtitle="Account profile, billing, and compliance settings. Payments are processed via Stripe or in‑house financing depending on your plan."
    >
      {!partner ? (
        <div className={FINELY_OS_PAGE}>
          <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>
            No partner profile found for this account. If you're an admin, use Partner Management to pick a partner.
          </div>
          <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_PRIMARY_BTN}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <div className={FINELY_OS_PAGE}>
          {notice && (
            <div className={`${FINELY_OS_NOTICE_WARN} flex items-center gap-3`}>
              <CheckCircle2 size={18} className="text-fuchsia-300 shrink-0" />
              {notice}
            </div>
          )}

          {trial.isActive && (
            <div className={FINELY_OS_NOTICE_SUCCESS}>
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-emerald-300 mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>30‑day free trial is active</div>
                  <div className={FINELY_OS_ENTITY_BODY}>
                    Access is scoped to your onboarding lane. {trial.endsAt ? `Trial ends ${new Date(trial.endsAt).toLocaleDateString()}.` : ''}
                  </div>
                  {trial.keys.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {trial.keys.slice(0, 10).map((k) => (
                        <span key={k} className={finelyOsStatusChip('ok')}>
                          {entitlementLabel(k)}
                        </span>
                      ))}
                      {trial.keys.length > 10 && <span className={FINELY_OS_ENTITY_CHIP}>+{trial.keys.length - 10} more</span>}
                    </div>
                  )}
                  <div className="pt-2">
                    <button type="button" onClick={() => navigate('/portal/checkout')} className={FINELY_OS_SUCCESS_BTN}>
                      Upgrade plan <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK} title="Back to Partner Dashboard">
              <ArrowLeft size={16} /> Partner Dashboard
            </button>
            <button
              type="button"
              onClick={() => {
                setBillingTab('plans');
                setTimeout(() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' }), 50);
              }}
              className={FINELY_OS_SECONDARY_BTN}
            >
              New plan <ArrowRight size={14} />
            </button>
          </div>

          <FinelyNoticedStrip
            items={buildBillingNoticedItems({
              trialActive: trial.isActive,
              activeModuleCount: activeEntitlementKeys.size,
              billingStatus: billingAccount?.status,
            })}
          />

          <FinelyNowDoThisStrip currentIndex={billingTab === 'profile' ? 0 : 1} />

          <FinelyUnifiedHubLayout
            eyebrow="Profile & billing"
            title="Account, entitlements & plans"
            subtitle="Profile, Stripe or in-house rails, module access, and hybrid plan catalog."
            accent="sky"
            kpis={[
              { label: 'Agreements', value: String(agreements.length), hint: 'Active + draft', accent: 'violet' },
              { label: 'Modules', value: String(activeEntitlementKeys.size), hint: 'Unlocked', accent: 'emerald' },
              { label: 'Trial', value: trial.isActive ? 'Active' : '—', hint: '30-day', accent: 'amber' },
              { label: 'Billing', value: billingAccount?.status ?? 'new', hint: 'Account', accent: 'sky' },
            ]}
            tabs={[
              { id: 'profile', label: 'Profile' },
              { id: 'account', label: 'Billing', badge: agreements.length || undefined },
              { id: 'invoices', label: 'Invoices' },
              { id: 'access', label: 'Module access', badge: activeEntitlementKeys.size || undefined },
              { id: 'plans', label: 'Plans' },
            ]}
            activeTab={billingTab}
            onTabChange={(id) => setBillingTab(id as BillingTab)}
            primaryAction={{ label: 'Open checkout', onClick: () => navigate('/portal/checkout') }}
            secondaryAction={{ label: 'Compare pricing', onClick: () => navigate('/pricing') }}
          >
          {billingTab === 'profile' && (
          <>
          <div className="grid lg:grid-cols-12 gap-6">
            <div className={`lg:col-span-7 min-w-0 ${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
                <Shield size={18} />
                <span>Profile</span>
              </div>
              <div className={FINELY_OS_ENTITY_BODY}>
                <div className={FINELY_OS_ENTITY_VALUE}>{partner.profile.fullName}</div>
                <div className="mt-1">{partner.profile.email || email || '—'}</div>
                <div className="mt-4 grid md:grid-cols-3 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className={FINELY_OS_ENTITY_LABEL}>Phone</label>
                    <input
                      value={phoneDraft}
                      onChange={(e) => setPhoneDraft(e.target.value)}
                      className={FINELY_OS_ENTITY_INPUT}
                      placeholder="(555) 555-5555"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextPhone = phoneDraft.trim() || undefined;
                      void upsertPartner({ ...partner, profile: { ...partner.profile, phone: nextPhone } });
                      setNotice('Profile updated.');
                      setTimeout(() => setNotice(null), 2500);
                    }}
                    className={FINELY_OS_SUCCESS_BTN}
                  >
                    Save
                  </button>
                </div>
              </div>
              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony ${FINELY_OS_ENTITY_BODY}`}>
                Keep your contact information current so we can support your workflow, deadlines, and document requests.
              </div>
            </div>
          </div>

            {partnerFieldDefs.length ? (
            <details className={`${finelyOsCatalogCard('violet')} !p-5`}>
              <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_VALUE}`}>
                Enterprise profile fields <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-normal`}>(advanced)</span>
              </summary>
              <div className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>
                Optional fields for letter-ready identity/address data, monitoring credentials, and underwriting readiness. Saved to your profile.
              </div>
              <div className="mt-5">
                <FieldLayoutRenderer
                  layout={partnerFieldLayout}
                  definitions={partnerFieldDefs}
                  values={partnerValues}
                  onChangeValue={(key, next, persist) => {
                    if (!partner) return;
                    setPartnerValues((prev) => {
                      const merged = { ...(prev || {}), [key]: next };
                      if (persist) upsertCustomFieldValues('partners', partner.id, merged, tenantId);
                      return merged;
                    });
                  }}
                />
              </div>
            </details>
          ) : null}

          <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
              <Shield size={18} />
              <span>Compliance & consent</span>
            </div>
            <p className={FINELY_OS_ENTITY_BODY}>
              These acknowledgements help keep your file processing consistent across bureaus and support workflows.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  key: 'termsAcceptedAt' as const,
                  label: 'I agree to the Terms',
                  href: '/terms',
                },
                {
                  key: 'privacyAcceptedAt' as const,
                  label: 'I agree to the Privacy Policy',
                  href: '/privacy',
                },
                {
                  key: 'disclaimerAcceptedAt' as const,
                  label: 'I acknowledge the Disclaimer',
                  href: '/disclaimer',
                },
                {
                  key: 'communicationConsentAt' as const,
                  label: 'I consent to communication regarding my case (email/in-app)',
                  href: '/portal/messages',
                },
                {
                  key: 'ndaAcceptedAt' as const,
                  label: 'Mutual NDA (confidentiality)',
                  href: '/terms#confidentiality',
                },
                {
                  key: 'servicesAgreementAcceptedAt' as const,
                  label: 'Services agreement',
                  href: '/terms#services',
                },
                {
                  key: 'debtServicesAcceptedAt' as const,
                  label: 'Debt & collections workflow acknowledgment',
                  href: '/disclaimer#debt',
                },
              ].map((x) => {
                const acceptedAt = (partner.consents as any)?.[x.key] as string | undefined;
                return (
                  <div key={x.key} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(acceptedAt)}
                        onChange={(e) => {
                          const now = new Date().toISOString();
                          const next = {
                            ...partner,
                            consents: {
                              ...(partner.consents ?? {}),
                              [x.key]: e.target.checked ? now : undefined,
                            } as any,
                          };
                          void upsertPartner(next);
                          setRefreshKey((k) => k + 1);
                        }}
                        className="mt-1 accent-violet-600"
                      />
                      <div className="min-w-0">
                        <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{x.label}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          {acceptedAt ? `accepted ${new Date(acceptedAt).toLocaleString()}` : 'not accepted'}
                        </div>
                      </div>
                    </label>
                    <button type="button" onClick={() => navigate(x.href)} className={FINELY_OS_SECONDARY_BTN}>
                      Open <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          </>
          )}

          {billingTab === 'account' && (
          <>
            <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>
                <CreditCard size={18} />
                <span>Billing account</span>
              </div>
              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony ${FINELY_OS_ENTITY_BODY} space-y-2`}>
                <div className={`${FINELY_OS_ENTITY_VALUE} text-base`}>Billing account</div>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>status</div>
                <div>{billingAccount?.status ?? 'not created'}</div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-3`}>rails</div>
                <div className="space-y-1">
                  <div>Stripe (short-term plans) · In-house financing (12–36 months)</div>
                  <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                    Denefit / in-house:{' '}
                    {features.denefitsEnabled && isDenefitsConfigured() ? (
                      <span className="text-emerald-300">Live contracts configured</span>
                    ) : (
                      <span className="text-amber-300">Demo — assign contracts in Admin Settings → In‑House Financing</span>
                    )}
                  </div>
                </div>
              </div>

              {partner.denefits?.contractUrl ? (
                <div className={FINELY_OS_NOTICE_SUCCESS}>
                  <div className="inline-flex items-center gap-2 text-emerald-300 mb-2">
                    <Building2 size={18} />
                    <span className={`${FINELY_OS_ENTITY_SUBLABEL}`}>Assigned in‑house financing contract</span>
                  </div>
                  <div className={FINELY_OS_ENTITY_BODY}>
                    {partner.denefits.label ? <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{partner.denefits.label}</span> : 'A contract has been assigned to your account.'}
                  </div>
                  {!features.denefitsEnabled ? (
                    <div className={`text-xs ${FINELY_OS_ENTITY_BODY} mt-2`}>
                      Note: In-house financing is currently disabled in platform settings, but your contract link is still available.
                    </div>
                  ) : null}
                  <a
                    href={partner.denefits.contractUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-3 ${FINELY_OS_SUCCESS_BTN}`}
                  >
                    Open contract <ExternalLink size={14} />
                  </a>
                  {partner.denefits.assignedAt ? (
                    <div className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>Assigned: {new Date(partner.denefits.assignedAt).toLocaleString()}</div>
                  ) : null}
                </div>
              ) : null}
            </div>

          <div className="grid lg:grid-cols-12 gap-6">
            <div className={`lg:col-span-7 min-w-0 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>
                <BadgeCheck size={18} />
                <span>Active agreements</span>
              </div>
              {agreements.length === 0 ? (
                <div className={FINELY_OS_ENTITY_BODY}>
                  No agreements yet. Select a plan below to create a draft (Stripe) or pending review (in-house financing).
                </div>
              ) : (
                <FinelyOsPaginatedStack
                  items={agreements}
                  pageSize={4}
                  itemSpacingClassName="space-y-3"
                  renderItem={(agreement) => {
                    const pkg = getPackageById(agreement.packageId);
                    const title = pkg?.name ?? agreement.packageId;
                    const priceLine = pkg
                      ? `${formatPrice(pkg.priceAmount)}${pkg.interval === 'month' ? ' / month' : ''}${pkg.termMonths ? ` • ${pkg.termMonths} mo` : ''}`
                      : `${(agreement.amountCents / 100).toLocaleString()} cents`;
                    return (
                      <div key={agreement.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-1`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className={FINELY_OS_ENTITY_VALUE}>{title}</div>
                          <div className={FINELY_OS_ENTITY_SUBLABEL}>{agreement.rail === 'stripe' ? 'Stripe' : 'In-house'}</div>
                        </div>
                        <div className={FINELY_OS_ENTITY_BODY}>{priceLine}</div>
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>status: {agreement.status}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/portal/checkout?package=${encodeURIComponent(agreement.packageId)}`)}
                            className={FINELY_OS_SECONDARY_BTN}
                          >
                            View in checkout <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  }}
                />
              )}
            </div>

            <div className={`lg:col-span-5 min-w-0 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>
                <CheckCircle2 size={18} />
                <span>Entitlements</span>
              </div>
              {entitlements.length === 0 ? (
                <div className="space-y-4">
                  <FinelyOsEmptyState
                    icon={BadgeCheck}
                    title="No modules unlocked yet"
                    description="Entitlements activate after checkout completes and payment webhooks confirm. Pick a plan below to get started."
                    primaryAction={{
                      label: 'Browse plans',
                      onClick: () => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' }),
                    }}
                    secondaryAction={{
                      label: 'Open checkout',
                      onClick: () => navigate('/portal/checkout'),
                    }}
                  />
                  {isAdmin ? (
                    <div>
                      <button
                        type="button"
                        className={FINELY_OS_SUCCESS_BTN}
                        onClick={() => {
                          if (!partner) return;
                          ensurePartnerEntitlements({ partnerId: partner.id, keys: allPortalEntitlementKeys, sourceAgreementId: 'admin_demo_unlock' });
                          setNotice('Admin demo: portal modules unlocked for this partner on this device.');
                          setRefreshKey((k) => k + 1);
                        }}
                        title="Admin-only dev shortcut: unlock all portal modules locally"
                      >
                        Admin demo: unlock all modules <ArrowRight size={14} />
                      </button>
                      <div className={`mt-2 text-[11px] ${FINELY_OS_ENTITY_SUBLABEL}`}>Local/dev unlock only — no Stripe, no API usage.</div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <FinelyOsPaginatedStack
                  items={entitlements}
                  pageSize={6}
                  itemSpacingClassName="space-y-2"
                  renderItem={(entitlement) => (
                    <div key={entitlement.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-sm`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{entitlementLabel(entitlement.key)}</div>
                          <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} truncate`}>{entitlement.key}</div>
                          {entitlement.endsAt && (
                            <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} truncate`}>ends: {new Date(entitlement.endsAt).toLocaleDateString()}</div>
                          )}
                        </div>
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>{entitlement.status}</div>
                      </div>
                    </div>
                  )}
                />
              )}
            </div>
          </div>
          </>
          )}

          {billingTab === 'access' && (
          <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>
                <BadgeCheck size={18} />
                <span>Module access</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('plans-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={FINELY_OS_SECONDARY_BTN}
              >
                Unlock modules <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  key: ENTITLEMENT_KEYS.reports,
                  title: 'Credit reports',
                  desc: 'Upload + parse reports and view dispute candidates with insights.',
                  href: '/portal/reports',
                },
                {
                  key: ENTITLEMENT_KEYS.disputes,
                  title: 'Dispute center',
                  desc: 'Create disputes, track rounds, and generate letters.',
                  href: '/portal/disputes',
                },
                {
                  key: ENTITLEMENT_KEYS.letters,
                  title: 'Letters studio',
                  desc: 'Generate letters (dispute + debt), save PDFs to your Letters Vault.',
                  href: '/portal/letters',
                },
                {
                  key: ENTITLEMENT_KEYS.documents,
                  title: 'Documents vault',
                  desc: 'Store and retrieve documents and evidence files.',
                  href: '/portal/documents',
                },
                {
                  key: ENTITLEMENT_KEYS.debt,
                  title: 'Debt & summons',
                  desc: 'Track debt items, deadlines, and supporting documents.',
                  href: '/portal/debt',
                },
              ].map((m) => {
                const active = activeEntitlementKeys.has(m.key);
                return (
                  <div
                    key={m.key}
                    className={`rounded-2xl border p-5 space-y-3 ${
                      active
                        ? ACTIVE_ENTITLEMENT_CARD
                        : finelyOsInlineListItem()
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={FINELY_OS_ENTITY_VALUE}>{m.title}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>{m.key}</div>
                      </div>
                      <span className={active ? finelyOsStatusChip('ok') : finelyOsStatusChip('warn')}>{active ? 'Unlocked' : 'Locked'}</span>
                    </div>
                    <div className={FINELY_OS_ENTITY_BODY}>{m.desc}</div>
                    <button
                      type="button"
                      disabled={!active}
                      onClick={() => navigate(m.href)}
                      className={`w-full ${active ? FINELY_OS_SUCCESS_BTN : FINELY_OS_SECONDARY_BTN} disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      Open <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                {
                  key: ENTITLEMENT_KEYS.messages,
                  title: 'Messages & support',
                  desc: 'In-app support, updates, and case communications.',
                  href: '/portal/messages',
                },
                {
                  key: ENTITLEMENT_KEYS.escalations,
                  title: 'Complaints & escalations',
                  desc: 'Manage complaints, regulators, and escalation timelines.',
                  href: '/portal/escalations',
                },
                {
                  key: ENTITLEMENT_KEYS.identityTheft,
                  title: 'Identity theft center',
                  desc: 'Identity theft workflow, affidavits, and supporting evidence.',
                  href: '/portal/identity-theft',
                },
                {
                  key: ENTITLEMENT_KEYS.tasks,
                  title: 'Tasks & notifications',
                  desc: 'Deadlines, action items, and status nudges in one place.',
                  href: '/portal/projects',
                },
                {
                  key: ENTITLEMENT_KEYS.businessBuild,
                  title: 'Credit building center',
                  desc: 'Vendor sequencing + building workflow (business build).',
                  href: '/portal/build',
                },
              ].map((m) => {
                const active = activeEntitlementKeys.has(m.key);
                return (
                  <div
                    key={m.key}
                    className={`rounded-2xl border p-5 space-y-3 ${
                      active
                        ? ACTIVE_ENTITLEMENT_CARD
                        : finelyOsInlineListItem()
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={FINELY_OS_ENTITY_VALUE}>{m.title}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>{m.key}</div>
                      </div>
                      <span className={active ? finelyOsStatusChip('ok') : finelyOsStatusChip('warn')}>{active ? 'Unlocked' : 'Locked'}</span>
                    </div>
                    <div className={FINELY_OS_ENTITY_BODY}>{m.desc}</div>
                    <button
                      type="button"
                      disabled={!active}
                      onClick={() => navigate(m.href)}
                      className={`w-full ${active ? FINELY_OS_SUCCESS_BTN : FINELY_OS_SECONDARY_BTN} disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      Open <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {billingTab === 'invoices' && partner ? (
            <InvoiceCenterPanel partnerId={partner.id} isAdmin={isAdmin} />
          ) : billingTab === 'invoices' ? (
            <FinelyOsEmptyState title="Sign in required" description="Complete onboarding to view invoices." />
          ) : null}

          {billingTab === 'plans' && (
          <div id="plans-section" className={`${finelyOsCatalogCard('violet')} !p-5 space-y-6`}>
            <div className={`flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>
              <Clock size={18} />
              <span>Plans (hybrid)</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className={FINELY_OS_VIEW_TABS}>
                {planCategories.map((c) => {
                  const active = c.id === planCategory;
                  const rec = c.id === recommendedCategory;
                  return (
                    <button key={c.id} type="button" onClick={() => setPlanCategory(c.id)} className={finelyOsViewTab(active, 'emerald')} title={c.hint}>
                      {c.label}
                      {rec ? <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-black tracking-widest">★</span> : null}
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={() => navigate('/portal/checkout')} className={FINELY_OS_SECONDARY_BTN} title="Open full checkout catalog">
                Open checkout <ArrowRight size={14} />
              </button>
            </div>

            <FinelyOsPaginatedStack
              key={planCategory}
              items={packagesByCategory}
              pageSize={9}
              itemSpacingClassName="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
              emptyMessage="No packages in this category."
              renderItem={(pkg: PricingPackage) => {
                const isRecommended = pkg.category === recommendedCategory && (pkg.badge === 'Most Popular' || pkg.id.endsWith('_core') || pkg.id === 'personal_free');
                const priceLine =
                  pkg.priceAmount <= 0
                    ? 'Free'
                    : `${formatPrice(pkg.priceAmount)}${pkg.interval === 'month' ? ' / month' : ''}${pkg.termMonths ? ` • ${pkg.termMonths} mo` : ''}`;
                const rails =
                  pkg.rail === 'both' ? 'Stripe + in-house' : pkg.rail === 'stripe' ? 'Stripe' : pkg.rail === 'in_house' ? 'In-house' : String(pkg.rail);
                return (
                  <div
                    key={pkg.id}
                    className={`relative rounded-2xl border p-5 space-y-3 transition-all ${
                      isRecommended
                        ? `${finelyOsCatalogCard('violet')} !p-5 border-amber-500/40 ring-1 ring-amber-500/25 shadow-[0_0_24px_rgba(245,158,11,0.08)]`
                        : finelyOsInlineListItem()
                    }`}
                  >
                    {isRecommended ? (
                      <div className="absolute -top-3 left-4 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1 shadow-md">
                        <Star size={10} fill="currentColor" /> Recommended
                      </div>
                    ) : null}
                    <div className="pt-2">
                      <div className={FINELY_OS_ENTITY_VALUE}>{pkg.name}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                        {pkg.delivery} • {rails}
                        {pkg.badge ? ` • ${pkg.badge}` : ''}
                      </div>
                    </div>
                    <div className="text-amber-300 text-lg font-semibold">{priceLine}</div>
                    <div className={`${FINELY_OS_ENTITY_BODY} line-clamp-3`}>{pkg.description}</div>

                    <div className="pt-1 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/portal/checkout?package=${encodeURIComponent(pkg.id)}`)}
                        className={FINELY_OS_SUCCESS_BTN}
                      >
                        Select <ArrowRight size={14} />
                      </button>
                      <button type="button" onClick={() => navigate('/pricing')} className={FINELY_OS_SECONDARY_BTN}>
                        Compare <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              }}
            />
          </div>
          )}
          </FinelyUnifiedHubLayout>

          <FinelyOsPageFooter />
        </div>
      )}
    </PageShell>
  );
}
