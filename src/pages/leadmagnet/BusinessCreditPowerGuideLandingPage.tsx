import React from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  BookOpenText,
  Building2,
  Calendar,
  Check,
  ClipboardCheck,
  CreditCard,
  Download,
  FileText,
  Gauge,
  Lock,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { LeadMagnetCobrandFooterMarks } from '../../components/brand/LeadMagnetCobrand';
import { LeadMagnetFunnelHeroVideo } from '../../components/leadmagnet/LeadMagnetFunnelHeroVideo';
import { getLeadMagnetVisualTheme } from '../../components/leadmagnet/leadMagnetVisualThemes';
import { BUSINESS_FUNNEL } from '../../domain/leadMagnetFunnels';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { PremiumLeadMagnetCaptureForm } from '../../components/leadmagnet/PremiumLeadMagnetCaptureForm';
import { LandingTypewriterTitle } from '../../components/landing/LandingTypewriterTitle';
import { BC_GUIDE_CHAPTERS, BC_GUIDE_META, BC_GUIDE_READ_PATH } from './businessCreditPowerGuideContent';
import '../../components/leadmagnet/premiumLeadMagnetShared.css';
import '../../components/leadmagnet/leadMagnetLuxuryStage.css';
import './businessCreditPowerGuideLanding.css';

const BUSINESS_THEME = getLeadMagnetVisualTheme(BUSINESS_FUNNEL);

/** Approved center-standup dual-book mockup (landscape) — do not regenerate */
const EGUIDE_MOCKUP_SRC = '/images/lead-magnets/business-credit-power-guide-mockup.png';

/** Dense financial skyline at dusk — gold-lit towers (hosted locally) */
const HERO_BG = '/images/lead-magnets/bc-hero-skyline.jpg';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function GuideMockup({ className, tall }: { className?: string; tall?: boolean }) {
  return (
    <div className={cn('bcpg-mockup-stack', tall && 'bcpg-mockup-stack--hero', className)}>
      <div className="bcpg-mockup-glow" aria-hidden />
      <img
        src={EGUIDE_MOCKUP_SRC}
        alt="Business Credit: The Ultimate Guide — free e-guide from Finely Cred"
        className={cn(
          'bcpg-mockup relative z-[1]',
          tall ? 'bcpg-mockup--tall lm-lux-float--soft' : 'bcpg-mockup--hero lm-lux-float--soft',
        )}
      />
      <div className="bcpg-mockup-pedestal" aria-hidden />
    </div>
  );
}

function ToolKpiCard({
  icon: Icon,
  title,
  desc,
  cta,
  onAction,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
  cta: string;
  onAction: () => void;
}) {
  return (
    <button type="button" onClick={onAction} className="bcpg-kpi-card group rounded-2xl !p-4 text-left md:!p-5">
      <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl border border-[#95e000]/40 bg-[#95e000]/10 text-[#95e000] shadow-[0_0_24px_rgba(149,224,0,0.16)] transition group-hover:border-[#95e000]/60">
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <h3 className="bcpg-serif text-lg leading-snug text-white md:text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{desc}</p>
      <span className="mt-3.5 inline-flex text-[10px] font-black uppercase tracking-[0.18em] text-[#d4a447] group-hover:text-[#95e000]">
        {cta} →
      </span>
    </button>
  );
}

function WhyKpiCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="bcpg-kpi-card rounded-2xl !p-4 md:!p-5">
      <Icon size={24} strokeWidth={1.5} className="text-[#95e000]" />
      <p className="bcpg-serif mt-3 text-lg text-white md:text-xl">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-white/52">{desc}</p>
    </div>
  );
}

const BCPG_BUTTON =
  'lm-lux-btn lm-lux-cta-sheen bcpg-cta relative h-[3.25rem] w-full overflow-hidden rounded-lg text-[11px] font-black uppercase tracking-[0.2em] text-black transition disabled:opacity-60';

