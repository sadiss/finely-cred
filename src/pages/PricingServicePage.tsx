import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, Building2, Scale, Crown, Lock, Gift, Users } from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
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
  categoryLabels,
  type PricingCategory,
  type PricingPackage,
} from '../config/pricingCatalog';
import { AgencyTierCard, PackageCard, variantForTierIndex } from '../components/pricing/PricingCards';

type ServiceSlug =
  | 'personal-credit'
  | 'personal-credit-restore'
  | 'personal-credit-building'
  | 'business-credit'
  | 'debt-legal'
  | 'wealth-builder'
  | 'privacy-id'
  | 'bundles'
  | 'tradelines'
  | 'agencies';

type ServiceMeta = {
  slug: ServiceSlug;
  category: PricingCategory | 'agency';
  title: string;
  subtitle: string;
  filter?: (pkg: PricingPackage) => boolean;
};

function serviceMetaFromSlug(slugRaw: string | undefined): ServiceMeta | null {
  const slug = (slugRaw || '').toLowerCase() as ServiceSlug;

  if (slug === 'personal-credit' || slug === 'personal-credit-restore') {
    return {
      slug: 'personal-credit-restore',
      category: 'personal_credit',
      title: 'Personal Credit Restore',
      subtitle: 'Disputes, deletions, and restoration sequencing to stabilize your personal credit profile.',
      filter: (p) =>
        p.category === 'personal_credit' &&
        (p.id === 'personal_starter' || p.id.startsWith('personal_restore') || p.id.startsWith('personal_platinum')),
    };
  }

  if (slug === 'personal-credit-building') {
    return {
      slug,
      category: 'personal_credit',
      title: 'Personal Credit Building',
      subtitle: 'Thin-file builds, utilization optimization, and maintenance cadence to grow strength over time.',
      filter: (p) =>
        p.category === 'personal_credit' && (p.id.startsWith('personal_build') || p.id.startsWith('personal_maintenance')),
    };
  }

  switch (slug) {
    case 'business-credit':
      return { slug, category: 'business_credit', title: categoryLabels.business_credit, subtitle: categoryDescriptions.business_credit };
    case 'debt-legal':
      return { slug, category: 'debt_legal', title: categoryLabels.debt_legal, subtitle: categoryDescriptions.debt_legal };
    case 'wealth-builder':
      return { slug, category: 'wealth_builder', title: categoryLabels.wealth_builder, subtitle: categoryDescriptions.wealth_builder };
    case 'privacy-id':
      return { slug, category: 'privacy_id', title: categoryLabels.privacy_id, subtitle: categoryDescriptions.privacy_id };
    case 'bundles':
      return { slug, category: 'bundle', title: categoryLabels.bundle, subtitle: categoryDescriptions.bundle };
    case 'tradelines':
      return { slug, category: 'tradeline_promo', title: categoryLabels.tradeline_promo, subtitle: categoryDescriptions.tradeline_promo };
    case 'agencies':
      return { slug, category: 'agency', title: 'Agency Plans', subtitle: 'Tooling and operations tiers for credit repair agencies.' };
    default:
      return null;
  }
}

function getIconFor(category: PricingCategory | 'agency') {
  switch (category) {
    case 'personal_credit':
      return Sparkles;
    case 'business_credit':
      return Building2;
    case 'debt_legal':
      return Scale;
    case 'wealth_builder':
      return Crown;
    case 'privacy_id':
      return Lock;
    case 'bundle':
      return Gift;
    case 'tradeline_promo':
      return Sparkles;
    case 'agency':
      return Users;
    default:
      return Sparkles;
  }
}

function packagesFor(category: PricingCategory): PricingPackage[] {
  switch (category) {
    case 'personal_credit':
      return personalCreditPackages;
    case 'business_credit':
      return businessCreditPackages;
    case 'debt_legal':
      return debtLegalPackages;
    case 'wealth_builder':
      return wealthBuilderPackages;
    case 'privacy_id':
      return privacyPackages;
    case 'bundle':
      return bundlePackages;
    case 'tradeline_promo':
      return tradelinePromoPackages;
    default:
      return [];
  }
}

