import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Building2, Scale, Crown, Lock, Gift, Users } from 'lucide-react';
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
  isLetterPackPackage,
} from '../config/pricingCatalog';
import { AgencyTierCard } from '../components/pricing/PricingCards';
import { PricingPackageCatalog } from '../components/pricing/PricingPackageCatalog';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { FinelyUnifiedHubLayout, FinelyUnifiedSection } from '../features/unified/FinelyUnifiedHubLayout';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_TOOLBAR,
  FINELY_OS_VIEW_TABS,
  finelyOsListItem,
  finelyOsViewTab,
} from '../features/os/finelyOsLightUi';

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
      const p = window.location.pathname || '';
      return p.startsWith('/services') ? '/services' : '/pricing';
    } catch {
      return '/pricing';
    }
  }, []);
  const meta = serviceMetaFromSlug(params.service as ServiceSlug | undefined);
  const category = meta?.category ?? null;
  const [mode, setMode] = useState<'DIY' | 'DFY'>('DFY');

  usePublicSeoMeta({
    title: meta ? `${meta.title} — Finely Cred pricing` : 'Service pricing — Finely Cred',
    description: meta?.subtitle ?? 'Compare DIY and Done-For-You packages for credit restoration, business credit, debt strategy, and wealth building.',
    path: `${basePath}/${params.service ?? ''}`,
  });

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

  const title = useMemo(() => meta?.title ?? 'Services', [meta]);
  const subtitle = useMemo(() => meta?.subtitle ?? 'Choose a service to view DIY + DFY options.', [meta]);

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
    return scopedPkgs.filter((p) => {
      if (mode === 'DFY' && isLetterPackPackage(p)) return false;
      return mode === 'DIY' ? p.delivery === 'DIY' || p.delivery === 'HYBRID' : p.delivery === 'DFY' || p.delivery === 'HYBRID';
    });
  }, [category, mode, scopedPkgs]);

  const Icon = category ? getIconFor(category) : Sparkles;

  type SvcTab = 'packages' | 'compare' | 'fundability';
  const [svcTab, setSvcTab] = useState<SvcTab>('packages');

  const svcKpis = useMemo(
    () => [
      {
        label: 'Packages',
        value: category === 'agency' ? String(agencyTiers.filter((t) => t.isPublic).length) : String(visible.length),
        hint: category === 'agency' ? 'Agency tiers' : `${mode} options`,
        accent: 'emerald' as const,
      },
      { label: 'Delivery', value: mode, hint: 'Current view', accent: 'amber' as const },
      { label: 'Category', value: category === 'agency' ? 'Agency' : (categoryLabels[category as PricingCategory] ?? 'Service').split(' ')[0]!, hint: 'Service lane', accent: 'violet' as const },
      { label: 'Checkout', value: 'Stripe + in-house', hint: 'Rails at checkout', accent: 'sky' as const },
    ],
    [category, mode, visible.length],
  );

  return (
    <PageShell badge="Services" title={title} subtitle={subtitle}>
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate(basePath)} className={FINELY_OS_BACK_LINK} title="Back to all services">
            <ArrowLeft size={16} /> All services
          </button>
          <div className={`${FINELY_OS_TOOLBAR} !p-2 inline-flex items-center gap-2`}>
            <Icon size={14} className="text-fuchsia-400" />
            <span className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{category || 'pricing'}</span>
          </div>
        </div>

        {category === 'personal_credit' ? (
          <div className={`${FINELY_OS_TOOLBAR} flex-wrap justify-between`}>
            <div className={FINELY_OS_ENTITY_BODY}>
              Choose your lane: <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Restore</span> (cleanup) or{' '}
              <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Building</span> (strengthening).
            </div>
            <div className={FINELY_OS_VIEW_TABS}>
              <button
                type="button"
                onClick={() => navigate(`${basePath}/personal-credit-restore`)}
                className={finelyOsViewTab(meta?.slug === 'personal-credit-restore', 'emerald')}
              >
                Restore
              </button>
              <button
                type="button"
                onClick={() => navigate(`${basePath}/personal-credit-building`)}
                className={finelyOsViewTab(meta?.slug === 'personal-credit-building', 'emerald')}
              >
                Building
              </button>
            </div>
          </div>
        ) : null}

        <FinelyUnifiedHubLayout
          eyebrow="Service pricing"
          title={title}
          subtitle={subtitle}
          accent="emerald"
          kpis={svcKpis}
          tabs={[
            { id: 'packages', label: 'Packages' },
            { id: 'compare', label: 'Compare DIY vs DFY' },
            { id: 'fundability', label: 'Fundability path' },
          ]}
          activeTab={svcTab}
          onTabChange={(id) => setSvcTab(id as SvcTab)}
          primaryAction={{ label: 'All services', onClick: () => navigate(basePath) }}
          secondaryAction={{ label: 'Fundability hub', onClick: () => navigate('/fundability-readiness') }}
        >
          {svcTab === 'packages' && (
            <div className="space-y-6">
        {category !== 'agency' ? (
          <div className="grid md:grid-cols-2 gap-4">
            <button type="button" onClick={() => setMode('DIY')} className={finelyOsListItem(mode === 'DIY', 'amber')}>
              <div className={FINELY_OS_ENTITY_VALUE}>DIY (Do‑It‑Yourself)</div>
              <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>Templates, tools, and structured workflows — you execute.</div>
            </button>
            <button type="button" onClick={() => setMode('DFY')} className={finelyOsListItem(mode === 'DFY', 'emerald')}>
              <div className={FINELY_OS_ENTITY_VALUE}>DFY (Done‑For‑You)</div>
              <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>We build the packet strategy + tracking and guide execution.</div>
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
          <PricingPackageCatalog
            packages={visible}
            pageSize={6}
            includePersonalCompare={category === 'personal_credit'}
            searchPlaceholder="Search packages…"
            selectLabel="Select"
            onSelect={(pkgId) => {
              const pkg = visible.find((p) => p.id === pkgId);
              const rail = pkg?.rail === 'in_house' ? 'in_house' : 'stripe';
              goToCheckout(pkgId, rail);
            }}
          />
        )}
            </div>
          )}

          {svcTab === 'compare' && (
            <FinelyUnifiedSection title="How to choose" subtitle="DIY vs DFY — pick the execution style that fits.">
        <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
          <p className={FINELY_OS_ENTITY_BODY}>
            Pick DIY if you want immediate access and you’re comfortable executing the steps yourself. Pick DFY if you want structured execution,
            packet building, and a guided workflow with fewer mistakes and better sequencing.
          </p>
          <ul className={`space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>
                <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>DIY</span>: templates, checklists, and education-first execution.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>
                <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>DFY</span>: workflow setup, strategy sequencing, and support for complex files.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
              <span>
                If a package includes in-house financing, you’ll see an <span className="text-emerald-300 font-semibold">In-house financing</span> option at checkout.
              </span>
            </li>
          </ul>
        </div>
            </FinelyUnifiedSection>
          )}

          {svcTab === 'fundability' && (
            <FinelyUnifiedSection title="Fundability-first checkout" subtitle="Packages are a lane — fundability is the destination.">
              <p className={FINELY_OS_ENTITY_BODY}>
                Before you commit, scan your fundability readiness. The hub shows personal + business signals, next actions, and when Nora Capital
                handoff makes sense.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={() => navigate('/fundability-readiness')} className={FINELY_OS_PRIMARY_BTN}>
                  Open fundability hub
                </button>
                <button type="button" onClick={() => navigate('/onboarding')} className={FINELY_OS_SECONDARY_BTN}>
                  Get started
                </button>
              </div>
              <div className="mt-6">
                <MarketingStaffChatStrip
                  roleId="sales_closer"
                  goal="personal"
                  roleLabel="solutions advisor"
                  subline="Not sure which package in this category fits? Chat before checkout."
                  buttonTone="secondary"
                />
              </div>
            </FinelyUnifiedSection>
          )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
