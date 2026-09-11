import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Shield, Sparkles, Building2, Scale, Lock, Gift, Users, Crown, AlertCircle, CheckCircle2, Phone } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { useAuth } from '../auth/AuthProvider';
import { resolvePackageSelectPath } from '../lib/packageCheckoutRouting';
import { finelyCtaNavigate, resolveFinelyCtaPath } from '../lib/finelyCtaIntent';
import { getPricingControls, loadSettings } from '../data/settingsRepo';
import { buildTelHref, DEFAULT_SUPPORT_PHONE_DISPLAY } from '../lib/telLink';
import {
  personalCreditPackages,
  businessCreditPackages,
  debtLegalPackages,
  wealthBuilderPackages,
  privacyPackages,
  bundlePackages,
  tradelinePromoPackages,
  agencyTiers,
  categoryDescriptions,
  formatPrice,
  getDebtPackageGuidanceForBalance,
  type PricingPackage,
  type PricingCategory,
  isLetterPackPackage,
} from '../config/pricingCatalog';
import { AgencyTierCard } from '../components/pricing/PricingCards';
import { PricingPackageCatalog } from '../components/pricing/PricingPackageCatalog';
import { ServicesChooserModal } from '../components/pricing/ServicesChooserModal';
import { CS } from '../config/creditSpecialistProgram';
import { startFinancingPreapprovalInterest } from '../lib/financingPreapprovalInterest';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { PricingSolutionsHero, type PricingSolutionKey } from '../features/os/PricingSolutionsHero';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { LandingTypewriterTitle } from '../components/landing/LandingTypewriterTitle';
import { LandingSellAtmosphere } from '../components/landing/LandingSellAtmosphere';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_VIEW_TABS,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_PRIMARY_BTN,
  finelyOsCatalogCard,
  finelyOsLandingContrastSection,
  finelyOsLeadMagnetPanel,
  finelyOsListItem,
  finelyOsViewTab,
  type FinelyOsPublicAccent,
} from '../features/os/finelyOsLightUi';
import './pricingPage.css';

type TabKey = PricingCategory | 'agency' | 'banking_reports';
type DeliveryMode = 'DIY' | 'DFY';
type PersonalLane = 'restore' | 'building';

const TAB_ACCENT: Record<TabKey, FinelyOsPublicAccent> = {
  personal_credit: 'emerald',
  banking_reports: 'sky',
  business_credit: 'violet',
  debt_legal: 'rose',
  wealth_builder: 'emerald',
  privacy_id: 'sky',
  bundle: 'violet',
  tradeline_promo: 'emerald',
  agency: 'rose',
};

const TABS: { key: TabKey; label: string; icon: React.ReactNode; accent: FinelyOsPublicAccent }[] = [
  { key: 'personal_credit', label: 'Personal', icon: <Sparkles size={16} />, accent: 'emerald' },
  { key: 'banking_reports', label: 'Banking Reports', icon: <Shield size={16} />, accent: 'sky' },
  { key: 'business_credit', label: 'Business', icon: <Building2 size={16} />, accent: 'violet' },
  { key: 'debt_legal', label: 'Debt & Legal', icon: <Scale size={16} />, accent: 'rose' },
  { key: 'wealth_builder', label: 'Wealth', icon: <Crown size={16} />, accent: 'emerald' },
  { key: 'privacy_id', label: 'Privacy', icon: <Lock size={16} />, accent: 'sky' },
  { key: 'bundle', label: 'Bundles', icon: <Gift size={16} />, accent: 'violet' },
  { key: 'tradeline_promo', label: 'Tradelines', icon: <Sparkles size={16} />, accent: 'emerald' },
  { key: 'agency', label: CS.pricingTabLabel, icon: <Users size={16} />, accent: 'rose' },
];

