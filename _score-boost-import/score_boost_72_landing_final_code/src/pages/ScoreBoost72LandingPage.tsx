import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Flag,
  Gauge,
  Lock,
  Mail,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import { submitLeadCapture } from '../data/leadsRepo';

/**
 * Score Boost 72-Hour Landing Page
 * ------------------------------------------------------------------
 * Final high-end implementation based on the approved landing page image.
 *
 * Visual direction:
 * - Luxury ivory background.
 * - Deep navy / emerald / gold.
 * - No blue squiggly page decorations.
 * - E-guide is NOT oversized in the hero.
 * - Video lives in the hero-right position.
 * - E-guide + phone/device mockup live lower on the page beside the CTA.
 * - Phone screen contains the approved e-guide cover, not random cards.
 * - Page feels premium, financial, clean, and conversion-focused.
 *
 * Required assets:
 * - /public/images/finely-cred-logo.png
 * - /public/images/boost-credit-score-72-guide.png
 *
 * Optional:
 * - Replace the CSS-generated video preview with /public/images/score-boost-video-thumbnail.jpg
 */

const LOGO_SRC = '/images/finely-cred-logo.png';
const GUIDE_SRC = '/images/boost-credit-score-72-guide.png';
const VIDEO_THUMBNAIL_SRC = '';

type FormStatus = 'idle' | 'sending' | 'sent' | 'error';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function BrandLogo({ className = '' }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={cn('leading-none', className)}>
        <div className="text-2xl font-semibold tracking-[-0.05em] text-[#071722]">Finely</div>
        <div className="text-3xl font-light tracking-[-0.05em] text-[#071722]">Cred</div>
      </div>
    );
  }

  return (
    <img
      src={LOGO_SRC}
      alt="Finely Cred"
      onError={() => setFailed(true)}
      className={cn('h-auto w-[132px] object-contain', className)}
    />
  );
}

function GuideMockup({ compact = false }: { compact?: boolean }) {
  return (
    <img
      src={GUIDE_SRC}
      alt="Boost Your Credit Score in 72 Hours e-guide"
      className={cn(
        'object-contain',
        compact
          ? 'max-h-[270px] w-auto drop-shadow-[0_28px_50px_rgba(7,23,34,.22)]'
          : 'max-h-[430px] w-auto drop-shadow-[0_36px_66px_rgba(7,23,34,.24)]',
      )}
    />
  );
}

function PhoneMockup() {
  return (
    <div className="relative -ml-3 flex h-[238px] w-[118px] shrink-0 rotate-[1deg] items-center justify-center rounded-[1.35rem] border-[6px] border-[#101820] bg-[#101820] shadow-[0_24px_48px_rgba(7,23,34,.28)]">
      <div className="absolute top-[6px] z-20 h-[16px] w-[56px] rounded-b-xl bg-[#101820]" />
      <div className="h-full w-full overflow-hidden rounded-[.98rem] bg-[#fbf6ed]">
        <img src={GUIDE_SRC} alt="Guide preview on phone" className="h-full w-full object-cover object-top" />
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  type = 'button',
  className = '',
  disabled = false,
}: {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-md border border-[#004a31] bg-[linear-gradient(135deg,#00462f_0%,#006d47_55%,#008b55_100%)] px-7 text-[12px] font-black uppercase tracking-[0.1em] text-white shadow-[0_18px_44px_rgba(0,91,60,.24),inset_0_1px_0_rgba(255,255,255,.16)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-65',
        className,
      )}
    >
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition duration-700 group-hover:translate-x-full" />
    </button>
  );
}

function GoldButton({
  children,
  type = 'button',
  className = '',
  disabled = false,
}: {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'group relative inline-flex h-13 items-center justify-center overflow-hidden rounded-md border border-[#d6a548] bg-[linear-gradient(135deg,#9c6619_0%,#d6a548_48%,#f1ce78_100%)] px-6 text-[12px] font-black uppercase tracking-[0.1em] text-[#071722] shadow-[0_16px_38px_rgba(156,102,25,.24),inset_0_1px_0_rgba(255,255,255,.45)] transition duration-300 hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-65',
        className,
      )}
    >
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition duration-700 group-hover:translate-x-full" />
    </button>
  );
}

