import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CreditCard, Building2, CheckCircle2, Clock, Shield, Sparkles, ExternalLink } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
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
  personalCreditPackages,
  formatPrice,
  type PricingCategory,
  type PricingPackage,
} from '../../config/pricingCatalog';
import { getDenefitsContractForPackage, getFeatureFlags, getPricingControls, isStripeConfigured, isDenefitsConfigured } from '../../data/settingsRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { createStripeCheckoutSession } from '../../lib/stripeCheckoutClient';

export default function PartnerCheckoutPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);
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
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
            No partner profile found. Complete onboarding first.
          </div>
          <button
            onClick={() => navigate('/onboarding')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
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
        <div className="space-y-6">
          <button
            onClick={() => setShowFinancingEmbed(false)}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Back to checkout
          </button>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-100 flex items-start gap-3">
            <Sparkles size={18} className="mt-0.5 text-emerald-300" />
            <div>
              <div className="font-semibold text-white">Build Credit While You Pay</div>
              <p className="mt-1 text-white/70">
                Your payments report to Equifax as a positive installment tradeline.
              </p>
            </div>
          </div>

          {/* Financing embed iframe or redirect link */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
            <div className="text-white font-semibold">{assignedContract?.label || selectedPackage?.name || 'In-house financing'}</div>
            <div className="text-amber-400 text-lg font-semibold">{selectedPackage ? formatPrice(selectedPackage.priceAmount) : 'Custom contract'}</div>

            {/* In production, this would be an iframe embed */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center space-y-4">
              <p className="text-white/60 text-sm">
                Click below to open the in-house financing application.
              </p>
              <a
                href={contractUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              >
                Open financing application <ExternalLink size={14} />
              </a>
            </div>

            <div className="text-center">
              <button
                onClick={handleFinancingComplete}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 font-bold uppercase tracking-widest text-[10px] transition-all"
              >
                I've completed the application
              </button>
            </div>
          </div>
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
        <div className="space-y-6">
          {notice && (
            <div
              className={`rounded-2xl border p-5 text-sm flex items-start gap-3 ${
                selectedRail === 'in_house'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-100'
              }`}
            >
              <CheckCircle2 size={18} className="mt-0.5" />
              <div>{notice}</div>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <div className="text-white font-semibold">{selectedPackage?.name}</div>
            <div className="text-white/60 text-sm">{selectedPackage?.description}</div>
            <div className="text-amber-400 text-lg font-semibold">
              {selectedPackage ? formatPrice(selectedPackage.priceAmount) : '—'}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
              Rail: {selectedRail === 'stripe' ? 'Stripe' : 'In-house financing (reports to Equifax)'}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/portal/billing')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              View billing <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate('/portal/dashboard')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 font-bold uppercase tracking-widest text-[10px] transition-all"
            >
              Go to dashboard
            </button>
          </div>
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
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate('/portal/dashboard')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Dashboard
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            View all pricing <ArrowRight size={16} />
          </button>
        </div>

        {/* Package selection (if multiple available) */}
        {availablePackages.length > 1 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-white font-semibold">Choose a Package</h2>
              <div className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-black/30 p-1">
                {([
                  { id: 'personal_credit', label: 'Personal' },
                  { id: 'business_credit', label: 'Business' },
                  { id: 'debt_legal', label: 'Debt & Legal' },
                  { id: 'privacy_id', label: 'Privacy/ID' },
                ] as Array<{ id: PricingCategory; label: string }>).map((c) => {
                  const active = selectedCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(c.id);
                        setSelectedPackageId(null);
                        setSelectedRail(null);
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        active ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                      title={`Browse ${c.label}`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {availablePackages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => handleSelectPackage(pkg.id)}
                  className={`text-left rounded-2xl border p-5 space-y-3 transition-all ${
                    selectedPackageId === pkg.id
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : 'border-white/10 bg-black/30 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">{pkg.name}</span>
                    {pkg.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-black uppercase">
                        {pkg.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-amber-400 font-semibold">{formatPrice(pkg.priceAmount)}</div>
                  <div className="text-white/60 text-sm line-clamp-2">{pkg.tagline}</div>
                  {selectedPackageId === pkg.id && (
                    <div className="flex items-center gap-2 text-amber-400 text-[10px] uppercase tracking-widest">
                      <CheckCircle2 size={14} /> Selected
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected package details */}
        {selectedPackage && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Shield size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Selected Package</span>
            </div>
            <div className="text-white font-semibold text-xl">{selectedPackage.name}</div>
            <div className="text-white/70 text-sm">
              {(selectedRail && selectedPackage.descriptionByRail?.[selectedRail]) || selectedPackage.description}
            </div>
            <div className="text-amber-400 text-2xl font-bold">{formatPrice(selectedPackage.priceAmount)}</div>
            <ul className="space-y-1">
              {((selectedRail && selectedPackage.highlightsByRail?.[selectedRail]) || selectedPackage.highlights)
                .slice(0, 4)
                .map((h, i) => (
                <li key={i} className="flex items-center gap-2 text-white/80 text-sm">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  {h}
                </li>
              ))}
            </ul>
            {((selectedRail && selectedPackage.scopeBulletsByRail?.[selectedRail]?.length) || selectedPackage.scopeBullets?.length) ? (
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="text-white/70 text-xs font-semibold uppercase tracking-wider">Scope</div>
                <ul className="mt-2 space-y-1 text-sm text-white/75">
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
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
                {!stripeReady && (selectedPackage.rail === 'stripe' || selectedPackage.rail === 'both') ? (
                  <div>Stripe checkout is currently unavailable (not configured).</div>
                ) : null}
                {!denefitsReady && (selectedPackage.rail === 'in_house' || selectedPackage.rail === 'both') ? (
                  <div>In-house financing is currently unavailable (not configured).</div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* Payment rails */}
        {selectedPackage && !isFreeSelected && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold">Choose Payment Method</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Stripe option */}
              {canUseStripe(selectedPackage) && (
                <button
                  type="button"
                  onClick={() => setSelectedRail('stripe')}
                  className={`text-left rounded-2xl border p-6 space-y-4 transition-all ${
                    selectedRail === 'stripe'
                      ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                      : 'border-white/10 bg-black/30 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3 text-amber-400">
                    <CreditCard size={24} />
                    <span className="text-sm font-semibold uppercase tracking-wider">Card / Bank</span>
                  </div>
                  <div className="text-white font-semibold">Pay with Stripe</div>
                  <div className="text-white/60 text-sm">
                    Secure checkout via Stripe. Pay in full or use Stripe's payment plans.
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">
                    Instant access upon payment
                  </div>
                  {selectedRail === 'stripe' && (
                    <div className="flex items-center gap-2 text-amber-400 text-[10px] uppercase tracking-widest">
                      <CheckCircle2 size={14} /> Selected
                    </div>
                  )}
                </button>
              )}

              {/* In-house financing option */}
              {canUseDenefits(selectedPackage) && (
                <button
                  type="button"
                  onClick={() => setSelectedRail('in_house')}
                  className={`text-left rounded-2xl border p-6 space-y-4 transition-all ${
                    selectedRail === 'in_house'
                      ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                      : 'border-white/10 bg-black/30 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3 text-emerald-400">
                    <Building2 size={24} />
                    <span className="text-sm font-semibold uppercase tracking-wider">In-House Financing</span>
                  </div>
                  <div className="text-white font-semibold">Finance & Build Credit</div>
                  <div className="text-white/60 text-sm">
                    Flexible payment plans. Your payments report to Equifax!
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">
                    Builds credit while you pay
                  </div>
                  {selectedRail === 'in_house' && (
                    <div className="flex items-center gap-2 text-emerald-400 text-[10px] uppercase tracking-widest">
                      <CheckCircle2 size={14} /> Selected
                    </div>
                  )}
                </button>
              )}
            </div>

            {/* Stripe framing note (educational-first / software value) */}
            {selectedRail === 'stripe' && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100 flex items-start gap-3">
                <Shield size={18} className="mt-0.5 text-amber-300" />
                <div>
                  <div className="font-semibold text-white">What you’re paying for</div>
                  <p className="mt-1 text-white/70">
                    Your payment covers platform access (software + workflows), educational resources, templates/letters (when included),
                    and any coaching/enlightenment sessions included in your package.
                  </p>
                  <div className="mt-2 text-[11px] text-white/55">
                    Educational information only. No guarantees. If you need legal advice, consult a licensed attorney.
                  </div>
                </div>
              </div>
            )}

            {/* No payment methods available */}
            {!canUseStripe(selectedPackage) && !canUseDenefits(selectedPackage) && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
                Payment methods are being configured. Please contact support or check back soon.
              </div>
            )}
          </div>
        )}

        {/* In-house financing note */}
        {selectedRail === 'in_house' && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-100 flex items-start gap-3">
            <Sparkles size={18} className="mt-0.5 text-emerald-300" />
            <div>
              <div className="font-semibold text-white">Credit Building Benefit</div>
              <p className="mt-1 text-white/70">
                When you choose in-house financing, your payments report to Equifax as a positive installment
                tradeline. This helps build your credit while you pay for services — two benefits in one!
              </p>
            </div>
          </div>
        )}

        {/* Contract URL not configured warning */}
        {selectedRail === 'in_house' && !denefitsContract && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100 flex items-start gap-3">
            <Clock size={18} className="mt-0.5 text-amber-300" />
            <div>
              <div className="font-semibold text-white">Financing Setup in Progress</div>
              <p className="mt-1 text-white/70">
                The financing contract for this package is being configured. Please contact support or try the
                card/bank option.
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleSubmit}
            disabled={
              !selectedPackage ||
              (!isFreeSelected && !selectedRail) ||
              (selectedRail === 'in_house' && !denefitsContract && !features.denefitsEnabled)
            }
            className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isFreeSelected ? 'Activate free access' : selectedRail === 'stripe' ? 'Proceed to checkout' : 'Apply for financing'}{' '}
            <ArrowRight size={14} />
          </button>
          <button
            onClick={() => navigate('/portal/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 font-bold uppercase tracking-widest text-[10px] transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </PageShell>
  );
}
