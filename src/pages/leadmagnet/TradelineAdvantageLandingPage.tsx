import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Download,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import { LeadMagnetCobrand, LeadMagnetCobrandFooterMarks } from '../../components/brand/LeadMagnetCobrand';
import { LeadMagnetFunnelHeroVideo } from '../../components/leadmagnet/LeadMagnetFunnelHeroVideo';
import { getLeadMagnetVisualTheme } from '../../components/leadmagnet/leadMagnetVisualThemes';
import { TRADELINE_FUNNEL } from '../../domain/leadMagnetFunnels';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { LEAD_MAGNET_TRIAL_DAYS } from '../../lib/leadMagnetTrial';
import { PremiumLeadMagnetCaptureForm } from '../../components/leadmagnet/PremiumLeadMagnetCaptureForm';
import '../../components/leadmagnet/premiumLeadMagnetShared.css';
import './tradelineAdvantageLanding.css';

const TRADELINE_THEME = getLeadMagnetVisualTheme(TRADELINE_FUNNEL);
const GUIDE_MOCKUP_SRC = '/images/lead-magnets/tradeline-advantage-mockup.png';
const GUIDE_MOCKUP_2X = '/images/lead-magnets/tradeline-advantage-mockup-2x.png';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function GoldButton({
  children,
  className,
  type = 'button',
  disabled = false,
}: {
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-xl border border-[#f5dfa0]/60 bg-[linear-gradient(135deg,#7a5a14_0%,#d4a447_42%,#f0cc75_68%,#a67c1a_100%)] px-7 text-[12px] font-black uppercase tracking-[0.12em] text-[#06101f] shadow-[0_18px_55px_rgba(212,164,71,0.30),inset_0_1px_0_rgba(255,255,255,0.45)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70',
        className,
      )}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition duration-700 group-hover:translate-x-full" />
    </button>
  );
}

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#7b3f8f]/45 bg-[#2a1430]/65 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#f0cc75] shadow-[0_0_30px_rgba(92,45,84,0.2)]">
      <Sparkles size={14} className="text-[#d4a447]" />
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
        'relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.035] shadow-[0_30px_110px_rgba(0,0,0,0.46)] backdrop-blur-xl',
        glow && 'before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_0%,rgba(212,164,71,0.16),transparent_44%)]',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

const PROOF_ACCENTS = [
  'border-[#3db896]/40 bg-[#0d5c4a]/25 text-[#3db896]',
  'border-[#6b8fd4]/40 bg-[#1a3a6e]/30 text-[#8bafe8]',
  'border-[#d4a447]/40 bg-[#d4a447]/10 text-[#f0cc75]',
] as const;

function TinyProof({
  icon: Icon,
  title,
  desc,
  accent = 0,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
  accent?: number;
}) {
  const accents = [
    'border-[#3db896]/40 bg-[#0d5c4a]/30 text-[#3db896]',
    'border-[#6b8fd4]/40 bg-[#1a3a6e]/35 text-[#8bafe8]',
    'border-[#d4a447]/40 bg-[#d4a447]/12 text-[#f0cc75]',
  ];
  return (
    <div className="lm-proof-pillar rounded-2xl p-5 text-center">
      <div className={cn('lm-proof-pillar-icon mx-auto border', accents[accent % accents.length])}>
        <Icon size={24} />
      </div>
      <div className="mt-4 text-sm font-black uppercase tracking-[0.08em] text-white">{title}</div>
      <p className="mt-2 text-xs leading-relaxed text-white/55">{desc}</p>
    </div>
  );
}

function MiniCheck({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm leading-relaxed text-white/72">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4a447] text-[#05101e] shadow-[0_0_22px_rgba(212,164,71,0.24)]">
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
  return (
    <div
      className={cn(
        'tla-mockup-stage',
        tall && 'tla-mockup-stage--hero',
        footer && 'tla-mockup-stage--footer',
        className,
      )}
    >
      <div className="tla-mockup-jewel-left" aria-hidden />
      <div className="tla-mockup-jewel-right" aria-hidden />
      <div className="tla-mockup-gold-frame" aria-hidden />
      <img
        src={GUIDE_MOCKUP_SRC}
        srcSet={`${GUIDE_MOCKUP_SRC} 1x, ${GUIDE_MOCKUP_2X} 2x`}
        width={520}
        height={672}
        decoding="async"
        alt="The Trade Lines Advantage — free e-guide with mobile preview"
        className={cn('tla-mockup', tall && 'tla-mockup--hero', footer && 'tla-mockup--footer')}
      />
      <div className="tla-mockup-floor" aria-hidden />
    </div>
  );
}

function ValueStackCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassPanel className="tla-value-card p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d4a447]/45">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d4a447]">Included free</div>
      <div className="mt-3 text-sm font-semibold leading-snug text-white">{label}</div>
      <div className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#f0cc75]">{value} value</div>
    </GlassPanel>
  );
}

