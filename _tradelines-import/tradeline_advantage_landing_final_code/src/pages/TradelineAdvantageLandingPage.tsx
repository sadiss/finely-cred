import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  Gauge,
  Headphones,
  LineChart,
  Lock,
  Mail,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Users,
  Volume2,
  WalletCards,
} from 'lucide-react';
import { submitLeadCapture } from '../data/leadsRepo';

/**
 * Trade Lines Advantage Landing Page — Final Approved Direction
 * ----------------------------------------------------------------
 * Built to match the approved landing page mockup:
 * - Ivory luxury fintech background
 * - Deep emerald navigation / CTA
 * - Gold separators and icon treatment
 * - Approved e-guide mockup image unchanged
 * - Professional boardroom video preview section
 * - Starter / Boost / Max offer cards
 * - Strategy process section
 * - Bottom CTA banner with guide image
 *
 * Required assets:
 * /public/images/finely-cred-logo.png
 * /public/images/tradeline-advantage-guide.png
 *
 * Optional asset:
 * /public/images/tradeline-boardroom-video-thumbnail.jpg
 */

const LOGO_SRC = '/images/finely-cred-logo.png';
const GUIDE_MOCKUP_SRC = '/images/tradeline-advantage-guide.png';
const VIDEO_THUMBNAIL_SRC = '';

type FormStatus = 'idle' | 'sending' | 'sent' | 'error';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function BrandLogo({ className = '' }: { className?: string }) {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return (
      <div className={cn('text-xl font-semibold tracking-[-0.04em] text-[#061116]', className)}>
        Finely Cred
      </div>
    );
  }

  return (
    <img
      src={LOGO_SRC}
      alt="Finely Cred"
      onError={() => setVisible(false)}
      className={cn('h-auto w-[142px] object-contain', className)}
    />
  );
}

function GoldDivider({ className = '' }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-3', className)}>
      <span className="h-px w-16 bg-gradient-to-r from-transparent via-[#d0a33d] to-[#d0a33d]" />
      <span className="h-1.5 w-1.5 rotate-45 bg-[#d0a33d]" />
      <span className="h-px w-16 bg-gradient-to-l from-transparent via-[#d0a33d] to-[#d0a33d]" />
    </div>
  );
}

function PrimaryButton({
  children,
  type = 'button',
  disabled = false,
  className = '',
}: {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-md border border-[#0a4b3d] bg-[#073f35] px-7 text-[12px] font-black uppercase tracking-[0.08em] text-white shadow-[0_18px_42px_rgba(7,63,53,.23)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#0d5a4a] disabled:cursor-not-allowed disabled:opacity-65',
        className,
      )}
    >
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/18 to-transparent transition duration-700 group-hover:translate-x-full" />
    </button>
  );
}

function GoldButton({
  children,
  type = 'button',
  disabled = false,
  className = '',
}: {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-md border border-[#e1bf67] bg-[linear-gradient(135deg,#b97d25_0%,#d8a842_48%,#f4d07a_100%)] px-7 text-[12px] font-black uppercase tracking-[0.08em] text-[#061116] shadow-[0_18px_44px_rgba(184,125,37,.23),inset_0_1px_0_rgba(255,255,255,.45)] transition duration-300 hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-65',
        className,
      )}
    >
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/42 to-transparent transition duration-700 group-hover:translate-x-full" />
    </button>
  );
}