function LeadForm({
  variant = 'hero',
  source = 'score_boost_72_landing_hero',
}: {
  variant?: 'hero' | 'inline';
  source?: string;
}) {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
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
        source,
        offer: 'boost_credit_score_in_72_hours_guide',
        interest:
          'Boost Your Credit Score in 72 Hours guide: quick-win actions, profile optimization, funding readiness',
        fullName: firstName.trim() || 'Score Boost Lead',
        email: email.trim(),
        phone: '',
        consentToContact: true,
        consentEmailMarketing: true,
        consentSmsMarketing: false,
        metadata: {
          page: 'ScoreBoost72LandingPage',
          funnel: 'score-roadmap-lead-magnet',
          guideTitle: 'Boost Your Credit Score in 72 Hours',
        },
      } as any);

      setStatus('sent');
      setMessage(
        result?.remote === 'ok'
          ? 'You are in. Your free guide request was received.'
          : 'You are in. The request was captured. Connect CRM/Supabase for live delivery.',
      );
      setFirstName('');
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Something went wrong. Please try again.');
    }
  }

  if (variant === 'inline') {
    return (
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-[1fr_230px]">
        <label className="relative block">
          <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7b5a]" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            maxLength={180}
            className="h-12 w-full rounded-md border border-[#dcc99f] bg-white pl-11 pr-4 text-sm font-medium text-[#071722] outline-none placeholder:text-[#8a8984] focus:border-[#d6a548] focus:ring-4 focus:ring-[#d6a548]/15"
          />
        </label>
        <GoldButton type="submit" disabled={status === 'sending'} className="h-12 w-full">
          {status === 'sending' ? 'Sending...' : 'Get My Free Guide'}
        </GoldButton>
        {message && (
          <div className={cn('md:col-span-2 rounded-lg border px-4 py-3 text-sm',
            status === 'sent'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-900',
          )}>
            {message}
          </div>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="relative block">
        <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b7b5a]" />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          required
          maxLength={180}
          className="h-13 w-full rounded-md border border-[#dcc99f] bg-white/78 pl-11 pr-4 text-sm font-medium text-[#071722] outline-none placeholder:text-[#8a8984] focus:border-[#d6a548] focus:bg-white focus:ring-4 focus:ring-[#d6a548]/15"
        />
      </label>
      <PrimaryButton type="submit" disabled={status === 'sending'} className="h-13 w-full">
        {status === 'sending' ? 'Sending...' : 'Download My Free Guide'}
      </PrimaryButton>
      <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-[#071722]/62">
        <Lock size={13} />
        <span>100% Free. No Spam. Unsubscribe Anytime.</span>
      </div>
      {message && (
        <div className={cn('rounded-lg border px-4 py-3 text-sm',
          status === 'sent'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-900',
        )}>
          {message}
        </div>
      )}
    </form>
  );
}

function VideoCard() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#d6a548]/35 bg-[#071722] shadow-[0_28px_70px_rgba(7,23,34,.28)]">
      <div className="relative aspect-video overflow-hidden">
        {VIDEO_THUMBNAIL_SRC ? (
          <img src={VIDEO_THUMBNAIL_SRC} alt="Score boost video" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_36%,rgba(236,191,93,.25),transparent_28%),linear-gradient(90deg,rgba(7,23,34,.98),rgba(7,23,34,.72)_46%,rgba(7,23,34,.16)),url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 675%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%23050b10%22/%3E%3Cstop offset=%22.55%22 stop-color=%22%23263534%22/%3E%3Cstop offset=%221%22 stop-color=%22%230a1115%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%221200%22 height=%22675%22 fill=%22url(%23g)%22/%3E%3Crect x=%22735%22 y=%2298%22 width=%22335%22 height=%22220%22 rx=%2210%22 fill=%22%23859aa0%22 opacity=%22.20%22/%3E%3Ccircle cx=%22878%22 cy=%22225%22 r=%2294%22 fill=%22%23131b1d%22 opacity=%22.55%22/%3E%3Crect x=%22802%22 y=%22317%22 width=%22250%22 height=%22185%22 rx=%2212%22 fill=%22%2312171a%22 opacity=%22.70%22/%3E%3Cpath d=%22M140 470 C300 400 760 400 990 470 L930 560 C760 610 420 610 220 558 Z%22 fill=%22%23202322%22/%3E%3Cpath d=%22M250 475 C390 430 760 430 920 475%22 fill=%22none%22 stroke=%22%23c39538%22 stroke-width=%225%22 opacity=%22.50%22/%3E%3C/svg%3E')]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/34 via-transparent to-transparent" />

        <div className="absolute left-7 top-7 rounded-sm border border-[#d6a548]/60 px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#e8c56c]">
          Expert Insight
        </div>

        <div className="absolute left-7 top-24 max-w-[290px]">
          <h3 className="font-serif text-3xl font-black leading-tight text-white">
            Unlock Better Credit & Financial Opportunities — Faster.
          </h3>
          <div className="mt-5 flex items-start gap-2 text-xs font-medium leading-relaxed text-white/74">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#d6a548]" />
            <span>Proven strategies from credit & funding experts.</span>
          </div>
        </div>

        <button
          type="button"
          aria-label="Play video"
          className="absolute left-[58%] top-1/2 flex h-20 w-20 -translate-y-1/2 items-center justify-center rounded-full border border-[#d6a548] bg-[#005b3d] text-[#e8c56c] shadow-[0_0_50px_rgba(214,165,72,.30)]"
        >
          <Play size={34} fill="currentColor" className="ml-1" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-4 bg-black/40 px-5 py-3 text-white/88 backdrop-blur">
          <Play size={17} fill="currentColor" />
          <span className="text-xs font-semibold">0:00 / 1:45</span>
          <span className="h-1 flex-1 rounded-full bg-white/24">
            <span className="block h-full w-[20%] rounded-full bg-white" />
          </span>
          <span className="h-4 w-4 rounded-sm border border-white/70" />
        </div>
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm font-medium leading-relaxed text-[#071722]/75">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#b88425] text-white">
        <CheckCircle2 size={13} strokeWidth={3} />
      </span>
      {children}
    </div>
  );
}

function FeatureStripCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d6a548]/55 text-[#b88425]">
        <Icon size={31} />
      </div>
      <h3 className="mt-4 text-[13px] font-black uppercase tracking-[0.08em] text-[#071722]">{title}</h3>
      <p className="mx-auto mt-2 max-w-[180px] text-xs font-medium leading-relaxed text-[#071722]/58">{desc}</p>
    </div>
  );
}

