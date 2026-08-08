import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Gift } from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { useAuth } from '../auth/AuthProvider';
import { resolvePackageSelectPath } from '../lib/packageCheckoutRouting';
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
  formatBusinessCapitalOutlook,
  formatPrice,
  type PricingCategory,
  type PricingPackage,
  isLetterPackPackage,
} from '../config/pricingCatalog';
import { AgencyTierCard } from '../components/pricing/PricingCards';
import { getPublicAgencyBuyInTiers } from '../config/agencyPartnersProgram';
import { DigitalInviteShareBand } from '../components/digitalCards';
import { captureDigitalInviteCardFromUrl } from '../lib/digitalInviteCardAttribution';
import type { DigitalInviteCardRole } from '../config/digitalInviteCards';
import { PricingPackageCatalog } from '../components/pricing/PricingPackageCatalog';
import { ServicesChooserModal } from '../components/pricing/ServicesChooserModal';
import { BusinessCreditQuotePanel } from '../components/pricing/BusinessCreditQuotePanel';
import { BusinessCreditOneSheetsPanel } from '../components/pricing/BusinessCreditOneSheetsPanel';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLOW_INCLUDES_BTN,
  FINELY_OS_PAGE,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsCatalogCard,
  finelyOsCatalogCardCompact,
  finelyOsLandingIvoryCard,
  finelyOsIvorySolidTile,
  finelyOsLaneCommandHeader,
  FINELY_OS_LANE_COMMAND_KICKER,
  FINELY_OS_LANE_COMMAND_TITLE,
  FINELY_OS_LANE_COMMAND_BODY,
  finelyOsListItem,
  finelyOsViewTab,
  type FinelyOsPublicAccent,
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

/** Restore DIY: Free, Core $49/mo, letter packs, Credit Starter $297 + DFY restore/platinum tiers. */
function isPersonalRestorePackage(p: PricingPackage): boolean {
  if (p.category !== 'personal_credit') return false;
  const id = p.id;
  if (id === 'chexsystems_cleanup' || id === 'early_warning_cleanup') return false;
  if (id.startsWith('personal_build') || id.startsWith('personal_maintenance') || id.includes('maintenance')) {
    return false;
  }
  return (
    id === 'personal_free' ||
    id === 'personal_core' ||
    id === 'personal_starter' ||
    id.startsWith('letters_pack_') ||
    id.startsWith('personal_restore') ||
    id === 'personal_platinum' ||
    id.startsWith('personal_platinum')
  );
}

