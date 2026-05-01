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
import { AgencyTierCard, PackageCard, variantForTierIndex } from '../components/pricing/PricingCards';

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
  { key: 'agency', label: 'Agencies', icon: <Users size={16} /> },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>('personal_credit');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('DFY');
  const [personalLane, setPersonalLane] = useState<PersonalLane>('restore');
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
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

  useEffect(() => {
    // Keep pricing feeling curated by default on each switch.
    setShowAll(false);
    setQuery('');
  }, [activeTab, deliveryMode]);

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
    if (activeTab === 'agency') return '';
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

  const filteredPackages = useMemo(() => {
    if (!query.trim()) return visiblePackages;
    const q = query.trim().toLowerCase();
    return visiblePackages.filter((p) => {
      const hay = [p.name, p.tagline, p.description, ...(p.highlights || [])].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [visiblePackages, query]);

  const defaultLimit = activeTab === 'wealth_builder' ? 4 : 6;
  const displayPackages = showAll ? filteredPackages : filteredPackages.slice(0, defaultLimit);

  return (
    <PageShell
      badge="Services"
      title="Services"
      subtitle="Pick DIY or Done‑For‑You, then choose the service that matches your goals."
    >
      <div className="space-y-8">
        {/* Always-visible Free access CTA (not hidden behind DFY/DIY toggle) */}
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-black/30 to-black/30 p-6 md:p-7 backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[10px] font-black uppercase tracking-widest">
                  <Gift size={14} /> Start free
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/40 border border-white/10 text-white/70 text-[10px] font-black uppercase tracking-widest">
                  DIY plan
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/40 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest">
                  No credit card
                </span>
              </div>
              <div className="mt-3 text-white text-2xl md:text-3xl font-light leading-tight">
                Get started with the free plan and unlock your workspace.
              </div>
              <div className="mt-2 text-white/65 text-sm max-w-3xl">
                Upload and analyze reports, organize documents, and get guided tasks—then upgrade anytime to unlock Letters, templates,
                and higher-touch execution.
              </div>
              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-white/70">
                {[
                  'Credit report analyzer',
                  'Documents vault',
                  'Tasks & notifications',
                  'Education + courses',
                ].map((x) => (
                  <div key={x} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
                    <CheckCircle2 size={14} className="text-emerald-300" />
                    <span className="truncate">{x}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => handleSelect('personal_free')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 text-black font-black uppercase tracking-widest text-[11px] hover:brightness-110 transition-all"
              >
                Start free <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('personal_credit');
                  setDeliveryMode('DIY');
                  setShowAll(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-white/10 bg-black/30 text-white/80 font-black uppercase tracking-widest text-[11px] hover:bg-white/[0.04] transition-all"
              >
                Explore DIY <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-white/55">
            Free access is <span className="text-white/70 font-semibold">DIY</span> and does not include Letters. Upgrade to unlock Letter Studio + templates.
          </div>
        </div>

        {/* In-House Financing Promo Banner */}
        <div className="fc-panel p-5 text-sm flex items-start gap-3 border-emerald-500/30 bg-emerald-500/10">
          <Sparkles size={18} className="mt-0.5 text-emerald-400" />
          <div>
            <div className="font-semibold text-white">In-House Financing Available</div>
            <p className="mt-1 text-white/70">
              Build credit while you pay. Our financing option reports your payments to Equifax, adding a positive
              installment tradeline to your credit file. Look for the{' '}
              <span className="text-emerald-400 font-semibold">“In‑House Financing”</span> button on eligible packages.
            </p>
            <p className="mt-2 text-white/60">
              We can also connect you to lenders and funding pathways when your profile is ready (bureau-pull dependent).
            </p>
          </div>
        </div>

        {/* Educational-first / software value framing (Stripe + general) */}
        <div className="fc-panel p-5 text-sm flex items-start gap-3 border-amber-500/30 bg-amber-500/10">
          <Scale size={18} className="mt-0.5 text-amber-300" />
          <div>
            <div className="font-semibold text-white">What your payment covers</div>
            <p className="mt-1 text-white/70">
              Finely Cred is an educational-first platform. Payments cover your access to the software, resource library, templates,
              and guided workflows — plus coaching/enlightenment sessions where included.
            </p>
            <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-white/70">
              {[
                'Software access + tailored workflow system',
                'Resource library + knowledge base',
                'Templates + letters studio (when entitled)',
                'Enlightenment sessions (when included)',
              ].map((x) => (
                <div key={x} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
                  <CheckCircle2 size={14} className="text-emerald-300" />
                  <span className="truncate">{x}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[11px] text-white/55">
              Educational information only. No guarantees. If you need legal advice, consult a licensed attorney.
            </div>
          </div>
        </div>

        {/* Step 1: DIY vs DFY */}
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => setDeliveryMode('DIY')}
            className={`text-left fc-card border p-6 transition-all ${
              deliveryMode === 'DIY'
                ? 'border-amber-500/50 bg-amber-500/10'
                : 'border-white/10 bg-black/30 hover:bg-white/[0.03]'
            }`}
          >
            <div className="text-white font-semibold">DIY (Do‑It‑Yourself)</div>
            <div className="mt-1 text-white/60 text-sm">
              You use the app + resources + templates. Best for people who want to move fast on their own.
            </div>
          </button>
          <button
            onClick={() => setDeliveryMode('DFY')}
            className={`text-left fc-card border p-6 transition-all ${
              deliveryMode === 'DFY'
                ? 'border-emerald-500/50 bg-emerald-500/10'
                : 'border-white/10 bg-black/30 hover:bg-white/[0.03]'
            }`}
          >
            <div className="text-white font-semibold">DFY (Done‑For‑You)</div>
            <div className="mt-1 text-white/60 text-sm">
              We build your workflow, packets, and strategy with you. Best for complex files and high‑impact outcomes.
            </div>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`fc-pill ${activeTab === tab.key ? 'fc-pill-active' : 'fc-pill-muted'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Description */}
        {activeTab !== 'agency' && tabDescription ? <div className="text-white/60">{tabDescription}</div> : null}

        {/* Personal lanes (Restore vs Building) */}
        {activeTab === 'personal_credit' && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-white/70 text-sm">
              Choose your lane:{' '}
              <span className="text-white/90 font-semibold">Restore</span> (cleanup) or{' '}
              <span className="text-white/90 font-semibold">Building</span> (strengthening).
            </div>
            <div className="inline-flex rounded-xl border border-white/10 bg-black/40 p-1">
              <button
                type="button"
                onClick={() => setPersonalLane('restore')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  personalLane === 'restore' ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                Restore
              </button>
              <button
                type="button"
                onClick={() => setPersonalLane('building')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  personalLane === 'building'
                    ? 'bg-emerald-500 text-black'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                Building
              </button>
            </div>
          </div>
        )}

        {/* Search + progressive disclosure */}
        {activeTab !== 'agency' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-white/60 text-sm">
              Showing <span className="text-white/80 font-semibold">{displayPackages.length}</span> of{' '}
              <span className="text-white/80 font-semibold">{filteredPackages.length}</span>
              {query.trim() ? (
                <>
                  {' '}
                  results for <span className="text-amber-300 font-semibold">“{query.trim()}”</span>
                </>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 border border-white/10">
                <span className="text-[10px] uppercase tracking-widest text-white/40 font-black">Search</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type to filter…"
                  className="bg-transparent outline-none text-sm text-white/80 placeholder:text-white/30 w-48"
                />
              </div>
              {filteredPackages.length > defaultLimit && (
                <button
                  type="button"
                  onClick={() => setShowAll((s) => !s)}
                  className="px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 text-amber-200 text-xs font-black uppercase tracking-widest transition-all"
                >
                  {showAll ? 'Show fewer' : `Show all (${filteredPackages.length})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Debt/legal disclosure (inspired by best practices like KillDebt’s educational disclaimer) */}
        {activeTab === 'debt_legal' && (
          <div className="fc-panel p-5 text-sm flex items-start gap-3 border-amber-500/30 bg-amber-500/10">
            <AlertCircle size={18} className="mt-0.5 text-amber-300" />
            <div>
              <div className="font-semibold text-white">Important legal note</div>
              <p className="mt-1 text-white/70">
                Debt & Legal tools are provided for educational and workflow support. You are responsible for reviewing
                your documents and your state/court rules before filing or serving anything. If you need legal advice,
                consult a licensed attorney.
              </p>
              <p className="mt-2 text-white/70">
                <strong>Financing note:</strong> We do not present in-house financing as a one-click option for debt defense,
                because swapping one debt for another is usually not ideal. If you want a credit-building path, book a free enlightenment session
                and we’ll map the safest strategy.
              </p>
            </div>
          </div>
        )}

        {/* Package Grid or Agency Tiers */}
        {activeTab === 'agency' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agencyTiers
              .filter((t) => t.isPublic)
              .map((tier) => (
                <AgencyTierCard key={tier.id} tier={tier} onSelect={() => handleAgencyTier(tier.id)} />
              ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayPackages.length ? (
              displayPackages.map((pkg, idx) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  variant={variantForTierIndex(idx, visiblePackages.length)}
                  onSelect={(rail) => handleSelect(pkg.id, rail)}
                />
              ))
            ) : (
              <div className="md:col-span-2 lg:col-span-3 fc-panel p-6 text-white/60">
                {query.trim()
                  ? `No matches found. Try a different search.`
                  : `No ${deliveryMode} packages in this category yet. Switch to ${deliveryMode === 'DIY' ? 'DFY' : 'DIY'} to see available options.`}
              </div>
            )}
          </div>
        )}

        {/* Tradeline Promo Extra Info */}
        {activeTab === 'tradeline_promo' && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm flex items-start gap-3">
            <Shield size={18} className="mt-0.5 text-amber-300" />
            <div>
              <div className="font-semibold text-white">How Tradeline Packages Work</div>
              <ul className="mt-2 text-white/70 space-y-1 list-disc pl-4">
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

        {/* CTA */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-white font-semibold">Not sure which package is right for you?</div>
            <div className="text-white/60 text-sm">
              Complete our quick intake and we'll recommend the best path based on your goals.
            </div>
          </div>
          <button
            onClick={() => navigate('/onboarding')}
            className="fc-button-brand"
          >
            Start intake <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </PageShell>
  );
}
