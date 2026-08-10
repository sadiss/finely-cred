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
  Play,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import { submitLeadCapture } from '../data/leadsRepo';

/**
 * Debt eradication lead magnet landing page — Enterprise V2
 * ------------------------------------------------------------
 * Built for the existing Finely Cred Vite / React / Tailwind site.
 *
 * Brand request honored:
 * - No logo is rendered in the page header.
 * - No logo is rendered in the footer.
 * - The fallback e-guide mockup has no brand logo on the book.
 * - The hero is dark navy / gold, cinematic, premium, and conversion-focused.
 * - A video section is included directly below the hero.
 *
 * Optional assets:
 * - Add your final clean e-guide mockup image to /public/images/debt-eradication-guide.png
 * - Set GUIDE_MOCKUP_SRC below to '/images/debt-eradication-guide.png'
 * - Add a video thumbnail to /public/images/debt-video-thumbnail.jpg
 * - Set VIDEO_THUMBNAIL_SRC below to '/images/debt-video-thumbnail.jpg'
 */

const GUIDE_MOCKUP_SRC = '';
const VIDEO_THUMBNAIL_SRC = '';
const VIDEO_EMBED_URL = '';

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
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#d7a73f]/35 bg-[#d7a73f]/10 text-[#f4d273]">
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