function serviceMetaFromSlug(slugRaw: string | undefined): ServiceMeta | null {
  const slug = (slugRaw || '').toLowerCase() as ServiceSlug;

  if (slug === 'personal-credit' || slug === 'personal-credit-restore') {
    return {
      slug: 'personal-credit-restore',
      category: 'personal_credit',
      title: 'Personal Credit Restore',
      subtitle: 'Disputes, deletions, and restoration sequencing to stabilize your personal credit profile.',
      filter: isPersonalRestorePackage,
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

function hubAccentFor(category: PricingCategory | 'agency' | null): FinelyOsPublicAccent {
  if (category === 'business_credit') return 'violet';
  if (category === 'debt_legal') return 'fuchsia';
  if (category === 'tradeline_promo' || category === 'wealth_builder' || category === 'agency') return 'amber';
  if (category === 'privacy_id') return 'sky';
  return 'emerald';
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
  const auth = useAuth();
  const params = useParams();
  const [chooserOpen, setChooserOpen] = useState(false);
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
  const isRestoreLane = meta?.slug === 'personal-credit-restore';
  /** Restore defaults DIY so Free surfaces immediately; other lanes keep DFY. */
  const [mode, setMode] = useState<'DIY' | 'DFY'>(() =>
    (params.service || '').toLowerCase() === 'personal-credit-restore' ||
    (params.service || '').toLowerCase() === 'personal-credit'
      ? 'DIY'
      : 'DFY',
  );

  useEffect(() => {
    if (isRestoreLane) setMode('DIY');
  }, [isRestoreLane]);

  usePublicSeoMeta({
    title: meta ? `${meta.title} — Finely Cred pricing` : 'Service pricing — Finely Cred',
    description: meta?.subtitle ?? 'Compare DIY and Done-For-You packages for credit restoration, business credit, debt strategy, and wealth building.',
    path: `${basePath}/${params.service ?? ''}`,
  });

  const goToCheckout = (pkgId: string, rail: 'stripe' | 'in_house') => {
    navigate(
      resolvePackageSelectPath({
        packageId: pkgId,
        rail,
        isAuthed: Boolean(auth.user),
      }),
    );
  };

  const goToAgencySignup = (tierId?: string) => {
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

  const agencyBuyInTiers = useMemo(() => getPublicAgencyBuyInTiers(), []);

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

  /** Service lanes that ship a shareable invite card. */
  const inviteCardRole: DigitalInviteCardRole | null =
    meta?.slug === 'personal-credit-restore'
      ? 'restore'
      : meta?.slug === 'tradelines'
        ? 'tradelines'
        : null;

  useEffect(() => {
    captureDigitalInviteCardFromUrl(window.location.search, window.location.pathname);
  }, [meta?.slug]);

  const currentPath = `${basePath}/${meta?.slug ?? params.service ?? ''}`;
  const accent = hubAccentFor(category);

  return (
    <PageShell hideHero title={title} subtitle={subtitle} surface={isRestoreLane ? 'ivory' : 'default'}>
      <div className={`${FINELY_OS_PAGE}${isRestoreLane ? ' !space-y-4' : ''}`}>
        <header
          className={
            isRestoreLane
              ? `${finelyOsLaneCommandHeader()}`
              : `${finelyOsCatalogCardCompact(accent)} !p-5 sm:!p-6`
          }
          data-fc-accent={accent}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <p
                className={
                  isRestoreLane
                    ? FINELY_OS_LANE_COMMAND_KICKER
                    : `${FINELY_OS_ENTITY_SUBLABEL} tracking-[0.22em]`
                }
              >
                Solutions
              </p>
              <h1
                className={
                  isRestoreLane
                    ? FINELY_OS_LANE_COMMAND_TITLE
                    : `text-2xl sm:text-3xl font-semibold tracking-tight ${FINELY_OS_ENTITY_VALUE}`
                }
              >
                {title}
              </h1>
              <p
                className={
                  isRestoreLane
                    ? FINELY_OS_LANE_COMMAND_BODY
                    : `max-w-2xl text-sm sm:text-base ${FINELY_OS_ENTITY_BODY}`
                }
              >
                {subtitle}
              </p>
              <p
                className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} ${
                  isRestoreLane ? '!text-white/45 !text-left' : ''
                }`}
              >
                Educational only · not legal advice · payments cover software access and guided workflows.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setChooserOpen(true)}
              className={`shrink-0 self-start ${FINELY_OS_GLOW_INCLUDES_BTN}`}
            >
              Switch solution <ArrowRight size={14} />
            </button>
          </div>
        </header>

        {category === 'personal_credit' ? (
          <div
            className={`flex flex-wrap items-center justify-between gap-3 ${
              isRestoreLane ? 'fc-glass-ivory rounded-2xl px-3 py-2.5' : ''
            }`}
          >
            <div className={isRestoreLane ? 'text-sm text-[#0a1628]/70' : FINELY_OS_ENTITY_BODY}>
              Lane:{' '}
              <span className={`font-semibold ${isRestoreLane ? 'text-[#0a1628]' : FINELY_OS_ENTITY_VALUE}`}>
                Restore
              </span>{' '}
              or{' '}
              <span className={`font-semibold ${isRestoreLane ? 'text-[#0a1628]' : FINELY_OS_ENTITY_VALUE}`}>
                Building
              </span>
            </div>
            <div
              className={
                isRestoreLane
                  ? 'inline-flex flex-wrap gap-2 p-1.5 rounded-2xl border border-amber-900/12 bg-white/55 backdrop-blur-md'
                  : FINELY_OS_VIEW_TABS
              }
            >
              <button
                type="button"
                onClick={() => navigate(`${basePath}/personal-credit-restore`)}
                className={
                  isRestoreLane
                    ? `inline-flex items-center justify-center gap-1.5 min-w-[6.5rem] px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                        meta?.slug === 'personal-credit-restore'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                          : 'text-[#0a1628]/55 hover:bg-black/[0.04] hover:text-[#0a1628]'
                      }`
                    : finelyOsViewTab(meta?.slug === 'personal-credit-restore', 'emerald')
                }
              >
                Restore
              </button>
              <button
                type="button"
                onClick={() => navigate(`${basePath}/personal-credit-building`)}
                className={
                  isRestoreLane
                    ? `inline-flex items-center justify-center gap-1.5 min-w-[6.5rem] px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                        meta?.slug === 'personal-credit-building'
                          ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md'
                          : 'text-[#0a1628]/55 hover:bg-black/[0.04] hover:text-[#0a1628]'
                      }`
                    : finelyOsViewTab(meta?.slug === 'personal-credit-building', 'sky')
                }
              >
                Building
              </button>
            </div>
          </div>
        ) : null}

        {isRestoreLane ? (
          <div
            className="fc-admin-solid-emerald rounded-2xl border !p-4 sm:!p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-[0_14px_40px_-14px_rgba(16,185,129,0.55)]"
            data-fc-accent="emerald"
          >
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  <Gift size={12} /> Free DIY
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/75">No credit card</span>
              </div>
              <p className="text-base sm:text-lg font-semibold tracking-tight text-white">Start free access</p>
              <p className="text-xs sm:text-sm leading-relaxed text-white/80">
                Upload and analyze reports, organize documents, and get guided tasks — then upgrade when you are ready.
                Results vary · not legal advice.
              </p>
            </div>
            <button
              type="button"
              onClick={() => goToCheckout('personal_free', 'stripe')}
              className={`shrink-0 self-start sm:self-center ${FINELY_OS_SUCCESS_BTN}`}
            >
              Activate free access <ArrowRight size={16} />
            </button>
          </div>
        ) : null}

        {category === 'business_credit' ? (
          <>
            <BusinessCreditQuotePanel />
            <div className={`${finelyOsCatalogCard('amber')} !p-4`}>
              <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                Program + vendor outlay → potential BC capital (approx)
              </div>
              <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Three figures: Finely Cred program fee · estimated vendor/trade/deposit outlay (partner cash while
                building) · potential capital (business credit only). Results vary · not guaranteed · business credit
                only · funding subject to underwriting · outlay varies by vendors.
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-white/50 border-b border-white/10">
                      <th className="py-2 pr-3 font-semibold">Package</th>
                      <th className="py-2 pr-3 font-semibold">Program fee</th>
                      <th className="py-2 pr-3 font-semibold">Est. vendor/trade outlay</th>
                      <th className="py-2 font-semibold">Potential capital (BC only)</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/75">
                    {businessCreditPackages
                      .filter((p) => p.businessCapitalOutlook)
                      .map((p) => {
                        const o = formatBusinessCapitalOutlook(p)!;
                        return (
                          <tr key={p.id} className="border-b border-white/5">
                            <td className="py-2 pr-3">{p.name}</td>
                            <td className="py-2 pr-3">{o.programLabel}</td>
                            <td className="py-2 pr-3">{o.outlayLabel}</td>
                            <td className="py-2 text-amber-200/90">{o.potentialLabel}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
            <BusinessCreditOneSheetsPanel />
          </>
        ) : null}

        {category === 'debt_legal' ? (
          <div className={`${finelyOsCatalogCard('fuchsia')} !p-4 flex items-start gap-3`}>
            <AlertCircle size={18} className="mt-0.5 text-fuchsia-400 shrink-0" />
            <div className="min-w-0">
              <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Typical debt balance → starting package</div>
              <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Illustrative guidance only — exact package and pricing confirmed after intake. Sticker prices unchanged.
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-white/50 border-b border-white/10">
                      <th className="py-2 pr-3 font-semibold">Typical debt / complexity</th>
                      <th className="py-2 font-semibold">Package (sticker)</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/75">
                    {debtLegalPackages.filter((p) => p.debtBalanceGuidance).map((p) => (
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
        ) : null}

        {category !== 'agency' ? (
          <div className="grid md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMode('DIY')}
              className={
                isRestoreLane
                  ? `fc-glass-ivory rounded-2xl p-4 text-left transition-all ${
                      mode === 'DIY' ? 'ring-2 ring-amber-700/35 brightness-105' : 'hover:brightness-105'
                    }`
                  : finelyOsListItem(mode === 'DIY', 'amber')
              }
            >
              <div className={isRestoreLane ? 'font-semibold tracking-tight text-[#0a1628]' : FINELY_OS_ENTITY_VALUE}>
                DIY (Do‑It‑Yourself)
              </div>
              <div className={`mt-1 ${isRestoreLane ? 'text-sm text-[#0a1628]/70' : FINELY_OS_ENTITY_BODY}`}>
                Templates, tools, and structured workflows — you execute.
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode('DFY')}
              className={
                isRestoreLane
                  ? `fc-glass-ivory rounded-2xl p-4 text-left transition-all ${
                      mode === 'DFY' ? 'ring-2 ring-emerald-700/35 brightness-105' : 'hover:brightness-105'
                    }`
                  : finelyOsListItem(mode === 'DFY', 'emerald')
              }
            >
              <div className={isRestoreLane ? 'font-semibold tracking-tight text-[#0a1628]' : FINELY_OS_ENTITY_VALUE}>
                DFY (Done‑For‑You)
              </div>
              <div className={`mt-1 ${isRestoreLane ? 'text-sm text-[#0a1628]/70' : FINELY_OS_ENTITY_BODY}`}>
                We build the packet strategy + tracking and guide execution.
              </div>
            </button>
          </div>
        ) : null}

        {category === 'agency' ? (
          <div className="space-y-6">
            <div className={`${finelyOsCatalogCard('emerald')} !p-5 sm:!p-6 space-y-3`}>
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Step 1 — one-time buy-in</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {agencyBuyInTiers.map((b) => (
                  <div key={b.id} className="rounded-xl border-2 border-emerald-200 bg-white px-4 py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-base font-bold text-slate-900">{b.name}</span>
                      <span className="text-lg font-black text-emerald-700">{b.priceLabel}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{b.tagline}</p>
                  </div>
                ))}
              </div>
              <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                Buy-in activates your workspace + training seat. Pick a capacity tier below for ongoing payout %.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agencyTiers
                .filter((t) => t.isPublic)
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((tier) => (
                  <AgencyTierCard key={tier.id} tier={tier} onSelect={() => goToAgencySignup(tier.id)} />
                ))}
            </div>
          </div>
        ) : (
          <PricingPackageCatalog
            packages={visible}
            pageSize={6}
            includePersonalCompare={category === 'personal_credit'}
            cardSurface={isRestoreLane ? 'adminSolid' : 'default'}
            searchPlaceholder="Search packages…"
            selectLabel="Select"
            onSelect={(pkgId) => {
              const pkg = visible.find((p) => p.id === pkgId);
              const rail = pkg?.rail === 'in_house' ? 'in_house' : 'stripe';
              goToCheckout(pkgId, rail);
            }}
          />
        )}

        <MarketingStaffChatStrip
          roleId="sales_closer"
          goal="personal"
          roleLabel="solutions advisor"
          subline="Not sure which package in this category fits? Chat before checkout."
          buttonTone="secondary"
          surface={isRestoreLane ? 'ivory' : 'default'}
        />

        {inviteCardRole ? (
          <DigitalInviteShareBand role={inviteCardRole} surface={isRestoreLane ? 'ivory' : 'default'} />
        ) : null}

        {isRestoreLane ? null : <FinelyOsPageFooter />}
      </div>

      <ServicesChooserModal open={chooserOpen} onClose={() => setChooserOpen(false)} activePath={currentPath} />
    </PageShell>
  );
}
