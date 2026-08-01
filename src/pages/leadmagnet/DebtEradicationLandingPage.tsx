import React from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  BookOpen,
  Calendar,
  CheckCircle2,
  Download,
  Gavel,
  Home,
  Lock,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  User,
} from 'lucide-react';
import { LeadMagnetCobrandFooterMarks } from '../../components/brand/LeadMagnetCobrand';
import { LeadMagnetFunnelHeroVideo } from '../../components/leadmagnet/LeadMagnetFunnelHeroVideo';
import { getLeadMagnetVisualTheme } from '../../components/leadmagnet/leadMagnetVisualThemes';
import { DEBT_FUNNEL } from '../../domain/leadMagnetFunnels';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { PremiumLeadMagnetCaptureForm } from '../../components/leadmagnet/PremiumLeadMagnetCaptureForm';
import { LandingTypewriterTitle } from '../../components/landing/LandingTypewriterTitle';
import { DEBT_GUIDE_CHAPTERS, DEBT_GUIDE_META, DEBT_GUIDE_READ_PATH } from './debtEradicationGuideContent';
import '../../components/leadmagnet/premiumLeadMagnetShared.css';
import '../../components/leadmagnet/leadMagnetLuxuryStage.css';
import './debtEradicationLanding.css';

const DEBT_THEME = getLeadMagnetVisualTheme(DEBT_FUNNEL);

/**
 * Debt eradication lead magnet landing page — premium preview
 * Uses the real e-guide PNG (background removed only). No CSS book recreation.
 * Desktop hero: mockup LEFT / copy+form RIGHT (inverted vs BC mockup-right).
 */

/** Approved center-standup assets (landscape) — do not regenerate */
/** Hero: solo e-guide book · Bottom: group standup with materials */
const GUIDE_MOCKUP_HERO_SRC = '/images/lead-magnets/debt-eradication-mockup.png';
const GUIDE_MOCKUP_FOOTER_SRC = '/images/lead-magnets/debt-eradication-standup.png';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#e0b24a]/40 bg-[#e0b24a]/12 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#ffd993] shadow-[0_0_30px_rgba(224, 178, 74,0.14)]">
      <Sparkles size={14} />
      {children}
    </div>
  );
}

function GlassPanel({
  children,
  className,
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.035] shadow-[0_30px_110px_rgba(0,0,0,0.46)] backdrop-blur-xl',
        glow && 'before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_0%,rgba(224, 178, 74,0.16),transparent_44%)]',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function MiniCheck({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm leading-relaxed text-white/72">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e0b24a] text-[#040a36] shadow-[0_0_22px_rgba(224, 178, 74,0.24)]">
        <CheckCircle2 size={13} strokeWidth={3} />
      </span>
      <span>{children}</span>
    </div>
  );
}

function GuideMockup({
  className,
  tall,
  footer,
}: {
  className?: string;
  tall?: boolean;
  footer?: boolean;
}) {
  const src = footer ? GUIDE_MOCKUP_FOOTER_SRC : GUIDE_MOCKUP_HERO_SRC;
  return (
    <div
      className={cn(
        'del-mockup-stack',
        tall && 'del-mockup-stack--hero',
        footer && 'del-mockup-stack--footer',
        className,
      )}
    >
      {tall ? <div className="del-hero-stage-halo" aria-hidden /> : null}
      {tall ? <div className="del-hero-gold-backlight" aria-hidden /> : null}
      <div className="del-mockup-glow" aria-hidden />
      <img
        src={src}
        alt="The Ultimate Debt Freedom Guide — free e-guide from Finely Cred"
        className={cn(
          'del-mockup',
          tall && 'del-mockup--hero lm-lux-float--soft',
          footer && 'del-mockup--footer',
        )}
      />
      <div className="del-mockup-pedestal" aria-hidden />
      {tall ? <div className="del-hero-stage-ring" aria-hidden /> : null}
    </div>
  );
}

function ValueStackCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassPanel className="del-value-card p-4 transition duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e0b24a]">Included free</div>
          <div className="mt-2 text-sm font-semibold leading-snug text-white">{label}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-black tracking-[-0.03em] text-[#ffd993]">{value}</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">value</div>
        </div>
      </div>
    </GlassPanel>
  );
}