function VideoPreview({ onGoForm }: { onGoForm?: () => void }) {
  return (
    <div className="tla-video-frame w-full">
      <div className="tla-video-inner w-full">
        <LeadMagnetFunnelHeroVideo
          config={TRADELINE_FUNNEL}
          theme={TRADELINE_THEME}
          colorGrade="plum"
          posterUrl="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=90"
          className="w-full rounded-none border-0 shadow-none"
          onGoForm={onGoForm}
        />
      </div>
    </div>
  );
}

const DISCOVERY_ACCENTS = ['emerald', 'sapphire', 'plum', 'gold'] as const;

function DiscoveryCard({
  icon: Icon,
  title,
  desc,
  accent = 'gold',
  className,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
  accent?: (typeof DISCOVERY_ACCENTS)[number];
  className?: string;
}) {
  const titleColor =
    accent === 'emerald'
      ? 'text-[#3db896]'
      : accent === 'sapphire'
        ? 'text-[#8bafe8]'
        : accent === 'plum'
          ? 'text-[#c48fd4]'
          : 'text-[#f0cc75]';

  return (
    <div
      className={cn(
        'tla-discovery-card tla-discovery-card--' + accent,
        'group relative overflow-hidden rounded-[1.35rem] p-6 text-center transition duration-300 hover:-translate-y-1',
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a447]/70 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className={cn('tla-discovery-icon tla-discovery-icon--' + accent, 'mx-auto flex items-center justify-center rounded-full')}>
        <Icon size={34} />
      </div>
      <h3 className={cn('mt-5 text-[13px] font-black uppercase tracking-[0.1em]', titleColor)}>{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/60">{desc}</p>
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
    <div className="tla-testimonial-card relative overflow-hidden rounded-[1.35rem] p-6">
      <div className="flex gap-1 text-[#f0cc75]">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={16} fill="currentColor" />
        ))}
      </div>
      <p className="mt-5 pr-16 text-sm leading-relaxed text-white/74">&ldquo;{quote}&rdquo;</p>
      <div className="mt-6">
        <div className="font-semibold text-white">- {name}</div>
        <div className="text-xs text-white/48">{role}</div>
      </div>
      <div className="absolute bottom-5 right-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#7b3f8f]/55 bg-gradient-to-br from-[#f0cc75] to-[#1a3a6e] text-[#06101f] shadow-[0_0_30px_rgba(92,45,84,0.22)]">
        <User size={26} />
      </div>
    </div>
  );
}

