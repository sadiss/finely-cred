import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Shield, Sparkles, Building2, Scale, Lock, Gift, Users, Crown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { getPricingControls } from '../data/settingsRepo';
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
  type PricingPackage,
  type PricingCategory,
} from '../config/pricingCatalog';
import { AgencyTierCard } from '../components/pricing/PricingCards';
import { PricingPackageCatalog } from '../components/pricing/PricingPackageCatalog';
import { CS } from '../config/creditSpecialistProgram';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
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
  finelyOsLeadMagnetPanel,
  finelyOsListItem,
  finelyOsStatusChip,
  finelyOsViewTab,
} from '../features/os/finelyOsLightUi';

type TabKey = PricingCategory | 'agency' | 'banking_reports';
type DeliveryMode = 'DIY' | 'DFY';
type PersonalLane = 'restore' | 'building';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'personal_credit', label: 'Personal', icon: <Sparkles size={16} /> },
  { key: 'banking_reports', label: 'Banking Reports', icon: <Shield size={16} /> },
  { key: 'business_credit', label: 'Business', icon: <Building2 size={16} /> },
  { key: 'debt_legal', label: 'Debt & Legal', icon: <Scale size={16} /> },
  { key: 'wealth_builder', label: 'Wealth', icon: <Crown size={16} /> },
  { key: 'privacy_id', label: 'Privacy', icon: <Lock size={16} /> },
  { key: 'bundle', label: 'Bundles', icon: <Gift size={16} /> },
  { key: 'tradeline_promo', label: 'Tradelines', icon: <Sparkles size={16} /> },
  { key: 'agency', label: CS.pricingTabLabel, icon: <Users size={16} /> },
];

