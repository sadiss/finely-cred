import React, { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowRight, Info } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { finelyCtaNavigate } from '../../lib/finelyCtaIntent';
import { openPublicChat } from '../../lib/publicChatEvents';
import { reconcileCtaBridgeConversion } from '../../lib/funnelCtaBridge';
import { resolvePackageSelectPath } from '../../lib/packageCheckoutRouting';
import { formatPrice, getPackageById, personalCreditPackages, type PricingPackage } from '../../config/pricingCatalog';
import { ServicePackageDetailModal } from '../../components/pricing/ServicePackageDetailModal';
import { usePreviewReveal } from '../../features/personalCredit/preview/usePreviewReveal';
import '../../features/personalCredit/preview/personalCreditRestorePreview.css';
import '../../features/personalCredit/preview/personalCreditRestorePreview.anim.css';

const LIVE_PATH = '/pricing/personal-credit-restore';

type RestorePath = 'dfy' | 'diy';

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

const LETTER_LINES = {
  eq: 'As you can see here on Equifax, this collection is reporting with no matching account on the file.',
  ex: 'As you can see here on Experian, this balance does not match the other two bureau reads.',
  tu: 'As you can see here on TransUnion, this item appears only on this bureau.',
} as const;

const BUREAU_REVEAL = [
  {
    key: 'eq',
    accent: 'emerald' as const,
    name: 'Equifax',
    title: 'What we document',
    body: 'Tradelines, collections, and addresses as they appear on Equifax. Screenshots stay in the vault with the letter they support.',
  },
  {
    key: 'ex',
    accent: 'violet' as const,
    name: 'Experian',
    title: 'Where the files diverge',
    body: 'Experian often disagrees with the other two bureaus. We treat that variance as evidence, not a mystery score.',
  },
  {
    key: 'tu',
    accent: 'sky' as const,
    name: 'TransUnion',
    title: 'The same item, a third read',
    body: 'A TransUnion-only collection still receives its own reason and its own mail record. One letter does not cover three bureaus.',
  },
] as const;

const PROOF = [
  {
    accent: 'emerald' as const,
    label: 'Documented path',
    value: '3 bureaus',
    body: 'Every dispute names what appears on the screenshot — never a generic “please verify.”',
  },
  {
    accent: 'violet' as const,
    label: 'First review',
    value: '45 days',
    body: 'A typical first-review window after intake. Bureau and furnisher timing still varies.',
  },
  {
    accent: 'sky' as const,
    label: 'Done-for-you ladder',
    value: '7 tiers',
    body: 'Starter through Dynasty, plus a written Custom scope when the file is past a public price.',
  },
];

const RUNWAY_PHASES = [
  {
    key: 'stabilize',
    label: 'Stabilize',
    stage: '01 · Upload',
    accent: 'emerald' as const,
    title: 'Upload and analyze',
    body: 'Import the bureau reports. We map tradelines, collections, and the targets that matter on your file.',
    tools: ['Report upload + parsing', 'Tradeline targeting', 'Identity + address docs'],
  },
  {
    key: 'dispute',
    label: 'Dispute',
    stage: '02 · Letters',
    accent: 'violet' as const,
    title: 'Strategy and letters',
    body: 'Factual dispute reasons tied to what appears on your bureau file — not generic language.',
    tools: ['Letter studio', 'Factual reason builder', 'Evidence vault'],
  },
  {
    key: 'monitor',
    label: 'Monitor',
    stage: '03 · Track',
    accent: 'sky' as const,
    title: 'Send and track',
    body: 'Mail, deadlines, and bureau responses live in one workspace, with every round documented.',
    tools: ['Dispute center', 'Deadline tracking', 'Bureau response log'],
  },
  {
    key: 'build',
    label: 'Build',
    stage: '04 · Next',
    accent: 'rose' as const,
    title: 'Escalate and get fund-ready',
    body: 'Follow-up rounds when furnishers stall, then strengthen utilization and readiness for funding.',
    tools: ['Escalation packets', 'Milestones', 'Specialist guidance'],
  },
] as const;

