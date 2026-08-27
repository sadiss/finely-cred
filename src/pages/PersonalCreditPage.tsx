import React, { useMemo, useState } from 'react';
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
import { reconcileCtaBridgeConversion } from '../lib/funnelCtaBridge';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { StaffPortraitImg } from '../components/staff/StaffPortraitImg';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { DedicatedSheetLinkStrip } from '../components/resources/DedicatedSheetLinkStrip';
import { resolveStaffOnDuty } from '../data/staffRoster';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { FINELY_OS_ENTITY_TITLE, FINELY_OS_PAGE } from '../features/os/finelyOsLightUi';
import { personalCreditPackages, formatPrice, type PricingPackage } from '../config/pricingCatalog';
import { PricingPackageCatalog } from '../components/pricing/PricingPackageCatalog';
import {
  PersonalCreditHeroShell,
  PersonalCreditPathSwitcher,
  PersonalCreditRestoreSpectrum,
  type PersonalCreditRestorePath,
} from '../features/personalCredit/PersonalCreditHeroShell';
import { FinelyLaunchHelpStrip } from '../components/tours/FinelyLaunchHelpStrip';
import { FinelyNoticedStrip } from '../components/tours/FinelyNoticedStrip';
import { FinelyNowDoThisStrip } from '../components/tours/FinelyNowDoThisStrip';
import { buildPersonalCreditNoticedItems } from '../lib/finelyProactiveSignals';
import { PC_RESTORE_BTN } from '../features/personalCredit/personalCreditRestoreButtons';
import '../features/personalCredit/personalCreditRestoreVisual.css';

const POP_ACCENT = {
  emerald: 'fc-ivory-pop-emerald',
  violet: 'fc-ivory-pop-violet',
  sky: 'fc-ivory-pop-sky',
  rose: 'fc-ivory-pop-rose',
  fuchsia: 'fc-ivory-pop-fuchsia',
} as const;

