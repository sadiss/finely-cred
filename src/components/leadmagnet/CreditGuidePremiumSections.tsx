import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Loader2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Unlock,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FreeGuideMaterialsShowcase,
  LeadMagnetEbook,
  LeadMagnetDeviceShowcase,
} from './LeadMagnetHeroMockup';
import { FreeDisputeGuideHeroVideo } from './FreeDisputeGuideHeroVideo';
import { DisputeLetterGuideContentsList, DisputeLetterGuidePreview } from './DisputeLetterGuidePreview';
import { FlashyIcon } from '../ui';
import type { FreeGuide } from '../../resources/freeGuides';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import {
  DISPUTE_LETTER_GUIDE_ID,
  DISPUTE_LETTER_GUIDE_PAGE_COUNT,
  DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES,
  DISPUTE_LETTER_GUIDE_READ_PATH,
} from '../../resources/disputeLetterGuideContent';
import {
  formatTrialExpiryLabel,
  getLeadMagnetTrial,
  isLeadMagnetTrialActive,
  LEAD_MAGNET_TRIAL_DAYS,
  type LeadMagnetTrialState,
} from '../../lib/leadMagnetTrial';
import { getLeadAttribution } from '../../lib/leadAttribution';
import { LandingTypewriterTitle } from '../landing/LandingTypewriterTitle';
import './leadMagnetLuxuryStage.css';
import './creditGuidePremiumLanding.css';

/** Opening chapters surfaced so partners can read free without capture. */
const HERO_CHAPTER_RAIL = [
  'read-this-first',
  'report-anatomy',
  'finding-not-feeling',
  'who-you-write-to',
  'round-map',
  'five-step-overview',
]
  .map((id) => DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES.find((p) => p.id === id))
  .filter((p): p is NonNullable<typeof p> => Boolean(p));

const HERO_PROOF = [
  'Exact dispute letter workflow',
  'FCRA timing and bureau response tracker',
  'Free portal preview with no credit card',
] as const;

const ISSUE_TRACKS = [
  {
    id: 'collections',
    label: 'Collections',
    promise: 'Validate, document, and dispute collection accounts with a paper trail.',
    bestFor: 'Collection accounts, debt buyer entries, medical collections, and accounts you do not recognize.',
    plan: ['Validation request angle', 'Evidence checklist', 'Response tracking timeline'],
  },
  {
    id: 'chargeoffs',
    label: 'Charge-offs',
    promise: 'Challenge inaccurate balances, dates, ownership, and reporting details.',
    bestFor: 'Charge-offs, sold accounts, duplicate entries, and accounts reporting inconsistent dates or balances.',
    plan: ['Furnisher accuracy angle', 'Balance and date audit', 'Round-one letter structure'],
  },
  {
    id: 'late-pays',
    label: 'Late pays',
    promise: 'Check payment history, reporting dates, and documentation before the first dispute.',
    bestFor: '30, 60, 90, or 120 day late payments that may be inaccurate, duplicated, or unsupported.',
    plan: ['Payment timeline review', 'Goodwill vs factual dispute path', 'Bureau response log'],
  },
  {
    id: 'inquiries',
    label: 'Inquiries',
    promise: 'Separate authorized pulls from questionable inquiries and prepare the right request.',
    bestFor: 'Hard inquiries, lender shopping, duplicate pulls, and inquiries you do not remember authorizing.',
    plan: ['Authorization review', 'Inquiry dispute wording', 'Follow-up calendar'],
  },
] as const;

const OFFER_PILLARS = [
  {
    icon: FileText,
    title: 'Letters that move the file',
    desc: 'Round-one dispute structure, evidence checklist, and finding-first language partners can actually send.',
  },
  {
    icon: LayoutDashboard,
    title: 'A place to track the round',
    desc: `${LEAD_MAGNET_TRIAL_DAYS}-day portal preview for uploads, deadlines, bureau responses, and next steps.`,
  },
  {
    icon: TrendingUp,
    title: 'A clear score path',
    desc: 'See what to send first, what to watch for, and how to keep the process moving.',
  },
] as const;