function RoadmapStep({
  n,
  title,
  desc,
}: {
  n: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#d6a548] bg-[#005b3d] text-2xl font-black text-[#e8c56c] shadow-[0_14px_32px_rgba(0,91,61,.16)]">
        {n}
      </div>
      <h3 className="mt-4 text-[13px] font-black uppercase tracking-[0.08em] text-[#071722]">{title}</h3>
      <p className="mx-auto mt-2 max-w-[175px] text-xs font-medium leading-relaxed text-[#071722]/60">{desc}</p>
    </div>
  );
}

function TestimonialBar() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#d6a548]/55 bg-[#061725] px-7 py-7 text-white shadow-[0_24px_70px_rgba(7,23,34,.22)]">
      <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
      <div className="relative z-10 grid gap-5 md:grid-cols-[130px_1fr] md:items-center">
        <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-[#d6a548] bg-[#e8c56c]/10">
          <User size={58} className="text-[#e8c56c]" />
        </div>
        <div>
          <div className="mb-3 text-[#e8c56c]">★★★★★</div>
          <p className="max-w-3xl font-serif text-xl leading-relaxed text-white/90">
            “This guide is a game-changer. I followed the 72-hour plan and saw real results fast. My score improved and I got approved for funding I needed.”
          </p>
          <div className="mt-4 text-[13px] font-black uppercase tracking-[0.12em] text-[#e8c56c]">James T.</div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/52">Business Owner</div>
        </div>
      </div>
    </div>
  );
}

