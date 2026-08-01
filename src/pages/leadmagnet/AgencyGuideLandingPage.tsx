import React from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Calendar,
  ChevronRight,
  Cog,
  Quote,
  Settings,
  Star,
  Target,
  TreePalm,
  TrendingUp,
  Users,
} from 'lucide-react';
import { FinelyCredLogo } from '../../components/brand/FinelyCredLogo';
import { LeadMagnetFunnelHeroVideo } from '../../components/leadmagnet/LeadMagnetFunnelHeroVideo';
import { getLeadMagnetVisualTheme } from '../../components/leadmagnet/leadMagnetVisualThemes';
import { AGENCY_FUNNEL } from '../../domain/leadMagnetFunnels';
import {
  AGENCY_GUIDE_CHAPTERS,
  AGENCY_GUIDE_READ_PATH,
} from '../../resources/agencyGuideReaderContent';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { PremiumLeadMagnetCaptureForm } from '../../components/leadmagnet/PremiumLeadMagnetCaptureForm';
import { LEAD_MAGNET_TRIAL_DAYS } from '../../lib/leadMagnetTrial';
import '../../components/leadmagnet/premiumLeadMagnetShared.css';
import './agencyGuideLanding.css';

const AGENCY_THEME = getLeadMagnetVisualTheme(AGENCY_FUNNEL);
const GUIDE_BUNDLE_SRC = '/images/lead-magnets/agency-guide-bundle.png';
const GUIDE_BOOK_SRC = '/images/lead-magnets/agency-guide-book.png';
const FOOTER_CTA_BG =
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2400&q=85';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function GuideMockup({ variant = 'bundle' }: { variant?: 'bundle' | 'book' }) {
  const isBundle = variant === 'bundle';
  return (
    <div className={cn('agc-mockup-stage w-full py-4', isBundle && 'agc-mockup-stage--bundle')}>
      <div className="agc-mockup-sunrise-core" aria-hidden />
      <div className="agc-mockup-sunrise-halo" aria-hidden />
      <div className="agc-mockup-glow" aria-hidden />
      <div className="agc-mockup-pedestal-rings" aria-hidden />
      <img
        src={isBundle ? GUIDE_BUNDLE_SRC : GUIDE_BOOK_SRC}
        alt={isBundle ? 'The Agency Guide — full mockup set' : 'The Agency Guide — e-guide cover'}
        className={cn('agc-mockup', isBundle ? 'agc-mockup--bundle' : 'agc-mockup--book')}
        loading="eager"
        decoding="async"
      />
      <div className="agc-mockup-pedestal" aria-hidden />
    </div>
  );
}

function BenefitCard({
  icon: Icon,
  title,
  desc,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <div className="agc-benefit-card rounded-2xl p-6 text-center">
      <div
        className={cn(
          'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border',
          accent,
        )}
      >
        <Icon size={26} />
      </div>
      <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#f0cc75]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/58">{desc}</p>
    </div>
  );
}

function InsideCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="agc-inside-card rounded-2xl p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#d4a447]/35 bg-[#d4a447]/10 text-[#f0cc75]">
        <Icon size={22} />
      </div>
      <h3 className="text-base font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{desc}</p>
    </div>
  );
}

function ResultCard({
  image,
  stat,
  title,
  desc,
}: {
  image: string;
  stat: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="agc-result-card rounded-2xl">
      <img src={image} alt="" loading="lazy" />
      <div className="p-5">
        <div className="agc-serif text-4xl font-bold text-[#f0cc75]">{stat}</div>
        <div className="mt-1 text-sm font-bold text-white">{title}</div>
        <p className="mt-2 text-xs leading-relaxed text-white/52">{desc}</p>
      </div>
    </div>
  );
}