const STATS = [
  { value: '700+', label: 'Score path partners target', accent: 'emerald' as const },
  { value: '45 days', label: 'First review window', accent: 'violet' as const },
  { value: '3 bureaus', label: 'Comprehensive coverage', accent: 'sky' as const },
  { value: '24/7', label: 'Platform access', accent: 'rose' as const },
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
    accent: 'violet' as const,
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

const OS_TILE_ACCENTS = ['sky', 'violet', 'emerald', 'rose', 'fuchsia', 'sky'] as const;

type OsAccent = (typeof OS_TILE_ACCENTS)[number];

const OS_ICON_ACCENT: Record<
  OsAccent,
  { icon: string; tile: string; glow: string }
> = {
  emerald: {
    icon: 'text-emerald-300',
    tile: 'pc-restore-os-tile--emerald',
    glow: 'pc-restore-os-icon--emerald',
  },
  sky: {
    icon: 'text-sky-300',
    tile: 'pc-restore-os-tile--sky',
    glow: 'pc-restore-os-icon--sky',
  },
  violet: {
    icon: 'text-violet-300',
    tile: 'pc-restore-os-tile--violet',
    glow: 'pc-restore-os-icon--violet',
  },
  rose: {
    icon: 'text-rose-300',
    tile: 'pc-restore-os-tile--rose',
    glow: 'pc-restore-os-icon--rose',
  },
  fuchsia: {
    icon: 'text-fuchsia-300',
    tile: 'pc-restore-os-tile--fuchsia',
    glow: 'pc-restore-os-icon--fuchsia',
  },
};

const OS_TILES = [
  { icon: UploadCloud, title: 'Report Upload + Parsing', desc: 'Upload bureau exports (HTML/PDF). Parse tradelines for clean targeting.', href: resolveFinelyCtaPath('personal_intake') },
  { icon: ShieldCheck, title: 'Evidence Vault', desc: 'Store proof packs and label everything for disciplined follow-ups.', href: '/resources/videos' },
  { icon: Gavel, title: 'Dispute Center', desc: 'Track items, rounds, deadlines, and follow-up windows by bureau.', href: resolveFinelyCtaPath('personal_intake') },
  { icon: FileText, title: 'Letter Generator', desc: 'Generate printable letters and keep PDFs in your vault.', href: resolveFinelyCtaPath('personal_intake') },
  { icon: Sparkles, title: 'AI Suggestions (scoped)', desc: 'Education-first next actions from parsed report signals.', href: '/resources/videos' },
  { icon: Target, title: 'Milestones + tracking', desc: 'Stabilization → dispute rounds → documented follow-through.', href: resolveFinelyCtaPath('personal_intake') },
];

/** Restore lane only — exclude building, maintenance, and unrelated hybrid programs. */
function filterPersonalPackagesByPath(path: PersonalCreditRestorePath): PricingPackage[] {
  return personalCreditPackages.filter((p) => {
    if (!p.isPublic) return false;
    if (p.category !== 'personal_credit') return false;
    if (p.id.startsWith('personal_build')) return false;
    if (p.id.startsWith('personal_maintenance')) return false;
    if (p.id === 'personal_core') return false;
    if (path === 'dfy') {
      return p.delivery === 'DFY' && (p.id.includes('restore') || p.id === 'personal_platinum');
    }
    return p.delivery === 'DIY';
  });
}

type FeaturedCard = {
  pkg: PricingPackage;
  accent: 'emerald' | 'sky' | 'violet' | 'rose' | 'fuchsia';
  badge?: string;
  cta: string;
  btn: string;
  rail?: 'stripe' | 'in_house';
};

function btnForAccent(accent: FeaturedCard['accent']) {
  if (accent === 'violet') return PC_RESTORE_BTN.violet;
  if (accent === 'sky') return PC_RESTORE_BTN.sky;
  return PC_RESTORE_BTN.emerald;
}

function featuredCardsForPath(path: PersonalCreditRestorePath): FeaturedCard[] {
  if (path === 'dfy') {
    const cards: FeaturedCard[] = [];
    const restore = personalCreditPackages.find((p) => p.id === 'personal_restore');
    const platinum = personalCreditPackages.find((p) => p.id === 'personal_platinum');
    const starterDfy = personalCreditPackages.find((p) => p.id === 'personal_restore_starter');
    if (restore) {
      cards.push({ pkg: restore, accent: 'emerald', badge: 'Most picked', cta: 'Get started', btn: btnForAccent('emerald') });
    }
    if (platinum) {
      cards.push({
        pkg: platinum,
        accent: 'violet',
        badge: 'Premium',
        cta: 'Finance & build credit',
        btn: PC_RESTORE_BTN.violet,
        rail: 'in_house',
      });
    }
    if (starterDfy) {
      cards.push({ pkg: starterDfy, accent: 'sky', cta: 'Start entry restore', btn: btnForAccent('sky') });
    }
    return cards;
  }

  const cards: FeaturedCard[] = [];
  const starter = personalCreditPackages.find((p) => p.id === 'personal_starter');
  const free = personalCreditPackages.find((p) => p.id === 'personal_free');
  const letterPack = personalCreditPackages.find((p) => p.id.startsWith('letters_pack_'));
  if (starter) {
    cards.push({ pkg: starter, accent: 'fuchsia', cta: 'Start DIY', btn: btnForAccent('fuchsia'), rail: 'stripe' });
  }
  if (free) {
    cards.push({ pkg: free, accent: 'sky', badge: 'Free tier', cta: 'Start free trial', btn: btnForAccent('sky') });
  }
  if (letterPack) {
    cards.push({
      pkg: letterPack,
      accent: 'rose',
      badge: 'Letter pack',
      cta: 'Get letter pack',
      btn: btnForAccent('rose'),
      rail: 'stripe',
    });
  }
  return cards;
}

function PersonalCreditFeaturedCards({
  path,
  goToCheckout,
}: {
  path: PersonalCreditRestorePath;
  goToCheckout: (pkgId: string, rail?: 'stripe' | 'in_house') => void;
}) {
  const cards = featuredCardsForPath(path);
  if (!cards.length) {
    return (
      <div className={`fc-ivory-glass-panel fc-ivory-pop-tile ${POP_ACCENT.sky} fc-ivory-body-text text-sm`}>
        Packages are loading — check back in a moment.
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {cards.map(({ pkg, accent, badge, cta, btn, rail }) => (
        <div key={pkg.id} className={`fc-ivory-glass-panel fc-ivory-pop-tile ${POP_ACCENT[accent]} space-y-4`}>
          {badge ? (
            <span className={`fc-ivory-tone-badge fc-ivory-tone-badge--${accent === 'violet' ? 'violet' : 'emerald'}`}>
              {badge}
            </span>
          ) : null}
          <div className="space-y-1">
            <div className="fc-ivory-card-title text-xl sm:text-2xl font-bold">{pkg.name}</div>
            <div className="fc-ivory-body-text text-sm sm:text-base opacity-95">{pkg.tagline}</div>
            <div className={`fc-ivory-glow-figure fc-ivory-glow-figure--${accent}`}>
              {pkg.priceAmount === 0 ? 'Free' : formatPrice(pkg.priceAmount)}
            </div>
          </div>
          <button type="button" onClick={() => goToCheckout(pkg.id, rail)} className={`w-full ${btn}`}>
            {cta} <ArrowRight size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function PersonalCreditPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const onDutyCoach = resolveStaffOnDuty('dispute_coach');
  const [restorePath, setRestorePath] = useState<PersonalCreditRestorePath>('dfy');

  const pathPackages = useMemo(() => filterPersonalPackagesByPath(restorePath), [restorePath]);

  usePublicSeoMeta({
    title: 'Personal credit restoration',
    description: 'Professional dispute letters, bureau coverage, and a path to funding readiness with Nora Capital Group when your file is ready.',
    path: '/personal-credit',
  });

  const goToCheckout = (pkgId: string, rail?: 'stripe' | 'in_house') => {
    // Reconciles the homepage hero CTA-destination A/B test (D3) — a no-op unless
    // this visitor arrived here via the hero's CTA click.
    reconcileCtaBridgeConversion('homepage_hero');
    const pkg = personalCreditPackages.find((p) => p.id === pkgId);
    if (pkg?.isCustomQuote) {
      finelyCtaNavigate(navigate, 'personal_intake');
      return;
    }
    if (pkgId === 'personal_free' && !auth.user) {
      finelyCtaNavigate(navigate, 'personal_free_trial', { isAuthed: false });
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

  return (
    <PageShell
      hideHero
      hideLaunchHelpStrip
      surface="ivory"
      laneHero={
        <PersonalCreditHeroShell
          onStartFreeTrial={() => finelyCtaNavigate(navigate, 'personal_free_trial', { isAuthed: Boolean(auth.user) })}
          onBookSession={() => finelyCtaNavigate(navigate, 'consultation', { consultationLane: 'Personal Credit' })}
        />
      }
      badge="Personal Credit"
      title="Restore Your Credit. Reclaim Your Future."
      subtitle="We handle dispute letters and tracking — you focus on your goals."
    >
      <div
        className={`${FINELY_OS_PAGE} fc-senior-simple space-y-4`}
        data-fc-personal-credit-lane="1"
        data-fc-restore-pricing="1"
        data-fc-ivory-wealthy="1"
      >
        <div className="pc-restore-contained space-y-4">
        <PersonalCreditRestoreSpectrum />
        <FinelyNoticedStrip
          surface="light"
          items={buildPersonalCreditNoticedItems({ tab: 'packages' })}
        />
        <FinelyNowDoThisStrip
          surface="light"
          items={[
            {
              label: 'Choose done-for-you or do-it-yourself',
              detail: 'Compare the restore paths below, then open intake when you know which level of help fits.',
              to: '#pc-packages',
            },
          ]}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className={`fc-ivory-glass-panel fc-ivory-pop-tile pc-restore-stat-tile ${POP_ACCENT[s.accent]}`}
            >
              <div className={`fc-ivory-glow-figure fc-ivory-glow-figure--${s.accent}`}>{s.value}</div>
              <div className="pc-restore-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <section className="space-y-4" id="pc-packages">
          <FinelyLaunchHelpStrip tone="ivory" showWatchHow={false} className="pc-restore-ask-finely" />
          <PersonalCreditPathSwitcher value={restorePath} onChange={setRestorePath} />

          <div>
            <h2 className={`${FINELY_OS_ENTITY_TITLE} text-[#0a1628] text-2xl sm:text-3xl font-bold`}>
              {restorePath === 'dfy' ? 'Done-for-you restore packages' : 'Do-it-yourself packages'}
            </h2>
            <p className="pc-restore-hub-sub mt-1 text-sm">
              {restorePath === 'dfy'
                ? 'We run disputes, track responses, and escalate — pick a depth, then start intake.'
                : 'Templates, letter packs, and platform tools — you drive the workflow.'}
            </p>
          </div>

          <PersonalCreditFeaturedCards path={restorePath} goToCheckout={goToCheckout} />

          <div className="fc-restore-catalog-panel rounded-[1rem] p-4 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {restorePath === 'dfy' ? 'Compare done-for-you tiers' : 'Compare DIY tools & letter packs'}
                </h3>
                <p className="mt-1 text-sm text-white/75">Search or paginate — no endless scroll.</p>
              </div>
              <button type="button" onClick={() => navigate('/pricing')} className={PC_RESTORE_BTN.ghost}>
                View full pricing <ArrowRight size={14} />
              </button>
            </div>
            <PricingPackageCatalog
              packages={pathPackages}
              pageSize={6}
              includePersonalCompare
              cardSurface="adminSolid"
              catalogDarkBed
              titleClassName="text-xl sm:text-2xl font-bold tracking-tight"
              searchPlaceholder={
                restorePath === 'dfy'
                  ? 'Search restore tiers, platinum, entry DFY…'
                  : 'Search DIY starter, letter packs, free tools…'
              }
              onSelect={(pkgId) => {
                const pkg = pathPackages.find((p) => p.id === pkgId);
                const preferredRail =
                  pkg?.rail === 'in_house' ? 'in_house' : pkg?.rail === 'stripe' ? 'stripe' : undefined;
                goToCheckout(pkgId, preferredRail);
              }}
            />
          </div>
        </section>

        <section className="space-y-4" id="pc-process">
          <div className="text-center space-y-2 pc-restore-section-intro">
            <p className="pc-restore-kicker">How it works</p>
            <h2 className={`${FINELY_OS_ENTITY_TITLE} text-[#0a1628] text-2xl sm:text-3xl font-bold`}>Our process</h2>
            <p className="pc-restore-hub-sub text-sm">Four disciplined steps — evidence-first and bureau-aware.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {PROCESS_STEPS.map((step) => (
              <div
                key={step.step}
                className={`fc-ivory-glass-panel fc-ivory-pop-tile pc-restore-process-step ${POP_ACCENT[step.accent]} space-y-2`}
              >
                <div className="pc-restore-step-num">{step.step}</div>
                <h3>{step.title}</h3>
                <p className="fc-ivory-body-text text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="fc-ivory-glass-panel fc-restore-dark-panel rounded-[1rem] p-4 space-y-4" id="pc-platform">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">The Finely Cred OS</h2>
            <p className="mt-1 text-sm text-white/75">
              Uploads, evidence, disputes, letters, and tracking — not a static brochure.
            </p>
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
                  <div className={`pc-restore-os-icon ${accentStyle.glow}`}>
                    <Icon size={24} className={accentStyle.icon} />
                  </div>
                  <div className="font-semibold text-left text-white/95">{x.title}</div>
                  <div className="text-sm text-white/72 mt-1 text-left">{x.desc}</div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-white/45 leading-relaxed text-center px-2">
            Results vary · not legal advice · educational dispute workflow only
          </p>
        </section>

        <div className="fc-ivory-page-tail space-y-8">
          <MarketingStaffChatStrip
            roleId="dispute_coach"
            goal="personal"
            roleLabel="dispute specialist"
            subline="Ask about packages, dispute workflow, or whether DIY vs done-for-you fits your file."
            surface="restore-emerald"
            stripClassName="fc-restore-chat-strip"
          />

          <div className={`fc-ivory-glass-panel fc-ivory-pop-tile ${POP_ACCENT.sky} p-6 lg:p-8`}>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-sky-300" />
                <span className="fc-ivory-body-text text-sm">Secure & compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-violet-300" />
                <span className="fc-ivory-body-text text-sm">Fast turnaround</span>
              </div>
              {onDutyCoach ? (
                <div className="flex items-center gap-2">
                  <StaffPortraitImg staff={onDutyCoach} className="w-8 h-8 rounded-full border border-emerald-400/30" />
                  <span className="fc-ivory-body-text text-sm">
                    {onDutyCoach.firstName}, dispute specialist
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-violet-300" />
                  <span className="fc-ivory-body-text text-sm">Expert support</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Star size={18} className="text-emerald-300" />
                <span className="fc-ivory-body-text text-sm">Partner wins vary</span>
              </div>
            </div>
          </div>

          <DedicatedSheetLinkStrip
            surface="ivoryWealthy"
            only={['restore', 'build']}
            heading="Prefer to start on your own? Take the sheets."
            subline="Free PDFs · honest page counts · no signup"
          />

          <FinelyOsPageFooter />
        </div>
        </div>
      </div>
    </PageShell>
  );
}