export default function PricingPage() {
  const navigate = useNavigate();
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
    // Pricing is public; route through onboarding so we can create/hydrate a partner session,
    // then jump straight into checkout with the chosen rail.
    if (!pkgId) {
      navigate('/onboarding');
      return;
    }
    const next = `/portal/checkout?package=${encodeURIComponent(pkgId)}${rail ? `&rail=${encodeURIComponent(rail)}` : ''}`;
    const qs = new URLSearchParams();
    qs.set('package', pkgId);
    if (rail) qs.set('rail', rail);
    qs.set('next', next);
    navigate(`/onboarding?${qs.toString()}`);
  };

  const handleAgencyTier = (tierId?: string) => {
    const qs = new URLSearchParams();
    qs.set('lane', 'agent');
    if (tierId) qs.set('tier', tierId);
    if (tierId) qs.set('next', `/agency/signup?tier=${encodeURIComponent(tierId)}`);
    navigate(`/onboarding?${qs.toString()}`);
  };

  const getPackagesForTab = (): PricingPackage[] => {
    switch (activeTab) {
      case 'personal_credit':
        // Keep Personal tab clean: split Restore vs Building lanes.
        // ChexSystems / Early Warning live under the separate "Banking Reports" tab.
        return personalCreditPackages
          .filter((p) => {
            const id = String(p.id || '');
            if (id === 'chexsystems_cleanup' || id === 'early_warning_cleanup') return false;

            const isBuild =
              id.startsWith('personal_build') ||
              id.startsWith('personal_maintenance') ||
              // Some catalog items are “building adjacent” but not strictly build IDs.
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
    // Agency tab uses a different renderer
    if (activeTab === 'agency') return [] as PricingPackage[];
    // Tradeline promos are always hybrid; show in both modes
    if (activeTab === 'tradeline_promo') return pkgs;
    // Bundles should be visible in both modes (no blank states)
    if (activeTab === 'bundle') return pkgs;
    return pkgs.filter((p) => {
      if (deliveryMode === 'DIY') return p.delivery === 'DIY' || p.delivery === 'HYBRID';
      return p.delivery === 'DFY' || p.delivery === 'HYBRID';
    });
  }, [activeTab, deliveryMode, getPackagesForTab]);

  return (
    <PageShell
      badge="Services"
      title="Services"
      subtitle="Pick DIY or Done‑For‑You, then choose the service that matches your goals."
    >
      <div className={FINELY_OS_PAGE}>
        <FinelyUnifiedHubLayout
          eyebrow="Services & pricing"
          title="DIY or DFY — choose your execution lane"
          subtitle="Personal restore, business credit, debt & legal, tradelines, and wealth builder paths."
          accent="emerald"
          kpis={[
            { label: 'Categories', value: String(TABS.length), accent: 'emerald' },
            { label: 'Mode', value: deliveryMode, accent: 'amber' },
            { label: 'Active lane', value: TABS.find((t) => t.key === activeTab)?.label ?? 'Personal', accent: 'violet' },
            { label: 'Fundability', value: 'Hub →', hint: 'Readiness scan', accent: 'sky' },
          ]}
          primaryAction={{ label: 'Fundability hub', onClick: () => navigate('/fundability-readiness') }}
          secondaryAction={{ label: 'Start free', onClick: () => handleSelect('personal_free') }}
          detailSlot={<p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>Educational only · not legal advice · payments cover software access and guided workflows.</p>}
        >
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm mb-4`}>{tabDescription || 'Select a category below, then pick DIY or DFY delivery.'}</p>
        </FinelyUnifiedHubLayout>

        <div className={`${FINELY_OS_NOTICE_WARN} md:p-7 space-y-4`}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-2 ${finelyOsStatusChip('warn')}`}>
                  <Gift size={14} /> Start free
                </span>
                <span className={finelyOsStatusChip('ok')}>DIY plan</span>
                <span className={finelyOsStatusChip('ok')}>No credit card</span>
              </div>
              <div className={`mt-3 text-2xl md:text-3xl font-semibold tracking-tight ${FINELY_OS_ENTITY_VALUE} leading-tight`}>
                Get started with the free plan and unlock your workspace.
              </div>
              <div className={`mt-2 max-w-3xl ${FINELY_OS_ENTITY_BODY}`}>
                Upload and analyze reports, organize documents, and get guided tasks—then upgrade anytime to unlock Letters, templates,
                and higher-touch execution.
              </div>
              <details className={`mt-4 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony group`}>
                <summary className="cursor-pointer list-none text-sm font-semibold text-white/85 [&::-webkit-details-marker]:hidden flex items-center justify-between gap-2">
                  <span>Free DIY includes</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 group-open:hidden">Expand</span>
                </summary>
                <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {[
                    'Credit report analyzer',
                    'Documents vault',
                    'Tasks & notifications',
                    'Education + courses',
                  ].map((x) => (
                    <div key={x} className={`flex items-center gap-2 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony px-3 py-2 text-xs`}>
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span className={`truncate ${FINELY_OS_ENTITY_BODY}`}>{x}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <button type="button" onClick={() => handleSelect('personal_free')} className={FINELY_OS_SUCCESS_BTN}>
                Start free <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('personal_credit');
                  setDeliveryMode('DIY');
                }}
                className={FINELY_OS_SECONDARY_BTN}
              >
                Explore DIY <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
            Free access is <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>DIY</span> and does not include Letters. Upgrade to unlock Letter Studio + templates.
          </div>
        </div>

        <div className={`${FINELY_OS_NOTICE_SUCCESS} flex items-start gap-3`}>
          <Sparkles size={18} className="mt-0.5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-semibold text-emerald-200">In-House Financing Available</div>
            <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
              Build credit while you pay. Our financing option reports your payments to Equifax, adding a positive
              installment tradeline to your credit file. Look for the{' '}
              <span className="text-emerald-300 font-semibold">In‑House Financing</span> button on eligible packages.
            </p>
            <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
              We can also connect you to lenders and funding pathways when your profile is ready (bureau-pull dependent).
            </p>
          </div>
        </div>

        <div className={`${FINELY_OS_NOTICE_WARN} flex items-start gap-3`}>
          <Scale size={18} className="mt-0.5 text-fuchsia-400 shrink-0" />
          <div>
            <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>What your payment covers</div>
            <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
              Finely Cred is an educational-first platform. Payments cover your access to the software, resource library, templates,
              and guided workflows — plus coaching and strategy calls where included.
            </p>
            <details className={`mt-3 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony group`}>
              <summary className="cursor-pointer list-none text-sm font-semibold text-white/85 [&::-webkit-details-marker]:hidden flex items-center justify-between gap-2">
                <span>Compare what payments cover</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300 group-open:hidden">Expand</span>
              </summary>
              <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                  'Software access + tailored workflow system',
                  'Resource library + knowledge base',
                  'Templates + letters studio (when entitled)',
                  'Strategy calls (when included)',
                ].map((x) => (
                  <div key={x} className={`flex items-center gap-2 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony px-3 py-2 text-xs`}>
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span className={`truncate ${FINELY_OS_ENTITY_BODY}`}>{x}</span>
                  </div>
                ))}
              </div>
            </details>
            <div className={`mt-3 text-[11px] ${FINELY_OS_ENTITY_SUBLABEL}`}>
              Educational information only. No guarantees. If you need legal advice, consult a licensed attorney.
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <button type="button" onClick={() => setDeliveryMode('DIY')} className={finelyOsListItem(deliveryMode === 'DIY', 'amber')}>
            <div className={FINELY_OS_ENTITY_VALUE}>DIY (Do‑It‑Yourself)</div>
            <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
              You use the app + resources + templates. Best for people who want to move fast on their own.
            </div>
          </button>
          <button type="button" onClick={() => setDeliveryMode('DFY')} className={finelyOsListItem(deliveryMode === 'DFY', 'emerald')}>
            <div className={FINELY_OS_ENTITY_VALUE}>DFY (Done‑For‑You)</div>
            <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
              We build your workflow, packets, and strategy with you. Best for complex files and high‑impact outcomes.
            </div>
          </button>
        </div>

        <div className="-mx-1 px-1 overflow-x-auto pb-1">
          <div className={`${FINELY_OS_VIEW_TABS} flex-nowrap sm:flex-wrap min-w-min sm:min-w-0`}>
          {TABS.map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`shrink-0 ${finelyOsViewTab(activeTab === tab.key, 'emerald')}`}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
          </div>
        </div>

        {tabDescription ? <div className={FINELY_OS_ENTITY_BODY}>{tabDescription}</div> : null}

        {activeTab === 'personal_credit' && (
          <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony flex flex-wrap items-center justify-between gap-3`}>
            <div className={FINELY_OS_ENTITY_BODY}>
              Choose your lane:{' '}
              <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Restore</span> (cleanup) or{' '}
              <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Building</span> (strengthening).
            </div>
            <div className={FINELY_OS_VIEW_TABS}>
              <button type="button" onClick={() => setPersonalLane('restore')} className={finelyOsViewTab(personalLane === 'restore', 'emerald')}>
                Restore
              </button>
              <button type="button" onClick={() => setPersonalLane('building')} className={finelyOsViewTab(personalLane === 'building', 'emerald')}>
                Building
              </button>
            </div>
          </div>
        )}

        {activeTab === 'debt_legal' && (
          <div className={`${FINELY_OS_NOTICE_WARN} flex items-start gap-3`}>
            <AlertCircle size={18} className="mt-0.5 text-fuchsia-400 shrink-0" />
            <div>
              <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Important legal note</div>
              <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                Debt & Legal tools are provided for educational and workflow support. You are responsible for reviewing
                your documents and your state/court rules before filing or serving anything. If you need legal advice,
                consult a licensed attorney.
              </p>
              <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                <strong>Financing note:</strong> We do not present in-house financing as a one-click option for debt defense,
                because swapping one debt for another is usually not ideal. If you want a credit-building path, book a free strategy call
                and we’ll map the safest strategy.
              </p>
            </div>
          </div>
        )}

        {/* Package Grid or Agency Tiers */}
        {activeTab === 'agency' ? (
          <>
            <div className={`${finelyOsCatalogCard('violet')} !p-6 space-y-4`} data-fc-accent="violet">
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>{CS.programName}</p>
                <p className={`mt-2 text-xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Revenue-share partnership — not flat SaaS</p>
                <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                  Run client credit files on Finely&apos;s operating stack with training, white-label portal, dispute studio, and a dedicated partnership line.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => navigate(CS.publicPath)} className={FINELY_OS_PRIMARY_BTN}>
                  Explore {CS.plural} <ArrowRight size={14} />
                </button>
                <button type="button" onClick={() => navigate('/onboarding?goal=agent')} className={FINELY_OS_SUCCESS_BTN}>
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
          <PricingPackageCatalog
            packages={visiblePackages}
            pageSize={6}
            includePersonalCompare={activeTab === 'personal_credit' || activeTab === 'banking_reports'}
            searchPlaceholder="Search packages in this category…"
            selectLabel="Select"
            onSelect={(pkgId) => {
              const pkg = visiblePackages.find((p) => p.id === pkgId);
              const rail =
                pkg?.rail === 'in_house' ? 'in_house' : pkg?.rail === 'stripe' ? 'stripe' : undefined;
              handleSelect(pkgId, rail);
            }}
          />
        ) : (
          <div className={FINELY_OS_LUXURY_EMPTY}>
            No {deliveryMode} packages in this category yet. Switch to {deliveryMode === 'DIY' ? 'DFY' : 'DIY'} to see
            available options.
          </div>
        )}

        {/* Tradeline Promo Extra Info */}
        {activeTab === 'tradeline_promo' && (
          <div className={`${FINELY_OS_NOTICE_WARN} flex items-start gap-3`}>
            <Shield size={18} className="mt-0.5 text-fuchsia-400 shrink-0" />
            <div>
              <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>How Tradeline Packages Work</div>
              <ul className={`mt-2 ${FINELY_OS_ENTITY_BODY} space-y-1 list-disc pl-4`}>
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

        <div className={`${finelyOsLeadMagnetPanel('emerald')} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 !p-6`} data-fc-accent="emerald">
          <div>
            <div className={FINELY_OS_ENTITY_VALUE}>Not sure which package is right for you?</div>
            <div className={FINELY_OS_ENTITY_BODY}>
              Complete our quick intake and we'll recommend the best path based on your goals.
            </div>
          </div>
          <button type="button" onClick={() => navigate('/onboarding')} className={FINELY_OS_SUCCESS_BTN}>
            Start intake <ArrowRight size={14} />
          </button>
        </div>

        <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>Results vary · not legal advice · educational dispute workflow only.</p>

        <MarketingStaffChatStrip
          roleId="sales_closer"
          goal="personal"
          roleLabel="solutions advisor"
          subline="Not sure which package fits? Chat for DIY vs done-for-you guidance before checkout."
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
