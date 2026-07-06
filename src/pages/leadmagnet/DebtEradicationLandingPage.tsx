import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Download,
  Gavel,
  Home,
  Lock,
  Mail,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import { LeadMagnetFunnelHeroVideo } from '../../components/leadmagnet/LeadMagnetFunnelHeroVideo';
import { getLeadMagnetVisualTheme } from '../../components/leadmagnet/leadMagnetVisualThemes';
import { submitLeadCapture } from '../../data/leadsRepo';
import { DEBT_FUNNEL } from '../../domain/leadMagnetFunnels';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { PremiumLeadMagnetCaptureForm } from '../../components/leadmagnet/PremiumLeadMagnetCaptureForm';
import '../../components/leadmagnet/premiumLeadMagnetShared.css';
import './debtEradicationLanding.css';

const DEBT_THEME = getLeadMagnetVisualTheme(DEBT_FUNNEL);

/**
 * Debt eradication lead magnet landing page — premium preview
 * Uses the real e-guide PNG (background removed only). No CSS book recreation.
 */

const GUIDE_MOCKUP_SRC = '/images/lead-magnets/debt-eradication-mockup.png';

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
        'group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-xl border border-[#ffe7a3]/60 bg-[linear-gradient(135deg,#8c5b16_0%,#d7a73f_42%,#ffe7a3_68%,#b8791d_100%)] px-7 text-[12px] font-black uppercase tracking-[0.12em] text-[#06101f] shadow-[0_18px_55px_rgba(215,167,63,0.30),inset_0_1px_0_rgba(255,255,255,0.45)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70',
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
    <div className="inline-flex items-center gap-2 rounded-full border border-[#d7a73f]/35 bg-[#d7a73f]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#f4d273] shadow-[0_0_30px_rgba(215,167,63,0.12)]">
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
        'relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.035] shadow-[0_30px_110px_rgba(0,0,0,0.46)] backdrop-blur-xl',
        glow && 'before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_0%,rgba(215,167,63,0.16),transparent_44%)]',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function TinyProof({ icon: Icon, title, desc }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="lm-proof-pillar rounded-2xl p-5 text-center">
      <div className="lm-proof-pillar-icon mx-auto border border-[#d7a73f]/35 bg-[#d7a73f]/12 text-[#f4d273]">
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
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d7a73f] text-[#05101e] shadow-[0_0_22px_rgba(215,167,63,0.24)]">
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
        'del-mockup-stack',
        tall && 'del-mockup-stack--hero',
        footer && 'del-mockup-stack--footer',
        className,
      )}
    >
      <div className="del-mockup-glow" aria-hidden />
      <img
        src={GUIDE_MOCKUP_SRC}
        alt="Eradicate The Debt. Reclaim Your Future. — free e-guide"
        className={cn('del-mockup', tall && 'del-mockup--hero', footer && 'del-mockup--footer')}
      />
      <div className="del-mockup-pedestal" aria-hidden />
    </div>
  );
}

function ValueStackCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassPanel className="del-value-card p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d7a73f]/45">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d7a73f]">Included free</div>
      <div className="mt-3 text-sm font-semibold leading-snug text-white">{label}</div>
      <div className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#f4d273]">{value} value</div>
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
    <div className="del-discovery-card group relative overflow-hidden rounded-[1.35rem] p-6 text-center transition duration-300 hover:-translate-y-1 hover:border-[#d7a73f]/45">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d7a73f]/70 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="del-discovery-icon mx-auto flex items-center justify-center rounded-full text-[#f4d273]">
        <Icon size={34} />
      </div>
      <h3 className="mt-5 text-[13px] font-black uppercase tracking-[0.1em] text-[#f4d273]">{title}</h3>
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
    <div className="del-testimonial-card relative overflow-hidden rounded-[1.35rem] p-6">
      <div className="flex gap-1 text-[#f4d273]">
        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
      </div>
      <p className="mt-5 pr-16 text-sm leading-relaxed text-white/74">"{quote}"</p>
      <div className="mt-6">
        <div className="font-semibold text-white">- {name}</div>
        <div className="text-xs text-white/48">{role}</div>
      </div>
      <div className="absolute bottom-5 right-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#d7a73f]/55 bg-gradient-to-br from-[#f4d273] to-[#8b5a16] text-[#06101f] shadow-[0_0_30px_rgba(215,167,63,0.22)]">
        <User size={26} />
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
    { icon: BadgeCheck, value: '98%', label: 'Success Rate' },
    { icon: Star, value: '4.9/5', label: 'Average Rating' },
    { icon: Lock, value: '100%', label: 'Free. No Obligation.' },
  ];

  return (
    <main className="del-page min-h-screen overflow-hidden bg-[#020812] text-white selection:bg-[#d7a73f]/30 selection:text-white">
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
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_70%_8%,rgba(215,167,63,0.18),transparent_30%),radial-gradient(circle_at_20%_30%,rgba(28,72,120,0.32),transparent_32%),linear-gradient(180deg,#020812_0%,#041326_42%,#020812_100%)]" />
      <div className="fc-premium-noise pointer-events-none fixed inset-0 z-0 opacity-[0.045]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[420px] bg-gradient-to-b from-[#0b2543]/50 to-transparent" />

      <header className="relative z-20">
        <div className="mx-auto max-w-7xl px-5 py-5 md:px-8" />
      </header>

      <section className="del-hero-section relative z-10 border-b border-[#d7a73f]/25">
        <div className="fc-hero-vignette absolute inset-0 bg-[radial-gradient(circle_at_78%_58%,rgba(215,167,63,0.24),transparent_30%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d7a73f]/75 to-transparent" />
        <div className="del-hero-grid mx-auto grid items-center gap-10 px-5 md:px-8 lg:items-center">
          <div className="del-hero-copy relative z-20 pt-6 lg:pt-14">
            <h1 className="del-hero-title del-serif mt-2 text-white">
              <span className="del-hero-title-line">Annihilate Your Debt. Take Back</span>
              <span className="del-hero-title-line del-hero-title-line--gold">Control. Build Your Future.</span>
            </h1>
            <div className="del-hero-title-rule" aria-hidden />

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl">
              Crush collections, wipe out foreclosures, destroy bankruptcy fear, and rebuild stronger with the ultimate step-by-step system.
            </p>

            <div className="del-hero-form mt-9 max-w-xl rounded-[1.35rem] p-6">
              <h2 className="mb-4 text-xl font-black uppercase tracking-[0.08em] text-white md:text-2xl">
                Get Your <span className="text-[#f4d273]">Free</span> Guide Now
              </h2>
              <PremiumLeadMagnetCaptureForm
                offer="debt_validation_playbook"
                interest="Debt Eradication Guide — Annihilate Your Debt"
                funnelPath={DEBT_FUNNEL.path}
                funnelId="debt_freedom"
                goal="debt"
                guideId="collections-validation-deep-dive"
                accentClass="focus:border-[#f4d273] focus:ring-[#d7a73f]/15"
              />
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <TinyProof icon={Gavel} title="Crush Debt" desc="Eliminate pressure and create a cleaner path forward." />
              <TinyProof icon={ShieldCheck} title="Protect Assets" desc="Safeguard your home, income, and future options." />
              <TinyProof icon={TrendingUp} title="Rebuild Stronger" desc="Create lasting structure after the storm." />
            </div>
          </div>

          <div className="del-hero-mockup-col relative z-10 flex items-end justify-center pb-2 lg:justify-end lg:pb-6">
            <GuideMockup tall className="w-full" />
          </div>
        </div>
      </section>

      <section className="del-video-section relative z-10 border-b border-[#d7a73f]/20">
        <div className="del-video-grid mx-auto grid gap-16 px-5 md:px-8 lg:grid-cols-2 lg:items-center lg:gap-20 xl:gap-32">
          <div className="del-video-column del-video-column--left w-full">
            <VideoPreview onGoForm={scrollToDownload} />
          </div>
          <div className="del-video-column del-video-column--right">
            <SectionKicker>Exclusive video</SectionKicker>
            <h2 className="del-serif mt-5 text-4xl font-black leading-tight tracking-[-0.035em] md:text-6xl">
              See How This System Can <span className="text-[#f4d273]">Change Your Life</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65">
              A short, trust-building video belongs here. Use it to explain the guide, build confidence, and show the visitor that debt pressure is not the end of the story.
            </p>
            <div className="mt-7 grid gap-3">
              <MiniCheck>Stop collection calls and aggressive letters with better documentation.</MiniCheck>
              <MiniCheck>End foreclosure fear by understanding your possible next moves.</MiniCheck>
              <MiniCheck>Avoid bankruptcy traps by knowing the options before you choose.</MiniCheck>
              <MiniCheck>Reduce or eliminate debt pressure with a cleaner plan.</MiniCheck>
              <MiniCheck>Rebuild your credit and protect your future.</MiniCheck>
            </div>
          </div>
        </div>
      </section>

      <section id="free-toolkit" className="relative z-10 border-y border-[#d7a73f]/20 py-18 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mx-auto mb-11 max-w-3xl text-center">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#d7a73f]">Your free debt freedom kit</div>
            <h2 className="mt-3 font-serif text-4xl font-black tracking-[-0.035em] md:text-5xl">
              Everything Included <span className="text-[#f4d273]">At No Cost</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/60">
              Unlock the full validation playbook plus interactive tools, checklists, scripts, and portal preview when you request the guide.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {freeToolkit.map((item) => (
              <ValueStackCard key={item.label} {...item} />
            ))}
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {DEBT_FUNNEL.features.map((feature) => (
              <MiniCheck key={feature.title}>{feature.title}: {feature.desc}</MiniCheck>
            ))}
          </div>
        </div>
      </section>

      <section id="inside-guide" className="relative z-10 py-18 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mx-auto mb-11 max-w-3xl text-center">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#d7a73f]">What you&apos;ll discover inside</div>
            <h2 className="del-serif del-section-title mt-3 text-4xl font-black tracking-[-0.035em] md:text-5xl">
              Your Roadmap to <span className="text-[#f4d273]">Total Debt Eradication</span>
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {discoveries.map((item) => (
              <DiscoveryCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-[#d7a73f]/20 bg-black/18 py-9">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 md:grid-cols-4 md:px-8">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-center gap-4 border-white/10 py-4 md:border-r last:md:border-r-0">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d7a73f]/35 bg-[#d7a73f]/10 text-[#f4d273]">
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
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#d7a73f]">Real people. Real results.</div>
            <h2 className="del-serif del-section-title mt-3 text-4xl font-black tracking-[-0.035em] md:text-5xl">Stories of Freedom and Relief</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
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
        </div>
      </section>

      <section id="download" className="relative z-10 border-t border-[#d7a73f]/25 px-5 pb-12 md:px-8">
        <div className="mx-auto max-w-7xl overflow-visible rounded-[1.65rem] border border-[#d7a73f]/45 bg-gradient-to-r from-[#061326] via-[#071b33] to-[#11100a] shadow-[0_34px_120px_rgba(0,0,0,0.55)]">
          <div className="grid gap-0 overflow-hidden rounded-[1.65rem] lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative flex min-h-[320px] flex-col items-center justify-end overflow-visible p-6 pb-14 md:p-8 md:pb-16">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(215,167,63,0.22),transparent_48%)]" />
              <GuideMockup footer className="relative z-10" />
              <div className="relative z-10 mt-4 w-full max-w-xs rounded-xl border border-[#d7a73f]/35 bg-[#061326]/90 px-4 py-3 text-center backdrop-blur-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d7a73f]">Your roadmap to</div>
                <div className="text-sm font-black uppercase tracking-[0.06em] text-[#f4d273]">Debt freedom starts now.</div>
              </div>
            </div>
            <div className="p-8 md:p-10">
              <h3 className="text-2xl font-black uppercase tracking-[0.07em] text-[#f4d273]">Get Instant Access to Your Free Guide</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/58">Join people who are crushing debt pressure and building a better future.</p>
              <div className="mt-6">
                <PremiumLeadMagnetCaptureForm
                  offer="debt_validation_playbook"
                  interest="Debt Eradication Guide — footer CTA"
                  funnelPath={DEBT_FUNNEL.path}
                  funnelId="debt_freedom"
                  goal="debt"
                  guideId="collections-validation-deep-dive"
                  accentClass="focus:border-[#f4d273] focus:ring-[#d7a73f]/15"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-white/42 md:flex-row">
          <div />
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