/** Representative cents per debt-balance band — feeds getDebtPackageGuidanceForBalance() for the "which tier fits" picker. */
const DEBT_BALANCE_BANDS: { label: string; amountCents: number }[] = [
  { label: 'Under $10k', amountCents: 500_000 },
  { label: '$10k–$25k', amountCents: 1_500_000 },
  { label: '$25k–$100k', amountCents: 5_000_000 },
  { label: '$100k+', amountCents: 15_000_000 },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  usePublicSeoMeta({
    title: 'Pricing & packages',
    description: 'Personal restore, business credit, debt & legal, tradelines, and Credit Specialist partnership tiers.',
    path: '/pricing',
  });
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>('personal_credit');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('DFY');
  const [personalLane, setPersonalLane] = useState<PersonalLane>('restore');
  const [storeVersion, setStoreVersion] = useState(0);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [debtBalanceBandCents, setDebtBalanceBandCents] = useState<number | null>(null);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

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

  useEffect(() => {
    const tab = searchParams.get('tab') as TabKey | null;
    if (!tab) return;
    const allowed = new Set(TABS.map((t) => t.key));
    if (allowed.has(tab)) setActiveTab(tab);
  }, [searchParams]);

  const handleSelect = (pkgId?: string, rail?: 'stripe' | 'in_house') => {
    if (!pkgId) {
      navigate(auth.user ? '/portal/checkout' : '/signup?auth=signup');
      return;
    }
    navigate(
      resolvePackageSelectPath({
        packageId: pkgId,
        rail,
        isAuthed: Boolean(auth.user),
      }),
    );
  };

  /** Custom-quote pseudo-tiers (D1/D2) route to intake instead of checkout — no sticker price to check out with. */
  const handleSelectPackage = (pkgId: string, packages: PricingPackage[]) => {
    const pkg = packages.find((p) => p.id === pkgId);
    if (pkg?.isCustomQuote) {
      finelyCtaNavigate(navigate, pkg.category === 'debt_legal' ? 'debt_intake' : 'personal_intake');
      return;
    }
    const rail = pkg?.rail === 'in_house' ? 'in_house' : pkg?.rail === 'stripe' ? 'stripe' : undefined;
    handleSelect(pkgId, rail);
  };

  const handleAgencyTier = (tierId?: string) => {
    if (auth.user) {
      navigate(tierId ? `/agency/signup?tier=${encodeURIComponent(tierId)}` : '/agency/signup');
      return;
    }
    const qs = new URLSearchParams();
    qs.set('auth', 'signup');
    qs.set('lane', 'agent');
    if (tierId) qs.set('tier', tierId);
    if (tierId) qs.set('next', `/agency/signup?tier=${encodeURIComponent(tierId)}`);
    else qs.set('next', '/agency/signup');
    navigate(`/signup?${qs.toString()}`);
  };

  const getPackagesForTab = (): PricingPackage[] => {
    switch (activeTab) {
      case 'personal_credit':
        return personalCreditPackages
          .filter((p) => {
            const id = String(p.id || '');
            if (id === 'chexsystems_cleanup' || id === 'early_warning_cleanup') return false;
            // Free lives in the ivory band only (band XOR card).
            if (id === 'personal_free') return false;

            const isBuild =
              id.startsWith('personal_build') ||
              id.startsWith('personal_maintenance') ||
              id.includes('maintenance');

            if (personalLane === 'building') return isBuild;
            return !isBuild;
          })
          .map(applyOverride);
      case 'banking_reports':
        return personalCreditPackages
          .filter((p) => p.id === 'chexsystems_cleanup' || p.id === 'early_warning_cleanup')
          .map(applyOverride);
      case 'business_credit':
        return businessCreditPackages.map(applyOverride);
      case 'debt_legal':
        return debtLegalPackages.map(applyOverride);
      case 'wealth_builder':
        return wealthBuilderPackages.map(applyOverride);
      case 'privacy_id':
        return privacyPackages.map(applyOverride);
      case 'bundle':
        return bundlePackages.map(applyOverride);
      case 'tradeline_promo':
        return tradelinePromoPackages.map(applyOverride);
      default:
        return [];
    }
  };

  const tabDescription = useMemo(() => {
    if (activeTab === 'agency') {
      return 'Credit Specialist tiers use revenue share only — no platform access fee. Each tier shows a phase-by-phase split (training → certified) so you know exactly what you keep at each stage.';
    }
    if (activeTab === 'banking_reports') {
      return 'ChexSystems and Early Warning Systems cleanup workflows (banking report disputes and documentation organization).';
    }
    return categoryDescriptions[activeTab as PricingCategory];
  }, [activeTab]);

  const visiblePackages = useMemo(() => {
    const pkgs = getPackagesForTab()
      .filter((p) => p.isPublic)
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);
    if (activeTab === 'agency') return [] as PricingPackage[];
    if (activeTab === 'tradeline_promo') return pkgs;
    if (activeTab === 'bundle') return pkgs;
    return pkgs.filter((p) => {
      if (deliveryMode === 'DFY' && isLetterPackPackage(p)) return false;
      if (deliveryMode === 'DIY') return p.delivery === 'DIY' || p.delivery === 'HYBRID';
      return p.delivery === 'DFY' || p.delivery === 'HYBRID';
    });
  }, [activeTab, deliveryMode, getPackagesForTab]);

  const heroKey = (activeTab === 'banking_reports' ? 'personal_credit' : activeTab) as PricingSolutionKey;
  const supportPhone = loadSettings().site.supportPhone || DEFAULT_SUPPORT_PHONE_DISPLAY;
  const supportTelHref = buildTelHref(supportPhone);

  const debtBalanceRecommendation = useMemo(
    () => (debtBalanceBandCents != null ? getDebtPackageGuidanceForBalance(debtBalanceBandCents) : null),
    [debtBalanceBandCents],
  );

  const activeTabAccent = TAB_ACCENT[activeTab];
  const mosaicOrbs = ['Personal', 'Business', 'Debt', 'Wealth'] as const;
  const mosaicOrbAccents: FinelyOsPublicAccent[] = ['emerald', 'violet', 'rose', 'sky'];

  return (
    <PageShell
      hideHero
      title="Solutions"
      subtitle="Pick DIY or Done‑For‑You, then choose the solution that matches your goals."
      surface="ivory"
      contentWidth="full"
      laneHero={
        <div data-fc-pricing-mosaic="1" data-fc-service-floor="catalog">
          <section className="pricing-mosaic-hero" aria-label="Solutions catalog">
            <div className="pricing-mosaic-hero__orbs" aria-hidden>
              {mosaicOrbs.map((label, i) => (
                <div
                  key={label}
                  className={`pricing-mosaic-hero__orb pricing-mosaic-hero__orb--${mosaicOrbAccents[i]}`}
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="pricing-mosaic-hero__inner">
              <p className={`${FINELY_OS_ENTITY_SUBLABEL} tracking-[0.22em]`}>Package catalog</p>
              <LandingTypewriterTitle
                as="h2"
                text="Every solution — "
                accentText="your next step."
                className="pricing-mosaic-hero__title mt-2"
                accentClassName="text-emerald-700"
                immediate
                speedMs={28}
              />
              <p className={`mt-3 text-base max-w-xl ${FINELY_OS_ENTITY_BODY}`}>
                Pick DIY or done-for-you, choose your lane, then compare packages in the catalog stage below.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => setChooserOpen(true)} className={FINELY_OS_PRIMARY_BTN}>
                  Browse all solutions <ArrowRight size={16} />
                </button>
                <button type="button" onClick={() => navigate('/free-guide')} className={FINELY_OS_SECONDARY_BTN}>
                  Start free guide
                </button>
              </div>
              <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-4`}>
                Results vary · not legal advice · funding subject to underwriting
              </p>
            </div>
          </section>
        </div>
      }
    >
      <div className={`${FINELY_OS_PAGE} space-y-0`} data-fc-pricing-mosaic="1" data-fc-service-floor="catalog">
        <div className="space-y-4 py-4">
          <PricingSolutionsHero
            activeKey={heroKey}
            onBrowseSolutions={() => setChooserOpen(true)}
            browseLabel="Switch solution"
          />
        </div>

        {/* Free workspace — dark glass band (sole Free entry on this page) */}
        <section
          className={`fc-sell relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 2xl:-mx-10 px-4 sm:px-6 lg:px-8 2xl:px-10 py-12 sm:py-14 ${finelyOsLandingContrastSection('fc-band-emerald')}`}
          data-fc-contrast-band="1"
        >
          <LandingSellAtmosphere tone="platinum" />
          <div className="relative w-full max-w-none">
            <div className={`${finelyOsCatalogCard('emerald')} grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center`} data-fc-accent="emerald">
              <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${FINELY_OS_ENTITY_VALUE}`}>
                    <Gift size={14} /> Start free
                  </span>
                  <span className={`rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${FINELY_OS_ENTITY_SUBLABEL}`}>DIY plan</span>
                  <span className={`rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${FINELY_OS_ENTITY_SUBLABEL}`}>No credit card</span>
                </div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Free workspace</p>
                <LandingTypewriterTitle
                  as="h2"
                  text="Start free. Unlock your workspace."
                  className="text-3xl sm:text-4xl font-extrabold leading-tight text-white"
                  highlight="Start free."
                  highlightClassName="text-emerald-300"
                  delayMs={280}
                  speedMs={40}
                />
                <p className={`${FINELY_OS_ENTITY_BODY} max-w-3xl text-base`}>
                  Upload and analyze reports, organize documents, and get guided tasks — then upgrade anytime for Letters, templates,
                  and higher-touch execution.
                </p>
                <details className={`${finelyOsCatalogCard('sky')} fc-surface-harmony group !p-4`} data-fc-accent="sky">
                  <summary className={`cursor-pointer list-none text-sm font-bold ${FINELY_OS_ENTITY_VALUE} [&::-webkit-details-marker]:hidden flex items-center justify-between gap-2`}>
                    <span>Free DIY includes</span>
                    <span className={`${FINELY_OS_ENTITY_SUBLABEL} group-open:hidden`}>Expand</span>
                  </summary>
                  <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {[
                      'Credit report analyzer',
                      'Documents vault',
                      'Tasks & notifications',
                      'Education + courses',
                    ].map((x, idx) => (
                      <div key={x} className={`flex items-center gap-2 ${finelyOsCatalogCard((['violet', 'rose', 'emerald', 'sky'] as const)[idx % 4])} !p-3 text-xs`} data-fc-accent={(['violet', 'rose', 'emerald', 'sky'] as const)[idx % 4]}>
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        <span className={`truncate ${FINELY_OS_ENTITY_BODY}`}>{x}</span>
                      </div>
                    ))}
                  </div>
                </details>
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Free access is <span className={`font-bold ${FINELY_OS_ENTITY_VALUE}`}>DIY</span> and does not include Letters. Upgrade to unlock Letter Studio + templates.
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-3 w-full lg:max-w-sm lg:ml-auto">
                <button type="button" onClick={() => navigate('/free-guide')} className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center !py-3.5 !text-base`}>
                  Start free guide <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('personal_credit');
                    setDeliveryMode('DIY');
                    setPersonalLane('restore');
                  }}
                  className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center !py-3`}
                >
                  Explore DIY <ArrowRight size={16} />
                </button>
                <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>
                  Results vary · not legal advice · funding subject to underwriting
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className={`fc-sell relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 2xl:-mx-10 px-4 sm:px-6 lg:px-8 2xl:px-10 py-10 sm:py-14 ${finelyOsLandingContrastSection('fc-band-violet')}`}
          data-fc-contrast-band="1"
        >
          <LandingSellAtmosphere tone="platinum" />
          <div className="relative max-w-[var(--pm-max)] mx-auto space-y-6">
            <div className="pricing-mosaic-notices">
              <div className={`${FINELY_OS_NOTICE_SUCCESS} flex items-start gap-3 pricing-mosaic-slot`}>
                <Sparkles size={18} className="mt-0.5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-200 text-base">Payment plans / pre-approval</div>
                  <p className={`mt-1 text-base ${FINELY_OS_ENTITY_BODY}`}>
                    Build credit while you pay. In-house financing reports to Equifax on eligible packages.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      void startFinancingPreapprovalInterest({
                        source: 'lead_magnet',
                        funnelPath: '/pricing',
                        captureLead: false,
                        openApplication: true,
                      })
                    }
                    className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-emerald-300 hover:text-white transition-colors"
                  >
                    Payment plans / pre-approval →
                  </button>
                </div>
              </div>
              <div className={`${FINELY_OS_NOTICE_WARN} flex items-start gap-3 pricing-mosaic-slot`}>
                <Scale size={18} className="mt-0.5 text-rose-400 shrink-0" />
                <div>
                  <div className={`font-bold text-base ${FINELY_OS_ENTITY_VALUE}`}>What your payment covers</div>
                  <p className={`mt-1 text-base ${FINELY_OS_ENTITY_BODY}`}>
                    Software access, resource library, templates, and guided workflows — plus coaching where included.
                  </p>
                </div>
              </div>
            </div>

            <div className="pricing-mosaic-stage">
              <nav className="pricing-mosaic-rail" aria-label="Solution categories">
                {TABS.map((tab, idx) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`pricing-mosaic-tab pricing-mosaic-tab--${tab.accent} ${
                      activeTab === tab.key ? 'pricing-mosaic-tab--active' : ''
                    } ${idx % 3 === 0 ? 'pricing-mosaic-tab--tall' : ''}`}
                    data-fc-accent={tab.accent}
                  >
                    <span className="pricing-mosaic-tab__icon">{tab.icon}</span>
                    <span className={`pricing-mosaic-tab__label ${FINELY_OS_ENTITY_VALUE}`}>{tab.label}</span>
                  </button>
                ))}
              </nav>

              <div className="pricing-mosaic-main">
                <div className="pricing-mosaic-controls">
                  <div className="pricing-mosaic-mode">
                    <button type="button" onClick={() => setDeliveryMode('DIY')} className={finelyOsListItem(deliveryMode === 'DIY', 'emerald')}>
                      <div className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>DIY</div>
                      <div className={`mt-1 text-base ${FINELY_OS_ENTITY_BODY}`}>Templates + tools — you execute.</div>
                    </button>
                    <button type="button" onClick={() => setDeliveryMode('DFY')} className={finelyOsListItem(deliveryMode === 'DFY', 'violet')}>
                      <div className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>DFY</div>
                      <div className={`mt-1 text-base ${FINELY_OS_ENTITY_BODY}`}>We build strategy + packets with you.</div>
                    </button>
                  </div>
                  {tabDescription ? (
                    <div className={`${finelyOsCatalogCard(activeTabAccent)} !p-5`} data-fc-accent={activeTabAccent}>
                      <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>{tabDescription}</p>
                    </div>
                  ) : null}
                </div>

                {activeTab === 'personal_credit' && (
                  <div className={`${finelyOsCatalogCard('sky')} flex flex-wrap items-center justify-between gap-3 !p-5`} data-fc-accent="sky">
                    <div className={`text-base ${FINELY_OS_ENTITY_BODY}`}>
                      Lane: <span className={`font-bold ${FINELY_OS_ENTITY_VALUE}`}>Restore</span> or{' '}
                      <span className={`font-bold ${FINELY_OS_ENTITY_VALUE}`}>Building</span>
                    </div>
                    <div className={FINELY_OS_VIEW_TABS}>
                      <button type="button" onClick={() => setPersonalLane('restore')} className={finelyOsViewTab(personalLane === 'restore', 'emerald')}>
                        Restore
                      </button>
                      <button type="button" onClick={() => setPersonalLane('building')} className={finelyOsViewTab(personalLane === 'building', 'sky')}>
                        Building
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'debt_legal' && (
                  <div className={`${finelyOsCatalogCard('rose')} flex items-start gap-3 !p-5 lg:!p-6`} data-fc-accent="rose">
                    <AlertCircle size={20} className="mt-0.5 text-rose-400 shrink-0" />
                    <div className="min-w-0 w-full">
                      <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Important legal note</div>
                      <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>
                        Debt & Legal tools are educational and workflow support. Consult a licensed attorney for legal advice.
                      </p>
                      <div className="mt-4 rounded-xl border border-rose-500/20 bg-black/25 p-4 lg:p-5">
                        <div className={`text-xs font-bold uppercase tracking-wider ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          Which tier fits your balance?
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {DEBT_BALANCE_BANDS.map((band) => (
                            <button
                              key={band.label}
                              type="button"
                              onClick={() => setDebtBalanceBandCents(band.amountCents)}
                              className={finelyOsViewTab(debtBalanceBandCents === band.amountCents, 'rose')}
                            >
                              {band.label}
                            </button>
                          ))}
                        </div>
                        {debtBalanceRecommendation ? (
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-500/25 bg-rose-500/[0.08] px-3 py-2.5">
                            <div className={`text-base ${FINELY_OS_ENTITY_BODY}`}>
                              Recommended: <span className={`font-bold ${FINELY_OS_ENTITY_VALUE}`}>{debtBalanceRecommendation.name}</span>{' '}
                              · {formatPrice(debtBalanceRecommendation.priceAmount)}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('debt_legal');
                                handleSelectPackage(debtBalanceRecommendation.id, debtLegalPackages);
                              }}
                              className={FINELY_OS_SUCCESS_BTN}
                            >
                              Start with this tier <ArrowRight size={14} />
                            </button>
                          </div>
                        ) : null}
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead>
                              <tr className="text-white/50 border-b border-white/10">
                                <th className="py-2 pr-3 font-bold">Typical debt / complexity</th>
                                <th className="py-2 font-bold">Package (sticker)</th>
                              </tr>
                            </thead>
                            <tbody className="text-white/75">
                              {debtLegalPackages.filter((p) => p.debtBalanceGuidance && p.isPublic).map((p) => (
                                <tr key={p.id} className="border-b border-white/5">
                                  <td className="py-2 pr-3">{p.debtBalanceGuidance?.label}</td>
                                  <td className="py-2">
                                    {p.name} · {formatPrice(p.priceAmount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'agency' ? (
                  <>
                    <div className={`${finelyOsCatalogCard('violet')} space-y-4 !p-6 lg:!p-8`} data-fc-accent="violet">
                      <div>
                        <p className={FINELY_OS_ENTITY_SUBLABEL}>{CS.programName}</p>
                        <p className={`mt-2 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Revenue-share partnership — not flat SaaS</p>
                        <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>
                          Run partner credit files on Finely&apos;s operating stack with training, white-label portal, dispute studio, and a dedicated partnership line.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button type="button" onClick={() => navigate(CS.publicPath)} className={FINELY_OS_PRIMARY_BTN}>
                          Explore {CS.plural} <ArrowRight size={14} />
                        </button>
                        <button type="button" onClick={() => navigate(resolveFinelyCtaPath('agent_intake'))} className={FINELY_OS_SUCCESS_BTN}>
                          Apply to program <ArrowRight size={14} />
                        </button>
                        <button type="button" onClick={() => navigate(CS.hubPath)} className={FINELY_OS_SECONDARY_BTN}>
                          Specialist hub
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                      {agencyTiers
                        .filter((t) => t.isPublic)
                        .map((tier) => (
                          <AgencyTierCard key={tier.id} tier={tier} onSelect={() => handleAgencyTier(tier.id)} />
                        ))}
                    </div>
                  </>
                ) : visiblePackages.length ? (
                  <div className={`pricing-mosaic-catalog-bed ${finelyOsCatalogCard('emerald')} !p-6 lg:!p-8`} data-fc-accent="emerald">
                    <p className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Compare packages</p>
                    <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>
                      {deliveryMode} packages in {TABS.find((t) => t.key === activeTab)?.label ?? 'this category'}
                    </p>
                    <div className="mt-5">
                      <PricingPackageCatalog
                        packages={visiblePackages}
                        pageSize={6}
                        includePersonalCompare={activeTab === 'personal_credit' || activeTab === 'banking_reports'}
                        searchPlaceholder="Search packages in this category…"
                        selectLabel="Select"
                        onSelect={(pkgId) => handleSelectPackage(pkgId, visiblePackages)}
                        titleClassName="text-xl sm:text-2xl font-extrabold text-white"
                      />
                    </div>
                    <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-4`}>
                      Results vary · not legal advice · funding subject to underwriting
                    </p>
                  </div>
                ) : (
                  <div className={FINELY_OS_LUXURY_EMPTY}>
                    No {deliveryMode} packages in this category yet. Switch to {deliveryMode === 'DIY' ? 'DFY' : 'DIY'} to see
                    available options.
                  </div>
                )}

                {activeTab === 'tradeline_promo' && (
                  <div className={`${FINELY_OS_NOTICE_WARN} flex items-start gap-3 pricing-mosaic-slot`}>
                    <Shield size={18} className="mt-0.5 text-rose-400 shrink-0" />
                    <div>
                      <div className={`font-bold text-base ${FINELY_OS_ENTITY_VALUE}`}>How Tradeline Packages Work</div>
                      <ul className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY} space-y-1 list-disc pl-4`}>
                        <li>
                          <strong>Authorized User (AU) tradelines:</strong> We add you to seasoned credit accounts with perfect
                          payment history.
                        </li>
                        <li>
                          <strong>Primary installment tradeline:</strong> Your in-house financing plan reports to Equifax as a
                          positive installment account.
                        </li>
                        <li>
                          <strong>Bonus resources:</strong> Each package includes educational materials and strategy guidance.
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section
          className={`fc-sell relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 2xl:-mx-10 px-4 sm:px-6 lg:px-8 2xl:px-10 py-14 sm:py-20 ${finelyOsLandingContrastSection('fc-band-emerald')}`}
          data-fc-contrast-band="1"
        >
          <LandingSellAtmosphere tone="platinum" />
          <div className="max-w-4xl mx-auto">
            <div className={`${finelyOsLeadMagnetPanel('emerald')} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 !p-6 sm:!p-8`} data-fc-accent="emerald">
              <div>
                <div className={`text-2xl sm:text-3xl font-bold ${FINELY_OS_ENTITY_VALUE}`}>Not sure which package is right for you?</div>
                <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                  Complete our quick intake and we&apos;ll recommend the best path based on your goals.
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <button type="button" onClick={() => finelyCtaNavigate(navigate, 'personal_intake')} className={FINELY_OS_SUCCESS_BTN}>
                  Start intake <ArrowRight size={14} />
                </button>
                <a href={supportTelHref} className={FINELY_OS_SECONDARY_BTN}>
                  <Phone size={14} /> Call {supportPhone}
                </a>
              </div>
            </div>
            <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-6 text-center`}>Results vary · not legal advice · educational dispute workflow only.</p>
          </div>
        </section>

        <div className="space-y-4 py-6">
        <MarketingStaffChatStrip
          roleId="sales_closer"
          goal="personal"
          roleLabel="solutions advisor"
          subline="Not sure which package fits? Chat for DIY vs done-for-you guidance before checkout."
        />

        <FinelyOsPageFooter />
        </div>
      </div>

      <ServicesChooserModal open={chooserOpen} onClose={() => setChooserOpen(false)} activePath="/pricing" />

      {/* Mobile-only click-to-call bar (B7) — high-intent partners often prefer calling from a phone */}
      <a
        href={supportTelHref}
        className="fixed inset-x-3 bottom-3 z-40 flex sm:hidden items-center justify-center gap-2 rounded-xl border border-emerald-400/50 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#052e16] shadow-[0_16px_40px_rgba(16,185,129,0.4)]"
      >
        <Phone size={16} /> Call now — {supportPhone}
      </a>
    </PageShell>
  );
}