const ACTION_STEPS = [
  {
    step: '01',
    title: 'Spot what is hurting approvals',
    desc: 'Use the checklist to separate high-impact negatives from noise so round one starts in the right place.',
  },
  {
    step: '02',
    title: 'Match the dispute angle',
    desc: 'Choose one honest lane and FCRA timing based on what the bureau or furnisher must reinvestigate.',
  },
  {
    step: '03',
    title: 'Send with a clean paper trail',
    desc: 'Prepare the letter, evidence, and certified-mail workflow without wondering what comes next.',
  },
  {
    step: '04',
    title: 'Track responses like a file',
    desc: 'Use the portal preview to log deadlines, bureau responses, next rounds, and follow-up tasks.',
  },
] as const;

const TRUST_POINTS = [
  'No credit card',
  'Instant guide access',
  'Educational, compliance-aware workflow',
  `${LEAD_MAGNET_TRIAL_DAYS}-day portal preview included`,
] as const;

const OBJECTION_HANDLERS = [
  {
    title: 'Not another generic credit PDF',
    desc: 'The guide is paired with a round-one workflow and portal preview so the next step is clear.',
  },
  {
    title: 'No card or paid account required',
    desc: 'Claim the guide first. The portal preview is included so you can see the system before deciding anything else.',
  },
  {
    title: 'Built for action today',
    desc: 'Start with what to dispute, what evidence to gather, and how to track bureau responses.',
  },
] as const;

const GUIDE_COURSE_RECOMMENDATIONS = [
  { id: 'dispute_basics', label: 'Dispute basics', title: 'Credit Dispute Fundamentals', desc: 'Round 1 workflow, evidence, and timelines.', next: '/portal/courses/credit-dispute-fundamentals' },
  { id: 'portal_tour', label: 'Portal tour', title: 'Finely Cred Partner Portal Tour', desc: 'Upload, checklist, and letter vault walkthrough.', next: '/portal/dashboard' },
] as const;

function WealthKicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="cgp-kicker">
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

