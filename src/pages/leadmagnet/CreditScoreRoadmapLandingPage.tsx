import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
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
import { LeadMagnetFunnelHeroVideo } from '../../components/leadmagnet/LeadMagnetFunnelHeroVideo';
import { getLeadMagnetVisualTheme } from '../../components/leadmagnet/leadMagnetVisualThemes';
import { submitLeadCapture } from '../../data/leadsRepo';
import { SCORE_ROADMAP_FUNNEL } from '../../domain/leadMagnetFunnels';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { LEAD_MAGNET_TRIAL_DAYS } from '../../lib/leadMagnetTrial';
import './creditScoreRoadmapLanding.css';

const SCORE_THEME = getLeadMagnetVisualTheme(SCORE_ROADMAP_FUNNEL);
const GUIDE_MOCKUP_SRC = '/images/lead-magnets/score-boost-72-guide-source.png';

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

function TinyProof({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#3db896]/35 bg-[#2d8a67]/15 text-[#3db896]">
        <Icon size={22} />
      </div>
      <div>
        <div className="text-sm font-black uppercase tracking-[0.08em] text-white">{title}</div>
        <p className="mt-1 max-w-[210px] text-xs leading-relaxed text-white/55">{desc}</p>
      </div>
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

function InputShell({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <label className="relative block">
      <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#d7a73f]/75" size={16} />
      {children}
    </label>
  );
}

function LeadCaptureForm({ compact = false, hero = false }: { compact?: boolean; hero?: boolean }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const emailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!emailOk) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setStatus('sending');
    try {
      const result = await submitLeadCapture({
        source: 'lead_magnet',
        offer: 'score_roadmap',
        interest:
          'Boost Your Credit Score in 72 Hours — quick-win actions, profile optimization, funding readiness',
        fullName: 'Credit Score Roadmap Lead',
        email: email.trim(),
        phone: '',
        consentToContact: true,
        consentEmailMarketing: true,
        consentSmsMarketing: false,
        funnelPath: SCORE_ROADMAP_FUNNEL.path,
        funnelId: SCORE_ROADMAP_FUNNEL.funnelId,
        goal: 'credit',
        guideId: SCORE_ROADMAP_FUNNEL.guideId,
      });
      setStatus('sent');
      setMessage(
        result?.remote === 'ok'
          ? 'You are in. Your free guide request was received.'
          : 'You are in. The request was captured. Connect Supabase/CRM for live delivery.',
      );
      setEmail('');
    } catch (err: unknown) {
      setStatus('error');
      setMessage((err as Error)?.message || 'Something went wrong. Please try again.');
    }
  }

  if (compact || hero) {
    return (
      <form onSubmit={onSubmit} className={cn('grid gap-3', !hero && 'md:grid-cols-[1fr_220px]')}>
        <InputShell icon={Mail}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="h-14 w-full rounded-xl border border-white/12 bg-white/[0.93] pl-11 pr-4 text-sm text-[#06101f] outline-none ring-0 transition placeholder:text-slate-500 focus:border-[#f4d273] focus:ring-4 focus:ring-[#d7a73f]/15"
            maxLength={180}
            required
          />
        </InputShell>
        <GoldButton type="submit" disabled={status === 'sending'} className="w-full">
          {status === 'sending' ? 'Sending...' : 'Get My Free Guide'} <ArrowRight size={16} />
        </GoldButton>
        {hero && (
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">
            <span className="inline-flex items-center gap-1.5">
              <Lock size={13} className="text-[#d7a73f]" /> 100% free
            </span>
            <span className="h-1 w-1 rounded-full bg-[#d7a73f]" />
            <span>No spam</span>
            <span className="h-1 w-1 rounded-full bg-[#d7a73f]" />
            <span>Instant access</span>
          </div>
        )}
        {message && (
          <div
            className={cn(
              !hero && 'md:col-span-2',
              'rounded-xl border px-4 py-3 text-sm',
              status === 'sent'
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
                : 'border-amber-400/30 bg-amber-400/10 text-amber-100',
            )}
          >
            {message}
          </div>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <InputShell icon={Mail}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          className="h-14 w-full rounded-xl border border-white/12 bg-white/[0.93] pl-11 pr-4 text-sm text-[#06101f] outline-none ring-0 transition placeholder:text-slate-500 focus:border-[#f4d273] focus:ring-4 focus:ring-[#d7a73f]/15"
          maxLength={180}
          required
        />
      </InputShell>
      <GoldButton type="submit" disabled={status === 'sending'} className="w-full">
        {status === 'sending' ? 'Sending...' : 'Get My Free Guide'} <ArrowRight size={16} />
      </GoldButton>
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">
        <span className="inline-flex items-center gap-1.5">
          <Lock size={13} className="text-[#d7a73f]" /> 100% free
        </span>
        <span className="h-1 w-1 rounded-full bg-[#d7a73f]" />
        <span>No spam</span>
        <span className="h-1 w-1 rounded-full bg-[#d7a73f]" />
        <span>Instant access</span>
      </div>
      {message && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            status === 'sent'
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
              : 'border-amber-400/30 bg-amber-400/10 text-amber-100',
          )}
        >
          {message}
        </div>
      )}
    </form>
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
        'csr-mockup-stack',
        tall && 'csr-mockup-stack--hero',
        footer && 'csr-mockup-stack--footer',
        className,
      )}
    >
      <div className="csr-mockup-glow" aria-hidden />
      <img
        src={GUIDE_MOCKUP_SRC}
        alt="Boost Your Credit Score in 72 Hours — free e-guide"
        className={cn('csr-mockup', tall && 'csr-mockup--hero', footer && 'csr-mockup--footer')}
      />
      <div className="csr-mockup-pedestal" aria-hidden />
    </div>
  );
}

function ValueStackCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassPanel className="csr-value-card p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d7a73f]/45">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d7a73f]">Included free</div>
      <div className="mt-3 text-sm font-semibold leading-snug text-white">{label}</div>
      <div className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#f4d273]">{value} value</div>
    </GlassPanel>
  );
}

function VideoPreview({ onGoForm }: { onGoForm?: () => void }) {
  return (
    <div className="csr-video-frame w-full">
      <div className="csr-video-inner w-full">
        <LeadMagnetFunnelHeroVideo
          config={SCORE_ROADMAP_FUNNEL}
          theme={SCORE_THEME}
          posterUrl="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=90"
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
    <div className="csr-discovery-card group relative overflow-hidden rounded-[1.35rem] p-6 text-center transition duration-300 hover:-translate-y-1 hover:border-[#d7a73f]/45">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d7a73f]/70 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="csr-discovery-icon mx-auto flex items-center justify-center rounded-full text-[#f4d273]">
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
    <div className="csr-testimonial-card relative overflow-hidden rounded-[1.35rem] p-6">
      <div className="flex gap-1 text-[#f4d273]">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={16} fill="currentColor" />
        ))}
      </div>
      <p className="mt-5 pr-16 text-sm leading-relaxed text-white/74">&ldquo;{quote}&rdquo;</p>
      <div className="mt-6">
        <div className="font-semibold text-white">- {name}</div>
        <div className="text-xs text-white/48">{role}</div>
      </div>
      <div className="absolute bottom-5 right-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#d7a73f]/55 bg-gradient-to-br from-[#f4d273] to-[#2d8a67] text-[#06101f] shadow-[0_0_30px_rgba(215,167,63,0.22)]">
        <User size={26} />
      </div>
    </div>
  );
}