const FAQ = [
  {
    q: 'Done-for-you or do-it-yourself — which should I pick?',
    a: 'Choose done-for-you if you want our team to run disputes, tracking, and escalation. Choose do-it-yourself if you prefer templates, letter packs, and platform tools while you drive the workflow.',
  },
  {
    q: 'What are the done-for-you restore tiers?',
    a: 'Starter ($750), Pro ($1,500), Elite ($3,000), Supreme ($5,000), Premier ($7,000), and Dynasty ($10,000). Files that require work beyond Dynasty move to a written Custom scope after intake instead of an artificial public price ceiling.',
  },
  {
    q: 'How fast will I see movement?',
    a: 'Bureau and furnisher response times vary. Many partners see movement in the first review window after intake.',
  },
  {
    q: 'Is this legal advice?',
    a: 'No. Finely Cred provides an educational dispute workflow and document tools. A licensed attorney handles legal advice when you need one.',
  },
  {
    q: 'I already paid another company — do I start over?',
    a: 'No. If Round 1 already went out, we open the next round and inherit the letters you already mailed. We do not pretend you never started.',
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

type MosaicAccent = 'sky' | 'emerald' | 'violet' | 'rose';

const DFY_ACCENT: Record<string, MosaicAccent> = {
  personal_restore_starter: 'sky',
  personal_restore: 'emerald',
  personal_platinum: 'violet',
  personal_restore_5000: 'rose',
  personal_restore_7000: 'sky',
  personal_restore_10000: 'emerald',
  personal_restore_custom: 'violet',
};

const DIY_ACCENT: Record<string, MosaicAccent> = {
  personal_free: 'sky',
  personal_starter: 'emerald',
};

function tierAccent(pkg: PricingPackage): MosaicAccent {
  if (DFY_ACCENT[pkg.id]) return DFY_ACCENT[pkg.id];
  if (DIY_ACCENT[pkg.id]) return DIY_ACCENT[pkg.id];
  if (pkg.id.startsWith('letters_pack_')) return 'violet';
  return 'sky';
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
  personal_restore_starter: 'A lighter file that needs a documented first restore sequence.',
  personal_restore: 'A multi-account file that needs recurring rounds and active tracking.',
  personal_platinum: 'A complex file that needs deeper strategy and a longer support window.',
  personal_restore_5000: 'A higher-complexity file that needs stronger quality review and escalation preparation.',
  personal_restore_7000: 'A broad file that needs enterprise cadence, monitoring, and documentation.',
  personal_restore_10000: 'The highest fixed tier for maximum support, sequencing, and priority handling.',
  personal_restore_custom: 'Work beyond the fixed ladder, scoped around file depth and approved deliverables.',
};

const CUSTOM_SCOPE = [
  { title: 'File architecture', body: 'Tradelines, collections, bureau variance, and evidence load are mapped first.' },
  { title: 'Execution depth', body: 'Rounds, quality cadence, documentation, and escalation readiness are written into scope.' },
  { title: 'Support window', body: 'Timeline and specialist touchpoints are sized to the actual file, not a generic tier.' },
  { title: 'Approved terms', body: 'Pricing and payment timing are confirmed only after deliverables are documented.' },
] as const;

function tierObject(pkg: PricingPackage): { className: string; label: string } | null {
  if (pkg.id === 'personal_restore_starter') return { className: 'pc-prev-tier-card__object--letter', label: 'Letter' };
  if (pkg.id === 'personal_restore') return { className: 'pc-prev-tier-card__object--vault', label: 'Vault' };
  if (pkg.id === 'personal_platinum') return { className: 'pc-prev-tier-card__object--runway', label: 'Runway' };
  return null;
}

function FeaturedTicket({
  pkg,
  featured,
  onSelect,
}: {
  pkg: PricingPackage;
  featured?: boolean;
  onSelect: () => void;
}) {
  const accent = tierAccent(pkg);
  const object = tierObject(pkg);
  const badge = featured ? 'Most picked' : pkg.badge;

  return (
    <article
      className={`pc-prev-price pc-prev-ticket${featured ? ' pc-prev-ticket--featured' : ''}`}
      data-fc-accent={accent}
    >
      {object ? <div className={`pc-prev-tier-card__object ${object.className}`}>{object.label}</div> : null}
      {badge ? <span className="pc-prev-ticket__badge">{badge}</span> : null}
      <div className="pc-prev-ticket__price">{priceLabel(pkg)}</div>
      <h3 className="pc-prev-ticket__name">{tierShortName(pkg)}</h3>
      <p className="pc-prev-ticket__tagline">{pkg.tagline}</p>
      <ul className="pc-prev-ticket__list">
        {(pkg.highlights ?? []).slice(0, 3).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <button type="button" className="pc-prev-btn-primary" onClick={onSelect}>
        Choose {tierShortName(pkg)} <ArrowRight size={15} aria-hidden />
      </button>
    </article>
  );
}

function CompareWorkbench({
  packages,
  selectedId,
  onPick,
  onCheckout,
  onIncludes,
}: {
  packages: PricingPackage[];
  selectedId: string;
  onPick: (id: string) => void;
  onCheckout: (pkg: PricingPackage) => void;
  onIncludes: (pkg: PricingPackage) => void;
}) {
  const priced = packages.filter((pkg) => !pkg.isCustomQuote);
  const selected = priced.find((pkg) => pkg.id === selectedId) ?? priced[0];
  if (!selected) return null;
  const selectedIndex = Math.max(0, priced.findIndex((pkg) => pkg.id === selected.id));
  const accent = (['sky', 'emerald', 'violet', 'rose'] as const)[selectedIndex % 4];
  const fit = TIER_FIT[selected.id];

  return (
    <div className="pc-prev-compare">
      <div className="pc-prev-compare__nav" role="listbox" aria-label="Restore tiers">
        {priced.map((pkg, index) => {
          const rowAccent = (['sky', 'emerald', 'violet', 'rose'] as const)[index % 4];
          const active = pkg.id === selected.id;
          return (
            <button
              key={pkg.id}
              type="button"
              role="option"
              aria-selected={active}
              className="pc-mosaic pc-prev-compare__row"
              data-fc-accent={rowAccent}
              onClick={() => onPick(pkg.id)}
            >
              <strong>{tierShortName(pkg)}</strong>
              <span>{priceLabel(pkg)}</span>
            </button>
          );
        })}
      </div>
      <article className="pc-mosaic pc-prev-compare__detail" data-fc-accent={accent}>
        <span className="pc-prev-compare__kicker">Selected tier</span>
        <div className="pc-prev-compare__price">{priceLabel(selected)}</div>
        <h3>{selected.name}</h3>
        <p>{selected.tagline}</p>
        {fit ? (
          <div className="pc-prev-compare__fit">
            <span>Best fit</span>
            <p>{fit}</p>
          </div>
        ) : null}
        <ul>
          {(selected.highlights ?? []).slice(0, 5).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="pc-prev-compare__actions">
          <button type="button" className="pc-prev-btn-primary" onClick={() => onCheckout(selected)}>
            Choose this tier <ArrowRight size={15} aria-hidden />
          </button>
          <button type="button" className="pc-prev-btn-secondary" onClick={() => onIncludes(selected)}>
            <Info size={14} aria-hidden /> What&apos;s included
          </button>
        </div>
      </article>
    </div>
  );
}

function CustomQuoteBand({
  pkg,
  onStart,
  onIncludes,
}: {
  pkg: PricingPackage;
  onStart: () => void;
  onIncludes: () => void;
}) {
  return (
    <section className="pc-prev-custom-band" aria-labelledby="pc-prev-custom-title">
      <article className="pc-mosaic pc-prev-custom-card" data-fc-accent="violet">
        <span className="pc-prev-custom-card__badge">Custom quote</span>
        <h3 id="pc-prev-custom-title">{pkg.name}</h3>
        <p>
          Beyond Dynasty, there is no artificial public ceiling. We review the file, document the deliverables, and
          then scope the engagement around the work actually required.
        </p>
        <strong className="pc-prev-custom-card__price">Custom engagement, scoped after intake</strong>
        <div className="pc-prev-custom-card__scope">
          {CUSTOM_SCOPE.map((item, index) => {
            const accent = (['emerald', 'violet', 'sky', 'rose'] as const)[index];
            return (
              <div key={item.title} className="pc-mosaic pc-prev-custom-card__item" data-fc-accent={accent}>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </div>
            );
          })}
        </div>
        <p className="pc-prev-compliance">A written scope is required. Payment terms follow approved deliverables.</p>
        <div className="pc-prev-custom-card__actions">
          <button type="button" className="pc-prev-btn-primary" onClick={onStart}>
            Start custom intake <ArrowRight size={15} aria-hidden />
          </button>
          <button type="button" className="pc-prev-btn-secondary" onClick={onIncludes}>
            <Info size={14} aria-hidden /> What&apos;s included
          </button>
        </div>
      </article>
    </section>
  );
}

export default function PersonalCreditRestorePreviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [path, setPath] = useState<RestorePath>('dfy');
  const [bureauKey, setBureauKey] = useState<(typeof BUREAU_REVEAL)[number]['key']>('eq');
  const [beatKey, setBeatKey] = useState<(typeof RUNWAY_PHASES)[number]['key']>('stabilize');
  const [detailPkg, setDetailPkg] = useState<PricingPackage | null>(null);
  const [selectedCompareId, setSelectedCompareId] = useState('personal_restore');
  const pathPackages = useMemo(() => filterPackages(path), [path]);
  const dfyTiers = useMemo(
    () => DFY_RESTORE_LADDER_IDS.map((id) => getPackageById(id)).filter(Boolean) as PricingPackage[],
    [],
  );
  const featuredPackages = useMemo(() => {
    if (path === 'dfy') {
      return DFY_FEATURED_IDS.map((id) => getPackageById(id)).filter(Boolean) as PricingPackage[];
    }
    return pathPackages.slice(0, 3);
  }, [path, pathPackages]);

  usePublicSeoMeta({
    title: 'Personal credit restore | Finely Cred',
    description:
      'We read Equifax, Experian, and TransUnion screenshots, write factual dispute reasons, and keep every letter and reply in one vault. Done-for-you from Starter through Dynasty.',
    path: location.pathname === '/personal-credit' ? '/personal-credit' : LIVE_PATH,
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
  const scrollPackages = () => document.getElementById('pc-prev-packages')?.scrollIntoView({ behavior: 'smooth' });

  const displayPackages = path === 'dfy' ? dfyTiers : pathPackages;
  const customTier = useMemo(
    () => displayPackages.find((p) => p.isCustomQuote) ?? null,
    [displayPackages],
  );
  const featuredId = path === 'dfy' ? 'personal_restore' : 'personal_starter';
  const bureau = BUREAU_REVEAL.find((item) => item.key === bureauKey) ?? BUREAU_REVEAL[0];
  const beat = RUNWAY_PHASES.find((item) => item.key === beatKey) ?? RUNWAY_PHASES[0];
  const letterPress = usePreviewReveal<HTMLDivElement>(0.22);

  useEffect(() => {
    setSelectedCompareId(featuredId);
  }, [featuredId]);

  const checkoutPackage = (pkg: PricingPackage) =>
    goCheckout(
      pkg.id,
      pkg.rail === 'in_house' ? 'in_house' : pkg.rail === 'stripe' ? 'stripe' : undefined,
    );

  return (
    <>
      <PageShell
        hideHero
        hideLaunchHelpStrip
        surface="ivory"
        contentWidth="full"
        title="Finely Cred · Personal credit restore"
      >
        <div className="pc-prev-shell" data-fc-pc-restore-preview="1">
          <header className="pc-prev-hero">
            <div className="pc-prev-inner pc-prev-hero__inner">
              <div className="pc-prev-hero__copy">
                <p className="pc-prev-eyebrow">Equifax · Experian · TransUnion</p>
                <h1 className="pc-prev-hero__title">
                  <span className="pc-prev-hero__brand">Finely Cred</span>
                  Personal credit restore
                </h1>
                <p className="pc-prev-hero__sub">
                  Restore the file lenders <span>actually read.</span>
                </p>
                <p className="pc-prev-hero__lede">
                  Personal credit is the file attached to a Social Security number. We dispute what the bureau
                  screenshots actually show, keep letters and evidence in one vault, and track every reply.
                  Done-for-you runs from Starter through Dynasty.
                </p>
                <div className="pc-prev-hero__actions">
                  <button type="button" className="pc-prev-btn-primary" onClick={scrollPackages}>
                    See packages <ArrowRight size={15} aria-hidden />
                  </button>
                  <button type="button" className="pc-prev-btn-secondary" onClick={bookSession}>
                    Book a session
                  </button>
                  <button type="button" className="pc-prev-btn-ghost" onClick={startFree}>
                    Free restore guide
                  </button>
                </div>
              </div>
              <div
                ref={letterPress.ref}
                className={`pc-letter-press${letterPress.visible ? ' is-on' : ''}`}
                aria-label={`Sample ${bureau.name} dispute reason`}
              >
                <div className="pc-letter-press__env">
                  <div className="pc-letter-press__flap" aria-hidden />
                  <div className="pc-letter-press__seal" aria-hidden />
                  <div className="pc-letter-press__sheet">
                    <span className="pc-letter-press__label">Sample dispute reason</span>
                    <em>{bureau.name}</em>
                    <p>{LETTER_LINES[bureauKey]}</p>
                  </div>
                </div>
                <p className="pc-letter-press__caption">
                  Written from the {bureau.name} file — not a generic “please verify.”
                </p>
                <p className="pc-letter-press__insight">
                  The software reads the bureau screenshot. The letter names what you can see.
                </p>
              </div>
            </div>
          </header>

          <div className="pc-prev-inner">
            <div className="pc-prev-proof" aria-label="Restore proof">
              {PROOF.map((item) => (
                <article key={item.label} className="pc-mosaic pc-prev-proof__plaque" data-fc-accent={item.accent}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>

          <section className="pc-prev-section pc-prev-section--tight">
            <div className="pc-prev-inner">
              <Reveal>
                <p className="pc-prev-kicker">The bureau file</p>
                <h2 className="pc-prev-h2">We dispute the reason you can see.</h2>
                <p className="pc-prev-lede">
                  The system reads each bureau screenshot and writes a factual line for that file — Equifax, Experian,
                  or TransUnion — instead of a generic please-verify letter.
                </p>
              </Reveal>
              <div className="pc-prev-bureau-stage">
                <div className="pc-prev-bureau-stage__tabs" role="tablist" aria-label="Bureau files">
                  {BUREAU_REVEAL.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      role="tab"
                      aria-selected={bureauKey === item.key}
                      className="pc-mosaic pc-prev-bureau-stage__tab"
                      data-fc-accent={item.accent}
                      onClick={() => setBureauKey(item.key)}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
                <article
                  className="pc-mosaic pc-prev-bureau-stage__panel"
                  data-fc-accent={bureau.accent}
                  role="tabpanel"
                >
                  <span>{bureau.name}</span>
                  <h3>{bureau.title}</h3>
                  <p>{bureau.body}</p>
                </article>
              </div>
            </div>
          </section>

          <section className="pc-prev-section pc-prev-section--tight">
            <div className="pc-prev-inner">
              <div className="pc-prev-transfer">
                <p className="pc-prev-kicker">Already in motion</p>
                <h2 className="pc-prev-h2">Already in a dispute? We start at your next round.</h2>
                <p className="pc-prev-lede">
                  If another company already mailed Round 1, bring those letters. We pick up the file you have and open
                  the next round. We do not pretend you never started.
                </p>
                <div className="pc-prev-transfer__grid">
                  <article className="pc-mosaic pc-prev-transfer__card" data-fc-accent="emerald">
                    <strong>Start at the next round</strong>
                    <p>If Round 1 already went out, we open Round 2 on that same matter.</p>
                  </article>
                  <article className="pc-mosaic pc-prev-transfer__card" data-fc-accent="violet">
                    <strong>Protect the bureau read</strong>
                    <p>We do not send a fresh first letter that the bureau treats as an entirely new file.</p>
                  </article>
                  <article className="pc-mosaic pc-prev-transfer__card" data-fc-accent="sky">
                    <strong>Keep the timeline you earned</strong>
                    <p>Dates, replies, and evidence stay on the record you already have.</p>
                  </article>
                </div>
                <button
                  type="button"
                  className="pc-prev-btn-primary"
                  onClick={() =>
                    openPublicChat({
                      goal: 'personal',
                      personaId: 'dispute_coach',
                      initialDraft: 'I already disputed with another company. I want to start at the next round.',
                    })
                  }
                >
                  Tell us where you are <ArrowRight size={15} aria-hidden />
                </button>
              </div>
            </div>
          </section>

          <section className="pc-prev-section">
            <div className="pc-prev-inner">
              <Reveal>
                <p className="pc-prev-kicker">Restore runway</p>
                <h2 className="pc-prev-h2">Four beats on one personal file.</h2>
                <p className="pc-prev-lede">
                  Upload the reports, dispute what they show, track every reply, then escalate when a furnisher stalls.
                  Open a beat to see the work.
                </p>
              </Reveal>
              <div className="pc-prev-beats" role="tablist" aria-label="Restore phases">
                {RUNWAY_PHASES.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={beatKey === item.key}
                    className="pc-mosaic pc-prev-beats__tile"
                    data-fc-accent={item.accent}
                    onClick={() => setBeatKey(item.key)}
                  >
                    <strong>
                      {item.label}
                    </strong>
                    <span>{item.stage}</span>
                  </button>
                ))}
              </div>
              <article className="pc-mosaic pc-prev-beats__stage" data-fc-accent={beat.accent} role="tabpanel">
                <p className="pc-prev-beats__index">{beat.stage}</p>
                <h3>{beat.title}</h3>
                <p>{beat.body}</p>
                <ul>
                  {beat.tools.map((tool) => (
                    <li key={tool}>{tool}</li>
                  ))}
                </ul>
                {beat.key === 'stabilize' ? (
                  <div className="pc-prev-beats__cta">
                    <p>Drop the bureau file in chat. We read it and return a short snapshot. The full credit analysis opens with a free partner account.</p>
                    <button
                      type="button"
                      className="pc-prev-btn-primary"
                      onClick={() =>
                        openPublicChat({
                          goal: 'personal',
                          personaId: 'dispute_coach',
                          intent: 'upload_report',
                          initialDraft: 'I want to upload my credit report for a quick read.',
                        })
                      }
                    >
                      Upload your report <ArrowRight size={15} aria-hidden />
                    </button>
                  </div>
                ) : null}
              </article>
            </div>
          </section>

          <section className="pc-prev-section pc-prev-section--prices" id="pc-prev-packages">
            <div className="pc-prev-inner">
              <Reveal>
                <p className="pc-prev-kicker">Packages</p>
                <h2 className="pc-prev-h2">Choose the depth the file actually needs.</h2>
                <p className="pc-prev-lede">
                  {path === 'dfy'
                    ? 'Letter, Vault, and Runway are the three most-chosen starts. Open the ladder below to compare every done-for-you price.'
                    : 'Free tools, Credit Starter, and letter packs if you want to drive the disputes yourself.'}
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
                  <span>We dispute, track, and escalate.</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={path === 'diy'}
                  className={`pc-prev-path__btn ${path === 'diy' ? 'pc-prev-path__btn--active' : ''}`}
                  onClick={() => setPath('diy')}
                >
                  <strong>Do it yourself</strong>
                  <span>Templates, tools, and letter packs.</span>
                </button>
              </div>

              <Reveal delayMs={20}>
                <div className="pc-prev-tier-preview">
                  <p className="pc-prev-tier-preview__label">Quick tier preview</p>
                  <div className="pc-prev-ticket-grid">
                    {featuredPackages.map((pkg) => (
                      <FeaturedTicket
                        key={pkg.id}
                        pkg={pkg}
                        featured={pkg.id === featuredId}
                        onSelect={() => checkoutPackage(pkg)}
                      />
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal delayMs={40}>
                <div className="pc-prev-tier-compare">
                  <div className="pc-prev-tier-compare__head">
                    <h2 className="pc-prev-tier-compare__title">
                      {path === 'dfy' ? 'Compare all done-for-you tiers' : 'Compare do-it-yourself tools and letter packs'}
                    </h2>
                    <p className="pc-prev-tier-compare__lede">
                      {path === 'dfy'
                        ? 'Select a tier on the left. The inspector shows who it is for and what you purchase.'
                        : 'Select a tool or letter pack. Pricing and scope stay on the right.'}
                    </p>
                  </div>
                  <CompareWorkbench
                    packages={displayPackages}
                    selectedId={selectedCompareId}
                    onPick={setSelectedCompareId}
                    onCheckout={checkoutPackage}
                    onIncludes={setDetailPkg}
                  />
                  <div className="pc-prev-tier-compare__foot">
                    <button type="button" className="pc-prev-catalog__link" onClick={() => navigate('/pricing/personal-credit-building')}>
                      Personal building programs →
                    </button>
                  </div>
                </div>
              </Reveal>

              {customTier ? (
                <CustomQuoteBand
                  pkg={customTier}
                  onStart={() => checkoutPackage(customTier)}
                  onIncludes={() => setDetailPkg(customTier)}
                />
              ) : null}

              <p className="pc-prev-convert-note">
                Not sure which tier fits?{' '}
                <button type="button" onClick={bookSession}>
                  Book a session
                </button>{' '}
                — we will match your file to Starter, Pro, Elite, Supreme, Premier, Dynasty, or Custom.
              </p>
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
              <div className="pc-mosaic pc-prev-final" data-fc-accent="violet">
                <h2>Ready to restore your file?</h2>
                <p>
                  Start with the free guide, compare the restore ladder, or book a session. Credit building is a
                  different product — utilization and tradelines after the file is clean.
                </p>
                <div className="pc-prev-final__actions">
                  <button type="button" className="pc-prev-btn-primary" onClick={startFree}>
                    Start free guide <ArrowRight size={15} aria-hidden />
                  </button>
                  <button type="button" className="pc-prev-btn-secondary" onClick={bookSession}>
                    Book a session
                  </button>
                </div>
              </div>
              <div className="pc-prev-exits">
                <Link className="pc-mosaic pc-prev-exit" data-fc-accent="rose" to="/resources/personal-credit-restore-sheet">
                  <strong>Personal credit restore</strong>
                  <span>A free restore sheet: the process, the page counts, and no signup required.</span>
                </Link>
                <Link className="pc-mosaic pc-prev-exit" data-fc-accent="sky" to="/build-my-credit">
                  <strong>Personal credit build</strong>
                  <span>Utilization and tradelines after the file is clean.</span>
                </Link>
                <button type="button" className="pc-mosaic pc-prev-exit" data-fc-accent="emerald" onClick={bookSession}>
                  <strong>Book a session</strong>
                  <span>Match Starter through Dynasty — or Custom — to the actual file.</span>
                </button>
              </div>
              <p className="pc-prev-compliance">Results vary · not legal advice · funding subject to underwriting</p>
              <div className="pc-prev-page-end" />
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
