import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Check,
  ClipboardCheck,
  CreditCard,
  Download,
  FileText,
  Gauge,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  TriangleAlert,
  User,
  Users,
} from 'lucide-react';
import { LeadMagnetCobrand, LeadMagnetCobrandFooterMarks } from '../../components/brand/LeadMagnetCobrand';
import { LeadMagnetFunnelHeroVideo } from '../../components/leadmagnet/LeadMagnetFunnelHeroVideo';
import { getLeadMagnetVisualTheme } from '../../components/leadmagnet/leadMagnetVisualThemes';
import { BUSINESS_FUNNEL } from '../../domain/leadMagnetFunnels';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { PremiumLeadMagnetCaptureForm } from '../../components/leadmagnet/PremiumLeadMagnetCaptureForm';
import './businessCreditPowerGuideLanding.css';

const BUSINESS_THEME = getLeadMagnetVisualTheme(BUSINESS_FUNNEL);

const EGUIDE_MOCKUP_SRC = '/images/lead-magnets/business-credit-power-guide-mockup.png';

/** Premium upward skyline — distinct from homepage hero */
const HERO_BG =
  'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2400&q=80';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function GuideMockup({ className, tall }: { className?: string; tall?: boolean }) {
  return (
    <div className={cn('bcpg-mockup-stack', tall && 'bcpg-mockup-stack--hero', className)}>
      <div className="bcpg-mockup-glow" aria-hidden />
      <img
        src={EGUIDE_MOCKUP_SRC}
        alt="Business Credit Power Guide preview"
        className={cn('bcpg-mockup relative z-[1]', tall ? 'bcpg-mockup--tall' : 'bcpg-mockup--hero')}
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
    <button type="button" onClick={onAction} className="bcpg-kpi-card group rounded-2xl p-6 text-left">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#95e000]/35 bg-[#95e000]/10 text-[#95e000] shadow-[0_0_28px_rgba(149,224,0,0.14)] transition group-hover:border-[#95e000]/55">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <h3 className="bcpg-serif text-xl leading-snug text-white md:text-2xl">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/55">{desc}</p>
      <span className="mt-5 inline-flex text-[10px] font-black uppercase tracking-[0.18em] text-[#d4a447] group-hover:text-[#95e000]">
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
    <div className="bcpg-kpi-card rounded-2xl p-6">
      <Icon size={30} strokeWidth={1.5} className="text-[#95e000]" />
      <p className="bcpg-serif mt-4 text-xl text-white">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/52">{desc}</p>
    </div>
  );
}

const BCPG_BUTTON =
  'bcpg-cta h-[3.25rem] w-full rounded-lg text-[11px] font-black uppercase tracking-[0.2em] text-black transition disabled:opacity-60';