function LeadCaptureForm({
  compact = false,
  source = 'debt_eradication_landing',
}: {
  compact?: boolean;
  source?: string;
}) {
  const [firstName, setFirstName] = useState('');
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
      const fullName = firstName.trim() || 'Debt Freedom Lead';

      const result = await submitLeadCapture({
        source,
        offer: 'annihilate_your_debt_free_guide',
        interest: 'Debt eradication guide: collections, summons, foreclosure, bankruptcy',
        fullName,
        email: email.trim(),
        phone: '',
        consentToContact: true,
        consentEmailMarketing: true,
        consentSmsMarketing: false,
        metadata: {
          page: 'DebtEradicationLandingPage',
          guide: 'Annihilate Your Debt',
          funnel: 'debt_lead_magnet',
        },
      } as any);

      setStatus('sent');
      setMessage(
        result?.remote === 'ok'
          ? 'You are in. Your free guide request was received.'
          : 'You are in. The request was captured. Connect Supabase/CRM for live delivery.',
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
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-[1fr_220px]">
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
        {message && (
          <div className={cn('md:col-span-2 rounded-xl border px-4 py-3 text-sm', status === 'sent' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100' : 'border-amber-400/30 bg-amber-400/10 text-amber-100')}>
            {message}
          </div>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <InputShell icon={User}>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
            className="h-14 w-full rounded-xl border border-white/12 bg-white/[0.93] pl-11 pr-4 text-sm text-[#06101f] outline-none ring-0 transition placeholder:text-slate-500 focus:border-[#f4d273] focus:ring-4 focus:ring-[#d7a73f]/15"
            maxLength={120}
          />
        </InputShell>
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
      </div>
      <GoldButton type="submit" disabled={status === 'sending'} className="w-full">
        {status === 'sending' ? 'Sending...' : 'Get My Free Guide'} <ArrowRight size={16} />
      </GoldButton>
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">
        <span className="inline-flex items-center gap-1.5"><Lock size={13} className="text-[#d7a73f]" /> 100% free</span>
        <span className="h-1 w-1 rounded-full bg-[#d7a73f]" />
        <span>No spam</span>
        <span className="h-1 w-1 rounded-full bg-[#d7a73f]" />
        <span>Instant access</span>
      </div>
      {message && (
        <div className={cn('rounded-xl border px-4 py-3 text-sm', status === 'sent' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100' : 'border-amber-400/30 bg-amber-400/10 text-amber-100')}>
          {message}
        </div>
      )}
    </form>
  );
}

function GuideMockup() {
  if (GUIDE_MOCKUP_SRC) {
    return (
      <img
        src={GUIDE_MOCKUP_SRC}
        alt="Annihilate Your Debt guide mockup"
        className="relative z-10 mx-auto max-h-[620px] w-full object-contain drop-shadow-[0_60px_95px_rgba(0,0,0,0.75)]"
      />
    );
  }

  return (
    <div className="relative mx-auto h-[540px] w-[350px] max-w-full [perspective:1300px] sm:h-[610px] sm:w-[395px]">
      <div className="absolute -inset-12 rounded-full bg-[#d7a73f]/18 blur-[70px]" />
      <div className="absolute bottom-6 left-1/2 h-12 w-[88%] -translate-x-1/2 rounded-full bg-black/70 blur-2xl" />

      <div className="relative h-full w-full origin-left rotate-y-[-11deg] rounded-r-[1.4rem] rounded-l-md border border-[#f4d273]/40 bg-[#f8f3e7] shadow-[34px_44px_100px_rgba(0,0,0,0.66)] [transform-style:preserve-3d]">
        <div className="absolute -left-[34px] top-0 h-full w-[44px] rounded-l-lg border-y border-l border-[#f4d273]/25 bg-gradient-to-b from-[#071b33] via-[#031326] to-[#071b33] shadow-[inset_-10px_0_18px_rgba(0,0,0,0.42)]">
          <div className="absolute left-1/2 top-24 -translate-x-1/2 rotate-90 whitespace-nowrap text-[12px] font-black uppercase tracking-[0.18em] text-white/85">
            Eradicate The Debt
          </div>
          <div className="absolute left-1/2 bottom-24 -translate-x-1/2 rotate-90 whitespace-nowrap text-[12px] font-black uppercase tracking-[0.18em] text-[#d7a73f]">
            Reclaim Your Future
          </div>
        </div>

        <div className="absolute inset-0 overflow-hidden rounded-r-[1.4rem] rounded-l-md">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_45%,rgba(255,255,255,0.98),rgba(248,243,231,0.98)_44%,rgba(228,219,201,0.96)_100%)]" />
          <div className="absolute -right-14 top-0 h-[105%] w-[47%] skew-x-[-18deg] bg-gradient-to-b from-[#081d38] via-[#041326] to-[#061a33]" />
          <div className="absolute right-[38%] top-0 h-full w-1 skew-x-[-18deg] bg-gradient-to-b from-[#f4d273] via-[#b87921] to-[#f4d273]" />
          <div className="absolute bottom-0 left-0 h-[95px] w-full bg-gradient-to-r from-[#061a33] via-[#031326] to-[#061a33]" />
          <div className="absolute bottom-[78px] left-0 h-[3px] w-full bg-gradient-to-r from-transparent via-[#d7a73f] to-transparent" />

          <div className="absolute right-0 top-[145px] h-[340px] w-[230px] rotate-[-20deg]">
            <div className="absolute left-[44%] top-0 h-full w-[46px] rounded-full bg-gradient-to-r from-[#885113] via-[#ffe08a] to-[#9b681b] shadow-[0_0_38px_rgba(215,167,63,0.55)]" />
            <div className="absolute left-[15%] top-[40px] h-[70px] w-[110px] rotate-[18deg] rounded-[42px] border-[21px] border-[#d7a73f] shadow-[inset_0_0_20px_rgba(0,0,0,0.34),0_0_20px_rgba(215,167,63,0.33)]" />
            <div className="absolute left-[40%] top-[118px] h-[78px] w-[118px] rotate-[18deg] rounded-[46px] border-[22px] border-[#f1c55b] shadow-[inset_0_0_20px_rgba(0,0,0,0.32),0_0_24px_rgba(215,167,63,0.4)]" />
            <div className="absolute left-[9%] top-[205px] h-[78px] w-[120px] rotate-[18deg] rounded-[46px] border-[22px] border-[#b9781f] shadow-[inset_0_0_20px_rgba(0,0,0,0.34),0_0_22px_rgba(215,167,63,0.36)]" />
            <div className="absolute left-[42%] top-[284px] h-[78px] w-[118px] rotate-[18deg] rounded-[46px] border-[22px] border-[#f4d273] shadow-[inset_0_0_18px_rgba(0,0,0,0.3),0_0_28px_rgba(215,167,63,0.4)]" />
          </div>

          <div className="absolute right-[134px] top-[218px] h-24 w-24 rounded-full bg-[#f7c24a]/40 blur-2xl" />
          {Array.from({ length: 16 }).map((_, idx) => (
            <span
              key={idx}
              className="absolute h-2 w-2 rotate-45 bg-[#d7a73f] shadow-[0_0_16px_rgba(215,167,63,0.82)]"
              style={{
                left: `${58 + (idx % 5) * 7}%`,
                top: `${18 + Math.floor(idx / 5) * 12 + (idx % 2) * 5}%`,
                transform: `rotate(${idx * 19}deg) scale(${0.75 + (idx % 3) * 0.35})`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex h-full flex-col p-8 sm:p-9">
          <div className="self-start rounded-md bg-[#041326] px-4 py-2 text-[11px] font-black uppercase tracking-[0.26em] text-[#f4d273]">
            Free Guide
          </div>

          <div className="mt-8 max-w-[270px]">
            <h3 className="text-[44px] font-black uppercase leading-[0.88] tracking-[-0.045em] text-[#031326] sm:text-[52px]">
              Eradicate
              <span className="mt-2 block text-[28px] tracking-[0.08em] sm:text-[32px]">The Debt.</span>
              <span className="mt-2 block text-[44px] sm:text-[52px]">Reclaim</span>
              <span className="mt-1 block text-[32px] sm:text-[40px]">Your Future.</span>
            </h3>
            <div className="mt-5 h-px w-full bg-gradient-to-r from-[#d7a73f] via-[#d7a73f] to-transparent" />
            <p className="mt-4 text-[34px] font-black uppercase leading-none text-[#d7a73f] sm:text-[38px]">
              Build
              <span className="block">Financial Freedom</span>
            </p>
            <p className="mt-4 max-w-[245px] text-[12px] font-semibold leading-relaxed text-[#06101f]/82">
              A strategic guide to confronting collections, debt summons, foreclosure pressure, bankruptcy, charge-offs, and high-stakes debt challenges.
            </p>
          </div>

          <div className="mt-auto grid max-w-[270px] gap-2 pb-[72px] text-[10px] font-bold text-[#06101f]">
            {[
              ['Collections and Charge-Offs', 'Stop aggressive tactics'],
              ['Debt Summons Response', 'Protect your rights'],
              ['Foreclosure Pressure Relief', 'Keep your home where possible'],
              ['Bankruptcy Guidance', 'Understand your options'],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-center gap-2 border-b border-[#06101f]/14 pb-1.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#061a33] text-[#d7a73f]">
                  <ShieldCheck size={16} />
                </span>
                <span>
                  <span className="block leading-none">{title}</span>
                  <span className="text-[9px] text-[#06101f]/62">{desc}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="absolute bottom-6 left-8 right-8 flex items-center gap-3 rounded-2xl bg-[#061a33] px-4 py-3 text-white shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
            <Lock className="text-[#d7a73f]" size={22} />
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/65">Your roadmap to</div>
              <div className="text-sm font-black uppercase tracking-[0.06em] text-[#f4d273]">Debt freedom starts now.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoPreview() {
  const handleClick = () => {
    if (VIDEO_EMBED_URL) {
      window.open(VIDEO_EMBED_URL, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative block w-full overflow-hidden rounded-[1.4rem] border border-[#d7a73f]/35 bg-[#071b33] text-left shadow-[0_30px_80px_rgba(0,0,0,0.36)]"
      aria-label="Watch debt freedom video"
    >
      <div className="relative aspect-video overflow-hidden">
        {VIDEO_THUMBNAIL_SRC ? (
          <img src={VIDEO_THUMBNAIL_SRC} alt="Debt freedom video" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_42%,rgba(215,167,63,0.46),transparent_32%),linear-gradient(135deg,#050b14,#071b33_48%,#020712)]">
            <div className="absolute left-[5%] top-[58%] h-[44px] w-[95%] -rotate-12 rounded-full bg-gradient-to-r from-transparent via-[#d7a73f]/70 to-transparent blur-sm" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_45%,rgba(244,210,115,0.20),transparent_34%)]" />
            <div className="absolute inset-x-6 bottom-6 h-px bg-gradient-to-r from-transparent via-[#f4d273]/55 to-transparent" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/12 to-transparent" />
        <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#f4d273]/70 bg-black/38 text-[#f4d273] shadow-[0_0_55px_rgba(215,167,63,0.36)] backdrop-blur-md transition duration-300 group-hover:scale-105 group-hover:bg-[#d7a73f] group-hover:text-[#06101f]">
          <Play size={36} fill="currentColor" className="ml-1" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-4 px-5 pb-4 text-xs font-semibold text-white/80">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"><Play size={14} fill="currentColor" /></span>
          <span className="h-1 flex-1 rounded-full bg-white/18">
            <span className="block h-full w-[58%] rounded-full bg-[#d7a73f]" />
          </span>
          <span>1:45</span>
        </div>
      </div>
    </button>
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
    <div className="group relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-6 text-center transition duration-300 hover:-translate-y-1 hover:border-[#d7a73f]/45 hover:bg-[#d7a73f]/[0.055]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d7a73f]/70 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d7a73f]/45 bg-[#d7a73f]/10 text-[#f4d273] shadow-[0_0_30px_rgba(215,167,63,0.14)]">
        <Icon size={31} />
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
    <GlassPanel className="p-6">
      <div className="flex gap-1 text-[#f4d273]">
        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
      </div>
      <p className="mt-5 text-sm leading-relaxed text-white/74">"{quote}"</p>
      <div className="mt-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#d7a73f]/50 bg-gradient-to-br from-[#f4d273] to-[#8b5a16] text-[#06101f]">
          <User size={24} />
        </div>
        <div>
          <div className="font-semibold text-white">- {name}</div>
          <div className="text-xs text-white/48">{role}</div>
        </div>
      </div>
    </GlassPanel>
  );
}

export default function DebtEradicationLandingPage() {
  const discoveries = [
    {
      icon: Gavel,
      title: 'Crush Collections',
      desc: 'Stop creditor harassment, collection pressure, and chaos with a clearer response plan.',
    },
    {
      icon: Home,
      title: 'Wipe Out Foreclosure Fear',
      desc: 'Understand the pressure points and learn the next moves to protect your home where possible.',
    },
    {
      icon: Scale,
      title: 'Navigate Bankruptcy',
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
    { icon: BadgeCheck, value: '98%', label: 'Action Plan Clarity' },
    { icon: Star, value: '4.9/5', label: 'Average Rating' },
    { icon: Lock, value: '100%', label: 'Free. No Obligation.' },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#020812] text-white selection:bg-[#d7a73f]/30 selection:text-white">
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
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-6 px-5 py-7 md:px-8">
          <div className="hidden items-center gap-8 text-xs font-black uppercase tracking-[0.16em] text-white/72 md:flex">
            <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-[#d7a73f]" /> 100% Free</span>
            <span className="inline-flex items-center gap-2"><Zap size={15} className="text-[#d7a73f]" /> Instant Access</span>
            <span className="inline-flex items-center gap-2"><Lock size={15} className="text-[#d7a73f]" /> No Spam</span>
          </div>
        </div>
      </header>

      <section className="relative z-10 border-b border-[#d7a73f]/25 pb-12">
        <div className="fc-hero-vignette absolute inset-0 bg-[radial-gradient(circle_at_74%_58%,rgba(215,167,63,0.26),transparent_28%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d7a73f]/75 to-transparent" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 md:px-8 lg:grid-cols-[0.96fr_1.04fr]">
          <div className="relative z-10 pt-6 lg:pt-12">
            <SectionKicker>The ultimate roadmap to financial freedom</SectionKicker>

            <h1 className="mt-8 max-w-3xl font-serif text-[3.35rem] font-black leading-[0.98] tracking-[-0.055em] text-white md:text-[5.7rem]">
              Annihilate Your Debt.
              <span className="block text-[#f4d273]">Take Back Control.</span>
              <span className="block">Build Your Future.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl">
              Crush collections, wipe out foreclosures, destroy bankruptcy fear, and rebuild stronger with the ultimate step-by-step system.
            </p>

            <div className="mt-9 grid gap-5 sm:grid-cols-3">
              <TinyProof icon={Gavel} title="Crush Debt" desc="Eliminate pressure and create a cleaner path forward." />
              <TinyProof icon={ShieldCheck} title="Protect Assets" desc="Safeguard your home, income, and future options." />
              <TinyProof icon={TrendingUp} title="Rebuild Stronger" desc="Create lasting structure after the storm." />
            </div>

            <GlassPanel glow className="mt-9 max-w-xl border-[#d7a73f]/25 p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black uppercase tracking-[0.06em] text-white">
                  Get Your <span className="text-[#f4d273]">Free</span> Guide Now
                </h2>
                <ArrowRight className="hidden rotate-45 text-[#d7a73f] sm:block" size={34} />
              </div>
              <LeadCaptureForm />
            </GlassPanel>
          </div>

          <div className="relative z-10 flex min-h-[620px] items-center justify-center lg:min-h-[760px]">
            <div className="absolute left-1/2 top-[54%] h-[120px] w-[75%] -translate-x-1/2 rounded-[50%] bg-black/55 blur-2xl" />
            <div className="absolute bottom-14 left-1/2 h-[96px] w-[66%] -translate-x-1/2 rounded-[50%] border border-[#d7a73f]/30 bg-gradient-to-r from-[#061326] via-[#101f31] to-[#061326] shadow-[0_22px_90px_rgba(0,0,0,0.55)]" />
            <GuideMockup />
          </div>
        </div>
      </section>

      <section className="relative z-10 border-b border-[#d7a73f]/20 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <VideoPreview />
          <div>
            <SectionKicker>Exclusive video</SectionKicker>
            <h2 className="mt-5 font-serif text-4xl font-black leading-tight tracking-[-0.035em] md:text-6xl">
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

      <section id="inside-guide" className="relative z-10 py-18 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mx-auto mb-11 max-w-3xl text-center">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#d7a73f]">What you will discover inside</div>
            <h2 className="mt-3 font-serif text-4xl font-black tracking-[-0.035em] md:text-5xl">
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
            <h2 className="mt-3 font-serif text-4xl font-black tracking-[-0.035em] md:text-5xl">Stories of Freedom and Relief</h2>
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
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[1.65rem] border border-[#d7a73f]/45 bg-gradient-to-r from-[#061326] via-[#071b33] to-[#11100a] shadow-[0_34px_120px_rgba(0,0,0,0.55)]">
          <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative min-h-[240px] overflow-hidden p-8 md:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_40%,rgba(215,167,63,0.45),transparent_28%),linear-gradient(135deg,rgba(215,167,63,0.12),transparent_45%)]" />
              <div className="absolute -left-10 top-20 h-12 w-[120%] -rotate-12 bg-gradient-to-r from-transparent via-[#f4d273]/70 to-transparent blur-sm" />
              <div className="relative z-10">
                <div className="text-[12px] font-black uppercase tracking-[0.22em] text-[#d7a73f]">Your roadmap to</div>
                <h2 className="mt-2 font-serif text-4xl font-black leading-tight md:text-5xl">
                  Debt Freedom
                  <span className="block text-[#f4d273]">Starts Now.</span>
                </h2>
              </div>
            </div>
            <div className="p-8 md:p-10">
              <h3 className="text-2xl font-black uppercase tracking-[0.07em] text-[#f4d273]">Get Instant Access to Your Free Guide</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/58">Join people who are crushing debt pressure and building a better future.</p>
              <div className="mt-6">
                <LeadCaptureForm compact source="debt_eradication_landing_bottom_cta" />
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
          <p>© 2024. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
