import React, { useState } from 'react';
import { ArrowRight, Check, Shield, Sparkles, Star, Clock, Users, TrendingUp, CreditCard, UploadCloud, Gavel, FileText, ShieldCheck, Target, BriefcaseBusiness } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { FlashyIcon } from '../components/ui';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { StaffPortraitImg } from '../components/staff/StaffPortraitImg';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { resolveStaffOnDuty } from '../data/staffRoster';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { isNoraCapitalConfigured } from '../data/settingsRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsLightContrastBand,
  finelyOsLightHeroPanel,
  FINELY_OS_PLATINUM_BTN,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
} from '../features/os/finelyOsLightUi';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../components/tours/FinelyNoticedStrip';
import { buildPersonalCreditNoticedItems } from '../lib/finelyProactiveSignals';
import { personalCreditPackages, formatPrice } from '../config/pricingCatalog';
import { PricingPackageCatalog } from '../components/pricing/PricingPackageCatalog';

type PcTab = 'overview' | 'packages' | 'process' | 'platform' | 'funding';

const STATS = [
  { value: '700+', label: 'Funding-readiness target path', icon: Target, accent: 'emerald' as const },
  { value: '45 days', label: 'First review window', icon: Clock, accent: 'amber' as const },
  { value: '3 bureaus', label: 'Comprehensive coverage', icon: Shield, accent: 'violet' as const },
  { value: '24/7', label: 'Platform access', icon: Users, accent: 'sky' as const },
];

const PROCESS_STEPS = [
  {
    step: 1,
    title: 'Credit Analysis',
    description: 'We analyze your credit reports from all three bureaus to identify every disputable item.',
  },
  {
    step: 2,
    title: 'Strategy Planning',
    description: 'Custom dispute strategy based on your unique situation, goals, and timeline.',
  },
  {
    step: 3,
    title: 'Dispute Execution',
    description: 'Professional dispute letters sent to bureaus and furnishers with proper documentation.',
  },
  {
    step: 4,
    title: 'Monitor & Adjust',
    description: 'Track responses, escalate when needed, and continue with documented follow-through.',
  },
];