function BusinessCaptureForm({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      {!compact ? (
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full border border-[#95e000]/40 bg-[#95e000]/10 text-[#95e000] shadow-[0_0_30px_rgba(149,224,0,0.18)]">
            <Download size={22} />
          </div>
          <h2 className="bcpg-serif text-[1.85rem] leading-tight text-white md:text-[2.2rem]">
            Get Your <span className="text-[#95e000]">FREE</span> E-Guide Now
          </h2>
          <p className="mt-2 text-sm text-white/50">Instant access · Actionable strategies · No card required</p>
        </div>
      ) : null}
      <PremiumLeadMagnetCaptureForm
        funnelConfig={BUSINESS_FUNNEL}
        showBusinessName={!compact}
        submitLabel={compact ? 'Yes — Send Me The Free Guide' : 'Download My Free Guide'}
        buttonClass={BCPG_BUTTON}
        accentClass="focus:border-[#d4a447]/55 focus:ring-[#95e000]/15"
      />
      <p className="bcpg-compliance mt-3 text-center">
        Results vary · not legal advice · funding subject to underwriting
      </p>
      <div className="mt-2 text-center">
        <Link to={BUSINESS_FUNNEL.bookingPath ?? '/enlightenment-session'} className="lm-secondary-book-link">
          <Calendar size={14} /> Book a session
        </Link>
      </div>
    </div>
  );
}

function GoldCheck({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3.5 text-base leading-relaxed text-white/85 md:text-[17px]">
      <Check size={18} strokeWidth={2.5} className="bcpg-check mt-0.5 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function InsideItem({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="group flex gap-5 py-7 md:gap-7 md:py-8">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#d4a447]/40 bg-[#d4a447]/10 text-[#e8c96a] shadow-[0_0_28px_rgba(212,164,71,0.14)] transition group-hover:border-[#95e000]/45">
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <div className="min-w-0 pt-0.5">
        <h3 className="bcpg-serif text-xl text-white md:text-2xl">{title}</h3>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-white/55">{desc}</p>
      </div>
    </div>
  );
}

export default function BusinessCreditPowerGuideLandingPage() {
  usePublicSeoMeta({
    title: 'Business Credit Power Guide — Free E-Guide',
    description:
      'Fundability sequencing for partners: entity pillars, stage gates, vendor depth, and OS scorecard habits — premium business credit education from Finely Cred. Results vary · funding subject to underwriting.',
    path: BUSINESS_FUNNEL.path,
  });

  const scrollToDownload = () => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' });

  const inside = [
    {
      icon: Building2,
      title: 'Business Credit Fundamentals',
      desc: 'What business credit is, why funders care, and how your EIN file is evaluated across fundability pillars.',
    },
    {
      icon: ClipboardCheck,
      title: 'Fundability Sequencing Blueprint',
      desc: 'Stage gates from entity truth → bureau match → vendors → revolving → capital asks — in order.',
    },
    {
      icon: CreditCard,
      title: 'Vendor & Net-30 Strategy',
      desc: 'Tier-1 reporters, pay-early habits, and spacing — without premature applications.',
    },
    {
      icon: ShieldCheck,
      title: 'Funding Readiness & OS Scorecard',
      desc: 'Blockers, capital-pack optics, and how partners track fundability before they apply.',
    },
    {
      icon: TriangleAlert,
      title: 'Costly Mistakes to Avoid',
      desc: 'Mismatched records, thin files, and inquiry sprawl — the blockers that stop sequencing cold.',
    },
    {
      icon: TrendingUp,
      title: 'Growth & Leverage',
      desc: 'Scale with a sequenced file funders can match — not guesswork or spray-and-pray apps.',
    },
  ];

  const tools = [
    {
      icon: Gauge,
      title: 'Business Credit Score Estimator',
      desc: 'Instant fundability band read — pillars and sequencing cues, educational only.',
      cta: 'Use free tool',
    },
    {
      icon: ClipboardCheck,
      title: 'Vendor Approval Checklist',
      desc: 'Confirm entity stage gates before your first Tier-1 net-30 applications.',
      cta: 'Open checklist',
    },
    {
      icon: ShieldCheck,
      title: 'Business Credit Readiness Quiz',
      desc: 'See how close your file is to funding-ready optics and capital-pack readiness.',
      cta: 'Take the quiz',
    },
    {
      icon: FileText,
      title: 'Dispute Letter Builder Preview',
      desc: 'Preview how inaccurate commercial entries get challenged.',
      cta: 'Try the builder',
    },
  ];

  return (
    <main className="bcpg-page lm-lux-theme--lime min-h-screen overflow-x-hidden bg-[#030504] text-white selection:bg-[#95e000]/25">
      {/* Dark base + luminous green bottom glow + gold accents */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#030504]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-12%,rgba(149,224,0,0.16),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_100%_8%,rgba(212,164,71,0.16),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-[58vh] bg-[radial-gradient(ellipse_95%_75%_at_50%_100%,rgba(149,224,0,0.22),transparent_62%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[35vh] bg-[radial-gradient(ellipse_70%_55%_at_30%_100%,rgba(212,164,71,0.12),transparent_70%)]" />
      </div>
      <div className="lm-lux-grain lm-lux-grain--fixed pointer-events-none" aria-hidden />

      {/* Site nav owns branding — no duplicate cobrand strip */}
      <section className="relative z-10 overflow-x-hidden pt-20 md:pt-24">
        <div className="absolute inset-0 bg-[#030504]" />
        <div
          className="absolute inset-0 bg-cover bg-[center_55%] opacity-[0.22] saturate-[1.02] brightness-[0.7]"
          style={{ backgroundImage: `url('${HERO_BG}')` }}
        />
        {/* Heavy tint — mute sky; keep faint tower glow only */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#030504] via-[#030504]/94 to-[#030504]/82" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030504] via-[#030504]/55 to-[#030504]/78" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_55%,rgba(212,164,71,0.06),transparent_48%)]" />
        <div className="bcpg-hero-orb" aria-hidden />
        <div className="bcpg-hero-orb bcpg-hero-orb--gold" aria-hidden />
        <div className="lm-lux-vignette" aria-hidden />
        <div className="lm-lux-beam lm-lux-beam--accent left-[8%] top-[-8%]" aria-hidden />
        <div className="lm-lux-beam lm-lux-beam--right right-[4%] top-[12%]" aria-hidden />
        <div className="absolute bottom-0 left-0 right-0 lm-lux-rule" />

        <div className="relative z-[2] mx-auto max-w-[88rem] px-5 pb-16 pt-10 md:px-10">
          <div className="bcpg-hero-split">
            <div className="bcpg-hero-copy">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#95e000]">Free E-Guide</p>
              <h1 className="bcpg-serif bcpg-hero-title lm-lux-display mt-4 text-white">
                <LandingTypewriterTitle
                  as="span"
                  text="Business Credit"
                  className="block"
                  speedMs={40}
                  delayMs={100}
                  caret
                />
                <LandingTypewriterTitle
                  as="span"
                  text="Power Guide"
                  className="bcpg-hero-title-gold mt-1 block"
                  speedMs={44}
                  delayMs={780}
                  caret
                />
              </h1>
              <div className="lm-lux-rule--short lm-lux-rule--draw mt-5" aria-hidden />
              <p className="lm-lux-lede mt-6 max-w-md text-white/82">
                Fundability sequencing — entity pillars, stage gates, and vendor depth — so partners ask for capital in the right order.
              </p>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-white/65">
                Entity truth before vendor volume · stage gates · scorecard habit — not spray-and-pray apps.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={scrollToDownload}
                  className="lm-lux-btn lm-lux-cta-sheen bcpg-cta inline-flex h-12 items-center justify-center rounded-lg px-7 text-[11px] font-black uppercase tracking-[0.18em] text-black"
                >
                  <span className="relative z-10">Download Free Guide</span>
                </button>
                <Link
                  to={BC_GUIDE_READ_PATH}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#d4a447]/45 bg-[#d4a447]/10 px-5 text-[11px] font-black uppercase tracking-[0.14em] text-[#e8c96a] transition hover:border-[#d4a447]/75 hover:bg-[#d4a447]/16"
                >
                  <BookOpenText size={15} /> Read free — no signup
                </Link>
                <a href="#bcpg-preview" className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 hover:text-[#95e000]">
                  Preview ↓
                </a>
                <Link
                  to={BUSINESS_FUNNEL.bookingPath ?? '/enlightenment-session'}
                  className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 hover:text-[#d4a447]"
                >
                  Book a session →
                </Link>
                <div className="inline-flex items-center gap-2 rounded-xl border border-[#d4a447]/28 bg-black/35 px-3 py-2 backdrop-blur-sm">
                  <Lock size={14} className="text-[#d4a447]" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#d4a447]">Free · no card</p>
                </div>
              </div>
            </div>

            <div className="bcpg-hero-mockup-zone">
              <GuideMockup tall className="w-full max-w-none" />
            </div>
          </div>

          {/* Soft capture + preview — still first scroll, not a second full-screen wall */}
          <div className="mt-10 grid gap-6 lg:mt-12 lg:grid-cols-2 lg:items-stretch xl:gap-8">
            <div id="download" className="bcpg-form-panel lm-lux-panel relative z-10 rounded-2xl p-5 md:p-6">
              <BusinessCaptureForm />
            </div>
            <div id="bcpg-preview" className="bcpg-hero-video flex min-h-[260px] flex-col scroll-mt-28">
              <LeadMagnetFunnelHeroVideo
                config={BUSINESS_FUNNEL}
                theme={BUSINESS_THEME}
                className="h-full min-h-[260px] flex-1 rounded-2xl !aspect-auto"
                onGoForm={scrollToDownload}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust — hierarchy: big number lead, then supporting signals */}
      <section className="bcpg-trust relative z-10">
        <div className="mx-auto flex max-w-[88rem] flex-col divide-y divide-white/[0.06] md:flex-row md:divide-x md:divide-y-0">
          <div className="bcpg-trust-item bcpg-trust-item--primary md:flex-[1.35]">
            <Users size={36} strokeWidth={1.25} className="relative text-[#95e000]" />
            <div className="relative">
              <p className="bcpg-trust-value">10,000+</p>
              <p className="bcpg-trust-label">Guides downloaded by partners</p>
            </div>
          </div>
          <div className="bcpg-trust-item bcpg-trust-item--secondary">
            <ShieldCheck size={26} strokeWidth={1.25} className="text-[#d4a447]" />
            <div>
              <p className="bcpg-trust-value">Trusted nationwide</p>
              <p className="bcpg-trust-label">Partners building fundability</p>
            </div>
          </div>
          <div className="bcpg-trust-item bcpg-trust-item--secondary">
            <Target size={26} strokeWidth={1.25} className="text-[#d4a447]" />
            <div>
              <p className="bcpg-trust-value">Proven sequencing</p>
              <p className="bcpg-trust-label">Real funding education</p>
            </div>
          </div>
        </div>
        <p className="bcpg-compliance mx-auto max-w-[88rem] px-5 pb-4 text-center md:px-10 md:text-right">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </section>

      {/* Chapter index — the full guide is readable in-app before any signup */}
      <section id="read-online" className="relative z-10 border-t border-[#d4a447]/18 py-9 md:py-12">
        <div className="mx-auto max-w-[88rem] px-5 md:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#95e000]">
                Read it now · no signup
              </p>
              <h2 className="bcpg-serif mt-3 text-3xl text-white md:text-4xl">{BC_GUIDE_META.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                {BC_GUIDE_CHAPTERS.length} chapters in the browser — fundability doctrine, entity truth, the three
                business files, the vendor tier ladder, bank rating, the capital stack, and a 12-month build calendar.
              </p>
            </div>
            <Link
              to={BC_GUIDE_READ_PATH}
              className="bcpg-cta inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg px-7 text-[11px] font-black uppercase tracking-[0.16em] text-black"
            >
              <BookOpenText size={15} /> Open Chapter 01
            </Link>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {BC_GUIDE_CHAPTERS.map((ch) => (
              <Link
                key={ch.id}
                to={`${BC_GUIDE_READ_PATH}?chapter=${ch.id}`}
                className="bcpg-kpi-card group flex items-start gap-3.5 rounded-2xl !p-4 text-left transition hover:-translate-y-1"
              >
                <span className="mt-0.5 shrink-0 font-mono text-sm font-bold text-[#95e000]">{ch.number}</span>
                <span className="min-w-0">
                  <span className="bcpg-serif block text-lg leading-snug text-white">{ch.title}</span>
                  <span className="mt-1 block text-[12.5px] leading-relaxed text-white/55">{ch.teaser}</span>
                  <span className="mt-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-[#d4a447]">
                    {ch.readMinutes} min · {ch.kicker}
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <p className="bcpg-compliance mt-4">{BC_GUIDE_META.compliance}</p>
        </div>
      </section>

      {/* SEO depth — collapsed so ATF stays short hero → preview → capture */}
      <section className="relative z-10 border-t border-[#d4a447]/18 py-8 md:py-10">
        <div className="mx-auto max-w-[88rem] space-y-3 px-5 md:px-10">
          <details id="guide" className="lm-seo-depth">
            <summary>
              <span>What&apos;s inside the Power Guide</span>
              <span className="lm-seo-depth-hint">Expand</span>
            </summary>
            <div className="lm-seo-depth-body">
              <p className="mb-4 max-w-3xl text-sm text-white/55">
                A premium fundability roadmap — pillars, stage gates, blockers, and scorecard habits — without hype or fake guarantees.
              </p>
              <div className="mx-auto max-w-5xl columns-1 md:columns-2 md:gap-x-16">
                {inside.map((item, i) => (
                  <div key={item.title} className={cn(i > 0 && 'break-inside-avoid')}>
                    {i > 0 ? <div className="bcpg-gold-line my-0 hidden md:block" /> : null}
                    <InsideItem {...item} />
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={scrollToDownload}
                  className="bcpg-cta inline-flex h-12 items-center justify-center rounded-lg px-8 text-[11px] font-black uppercase tracking-[0.18em] text-black"
                >
                  Get the Free Guide
                </button>
              </div>
            </div>
          </details>

          <details id="tools" className="lm-seo-depth">
            <summary>
              <span>Free partner tools</span>
              <span className="lm-seo-depth-hint">Expand</span>
            </summary>
            <div className="lm-seo-depth-body">
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                {tools.map((tool) => (
                  <ToolKpiCard key={tool.title} {...tool} onAction={scrollToDownload} />
                ))}
              </div>
            </div>
          </details>

          <details id="why" className="lm-seo-depth">
            <summary>
              <span>Why build business credit?</span>
              <span className="lm-seo-depth-hint">Expand</span>
            </summary>
            <div className="lm-seo-depth-body">
              <div className="bcpg-why-panel overflow-hidden rounded-3xl p-5 md:p-8">
                <ul className="space-y-3">
                  <GoldCheck>Separate personal and commercial structure with intention.</GoldCheck>
                  <GoldCheck>Qualify for higher limits and stronger terms over time.</GoldCheck>
                  <GoldCheck>Reduce reliance on personal guarantees as your file matures.</GoldCheck>
                  <GoldCheck>Increase cash-flow flexibility and strategic optionality.</GoldCheck>
                </ul>
                <p className="bcpg-compliance mt-4">
                  Results vary · not legal advice · funding subject to underwriting
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: CreditCard, t: 'Higher limits', d: 'Build depth before you ask for capital.' },
                    { icon: BarChart3, t: 'Lower interest', d: 'Better optics compound over time.' },
                    { icon: ShieldCheck, t: 'Better terms', d: 'Vendor and lender leverage improves.' },
                    { icon: Target, t: 'More opportunity', d: 'Scale with a file funders respect.' },
                  ].map((x) => (
                    <WhyKpiCard key={x.t} icon={x.icon} title={x.t} desc={x.d} />
                  ))}
                </div>
              </div>
            </div>
          </details>

          <details id="results" className="lm-seo-depth">
            <summary>
              <span>What partners are saying</span>
              <span className="lm-seo-depth-hint">Expand</span>
            </summary>
            <div className="lm-seo-depth-body">
              <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">
                {[
                  ['Marcus T.', 'E-Commerce Owner', 'This guide gave me the exact roadmap I needed to build my business credit the right way.'],
                  ['Jasmine R.', 'Consultant', 'Easy to follow, packed with value, and full of actionable steps.'],
                  ['David L.', 'Real Estate Investor', 'Finally, a guide that breaks everything down in simple terms.'],
                ].map(([name, role, quote]) => (
                  <article key={name} className="bcpg-quote-card flex-1 rounded-2xl p-5 md:p-6">
                    <div className="flex gap-0.5 text-[#d4a447]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={13} fill="currentColor" />
                      ))}
                    </div>
                    <p className="bcpg-serif mt-4 text-base leading-relaxed text-white/78 md:text-lg">“{quote}”</p>
                    <div className="mt-5 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a447]/45 to-[#95e000]/25 text-[10px] font-bold text-white">
                        {name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{name}</p>
                        <p className="text-xs text-white/45">{role}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <p className="bcpg-compliance mt-4 text-center">
                Individual results vary · stories for illustration · not legal advice
              </p>
            </div>
          </details>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 overflow-hidden border-t border-[#d4a447]/24 py-14 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_0%_50%,rgba(149,224,0,0.16),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(ellipse_90%_90%_at_50%_100%,rgba(149,224,0,0.18),transparent)]" />
        <div className="relative mx-auto flex max-w-[88rem] flex-col items-center gap-8 px-5 md:px-10 lg:flex-row lg:justify-between">
          <div className="max-w-xl text-center lg:text-left">
            <ShieldCheck size={36} className="mx-auto text-[#d4a447] lg:mx-0" strokeWidth={1.25} />
            <LandingTypewriterTitle
              as="h2"
              text="Your business deserves better funding options."
              className="bcpg-serif mt-3 text-3xl leading-tight text-white md:text-4xl lg:text-5xl"
              highlight="better funding options."
              highlightClassName="text-[#95e000]"
              speedMs={34}
              delayMs={160}
            />
            <p className="mt-2 text-2xl font-semibold text-[#95e000] md:text-3xl">Start with this free guide.</p>
            <p className="bcpg-compliance mt-3">
              Results vary · not legal advice · funding subject to underwriting
            </p>
          </div>
          <div className="bcpg-form-panel lm-lux-panel w-full max-w-xl rounded-2xl p-5 md:p-6">
            <BusinessCaptureForm compact />
          </div>
        </div>
      </section>

      <footer className="bcpg-footer relative z-10 py-9">
        <div className="mx-auto flex max-w-[88rem] flex-col items-center gap-7 px-5 md:flex-row md:items-center md:justify-between md:px-10">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/45 md:justify-start">
            <a href="/privacy" className="transition hover:text-[#95e000]">Privacy Policy</a>
            <a href="/terms" className="transition hover:text-[#95e000]">Terms of Use</a>
            <a href="/contact" className="transition hover:text-[#95e000]">Contact Us</a>
          </div>
          <p className="text-xs text-white/35">© {new Date().getFullYear()} Finely Cred · NCG. All rights reserved.</p>
          <div className="relative flex shrink-0 items-center justify-center">
            <div className="bcpg-fc-glow absolute inset-0 scale-150" />
            <div className="bcpg-footer-mark relative rounded-2xl px-4 py-2">
              <LeadMagnetCobrandFooterMarks />
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