export default function AgencyGuideLandingPage() {
  usePublicSeoMeta({
    title: 'The Agency Guide — Build a Profitable Agency',
    description:
      'Build a profitable agency, attract better partners, and create more time, income, and freedom with Finely Cred’s premium agency guide.',
    path: AGENCY_FUNNEL.path,
  });

  const scrollToDownload = () => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' });

  const benefits = [
    { icon: Target, title: 'Offer Clarity', desc: 'Define irresistible offers that convert.', accent: 'border-[#d4a447]/40 bg-[#d4a447]/10 text-[#f0cc75]' },
    { icon: Users, title: 'Partner Attraction', desc: 'Position your agency to attract ideal partners.', accent: 'border-fuchsia-400/35 bg-fuchsia-500/10 text-fuchsia-300' },
    { icon: Cog, title: 'Smart Systems', desc: 'Deliver consistently with scalable systems.', accent: 'border-orange-400/35 bg-orange-500/10 text-orange-300' },
    { icon: BarChart3, title: 'Sustainable Growth', desc: 'Scale with confidence and more freedom.', accent: 'border-cyan-400/35 bg-cyan-500/10 text-cyan-300' },
    { icon: Star, title: 'Strong Positioning', desc: 'Stand out in crowded markets with clarity.', accent: 'border-[#d4a447]/40 bg-[#d4a447]/10 text-[#f0cc75]' },
    { icon: TreePalm, title: 'Freedom Through Structure', desc: 'Build income without sacrificing your life.', accent: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-300' },
  ];

  const inside = [
    { icon: Target, title: 'Define Your Irresistible Offer', desc: 'Craft offers that attract premium partners and command higher prices.' },
    { icon: Users, title: 'Attract Ideal Partners', desc: 'Position your agency to consistently attract the right partners.' },
    { icon: Settings, title: 'Build Smart Systems', desc: 'Create delivery systems that save time and increase profit.' },
    { icon: TrendingUp, title: 'Scale With Confidence', desc: 'Grow your agency without burning out or sacrificing quality.' },
    { icon: Star, title: 'Position for Premium Partners', desc: 'Attract higher-value partners who respect your expertise.' },
    { icon: TreePalm, title: 'Create Freedom Through Structure', desc: 'Build a business that gives you time, income, and freedom.' },
  ];

  const results = [
    {
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
      stat: '$125K+',
      title: 'Revenue Growth',
      desc: 'Agencies using these frameworks increased annual revenue within 12 months.',
    },
    {
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      stat: '2.4X',
      title: 'ROI Increase',
      desc: 'Average return on marketing investment after implementing the systems.',
    },
    {
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
      stat: '40%',
      title: 'More Free Time',
      desc: 'Agency owners reclaimed hours per week through better systems.',
    },
    {
      image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80',
      stat: '90%',
      title: 'Partner Retention',
      desc: 'Improved partner satisfaction and long-term retention rates.',
    },
  ];

  const steps = [
    { n: 1, title: 'Get Your Guide', desc: 'Download instantly and start reading.' },
    { n: 2, title: 'Implement', desc: 'Apply the frameworks to your agency.' },
    { n: 3, title: 'Attract & Serve', desc: 'Attract better partners and deliver with confidence.' },
    { n: 4, title: 'Scale With Freedom', desc: 'Grow your agency without burning out.' },
  ];

  return (
    <main className="agc-page min-h-screen overflow-hidden bg-[#050a14] text-white selection:bg-[#d4a447]/30">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_72%_6%,rgba(212,164,71,0.14),transparent_28%),radial-gradient(circle_at_14%_24%,rgba(40,70,120,0.22),transparent_34%),linear-gradient(180deg,#050a14_0%,#0a1224_48%,#050a14_100%)]" />

      {/* Hero — site-wide nav from App shell; no page-local menu */}
      <section className="relative z-10 border-b border-white/8 pt-20 pb-12 md:pt-24 md:pb-16 lg:pt-28">
        <div className="agc-hero-grid mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:gap-12">
          <div className="flex flex-col justify-center">
            <div className="agc-title-block">
              <span className="agc-free-badge">Free Guide</span>
              <div className="agc-title-row">
                <span className="agc-hero-rule" aria-hidden />
                <span className="agc-hero-title-the">THE</span>
                <span className="agc-hero-rule" aria-hidden />
              </div>
              <h1 className="agc-hero-title-agency agc-serif">AGENCY</h1>
              <div className="agc-title-row mt-2">
                <span className="agc-hero-rule" aria-hidden />
                <span className="agc-hero-title-guide agc-serif">GUIDE</span>
                <span className="agc-hero-rule" aria-hidden />
              </div>
            </div>
            <p className="agc-title-block mt-6 max-w-xl text-lg leading-relaxed text-white/68 lg:text-left">
              Build a Profitable Agency, Attract Better Partners, and Create More Time, Income, and{' '}
              <span className="font-semibold text-[#f0cc75]">Freedom</span>.
            </p>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/55">
              Clarity on offers · better partners · scalable systems · more time and freedom without burnout.
            </p>
            <div className="agc-hero-form mt-6 rounded-2xl p-5 md:p-6">
              <PremiumLeadMagnetCaptureForm
                funnelConfig={AGENCY_FUNNEL}
                accentClass="focus:border-[#f0cc75] focus:ring-[#d4a447]/15"
                buttonClass="agc-gold-btn group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-xl border px-7 text-[11px] font-black uppercase tracking-[0.14em] text-[#06101f] shadow-[0_18px_55px_rgba(212,164,71,0.32)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-70"
              />
              <div className="mt-3 flex flex-wrap gap-4">
                <Link to={AGENCY_GUIDE_READ_PATH} className="lm-secondary-book-link !mt-0">
                  <BookOpen size={14} /> Read it free — no email
                </Link>
                <Link to="/agency-partners" className="lm-secondary-book-link !mt-0">
                  Agency partners →
                </Link>
                <Link to={AGENCY_FUNNEL.bookingPath ?? '/enlightenment-session'} className="lm-secondary-book-link !mt-0">
                  <Calendar size={14} /> Book a session
                </Link>
              </div>
              <p className="mt-3 text-center text-[11px] text-white/40">
                Results vary · not legal advice · income claims are not guarantees
              </p>
            </div>
          </div>
          <div className="agc-video-frame w-full">
            <div className="agc-video-inner">
              <LeadMagnetFunnelHeroVideo
                config={AGENCY_FUNNEL}
                theme={AGENCY_THEME}
                colorGrade="gold"
                posterUrl="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=90"
                className="h-full w-full rounded-none border-0 shadow-none"
                onGoForm={scrollToDownload}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Plan set — read free, no email required */}
      <section className="relative z-10 border-b border-white/8 py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="agc-sheet-rail">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="agc-sheet-rail-kicker">Read it free — no email required</div>
                <h2 className="agc-serif mt-1 text-2xl font-bold text-white md:text-3xl">
                  {AGENCY_GUIDE_CHAPTERS.length} sheets, open in your browser
                </h2>
              </div>
              <Link to={AGENCY_GUIDE_READ_PATH} className="agc-sheet-rail-cta">
                <BookOpen size={14} /> Open the plan set
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {AGENCY_GUIDE_CHAPTERS.slice(0, 6).map((ch) => (
                <Link
                  key={ch.id}
                  to={`${AGENCY_GUIDE_READ_PATH}?chapter=${ch.id}`}
                  className="agc-sheet-card"
                >
                  <span className="agc-sheet-card-no">
                    {ch.sheet} · {ch.kicker}
                  </span>
                  <span className="agc-sheet-card-title">{ch.title}</span>
                  <span className="agc-sheet-card-teaser">{ch.teaser}</span>
                </Link>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-white/40">
              Educational only · not legal advice · income and growth examples are not guarantees
            </p>
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section className="relative z-10 border-b border-white/8 py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 md:grid-cols-[1fr_auto_1fr] md:px-8">
          <div className="space-y-8 md:pr-4">
            <div>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4a447]/35 text-[#f0cc75]">
                <Target size={20} />
              </div>
              <div className="text-sm font-bold text-white">Proven Frameworks</div>
              <p className="mt-1 text-xs text-white/50">Battle-tested agency growth strategies</p>
            </div>
            <div>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4a447]/35 text-[#f0cc75]">
                <Settings size={20} />
              </div>
              <div className="text-sm font-bold text-white">Scalable Systems</div>
              <p className="mt-1 text-xs text-white/50">Deliver without burning out</p>
            </div>
          </div>
          <GuideMockup variant="bundle" />
          <div className="space-y-8 md:pl-4">
            <div>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4a447]/35 text-[#f0cc75]">
                <TreePalm size={20} />
              </div>
              <div className="text-sm font-bold text-white">Time & Freedom</div>
              <p className="mt-1 text-xs text-white/50">Build income without sacrificing life</p>
            </div>
            <div className="agc-quote-card rounded-r-xl p-5">
              <Quote size={18} className="text-[#d4a447]/60" />
              <p className="agc-serif mt-3 text-lg italic leading-relaxed text-white/80">
                The agencies that win don&apos;t just work harder. They build smarter.
              </p>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#d4a447]">Strategy Today</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/8 py-8 md:py-10">
        <div className="mx-auto max-w-7xl space-y-3 px-5 md:px-8">
          <details className="lm-seo-depth">
            <summary>
              <span>Benefits of this guide</span>
              <span className="lm-seo-depth-hint">Expand</span>
            </summary>
            <div className="lm-seo-depth-body grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((b) => (
                <BenefitCard key={b.title} {...b} />
              ))}
            </div>
          </details>

          <details className="lm-seo-depth">
            <summary>
              <span>What&apos;s inside</span>
              <span className="lm-seo-depth-hint">Expand</span>
            </summary>
            <div className="lm-seo-depth-body grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
              <div className="grid gap-4 md:grid-cols-2">
                {inside.map((item) => (
                  <InsideCard key={item.title} {...item} />
                ))}
              </div>
              <div className="agc-inside-mockup-panel mx-auto w-full max-w-sm lg:max-w-none">
                <GuideMockup variant="book" />
              </div>
            </div>
          </details>

          <details id="results" className="lm-seo-depth">
            <summary>
              <span>Results &amp; path forward</span>
              <span className="lm-seo-depth-hint">Expand</span>
            </summary>
            <div className="lm-seo-depth-body space-y-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {results.map((r) => (
                  <ResultCard key={r.stat} {...r} />
                ))}
              </div>
              <p className="text-center text-[11px] text-white/40">
                Results vary · not legal advice · income claims are not guarantees
              </p>
              <div className="grid gap-6 md:grid-cols-4">
                {steps.map((step, i) => (
                  <div key={step.n} className="relative text-center">
                    {i < steps.length - 1 && (
                      <ChevronRight
                        className="absolute -right-3 top-5 hidden text-[#d4a447]/40 md:block"
                        size={22}
                      />
                    )}
                    <div className="agc-step-circle agc-serif mx-auto flex items-center justify-center text-lg font-bold text-[#f0cc75]">
                      {step.n}
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-white">{step.title}</h3>
                    <p className="mt-2 text-xs text-white/50">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </div>
      </section>

      {/* Footer CTA */}
      <section id="download" className="relative z-10 px-5 pb-14 md:px-8">
        <div className="agc-footer-cta mx-auto max-w-7xl">
          <div className="agc-footer-cta-bg" style={{ backgroundImage: `url(${FOOTER_CTA_BG})` }} aria-hidden />
          <div className="agc-footer-cta-overlay" aria-hidden />
          <div className="relative z-10 px-6 py-14 text-center md:px-12 md:py-20">
            <h2 className="agc-serif text-3xl font-bold uppercase tracking-[0.04em] md:text-5xl">
              Ready to Build Your Dream Agency?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/68">
              Get the complete guide to building a profitable agency, attracting better partners, and creating the time,
              income, and freedom you deserve. Plus a {LEAD_MAGNET_TRIAL_DAYS}-day Finely Cred portal preview.
            </p>
            <div className="mx-auto mt-8 max-w-xl">
              <PremiumLeadMagnetCaptureForm
                funnelConfig={AGENCY_FUNNEL}
                accentClass="focus:border-[#f0cc75] focus:ring-[#d4a447]/15"
                buttonClass="agc-gold-btn group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-xl border px-7 text-[11px] font-black uppercase tracking-[0.14em] text-[#06101f] shadow-[0_18px_55px_rgba(212,164,71,0.32)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-70"
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-white/42 md:flex-row">
          <FinelyCredLogo size="sm" forceLight />
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="/privacy" className="hover:text-white">Privacy Policy</a>
            <a href="/terms" className="hover:text-white">Terms of Use</a>
            <a href="/disclaimer" className="hover:text-white">Disclaimer</a>
          </div>
          <p>© {new Date().getFullYear()} Finely Cred. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