function VideoPreview({ onGoForm }: { onGoForm?: () => void }) {
  return (
    <div className="del-video-frame w-full">
      <div className="del-video-inner w-full">
        <LeadMagnetFunnelHeroVideo
          config={DEBT_FUNNEL}
          theme={DEBT_THEME}
          colorGrade="navy"
          posterUrl="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1600&q=90"
          className="w-full rounded-none border-0 shadow-none"
          onGoForm={onGoForm}
        />
      </div>
    </div>
  );
}

function DiscoveryCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="del-discovery-card group relative overflow-hidden rounded-[1.35rem] p-5 text-center transition duration-300 hover:-translate-y-1 hover:border-[#e0b24a]/5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e0b24a]/70 to-transparent opacity-60 transition group-hover:opacity-100" />
      <div className="del-discovery-icon mx-auto flex items-center justify-center rounded-full text-[#ffd993]">
        <Icon size={30} />
      </div>
      <h3 className="mt-4 text-[12px] font-black uppercase tracking-[0.12em] text-[#ffd993]">{title}</h3>
      <p className="mt-2.5 text-[13px] leading-relaxed text-white/58">{desc}</p>
    </div>
  );
}

function Testimonial({
  name,
  role,
  quote,
}: {
  name: string;
  role: string;
  quote: string;
}) {
  return (
    <div className="del-testimonial-card relative overflow-hidden rounded-[1.35rem] p-5">
      <div className="flex gap-1 text-[#ffd993]">
        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={15} fill="currentColor" />)}
      </div>
      <p className="mt-4 pr-14 text-sm leading-relaxed text-white/74">"{quote}"</p>
      <div className="mt-5">
        <div className="font-semibold text-white">— {name}</div>
        <div className="text-xs text-white/48">{role}</div>
      </div>
      <div className="absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#e0b24a]/55 bg-gradient-to-br from-[#ffd993] to-[#c4803d] text-[#040a36] shadow-[0_0_30px_rgba(224, 178, 74,0.22)]">
        <User size={22} />
      </div>
    </div>
  );
}

