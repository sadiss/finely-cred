import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Download,
  FileText,
  Gauge,
  Lock,
  Mail,
  ShieldCheck,
  Target,
  TrendingUp,
  TriangleAlert,
  User,
  Users,
} from 'lucide-react';
import { submitLeadCapture } from '../data/leadsRepo';

/**
 * Business Credit Power Guide landing page
 * ------------------------------------------------------------
 * Built for the existing Finely Cred Vite/React/Tailwind site.
 * No logo is rendered in the header or footer.
 * No e-guide/e-book mockup is hard-coded.
 * A premium mockup placeholder is included on the lower-right side.
 *
 * To add the e-guide mockup later:
 * 1. Upload the image to public/images/business-credit-power-guide.png
 * 2. Set EGUIDE_MOCKUP_SRC to '/images/business-credit-power-guide.png'
 */
const EGUIDE_MOCKUP_SRC = '';

const GREEN = '#95e000';
const GOLD = '#d4a447';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function MiniCheck({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm text-white/80">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#95e000]/60 bg-[#95e000]/10 text-[#95e000] shadow-[0_0_18px_rgba(149,224,0,0.22)]">
        <CheckCircle2 size={13} />
      </span>
      <span>{children}</span>
    </div>
  );
}

function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-[1.45rem] border border-white/10 bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-br before:from-white/[0.07] before:via-transparent before:to-transparent',
        'relative overflow-hidden',
        className,
      )}
    >
      {children}
    </div>
  );
}

function IconTile({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <GlassCard className="group p-6 transition duration-300 hover:-translate-y-1 hover:border-[#95e000]/40 hover:bg-[#95e000]/[0.045]">
      <div className="relative z-10">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#95e000]/35 bg-[#95e000]/10 text-[#95e000] shadow-[0_0_22px_rgba(149,224,0,0.12)]">
          <Icon size={24} />
        </div>
        <h3 className="text-base font-semibold leading-snug text-white">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-white/58">{desc}</p>
      </div>
    </GlassCard>
  );
}

function ToolCard({
  icon: Icon,
  title,
  desc,
  cta,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <GlassCard className="p-5 transition duration-300 hover:border-[#95e000]/45 hover:bg-[#95e000]/[0.045]">
      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#95e000]/35 bg-black/35 text-[#95e000]">
          <Icon size={23} />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-2 min-h-[70px] text-xs leading-relaxed text-white/55">{desc}</p>
        <button
          type="button"
          className="mt-5 inline-flex items-center justify-center rounded-xl border border-[#95e000]/45 bg-[#95e000]/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#95e000] transition hover:bg-[#95e000] hover:text-black"
        >
          {cta}
        </button>
      </div>
    </GlassCard>
  );
}

