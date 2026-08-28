import React, { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowRight, Check, ExternalLink, Info, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { finelyCtaNavigate } from '../../lib/finelyCtaIntent';
import { reconcileCtaBridgeConversion } from '../../lib/funnelCtaBridge';
import { resolvePackageSelectPath } from '../../lib/packageCheckoutRouting';
import { formatPrice, getPackageById, personalCreditPackages, type PricingPackage } from '../../config/pricingCatalog';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { DedicatedSheetLinkStrip } from '../../components/resources/DedicatedSheetLinkStrip';
import { ServicePackageDetailModal } from '../../components/pricing/ServicePackageDetailModal';
import { FinelyLaunchHelpStrip, type FinelyLaunchPrompt } from '../../components/tours/FinelyLaunchHelpStrip';
import { usePreviewReveal } from '../../features/personalCredit/preview/usePreviewReveal';
import '../../features/personalCredit/preview/personalCreditRestorePreview.css';
import '../../features/personalCredit/preview/personalCreditRestorePreview.anim.css';

const LIVE_PATH = '/pricing/personal-credit-restore';
const PREVIEW_PATH = '/preview/personal-credit-restore';

type RestorePath = 'dfy' | 'diy';

/** Full DFY restore ladder — includes Supreme/Premier/Dynasty (catalog isPublic:false but still sold). */
const DFY_RESTORE_LADDER_IDS = [
  'personal_restore_starter',
  'personal_restore',
  'personal_platinum',
  'personal_restore_5000',
  'personal_restore_7000',
  'personal_restore_10000',
  'personal_restore_custom',
] as const;

const DFY_FEATURED_IDS = ['personal_restore', 'personal_platinum', 'personal_restore_starter'] as const;

const HERO_STATS = [
  { value: '3', title: 'Bureaus', detail: 'Equifax · Experian · TransUnion' },
  { value: '45d', title: 'First review', detail: 'Typical window after intake' },
  { value: '7', title: 'DFY tiers', detail: 'Starter through Dynasty' },
];

const TRUST = [
  { value: '700+', label: 'Score path partners target' },
  { value: '45 days', label: 'First review window' },
  { value: '3 bureaus', label: 'Full file coverage' },
  { value: 'One OS', label: 'Letters, vault, disputes, tracking' },
];

const JOURNEY = ['Stabilize', 'Dispute', 'Monitor', 'Build', 'Fund-ready'];

const PROCESS = [
  { step: 1, title: 'Upload & analyze', body: 'Import bureau reports. We map tradelines and targets.' },
  { step: 2, title: 'Strategy & letters', body: 'Factual dispute reasons tied to your file — not generic language.' },
  { step: 3, title: 'Send & track', body: 'Mail, deadlines, and bureau responses in one workspace.' },
  { step: 4, title: 'Escalate', body: 'Follow-up rounds when furnishers stall — fully documented.' },
];

const PLATFORM = [
  { title: 'Report upload + parsing', body: 'HTML/PDF intake with tradeline targeting.' },
  { title: 'Evidence vault', body: 'Proof packs labeled for each dispute round.' },
  { title: 'Dispute center', body: 'Status by bureau, item, and deadline.' },
  { title: 'Letter studio', body: 'Print-ready letters saved to your vault.' },
  { title: 'Ask Finely', body: 'Education-first guidance from your file signals.' },
  { title: 'Milestones', body: 'Stabilize → dispute → monitor → fund-ready.' },
];

const FAQ = [
  {
    q: 'Done-for-you vs do-it-yourself — which should I pick?',
    a: 'Choose done-for-you if you want our team to run disputes, tracking, and escalation. Choose DIY if you prefer templates, letter packs, and platform tools while you drive the workflow.',
  },
  {
    q: 'What are the done-for-you restore tiers?',
    a: 'Starter ($750), Pro ($1,500), Elite ($3,000), Supreme ($5,000), Premier ($7,000), and Dynasty ($10,000). Files that require work beyond Dynasty move to a written Custom scope after intake instead of an artificial public price ceiling.',
  },
  {
    q: 'How fast will I see results?',
    a: 'Bureau and furnisher response times vary. Many partners see movement in the first review window; outcomes are never guaranteed.',
  },
  {
    q: 'Is this legal advice?',
    a: 'No. Finely Cred provides an educational dispute workflow and document tools. Results vary · not legal advice · funding subject to underwriting.',
  },
];

function filterPackages(path: RestorePath): PricingPackage[] {
  return personalCreditPackages
    .filter((p) => {
      if (!p.isPublic || p.category !== 'personal_credit') return false;
      if (p.id.startsWith('personal_build') || p.id.startsWith('personal_maintenance')) return false;
      if (p.id === 'personal_core') return false;
      if (path === 'dfy') {
        return p.delivery === 'DFY' && (p.id.includes('restore') || p.id === 'personal_platinum');
      }
      return p.delivery === 'DIY';
    })
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function priceLabel(pkg: PricingPackage): string {
  if (pkg.isCustomQuote) return 'Custom quote';
  if (pkg.priceAmount === 0) return 'Free';
  if (pkg.interval === 'month') return `${formatPrice(pkg.priceAmount)}/mo`;
  return formatPrice(pkg.priceAmount);
}

function Reveal({
  children,
  delayMs = 0,
  className = '',
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const { ref, className: visibleClass } = usePreviewReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`pc-prev-reveal ${visibleClass} ${className}`.trim()}
      style={{ '--pc-reveal-delay': `${delayMs}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

function PreviewBanner() {
  return (
    <div className="pc-prev-banner" role="note">
      <div className="pc-prev-banner__inner">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pc-prev-banner__badge">
            <Sparkles size={11} aria-hidden /> Preview
          </span>
          <span className="pc-prev-banner__note">New restore page — will replace the live page when approved.</span>
        </div>
        <Link to={LIVE_PATH} className="pc-prev-banner__link">
          Current live page <ExternalLink size={12} aria-hidden />
        </Link>
      </div>
    </div>
  );
}

type TierAccent = 'sky' | 'emerald' | 'violet' | 'navy' | 'rose' | 'fuchsia';

const DFY_ACCENT: Record<string, TierAccent> = {
  personal_restore_starter: 'sky',
  personal_restore: 'emerald',
  personal_platinum: 'violet',
  personal_restore_5000: 'rose',
  personal_restore_7000: 'emerald',
  personal_restore_10000: 'violet',
  personal_restore_custom: 'navy',
};

const DIY_ACCENT: Record<string, TierAccent> = {
  personal_free: 'sky',
  personal_starter: 'emerald',
};

function tierAccent(pkg: PricingPackage): TierAccent {
  if (DFY_ACCENT[pkg.id]) return DFY_ACCENT[pkg.id];
  if (DIY_ACCENT[pkg.id]) return DIY_ACCENT[pkg.id];
  if (pkg.id.startsWith('letters_pack_')) return 'violet';
  return 'navy';
}

function tierShortName(pkg: PricingPackage): string {
  if (pkg.id === 'personal_restore_starter') return 'Starter';
  if (pkg.id === 'personal_restore') return 'Pro';
  if (pkg.id === 'personal_platinum') return 'Elite';
  if (pkg.id === 'personal_restore_5000') return 'Supreme';
  if (pkg.id === 'personal_restore_7000') return 'Premier';
  if (pkg.id === 'personal_restore_10000') return 'Dynasty';
  if (pkg.id === 'personal_restore_custom') return 'Custom';
  if (pkg.id === 'personal_starter') return 'Credit Starter';
  if (pkg.id === 'personal_free') return 'Free';
  if (pkg.id.startsWith('letters_pack_')) return pkg.name.replace('Letter Pack — ', '');
  return pkg.name;
}

const TIER_FIT: Record<string, string> = {
  personal_restore_starter: 'Lighter files that need a documented first restore sequence.',
  personal_restore: 'Multi-account files that need recurring rounds and active tracking.',
  personal_platinum: 'Complex files that need deeper strategy and a longer support window.',
  personal_restore_5000: 'Higher-complexity files that need stronger QA and escalation preparation.',
  personal_restore_7000: 'Broad files that need enterprise-level cadence, monitoring, and documentation.',
  personal_restore_10000: 'The highest fixed tier for maximum support, sequencing, and priority handling.',
  personal_restore_custom: 'Work beyond the fixed ladder, scoped around file depth and approved deliverables.',
};

const CUSTOM_SCOPE = [
  { title: 'File architecture', body: 'Tradelines, collections, bureau variance, and evidence load mapped first.' },
  { title: 'Execution depth', body: 'Rounds, QA cadence, documentation, and escalation readiness written into scope.' },
  { title: 'Support window', body: 'Timeline and specialist touchpoints sized to the actual file—not a generic tier.' },
  { title: 'Approved terms', body: 'Pricing and payment timing confirmed only after deliverables are documented.' },
] as const;

function PreviewTierCard({
  pkg,
  featured,
  variant = 'main',
  onSelect,
  onIncludes,
}: {
  pkg: PricingPackage;
  featured?: boolean;
  variant?: 'preview' | 'main';
  onSelect: () => void;
  onIncludes?: () => void;
}) {
  const accent = tierAccent(pkg);
  const badge = featured ? 'Most picked' : pkg.badge;
  const isMain = variant === 'main';
  const highlightLimit = isMain ? pkg.highlights?.length ?? 0 : 3;
  const fit = TIER_FIT[pkg.id];

  return (
    <article
      className={`pc-prev-tier-card pc-prev-tier-card--${accent} pc-prev-tier-card--${variant} ${
        featured ? 'pc-prev-tier-card--featured' : ''
      }`}
    >
      {badge ? <span className="pc-prev-tier-card__badge">{badge}</span> : null}
      <div className="pc-prev-tier-card__price">{priceLabel(pkg)}</div>
      <h3 className="pc-prev-tier-card__name">{isMain ? pkg.name : tierShortName(pkg)}</h3>
      <p className="pc-prev-tier-card__tagline">{pkg.tagline}</p>
      {isMain && fit ? (
        <div className="pc-prev-tier-card__fit">
          <span>Best fit</span>
          <p>{fit}</p>
        </div>
      ) : null}
      {highlightLimit > 0 ? (
        <ul className="pc-prev-tier-card__services">
          {(pkg.highlights ?? []).slice(0, highlightLimit).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      <div className="pc-prev-tier-card__actions">
        <button type="button" className="pc-prev-tier-card__cta" onClick={onSelect}>
          Choose this tier <ArrowRight size={isMain ? 16 : 14} aria-hidden />
        </button>
        {isMain && onIncludes ? (
          <button type="button" className="pc-prev-tier-card__cta-secondary" onClick={onIncludes}>
            <Info size={14} aria-hidden />
            What&apos;s included
          </button>
        ) : null}
      </div>
    </article>
  );
}

function PreviewTierGrid({
  packages,
  featuredId,
  variant = 'main',
  onCheckout,
  onViewDetails,
}: {
  packages: PricingPackage[];
  featuredId?: string;
  variant?: 'preview' | 'main';
  onCheckout: (pkg: PricingPackage) => void;
  onViewDetails?: (pkg: PricingPackage) => void;
}) {
  const priced = packages.filter((p) => !p.isCustomQuote);

  return (
    <div className={`pc-prev-tier-grid pc-prev-tier-grid--${variant}`}>
      {priced.map((pkg) => (
        <PreviewTierCard
          key={pkg.id}
          pkg={pkg}
          variant={variant}
          featured={pkg.id === featuredId}
          onSelect={() => onCheckout(pkg)}
          onIncludes={variant === 'main' && onViewDetails ? () => onViewDetails(pkg) : undefined}
        />
      ))}
    </div>
  );
}

function CustomQuoteRow({
  pkg,
  onStart,
  onIncludes,
}: {
  pkg: PricingPackage;
  onStart: () => void;
  onIncludes: () => void;
}) {
  return (
    <div className="pc-prev-custom-row">
      <div className="pc-prev-custom-row__main">
        <span className="pc-prev-custom-row__badge">Custom quote</span>
        <div className="pc-prev-custom-row__copy">
          <h3 className="pc-prev-custom-row__title">{pkg.name}</h3>
          <p className="pc-prev-custom-row__tagline">
            Beyond Dynasty, there is no artificial public ceiling. We review the file, document the deliverables,
            then scope the engagement around the work actually required.
          </p>
        </div>
        <div className="pc-prev-custom-row__price">Custom engagement · scoped after intake</div>
        <div className="pc-prev-custom-scope">
          {CUSTOM_SCOPE.map((item) => (
            <div key={item.title} className="pc-prev-custom-scope__item">
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </div>
          ))}
        </div>
        <p className="pc-prev-custom-row__terms">
          Written scope required · service timing and payment terms depend on approved deliverables
        </p>
      </div>
      <div className="pc-prev-custom-row__choices">
        <button type="button" className="pc-prev-custom-choice pc-prev-custom-choice--primary" onClick={onStart}>
          Start custom intake <ArrowRight size={15} aria-hidden />
          <span>Map the file before pricing</span>
        </button>
        <button type="button" className="pc-prev-custom-choice pc-prev-custom-choice--ghost" onClick={onIncludes}>
          <Info size={15} aria-hidden />
          What&apos;s included
          <span>Scope, deliverables & compare</span>
        </button>
      </div>
    </div>
  );
}

export default function PersonalCreditRestorePreviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isPreviewMode = location.pathname === PREVIEW_PATH;
  const auth = useAuth();
  const [path, setPath] = useState<RestorePath>('dfy');
  const [detailPkg, setDetailPkg] = useState<PricingPackage | null>(null);
  const pathPackages = useMemo(() => filterPackages(path), [path]);
  const dfyTiers = useMemo(
    () =>
      DFY_RESTORE_LADDER_IDS.map((id) => getPackageById(id)).filter(Boolean) as PricingPackage[],
    [],
  );
  const featuredPackages = useMemo(() => {
    if (path === 'dfy') {
      return DFY_FEATURED_IDS.map((id) => getPackageById(id)).filter(Boolean) as PricingPackage[];
    }
    return pathPackages.slice(0, 3);
  }, [path, pathPackages]);
  const restoreGuidancePrompts = useMemo<readonly FinelyLaunchPrompt[]>(
    () => [
      {
        label: 'What should I do first?',
        prompt: 'On this personal credit restore page, what should I do first with a new file?',
        hint:
          'Pull current reports from all three bureaus. Then gather your ID, proof of address, and statements before choosing any dispute target.',
      },
      {
        label: path === 'dfy' ? 'Is done-for-you right?' : 'Can I do this myself?',
        prompt:
          path === 'dfy'
            ? 'How do I know whether done-for-you personal credit restore is right for my file?'
            : 'How do I know whether the do-it-yourself personal credit tools are right for my file?',
        hint:
          path === 'dfy'
            ? 'Done-for-you fits when you want the team to organize evidence, run letters, track replies, and manage follow-up rounds.'
            : 'DIY fits when you can gather evidence, review every letter, meet mailing deadlines, and log each bureau response yourself.',
      },
      {
        label: 'Evidence checklist',
        prompt: 'What evidence should I gather before starting a personal credit dispute?',
        hint:
          'Match every factual issue to a bureau screenshot or statement. Keep identity documents in Documents and dispute exhibits in Evidence Vault.',
      },
      {
        label: 'What happens after a reply?',
        prompt: 'What should I do after a credit bureau or furnisher replies to a dispute?',
        hint:
          'Log the actual outcome, preserve the response, and let the evidence determine whether to close the item, correct your record, or prepare a documented follow-up.',
      },
    ],
    [path],
  );

  usePublicSeoMeta({
    title: isPreviewMode ? 'Preview · Personal credit restore' : 'Personal credit restore',
    description: isPreviewMode
      ? 'Premium personal credit restoration — all tiers, clear path, Finely Cred OS.'
      : 'DIY and done-for-you personal credit restore with dispute automation.',
    path: isPreviewMode ? PREVIEW_PATH : location.pathname === '/personal-credit' ? '/personal-credit' : LIVE_PATH,
  });

  const goCheckout = (pkgId: string, rail?: 'stripe' | 'in_house') => {
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
    navigate(resolvePackageSelectPath({ packageId: pkgId, rail, isAuthed: Boolean(auth.user) }));
  };

  const startFree = () => finelyCtaNavigate(navigate, 'personal_free_guide', { isAuthed: Boolean(auth.user) });
  const bookSession = () => finelyCtaNavigate(navigate, 'consultation', { consultationLane: 'Personal Credit' });

  const displayPackages = path === 'dfy' ? dfyTiers : pathPackages;
  const customTier = useMemo(
    () => displayPackages.find((p) => p.isCustomQuote) ?? null,
    [displayPackages],
  );
  const featuredId = path === 'dfy' ? 'personal_restore' : 'personal_starter';

  const checkoutPackage = (pkg: PricingPackage) =>
    goCheckout(
      pkg.id,
      pkg.rail === 'in_house' ? 'in_house' : pkg.rail === 'stripe' ? 'stripe' : undefined,
    );

  return (
    <>
      {isPreviewMode ? <PreviewBanner /> : null}
      <PageShell
        hideHero
        hideLaunchHelpStrip
        surface="default"
        contentWidth="full"
        badge={isPreviewMode ? 'Preview' : undefined}
        title="Personal credit restore"
        subtitle={isPreviewMode ? 'Premium restore preview' : undefined}
      >
        <div className="pc-prev-shell" data-fc-pc-restore-preview="1">
          <header className="pc-prev-hero">
            <div className="pc-prev-hero__aurora" aria-hidden />
            <div className="pc-prev-hero__mesh" aria-hidden />
            <div className="pc-prev-hero__beam" aria-hidden />
            <div className="pc-prev-inner pc-prev-hero__inner">
              <div className="pc-prev-hero__grid">
                <div className="pc-prev-hero__copy">
                  <p className="pc-prev-eyebrow">Personal credit restoration</p>
                  <h1 className="pc-prev-hero__title">
                    Restore your credit with <span>a clear, documented path.</span>
                  </h1>
                  <p className="pc-prev-hero__lede">
                    Done-for-you disputes, three-bureau coverage, and every round tracked in the Finely Cred OS — from
                    Starter through Dynasty, plus written Custom scopes for work beyond the fixed ladder.
                  </p>
                  <div className="pc-prev-hero__actions">
                    <button type="button" className="pc-prev-btn-primary" onClick={startFree}>
                      Start free guide <ArrowRight size={15} aria-hidden />
                    </button>
                    <button type="button" className="pc-prev-btn-secondary" onClick={bookSession}>
                      Book a session
                    </button>
                    <button
                      type="button"
                      className="pc-prev-btn-ghost"
                      onClick={() => document.getElementById('pc-prev-packages')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      Compare tiers
                    </button>
                  </div>
                  <p className="pc-prev-compliance">Results vary · not legal advice · funding subject to underwriting</p>
                </div>
                <aside className="pc-prev-hero-glance" aria-label="At a glance">
                  <p className="pc-prev-hero-glance__label">At a glance</p>
                  <div className="pc-prev-hero-glance__grid">
                    {HERO_STATS.map((s) => (
                      <div key={s.title} className="pc-prev-hero-glance__cell">
                        <strong>{s.value}</strong>
                        <span className="pc-prev-hero-glance__title">{s.title}</span>
                        <span className="pc-prev-hero-glance__detail">{s.detail}</span>
                      </div>
                    ))}
                  </div>
                </aside>
              </div>
            </div>
          </header>

          <div className="pc-prev-inner">
            <div className="pc-prev-trust-strip" aria-label="Trust metrics">
              {TRUST.map((t) => (
                <div key={t.label} className="pc-prev-trust-cell">
                  <strong>{t.value}</strong>
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          <section className="pc-prev-section pc-prev-section--tight">
            <div className="pc-prev-inner">
              <Reveal>
                <FinelyLaunchHelpStrip
                  tone="ivory"
                  className="pc-prev-guidance"
                  prompts={restoreGuidancePrompts}
                  description="Hover a question for an immediate next-step hint, or click it to ask Finely for guidance on this page."
                />
              </Reveal>
            </div>
          </section>

          <section className="pc-prev-section">
            <div className="pc-prev-inner pc-prev-split">
              <Reveal delayMs={0}>
                <p className="pc-prev-kicker">The problem</p>
                <h2 className="pc-prev-h2">Errors on your file cost you every approval.</h2>
                <p className="pc-prev-lede">
                  Inaccurate tradelines, duplicate reporting, and weak dispute language block cards, auto, housing, and
                  funding — until you run a disciplined restore process.
                </p>
              </Reveal>
              <Reveal delayMs={80}>
                <p className="pc-prev-kicker">The outcome</p>
                <h2 className="pc-prev-h2">One workspace. Every round documented.</h2>
                <ul className="pc-prev-checklist">
                  {[
                    'Factual reasons tied to what is on your bureau file',
                    'Evidence vault, letters, and dispute tracking in one OS',
                    'Seven DFY tiers from Starter through Dynasty — or DIY tools on the same platform',
                  ].map((item) => (
                    <li key={item}>
                      <Check size={16} className="pc-prev-check-icon" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </section>

          <section className="pc-prev-section pc-prev-section--band">
            <div className="pc-prev-inner pc-prev-center">
              <Reveal>
                <p className="pc-prev-kicker">How it works</p>
                <h2 className="pc-prev-h2">Four steps from intake to fund-ready</h2>
                <p className="pc-prev-lede">Evidence-first disputes — disciplined, documented, bureau-aware.</p>
              </Reveal>
              <div className="pc-prev-journey" aria-hidden>
                {JOURNEY.map((label, i) => (
                  <div key={label} className={`pc-prev-journey__seg ${i <= 2 ? 'pc-prev-journey__seg--active' : ''}`}>
                    <div className="pc-prev-journey__dot" />
                    <span className="pc-prev-journey__label">{label}</span>
                  </div>
                ))}
              </div>
              <Reveal delayMs={100}>
                <div className="pc-prev-process">
                  {PROCESS.map((s) => (
                    <div key={s.step} className="pc-prev-process-step">
                      <span className="pc-prev-process-num">{s.step}</span>
                      <h3>{s.title}</h3>
                      <p>{s.body}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>

          <section className="pc-prev-section" id="pc-prev-packages">
            <div className="pc-prev-inner">
              <Reveal>
                <p className="pc-prev-kicker">Packages</p>
                <h2 className="pc-prev-h2">Every tier. One page.</h2>
                <p className="pc-prev-lede">
                  {path === 'dfy'
                    ? 'Full restore ladder — Starter ($750) through Dynasty ($10,000), plus written Custom scopes beyond the fixed tiers.'
                    : 'Free tier, Credit Starter, and every specialty letter pack.'}
                </p>
              </Reveal>

              <div className="pc-prev-path pc-prev-path--wide" role="tablist" aria-label="Restore path">
                <div
                  className={`pc-prev-path__indicator ${path === 'diy' ? 'pc-prev-path__indicator--diy' : ''}`}
                  aria-hidden
                />
                <button
                  type="button"
                  role="tab"
                  aria-selected={path === 'dfy'}
                  className={`pc-prev-path__btn ${path === 'dfy' ? 'pc-prev-path__btn--active' : ''}`}
                  onClick={() => setPath('dfy')}
                >
                  <strong>Done for you</strong>
                  <span>We dispute, track, and escalate</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={path === 'diy'}
                  className={`pc-prev-path__btn ${path === 'diy' ? 'pc-prev-path__btn--active' : ''}`}
                  onClick={() => setPath('diy')}
                >
                  <strong>Do it yourself</strong>
                  <span>Templates, tools, and letter packs</span>
                </button>
              </div>

              <Reveal delayMs={20}>
                <div className="pc-prev-tier-preview">
                  <p className="pc-prev-tier-preview__label">Quick tier preview</p>
                  <PreviewTierGrid
                    key={`${path}-featured`}
                    variant="preview"
                    packages={featuredPackages}
                    featuredId={featuredId}
                    onCheckout={checkoutPackage}
                  />
                </div>
              </Reveal>

              <Reveal delayMs={40}>
                <div className="pc-prev-tier-compare">
                  <div className="pc-prev-tier-compare__head">
                    <h2 className="pc-prev-tier-compare__title">
                      {path === 'dfy' ? 'Compare all done-for-you tiers' : 'Compare DIY tools & letter packs'}
                    </h2>
                    <p className="pc-prev-tier-compare__lede">
                      {path === 'dfy'
                        ? 'Starter · Pro · Elite · Supreme · Premier · Dynasty · Custom — every DFY price.'
                        : 'Free tier, Credit Starter, and every letter pack — full pricing below.'}
                    </p>
                  </div>
                  <PreviewTierGrid
                    key={`${path}-compare`}
                    variant="main"
                    packages={displayPackages}
                    featuredId={featuredId}
                    onCheckout={checkoutPackage}
                    onViewDetails={setDetailPkg}
                  />
                  {customTier ? (
                    <CustomQuoteRow
                      pkg={customTier}
                      onStart={() => checkoutPackage(customTier)}
                      onIncludes={() => setDetailPkg(customTier)}
                    />
                  ) : null}
                  <div className="pc-prev-tier-compare__foot">
                    <button type="button" className="pc-prev-catalog__link" onClick={() => navigate('/pricing')}>
                      Full pricing catalog →
                    </button>
                  </div>
                </div>
              </Reveal>

              <p className="pc-prev-convert-note">
                Not sure which tier fits? <button type="button" onClick={bookSession}>Book a session</button> — we
                will match your file to Starter, Pro, Elite, Supreme, Premier, Dynasty, or Custom.
              </p>
            </div>
          </section>

          <section className="pc-prev-section pc-prev-section--band">
            <div className="pc-prev-inner">
              <Reveal>
                <div className="pc-prev-platform">
                  <h2>The Finely Cred OS behind every tier</h2>
                  <p>Uploads, evidence, disputes, letters, and tracking — not a static brochure.</p>
                  <div className="pc-prev-platform-grid">
                    {PLATFORM.map((t) => (
                      <div key={t.title} className="pc-prev-platform-tile">
                        <strong>{t.title}</strong>
                        <span>{t.body}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          <section className="pc-prev-section pc-prev-section--tight">
            <div className="pc-prev-inner">
              <Reveal>
                <p className="pc-prev-kicker">Questions</p>
                <h2 className="pc-prev-h2">Straight answers before you start</h2>
                <div className="pc-prev-faq">
                  {FAQ.map((item) => (
                    <details key={item.q}>
                      <summary>{item.q}</summary>
                      <p>{item.a}</p>
                    </details>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>

          <section className="pc-prev-section pc-prev-section--tight">
            <div className="pc-prev-inner">
              <Reveal>
                <div className="pc-prev-final">
                  <h2>Ready to restore your file?</h2>
                  <p>Start with the free guide, compare all seven DFY tiers plus Custom, or book a session for a specialist read.</p>
                  <div className="pc-prev-final__actions">
                    <button type="button" className="pc-prev-btn-primary" onClick={startFree}>
                      Start free guide <ArrowRight size={15} aria-hidden />
                    </button>
                    <button type="button" className="pc-prev-btn-secondary" onClick={bookSession}>
                      Book a session
                    </button>
                    <button
                      type="button"
                      className="pc-prev-btn-secondary"
                      onClick={() => document.getElementById('pc-prev-packages')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      Compare packages
                    </button>
                  </div>
                </div>
              </Reveal>

              <div className="pc-prev-footer-gap">
                <DedicatedSheetLinkStrip
                  surface="ivoryWealthy"
                  only={['restore', 'build']}
                  heading="Prefer to start on your own? Take the sheets."
                  subline="Free PDFs · honest page counts · no signup"
                />
                <FinelyOsPageFooter />
              </div>
            </div>
          </section>
        </div>
      </PageShell>
      <ServicePackageDetailModal
        pkg={detailPkg}
        onClose={() => setDetailPkg(null)}
        onSelect={(packageId) => {
          const pkg = getPackageById(packageId);
          setDetailPkg(null);
          if (pkg) checkoutPackage(pkg);
        }}
        selectLabel="Get started"
      />
    </>
  );
}
