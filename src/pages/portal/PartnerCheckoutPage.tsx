import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CreditCard, Building2, CheckCircle2, Clock, Shield, Sparkles, ExternalLink } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import {
  createBillingAccount,
  getBillingAccountForPartner,
  createAgreementFromPackage,
  grantEntitlementsFromPackage,
  updateAgreementStatus,
} from '../../data/billingRepo';
import {
  getPackageById,
  getPackagesByCategory,
  formatPrice,
  type PricingCategory,
  type PricingPackage,
} from '../../config/pricingCatalog';
import { getDenefitsContractForPackage, getFeatureFlags, getPricingControls, isStripeConfigured, isDenefitsConfigured } from '../../data/settingsRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { createStripeCheckoutSession } from '../../lib/stripeCheckoutClient';
import { BILLING_DEMO_CHECKOUT_HINT } from '../../billing/orchestrator';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { PricingPackageCatalog } from '../../components/pricing/PricingPackageCatalog';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsListItem,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

export default function PartnerCheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { partner } = usePartnerSession();
  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  // Get package ID from URL params (e.g., /portal/checkout?package=personal_restore)
  const packageIdFromUrl = searchParams.get('package');
  const categoryFromUrl = (searchParams.get('category') as PricingCategory | null) || null;
  const railFromUrl = searchParams.get('rail') as 'stripe' | 'in_house' | null;

  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(packageIdFromUrl);
  const [selectedRail, setSelectedRail] = useState<'stripe' | 'in_house' | null>(railFromUrl);
  const [selectedCategory, setSelectedCategory] = useState<PricingCategory>(() => {
    if (categoryFromUrl) return categoryFromUrl;
    const lane = String((partner as any)?.lane || '').trim();
    if (lane === 'business_credit') return 'business_credit';
    if (lane === 'debt_kill') return 'debt_legal';
    return 'personal_credit';
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showFinancingEmbed, setShowFinancingEmbed] = useState(false);
  type CheckoutTab = 'catalog' | 'package' | 'payment';
  const [checkoutTab, setCheckoutTab] = useState<CheckoutTab>(packageIdFromUrl ? 'package' : 'catalog');

  const features = getFeatureFlags();
  const stripeReady = useMemo(() => Boolean(features.stripeEnabled && isStripeConfigured()), [features.stripeEnabled]);
  const denefitsReady = useMemo(() => Boolean(features.denefitsEnabled && isDenefitsConfigured()), [features.denefitsEnabled]);
  const packageOverrides = useMemo(() => getPricingControls().packageOverrides ?? {}, [storeVersion]);
  const applyOverride = (p: PricingPackage): PricingPackage => {
    const ov = (packageOverrides as any)?.[p.id] as any;
    if (!ov) return p;
    return {
      ...p,
      ...ov,
      badgeByRail: { ...(p.badgeByRail ?? {}), ...(ov.badgeByRail ?? {}) },
      scopeBulletsByRail: { ...(p.scopeBulletsByRail ?? {}), ...(ov.scopeBulletsByRail ?? {}) },
    };
  };
  const selectedPackage = selectedPackageId ? (getPackageById(selectedPackageId) ? applyOverride(getPackageById(selectedPackageId)!) : null) : null;
  const isFreeSelected = (selectedPackage?.priceAmount ?? 0) <= 0;
  const denefitsContract = selectedPackageId ? getDenefitsContractForPackage(selectedPackageId) : null;
  const assignedContract = partner?.denefits?.contractUrl ? { contractUrl: partner.denefits.contractUrl, label: partner.denefits.label } : null;

  // Default to personal credit packages if no package selected
  const availablePackages = useMemo(() => {
    if (selectedPackage) return [selectedPackage];
    const list = getPackagesByCategory(selectedCategory).filter((p) => p.isPublic).map(applyOverride);
    // Keep “starter/core/free” earlier by catalog sortOrder.
    return list.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [selectedCategory, selectedPackage, storeVersion]);

  const billingAccount = useMemo(() => {
    if (!partner) return null;
    const existing = getBillingAccountForPartner(partner.id);
    if (existing) return existing;
    return createBillingAccount(partner.id, partner.tenantId ?? FINELY_TENANT_ID);
  }, [partner]);

  // If package from URL is valid, auto-select it
  useEffect(() => {
    if (packageIdFromUrl) {
      const pkg = getPackageById(packageIdFromUrl);
      if (pkg) {
        setSelectedPackageId(packageIdFromUrl);
        setSelectedCategory(pkg.category);
      }
    }
  }, [packageIdFromUrl]);

  useEffect(() => {
    if (!categoryFromUrl) return;
    setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  const canUseStripe = (pkg: PricingPackage) => {
    return stripeReady && (pkg.rail === 'stripe' || pkg.rail === 'both');
  };

  const canUseDenefits = (pkg: PricingPackage) => {
    return denefitsReady && (pkg.rail === 'in_house' || pkg.rail === 'both');
  };

  const handleSelectPackage = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    setSelectedRail(null);
    setCheckoutTab('package');
  };

  const handleSubmit = () => {
    if (!partner || !billingAccount || !selectedPackageId) return;

    const pkg = getPackageById(selectedPackageId);
    if (!pkg) return;

    const isFree = (pkg.priceAmount ?? 0) <= 0;
    const rail: 'stripe' | 'in_house' | null = isFree ? 'stripe' : selectedRail;
    if (!rail) return;

    if (isFree) {
      const agreement = createAgreementFromPackage({
        tenantId: partner.tenantId ?? FINELY_TENANT_ID,
        partnerId: partner.id,
        billingAccountId: billingAccount.id,
        packageId: selectedPackageId,
        rail: 'stripe',
        status: 'active',
      });
      if (!agreement) {
        setNotice('Error activating free access. Please try again.');
        return;
      }
      grantEntitlementsFromPackage({
        tenantId: partner.tenantId ?? FINELY_TENANT_ID,
        partnerId: partner.id,
        packageId: selectedPackageId,
        sourceAgreementId: agreement.id,
        rail: 'stripe',
      });
      setSubmitted(true);
      setNotice('Free access activated. Upgrade any time to unlock Letters.');
      return;
    }

    // For in-house financing, check if we have a contract URL and redirect
    if (rail === 'in_house') {
      // Prefer partner-assigned custom contract if present.
      const contractUrl = partner?.denefits?.contractUrl || getDenefitsContractForPackage(selectedPackageId)?.contractUrl;
      if (contractUrl) {
        // Open embedded financing flow (redirect or iframe)
        setShowFinancingEmbed(true);
        return;
      }
    }

    // Create agreement
    const agreement = createAgreementFromPackage({
      tenantId: partner.tenantId ?? FINELY_TENANT_ID,
      partnerId: partner.id,
      billingAccountId: billingAccount.id,
      packageId: selectedPackageId,
      rail,
      denefitsContractUrl: denefitsContract?.contractUrl,
    });

    if (!agreement) {
      setNotice('Error creating agreement. Please try again.');
      return;
    }

    // Stripe: redirect to secure Checkout session (live flow)
    if (rail === 'stripe') {
      setNotice('Redirecting you to secure checkout…');
      setSubmitted(true);

      // Fire-and-forget redirect; verification + activation occurs on /portal/billing return.
      createStripeCheckoutSession({
        agreementId: agreement.id,
        tenantId: partner.tenantId ?? FINELY_TENANT_ID,
        partnerId: partner.id,
        packageId: selectedPackageId,
        amountCents: pkg.priceAmount,
      })
        .then(({ url }) => {
          window.location.assign(url);
        })
        .catch((e: any) => {
          setSubmitted(false);
          setNotice(e?.message || 'Checkout unavailable. Please try again or contact support.');
        });
    } else {
      setNotice(
        'Financing application received. Your agreement is pending review. You will receive confirmation shortly.'
      );
    }

    if (rail !== 'stripe') setSubmitted(true);
  };

  const handleFinancingComplete = () => {
    // Called after financing embed completes (in real implementation)
    if (!partner || !billingAccount || !selectedPackageId) return;

    const agreement = createAgreementFromPackage({
      tenantId: partner.tenantId ?? FINELY_TENANT_ID,
      partnerId: partner.id,
      billingAccountId: billingAccount.id,
      packageId: selectedPackageId,
      rail: 'in_house',
      denefitsContractUrl: denefitsContract?.contractUrl,
    });

    if (agreement) {
      // Financing typically starts as pending until first payment
      updateAgreementStatus(agreement.id, 'pending_review');
    }

    setShowFinancingEmbed(false);
    setSubmitted(true);
    setNotice(
      'Financing contract submitted! Your payments will report to Equifax, helping you build credit. We\'ll activate your services once your first payment clears.'
    );
  };

  if (!partner) {
    return (
      <PageShell badge="Partner Portal" title="Checkout" subtitle="Select your plan.">
        <div className={FINELY_OS_PAGE}>
          <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>No partner profile found. Complete onboarding first.</div>
          <button type="button" onClick={() => navigate('/onboarding')} className={FINELY_OS_SUCCESS_BTN}>
            Start onboarding <ArrowRight size={14} />
          </button>
        </div>
      </PageShell>
    );
  }

  // Show financing embed/redirect
  if (showFinancingEmbed && (assignedContract?.contractUrl || denefitsContract?.contractUrl)) {
    const contractUrl = assignedContract?.contractUrl || denefitsContract?.contractUrl!;
    return (
      <PageShell
        badge="Partner Portal"
        title="Complete Your In‑House Financing"
        subtitle="Fill out the financing application below. Your payments will report to Equifax."
      >
        <div className={FINELY_OS_PAGE}>
          <button type="button" onClick={() => setShowFinancingEmbed(false)} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Back to checkout
          </button>

          <div className={`${FINELY_OS_NOTICE_SUCCESS} flex items-start gap-3`}>
            <Sparkles size={18} className="mt-0.5 text-emerald-700 shrink-0" />
            <div>
              <div className="font-semibold text-emerald-200">Build Credit While You Pay</div>
              <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>Your payments report to Equifax as a positive installment tradeline.</p>
            </div>
          </div>

          <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <div className={FINELY_OS_ENTITY_VALUE}>{assignedContract?.label || selectedPackage?.name || 'In-house financing'}</div>
            <div className="text-amber-300 text-lg font-semibold">{selectedPackage ? formatPrice(selectedPackage.priceAmount) : 'Custom contract'}</div>

            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-center space-y-4`}>
              <p className={FINELY_OS_ENTITY_BODY}>Click below to open the in-house financing application.</p>
              <a href={contractUrl} target="_blank" rel="noopener noreferrer" className={FINELY_OS_SUCCESS_BTN}>
                Open financing application <ExternalLink size={14} />
              </a>
            </div>

            <div className="text-center">
              <button type="button" onClick={handleFinancingComplete} className={FINELY_OS_SECONDARY_BTN}>
                I've completed the application
              </button>
            </div>
          </div>

          <FinelyOsPageFooter />
        </div>
      </PageShell>
    );
  }

  if (submitted) {
    return (
      <PageShell
        badge="Partner Portal"
        title="Application Submitted"
        subtitle="Your plan selection has been recorded."
      >
        <div className={FINELY_OS_PAGE}>
          {notice && (
            <div className={`${selectedRail === 'in_house' ? FINELY_OS_NOTICE_SUCCESS : FINELY_OS_NOTICE_WARN} flex items-start gap-3`}>
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <div>{notice}</div>
            </div>
          )}

          <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <div className={FINELY_OS_ENTITY_VALUE}>{selectedPackage?.name}</div>
            <div className={FINELY_OS_ENTITY_BODY}>{selectedPackage?.description}</div>
            <div className="text-amber-300 text-lg font-semibold">{selectedPackage ? formatPrice(selectedPackage.priceAmount) : '—'}</div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>
              Rail: {selectedRail === 'stripe' ? 'Stripe' : 'In-house financing (reports to Equifax)'}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button type="button" onClick={() => navigate('/portal/billing')} className={FINELY_OS_SUCCESS_BTN}>
              View billing <ArrowRight size={14} />
            </button>
            <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_SECONDARY_BTN}>
              Go to dashboard
            </button>
          </div>

          <FinelyOsPageFooter />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      badge="Partner Portal"
      title="Select Your Plan"
      subtitle="Choose a package and payment method to continue."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Dashboard
          </button>
          <button type="button" onClick={() => navigate('/pricing')} className={FINELY_OS_BACK_LINK}>
            View all pricing <ArrowRight size={16} />
          </button>
        </div>

        {!stripeReady && !denefitsReady ? (
          <div className={`${FINELY_OS_BANNER} ${FINELY_OS_ENTITY_BODY} text-sm`}>{BILLING_DEMO_CHECKOUT_HINT}</div>
        ) : null}

        <FinelyUnifiedHubLayout
          eyebrow="Checkout"
          title="Select your plan & payment rail"
          subtitle="Stripe for card checkout or in-house financing that reports to Equifax."
          accent="sky"
          kpis={[
            { label: 'Category', value: selectedCategory.replace(/_/g, ' '), hint: 'Catalog', accent: 'violet' },
            { label: 'Package', value: selectedPackage?.name?.slice(0, 16) ?? '—', hint: 'Selected', accent: 'amber' },
            { label: 'Rail', value: selectedRail ?? (isFreeSelected ? 'free' : '—'), hint: 'Payment', accent: 'emerald' },
            { label: 'Stripe', value: stripeReady ? 'Live' : 'Demo', hint: 'Card', accent: 'sky' },
          ]}
          tabs={[
            { id: 'catalog', label: 'Catalog' },
            { id: 'package', label: 'Package', badge: selectedPackage ? '✓' : undefined },
            { id: 'payment', label: 'Payment', badge: selectedRail ? '✓' : undefined },
          ]}
          activeTab={checkoutTab}
          onTabChange={(id) => setCheckoutTab(id as CheckoutTab)}
          primaryAction={{ label: 'Billing hub', onClick: () => navigate('/portal/billing') }}
          secondaryAction={{ label: 'Compare pricing', onClick: () => navigate('/pricing') }}
        >
        {checkoutTab === 'catalog' && availablePackages.length > 1 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className={FINELY_OS_ENTITY_VALUE}>Choose a Package</h2>
              <div className={FINELY_OS_VIEW_TABS}>
                {([
                  { id: 'personal_credit', label: 'Personal' },
                  { id: 'business_credit', label: 'Business' },
                  { id: 'debt_legal', label: 'Debt & Legal' },
                  { id: 'privacy_id', label: 'Privacy/ID' },
                ] as Array<{ id: PricingCategory; label: string }>).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(c.id);
                      setSelectedPackageId(null);
                      setSelectedRail(null);
                    }}
                    className={finelyOsViewTab(selectedCategory === c.id, 'emerald')}
                    title={`Browse ${c.label}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <PricingPackageCatalog
              packages={availablePackages}
              pageSize={6}
              searchPlaceholder="Search checkout packages…"
              selectLabel={selectedPackageId ? 'Selected' : 'Choose'}
              onSelect={(pkgId) => handleSelectPackage(pkgId)}
            />
          </div>
        )}

        {checkoutTab === 'package' && selectedPackage && (
          <div className={`${FINELY_OS_NOTICE_WARN} space-y-4`}>
            <div className="flex items-center gap-2 text-fuchsia-200">
              <Shield size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Selected Package</span>
            </div>
            <div className={`text-xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{selectedPackage.name}</div>
            <div className={FINELY_OS_ENTITY_BODY}>
              {(selectedRail && selectedPackage.descriptionByRail?.[selectedRail]) || selectedPackage.description}
            </div>
            <div className="text-amber-300 text-2xl font-bold">{formatPrice(selectedPackage.priceAmount)}</div>
            <ul className="space-y-1">
              {((selectedRail && selectedPackage.highlightsByRail?.[selectedRail]) || selectedPackage.highlights)
                .slice(0, 4)
                .map((h, i) => (
                <li key={i} className={`flex items-center gap-2 ${FINELY_OS_ENTITY_BODY}`}>
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
            {((selectedRail && selectedPackage.scopeBulletsByRail?.[selectedRail]?.length) || selectedPackage.scopeBullets?.length) ? (
              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Scope</div>
                <ul className={`mt-2 space-y-1 ${FINELY_OS_ENTITY_BODY}`}>
                  {((selectedRail && selectedPackage.scopeBulletsByRail?.[selectedRail]) || selectedPackage.scopeBullets || [])
                    .slice(0, 6)
                    .map((x, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-white/40">•</span>
                        <span>{x}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
            {selectedPackage.priceAmount > 0 && (
              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony ${FINELY_OS_ENTITY_BODY}`}>
                {!stripeReady && (selectedPackage.rail === 'stripe' || selectedPackage.rail === 'both') ? (
                  <div className={FINELY_OS_NOTICE_WARN}>
                    Stripe checkout is unavailable — card payments require Stripe keys at build time and the stripeEnabled feature flag.
                    Use in-house financing if configured, or contact support. You can review plans in{' '}
                    <button type="button" className="underline text-amber-200" onClick={() => navigate('/portal/billing#plans-section')}>
                      Billing
                    </button>
                    .
                  </div>
                ) : null}
                {!denefitsReady && (selectedPackage.rail === 'in_house' || selectedPackage.rail === 'both') ? (
                  <div>In-house financing is currently unavailable (not configured).</div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {checkoutTab === 'payment' && selectedPackage && !isFreeSelected && (
          <div className="space-y-4">
            <h2 className={FINELY_OS_ENTITY_VALUE}>Choose Payment Method</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {canUseStripe(selectedPackage) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRail('stripe');
                    setCheckoutTab('payment');
                  }}
                  className={finelyOsListItem(selectedRail === 'stripe', 'violet')}
                >
                  <div className="flex items-center gap-3 text-violet-300">
                    <CreditCard size={24} />
                    <span className={FINELY_OS_ENTITY_SUBLABEL}>Card / Bank</span>
                  </div>
                  <div className={`${FINELY_OS_ENTITY_VALUE} mt-3`}>Pay with Stripe</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} mt-1`}>
                    Secure checkout via Stripe. Pay in full or use Stripe's payment plans.
                  </div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-2`}>Instant access upon payment</div>
                  {selectedRail === 'stripe' && (
                    <div className="flex items-center gap-2 text-violet-300 text-[10px] uppercase tracking-widest mt-3">
                      <CheckCircle2 size={14} /> Selected
                    </div>
                  )}
                </button>
              )}

              {canUseDenefits(selectedPackage) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRail('in_house');
                    setCheckoutTab('payment');
                  }}
                  className={finelyOsListItem(selectedRail === 'in_house', 'emerald')}
                >
                  <div className="flex items-center gap-3 text-emerald-300">
                    <Building2 size={24} />
                    <span className={FINELY_OS_ENTITY_SUBLABEL}>In-House Financing</span>
                  </div>
                  <div className={`${FINELY_OS_ENTITY_VALUE} mt-3`}>Finance & Build Credit</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} mt-1`}>
                    Flexible payment plans. Your payments report to Equifax!
                  </div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-2`}>Builds credit while you pay</div>
                  {selectedRail === 'in_house' && (
                    <div className="flex items-center gap-2 text-emerald-300 text-[10px] uppercase tracking-widest mt-3">
                      <CheckCircle2 size={14} /> Selected
                    </div>
                  )}
                </button>
              )}
            </div>

            {selectedRail === 'stripe' && (
              <div className={`${FINELY_OS_NOTICE_WARN} flex items-start gap-3`}>
                <Shield size={18} className="mt-0.5 text-fuchsia-300 shrink-0" />
                <div>
                  <div className="font-semibold text-fuchsia-100">What you’re paying for</div>
                  <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                    Your payment covers platform access (software + workflows), educational resources, templates/letters (when included),
                    and any coaching or strategy calls included in your package.
                  </p>
                  <div className={`mt-2 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
                    Educational information only. No guarantees. If you need legal advice, consult a licensed attorney.
                  </div>
                </div>
              </div>
            )}

            {!canUseStripe(selectedPackage) && !canUseDenefits(selectedPackage) && (
              <div className={FINELY_OS_NOTICE_WARN}>
                Payment methods are being configured. Please contact support or check back soon.
              </div>
            )}
          </div>
        )}

        {selectedRail === 'in_house' && (
          <div className={`${FINELY_OS_NOTICE_SUCCESS} flex items-start gap-3`}>
            <Sparkles size={18} className="mt-0.5 text-emerald-700 shrink-0" />
            <div>
              <div className="font-semibold text-emerald-200">Denefit financing</div>
              <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                When you choose Denefit in-house financing, your payments report to Equifax as a positive installment
                tradeline — build credit while you pay for services.
              </p>
            </div>
          </div>
        )}

        {selectedRail === 'in_house' && !denefitsContract && (
          <div className={`${FINELY_OS_NOTICE_WARN} flex items-start gap-3`}>
            <Clock size={18} className="mt-0.5 text-violet-300 shrink-0" />
            <div>
              <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Financing Setup in Progress</div>
              <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                The financing contract for this package is being configured. Please contact support or try the
                card/bank option.
              </p>
            </div>
          </div>
        )}

        {(checkoutTab === 'payment' || checkoutTab === 'package') && (
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              !selectedPackage ||
              (!isFreeSelected && !selectedRail) ||
              (selectedRail === 'in_house' && !denefitsContract && !features.denefitsEnabled)
            }
            className={FINELY_OS_SUCCESS_BTN}
          >
            {isFreeSelected ? 'Activate free access' : selectedRail === 'stripe' ? 'Proceed to checkout' : 'Apply for financing'}{' '}
            <ArrowRight size={14} />
          </button>
          <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_SECONDARY_BTN}>
            Cancel
          </button>
        </div>
        )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
