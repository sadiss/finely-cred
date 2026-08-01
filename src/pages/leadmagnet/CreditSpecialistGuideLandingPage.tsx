import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  CreditCard,
  Download,
  Gavel,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { LeadMagnetCobrand, LeadMagnetCobrandFooterMarks } from '../../components/brand/LeadMagnetCobrand';
import { PremiumLeadMagnetCaptureForm } from '../../components/leadmagnet/PremiumLeadMagnetCaptureForm';
import { CREDIT_SPECIALIST_GUIDE_FUNNEL } from '../../domain/leadMagnetFunnels';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { downloadCreditSpecialistOneSheet } from '../../resources/buildCreditSpecialistOneSheetPdf';
import '../../components/leadmagnet/leadMagnetLuxuryStage.css';
import {
  CS_GUIDE_CHAPTERS,
  CS_GUIDE_META,
  CS_GUIDE_PATH,
  CS_GUIDE_READ_PATH,
  CS_JOIN_PATH,
  CS_PRICING_PATH,
} from './creditSpecialistGuideContent';
import './creditSpecialistGuideLanding.css';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function GuideBookMockup({
  onOpen,
  className,
  tall,
}: {
  onOpen: () => void;
  className?: string;
  tall?: boolean;
}) {
  return (
    <div className={cn('csg-mockup-stage', tall && 'py-4 md:py-6', className)}>
      <div className="csg-mockup-glow" aria-hidden />
      <button
        type="button"
        onClick={onOpen}
        className="csg-book-btn"
        aria-label={`Open ${CS_GUIDE_META.title} in the guide reader`}
      >
        <div className="csg-book">
          <div className="csg-book-spine" aria-hidden />
          <div className="csg-book-pages" aria-hidden />
          <div className="csg-book-cover">
            <div className="relative z-10">
              <img
                src="/brand/finely-cred-logo-light.png"
                alt=""
                className="mb-4 h-8 w-auto object-contain opacity-90"
                width={120}
                height={40}
              />
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#95e000]/90">
                {CS_GUIDE_META.edition}
              </p>
              <h3 className="csg-serif mt-2 text-[1.35rem] font-semibold leading-tight text-white sm:text-[1.5rem]">
                {CS_GUIDE_META.title}
              </h3>
              <p className="mt-2 text-[10px] leading-relaxed text-white/55">{CS_GUIDE_META.tagline}</p>
            </div>
            <div className="relative z-10">
              <div className="text-[9px] uppercase tracking-[0.18em] text-white/40">Free in-app guide</div>
              <div className="mt-1 text-2xl font-black tabular-nums text-[#f0cc75]">{CS_GUIDE_META.valueLabel}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#95e000]">Open to read →</div>
            </div>
          </div>
        </div>
      </button>
      <div className="csg-book-open-hint">Click cover to open the reader</div>
      <div className="csg-mockup-pedestal" aria-hidden />
    </div>
  );
}

function MiniCheck({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[15px] leading-relaxed text-white/80">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4a447] text-[#06101f]">
        <Check size={12} strokeWidth={3} />
      </span>
      <span>{children}</span>
    </li>
  );
}

const PILLARS = [
  {
    icon: CreditCard,
    title: 'Personal credit',
    desc: 'Restore accuracy, build depth, utilization coaching, and factual dispute craft.',
  },
  {
    icon: Building2,
    title: 'Business credit',
    desc: 'Fundability pillars, vendor sequencing, and capital-pack readiness.',
  },
  {
    icon: Scale,
    title: 'Debt & laws insight',
    desc: 'Validation-first pressure response and summons education — not legal advice.',
  },
  {
    icon: TrendingUp,
    title: 'Specialist opportunity',
    desc: 'Help partners grow — funding, referrals, and craft-based financial freedom framing.',
  },
];

