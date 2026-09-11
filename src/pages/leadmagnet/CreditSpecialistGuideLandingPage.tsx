import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  CreditCard,
  Gavel,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { LeadMagnetCobrandFooterMarks } from '../../components/brand/LeadMagnetCobrand';
import { CreditSpecialistGuideActions } from '../../components/creditSpecialist/CreditSpecialistGuideActions';
import { CreditSpecialistGuideBookMockup } from '../../components/creditSpecialist/CreditSpecialistGuideBookMockup';
import { PremiumLeadMagnetCaptureForm } from '../../components/leadmagnet/PremiumLeadMagnetCaptureForm';
import { getLeadMagnetPremiumProfile } from '../../components/leadmagnet/leadMagnetPremiumProfiles';
import { CREDIT_SPECIALIST_GUIDE_FUNNEL } from '../../domain/leadMagnetFunnels';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import '../../components/leadmagnet/leadMagnetLuxuryStage.css';
import {
  CS_GUIDE_CHAPTERS,
  CS_GUIDE_META,
  CS_GUIDE_PATH,
  CS_GUIDE_READ_PATH,
  CS_JOIN_PATH,
} from './creditSpecialistGuideContent';
import './creditSpecialistGuideLanding.css';
import '../../components/leadmagnet/leadMagnetConvert.css';

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
    <CreditSpecialistGuideBookMockup
      title={CS_GUIDE_META.title}
      edition={CS_GUIDE_META.edition}
      tagline={CS_GUIDE_META.tagline}
      valueLabel={CS_GUIDE_META.valueLabel}
      onOpen={onOpen}
      className={className}
      tall={tall}
    />
  );
}