export default function CreditScoreRoadmapLandingPage() {
  usePublicSeoMeta({
    title: 'Boost Your Credit Score in 72 Hours — Free Guide',
    description:
      'A practical roadmap for quick-win credit actions, profile optimization, and stronger funding readiness from Finely Cred.',
    path: SCORE_ROADMAP_FUNNEL.path,
  });

  const scrollToDownload = () => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' });
  const freeToolkit = SCORE_ROADMAP_FUNNEL.valueStack.map((item) => ({ label: item.label, value: item.value }));

  const discoveries = [
    {
      icon: Target,
      title: 'Assess',
      desc: 'Pull your file and map utilization, negatives, and inquiry pressure before you touch anything.',
    },
    {
      icon: TrendingUp,
      title: 'Optimize',
      desc: 'Execute quick-win moves in the first 72 hours — paydowns, disputes, and reporting-date discipline.',
    },
    {
      icon: ShieldCheck,
      title: 'Strengthen',
      desc: 'Sequence mix, age, and inquiry timing so gains stick instead of bouncing back.',
    },
    {
      icon: BadgeCheck,
      title: 'Achieve',
      desc: 'Position for cleaner approvals with a file underwriters actually respect.',
    },
  ];

  const stats = [
    { icon: Download, value: '12,000+', label: 'Guides Downloaded' },
    { icon: BadgeCheck, value: '72 hrs', label: 'Quick-Win Sequence' },
    { icon: Star, value: '4.9/5', label: 'Average Rating' },
    { icon: Lock, value: '100%', label: 'Free. No Obligation.' },
  ];

  return (
    <main className="csr-page min-h-screen overflow-hidden bg-[#020812] text-white selection:bg-[#d7a73f]/30 selection:text-white">
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
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_70%_8%,rgba(215,167,63,0.18),transparent_30%),radial-gradient(circle_at_18%_28%,rgba(45,138,103,0.28),transparent_32%),linear-gradient(180deg,#020812_0%,#041326_42%,#020812_100%)]" />
      <div className="fc-premium-noise pointer-events-none fixed inset-0 z-0 opacity-[0.045]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[420px] bg-gradient-to-b from-[#0b2543]/50 to-transparent" />

      <header className="relative z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-6 px-5 py-7 md:px-8">
          <div className="hidden items-center gap-8 text-xs font-black uppercase tracking-[0.16em] text-white/72 md:flex">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#d7a73f]" /> 100% Free
            </span>
            <span className="inline-flex items-center gap-2">
              <Zap size={15} className="text-[#3db896]" /> 72-Hour Roadmap
            </span>
            <span className="inline-flex items-center gap-2">
              <Lock size={15} className="text-[#d7a73f]" /> No Spam
            </span>
          </div>
        </div>
      </header>

      <section className="csr-hero-section relative z-10 border-b border-[#d7a73f]/25">
        <div className="fc-hero-vignette absolute inset-0 bg-[radial-gradient(circle_at_78%_58%,rgba(215,167,63,0.22),transparent_30%),radial-gradient(circle_at_82%_62%,rgba(45,138,103,0.14),transparent_28%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d7a73f]/75 to-transparent" />
        <div className="csr-hero-grid mx-auto grid items-center gap-10 px-5 md:px-8 lg:items-center">
          <div className="csr-hero-copy relative z-20 pt-6 lg:pt-14">
            <SectionKicker>Your 72-hour credit score roadmap</SectionKicker>

            <h1 className="csr-hero-title csr-serif mt-8 text-white">
              <span className="csr-hero-title-line">Boost Your</span>
              <span className="csr-hero-title-line csr-hero-title-line--gold">Credit Score</span>
              <span className="csr-hero-title-line csr-hero-title-line--green">in 72 Hours</span>
            </h1>
            <div className="csr-hero-title-rule" aria-hidden />

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl">
              Not random disputing — a sequenced roadmap: utilization first, high-impact negatives next, then mix and
              inquiry discipline. Plus a {LEAD_MAGNET_TRIAL_DAYS}-day Finely Cred portal preview to track every move.
            </p>

            <div className="mt-9 grid gap-5 sm:grid-cols-3">
              <TinyProof icon={Target} title="Assess" desc="Map utilization, negatives, and inquiry pressure first." />
              <TinyProof icon={TrendingUp} title="Optimize" desc="Execute quick-win moves in the first 72 hours." />
              <TinyProof icon={ShieldCheck} title="Strengthen" desc="Sequence mix and age so gains actually stick." />
            </div>

            <div className="csr-hero-form mt-9 max-w-xl rounded-[1.35rem] p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-xl font-black uppercase tracking-[0.08em] text-white md:text-2xl">
                  Get Your <span className="text-[#f4d273]">Free</span> Guide Now
                </h2>
                <ArrowRight className="hidden rotate-45 text-[#d7a73f] sm:block" size={34} />
              </div>
              <LeadCaptureForm hero />
            </div>
          </div>

          <div className="csr-hero-mockup-col relative z-10 flex items-end justify-center pb-2 lg:justify-end lg:pb-6">
            <GuideMockup tall className="w-full" />
          </div>
        </div>
      </section>

      <section className="csr-video-section relative z-10 border-b border-[#d7a73f]/20">
        <div className="csr-video-grid mx-auto grid gap-16 px-5 md:px-8 lg:grid-cols-2 lg:items-center lg:gap-20 xl:gap-32">
          <div className="csr-video-column csr-video-column--left w-full">
            <VideoPreview onGoForm={scrollToDownload} />
          </div>
          <div className="csr-video-column csr-video-column--right">
            <SectionKicker>Exclusive video</SectionKicker>
            <h2 className="csr-serif mt-5 text-4xl font-black leading-tight tracking-[-0.035em] md:text-6xl">
              See How the <span className="text-[#3db896]">72-Hour Sequence</span> Works
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65">
              Morgan walks through utilization first, dispute priorities second, and funding-ready optics — the same
              order inside the guide and your portal preview.
            </p>
            <div className="mt-7 grid gap-3">
              {SCORE_ROADMAP_FUNNEL.features.map((feature) => (
                <MiniCheck key={feature.title}>
                  {feature.title}: {feature.desc}
                </MiniCheck>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="free-toolkit" className="relative z-10 border-y border-[#d7a73f]/20 py-18 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mx-auto mb-11 max-w-3xl text-center">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#d7a73f]">
              Your complete score boost system
            </div>
            <h2 className="csr-serif mt-3 text-4xl font-black tracking-[-0.035em] md:text-5xl">
              Everything Included <span className="text-[#f4d273]">At No Cost</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/60">
              Unlock the full 72-hour roadmap plus interactive worksheets, checklists, and a {LEAD_MAGNET_TRIAL_DAYS}
              -day portal preview when you request the guide.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {freeToolkit.map((item) => (
              <ValueStackCard key={item.label} {...item} />
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
            {SCORE_ROADMAP_FUNNEL.trustCerts.map((cert) => (
              <span key={cert} className="inline-flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#d7a73f]" />
                {cert}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="inside-guide" className="relative z-10 py-18 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mx-auto mb-11 max-w-3xl text-center">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#d7a73f]">
              What you&apos;ll discover inside
            </div>
            <h2 className="csr-serif csr-section-title mt-3 text-4xl font-black tracking-[-0.035em] md:text-5xl">
              Your Roadmap to <span className="text-[#3db896]">Better Credit</span>
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {discoveries.map((item) => (
              <DiscoveryCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-[#d7a73f]/20 bg-black/18 py-9">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 md:grid-cols-4 md:px-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center justify-center gap-4 border-white/10 py-4 md:border-r last:md:border-r-0"
            >
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
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#d7a73f]">
              Real people. Real results.
            </div>
            <h2 className="csr-serif csr-section-title mt-3 text-4xl font-black tracking-[-0.035em] md:text-5xl">
              Stories of Score Breakthroughs
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Testimonial
              name="Marcus T."
              role="Business Owner"
              quote="The 72-hour plan gave me a clear order of operations. Utilization first — then disputes. My file looked completely different in two weeks."
            />
            <Testimonial
              name="Danielle R."
              role="First-Time Homebuyer"
              quote="I stopped guessing which negatives to hit first. The worksheet inside the portal made every step trackable."
            />
            <Testimonial
              name="James K."
              role="Entrepreneur"
              quote="Finally a credit guide that respects sequencing. No hype — just a wealthy, structured path to funding readiness."
            />
          </div>
        </div>
      </section>

      <section id="download" className="relative z-10 border-t border-[#d7a73f]/25 px-5 pb-12 md:px-8">
        <div className="mx-auto max-w-7xl overflow-visible rounded-[1.65rem] border border-[#d7a73f]/45 bg-gradient-to-r from-[#061326] via-[#071b33] to-[#0a1f18] shadow-[0_34px_120px_rgba(0,0,0,0.55)]">
          <div className="grid gap-0 overflow-hidden rounded-[1.65rem] lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative flex min-h-[320px] flex-col items-center justify-end overflow-visible p-6 pb-14 md:p-8 md:pb-16">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(215,167,63,0.22),transparent_48%),radial-gradient(circle_at_50%_65%,rgba(45,138,103,0.12),transparent_42%)]" />
              <GuideMockup footer className="relative z-10" />
              <div className="relative z-10 mt-4 w-full max-w-xs rounded-xl border border-[#d7a73f]/35 bg-[#061326]/90 px-4 py-3 text-center backdrop-blur-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d7a73f]">Your roadmap to</div>
                <div className="text-sm font-black uppercase tracking-[0.06em] text-[#3db896]">Score breakthrough starts now.</div>
              </div>
            </div>
            <div className="p-8 md:p-10">
              <h3 className="text-2xl font-black uppercase tracking-[0.07em] text-[#f4d273]">
                Get Instant Access to Your Free Guide
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/58">
                Join people who are moving their scores with structure — not scattered tips.
              </p>
              <div className="mt-6">
                <LeadCaptureForm compact />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-white/42 md:flex-row">
          <div />
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
          <p>© {new Date().getFullYear()} Finely Cred. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