function MockupSlot() {
  return (
    <GlassCard className="min-h-[360px] p-5 md:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_35%,rgba(149,224,0,0.16),transparent_42%),radial-gradient(circle_at_20%_100%,rgba(212,164,71,0.12),transparent_42%)]" />
      <div className="relative z-10 flex h-full min-h-[310px] items-center justify-center rounded-[1.2rem] border border-dashed border-[#95e000]/35 bg-black/25 p-8 text-center">
        {EGUIDE_MOCKUP_SRC ? (
          <img
            src={EGUIDE_MOCKUP_SRC}
            alt="Business Credit Power Guide mockup"
            className="max-h-[360px] w-full object-contain drop-shadow-[0_40px_70px_rgba(0,0,0,0.65)]"
          />
        ) : (
          <div className="mx-auto max-w-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#95e000]/40 bg-[#95e000]/10 text-[#95e000] shadow-[0_0_40px_rgba(149,224,0,0.18)]">
              <BookOpen size={30} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#95e000]">Mockup placement</p>
            <h3 className="mt-3 font-serif text-2xl text-white">Place the e-guide mockup here</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              This space is intentionally reserved for the final Business Credit Power Guide mockup. Add the image path to <span className="font-mono text-white/75">EGUIDE_MOCKUP_SRC</span> when ready.
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function LeadForm({ compact = false }: { compact?: boolean }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const emailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!fullName.trim()) {
      setStatus('error');
      setMessage('Please enter your full name.');
      return;
    }
    if (!emailOk) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('sending');
    try {
      const result = await submitLeadCapture({
        source: 'business_credit_power_guide_landing',
        offer: 'business_credit_power_guide',
        interest: 'Business Credit Power Guide',
        fullName: fullName.trim(),
        email: email.trim(),
        phone: '',
        consentToContact: true,
        consentEmailMarketing: true,
        consentSmsMarketing: false,
        metadata: {
          businessName: businessName.trim() || undefined,
          page: 'BusinessCreditPowerGuideLandingPage',
        },
      } as any);

      setStatus('sent');
      setMessage(
        result?.remote === 'ok'
          ? 'You’re in. Your guide request was received.'
          : 'You’re in. Your request was captured; connect Supabase/CRM for live delivery.',
      );
      setFullName('');
      setEmail('');
      setBusinessName('');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Something went wrong. Please try again.');
    }
  }

  return (
    <form onSubmit={onSubmit} className={cn('space-y-4', compact && 'md:flex md:items-start md:gap-3 md:space-y-0')}>
      <label className="relative block flex-1">
        <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={16} />
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full Name"
          className="h-14 w-full rounded-xl border border-white/15 bg-black/35 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#95e000]/65 focus:ring-4 focus:ring-[#95e000]/10"
          maxLength={120}
          required
        />
      </label>
      <label className="relative block flex-1">
        <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={16} />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          className="h-14 w-full rounded-xl border border-white/15 bg-black/35 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#95e000]/65 focus:ring-4 focus:ring-[#95e000]/10"
          maxLength={180}
          required
        />
      </label>
      {!compact && (
        <label className="relative block">
          <BriefcaseBusiness className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={16} />
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Business Name (Optional)"
            className="h-14 w-full rounded-xl border border-white/15 bg-black/35 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#95e000]/65 focus:ring-4 focus:ring-[#95e000]/10"
            maxLength={180}
          />
        </label>
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        className={cn(
          'group relative h-14 overflow-hidden rounded-xl bg-gradient-to-r from-[#5ea900] via-[#95e000] to-[#78c600] px-7 text-[11px] font-black uppercase tracking-[0.16em] text-black shadow-[0_16px_44px_rgba(149,224,0,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70',
          compact ? 'w-full md:w-[350px]' : 'w-full',
        )}
      >
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          <Download size={16} /> {status === 'sending' ? 'Sending...' : compact ? 'Yes! Send Me The Free Guide' : 'Download My Free Guide'}
        </span>
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition duration-700 group-hover:translate-x-full" />
      </button>
      {message && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm md:col-span-full',
            status === 'sent' ? 'border-[#95e000]/30 bg-[#95e000]/10 text-[#d8ff9b]' : 'border-amber-500/30 bg-amber-500/10 text-amber-100',
          )}
        >
          {message}
        </div>
      )}
      <div className={cn('flex items-center gap-2 text-[11px] text-white/45', compact && 'md:absolute md:mt-[66px]')}>
        <Lock size={13} className="text-[#95e000]" /> 100% Free. No spam. Unsubscribe anytime.
      </div>
    </form>
  );
}

export default function BusinessCreditPowerGuideLandingPage() {
  const guideItems = [
    {
      icon: Building2,
      title: 'Business Credit Fundamentals',
      desc: 'Understand what business credit is, why it matters, and how lenders evaluate your business.',
    },
    {
      icon: ClipboardCheck,
      title: 'Step-by-Step Blueprint',
      desc: 'A clear sequence to build, strengthen, and leverage your EIN-focused credit profile.',
    },
    {
      icon: CreditCard,
      title: 'Vendor & Net 30 Accounts',
      desc: 'Learn how to approach starter vendors, reporting accounts, and trade-line thickness without rushing.',
    },
    {
      icon: ShieldCheck,
      title: 'Funding Readiness',
      desc: 'Position your business for stronger approval optics before applying for credit products.',
    },
    {
      icon: TriangleAlert,
      title: 'Common Mistakes',
      desc: 'Avoid the costly errors that hurt approvals: mismatched records, thin files, and premature applications.',
    },
    {
      icon: TrendingUp,
      title: 'Growth & Leverage',
      desc: 'Use business credit to scale, invest, and create more options with stronger financial structure.',
    },
  ];

  const tools = [
    {
      icon: Gauge,
      title: 'Business Credit Score Estimator',
      desc: 'Get an instant estimate of your business credit strength without affecting your score.',
      cta: 'Use Free Tool',
    },
    {
      icon: ClipboardCheck,
      title: 'Vendor Approval Checklist',
      desc: 'Make sure your business is ready to get approved for Net 30 and starter vendor accounts.',
      cta: 'Download Checklist',
    },
    {
      icon: ShieldCheck,
      title: 'Business Credit Readiness Quiz',
      desc: 'Find out how ready your business is to access higher funding opportunities.',
      cta: 'Take The Quiz',
    },
    {
      icon: FileText,
      title: 'Dispute Letter Builder Preview',
      desc: 'See how easy it is to address inaccurate items on your business credit profile.',
      cta: 'Try The Builder',
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#050806] text-white selection:bg-[#95e000]/30 selection:text-white">
      {/* Global ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(149,224,0,0.13),transparent_34%),radial-gradient(circle_at_92%_20%,rgba(212,164,71,0.12),transparent_28%),linear-gradient(180deg,#050806_0%,#07100d_38%,#040705_100%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.3)_1px,transparent_1px)] [background-size:42px_42px]" />

      {/* Header: intentionally no logo */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-black/45 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
          <div className="hidden w-[180px] lg:block" aria-hidden="true" />
          <nav className="hidden items-center gap-8 text-sm text-white/82 md:flex">
            <a href="#guide" className="transition hover:text-[#95e000]">Business Credit</a>
            <a href="#tools" className="transition hover:text-[#95e000]">Credit Tools</a>
            <a href="#who" className="transition hover:text-[#95e000]">Resources</a>
            <a href="#results" className="transition hover:text-[#95e000]">Reviews</a>
          </nav>
          <a
            href="#download"
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-[#95e000]/45 bg-[#95e000]/8 px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#95e000] transition hover:bg-[#95e000] hover:text-black md:ml-0"
          >
            <Download size={15} /> Get Your Free E-Guide
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 min-h-[820px] overflow-hidden border-b border-[#d4a447]/20 pt-28">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2200&q=80')] bg-cover bg-center opacity-35 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050806] via-[#050806]/90 to-[#050806]/76" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050806] via-transparent to-transparent" />
        <div className="absolute left-1/2 top-[43%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#95e000]/18 blur-[140px]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4a447]/55 to-transparent" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-20 md:px-8 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <div className="max-w-3xl pt-10 lg:pt-16">
            <div className="mb-5 inline-flex rounded-full border border-[#95e000]/45 bg-[#95e000]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#95e000]">
              Free E-Guide
            </div>
            <h1 className="font-serif text-6xl leading-[0.95] tracking-[-0.045em] text-white md:text-8xl">
              Business Credit
              <span className="block bg-gradient-to-r from-[#95e000] via-[#b8ff2f] to-[#6fbd00] bg-clip-text text-transparent">Power Guide</span>
            </h1>
            <p className="mt-7 max-w-xl text-2xl leading-snug text-white/88">
              Structure Your Business for Better Funding Options in Just a Few Steps
            </p>
            <div className="mt-8 grid max-w-xl gap-4">
              <MiniCheck>Build stronger business credit with the right foundation.</MiniCheck>
              <MiniCheck>Access more funding opportunities by improving lender optics.</MiniCheck>
              <MiniCheck>Position your business for long-term growth and cleaner approvals.</MiniCheck>
              <MiniCheck>Follow a proven, step-by-step blueprint before you apply.</MiniCheck>
            </div>
            <GlassCard className="mt-9 inline-flex items-center gap-4 px-5 py-4">
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#95e000]/40 bg-[#95e000]/10 text-[#95e000]">
                <Lock size={22} />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-black uppercase tracking-[0.12em] text-[#d4a447]">100% Free</p>
                <p className="text-sm text-white/65">No Credit Card Required</p>
              </div>
            </GlassCard>
          </div>

          <GlassCard id="download" className="mx-auto w-full max-w-md border-[#95e000]/35 p-7 md:p-9 lg:mt-10">
            <div className="relative z-10 text-center">
              <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-[#95e000]/55 bg-[#95e000]/10 text-[#95e000] shadow-[0_0_40px_rgba(149,224,0,0.18)]">
                <Download size={36} />
              </div>
              <h2 className="font-serif text-4xl leading-tight text-white">
                Get Your <span className="text-[#95e000]">FREE</span><br />E-Guide Now
              </h2>
              <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-white/60">
                Instant access. Actionable strategies. Stronger business credit starts here.
              </p>
            </div>
            <div className="relative z-10 mt-7">
              <LeadForm />
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Trust bar */}
      <section className="relative z-10 border-y border-[#d4a447]/20 bg-black/28">
        <div className="mx-auto grid max-w-7xl divide-y divide-white/10 px-5 py-7 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-8">
          {[
            { icon: Users, value: '10,000+', label: 'Guides Downloaded' },
            { icon: ShieldCheck, value: 'Trusted by', label: 'Entrepreneurs Nationwide' },
            { icon: Target, value: 'Proven Strategies', label: 'Real Funding Results' },
          ].map((x) => (
            <div key={x.label} className="flex items-center justify-center gap-4 py-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#95e000]/40 bg-[#95e000]/10 text-[#95e000]">
                <x.icon size={25} />
              </div>
              <div>
                <p className="text-xl font-semibold text-[#95e000]">{x.value}</p>
                <p className="text-sm text-white/62">{x.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Guide contents */}
      <section id="guide" className="relative z-10 py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-4xl leading-tight text-white md:text-5xl">
              Everything You Need to Build, Strengthen & Leverage Your <span className="text-[#95e000]">Business Credit</span>
            </h2>
            <p className="mt-4 text-white/58">
              The Power Guide gives you the roadmap to unlock better funding, build credibility, and position your business for growth.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {guideItems.map((item) => (
              <IconTile key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* Free tools + mockup slot */}
      <section id="tools" className="relative z-10 border-y border-[#d4a447]/20 bg-black/25 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:px-8 lg:grid-cols-[1.08fr_.92fr] lg:items-stretch">
          <div>
            <div className="mb-8">
              <h2 className="font-serif text-4xl text-white md:text-5xl">
                <span className="text-[#95e000]">FREE</span> Business Credit Tools & Resources
              </h2>
              <p className="mt-3 max-w-2xl text-white/58">
                Exclusive tools to help you assess, plan, and take action — 100% free.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {tools.map((tool) => (
                <ToolCard key={tool.title} {...tool} />
              ))}
            </div>
          </div>

          <div className="lg:pt-3">
            <MockupSlot />
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="relative z-10 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:px-8 lg:grid-cols-[.78fr_1.22fr]">
          <div>
            <h2 className="font-serif text-4xl text-white">Why Build Business Credit?</h2>
            <div className="mt-6 grid gap-3">
              <MiniCheck>Separate your personal and business credit structure.</MiniCheck>
              <MiniCheck>Qualify for higher limits and better terms.</MiniCheck>
              <MiniCheck>Access funding without leaning only on personal guarantees.</MiniCheck>
              <MiniCheck>Increase cash flow and business flexibility.</MiniCheck>
              <MiniCheck>Strengthen your business for long-term success.</MiniCheck>
            </div>
          </div>
          <GlassCard className="p-7">
            <div className="relative z-10 text-center">
              <h3 className="font-serif text-3xl text-white">Stronger Credit. More Funding. More Freedom.</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
                Business credit opens doors to financing, vendor terms, and opportunities that help you grow on your terms.
              </p>
            </div>
            <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: CreditCard, t: 'Higher Limits', d: 'Qualify for more funding' },
                { icon: BarChart3, t: 'Lower Interest', d: 'Save more over time' },
                { icon: ShieldCheck, t: 'Better Terms', d: 'Improve cash flow flexibility' },
                { icon: Target, t: 'More Opportunities', d: 'Scale with confidence' },
              ].map((x) => (
                <div key={x.t} className="rounded-2xl border border-white/10 bg-black/25 p-5 text-center">
                  <x.icon className="mx-auto text-[#95e000]" size={28} />
                  <p className="mt-4 font-semibold text-white">{x.t}</p>
                  <p className="mt-2 text-xs text-white/55">{x.d}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Who */}
      <section id="who" className="relative z-10 pb-12">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <GlassCard className="p-7">
            <h2 className="relative z-10 text-center font-serif text-4xl text-white">
              Who Is <span className="text-[#95e000]">This Guide</span> For?
            </h2>
            <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {[
                { icon: TrendingUp, t: 'Startups', d: 'Building a strong foundation' },
                { icon: Building2, t: 'Small Business Owners', d: 'Looking for more funding' },
                { icon: User, t: 'Entrepreneurs', d: 'Ready to scale their business' },
                { icon: CreditCard, t: 'E-Commerce Brands', d: 'Needing vendor credit' },
                { icon: BriefcaseBusiness, t: 'Service Providers', d: 'Building business credibility' },
                { icon: Users, t: 'Investors', d: 'Growing their portfolio' },
              ].map((x) => (
                <div key={x.t} className="rounded-2xl border border-white/10 bg-black/25 p-4 text-center">
                  <x.icon className="mx-auto text-[#95e000]" size={28} />
                  <p className="mt-3 text-sm font-semibold text-white">{x.t}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/48">{x.d}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Reviews */}
      <section id="results" className="relative z-10 pb-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 className="text-center font-serif text-4xl text-white md:text-5xl">
            What <span className="text-[#95e000]">Entrepreneurs</span> Are Saying
          </h2>
          <div className="mt-9 grid gap-6 md:grid-cols-3">
            {[
              ['Marcus T.', 'E-Commerce Owner', 'This guide gave me the exact roadmap I needed to build my business credit the right way.'],
              ['Jasmine R.', 'Consultant', 'Easy to follow, packed with value, and full of actionable steps.'],
              ['David L.', 'Real Estate Investor', 'Finally, a guide that breaks everything down in simple terms.'],
            ].map(([name, role, quote]) => (
              <GlassCard key={name} className="p-6">
                <div className="relative z-10">
                  <p className="text-3xl leading-none text-[#95e000]">“</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{quote}</p>
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="font-semibold text-white">— {name}</p>
                    <p className="text-xs text-white/45">{role}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 border-t border-[#95e000]/25 bg-[radial-gradient(circle_at_10%_0%,rgba(149,224,0,0.20),transparent_34%),linear-gradient(90deg,rgba(149,224,0,0.14),rgba(0,0,0,0.30))] py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:px-8 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
          <div className="flex items-start gap-5">
            <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-[#95e000]/35 bg-[#95e000]/10 text-[#95e000] md:flex">
              <ShieldCheck size={50} />
            </div>
            <div>
              <h2 className="font-serif text-4xl leading-tight text-white">
                Your Business Deserves Better Funding Options.
                <span className="block text-[#95e000]">Start with This FREE Guide.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65">
                Download your FREE Business Credit Power Guide today and take the first step toward stronger credit, more funding, and lasting freedom.
              </p>
            </div>
          </div>
          <GlassCard className="p-5 md:p-6">
            <div className="relative z-10">
              <LeadForm compact />
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Footer: intentionally no logo */}
      <footer className="relative z-10 border-t border-white/8 bg-black/70 px-5 py-8 text-xs text-white/45 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="hidden md:block" aria-hidden="true" />
          <div className="flex items-center gap-6">
            <a href="/privacy" className="hover:text-white">Privacy Policy</a>
            <a href="/terms" className="hover:text-white">Terms of Use</a>
            <a href="/contact" className="hover:text-white">Contact Us</a>
          </div>
          <p>© 2024. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