function MiniCheck({ children }: { children: React.ReactNode }) {
  return (
    <li className="csg-mini-check flex items-start gap-3 text-[15px] leading-relaxed">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-[#06101f]">
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
    desc: 'Restore accuracy, build depth, coach utilization, and write factual dispute findings.',
  },
  {
    icon: Building2,
    title: 'Business credit',
    desc: 'Fundability pillars, vendor sequencing, and a capital pack funders can verify.',
  },
  {
    icon: Scale,
    title: 'Debt & laws insight',
    desc: 'Validation-first pressure response and summons education — not legal advice.',
  },
  {
    icon: TrendingUp,
    title: 'Specialist opportunity',
    desc: 'Help partners grow through funding, referrals, and craft — without income promises.',
  },
];

export default function CreditSpecialistGuideLandingPage() {
  const navigate = useNavigate();

  usePublicSeoMeta({
    title: `${CS_GUIDE_META.title} — free Credit Specialist e-guide`,
    description: CS_GUIDE_META.description,
    path: CS_GUIDE_PATH,
    faqs: getLeadMagnetPremiumProfile(CREDIT_SPECIALIST_GUIDE_FUNNEL)?.faqs,
  });

  const firstChapterId = CS_GUIDE_CHAPTERS[0]?.id;
  const openPreview = () => navigate(`${CS_GUIDE_READ_PATH}?preview=1`);
  const openOrCapture = (chapterId?: string) => {
    if (!chapterId || chapterId === firstChapterId) {
      openPreview();
      return;
    }
    document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="csg-page lm-convert-page lm-lux-theme--navy relative min-h-screen overflow-x-hidden bg-[#f4f7fb] text-[#0a1628] selection:bg-violet-400/30">
      <div className="csg-atmosphere pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className="lm-lux-grain lm-lux-grain--fixed pointer-events-none" aria-hidden />

      {/* Site nav owns branding — hero opens under fixed public chrome */}
      <section className="relative z-10 pt-20 md:pt-24">
        <div className="lm-lux-beam lm-lux-beam--accent left-[6%] top-[-6%]" aria-hidden />
        <div className="lm-lux-beam lm-lux-beam--right right-[2%] top-[10%]" aria-hidden />
        <div className="relative z-[2] fc-viewport-floor grid items-center gap-8 pb-10 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pb-12 lg:pt-8">
          <div>
            <div className="csg-hero-jumps mb-4 flex flex-wrap items-center gap-2 text-[12px] font-medium">
              <a href="#pages" className="rounded-full border border-emerald-600/25 bg-white px-3 py-1 text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700">
                Pages
              </a>
              <a href="#inside" className="rounded-full border border-violet-600/25 bg-white px-3 py-1 text-slate-700 transition hover:border-violet-500 hover:text-violet-700">
                Inside
              </a>
              <a href="#path" className="rounded-full border border-sky-600/25 bg-white px-3 py-1 text-slate-700 transition hover:border-sky-500 hover:text-sky-700">
                Specialist path
              </a>
            </div>
            <p className="csg-hero-kicker text-[11px] font-bold uppercase">Free e-guide · first page is a preview</p>
            <h1 className="csg-serif csg-hero-title mt-3">
              <span className="block">Master the craft.</span>
              <span className="csg-hero-title-gold mt-1 block">Grow as a specialist.</span>
            </h1>
            <div className="lm-lux-rule--short lm-lux-rule--draw mt-4" aria-hidden />
            <p className="csg-hero-lede mt-5 max-w-xl">
              Personal credit restore and build. Business fundability. Debt and laws insight. Opportunities to help
              partners — and a compliant path toward financial freedom through craft. Page 1 is open now. The rest of
              the guide unlocks after you leave your details. Join stays separate.
            </p>
            <CreditSpecialistGuideActions
              className="mt-7"
              tone="onLight"
              onReadGuide={openPreview}
              showJoinLink
              showPricingLink
            />
            <p className="csg-compliance mt-3">{CS_GUIDE_META.compliance}</p>
          </div>

          <div className="relative flex flex-col items-center">
            <GuideBookMockup tall onOpen={openPreview} />
            <p className="csg-hero-lede mt-1 max-w-xs text-center text-sm">
              Open page 1 in the reader — later pages unlock after you leave your details.
            </p>
          </div>
        </div>
      </section>

      {/* Page preview — near top, opens reader */}
      <section id="pages" className="relative z-10 scroll-mt-28 border-y border-white/8 py-12 md:py-14">
        <div className="fc-viewport-floor">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="csg-kicker">
                <BookOpen size={14} /> Page preview
              </div>
              <h2 className="csg-serif mt-3 text-3xl font-semibold md:text-4xl">
                {CS_GUIDE_CHAPTERS.length} pages · page 1 is the preview
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                Open page 1 in the reader now. Later pages unlock after you leave your details below.
              </p>
            </div>
            <button
              type="button"
              onClick={openPreview}
              className="csg-ghost-btn inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg px-5 text-[11px] font-black uppercase tracking-[0.14em] md:self-auto"
            >
              Start page 1 <ArrowRight size={14} />
            </button>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {CS_GUIDE_CHAPTERS.map((ch, i) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => openOrCapture(ch.id)}
                className="csg-chapter-card group rounded-2xl p-5 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={cn('text-[11px] font-black uppercase tracking-[0.2em]', `csg-accent-${ch.accent}`)}>
                    Pg {ch.number}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                    {i === 0 ? 'Preview' : 'Unlocks after signup'}
                  </span>
                </div>
                <h3 className="csg-serif mt-3 text-xl md:text-2xl">{ch.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{ch.teaser}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section id="inside" className="relative z-10 py-14 md:py-16">
        <div className="fc-viewport-floor">
          <div className="mx-auto max-w-3xl text-center">
            <div className="csg-kicker mx-auto">
              <Sparkles size={14} /> What you&apos;ll master
            </div>
            <h2 className="csg-serif mt-4 text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
              Four lanes. One <span className="text-violet-700">specialist playbook</span>.
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Depth that matches Finely Cred&apos;s luxury education — practical, compliant, and ready for partner
              conversations.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PILLARS.map((p) => (
              <div key={p.title} className="csg-pillar-card rounded-2xl p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-600/30 bg-violet-500/10 text-violet-700">
                  <p.icon size={22} strokeWidth={1.5} />
                </div>
                <h3 className="csg-serif mt-4 text-xl">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.desc}</p>
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
      <section className="relative z-10 border-y border-[#a78bfa]/20 py-10">
        <div className="fc-viewport-floor grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, value: 'Specialist-first', label: 'Built for operators' },
            { icon: ShieldCheck, value: 'Compliance-aware', label: 'Educational positioning' },
            { icon: Gavel, value: 'Court insight', label: 'Not legal advice' },
            { icon: Target, value: 'Preview first', label: 'Full guide after signup' },
          ].map((s) => (
            <div key={s.label} className="csg-stat-tile flex items-center gap-3.5 rounded-2xl p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-600/30 bg-violet-500/10 text-violet-700">
                <s.icon size={20} />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight">{s.value}</div>
                <div className="text-[11px] text-slate-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="csg-compliance fc-viewport-floor mt-4 text-center">
          {CS_GUIDE_META.compliance}
        </p>
      </section>

      {/* Soft optional capture — not a gate */}
      <section id="download" className="relative z-10 scroll-mt-28 py-14 md:py-16">
        <div className="fc-viewport-floor grid items-start gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="csg-kicker">
              <Users size={14} /> Optional updates
            </div>
            <h2 className="csg-serif mt-4 text-3xl font-semibold md:text-4xl">Stay on the specialist list</h2>
            <p className="mt-3 max-w-lg text-base text-slate-600">
              Page 1 is open now. Leave your details to unlock the rest of the playbook. Join stays separate.
            </p>
            <ul className="mt-6 space-y-3">
              <MiniCheck>Preview page 1 now. The rest of the guide unlocks after signup.</MiniCheck>
              <MiniCheck>Receive specialist tips after you leave your details.</MiniCheck>
              <MiniCheck>Join from the Credit Specialist page when you are ready.</MiniCheck>
            </ul>
            <CreditSpecialistGuideActions
              className="mt-6"
              tone="onLight"
              size="sm"
              readLabel="Skip — Read page 1"
              onReadGuide={openPreview}
            />
          </div>
          <div className="csg-cta-panel lm-convert-keep-dark rounded-2xl p-5 md:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">Unlock the rest</p>
            <h3 className="csg-serif mt-2 text-2xl font-semibold text-white">Leave your details</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/75">
              Page 1 stays open. The other pages unlock after this form.
            </p>
            <div className="mt-5">
              <PremiumLeadMagnetCaptureForm
                funnelConfig={CREDIT_SPECIALIST_GUIDE_FUNNEL}
                submitLabel="Send tips & open guide"
                successMode="callback"
                onCaptured={openPreview}
                buttonClass="csg-gold-btn relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-xl px-7 text-[12px] font-black uppercase tracking-[0.12em]"
              />
            </div>
            <p className="mt-3 text-center text-[11px] text-white/55">{CS_GUIDE_META.compliance}</p>
          </div>
        </div>
      </section>

      {/* Path + CTA */}
      <section id="path" className="relative z-10 border-t border-white/8 py-14 md:py-16">
        <div className="fc-viewport-floor">
          <div className="csg-cta-panel lm-convert-keep-dark overflow-hidden rounded-[1.65rem] p-7 md:p-10 lg:p-12">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="csg-kicker">Your path forward</div>
                <h2 className="csg-serif mt-4 text-3xl font-semibold md:text-4xl lg:text-5xl">
                  Read the playbook. Take the two-sheet. Join when you are ready.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">
                  The e-guide and the two-sheet playbook teach the craft. Signup stays separate. When you want tiers,
                  economics, and the application, continue to the Credit Specialist join path.
                </p>
                <ol className="mt-7 space-y-3 text-sm text-white/75">
                  <li>
                    <span className="font-bold text-[#c4b5fd]">1.</span> Read the in-app guide or download the 2-sheet
                    playbook
                  </li>
                  <li>
                    <span className="font-bold text-[#c4b5fd]">2.</span> Study personal, business, debt, and opportunity
                    pages
                  </li>
                  <li>
                    <span className="font-bold text-[#c4b5fd]">3.</span> Join from the Credit Specialist page when you are ready to see pricing and sign up
                  </li>
                </ol>
                <CreditSpecialistGuideActions
                  className="mt-8"
                  tone="onDark"
                  onReadGuide={openPreview}
                  showJoinLink
                  showPricingLink
                />
                <p className="csg-compliance mt-4">{CS_GUIDE_META.compliance}</p>
              </div>
              <GuideBookMockup onOpen={openPreview} />
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-5 py-8 md:px-10">
        <div className="fc-viewport-floor flex flex-col items-center justify-between gap-6 text-xs text-slate-500 md:flex-row">
          <LeadMagnetCobrandFooterMarks />
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="/privacy" className="hover:text-slate-800">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-slate-800">
              Terms of Use
            </a>
            <a href="/disclaimer" className="hover:text-slate-800">
              Disclaimer
            </a>
            <Link to={CS_JOIN_PATH} className="hover:text-emerald-700">
              Specialist join
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Finely Cred · NCG. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