export default function PricingServicePage() {
  const navigate = useNavigate();
  const params = useParams();
  const basePath = useMemo(() => {
    try {
      // Keep /services working as an alias while /pricing is the canonical public route.
      const p = window.location.pathname || '';
      return p.startsWith('/services') ? '/services' : '/pricing';
    } catch {
      return '/pricing';
    }
  }, []);
  const meta = serviceMetaFromSlug(params.service as ServiceSlug | undefined);
  const category = meta?.category ?? null;
  const [mode, setMode] = useState<'DIY' | 'DFY'>('DFY');

  const goToCheckout = (pkgId: string, rail: 'stripe' | 'in_house') => {
    const next = `/portal/checkout?package=${encodeURIComponent(pkgId)}&rail=${encodeURIComponent(rail)}`;
    const qs = new URLSearchParams();
    qs.set('package', pkgId);
    qs.set('rail', rail);
    qs.set('next', next);
    navigate(`/onboarding?${qs.toString()}`);
  };

  const goToAgencySignup = (tierId?: string) => {
    const qs = new URLSearchParams();
    qs.set('lane', 'agent');
    if (tierId) qs.set('tier', tierId);
    if (tierId) qs.set('next', `/agency/signup?tier=${encodeURIComponent(tierId)}`);
    navigate(`/onboarding?${qs.toString()}`);
  };

  const title = useMemo(() => {
    return meta?.title ?? 'Services';
  }, [meta]);

  const subtitle = useMemo(() => {
    return meta?.subtitle ?? 'Choose a service to view DIY + DFY options.';
  }, [meta]);

  const pkgs = useMemo(() => {
    if (!category || category === 'agency') return [] as PricingPackage[];
    return packagesFor(category)
      .filter((p) => p.isPublic)
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [category]);

  const scopedPkgs = useMemo(() => {
    if (!meta || meta.category === 'agency') return pkgs;
    if (!meta.filter) return pkgs;
    return pkgs.filter(meta.filter);
  }, [pkgs, meta]);

  const visible = useMemo(() => {
    if (!category || category === 'agency') return [] as PricingPackage[];
    if (category === 'bundle' || category === 'tradeline_promo') return scopedPkgs;
    return scopedPkgs.filter((p) =>
      mode === 'DIY' ? p.delivery === 'DIY' || p.delivery === 'HYBRID' : p.delivery === 'DFY' || p.delivery === 'HYBRID',
    );
  }, [category, mode, scopedPkgs]);

  const Icon = category ? getIconFor(category) : Sparkles;

  return (
    <PageShell badge="Services" title={title} subtitle={subtitle}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate(basePath)}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            title="Back to all services"
          >
            <ArrowLeft size={16} /> All services
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-black/30">
            <Icon size={14} className="text-amber-300" />
            <span className="text-[10px] uppercase tracking-widest text-white/60 font-mono">
              {category || 'pricing'}
            </span>
          </div>
        </div>

        {category === 'personal_credit' ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-white/70 text-sm">
              Choose your lane:{' '}
              <span className="text-white/90 font-semibold">Restore</span> (cleanup) or{' '}
              <span className="text-white/90 font-semibold">Building</span> (strengthening).
            </div>
            <div className="inline-flex rounded-xl border border-white/10 bg-black/40 p-1">
              <button
                type="button"
                onClick={() => navigate(`${basePath}/personal-credit-restore`)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  meta?.slug === 'personal-credit-restore'
                    ? 'bg-amber-500 text-black'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                Restore
              </button>
              <button
                type="button"
                onClick={() => navigate(`${basePath}/personal-credit-building`)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  meta?.slug === 'personal-credit-building'
                    ? 'bg-emerald-500 text-black'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                Building
              </button>
            </div>
          </div>
        ) : null}

        {category !== 'agency' ? (
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setMode('DIY')}
              className={`text-left rounded-2xl border p-6 transition-all ${
                mode === 'DIY' ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/10 bg-black/30 hover:bg-white/[0.03]'
              }`}
            >
              <div className="text-white font-semibold">DIY (Do‑It‑Yourself)</div>
              <div className="mt-1 text-white/60 text-sm">Templates, tools, and structured workflows — you execute.</div>
            </button>
            <button
              onClick={() => setMode('DFY')}
              className={`text-left rounded-2xl border p-6 transition-all ${
                mode === 'DFY' ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-black/30 hover:bg-white/[0.03]'
              }`}
            >
              <div className="text-white font-semibold">DFY (Done‑For‑You)</div>
              <div className="mt-1 text-white/60 text-sm">We build the packet strategy + tracking and guide execution.</div>
            </button>
          </div>
        ) : null}

        {category === 'agency' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agencyTiers
              .filter((t) => t.isPublic)
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((tier) => (
                <AgencyTierCard key={tier.id} tier={tier} onSelect={() => goToAgencySignup(tier.id)} />
              ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((pkg, idx) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                variant={variantForTierIndex(idx, Math.max(1, visible.length))}
                onSelect={(rail) => goToCheckout(pkg.id, rail)}
              />
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
          <div className="text-[10px] uppercase tracking-widest text-white/40">How to choose</div>
          <p className="mt-2 text-white/70 text-sm">
            Pick DIY if you want immediate access and you’re comfortable executing the steps yourself. Pick DFY if you want structured execution,
            packet building, and a guided workflow with fewer mistakes and better sequencing.
          </p>
          <ul className="mt-4 space-y-2 text-white/70 text-sm">
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <span>
                <span className="text-white/85 font-semibold">DIY</span>: templates, checklists, and education-first execution.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>
                <span className="text-white/85 font-semibold">DFY</span>: workflow setup, strategy sequencing, and support for complex files.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
              <span>
                If a package includes in-house financing, you’ll see an <span className="text-emerald-300 font-semibold">In-house financing</span> option at checkout.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </PageShell>
  );
}