export default function TradelineAdvantageLandingPage() {
  usePublicSeoMeta({
    title: 'The Trade Lines Advantage — Free Strategic Guide',
    description:
      'Master tradelines, strengthen credit positioning, and unlock greater funding with Finely Cred’s premium strategic guide.',
    path: TRADELINE_FUNNEL.path,
  });

  const scrollToDownload = () => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' });
  const freeToolkit = TRADELINE_FUNNEL.valueStack.map((item) => ({ label: item.label, value: item.value }));

  const discoveries = [
    {
      icon: Target,
      title: 'Tradeline Positioning',
      desc: 'Know what actually reports to bureaus and what underwriters scrutinize on your file.',
      accent: 'emerald' as const,
    },
    {
      icon: BarChart3,
      title: 'Reporting Depth',
      desc: 'Use the inquiry budget calculator to sequence applications without unnecessary bureau hits.',
      accent: 'sapphire' as const,
    },
    {
      icon: ShieldCheck,
      title: 'Profile Strength',
      desc: 'Follow the tradeline timing ladder so additions support — not sabotage — your restore plan.',
      accent: 'plum' as const,
    },
    {
      icon: TrendingUp,
      title: 'Funding Readiness',
      desc: 'Education framed for real fit, timing, and alternatives — no outcome guarantees or hype.',
      accent: 'gold' as const,
    },
  ];

  const stats = [
    { icon: Download, value: '9,500+', label: 'Guides Downloaded' },
    { icon: BadgeCheck, value: '98%', label: 'Found It Actionable' },
    { icon: Star, value: '4.9/5', label: 'Average Rating' },
    { icon: Lock, value: '100%', label: 'Free. No Obligation.' },
  ];

  return (
    <main className="tla-page min-h-screen overflow-hidden bg-[#0e0614] text-white selection:bg-[#7b3f8f]/35 selection:text-white">
      <style>{`
        .fc-premium-noise {
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,.13) 1px, transparent 0);
          background-size: 22px 22px;
        }
        .fc-hero-vignette {
          mask-image: radial-gradient(circle at 58% 38%, black 0%, black 58%, transparent 100%);
          -webkit-mask-image: radial-gradient(circle at 58% 38%, black 0%, black 58%, transparent 100%);
        }
      `}</style>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_72%_6%,rgba(212,164,71,0.14),transparent_28%),radial-gradient(circle_at_12%_22%,rgba(92,45,84,0.32),transparent_34%),radial-gradient(circle_at_88%_48%,rgba(26,58,110,0.26),transparent_30%),radial-gradient(circle_at_42%_88%,rgba(13,92,74,0.18),transparent_28%),linear-gradient(180deg,#0e0614_0%,#1a0f24_45%,#0e0614_100%)]" />
      <div className="fc-premium-noise pointer-events-none fixed inset-0 z-0 opacity-[0.04]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[420px] bg-gradient-to-b from-[#2a1430]/55 to-transparent" />

      <header className="relative z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 md:px-8">
          <LeadMagnetCobrand size="sm" />
        </div>
      </header>

      <section className="tla-hero-section relative z-10 border-b border-[#5c2d54]/40">
        <div className="fc-hero-vignette absolute inset-0 bg-[radial-gradient(circle_at_22%_55%,rgba(212,164,71,0.16),transparent_28%),radial-gradient(circle_at_18%_62%,rgba(92,45,84,0.22),transparent_30%),radial-gradient(circle_at_30%_70%,rgba(26,58,110,0.14),transparent_26%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4a447]/60 via-[#7b3f8f]/50 to-transparent" />
        <div className="tla-hero-grid mx-auto grid items-center gap-10 px-5 md:px-8 lg:items-center">
          <div className="tla-hero-mockup-col relative z-10 order-2 flex items-center justify-center lg:order-1 lg:justify-start">
            <GuideMockup tall className="w-full" />
          </div>

          <div className="tla-hero-copy relative z-20 order-1 pt-6 lg:order-2 lg:pt-14">
            <h1 className="tla-hero-title tla-serif mt-2 text-white">
              <span className="tla-hero-title-line tla-hero-title-line--emerald">The Trade Lines</span>
              <span className="tla-hero-title-line tla-hero-title-line--gold">Advantage</span>
            </h1>
            <div className="tla-hero-title-rule" aria-hidden />

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl">
              Primary vs authorized-user tradelines, inquiry discipline, and timing — explained without hype. Plus
              calculators and a {LEAD_MAGNET_TRIAL_DAYS}-day Finely Cred portal preview to plan your next move.
            </p>

            <div className="tla-hero-form mt-9 max-w-xl rounded-[1.35rem] p-6">
              <h2 className="mb-4 text-xl font-black uppercase tracking-[0.08em] text-white md:text-2xl">
                Get Your <span className="text-[#f0cc75]">Free</span> Guide Now
              </h2>
              <PremiumLeadMagnetCaptureForm
                funnelConfig={TRADELINE_FUNNEL}
                accentClass="focus:border-[#f0cc75] focus:ring-[#d4a447]/15"
              />
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <TinyProof icon={Target} title="Position" desc="Know what reports and what underwriters see." accent={0} />
              <TinyProof icon={BarChart3} title="Sequence" desc="Apply without unnecessary bureau damage." accent={1} />
              <TinyProof icon={TrendingUp} title="Fund" desc="Frame tradelines inside a broader restore plan." accent={2} />
            </div>
          </div>
        </div>
      </section>

      <section className="tla-video-section relative z-10 border-b border-[#5c2d54]/35">
        <div className="tla-video-grid mx-auto grid gap-16 px-5 md:px-8 lg:grid-cols-2 lg:items-center lg:gap-20 xl:gap-32">
          <div className="tla-video-column tla-video-column--right order-1 w-full lg:order-2">
            <VideoPreview onGoForm={scrollToDownload} />
          </div>
          <div className="tla-video-column tla-video-column--left order-2 lg:order-1">
            <SectionKicker>Exclusive video</SectionKicker>
            <h2 className="tla-serif mt-5 text-4xl font-black leading-tight tracking-[-0.035em] md:text-6xl">
              See How Strategic Tradelines Fit a{' '}
              <span className="text-[#8bafe8]">Broader Restore Plan</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65">
              Riley walks through when tradelines help, when they hurt, and how Finely Cred partners sequence them inside
              the restoration workspace.
            </p>
            <div className="mt-7 grid gap-3">
              {TRADELINE_FUNNEL.features.map((feature) => (
                <MiniCheck key={feature.title}>
                  {feature.title}: {feature.desc}
                </MiniCheck>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="free-toolkit" className="relative z-10 border-y border-[#5c2d54]/35 bg-[#120818]/40 py-18 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mx-auto mb-11 max-w-3xl text-center">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#d4a447]">
              Your complete tradeline education system
            </div>
            <h2 className="tla-serif mt-3 text-4xl font-black tracking-[-0.035em] md:text-5xl">
              Everything Included <span className="text-[#f0cc75]">At No Cost</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/60">
              Unlock the full insider PDF plus inquiry calculators, timing tools, and a {LEAD_MAGNET_TRIAL_DAYS}-day
              portal preview when you request the guide.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {freeToolkit.map((item) => (
              <ValueStackCard key={item.label} {...item} />
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
            {TRADELINE_FUNNEL.trustCerts.map((cert) => (
              <span key={cert} className="inline-flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#d4a447]" />
                {cert}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="inside-guide" className="relative z-10 py-18 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mx-auto mb-11 max-w-3xl text-center">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#d4a447]">
              What you&apos;ll discover inside
            </div>
            <h2 className="tla-serif tla-section-title mt-3 text-4xl font-black tracking-[-0.035em] md:text-5xl">
              What You&apos;ll <span className="text-[#c48fd4]">Master</span>
            </h2>
          </div>
          <div className="tla-bento-grid grid gap-4 md:grid-cols-6">
            {discoveries.map((item, i) => (
              <DiscoveryCard
                key={item.title}
                {...item}
                className={cn(i === 0 && 'md:col-span-3', i === 1 && 'md:col-span-3', i === 2 && 'md:col-span-2', i === 3 && 'md:col-span-4')}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-[#5c2d54]/35 bg-[#1a0f24]/50 py-9">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 md:grid-cols-4 md:px-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center justify-center gap-4 border-white/10 py-4 md:border-r last:md:border-r-0"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d4a447]/35 bg-[#d4a447]/10 text-[#f0cc75]">
                <stat.icon size={27} />
              </div>
              <div>
                <div className="text-3xl font-semibold tracking-[-0.04em] text-white">{stat.value}</div>
                <div className="text-xs text-white/50">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="results" className="relative z-10 py-18 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-10 text-center">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#d4a447]">
              Real people. Real clarity.
            </div>
            <h2 className="tla-serif tla-section-title mt-3 text-4xl font-black tracking-[-0.035em] md:text-5xl">
              Stories of Smarter Tradeline Decisions
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Testimonial
              name="Andre W."
              role="Real Estate Investor"
              quote="I finally understood AU vs primary before spending a dollar. The timing ladder alone saved me from a bad move."
            />
            <Testimonial
              name="Priya S."
              role="Small Business Owner"
              quote="No hype, no guarantees — just a wealthy, structured education on where tradelines actually fit."
            />
            <Testimonial
              name="Kevin L."
              role="Credit Restoration Client"
              quote="The portal preview let me model inquiry budget and track restore tasks in one place. This felt premium."
            />
          </div>
        </div>
      </section>

      <section id="download" className="relative z-10 border-t border-[#5c2d54]/40 px-5 pb-12 md:px-8">
        <div className="tla-download-panel mx-auto max-w-7xl overflow-visible rounded-[1.65rem]">
          <div className="grid gap-0 overflow-hidden rounded-[1.65rem] lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative flex min-h-[280px] flex-col items-center justify-center overflow-visible p-6 md:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(13,92,74,0.18),transparent_42%),radial-gradient(circle_at_75%_55%,rgba(92,45,84,0.2),transparent_40%)]" />
              <GuideMockup footer className="relative z-10 w-full" />
            </div>
            <div className="p-8 md:p-10">
              <h3 className="text-2xl font-black uppercase tracking-[0.07em] text-[#f0cc75]">
                Get Instant Access to Your Free Guide
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/58">
                Understand tradelines with structure — then decide if they belong in your plan.
              </p>
              <div className="mt-6">
                <PremiumLeadMagnetCaptureForm
                  funnelConfig={TRADELINE_FUNNEL}
                  accentClass="focus:border-[#f0cc75] focus:ring-[#d4a447]/15"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-xs text-white/42 md:flex-row">
          <LeadMagnetCobrandFooterMarks />
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="/privacy" className="hover:text-white">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-white">
              Terms of Use
            </a>
            <a href="/disclaimer" className="hover:text-white">
              Disclaimer
            </a>
          </div>
          <p>© {new Date().getFullYear()} Finely Cred · NCG. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