export function CreditGuidePremiumLanding({
  config,
  guide,
  onGoForm: _onGoForm,
  headlineOverride,
  ctaOverride,
  trustLabel = '10k+',
  totalValue = 297,
  captureForm,
}: {
  config: LeadMagnetFunnelConfig;
  guide: FreeGuide;
  onGoForm: () => void;
  headlineOverride?: string;
  ctaOverride?: string;
  trustLabel?: string;
  totalValue?: number;
  captureForm?: React.ReactNode;
}) {
  const [selectedIssueId, setSelectedIssueId] = useState<(typeof ISSUE_TRACKS)[number]['id']>('collections');
  const selectedIssue = ISSUE_TRACKS.find((item) => item.id === selectedIssueId) ?? ISSUE_TRACKS[0];

  return (
    <div className="cgp-page min-h-screen pb-14">
      {/* Hero — ivory + cover green · copy + book (video sits with signup below) */}
      <header id="fg-hero" className="cgp-hero relative z-10 pt-20 md:pt-24">
        <div className="pointer-events-none absolute left-[8%] top-[18%] h-[340px] w-[340px] rounded-full bg-[#1aad4b]/12 blur-[110px]" />
        <div className="relative z-[2] mx-auto grid max-w-[94rem] items-center gap-10 px-5 pb-10 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pb-12">
          <div className="flex min-w-0 flex-col items-center text-center lg:items-start lg:text-left">
            <p className="cgp-hero-kicker">Free dispute letter guide · partners welcome</p>
            <h1 className="cgp-serif cgp-hero-title mt-3 md:mt-4">
              {headlineOverride ? (
                <span className="block">{headlineOverride}</span>
              ) : (
                <>
                  <LandingTypewriterTitle
                    as="span"
                    text="Pick the negative item."
                    className="block"
                    speedMs={38}
                    delayMs={100}
                    caret
                  />
                  <LandingTypewriterTitle
                    as="span"
                    text="Get the dispute angle free."
                    className="cgp-hero-title-accent mt-1 block"
                    speedMs={40}
                    delayMs={900}
                    caret
                  />
                </>
              )}
            </h1>
            <p className="cgp-hero-lede mt-5">
              {guide.desc} Read free in your browser, or sign up for the PDF kit and portal preview — no credit card.
            </p>

            <div className="cgp-hero-actions justify-center lg:justify-start">
              <a href="#fg-capture" className="cgp-cta">
                Sign up free <ArrowRight className="h-4 w-4" />
              </a>
              <Link to={DISPUTE_LETTER_GUIDE_READ_PATH} className="cgp-cta cgp-cta--ghost">
                <BookOpen className="h-4 w-4" /> Read free — no signup
              </Link>
            </div>

            <div className="mt-5 grid w-full max-w-lg gap-2 sm:grid-cols-3">
              {HERO_PROOF.map((line) => (
                <div key={line} className="cgp-card px-3 py-3 text-left text-[12px] font-semibold leading-snug text-[#0b1220]/75">
                  <CheckCircle2 className="mb-1.5 h-3.5 w-3.5 text-[#1aad4b]" />
                  {line}
                </div>
              ))}
            </div>
            <p className="cgp-compliance mt-3">Results vary · not legal advice · educational guide only</p>
          </div>

          <div className="cgp-hero-media mx-auto lg:ml-auto">
            <div className="cgp-hero-book-stage">
              <LeadMagnetEbook />
            </div>
          </div>
        </div>
      </header>

      {/* Under hero: signup LEFT + large video RIGHT (stack on mobile) */}
      <section id="fg-capture" className="cgp-band relative z-10 scroll-mt-20 py-8 md:py-10">
        <div className="mx-auto max-w-[94rem] px-5 md:px-8">
          <div className="mb-6 max-w-2xl">
            <WealthKicker>Claim the free kit</WealthKicker>
            <h2 className="cgp-serif mt-3 text-2xl font-black tracking-[-0.03em] text-[#0b1220] md:text-3xl">
              Sign up for the PDF + <span className="text-[#1aad4b]">full credit path</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#0b1220]/65">
              ${totalValue} value · trusted by {trustLabel} partners · no credit card. See what Finely Cred offers beside
              the form — restore, disputes, and funding readiness — or keep reading free in your browser.
            </p>
          </div>

          <div className="cgp-capture-video-row">
            <div className="cgp-capture-panel p-5 md:p-6">
              <h2 className="mb-1 text-lg font-black uppercase tracking-[0.08em] text-white md:text-xl">
                Get your <span className="text-[#4ade80]">free</span> kit
              </h2>
              <p className="mb-4 text-xs text-white/55">Instant access · partners welcome · educational only</p>
              {captureForm}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link to={DISPUTE_LETTER_GUIDE_READ_PATH} className="text-xs font-semibold text-[#4ade80] underline-offset-2 hover:underline">
                  Prefer to read free first
                </Link>
              </div>
              <p className="cgp-compliance cgp-compliance--light mt-3">
                Results vary · not legal advice · funding subject to underwriting
              </p>
            </div>

            {(guide.id === DISPUTE_LETTER_GUIDE_ID || config.id === 'credit') && (
              <div className="cgp-capture-video-panel">
                <div className="cgp-capture-video-label">
                  <span>Finely Cred credit solutions</span>
                  <span className="opacity-70">Restore · Disputes · Funding</span>
                </div>
                <p className="cgp-capture-video-sub">
                  Overview of what we offer — not a site walkthrough
                </p>
                <FreeDisputeGuideHeroVideo showBadge={false} className="cgp-capture-video max-w-none rounded-[1rem]" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Device duo — early, large, impossible to miss */}
      <section id="fg-preview" className="cgp-band cgp-band--ivory cgp-band--glow relative z-10 scroll-mt-16 py-14 md:py-16">
        <div className="mx-auto max-w-[94rem] px-5 md:px-8">
          <div className="mb-8 mx-auto max-w-3xl text-center">
            <WealthKicker>See the converting preview</WealthKicker>
            <h2 className="cgp-serif mt-4 text-3xl font-black leading-tight tracking-[-0.03em] text-[#0b1220] md:text-5xl">
              Tablet + glowing phone — <span className="text-[#1aad4b]">Sign up free</span>, Round 1 letters, score climb
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#0b1220]/65 sm:text-base">
              Side-by-side partner preview of the full credit path: restore workflow, dispute Round 1, and the one-tap
              signup that unlocks it — free, no card.
            </p>
          </div>
          <div className="cgp-preview-stage mx-auto">
            <LeadMagnetDeviceShowcase />
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#fg-capture" className="cgp-cta">
              Sign up free <ArrowRight className="h-4 w-4" />
            </a>
            <p className="cgp-compliance m-0">Results vary · not legal advice · educational tools only</p>
          </div>
        </div>
      </section>

      {/* Issue picker */}
      <section className="cgp-band relative z-10 py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <WealthKicker>Start with your biggest blocker</WealthKicker>
          <h2 className="cgp-serif mt-4 text-3xl font-black tracking-[-0.03em] text-[#0b1220] md:text-4xl">
            What needs to be disputed <span className="text-[#1aad4b]">first?</span>
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#0b1220]/60">
            Personalizes your kit so round one starts on the item hurting approvals — not a vague tip sheet.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {ISSUE_TRACKS.map((item) => {
              const active = item.id === selectedIssueId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedIssueId(item.id)}
                  className={`cgp-issue-btn ${active ? 'is-active' : ''}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="cgp-card mt-4 p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#0f7a35]">Your first-round angle</p>
            <h3 className="mt-1 text-lg font-black leading-snug text-[#0b1220]">{selectedIssue.promise}</h3>
            <p className="mt-2 text-sm text-[#0b1220]/55">{selectedIssue.bestFor}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {selectedIssue.plan.map((line) => (
                <div
                  key={line}
                  className="rounded-xl border border-[#1aad4b]/18 bg-white/70 px-3 py-2 text-xs font-semibold text-[#0b1220]/70"
                >
                  <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5 text-[#1aad4b]" /> {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Read free — keep path */}
      <section id="fg-read-free" className="cgp-band cgp-band--ivory relative z-10 py-10 md:py-12 scroll-mt-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <WealthKicker>Read it free · no email</WealthKicker>
              <h2 className="cgp-serif mt-4 text-3xl font-black tracking-[-0.03em] text-[#0a1628] md:text-4xl">
                {DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES.length} pages, open in your browser
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#0a1628]/65">
                Open any chapter below. Capture is optional if you want the PDF kit and portal preview.
              </p>
            </div>
            <Link to={DISPUTE_LETTER_GUIDE_READ_PATH} className="cgp-cta shrink-0">
              <BookOpen className="h-4 w-4" /> Open the reader
            </Link>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {HERO_CHAPTER_RAIL.map((chapter) => (
              <Link
                key={chapter.id}
                to={`${DISPUTE_LETTER_GUIDE_READ_PATH}?chapter=${chapter.id}`}
                className="cgp-card group px-4 py-3.5 transition hover:-translate-y-0.5"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#c4803d]">
                  {chapter.kicker ?? 'Page'}
                </p>
                <p className="mt-1 text-sm font-bold leading-snug text-[#0a1628] group-hover:text-[#000c3c]">
                  {chapter.title}
                </p>
                {chapter.subtitle ? (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#0a1628]/50">{chapter.subtitle}</p>
                ) : null}
              </Link>
            ))}
          </div>
          <p className="cgp-compliance mt-4">Educational only · not legal advice · results vary</p>
        </div>
      </section>

      {/* Pillars */}
      <section className="cgp-band relative z-10 py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 md:grid-cols-3 md:px-8">
          {OFFER_PILLARS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="cgp-card p-5 sm:p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1aad4b]/30 bg-[#1aad4b]/10 text-[#0f7a35]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-[#0b1220]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#0b1220]/60">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Path */}
      <section className="cgp-band relative z-10 border-t border-[#1aad4b]/12 py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <WealthKicker>Why partners claim it</WealthKicker>
              <h2 className="cgp-serif mt-4 text-3xl font-black leading-tight tracking-[-0.03em] text-[#0b1220] md:text-4xl">
                It turns “I need credit help” into <span className="text-[#1aad4b]">what to do first.</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#0b1220]/60 sm:text-base">
                Not another generic PDF. A first-round plan, a toolkit, and a portal preview that makes the next action
                obvious.
              </p>
              <a href="#fg-capture" className="cgp-cta mt-6">
                Sign up free <ArrowRight className="h-4 w-4" />
              </a>
              <p className="cgp-compliance mt-3">Results vary · not legal advice</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {ACTION_STEPS.map((item) => (
                <div key={item.step} className="cgp-card p-4 sm:p-5">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#1aad4b]/25 bg-[#1aad4b]/10 text-sm font-black text-[#0f7a35]">
                    {item.step}
                  </div>
                  <h3 className="text-base font-black text-[#0b1220]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#0b1220]/58">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Materials — one glossy composition */}
      <section id="fg-materials" className="cgp-band cgp-band--ivory relative z-10 scroll-mt-16 py-12 md:py-14">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-8 mx-auto max-w-2xl text-center">
            <WealthKicker>Inside the free kit</WealthKicker>
            <h2 className="cgp-serif mt-4 text-3xl font-black tracking-[-0.03em] text-[#0b1220] md:text-4xl">
              Glossy pages. Real guide. <span className="text-[#1aad4b]">Phone preview of the ebook.</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#0b1220]/60">
              One professional materials stage — brochure spreads, the standalone book, and the guide on a phone screen
              as part of the same mockup.
            </p>
          </div>
          <FreeGuideMaterialsShowcase />
          <div className="cgp-materials-caption mx-auto mt-8 max-w-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f7a35]">Included free today</p>
            <p className="mt-1 text-sm font-semibold text-[#0b1220]/85">
              Guide PDF · chapter reader · {LEAD_MAGNET_TRIAL_DAYS}-day portal preview
            </p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="#fg-capture" className="cgp-cta">
              Sign up free <ArrowRight className="h-4 w-4" />
            </a>
            <Link to={DISPUTE_LETTER_GUIDE_READ_PATH} className="cgp-cta cgp-cta--ghost">
              <BookOpen className="h-4 w-4" /> Read free first
            </Link>
          </div>
        </div>
      </section>

      {/* Objections */}
      <section className="cgp-band relative z-10 py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 md:grid-cols-3 md:px-8">
          {OBJECTION_HANDLERS.map((item) => (
            <div key={item.title} className="cgp-card p-5 sm:p-6">
              <ShieldCheck className="mb-4 h-6 w-6 text-[#1aad4b]" />
              <h3 className="text-base font-black text-[#0b1220]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#0b1220]/58">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Value stack + capture CTA */}
      <main id="fg-value" className="cgp-band relative z-10 scroll-mt-16 pb-16 pt-4">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h2 className="cgp-serif text-3xl font-black text-[#0b1220] md:text-4xl">
              What you get <span className="text-[#1aad4b]">free today</span>
            </h2>
            <p className="mt-2 text-sm text-[#0b1220]/55">A valuable stack with one clear action: claim access and start round one.</p>
            <p className="cgp-compliance mt-2">Results vary · not legal advice</p>
          </div>

          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {config.features.map((f) => (
              <div key={f.title} className="cgp-card !p-4 sm:!p-5">
                <FlashyIcon icon={f.icon} color="emerald" size="xs" className="!mb-2 !h-8 !w-8" />
                <h3 className="mb-1 text-sm font-bold text-[#0b1220]">{f.title}</h3>
                <p className="text-xs leading-relaxed text-[#0b1220]/65">{f.desc}</p>
              </div>
            ))}
          </div>

          <div id="fg-cta" className="cgp-card mx-auto max-w-2xl scroll-mt-16 p-6 text-center sm:p-8">
            <p className="mb-2 text-sm text-[#0b1220]/55">Total value</p>
            <p className="mb-4 text-3xl font-black text-[#0b1220] sm:text-4xl">
              <span className="mr-2 text-[#0b1220]/30 line-through">${totalValue}</span>
              <span className="text-[#1aad4b]">$0</span>
            </p>
            <ul className="mx-auto mb-6 max-w-md space-y-2 text-left">
              {config.valueStack.slice(0, 5).map((v) => (
                <li key={v.label} className="flex items-center justify-between gap-3 border-b border-[#1aad4b]/12 pb-2 text-sm text-[#0b1220]/80">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-[#1aad4b]" /> {v.label}
                  </span>
                  <span className="shrink-0 font-bold text-[#0f7a35]">{v.value}</span>
                </li>
              ))}
            </ul>
            <div className="mb-6 grid gap-2 sm:grid-cols-2">
              {TRUST_POINTS.map((point) => (
                <div key={point} className="rounded-xl border border-[#1aad4b]/18 bg-white/70 px-3 py-2 text-xs font-semibold text-[#0b1220]/65">
                  <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5 text-[#1aad4b]" /> {point}
                </div>
              ))}
            </div>
            <a href="#fg-capture" className="cgp-cta w-full justify-center sm:w-auto">
              {ctaOverride ?? 'Sign up free'} <ArrowRight className="h-5 w-5" />
            </a>
            <p className="mt-3 text-xs text-[#0b1220]/45">
              <ShieldCheck className="mr-1 inline h-3 w-3" /> No credit card · Instant download · secure access
            </p>
            <p className="cgp-compliance mt-2">
              Results vary · not legal advice · funding subject to underwriting
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export function CreditGuidePremiumDownload({
  guide,
  fullName: _fullName,
  generating,
  downloadBusy,
  downloadErr,
  autoDownloaded,
  onboardingUrl,
  onDownload,
}: {
  guide: FreeGuide;
  fullName: string;
  generating: boolean;
  downloadBusy: boolean;
  downloadErr: string | null;
  autoDownloaded: boolean;
  onboardingUrl: string;
  onDownload: () => void;
}) {
  const navigate = useNavigate();
  const trialState: LeadMagnetTrialState | null = getLeadMagnetTrial();
  const trialActive = isLeadMagnetTrialActive(trialState);
  const [courseNeed, setCourseNeed] = useState<(typeof GUIDE_COURSE_RECOMMENDATIONS)[number]['id']>('dispute_basics');
  const recommendedCourse = GUIDE_COURSE_RECOMMENDATIONS.find((x) => x.id === courseNeed) ?? GUIDE_COURSE_RECOMMENDATIONS[0]!;
  const courseOnboardingUrl = useMemo(() => {
    const attr = getLeadAttribution();
    const params = new URLSearchParams();
    params.set('lane', 'personal_restore');
    params.set('next', recommendedCourse.next);
    if (attr?.referralCode) params.set('ref', attr.referralCode);
    return `/onboarding?${params.toString()}`;
  }, [recommendedCourse.next]);

  return (
    <main className="cgp-page lm-lux-theme--navy min-h-screen bg-[#000c3c] px-4 py-12 sm:py-16">
      <div className="mx-auto grid max-w-5xl items-start gap-6 lg:grid-cols-2 lg:gap-10">
        <DisputeLetterGuidePreview className="w-full" />
        <div className="cgp-download-card rounded-2xl p-6 text-center sm:rounded-[2rem] sm:p-10">
          {generating ? (
            <div className="py-12">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#ffd993]" />
              <p className="font-semibold text-white">Assembling your {DISPUTE_LETTER_GUIDE_PAGE_COUNT}-page guide…</p>
            </div>
          ) : (
            <>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e0b24a]/35 bg-[#e0b24a]/10 px-4 py-2">
                <Unlock className="h-4 w-4 text-[#ffd993]" />
                <span className="text-xs font-bold uppercase text-[#ffd993]">Resource unlocked</span>
              </div>
              <h1 className="cgp-serif mb-2 text-2xl font-black text-white sm:text-3xl">
                Your download is <span className="text-[#ffd993]">ready.</span>
              </h1>
              <p className="mb-2 text-sm text-white/55 sm:text-base">{guide.title}</p>
              {downloadErr ? <div className="mb-4 text-sm text-red-300">{downloadErr}</div> : null}
              {trialActive ? (
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e0b24a]/35 bg-[#e0b24a]/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#ffd993]">
                  <LayoutDashboard className="h-3.5 w-3.5" /> {formatTrialExpiryLabel(trialState)} — portal tools unlocked
                </div>
              ) : null}
              <DisputeLetterGuideContentsList className="mx-auto mb-6 max-w-md text-left" />
              <div className="mb-6 rounded-2xl border border-[#e0b24a]/25 bg-[#e0b24a]/10 p-4 text-left">
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#ffd993]">
                  <BookOpen className="h-4 w-4" /> Recommended next course
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {GUIDE_COURSE_RECOMMENDATIONS.map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => setCourseNeed(rec.id)}
                      className={`rounded-xl border px-3 py-2 text-left text-[10px] font-bold ${
                        courseNeed === rec.id
                          ? 'border-[#e0b24a]/50 bg-[#e0b24a]/15 text-[#ffd993]'
                          : 'border-white/[0.08] text-white/55'
                      }`}
                    >
                      {rec.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => navigate(courseOnboardingUrl)}
                  className="mt-3 w-full rounded-xl border border-[#e0b24a]/30 py-3 text-[10px] font-black uppercase text-[#ffd993]"
                >
                  Start {recommendedCourse.title} <ArrowRight className="inline h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <button type="button" disabled={downloadBusy} onClick={onDownload} className="fg-cta-primary w-full rounded-xl py-4 disabled:opacity-60">
                  {downloadBusy ? 'Preparing…' : autoDownloaded ? 'Download again' : 'Download PDF now'}
                </button>
                <button type="button" onClick={() => navigate(onboardingUrl)} className="fg-cta-secondary w-full rounded-xl py-4 text-sm uppercase">
                  Continue to platform <ExternalLink className="ml-1 inline h-4 w-4" />
                </button>
              </div>
              <p className="cgp-compliance cgp-compliance--light mt-4">
                Results vary · not legal advice · educational resources only
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