function LeadForm({
  compact = false,
  source = 'tradeline_advantage_landing_hero',
}: {
  compact?: boolean;
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
        offer: 'trade_lines_advantage_free_guide',
        interest:
          'Tradeline Advantage guide: strategic tradelines, authorized user placements, reporting depth, profile strength, funding readiness',
        fullName: firstName.trim() || 'Tradeline Advantage Lead',
        email: email.trim(),
        phone: '',
        consentToContact: true,
        consentEmailMarketing: true,
        consentSmsMarketing: false,
        metadata: {
          page: 'TradelineAdvantageLandingPage',
          funnel: 'tradeline-lead-magnet',
          guideTitle: 'The Trade Lines Advantage',
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

  if (compact) {
    return (
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-[1fr_250px]">
        <label className="relative block">
          <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#65716b]" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            maxLength={180}
            className="h-14 w-full rounded-md border border-[#d9c9aa] bg-white pl-11 pr-4 text-sm font-medium text-[#061116] outline-none placeholder:text-[#8b918d] focus:border-[#d0a33d] focus:ring-4 focus:ring-[#d0a33d]/15"
          />
        </label>
        <GoldButton type="submit" disabled={status === 'sending'} className="w-full">
          {status === 'sending' ? 'Sending...' : 'Download Free Guide'} <ArrowRight size={16} />
        </GoldButton>
        {message && (
          <div
            className={cn(
              'md:col-span-2 rounded-lg border px-4 py-3 text-sm',
              status === 'sent'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-900',
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
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <label className="relative block">
          <Mail size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#65716b]" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            maxLength={180}
            className="h-14 w-full rounded-md border border-[#d9c9aa] bg-white pl-4 pr-11 text-sm font-medium text-[#061116] outline-none placeholder:text-[#8b918d] focus:border-[#d0a33d] focus:ring-4 focus:ring-[#d0a33d]/15"
          />
        </label>
        <PrimaryButton type="submit" disabled={status === 'sending'} className="w-full">
          {status === 'sending' ? 'Sending...' : 'Send My Free Guide'}
        </PrimaryButton>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-[#061116]/58">
        <span className="inline-flex items-center gap-1.5"><Lock size={13} className="text-[#b88426]" /> 100% Free</span>
        <span className="h-1 w-1 rounded-full bg-[#d0a33d]" />
        <span>No Spam</span>
        <span className="h-1 w-1 rounded-full bg-[#d0a33d]" />
        <span>Instant Access</span>
      </div>

      {message && (
        <div
          className={cn(
            'rounded-lg border px-4 py-3 text-sm',
            status === 'sent'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-900',
          )}
        >
          {message}
        </div>
      )}
    </form>
  );
}

function GuideMockup({ small = false }: { small?: boolean }) {
  const [fallback, setFallback] = useState(false);

  if (fallback) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md border border-[#d9c9aa] bg-[#f7efe2] text-center shadow-[0_30px_70px_rgba(6,17,22,.18)]',
          small ? 'h-[220px] w-[150px]' : 'h-[560px] w-[380px]',
        )}
      >
        <div className="px-4">
          <BrandLogo className="mx-auto mb-6 w-[140px]" />
          <div className="text-[11px] font-black uppercase tracking-[0.26em] text-[#073f35]">Free Guide</div>
          <div className="mt-4 font-serif text-3xl font-black uppercase tracking-[0.10em] text-[#073f35]">
            Trade Lines
          </div>
          <div className="mt-2 text-xl uppercase tracking-[0.22em] text-[#b88426]">Advantage</div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={GUIDE_MOCKUP_SRC}
      alt="The Trade Lines Advantage e-guide"
      onError={() => setFallback(true)}
      className={cn(
        'relative z-10 object-contain',
        small
          ? 'max-h-[255px] w-[150px] drop-shadow-[0_28px_44px_rgba(0,0,0,.26)]'
          : 'max-h-[650px] w-full max-w-[500px] drop-shadow-[0_48px_72px_rgba(6,17,22,.25)]',
      )}
    />
  );
}

function IconStat({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center justify-center gap-5 border-r border-[#d0a33d]/45 px-6 py-5 last:border-r-0">
      <Icon size={33} className="shrink-0 text-[#d0a33d]" />
      <div>
        <div className="text-[13px] font-black uppercase tracking-[0.06em] text-white">{title}</div>
        <div className="mt-1 text-[12px] font-medium leading-tight text-white/72">{desc}</div>
      </div>
    </div>
  );
}

function LearnCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-[#e4d2b0] bg-[#fffaf1] p-8 text-center shadow-[0_20px_52px_rgba(6,17,22,.055)]">
      <Icon size={47} className="mx-auto text-[#c59230]" />
      <h3 className="mt-5 text-[15px] font-black uppercase tracking-[0.08em] text-[#073f35]">{title}</h3>
      <p className="mt-4 text-sm font-medium leading-relaxed text-[#061116]/67">{desc}</p>
    </div>
  );
}

function VideoPreview() {
  return (
    <div className="relative overflow-hidden rounded-[1.15rem] border border-[#d0a33d]/40 bg-[#061116] p-2 shadow-[0_30px_70px_rgba(0,0,0,.32)]">
      <div className="relative aspect-video overflow-hidden rounded-[.9rem] bg-[#111]">
        {VIDEO_THUMBNAIL_SRC ? (
          <img src={VIDEO_THUMBNAIL_SRC} alt="Tradeline strategy video" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_28%,rgba(216,181,93,.28),transparent_18%),linear-gradient(180deg,rgba(8,22,27,.4),rgba(0,0,0,.72)),url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 675%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22%3E%3Cstop offset=%220%22 stop-color=%22%23131b1c%22/%3E%3Cstop offset=%22.45%22 stop-color=%22%23293432%22/%3E%3Cstop offset=%221%22 stop-color=%22%23081216%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%221200%22 height=%22675%22 fill=%22url(%23g)%22/%3E%3Crect x=%22720%22 y=%22105%22 width=%22385%22 height=%22220%22 rx=%225%22 fill=%22%23384743%22 opacity=%22.75%22/%3E%3Cpath d=%22M742 295 L1080 295 L1080 135 L742 135 Z%22 fill=%22%238aa0a4%22 opacity=%22.28%22/%3E%3Cpath d=%22M760 292 L815 168 L885 292 Z M890 292 L945 148 L1048 292 Z%22 fill=%22%23111a1e%22 opacity=%22.72%22/%3E%3Crect x=%2262%22 y=%22130%22 width=%22485%22 height=%22255%22 rx=%2220%22 fill=%22%231b2423%22 opacity=%22.7%22/%3E%3Crect x=%2282%22 y=%22152%22 width=%22445%22 height=%22212%22 rx=%2215%22 fill=%22%23323b38%22 opacity=%22.46%22/%3E%3Cellipse cx=%22605%22 cy=%22515%22 rx=%22405%22 ry=%2276%22 fill=%22%23050607%22 opacity=%22.72%22/%3E%3Cpath d=%22M210 488 C360 405 815 405 970 488 L930 548 C770 593 405 590 250 548 Z%22 fill=%22%23202423%22/%3E%3Cpath d=%22M260 487 C410 442 750 442 920 487%22 fill=%22none%22 stroke=%22%23b98b2d%22 stroke-width=%226%22 opacity=%22.58%22/%3E%3Crect x=%22265%22 y=%22428%22 width=%2262%22 height=%2296%22 rx=%2212%22 fill=%22%23111616%22/%3E%3Crect x=%22865%22 y=%22428%22 width=%2262%22 height=%2296%22 rx=%2212%22 fill=%22%23111616%22/%3E%3Crect x=%22360%22 y=%22418%22 width=%2256%22 height=%2290%22 rx=%2212%22 fill=%22%23111616%22/%3E%3Crect x=%22782%22 y=%22418%22 width=%2256%22 height=%2290%22 rx=%2212%22 fill=%22%23111616%22/%3E%3Cpath d=%22M110 108 H590 M720 92 H1120%22 stroke=%22%23c69a3a%22 stroke-width=%223%22 opacity=%22.28%22/%3E%3C/svg%3E')]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/42 via-transparent to-transparent" />

        <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#f4d27a]/70 bg-[#d0a33d] text-[#061116] shadow-[0_0_55px_rgba(208,163,61,.48)]">
          <Play size={40} fill="currentColor" className="ml-1" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-4 bg-black/34 px-5 py-3 text-white/90 backdrop-blur">
          <Play size={17} fill="currentColor" />
          <Pause size={15} />
          <span className="text-xs font-semibold">0:00 / 2:45</span>
          <span className="h-1 flex-1 rounded-full bg-white/20">
            <span className="block h-full w-[14%] rounded-full bg-[#d0a33d]" />
          </span>
          <Volume2 size={17} />
          <span className="h-4 w-4 rounded-sm border border-white/70" />
        </div>
      </div>
    </div>
  );
}

function PackageCard({
  title,
  tone,
  badge,
  price,
  bullets,
}: {
  title: string;
  tone: 'starter' | 'boost' | 'max';
  badge?: string;
  price?: string;
  bullets: string[];
}) {
  const headerMap = {
    starter: 'bg-[#073f35]',
    boost: 'bg-[#0f4e78]',
    max: 'bg-[#5b2a54]',
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#e4d2b0] bg-[#fffaf1] p-0 text-center shadow-[0_22px_64px_rgba(6,17,22,.07)]">
      {badge && (
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-b-md bg-[#d0a33d] px-5 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-white">
          {badge}
        </div>
      )}
      <div className={cn('py-4 text-[15px] font-black uppercase tracking-[0.12em] text-white', headerMap[tone])}>
        {title}
      </div>
      <div className="px-8 py-8">
        <p className="text-sm font-medium leading-relaxed text-[#061116]/65">
          {tone === 'starter' && 'Build a stronger foundation and begin your credit upgrade journey with quality tradelines.'}
          {tone === 'boost' && 'Accelerate your profile strength with additional depth and stronger reporting impact.'}
          {tone === 'max' && 'Maximize your credit profile with premium tradelines and high-impact reporting.'}
        </p>

        {price && <div className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-[#061116]">{price}</div>}

        <div className="mt-6 grid gap-3 text-left text-sm font-medium text-[#061116]/68">
          {bullets.map((bullet) => (
            <span key={bullet} className="flex gap-3">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#9a651b]" />
              {bullet}
            </span>
          ))}
        </div>

        <PrimaryButton className="mt-7 h-12 w-full">Get Started</PrimaryButton>
      </div>
    </div>
  );
}

function ProcessStep({
  number,
  title,
  desc,
  icon: Icon,
}: {
  number: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex items-center gap-5 rounded-full border border-[#e4d2b0] bg-[#fffaf1] px-5 py-5 shadow-[0_16px_44px_rgba(6,17,22,.055)]">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#073f35] text-lg font-black text-white shadow-[0_14px_34px_rgba(7,63,53,.2)]">
        {number}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.08em] text-[#073f35]">
          <Icon size={16} className="text-[#9a651b]" />
          {title}
        </div>
        <p className="mt-1 text-sm font-medium leading-relaxed text-[#061116]/62">{desc}</p>
      </div>
    </div>
  );
}

export default function TradelineAdvantageLandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf6ee] text-[#061116] selection:bg-[#d0a33d]/25">
      <style>{`
        .fc-lux-grid {
          background-image:
            linear-gradient(rgba(7,63,53,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(7,63,53,.04) 1px, transparent 1px);
          background-size: 52px 52px;
        }
        .fc-soft-noise {
          background-image: radial-gradient(circle at 1px 1px, rgba(6,17,22,.10) 1px, transparent 0);
          background-size: 20px 20px;
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_12%_18%,rgba(7,63,53,.10),transparent_28%),radial-gradient(circle_at_86%_14%,rgba(208,163,61,.12),transparent_26%),linear-gradient(180deg,#fffaf2_0%,#fbf6ee_44%,#f7eedf_100%)]" />
      <div className="fc-lux-grid pointer-events-none fixed inset-0 z-0 opacity-65" />
      <div className="fc-soft-noise pointer-events-none fixed inset-0 z-0 opacity-[0.025]" />

      <header className="relative z-20 border-b border-[#eadcc4] bg-[#fffaf2]/76 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <a href="/" aria-label="Finely Cred home">
            <BrandLogo />
          </a>
          <nav className="hidden items-center gap-8 text-[11px] font-black uppercase tracking-[0.12em] text-[#061116]/68 lg:flex">
            <a className="transition hover:text-[#073f35]" href="/">Home</a>
            <a className="transition hover:text-[#073f35]" href="/about">About</a>
            <a className="transition hover:text-[#073f35]" href="/services">Services</a>
            <a className="transition hover:text-[#073f35]" href="/packages">Packages</a>
            <a className="transition hover:text-[#073f35]" href="/resources">Resources</a>
            <a className="transition hover:text-[#073f35]" href="/contact">Contact</a>
          </nav>
          <a
            href="#download"
            className="rounded-md bg-[#073f35] px-5 py-3 text-[11px] font-black uppercase tracking-[0.11em] text-white shadow-[0_14px_34px_rgba(7,63,53,.18)] transition hover:-translate-y-0.5 hover:bg-[#0d5a4a]"
          >
            Get the Free Guide
          </a>
        </div>
      </header>

      <section className="relative z-10 border-b border-[#eadcc4]">
        <div className="absolute left-0 bottom-0 h-[330px] w-[250px] bg-[radial-gradient(circle_at_20%_80%,rgba(7,63,53,.17),transparent_64%)]" />
        <div className="absolute right-0 top-0 h-[420px] w-[360px] bg-[radial-gradient(circle_at_80%_12%,rgba(208,163,61,.16),transparent_66%)]" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 md:px-8 lg:grid-cols-[.92fr_1.08fr] lg:py-18">
          <div className="relative z-10">
            <div className="text-[13px] font-black uppercase tracking-[0.18em] text-[#b88426]">Free Guide</div>

            <h1 className="mt-5 max-w-3xl font-serif text-[3.55rem] font-black leading-[1.03] tracking-[-0.055em] text-[#101418] md:text-[5.05rem]">
              Master Tradelines.
              <span className="block">Strengthen Credit.</span>
              <span className="block text-[#073f35]">Unlock Greater Funding.</span>
            </h1>

            <GoldDivider className="mt-6 justify-start" />

            <p className="mt-7 max-w-xl text-lg font-medium leading-relaxed text-[#061116]/70">
              The Trade Lines Advantage is your strategic blueprint for building stronger credit positioning, deeper reporting depth, and a profile that attracts serious funding.
            </p>

            <div className="mt-9 max-w-[575px]">
              <LeadForm />
            </div>
          </div>

          <div className="relative z-10 flex min-h-[560px] items-center justify-center">
            <div className="absolute bottom-12 left-1/2 h-14 w-[72%] -translate-x-1/2 rounded-full bg-[#061116]/16 blur-2xl" />
            <GuideMockup />
          </div>
        </div>
      </section>

      <section className="relative z-10 bg-[#073f35]">
        <div className="mx-auto grid max-w-7xl divide-y divide-[#d0a33d]/45 md:grid-cols-4 md:divide-x md:divide-y-0">
          <IconStat icon={Target} title="Strategic Credit Positioning" desc="" />
          <IconStat icon={BarChart3} title="Deeper Reporting Depth" desc="" />
          <IconStat icon={ShieldCheck} title="Stronger Profile Strength" desc="" />
          <IconStat icon={LineChart} title="Improved Funding Readiness" desc="" />
        </div>
      </section>

      <section id="inside" className="relative z-10 py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mx-auto mb-11 max-w-3xl text-center">
            <div className="text-[12px] font-black uppercase tracking-[0.18em] text-[#b88426]">What you'll learn inside</div>
            <h2 className="mt-4 font-serif text-4xl font-black tracking-[-0.035em] text-[#101418] md:text-5xl">
              A Comprehensive Guide to Credit & Funding Strategy
            </h2>
            <GoldDivider className="mt-5" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <LearnCard
              icon={Target}
              title="Tradeline Positioning"
              desc="Learn how to position tradelines for maximum impact on your credit profile and funding potential."
            />
            <LearnCard
              icon={BarChart3}
              title="Reporting Depth"
              desc="Understand reporting cycles, bureau visibility, and the depth that strengthens your file."
            />
            <LearnCard
              icon={ShieldCheck}
              title="Profile Strength"
              desc="Build a resilient profile that demonstrates stability, credibility, and financial strength."
            />
            <LearnCard
              icon={TrendingUp}
              title="Funding Readiness"
              desc="Position yourself to qualify for higher limits, better terms, and more funding opportunities."
            />
          </div>
        </div>
      </section>

      <section className="relative z-10 bg-[#073f35] py-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(208,163,61,.12),transparent_32%),radial-gradient(circle_at_88%_44%,rgba(15,78,120,.18),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 md:px-8 lg:grid-cols-[.92fr_1.08fr]">
          <div>
            <div className="text-[12px] font-black uppercase tracking-[0.18em] text-[#d0a33d]">Watch & Learn</div>
            <h2 className="mt-4 max-w-xl font-serif text-4xl font-black leading-tight tracking-[-0.035em] md:text-5xl">
              See How Strategic Tradelines Create Real Funding Power
            </h2>
            <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-white/72">
              In this exclusive walkthrough, discover how the right tradeline strategy can elevate your credit profile and open doors to larger funding opportunities.
            </p>
            <a
              href="#video"
              className="mt-8 inline-flex h-13 items-center justify-center rounded-md border border-[#d0a33d] px-6 text-[12px] font-black uppercase tracking-[0.12em] text-[#f4d27a] transition hover:bg-[#d0a33d]/10"
            >
              Watch Video <Play size={14} className="ml-2" fill="currentColor" />
            </a>
          </div>

          <div id="video">
            <VideoPreview />
          </div>
        </div>
      </section>

      <section id="lanes" className="relative z-10 py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <div className="text-[12px] font-black uppercase tracking-[0.18em] text-[#b88426]">Choose your advantage</div>
            <h2 className="mt-3 font-serif text-4xl font-black tracking-[-0.035em] text-[#101418] md:text-5xl">
              Tradeline Offer Lanes
            </h2>
            <GoldDivider className="mt-5" />
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <PackageCard
              title="Starter"
              tone="starter"
              price="$1,250"
              bullets={['2 Primary Tradelines', 'Verified Reporting', 'Standard Support']}
            />
            <PackageCard
              title="Boost"
              tone="boost"
              badge="Most Popular"
              price="$2,250"
              bullets={['4 Primary Tradelines', 'Enhanced Reporting Depth', 'Priority Support']}
            />
            <PackageCard
              title="Max"
              tone="max"
              price="$3,750"
              bullets={['6–8 Primary Tradelines', 'High Impact Reporting', 'VIP Support']}
            />
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-[#eadcc4] bg-[#fffaf2] py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <div className="text-[12px] font-black uppercase tracking-[0.18em] text-[#b88426]">Our proven process</div>
            <h2 className="mt-3 font-serif text-4xl font-black tracking-[-0.035em] text-[#101418] md:text-5xl">
              A Simple 3-Step Strategy
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
            <ProcessStep
              number="1"
              icon={FileText}
              title="Strategize"
              desc="We evaluate your profile and funding goals to create a custom tradeline strategy."
            />
            <ChevronRight className="mx-auto hidden text-[#b88426] lg:block" size={30} />
            <ProcessStep
              number="2"
              icon={Building2}
              title="Implement"
              desc="We add strategic tradelines that report, deepen, and strengthen your profile."
            />
            <ChevronRight className="mx-auto hidden text-[#b88426] lg:block" size={30} />
            <ProcessStep
              number="3"
              icon={Gauge}
              title="Elevate"
              desc="Your stronger profile positions you for higher limits, better terms, and more funding."
            />
          </div>
        </div>
      </section>

      <section id="download" className="relative z-10 bg-[#073f35] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_30%,rgba(208,163,61,.12),transparent_32%),radial-gradient(circle_at_90%_28%,rgba(208,163,61,.10),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 md:px-8 lg:grid-cols-[170px_1fr_460px]">
          <div className="hidden lg:block">
            <GuideMockup small />
          </div>
          <div>
            <h2 className="max-w-2xl font-serif text-4xl font-black leading-tight tracking-[-0.035em]">
              Ready to Strengthen Your Credit and Unlock Greater Funding?
            </h2>
            <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-white/72">
              Download The Trade Lines Advantage and take the first step toward a stronger profile and more funding opportunities.
            </p>
          </div>
          <div>
            <LeadForm compact source="tradeline_advantage_landing_bottom_cta" />
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-[#eadcc4] bg-[#fffaf2] px-5 py-10 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 text-sm text-[#061116]/62 md:grid-cols-[1.15fr_.8fr_.8fr_.8fr_1.1fr]">
          <div>
            <BrandLogo className="mb-4 w-[135px]" />
            <p className="max-w-[260px] text-xs leading-relaxed">
              Strategic tradeline solutions designed to strengthen credit and unlock greater funding opportunities.
            </p>
          </div>

          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.12em] text-[#073f35]">Solutions</div>
            <div className="mt-4 grid gap-2 text-xs">
              <a href="/tradelines" className="hover:text-[#073f35]">Tradelines</a>
              <a href="/business-credit" className="hover:text-[#073f35]">Business Credit</a>
              <a href="/credit-building" className="hover:text-[#073f35]">Credit Building</a>
              <a href="/funding-readiness" className="hover:text-[#073f35]">Funding Readiness</a>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.12em] text-[#073f35]">Resources</div>
            <div className="mt-4 grid gap-2 text-xs">
              <a href="/guides" className="hover:text-[#073f35]">Guides & Ebooks</a>
              <a href="/blog" className="hover:text-[#073f35]">Blog</a>
              <a href="/faqs" className="hover:text-[#073f35]">FAQs</a>
              <a href="/help" className="hover:text-[#073f35]">Help Center</a>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.12em] text-[#073f35]">Company</div>
            <div className="mt-4 grid gap-2 text-xs">
              <a href="/about" className="hover:text-[#073f35]">About Us</a>
              <a href="/process" className="hover:text-[#073f35]">Our Process</a>
              <a href="/testimonials" className="hover:text-[#073f35]">Testimonials</a>
              <a href="/contact" className="hover:text-[#073f35]">Contact Us</a>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.12em] text-[#073f35]">Stay Connected</div>
            <p className="mt-4 text-xs leading-relaxed">Get insights and updates on credit strategy and funding.</p>
            <div className="mt-4 grid grid-cols-[1fr_42px]">
              <input
                placeholder="Enter your email"
                className="h-11 rounded-l-md border border-[#d9c9aa] bg-white px-3 text-xs outline-none focus:border-[#d0a33d]"
              />
              <button className="flex h-11 items-center justify-center rounded-r-md bg-[#073f35] text-white">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-[#eadcc4] pt-6 text-[11px] text-[#061116]/45 md:flex-row">
          <p>© 2024 Finely Cred. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-[#073f35]">Privacy Policy</a>
            <a href="/terms" className="hover:text-[#073f35]">Terms of Service</a>
            <a href="/disclaimer" className="hover:text-[#073f35]">Disclaimer</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