export default function DebtEradicationLandingPage() {
  usePublicSeoMeta({
    title: 'Annihilate Your Debt — Free Eradication Guide',
    description:
      'Crush collections, navigate summons, reduce foreclosure pressure, and rebuild stronger with the free debt eradication guide from Finely Cred.',
    path: DEBT_FUNNEL.path,
  });

  const scrollToDownload = () => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' });

  const freeToolkit = DEBT_FUNNEL.valueStack.map((item) => ({ label: item.label, value: item.value }));

  const discoveries = [
    {
      icon: Gavel,
      title: 'Crush Collections',
      desc: 'Stop creditor harassment, collection pressure, and chaos with a clearer response plan.',
    },
    {
      icon: Home,
      title: 'Wipe Out Foreclosures',
      desc: 'Understand the pressure points and learn the next moves to protect your home where possible.',
    },
    {
      icon: Scale,
      title: 'Destroy Bankruptcy',
      desc: 'Learn your options, avoid panic decisions, and move with structure instead of fear.',
    },
    {
      icon: ShieldCheck,
      title: 'Protect Your Assets',
      desc: 'Keep what matters in view: home, income, peace of mind, and future opportunity.',
    },
    {
      icon: TrendingUp,
      title: 'Rebuild Stronger',
      desc: 'Build credit, wealth, and a better financial future after the storm.',
    },
  ];

  const stats = [
    { icon: Download, value: '15,000+', label: 'Guides Downloaded' },
    { icon: BadgeCheck, value: '98%', label: 'Partner Success Rate' },
    { icon: Star, value: '4.9/5', label: 'Average Rating' },
    { icon: Lock, value: '100%', label: 'Free. No Obligation.' },
  ];

  return (
    <main className="del-page lm-lux-theme--navy min-h-screen overflow-hidden bg-[#000c3c] text-white selection:bg-[#e0b24a]/30 selection:text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_28%_12%,rgba(224, 178, 74,0.2),transparent_28%),radial-gradient(circle_at_78%_28%,rgba(12, 24, 80,0.3),transparent_32%),linear-gradient(180deg,#000c3c_0%,#060c2f_42%,#000c3c_100%)]" />
      <div className="lm-lux-grain lm-lux-grain--fixed pointer-events-none" aria-hidden />
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[420px] bg-gradient-to-b from-[#060c2f]/55 to-transparent" />

      {/* Hero — white field · title dark blue + gold · e-guide left | form right */}
      <section className="del-hero-section del-hero-section--ivory relative z-10 border-b border-[#e0b24a]/30 pt-20 md:pt-24">
        <div className="pointer-events-none absolute left-[8%] top-[18%] h-[380px] w-[380px] rounded-full bg-[#e0b24a]/12 blur-[110px]" />
        <div className="pointer-events-none absolute right-[10%] top-[22%] h-[320px] w-[320px] rounded-full bg-[#000c3c]/06 blur-[100px]" />
        <div className="absolute bottom-0 left-0 right-0 lm-lux-rule" />
        <div className="del-hero-grid relative z-[2] mx-auto grid max-w-[94rem] items-start gap-10 px-5 md:px-8 lg:gap-12 xl:gap-14">
          {/* Title sits directly above the e-guide in the same column */}
          <div className="del-hero-product-col relative z-10 flex min-w-0 flex-col items-center">
            <div className="del-hero-titleblock text-center">
              <p className="del-hero-kicker text-[11px] font-black uppercase tracking-[0.22em] text-[#c4803d]">Free debt response guide</p>
              <h1 className="del-hero-title del-serif lm-lux-display mt-3 md:mt-4">
                <LandingTypewriterTitle
                  as="span"
                  text="Annihilate Your Debt."
                  className="del-hero-title-line del-hero-title-line--navy block"
                  speedMs={40}
                  delayMs={120}
                  caret
                />
                <LandingTypewriterTitle
                  as="span"
                  text="Take Back Control."
                  className="del-hero-title-line del-hero-title-line--gold block"
                  speedMs={42}
                  delayMs={980}
                  caret
                />
              </h1>
              <div className="del-hero-title-rule lm-lux-rule--draw mx-auto" aria-hidden />
              <p className="del-hero-lede mx-auto mt-5 max-w-xl md:mt-6">
                Crush collections, wipe out foreclosure fear, and rebuild stronger — step by step.
              </p>
            </div>

            <div className="del-hero-stage relative flex w-full items-end justify-center">
              <GuideMockup tall className="w-full max-w-none" />
            </div>
          </div>

          <div className="del-hero-copy relative z-20">
            <div className="del-hero-form lm-lux-panel max-w-md rounded-[1.35rem] p-5 md:p-6 lg:ml-auto">
              <h2 className="mb-3 text-lg font-black uppercase tracking-[0.08em] text-white md:text-xl">
                Get Your <span className="text-[#ffd993]">Free</span> Guide Now
              </h2>
              <PremiumLeadMagnetCaptureForm
                funnelConfig={DEBT_FUNNEL}
                accentClass="focus:border-[#ffd993] focus:ring-[#e0b24a]/15"
              />
              <p className="del-compliance mt-3">
                Results vary · not legal advice · educational guide only
              </p>
              <Link
                to={DEBT_GUIDE_READ_PATH}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#e0b24a]/45 bg-[#e0b24a]/10 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#ffd993] transition hover:border-[#ffd993]/70 hover:bg-[#e0b24a]/16"
              >
                <BookOpen size={14} /> Read all {DEBT_GUIDE_CHAPTERS.length} chapters free — no signup
              </Link>
              <Link to={DEBT_FUNNEL.bookingPath ?? '/enlightenment-session'} className="lm-secondary-book-link">
                <Calendar size={14} /> Book a session
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="del-video-section relative z-10 border-b border-[#e0b24a]/20">
        <div className="del-video-grid mx-auto grid gap-14 px-5 md:px-8 lg:grid-cols-2 lg:items-center lg:gap-20 xl:gap-32">
          <div className="del-video-column del-video-column--left w-full">
            <VideoPreview onGoForm={scrollToDownload} />
          </div>
          <div className="del-video-column del-video-column--right">
            <SectionKicker>Exclusive video</SectionKicker>
            <LandingTypewriterTitle
              as="h2"
              text="See How This System Can Change Your Life"
              className="del-serif mt-5 text-4xl font-black leading-[1.08] tracking-[-0.035em] md:text-5xl xl:text-6xl"
              highlight="Change Your Life"
              highlightClassName="text-[#ffd993]"
              speedMs={34}
              delayMs={200}
            />
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65">
              A short, trust-building overview of the guide — so you know debt pressure is not the end of the story.
            </p>
            <div className="mt-7 grid gap-3">
              <MiniCheck>Stop collection calls and aggressive letters with better documentation.</MiniCheck>
              <MiniCheck>End foreclosure fear by understanding your possible next moves.</MiniCheck>
              <MiniCheck>Avoid bankruptcy traps by knowing the options before you choose.</MiniCheck>
              <MiniCheck>Reduce or eliminate debt pressure with a cleaner plan.</MiniCheck>
              <MiniCheck>Rebuild your credit and protect your future.</MiniCheck>
            </div>
            <button
              type="button"
              onClick={scrollToDownload}
              className="group relative mt-8 inline-flex h-12 items-center justify-center overflow-hidden rounded-xl border border-[#ffe7b0]/55 bg-[linear-gradient(135deg,#c4803d_0%,#e0b24a_42%,#ffe7b0_68%,#d19d45_100%)] px-7 text-[11px] font-black uppercase tracking-[0.12em] text-[#040a36] shadow-[0_16px_48px_rgba(224, 178, 74,0.28)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110"
            >
              <span className="relative z-10">Get the free guide</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition duration-700 group-hover:translate-x-full" />
            </button>
          </div>
        </div>
      </section>

      {/* Chapter index — the manual is readable in-app before any signup */}
      <section id="read-online" className="relative z-10 border-b border-[#e0b24a]/20 py-9 md:py-12">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <SectionKicker>Read it now · no signup</SectionKicker>
              <h2 className="del-serif del-section-title mt-4 text-3xl font-black tracking-[-0.035em] md:text-4xl">
                {DEBT_GUIDE_META.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/62">
                {DEBT_GUIDE_CHAPTERS.length} chapters, start to finish, in the browser. Triage, chain of title,
                validation leverage, evidence discipline, summons education, settlement math, and the rebuild.
              </p>
            </div>
            <Link
              to={DEBT_GUIDE_READ_PATH}
              className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#ffe7b0]/55 bg-[linear-gradient(135deg,#c4803d_0%,#e0b24a_42%,#ffe7b0_68%,#d19d45_100%)] px-6 text-[11px] font-black uppercase tracking-[0.12em] text-[#040a36] shadow-[0_16px_48px_rgba(224,178,74,0.28)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              <BookOpen size={15} /> Open Chapter I
            </Link>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {DEBT_GUIDE_CHAPTERS.map((ch) => (
              <Link
                key={ch.id}
                to={`${DEBT_GUIDE_READ_PATH}?chapter=${ch.id}`}
                className="del-discovery-card group flex items-start gap-3.5 rounded-[1.1rem] p-4 text-left transition duration-300 hover:-translate-y-1"
              >
                <span className="del-serif mt-0.5 shrink-0 text-2xl leading-none text-[#ffd993]">{ch.number}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold leading-snug text-white">{ch.title}</span>
                  <span className="mt-1 block text-[12.5px] leading-relaxed text-white/55">{ch.teaser}</span>
                  <span className="mt-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-[#c4803d]">
                    {ch.readMinutes} min · {ch.kicker}
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <p className="del-compliance mt-4">{DEBT_GUIDE_META.compliance}</p>
        </div>
      </section>

      <section id="free-toolkit" className="del-band del-band--toolkit relative z-10 border-y border-[#e0b24a]/20 py-8 md:py-10">
        <div className="mx-auto max-w-7xl px-5 md:px-8 space-y-3">
          <details className="lm-seo-depth">
            <summary>
              <span>Your free debt freedom kit</span>
              <span className="lm-seo-depth-hint">Expand</span>
            </summary>
            <div className="lm-seo-depth-body">
              <div className="mx-auto mb-6 max-w-3xl text-center">
                <h2 className="del-serif text-3xl font-black tracking-[-0.035em] md:text-4xl">
                  Everything Included <span className="text-[#ffd993]">At No Cost</span>
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  Unlock the full validation playbook plus interactive tools, checklists, scripts, and portal preview when you request the guide.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {freeToolkit.map((item) => (
                  <ValueStackCard key={item.label} {...item} />
                ))}
              </div>
              <div className="mt-6 grid gap-2.5 md:grid-cols-2">
                {DEBT_FUNNEL.features.map((feature) => (
                  <MiniCheck key={feature.title}>{feature.title}: {feature.desc}</MiniCheck>
                ))}
              </div>
            </div>
          </details>

          <details id="inside-guide" className="lm-seo-depth">
            <summary>
              <span>What you&apos;ll discover inside</span>
              <span className="lm-seo-depth-hint">Expand</span>
            </summary>
            <div className="lm-seo-depth-body">
              <div className="mx-auto mb-6 max-w-3xl text-center">
                <h2 className="del-serif del-section-title text-3xl font-black tracking-[-0.035em] md:text-4xl">
                  Your Roadmap to <span className="text-[#ffd993]">Total Debt Eradication</span>
                </h2>
              </div>
              <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-5">
                {discoveries.map((item) => (
                  <DiscoveryCard key={item.title} {...item} />
                ))}
              </div>
            </div>
          </details>
        </div>
      </section>

      <section className="del-stats-strip relative z-10 border-y border-[#e0b24a]/20 py-8">
        <div className="mx-auto grid max-w-7xl gap-3 px-5 md:grid-cols-4 md:px-8">
          {stats.map((stat) => (
            <div key={stat.label} className="del-stat-tile flex items-center gap-3.5">
              <div className="del-stat-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#e0b24a]/4 bg-[#e0b24a]/12 text-[#ffd993]">
                <stat.icon size={22} />
              </div>
              <div>
                <div className="text-2xl font-semibold tracking-[-0.04em] text-white md:text-3xl">{stat.value}</div>
                <div className="text-[11px] text-white/50">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="del-compliance mx-auto mt-4 max-w-7xl px-5 text-center md:px-8">
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </section>

      <section id="results" className="del-band del-band--results relative z-10 py-8 md:py-10">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <details className="lm-seo-depth">
            <summary>
              <span>Partner stories</span>
              <span className="lm-seo-depth-hint">Expand</span>
            </summary>
            <div className="lm-seo-depth-body">
              <div className="mb-6 text-center">
                <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#e0b24a]">Real partners. Real results.</div>
                <h2 className="del-serif del-section-title mt-3 text-3xl font-black tracking-[-0.035em] md:text-4xl">
                  Stories of Freedom and Relief
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Testimonial
                  name="Jessica M."
                  role="Debt Free and Thriving"
                  quote="This guide changed my life. I stopped the calls, saved my home, and finally had a plan I could follow."
                />
                <Testimonial
                  name="Mark T."
                  role="Small Business Owner"
                  quote="The strategies are powerful and simple to follow. I wish I found this much sooner."
                />
                <Testimonial
                  name="Sarah L."
                  role="Homeowner"
                  quote="I was drowning in debt and stress. Now I have peace of mind and a clear plan for my future."
                />
              </div>
              <p className="del-compliance mx-auto mt-5 max-w-2xl text-center">
                Individual results vary · stories for illustration · not legal advice
              </p>
            </div>
          </details>
        </div>
      </section>

      <section id="download" className="relative z-10 border-t border-[#e0b24a]/25 px-5 pb-12 pt-2 md:px-8">
        <div className="del-cta-panel mx-auto max-w-7xl overflow-visible rounded-[1.65rem]">
          <div className="relative z-10 grid gap-0 overflow-hidden rounded-[1.65rem] lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative flex min-h-[300px] flex-col items-center justify-end overflow-visible p-6 pb-12 md:p-8 md:pb-14">
              <GuideMockup footer className="relative z-10" />
              <div className="del-cta-caption relative z-10 mt-4 w-full max-w-xs rounded-xl px-4 py-3 text-center backdrop-blur-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#c4803d]">Your roadmap to</div>
                <div className="text-sm font-black uppercase tracking-[0.06em] text-[#1a1408]">Debt freedom starts now.</div>
              </div>
            </div>
            <div className="relative z-10 p-7 md:p-10">
              <h3 className="del-cta-title del-serif text-2xl font-black tracking-[-0.02em] md:text-3xl">
                Get Instant Access to Your Free Guide
              </h3>
              <p className="del-cta-lede mt-2 max-w-2xl text-sm leading-relaxed">
                Join partners who are crushing debt pressure and building a better future.
              </p>
              <div className="mt-6">
                <PremiumLeadMagnetCaptureForm
                  funnelConfig={DEBT_FUNNEL}
                  accentClass="focus:border-[#c4803d] focus:ring-[#e0b24a]/20"
                />
              </div>
              <p className="del-compliance mt-3">
                Results vary · not legal advice · educational guide only
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="del-footer relative z-10 px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-xs text-white/42 md:flex-row">
          <LeadMagnetCobrandFooterMarks />
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Use</a>
            <a href="/disclaimer">Disclaimer</a>
          </div>
          <p>© {new Date().getFullYear()} Finely Cred · NCG. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