function BusinessCaptureForm({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      {!compact ? (
        <div className="mb-4 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#95e000]/40 bg-[#95e000]/10 text-[#95e000] shadow-[0_0_30px_rgba(149,224,0,0.18)]">
            <Download size={26} />
          </div>
          <h2 className="bcpg-serif text-[2rem] leading-tight text-white md:text-[2.35rem]">
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
    <div className="group flex gap-6 py-9 md:gap-8 md:py-10">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#d4a447]/35 bg-[#d4a447]/8 text-[#e8c96a] shadow-[0_0_30px_rgba(212,164,71,0.12)] transition group-hover:border-[#d4a447]/55">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <div className="min-w-0 pt-1">
        <h3 className="bcpg-serif text-2xl text-white md:text-[1.75rem]">{title}</h3>
        <p className="mt-2.5 max-w-lg text-[15px] leading-relaxed text-white/55">{desc}</p>
      </div>
    </div>
  );
}

export default function BusinessCreditPowerGuideLandingPage() {
  usePublicSeoMeta({
    title: 'Business Credit Power Guide — Free E-Guide',
    description: 'Structure your business for better funding options. Premium business credit education from Finely Cred.',
    path: BUSINESS_FUNNEL.path,
  });

  const scrollToDownload = () => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' });

  const inside = [
    { icon: Building2, title: 'Business Credit Fundamentals', desc: 'What business credit is, why funders care, and how your EIN file is evaluated.' },
    { icon: ClipboardCheck, title: 'Step-by-Step Blueprint', desc: 'A disciplined sequence to build, strengthen, and leverage commercial credit.' },
    { icon: CreditCard, title: 'Vendor & Net-30 Strategy', desc: 'Starter vendors, reporting depth, and limit growth — without premature applications.' },
    { icon: ShieldCheck, title: 'Funding Readiness', desc: 'Position your entity for cleaner approvals before you apply for capital.' },
    { icon: TriangleAlert, title: 'Costly Mistakes to Avoid', desc: 'Mismatched records, thin files, and inquiry sprawl — eliminated early.' },
    { icon: TrendingUp, title: 'Growth & Leverage', desc: 'Use business credit to scale with structure, not guesswork.' },
  ];

  const tools = [
    { icon: Gauge, title: 'Business Credit Score Estimator', desc: 'Instant fundability read — educational only, no bureau pull.', cta: 'Use free tool' },
    { icon: ClipboardCheck, title: 'Vendor Approval Checklist', desc: 'Confirm entity signals before your first net-30 applications.', cta: 'Open checklist' },
    { icon: ShieldCheck, title: 'Business Credit Readiness Quiz', desc: 'See how close your file is to funding-ready optics.', cta: 'Take the quiz' },
    { icon: FileText, title: 'Dispute Letter Builder Preview', desc: 'Preview how inaccurate commercial entries get challenged.', cta: 'Try the builder' },
  ];

  return (
    <main className="bcpg-page min-h-screen overflow-x-hidden bg-[#030504] text-white selection:bg-[#95e000]/25">
      {/* Dark base + luminous green bottom glow + gold accents */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#030504]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-12%,rgba(149,224,0,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_100%_8%,rgba(212,164,71,0.14),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-[58vh] bg-[radial-gradient(ellipse_95%_75%_at_50%_100%,rgba(149,224,0,0.2),transparent_62%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[35vh] bg-[radial-gradient(ellipse_70%_55%_at_30%_100%,rgba(212,164,71,0.1),transparent_70%)]" />
      </div>

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#030504]/72 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-[88rem] items-center justify-between gap-6 px-5 md:px-10">
          <LeadMagnetCobrand size="sm" />
          <nav className="hidden items-center gap-9 text-[13px] font-medium tracking-wide text-white/72 lg:flex">
            <a href="#guide" className="transition hover:text-[#d4a447]">Business Credit</a>
            <a href="#tools" className="transition hover:text-[#d4a447]">Credit Tools</a>
            <a href="#why" className="transition hover:text-[#d4a447]">Resources</a>
            <a href="#results" className="transition hover:text-[#d4a447]">Reviews</a>
          </nav>
          <a
            href="#download"
            className="inline-flex items-center gap-2 rounded-lg border border-[#d4a447]/50 bg-transparent px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#e8c96a] transition hover:bg-[#d4a447]/10"
          >
            <Download size={14} /> Get Your Free E-Guide
          </a>
        </div>
      </header>

      {/* Hero — editorial 3-zone, mockup floats with no box */}
      <section className="relative z-10 min-h-[100svh] overflow-hidden pt-[4.5rem]">
        <div className="absolute inset-0 bg-[#030504]" />
        <div
          className="absolute inset-0 bg-cover bg-[center_30%] opacity-[0.44] grayscale-[0.15]"
          style={{ backgroundImage: `url('${HERO_BG}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030504] via-[#030504]/90 to-[#030504]/78" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030504] via-transparent to-[#030504]/35" />
        <div className="pointer-events-none absolute left-1/2 top-[38%] h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#95e000]/16 blur-[130px]" />
        <div className="absolute bottom-0 left-0 right-0 bcpg-gold-line" />

        <div className="relative mx-auto max-w-[88rem] px-5 pb-16 pt-10 md:px-10">
          {/* Top: headline + mockup */}
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-8 xl:gap-12">
            <div className="lg:w-[38%] xl:w-[36%] xl:shrink-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#95e000]">Free E-Guide</p>
              <h1 className="bcpg-serif bcpg-hero-title mt-4 text-[2.65rem] leading-[1.02] tracking-[-0.02em] text-white sm:text-[3.5rem] md:text-[4.25rem] xl:text-[5.25rem]">
                <span>Business Credit</span>
                <span className="mt-1 bg-gradient-to-r from-[#e8c96a] via-[#d4a447] to-[#c9a227] bg-clip-text text-transparent">
                  Power Guide
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-snug text-white/82 md:text-xl">
                Structure your business for better funding options in just a few steps.
              </p>
              <ul className="mt-8 space-y-3.5">
                <GoldCheck>Build stronger business credit with the right foundation.</GoldCheck>
                <GoldCheck>Access more funding opportunities with lender-ready optics.</GoldCheck>
                <GoldCheck>Position your business for long-term growth and cleaner approvals.</GoldCheck>
              </ul>
              <div className="mt-9 inline-flex items-center gap-3 rounded-xl border border-[#d4a447]/30 bg-black/35 px-4 py-3 backdrop-blur-sm">
                <Lock size={20} className="text-[#d4a447]" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d4a447]">100% Free</p>
                  <p className="text-xs text-white/55">No credit card required</p>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 items-end justify-center lg:justify-end lg:pl-0">
              <GuideMockup tall className="w-full max-w-none lg:mr-0 lg:translate-x-2 xl:translate-x-4" />
            </div>
          </div>

          {/* Bottom: signup + video */}
          <div className="mt-12 grid gap-8 lg:mt-14 lg:grid-cols-2 lg:items-stretch xl:gap-10">
            <div id="download" className="bcpg-form-panel relative z-10 rounded-2xl p-6 md:p-8">
              <BusinessCaptureForm />
            </div>
            <div className="bcpg-hero-video flex min-h-[320px] flex-col">
              <LeadMagnetFunnelHeroVideo
                config={BUSINESS_FUNNEL}
                theme={BUSINESS_THEME}
                className="h-full min-h-[320px] flex-1 rounded-2xl !aspect-auto"
                onGoForm={scrollToDownload}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust — horizontal strip, no grid boxes */}
      <section className="relative z-10 border-y border-white/[0.06] bg-black/40">
        <div className="mx-auto flex max-w-[88rem] flex-col divide-y divide-white/[0.06] md:flex-row md:divide-x md:divide-y-0">
          {[
            { icon: Users, value: '10,000+', label: 'Guides downloaded' },
            { icon: ShieldCheck, value: 'Trusted by', label: 'Entrepreneurs nationwide' },
            { icon: Target, value: 'Proven strategies', label: 'Real funding education' },
          ].map((x) => (
            <div key={x.label} className="flex flex-1 items-center justify-center gap-4 px-6 py-8">
              <x.icon size={32} strokeWidth={1.25} className="text-[#d4a447]" />
              <div>
                <p className="text-xl font-semibold text-[#95e000] md:text-2xl">{x.value}</p>
                <p className="text-sm text-white/55">{x.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Inside the guide — editorial columns, no card grid */}
      <section id="guide" className="relative z-10 py-20 md:py-28">
        <div className="mx-auto max-w-[88rem] px-5 md:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="bcpg-serif text-4xl text-white md:text-6xl">
              Inside the Business Credit <span className="text-[#95e000]">Power Guide</span>
            </h2>
            <p className="mt-5 text-lg text-white/52">
              A premium roadmap for entity hygiene, vendor depth, and funding readiness — without hype.
            </p>
          </div>
          <div className="mx-auto mt-14 max-w-5xl columns-1 md:columns-2 md:gap-x-16">
            {inside.map((item, i) => (
              <div key={item.title} className={cn(i > 0 && 'break-inside-avoid')}>
                {i > 0 ? <div className="bcpg-gold-line my-0 hidden md:block" /> : null}
                <InsideItem {...item} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools — KPI cards + floating mockup */}
      <section id="tools" className="relative z-10 overflow-hidden border-t border-[#d4a447]/15 py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_85%_50%,rgba(212,164,71,0.1),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-[radial-gradient(ellipse_80%_90%_at_50%_100%,rgba(149,224,0,0.12),transparent)]" />
        <div className="relative mx-auto max-w-[88rem] px-5 md:px-10">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-12">
            <div className="lg:w-[52%]">
              <h2 className="bcpg-serif text-4xl leading-tight text-white md:text-6xl">
                <span className="text-[#95e000]">Free</span> business credit tools
              </h2>
              <p className="mt-5 max-w-lg text-lg text-white/52">Exclusive assessments to plan your next move — unlocked with your guide.</p>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {tools.map((tool) => (
                  <ToolKpiCard key={tool.title} {...tool} onAction={scrollToDownload} />
                ))}
              </div>
            </div>
            <div className="relative flex flex-1 items-center justify-center lg:sticky lg:top-28 lg:pt-4">
              <GuideMockup className="w-full max-w-[min(100%,920px)]" />
            </div>
          </div>
        </div>
      </section>

      {/* Why — premium split with KPI cards */}
      <section id="why" className="relative z-10 py-20 md:py-28">
        <div className="absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(ellipse_90%_80%_at_50%_100%,rgba(149,224,0,0.14),transparent)]" />
        <div className="relative mx-auto max-w-[88rem] px-5 md:px-10">
          <div className="bcpg-why-panel overflow-hidden rounded-3xl p-8 md:p-12">
            <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
              <div className="lg:w-[42%]">
                <h2 className="bcpg-serif text-4xl text-white md:text-5xl lg:text-6xl">Why build business credit?</h2>
                <ul className="mt-9 space-y-4">
                  <GoldCheck>Separate personal and commercial structure with intention.</GoldCheck>
                  <GoldCheck>Qualify for higher limits and stronger terms over time.</GoldCheck>
                  <GoldCheck>Reduce reliance on personal guarantees as your file matures.</GoldCheck>
                  <GoldCheck>Increase cash-flow flexibility and strategic optionality.</GoldCheck>
                </ul>
              </div>
              <div className="flex-1">
                <p className="bcpg-serif text-3xl leading-snug text-white md:text-4xl lg:text-[2.6rem]">
                  Stronger credit. More funding.{' '}
                  <span className="bg-gradient-to-r from-[#e8c96a] to-[#95e000] bg-clip-text text-transparent">More freedom.</span>
                </p>
                <div className="mt-10 grid gap-4 sm:grid-cols-2">
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
          </div>
        </div>
      </section>

      {/* Audience — inline tags, not 6-box grid */}
      <section className="relative z-10 border-y border-white/[0.06] py-14">
        <div className="mx-auto max-w-[88rem] px-5 text-center md:px-10">
          <h2 className="bcpg-serif text-3xl text-white md:text-5xl">
            Built for ambitious <span className="text-[#95e000]">operators</span>
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {['Startups', 'Small business owners', 'Entrepreneurs', 'E-commerce brands', 'Service providers', 'Investors'].map((label) => (
              <span
                key={label}
                className="rounded-full border border-[#d4a447]/28 bg-white/[0.03] px-5 py-2.5 text-sm text-white/70"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="results" className="relative z-10 py-20 md:py-28">
        <div className="mx-auto max-w-[88rem] px-5 md:px-10">
          <h2 className="bcpg-serif text-center text-4xl text-white md:text-6xl">
            What <span className="text-[#95e000]">entrepreneurs</span> are saying
          </h2>
          <div className="mt-12 flex flex-col gap-6 lg:flex-row lg:gap-8">
            {[
              ['Marcus T.', 'E-Commerce Owner', 'This guide gave me the exact roadmap I needed to build my business credit the right way.'],
              ['Jasmine R.', 'Consultant', 'Easy to follow, packed with value, and full of actionable steps.'],
              ['David L.', 'Real Estate Investor', 'Finally, a guide that breaks everything down in simple terms.'],
            ].map(([name, role, quote]) => (
              <article key={name} className="bcpg-quote-card flex-1 rounded-2xl p-8">
                <div className="flex gap-0.5 text-[#d4a447]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="bcpg-serif mt-5 text-lg leading-relaxed text-white/78">“{quote}”</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a447]/45 to-[#95e000]/25 text-xs font-bold text-white">
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
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 overflow-hidden border-t border-[#d4a447]/22 py-16 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_0%_50%,rgba(149,224,0,0.14),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(ellipse_90%_90%_at_50%_100%,rgba(149,224,0,0.16),transparent)]" />
        <div className="relative mx-auto flex max-w-[88rem] flex-col items-center gap-10 px-5 md:px-10 lg:flex-row lg:justify-between">
          <div className="max-w-xl text-center lg:text-left">
            <ShieldCheck size={40} className="mx-auto text-[#d4a447] lg:mx-0" strokeWidth={1.25} />
            <h2 className="bcpg-serif mt-4 text-3xl leading-tight text-white md:text-5xl">
              Your business deserves better funding options.
              <span className="mt-2 block text-[#95e000]">Start with this free guide.</span>
            </h2>
          </div>
          <div className="bcpg-form-panel w-full max-w-xl rounded-2xl p-5 md:p-6">
            <BusinessCaptureForm compact />
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[0.06] bg-black/60 py-10">
        <div className="mx-auto flex max-w-[88rem] flex-col items-center gap-8 px-5 md:flex-row md:items-center md:justify-between md:px-10">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/45 md:justify-start">
            <a href="/privacy" className="hover:text-white/80">Privacy Policy</a>
            <a href="/terms" className="hover:text-white/80">Terms of Use</a>
            <a href="/contact" className="hover:text-white/80">Contact Us</a>
          </div>
          <p className="text-xs text-white/35">© {new Date().getFullYear()} Finely Cred · NCG. All rights reserved.</p>
          <div className="relative flex shrink-0 items-center justify-center">
            <div className="bcpg-fc-glow absolute inset-0 scale-150" />
            <div className="relative rounded-2xl border border-[#d4a447]/45 bg-black/55 px-4 py-2 shadow-[0_0_40px_rgba(212,164,71,0.2)]">
              <LeadMagnetCobrandFooterMarks />
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
