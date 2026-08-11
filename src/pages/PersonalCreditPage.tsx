import React from 'react';
import {
  ArrowRight,
  Shield,
  Sparkles,
  Star,
  Clock,
  Users,
  UploadCloud,
  Gavel,
  FileText,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { useAuth } from '../auth/AuthProvider';
import { resolvePackageSelectPath } from '../lib/packageCheckoutRouting';
import { finelyCtaNavigate, resolveFinelyCtaPath } from '../lib/finelyCtaIntent';
import { FlashyIcon } from '../components/ui';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { StaffPortraitImg } from '../components/staff/StaffPortraitImg';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { DedicatedSheetLinkStrip } from '../components/resources/DedicatedSheetLinkStrip';
import { resolveStaffOnDuty } from '../data/staffRoster';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { FINELY_OS_ENTITY_TITLE, FINELY_OS_PAGE } from '../features/os/finelyOsLightUi';
import { FinelyNowDoThisStrip } from '../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../components/tours/FinelyNoticedStrip';
import { buildPersonalCreditNoticedItems } from '../lib/finelyProactiveSignals';
import { personalCreditPackages, formatPrice } from '../config/pricingCatalog';
import { PricingPackageCatalog } from '../components/pricing/PricingPackageCatalog';
import {
  PersonalCreditCommandStrip,
  PersonalCreditHeroShell,
  PersonalCreditRestoreSpectrum,
} from '../features/personalCredit/PersonalCreditHeroShell';
import { PC_RESTORE_BTN, pcRestoreCardClass } from '../features/personalCredit/personalCreditRestoreButtons';
import '../features/personalCredit/personalCreditRestoreVisual.css';


const STATS = [
  { value: '700+', label: 'Score path partners target', accent: 'emerald' as const },
  { value: '45 days', label: 'First review window', accent: 'amber' as const },
  { value: '3 bureaus', label: 'Comprehensive coverage', accent: 'violet' as const },
  { value: '24/7', label: 'Platform access', accent: 'sky' as const },
];

const PROCESS_STEPS = [
  {
    step: 1,
    title: 'Credit Analysis',
    description: 'We analyze your credit reports from all three bureaus to identify every disputable item.',
    accent: 'rose' as const,
  },
  {
    step: 2,
    title: 'Strategy Planning',
    description: 'Custom dispute strategy based on your unique situation, goals, and timeline.',
    accent: 'amber' as const,
  },
  {
    step: 3,
    title: 'Dispute Execution',
    description: 'Professional dispute letters sent to bureaus and furnishers with proper documentation.',
    accent: 'sky' as const,
  },
  {
    step: 4,
    title: 'Monitor & Adjust',
    description: 'Track responses, escalate when needed, and continue with documented follow-through.',
    accent: 'emerald' as const,
  },
];

const OS_TILE_ACCENTS = ['emerald', 'sky', 'violet', 'amber'] as const;

const OS_ICON_ACCENT: Record<
  (typeof OS_TILE_ACCENTS)[number],
  { wrap: string; icon: string; tile: string }
> = {
  emerald: {
    wrap: 'border-emerald-400/30 bg-emerald-500/15',
    icon: 'text-emerald-300',
    tile: 'pc-restore-os-tile--emerald',
  },
  sky: {
    wrap: 'border-sky-400/30 bg-sky-500/15',
    icon: 'text-sky-300',
    tile: 'pc-restore-os-tile--sky',
  },
  violet: {
    wrap: 'border-violet-400/30 bg-violet-500/15',
    icon: 'text-violet-300',
    tile: 'pc-restore-os-tile--violet',
  },
  amber: {
    wrap: 'border-amber-400/30 bg-amber-500/15',
    icon: 'text-amber-300',
    tile: 'pc-restore-os-tile--amber',
  },
};

const OS_TILES = [
  { icon: UploadCloud, title: 'Report Upload + Parsing', desc: 'Upload bureau exports (HTML/PDF). Parse tradelines for clean targeting.', href: resolveFinelyCtaPath('personal_intake') },
  { icon: ShieldCheck, title: 'Evidence Vault', desc: 'Store proof packs and label everything for disciplined follow-ups.', href: '/resources/videos' },
  { icon: Gavel, title: 'Dispute Center', desc: 'Track items, rounds, deadlines, and follow-up windows by bureau.', href: '/free-guide/read' },
  { icon: FileText, title: 'Letter Generator', desc: 'Generate printable letters and keep PDFs in your vault.', href: '/free-guide' },
  { icon: Sparkles, title: 'AI Suggestions (scoped)', desc: 'Education-first next actions from parsed report signals.', href: '/resources/videos' },
  { icon: Target, title: 'Milestones + tracking', desc: 'Stabilization → dispute rounds → documented follow-through.', href: resolveFinelyCtaPath('personal_intake') },
];

function PersonalCreditPackageCards({
  starterPkg,
  restorePkg,
  platinumPkg,
  goToCheckout,
}: {
  starterPkg: (typeof personalCreditPackages)[number] | undefined;
  restorePkg: (typeof personalCreditPackages)[number] | undefined;
  platinumPkg: (typeof personalCreditPackages)[number] | undefined;
  goToCheckout: (pkgId: string, rail?: 'stripe' | 'in_house') => void;
}) {
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {starterPkg ? (
        <div className={`${pcRestoreCardClass('amber')} space-y-4`}>
          <div className="space-y-1">
            <div className="font-semibold text-lg pc-restore-card-ink">{starterPkg.name}</div>
            <div className="text-amber-800/90 text-sm">{starterPkg.tagline}</div>
            <div className="text-3xl font-bold pc-restore-card-ink">{formatPrice(starterPkg.priceAmount)}</div>
          </div>
          <button type="button" onClick={() => goToCheckout(starterPkg.id, 'stripe')} className={`w-full ${PC_RESTORE_BTN.ghost}`}>
            Start DIY <ArrowRight size={14} />
          </button>
        </div>
      ) : null}
      {restorePkg ? (
        <div className={`${pcRestoreCardClass('emerald')} space-y-4 ring-1 ring-emerald-400/20`}>
          <span className="inline-flex px-2 py-0.5 rounded-full border border-emerald-400/35 bg-emerald-500/10 text-emerald-800 text-[10px] font-black uppercase tracking-widest">
            Most picked
          </span>
          <div className="space-y-1">
            <div className="font-semibold text-lg pc-restore-card-ink">{restorePkg.name}</div>
            <div className="text-emerald-800/90 text-sm">{restorePkg.tagline}</div>
            <div className="text-3xl font-bold pc-restore-card-ink">{formatPrice(restorePkg.priceAmount)}</div>
          </div>
          <button type="button" onClick={() => goToCheckout(restorePkg.id)} className={`w-full ${PC_RESTORE_BTN.emerald}`}>
            Get started <ArrowRight size={14} />
          </button>
        </div>
      ) : null}
      {platinumPkg ? (
        <div className={`${pcRestoreCardClass('violet')} space-y-4 ring-1 ring-violet-400/15`}>
          <span className="inline-flex px-2 py-0.5 rounded-full border border-violet-400/35 bg-violet-500/10 text-violet-800 text-[10px] font-black uppercase tracking-widest">
            Premium
          </span>
          <div className="space-y-1">
            <div className="font-semibold text-lg pc-restore-card-ink">{platinumPkg.name}</div>
            <div className="text-sm pc-restore-card-muted">{platinumPkg.tagline}</div>
            <div className="text-3xl font-bold pc-restore-card-ink">{formatPrice(platinumPkg.priceAmount)}</div>
          </div>
          <button type="button" onClick={() => goToCheckout(platinumPkg.id, 'in_house')} className={`w-full ${PC_RESTORE_BTN.platinum}`}>
            Finance & build credit <ArrowRight size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function PersonalCreditPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const onDutyCoach = resolveStaffOnDuty('dispute_coach');

  usePublicSeoMeta({
    title: 'Personal credit restoration',
    description: 'Professional dispute letters, bureau coverage, and a path to funding readiness with Nora Capital Group when your file is ready.',
    path: '/personal-credit',
  });

  const goToCheckout = (pkgId: string, rail?: 'stripe' | 'in_house') => {
    navigate(
      resolvePackageSelectPath({
        packageId: pkgId,
        rail,
        isAuthed: Boolean(auth.user),
      }),
    );
  };

  const platinumPkg = personalCreditPackages.find((p) => p.id === 'personal_platinum');
  const restorePkg = personalCreditPackages.find((p) => p.id === 'personal_restore');
  const starterPkg = personalCreditPackages.find((p) => p.id === 'personal_starter');

  return (
    <PageShell
      hideHero
      badge="Personal Credit"
      title="Restore Your Credit. Reclaim Your Future."
      subtitle="We handle dispute letters and tracking — you focus on your goals."
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple space-y-4`} data-fc-personal-credit-lane="1">
        <PersonalCreditHeroShell
          onStartFreeGuide={() => finelyCtaNavigate(navigate, 'personal_free_guide')}
          onBookSession={() => finelyCtaNavigate(navigate, 'consultation', { consultationLane: 'Personal Credit' })}
        />

        <PersonalCreditRestoreSpectrum />

        <PersonalCreditCommandStrip onStartIntake={() => finelyCtaNavigate(navigate, 'personal_intake')} />

        <FinelyNoticedStrip items={buildPersonalCreditNoticedItems({ tab: 'overview' })} />
        <FinelyNowDoThisStrip currentIndex={0} />

        <div className="pc-restore-hub-shell pc-restore-hub-shell--desk space-y-6 !p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {STATS.map((s) => (
              <div key={s.label} className="pc-restore-kpi pc-restore-kpi--glass">
                <div className="text-lg font-bold pc-restore-card-ink">{s.value}</div>
                <div className="text-[11px] pc-restore-card-muted leading-snug">{s.label}</div>
              </div>
            ))}
          </div>

          <section className="space-y-4" id="pc-packages">
            <div>
              <h2 className={`${FINELY_OS_ENTITY_TITLE} text-[color:var(--pc-hero-ink)]`}>Choose your restore lane</h2>
              <p className="pc-restore-desk-sub mt-1 text-sm">Three depths — same program. Pick one, then start intake.</p>
            </div>
            <PersonalCreditPackageCards
              starterPkg={starterPkg}
              restorePkg={restorePkg}
              platinumPkg={platinumPkg}
              goToCheckout={goToCheckout}
            />
            {!starterPkg && !restorePkg && !platinumPkg ? (
              <div className={`${pcRestoreCardClass('amber')} text-sm pc-restore-card-muted`}>
                Package tiers are loading —{' '}
                <a href="/pricing/personal-credit-restore" className="text-sky-700 underline underline-offset-2">
                  view full pricing
                </a>
                .
              </div>
            ) : null}
            <div className={`${pcRestoreCardClass('violet', true)} space-y-4`}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="font-semibold pc-restore-card-ink">Browse all packages</h3>
                  <p className="mt-1 pc-restore-card-muted text-sm">Search or paginate — no endless scroll.</p>
                </div>
                <button type="button" onClick={() => navigate('/pricing')} className={PC_RESTORE_BTN.ghost}>
                  View full pricing <ArrowRight size={14} />
                </button>
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
          </section>

          <section className={`${pcRestoreCardClass('emerald', true)} space-y-4`} id="pc-process">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <p className="pc-restore-kicker">How it works</p>
              <h2 className="text-xl font-bold text-[color:var(--pc-hero-ink)]">Our process</h2>
              <p className="pc-restore-desk-sub text-sm">Four disciplined steps — evidence-first and bureau-aware.</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {PROCESS_STEPS.map((step) => (
                <div key={step.step} className={`${pcRestoreCardClass(step.accent)} space-y-2`}>
                  <div className="pc-restore-step-num">{step.step}</div>
                  <h3 className="font-semibold pc-restore-card-ink">{step.title}</h3>
                  <p className="text-sm pc-restore-card-muted">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={`${pcRestoreCardClass('sky', true)} space-y-4`} id="pc-platform">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className={`${FINELY_OS_ENTITY_TITLE} text-[color:var(--pc-hero-ink)]`}>The Finely Cred OS</h2>
                <p className="pc-restore-desk-sub mt-1 text-sm">
                  Uploads, evidence, disputes, letters, and tracking — not a static brochure.
                </p>
              </div>
              <button type="button" onClick={() => finelyCtaNavigate(navigate, 'personal_intake')} className={PC_RESTORE_BTN.sky}>
                Start intake <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {OS_TILES.map((x, i) => {
                const Icon = x.icon;
                const accent = OS_TILE_ACCENTS[i % OS_TILE_ACCENTS.length];
                const accentStyle = OS_ICON_ACCENT[accent];
                return (
                  <button
                    key={x.title}
                    type="button"
                    className={`pc-restore-os-tile ${accentStyle.tile}`}
                    onClick={() => navigate(x.href)}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-3 ${accentStyle.wrap}`}
                    >
                      <Icon size={20} className={accentStyle.icon} />
                    </div>
                    <div className="font-semibold pc-restore-card-ink text-left">{x.title}</div>
                    <div className="text-sm pc-restore-card-muted mt-1 text-left">{x.desc}</div>
                  </button>
                );
              })}
            </div>
          </section>

          <p className="text-xs text-white/45 leading-relaxed text-center px-2">
            Results vary · not legal advice · educational dispute workflow only
          </p>
        </div>

        <div className="flex justify-center">
          <MarketingStaffChatStrip
            roleId="dispute_coach"
            goal="personal"
            roleLabel="dispute specialist"
            subline="Ask about packages, dispute workflow, or whether DIY vs done-for-you fits your file."
            modalLaunch={{ triggerLabel: 'Ask dispute specialist' }}
          />
        </div>

        <div className={`${pcRestoreCardClass('emerald')} !p-5`}>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm pc-restore-card-muted">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-emerald-700" />
              <span>Secure & compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-700" />
              <span>Fast turnaround</span>
            </div>
            {onDutyCoach ? (
              <div className="flex items-center gap-2">
                <StaffPortraitImg staff={onDutyCoach} className="w-8 h-8 rounded-full border border-emerald-400/30" />
                <span>
                  {onDutyCoach.firstName}, dispute specialist
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Users size={18} />
                <span>Expert support</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Star size={18} className="text-amber-600" />
              <span>Partner wins vary</span>
            </div>
          </div>
        </div>

        <DedicatedSheetLinkStrip
          only={['restore', 'build']}
          heading="Prefer to start on your own? Take the sheets."
          subline="Free PDFs · honest page counts · no signup"
        />

        <div className={`${pcRestoreCardClass('amber')} !p-8 text-center space-y-4`}>
          <p className="pc-restore-kicker">Take the first step</p>
          <h2 className="text-2xl md:text-3xl font-bold pc-restore-card-ink">Ready to move your file forward?</h2>
          <p className="pc-restore-card-muted max-w-xl mx-auto">Quick intake — see which package fits. No commitment required.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button type="button" onClick={() => finelyCtaNavigate(navigate, 'personal_intake')} className={`${PC_RESTORE_BTN.emerald} !px-8 !py-3`}>
              Start intake <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => finelyCtaNavigate(navigate, 'consultation', { consultationLane: 'Personal Credit' })}
              className={`${PC_RESTORE_BTN.platinum} !px-8 !py-3`}
            >
              Book a session <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