export default function ScoreBoost72LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf4ea] text-[#071722] selection:bg-[#00c83f]/25">
      <style>{`
        .fc-page-grid {
          background-image:
            linear-gradient(rgba(7,23,34,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(7,23,34,.035) 1px, transparent 1px);
          background-size: 54px 54px;
        }
        .fc-noise {
          background-image: radial-gradient(circle at 1px 1px, rgba(7,23,34,.10) 1px, transparent 0);
          background-size: 22px 22px;
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_14%_8%,rgba(0,200,63,.08),transparent_28%),radial-gradient(circle_at_84%_14%,rgba(214,165,72,.13),transparent_30%),linear-gradient(180deg,#fffaf2_0%,#fbf4ea_52%,#f6eddf_100%)]" />
      <div className="fc-page-grid pointer-events-none fixed inset-0 z-0 opacity-55" />
      <div className="fc-noise pointer-events-none fixed inset-0 z-0 opacity-[0.025]" />

      <header className="relative z-20 border-b border-[#dfcfaa] bg-[#fffaf2]/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <a href="/" aria-label="Finely Cred home">
            <BrandLogo />
          </a>
          <nav className="hidden items-center gap-9 text-[12px] font-semibold text-[#071722]/72 lg:flex">
            <a className="transition hover:text-[#005b3d]" href="/">Home</a>
            <a className="transition hover:text-[#005b3d]" href="/about">About</a>
            <a className="transition hover:text-[#005b3d]" href="/resources">Resources</a>
            <a className="transition hover:text-[#005b3d]" href="/testimonials">Testimonials</a>
            <a className="transition hover:text-[#005b3d]" href="/contact">Contact</a>
          </nav>
          <a
            href="#download"
            className="rounded-md bg-[linear-gradient(135deg,#a06a1a,#d6a548,#f0cc75)] px-6 py-3 text-[12px] font-black uppercase tracking-[0.09em] text-[#071722] shadow-[0_14px_34px_rgba(160,106,26,.22)] transition hover:-translate-y-0.5"
          >
            Get the Free Guide
          </a>
        </div>
      </header>

      <section className="relative z-10">
        <div className="mx-auto grid max-w-7xl items-center gap-11 px-5 py-12 md:px-8 lg:grid-cols-[.86fr_1.14fr] lg:py-16">
          <div>
            <div className="mb-5 inline-flex rounded-sm border border-[#d6a548] bg-[#061725] px-5 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-[#e8c56c]">
              Free Guide
            </div>
            <h1 className="font-serif text-[3.25rem] font-black leading-[0.98] tracking-[-0.05em] text-[#071722] md:text-[5.05rem]">
              Boost Your
              <span className="block bg-[linear-gradient(135deg,#9a661d,#d6a548,#f0cc75)] bg-clip-text text-transparent">
                Credit Score
              </span>
              <span className="block">
                in <span className="text-[#005b3d]">72 Hours</span>
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-[#071722]/70">
              A practical roadmap for quick-win credit actions, profile optimization, and stronger funding readiness.
            </p>

            <div className="mt-7 grid gap-3">
              <Bullet>Quick-win strategies that deliver real results</Bullet>
              <Bullet>Optimize your profile for better opportunities</Bullet>
              <Bullet>Strengthen your credit & build lasting momentum</Bullet>
            </div>

            <div className="mt-8 max-w-[535px]">
              <LeadForm />
            </div>
          </div>

          <VideoCard />
        </div>
      </section>

      <section className="relative z-10">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="grid gap-6 rounded-xl border border-[#d6a548]/45 bg-[#fffaf2]/72 px-7 py-8 shadow-[0_16px_55px_rgba(7,23,34,.06)] md:grid-cols-4">
            <FeatureStripCard icon={ClipboardCheck} title="Assess" desc="Evaluate your credit and find hidden gaps." />
            <FeatureStripCard icon={Target} title="Optimize" desc="Take action to improve your credit profile." />
            <FeatureStripCard icon={BarChart3} title="Strengthen" desc="Build a stronger foundation for long-term success." />
            <FeatureStripCard icon={Flag} title="Achieve" desc="Unlock better opportunities and financial freedom." />
          </div>
        </div>
      </section>

      <section className="relative z-10 py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-9 flex items-center justify-center gap-4 text-center">
            <span className="hidden h-px w-16 bg-[#d6a548] md:block" />
            <h2 className="font-serif text-2xl font-black uppercase tracking-[0.04em] text-[#071722]">
              Your 4-Step Roadmap to Better Credit
            </h2>
            <span className="hidden h-px w-16 bg-[#d6a548] md:block" />
          </div>

          <div className="relative grid gap-8 md:grid-cols-4">
            <div className="absolute left-[12%] right-[12%] top-7 hidden h-px bg-[#d6a548]/65 md:block" />
            <RoadmapStep n="1" title="Assess" desc="Evaluate your current credit and identify what's holding you back." />
            <RoadmapStep n="2" title="Optimize" desc="Take targeted actions to improve your profile fast and effectively." />
            <RoadmapStep n="3" title="Strengthen" desc="Build positive credit habits and strengthen your foundation." />
            <RoadmapStep n="4" title="Achieve" desc="See results, unlock new opportunities, and take control of your future." />
          </div>
        </div>
      </section>

      <section id="download" className="relative z-10 pb-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="grid items-center gap-10 rounded-xl border border-[#d6a548]/45 bg-[#fffaf2]/78 p-7 shadow-[0_22px_80px_rgba(7,23,34,.08)] lg:grid-cols-[.92fr_1.08fr]">
            <div className="flex items-end justify-center lg:justify-start">
              <div className="relative flex items-end">
                <GuideMockup compact />
                <PhoneMockup />
              </div>
            </div>

            <div className="mx-auto max-w-xl lg:mx-0">
              <div className="text-[12px] font-black uppercase tracking-[0.14em] text-[#b88425]">Free Guide</div>
              <h2 className="mt-3 font-serif text-4xl font-black leading-tight tracking-[-0.035em] text-[#071722]">
                Your Insider Roadmap to Stronger Credit & Funding
              </h2>
              <p className="mt-4 text-sm font-medium leading-relaxed text-[#071722]/66">
                Learn the strategies lenders won’t tell you and take control of your financial future—starting now.
              </p>
              <div className="mt-6">
                <LeadForm variant="inline" source="score_boost_72_landing_mid_cta" />
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-semibold text-[#071722]/55 md:justify-start">
                <Lock size={13} />
                <span>100% Free. No Spam. Unsubscribe Anytime.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 pb-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <TestimonialBar />
        </div>
      </section>

      <footer className="relative z-10 border-t border-[#dfcfaa] bg-[#061725] px-5 py-8 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <BrandLogo className="w-[112px] brightness-0 invert" />
          <p className="text-xs text-white/55">Empowering your credit. Unlocking your freedom.</p>
          <p className="text-xs text-white/44">© 2024 Finely Cred. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