export default function CreditSpecialistGuideLandingPage() {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [downloadErr, setDownloadErr] = useState<string | null>(null);

  usePublicSeoMeta({
    title: `${CS_GUIDE_META.title} — Free Credit Specialist E-Guide`,
    description: CS_GUIDE_META.description,
    path: CS_GUIDE_PATH,
  });

  const openGuide = (chapterId?: string) => {
    const path = chapterId ? `${CS_GUIDE_READ_PATH}?chapter=${encodeURIComponent(chapterId)}` : CS_GUIDE_READ_PATH;
    navigate(path);
  };

  const onDownloadOneSheet = async () => {
    setDownloading(true);
    setDownloadErr(null);
    try {
      await downloadCreditSpecialistOneSheet();
    } catch (e) {
      setDownloadErr((e as Error)?.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="csg-page lm-lux-theme--navy relative min-h-screen overflow-x-hidden selection:bg-[#d4a447]/30">
      <div className="csg-atmosphere pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className="lm-lux-grain lm-lux-grain--fixed pointer-events-none" aria-hidden />

      <header className="csg-nav fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-[4.25rem] max-w-[88rem] items-center justify-between gap-4 px-5 md:px-10">
          <LeadMagnetCobrand size="sm" />
          <nav className="hidden items-center gap-7 text-[13px] font-medium text-white/70 lg:flex">
            <a href="#chapters" className="transition hover:text-[#95e000]">
              Chapters
            </a>
            <a href="#inside" className="transition hover:text-[#95e000]">
              Inside
            </a>
            <a href="#path" className="transition hover:text-[#95e000]">
              Specialist path
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => void onDownloadOneSheet()}
              disabled={downloading}
              className="csg-nav-cta hidden items-center gap-2 rounded-lg px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#e8c96a] md:inline-flex"
            >
              <Download size={14} /> {downloading ? 'Building…' : 'One-sheet'}
            </button>
            <button
              type="button"
              onClick={() => openGuide()}
              className="csg-gold-btn inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-[10px] font-black uppercase tracking-[0.14em]"
            >
              <BookOpen size={14} /> Open e-guide
            </button>
            <Link
              to={CS_JOIN_PATH}
              className="csg-ghost-btn hidden h-10 items-center justify-center rounded-lg px-3.5 text-[10px] font-black uppercase tracking-[0.14em] sm:inline-flex"
            >
              Join
            </Link>
          </div>
        </div>
      </header>

      {/* Short hero — guide + one-sheet first; join secondary */}
      <section className="relative z-10 pt-[4.25rem]">
        <div className="lm-lux-beam lm-lux-beam--accent left-[6%] top-[-6%]" aria-hidden />
        <div className="lm-lux-beam lm-lux-beam--right right-[2%] top-[10%]" aria-hidden />
        <div className="relative z-[2] mx-auto grid max-w-[88rem] items-center gap-8 px-5 pb-10 pt-8 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pb-12 lg:pt-10">
          <div>
            <p className="csg-hero-kicker text-[11px] font-bold uppercase">Free e-guide · no signup to read</p>
            <h1 className="csg-serif csg-hero-title mt-3 text-white">
              <span className="block">Master the craft.</span>
              <span className="csg-hero-title-gold mt-1 block">Grow as a specialist.</span>
            </h1>
            <div className="lm-lux-rule--short lm-lux-rule--draw mt-4" aria-hidden />
            <p className="csg-hero-lede mt-5 max-w-xl">
              Personal credit restore and build. Business fundability. Debt and laws insight. Opportunities to help
              partners — and a compliant path toward financial freedom through craft. Open the readable in-app guide
              now; download the one-sheet anytime. Join stays separate.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => openGuide()}
                className="csg-gold-btn inline-flex h-12 items-center justify-center gap-2 rounded-lg px-7 text-[11px] font-black uppercase tracking-[0.16em]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <BookOpen size={16} /> Open e-guide <ArrowRight size={16} />
                </span>
              </button>
              <button
                type="button"
                onClick={() => void onDownloadOneSheet()}
                disabled={downloading}
                className="csg-ghost-btn inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-[11px] font-black uppercase tracking-[0.14em]"
              >
                <Download size={16} /> {downloading ? 'Building…' : 'Download one-sheet'}
              </button>
              <Link
                to={CS_JOIN_PATH}
                className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45 transition hover:text-[#f0cc75]"
              >
                Pricing & join →
              </Link>
            </div>
            {downloadErr ? <p className="mt-2 text-sm text-rose-300">{downloadErr}</p> : null}
            <p className="csg-compliance mt-3">{CS_GUIDE_META.compliance}</p>
          </div>

          <div className="relative flex flex-col items-center">
            <GuideBookMockup tall onOpen={() => openGuide()} />
            <p className="mt-1 max-w-xs text-center text-sm text-white/50">
              In-app reader with real chapters — not a PDF-only ebook. Click the cover or any chapter below.
            </p>
          </div>
        </div>
      </section>

      {/* Chapter preview — near top, opens reader */}
      <section id="chapters" className="relative z-10 scroll-mt-28 border-y border-white/8 py-12 md:py-14">
        <div className="mx-auto max-w-[88rem] px-5 md:px-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="csg-kicker">
                <BookOpen size={14} /> Chapter preview
              </div>
              <h2 className="csg-serif mt-3 text-3xl font-semibold md:text-4xl">
                {CS_GUIDE_CHAPTERS.length} chapters · tap any to read
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-white/55 md:text-base">
                Preview the playbook at the top of the page. Each card opens the in-app reader on that chapter — free,
                readable, no unlock gate.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openGuide('welcome')}
              className="csg-ghost-btn inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg px-5 text-[11px] font-black uppercase tracking-[0.14em] md:self-auto"
            >
              Start chapter 1 <ArrowRight size={14} />
            </button>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {CS_GUIDE_CHAPTERS.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => openGuide(ch.id)}
                className="csg-chapter-card group rounded-2xl p-5 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={cn('text-[11px] font-black uppercase tracking-[0.2em]', `csg-accent-${ch.accent}`)}>
                    Ch {ch.number}
                  </span>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-[#95e000]"
                  />
                </div>
                <h3 className="csg-serif mt-3 text-xl text-white md:text-2xl">{ch.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/52">{ch.teaser}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section id="inside" className="relative z-10 py-14 md:py-16">
        <div className="mx-auto max-w-[88rem] px-5 md:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="csg-kicker mx-auto">
              <Sparkles size={14} /> What you&apos;ll master
            </div>
            <h2 className="csg-serif mt-4 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
              Four lanes. One specialist playbook.
            </h2>
            <p className="mt-3 text-base text-white/55">
              Depth that matches Finely Cred&apos;s luxury education — practical, compliant, and ready for partner
              conversations.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PILLARS.map((p) => (
              <div key={p.title} className="csg-pillar-card rounded-2xl p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d4a447]/35 bg-[#d4a447]/10 text-[#f0cc75]">
                  <p.icon size={22} strokeWidth={1.5} />
                </div>
                <h3 className="csg-serif mt-4 text-xl text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{p.desc}</p>
              </div>
            ))}
          </div>
          <ul className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-2">
            <MiniCheck>Teach partners with factual findings — not hype scripts.</MiniCheck>
            <MiniCheck>Sequence business fundability before capital asks.</MiniCheck>
            <MiniCheck>Respond to debt pressure with documentation discipline.</MiniCheck>
            <MiniCheck>Frame opportunity and freedom without income guarantees.</MiniCheck>
          </ul>
        </div>
      </section>

      {/* Stats / trust */}
      <section className="relative z-10 border-y border-[#d4a447]/20 py-10">
        <div className="mx-auto grid max-w-[88rem] gap-3 px-5 sm:grid-cols-2 md:px-10 lg:grid-cols-4">
          {[
            { icon: Users, value: 'Specialist-first', label: 'Built for operators' },
            { icon: ShieldCheck, value: 'Compliance-aware', label: 'Educational positioning' },
            { icon: Gavel, value: 'Court insight', label: 'Not legal advice' },
            { icon: Target, value: 'Read freely', label: 'Join when ready' },
          ].map((s) => (
            <div key={s.label} className="csg-stat-tile flex items-center gap-3.5 rounded-2xl p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d4a447]/35 bg-[#d4a447]/10 text-[#f0cc75]">
                <s.icon size={20} />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight text-white">{s.value}</div>
                <div className="text-[11px] text-white/48">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="csg-compliance mx-auto mt-4 max-w-[88rem] px-5 text-center md:px-10">
          {CS_GUIDE_META.compliance}
        </p>
      </section>

      {/* Soft optional capture — not a gate */}
      <section id="csg-capture" className="relative z-10 scroll-mt-28 py-14 md:py-16">
        <div className="mx-auto grid max-w-[88rem] items-start gap-10 px-5 md:px-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="csg-kicker">
              <Users size={14} /> Optional updates
            </div>
            <h2 className="csg-serif mt-4 text-3xl font-semibold md:text-4xl">Stay on the specialist list</h2>
            <p className="mt-3 max-w-lg text-base text-white/55">
              The e-guide and one-sheet are free without signup. Leave your details only if you want nurture tips and a
              cleaner path into pricing later — reading is never blocked.
            </p>
            <ul className="mt-6 space-y-3">
              <MiniCheck>Optional — open the reader anytime above</MiniCheck>
              <MiniCheck>Tagged as Credit Specialist guide in admin leads</MiniCheck>
              <MiniCheck>Join stays at {CS_JOIN_PATH} when you are ready</MiniCheck>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openGuide()}
                className="csg-ghost-btn inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-[11px] font-black uppercase tracking-[0.14em]"
              >
                <BookOpen size={14} /> Skip — open guide
              </button>
              <button
                type="button"
                onClick={() => void onDownloadOneSheet()}
                disabled={downloading}
                className="csg-ghost-btn inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-[11px] font-black uppercase tracking-[0.14em]"
              >
                <Download size={14} /> {downloading ? 'Building…' : 'Get one-sheet'}
              </button>
            </div>
          </div>
          <div className="csg-pillar-card rounded-2xl p-5 md:p-6">
            <PremiumLeadMagnetCaptureForm
              funnelConfig={CREDIT_SPECIALIST_GUIDE_FUNNEL}
              submitLabel="Send tips & open guide"
              successMode="callback"
              onCaptured={() => openGuide()}
            />
            <p className="mt-3 text-center text-[11px] text-white/40">{CS_GUIDE_META.compliance}</p>
          </div>
        </div>
      </section>

      {/* Path + CTA */}
      <section id="path" className="relative z-10 border-t border-white/8 py-14 md:py-16">
        <div className="mx-auto max-w-[88rem] px-5 md:px-10">
          <div className="csg-cta-panel overflow-hidden rounded-[1.65rem] p-7 md:p-10 lg:p-12">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="csg-kicker">Your path forward</div>
                <h2 className="csg-serif mt-4 text-3xl font-semibold md:text-4xl lg:text-5xl">
                  Read the playbook. Download the one-sheet. Join when ready.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/60">
                  The e-guide and one-sheet are convenient entry points — separate from signup and onboarding. When you
                  want tiers, economics, and the application, continue to the Credit Specialist join path.
                </p>
                <ol className="mt-7 space-y-3 text-sm text-white/70">
                  <li>
                    <span className="font-bold text-[#f0cc75]">1.</span> Open the in-app guide or download the one-sheet
                  </li>
                  <li>
                    <span className="font-bold text-[#f0cc75]">2.</span> Study personal, business, debt, and opportunity
                    chapters
                  </li>
                  <li>
                    <span className="font-bold text-[#f0cc75]">3.</span> Join via {CS_JOIN_PATH} for pricing & signup
                  </li>
                </ol>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openGuide()}
                    className="csg-gold-btn inline-flex h-12 items-center justify-center gap-2 rounded-lg px-7 text-[11px] font-black uppercase tracking-[0.16em]"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Open guide reader <BookOpen size={16} />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDownloadOneSheet()}
                    disabled={downloading}
                    className="csg-ghost-btn inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-[11px] font-black uppercase tracking-[0.14em]"
                  >
                    <Download size={16} /> {downloading ? 'Building…' : 'Download one-sheet'}
                  </button>
                  <Link
                    to={CS_PRICING_PATH}
                    className="inline-flex h-12 items-center justify-center px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45 transition hover:text-[#f0cc75]"
                  >
                    View pricing →
                  </Link>
                </div>
                <p className="csg-compliance mt-4">{CS_GUIDE_META.compliance}</p>
              </div>
              <GuideBookMockup onOpen={() => openGuide()} />
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-5 py-8 md:px-10">
        <div className="mx-auto flex max-w-[88rem] flex-col items-center justify-between gap-6 text-xs text-white/42 md:flex-row">
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
            <Link to={CS_JOIN_PATH} className="hover:text-[#95e000]">
              Specialist join
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Finely Cred · NCG. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