export default function PersonalCreditPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<PcTab>('overview');
  const noraOn = isNoraCapitalConfigured();
  const onDutyCoach = resolveStaffOnDuty('dispute_coach');
  usePublicSeoMeta({
    title: 'Personal credit restoration',
    description: 'Professional dispute letters, bureau coverage, and a path to funding readiness with Nora Capital Group when your file is ready.',
    path: '/personal-credit',
  });

  const goToCheckout = (pkgId: string, rail?: 'stripe' | 'in_house') => {
    const next = `/portal/checkout?package=${encodeURIComponent(pkgId)}${rail ? `&rail=${encodeURIComponent(rail)}` : ''}`;
    const qs = new URLSearchParams();
    qs.set('package', pkgId);
    if (rail) qs.set('rail', rail);
    qs.set('next', next);
    navigate(`/onboarding?${qs.toString()}`);
  };

  // Get the flagship package for hero section
  const platinumPkg = personalCreditPackages.find((p) => p.id === 'personal_platinum');
  const restorePkg = personalCreditPackages.find((p) => p.id === 'personal_restore');
  const starterPkg = personalCreditPackages.find((p) => p.id === 'personal_starter');

  return (
    <PageShell
      badge="Personal Credit"
      title="Restore Your Credit. Reclaim Your Future."
      subtitle="We handle dispute letters and tracking — you focus on your goals."
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple space-y-8`}>
        <FinelyNoticedStrip items={buildPersonalCreditNoticedItems({ tab })} />
        <FinelyNowDoThisStrip currentIndex={tab === 'packages' ? 0 : tab === 'overview' ? 0 : 1} />
        <FinelyUnifiedHubLayout
          eyebrow="Personal credit lane"
          title="Restore & build — one calm section at a time"
          subtitle="Pick a tab for packages, process, platform tools, or your funding handoff."
          accent="amber"
          kpis={STATS.map((s) => ({ label: s.label, value: s.value, accent: s.accent }))}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'packages', label: 'Packages' },
            { id: 'process', label: 'Process' },
            { id: 'platform', label: 'The OS' },
            { id: 'funding', label: 'Funding path' },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as PcTab)}
          primaryAction={{ label: 'Start intake', onClick: () => navigate('/onboarding') }}
          secondaryAction={{ label: 'Fundability hub', onClick: () => navigate('/fundability-readiness') }}
          detailSlot={
            <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>Results vary · not legal advice · educational dispute workflow only.</p>
          }
        >
        {tab === 'overview' && (
        <>
        {/* Hero Package - Platinum */}
        {platinumPkg && (
          <div className={`relative overflow-hidden ${finelyOsLightHeroPanel()}`} data-fc-accent="amber">
            <div className="relative flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-6 min-w-0">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10">
                  <FlashyIcon icon={Star} color="amber" size="xs" className="!w-9 !h-9 !rounded-xl" />
                  <span className="text-amber-700 text-xs font-semibold uppercase tracking-wider">Premium Experience</span>
                </div>

                <h2 className={`text-3xl md:text-4xl font-bold ${FINELY_OS_ENTITY_VALUE}`}>{platinumPkg.name}</h2>
                <p className={`${FINELY_OS_ENTITY_BODY} text-lg`}>{platinumPkg.description}</p>

                <ul className="space-y-3">
                  {platinumPkg.highlights.map((h, i) => (
                    <li key={i} className={`flex items-start gap-3 ${FINELY_OS_ENTITY_BODY}`}>
                      <FlashyIcon icon={Check} color="emerald" size="xs" className="!w-7 !h-7 !rounded-lg mt-0.5 flex-shrink-0" />
                      <span className={FINELY_OS_ENTITY_BODY}>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:w-80 flex flex-col items-center justify-center min-w-0">
                <div className="text-center space-y-4">
                  <div>
                    <div className={`text-5xl font-bold ${FINELY_OS_ENTITY_VALUE}`}>{formatPrice(platinumPkg.priceAmount)}</div>
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-1`}>One-time investment</div>
                  </div>

                  <div className="space-y-2 w-full">
                    <button type="button" onClick={() => goToCheckout(platinumPkg.id, 'stripe')} className={`w-full justify-center ${FINELY_OS_PRIMARY_BTN} !py-4 !text-xs`}>
                      Get started <ArrowRight size={16} />
                    </button>
                    <button type="button" onClick={() => goToCheckout(platinumPkg.id, 'in_house')} className={`w-full justify-center ${FINELY_OS_SUCCESS_BTN} !py-3 !text-sm !font-semibold !normal-case !tracking-normal`}>
                      <Sparkles size={14} />
                      Finance & build credit
                    </button>
                  </div>

                  <p className="text-emerald-700 text-xs">Financing reports to Equifax as positive tradeline</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`${finelyOsCatalogCard('sky')} !p-6 text-center space-y-3`} data-fc-accent="sky">
          <p className={FINELY_OS_ENTITY_BODY}>Ready to browse packages or see the full process?</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => setTab('packages')} className={FINELY_OS_SECONDARY_BTN}>
              View packages
            </button>
            <button type="button" onClick={() => setTab('process')} className={FINELY_OS_PRIMARY_BTN}>
              Our process
            </button>
          </div>
        </div>
        </>
        )}

        {tab === 'packages' && (
        <>
        {/* Choose your card (matches homepage hero credit cards) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className={FINELY_OS_ENTITY_TITLE}>Choose Your Card</h2>
              <p className={`${FINELY_OS_ENTITY_BODY} mt-1`}>
                Same program — different depth. Pick the lane that matches your timeline and complexity.
              </p>
            </div>
            <button type="button" onClick={() => navigate('/pricing')} className={FINELY_OS_SECONDARY_BTN}>
              View full pricing <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {starterPkg && (
              <div className={`${finelyOsCatalogCard('amber')} !p-5 space-y-4`} data-fc-accent="amber">
                <div className="space-y-2">
                  <div className={`${FINELY_OS_ENTITY_VALUE} text-lg font-semibold`}>{starterPkg.name}</div>
                  <div className="text-amber-700/90 text-sm">{starterPkg.tagline}</div>
                  <div className={`text-3xl font-bold ${FINELY_OS_ENTITY_VALUE}`}>{formatPrice(starterPkg.priceAmount)}</div>
                </div>
                <button type="button" onClick={() => goToCheckout(starterPkg.id, 'stripe')} className={`w-full justify-center ${FINELY_OS_SECONDARY_BTN}`}>
                  Start DIY <ArrowRight size={14} />
                </button>
              </div>
            )}

            {restorePkg && (
              <div className={`${finelyOsCatalogCard('emerald')} !p-5 space-y-4`} data-fc-accent="emerald">
                <div className="space-y-2">
                  <div className={`${FINELY_OS_ENTITY_VALUE} text-lg font-semibold`}>{restorePkg.name}</div>
                  <div className="text-emerald-700/90 text-sm">{restorePkg.tagline}</div>
                  <div className={`text-3xl font-bold ${FINELY_OS_ENTITY_VALUE}`}>{formatPrice(restorePkg.priceAmount)}</div>
                </div>
                <button type="button" onClick={() => goToCheckout(restorePkg.id)} className={`w-full justify-center ${FINELY_OS_PRIMARY_BTN}`}>
                  Get started <ArrowRight size={14} />
                </button>
              </div>
            )}

            {platinumPkg && (
              <div className={`${finelyOsCatalogCard('sky')} !p-5 space-y-4 ring-1 ring-sky-400/25`} data-fc-accent="sky">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-400/30 bg-sky-500/10 text-sky-200 text-[10px] font-black uppercase tracking-widest">
                  Premium
                </div>
                <div className="space-y-2">
                  <div className={`${FINELY_OS_ENTITY_VALUE} text-lg font-semibold`}>{platinumPkg.name}</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>{platinumPkg.tagline}</div>
                  <div className={`text-3xl font-bold ${FINELY_OS_ENTITY_VALUE}`}>{formatPrice(platinumPkg.priceAmount)}</div>
                </div>
                <button type="button" onClick={() => goToCheckout(platinumPkg.id, 'in_house')} className={`w-full justify-center ${FINELY_OS_SUCCESS_BTN}`}>
                  Finance & build credit <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* All packages — grouped catalog (no long comparison table) */}
        <div className={`${finelyOsCatalogCard('violet')} !p-6 space-y-4`} data-fc-accent="violet">
          <div>
            <h2 className={FINELY_OS_ENTITY_TITLE}>Browse all packages</h2>
            <p className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>
              Letter packs and restore tiers are grouped — search or paginate instead of scrolling a long list.
            </p>
          </div>
          <PricingPackageCatalog
            packages={personalCreditPackages}
            pageSize={6}
            includePersonalCompare
            searchPlaceholder="Search restore tiers, letter packs…"
            onSelect={(pkgId) => {
              const pkg = personalCreditPackages.find((p) => p.id === pkgId);
              const preferredRail =
                pkg?.rail === 'in_house' ? 'in_house' : pkg?.rail === 'stripe' ? 'stripe' : undefined;
              goToCheckout(pkgId, preferredRail);
            }}
          />
        </div>
        </>
        )}

        {tab === 'process' && (
        <>
        <div className={finelyOsLightContrastBand()} data-fc-contrast-band="1">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-400">How it works</p>
            <h2 className="fc-light-contrast-title text-3xl md:text-4xl font-bold">Our Process</h2>
            <p className="fc-light-contrast-body max-w-2xl mx-auto text-lg">
              Four disciplined steps — evidence-first, bureau-aware, and built for funding readiness.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {PROCESS_STEPS.map((step) => (
              <div key={step.step} className={`space-y-3 ${finelyOsCatalogCard(step.step % 2 === 0 ? 'emerald' : 'amber')}`} data-fc-accent={step.step % 2 === 0 ? 'emerald' : 'amber'}>
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
                  <span className="text-amber-700 font-bold">{step.step}</span>
                </div>
                <h3 className="fc-light-contrast-title font-semibold text-lg">{step.title}</h3>
                <p className="fc-light-contrast-body text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
        </div>
        </>
        )}

        {tab === 'platform' && (
        <>
        {/* The OS (what you actually get) */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className={FINELY_OS_ENTITY_TITLE}>The Finely Cred OS</h2>
              <p className={`${FINELY_OS_ENTITY_BODY} mt-1`}>
                This isn’t a static “service page.” You get a system: uploads, evidence discipline, dispute execution, letters, and tracking.
              </p>
            </div>
            <button type="button" onClick={() => navigate('/onboarding')} className={FINELY_OS_PRIMARY_BTN}>
              Start intake <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: UploadCloud,
                title: 'Report Upload + Parsing',
                desc: 'Upload IdentityIQ/MyScoreIQ exports (HTML/PDF). Parse tradelines + payment history for clean targeting.',
              },
              {
                icon: ShieldCheck,
                title: 'Evidence Vault',
                desc: 'Store proof packs and label everything so follow-ups are disciplined (not guesswork).',
              },
              {
                icon: Gavel,
                title: 'Dispute Center',
                desc: 'Track items, rounds, deadlines, and follow-up windows by bureau.',
              },
              {
                icon: FileText,
                title: 'Letter Generator',
                desc: 'Generate printable letters and keep PDFs in your vault for an audit trail.',
              },
              {
                icon: Sparkles,
                title: 'AI Suggestions (safe + scoped)',
                desc: 'Turn parsed report signals into next-best actions (education-first, no legal advice).',
              },
              {
                icon: Target,
                title: 'Milestones + Readiness',
                desc: 'Move from stabilization → approvals → funding readiness with clear sequencing.',
              },
            ].map((x, idx) => {
              const Icon = x.icon;
              const accent = (['amber', 'emerald', 'sky', 'violet'] as const)[idx % 4];
              return (
                <div key={x.title} className={`space-y-3 ${finelyOsCatalogCard(accent)} !p-5`} data-fc-accent={accent}>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                    <Icon size={20} className="text-amber-700" />
                  </div>
                  <div className={FINELY_OS_ENTITY_VALUE}>{x.title}</div>
                  <div className={FINELY_OS_ENTITY_BODY}>{x.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
        </>
        )}

        {tab === 'funding' && (
        <>
        {/* Financing Promo */}
        <div className="fc-funding-promo-band" data-fc-contrast-band="1">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-black/10 border border-black/10 flex items-center justify-center">
              <TrendingUp size={28} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-[#0d1512] fc-light-contrast-title mb-2">Build Credit While You Pay</h3>
              <p className="text-[#0d1512]/70 fc-light-contrast-body">
                Our in-house financing reports your payments to Equifax. This means you're not just
                restoring your credit — you're actively building a positive installment tradeline at the same time.
                Education-first and milestone-based.
              </p>
            </div>
            <button
              onClick={() => navigate('/pricing?tab=tradeline_promo')}
              className="flex-shrink-0 fc-button-brand inline-flex items-center gap-2 px-5 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              View tradeline packages <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Wealth Builder + Nora Capital handoff */}
        <div className={`${finelyOsCatalogCard('violet')} !p-6`} data-fc-accent="violet">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
              <BriefcaseBusiness size={24} className="text-violet-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`${FINELY_OS_ENTITY_TITLE} mb-2`}>
                Next step: Wealth Builder &amp; funding readiness
                {noraOn ? ' · Powered by Nora Capital Group' : ''}
              </h3>
              <p className={FINELY_OS_ENTITY_BODY}>
                Once your credit profile is stabilized, Finely transitions you into funding readiness and wealth acceleration.
                {noraOn
                  ? ' Nora Capital Group handles loan origination — Finely sends a readiness snapshot when you apply from Wealth Paths.'
                  : ' Wealth Paths unlock lender-facing packaging when your restore milestones are complete.'}
              </p>
              <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                Results vary · not legal advice · funding subject to Nora Capital Group underwriting and eligibility.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <button type="button" onClick={() => navigate('/pricing')} className={FINELY_OS_SECONDARY_BTN}>
                View Wealth Builder <ArrowRight size={14} />
              </button>
              <button type="button" onClick={() => navigate('/onboarding')} className={FINELY_OS_SUCCESS_BTN}>
                Start free guide <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
        </>
        )}

        </FinelyUnifiedHubLayout>

        <MarketingStaffChatStrip
          roleId="dispute_coach"
          goal="personal"
          roleLabel="dispute specialist"
          subline="Ask about packages, dispute workflow, or whether DIY vs done-for-you fits your file."
        />

        <div className={`${finelyOsCatalogCard('emerald')} !p-6`} data-fc-accent="emerald">
          <div className={`flex flex-wrap items-center justify-center gap-8 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <div className="flex items-center gap-2">
              <Shield size={20} />
              <span className={FINELY_OS_ENTITY_BODY}>Secure & Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={20} />
              <span className={FINELY_OS_ENTITY_BODY}>Fast Turnaround</span>
            </div>
            <div className="flex items-center gap-2">
              {onDutyCoach ? (
                <>
                  <StaffPortraitImg staff={onDutyCoach} className="w-8 h-8 rounded-full border border-emerald-400/30" />
                  <span className={FINELY_OS_ENTITY_BODY}>
                    Expert support — {onDutyCoach.firstName}, dispute specialist
                  </span>
                </>
              ) : (
                <>
                  <Users size={20} />
                  <span className={FINELY_OS_ENTITY_BODY}>Expert Support</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Star size={20} />
              <span className={FINELY_OS_ENTITY_BODY}>Proven Results</span>
            </div>
          </div>
        </div>

        <div className={finelyOsLightContrastBand('py-14')} data-fc-contrast-band="1">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-400">Take the first step</p>
            <h2 className="fc-light-contrast-title text-3xl md:text-4xl font-bold">Ready to Transform Your Credit?</h2>
            <p className="fc-light-contrast-body max-w-xl mx-auto text-lg">
              Start with our quick intake to see which package fits your situation. No commitment required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button type="button" onClick={() => navigate('/onboarding')} className={`${FINELY_OS_PRIMARY_BTN} !px-8 !py-4 relative z-[1]`}>
                Start intake <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/consultation?lane=' + encodeURIComponent('Personal Credit'))}
                className={`${FINELY_OS_PLATINUM_BTN} !px-8 !py-4 !text-xs relative z-[1]`}
              >
                Book a free strategy call <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
