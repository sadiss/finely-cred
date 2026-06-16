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
import { useNavigate } from 'react-router-dom';
import { LeadMagnetEbook, LeadMagnetDeviceShowcase } from './LeadMagnetHeroMockup';
import { FreeDisputeGuideHeroVideo } from './FreeDisputeGuideHeroVideo';
import { DisputeLetterGuideContentsList, DisputeLetterGuidePreview } from './DisputeLetterGuidePreview';
import { FlashyIcon } from '../ui';
import type { FreeGuide } from '../../resources/freeGuides';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { DISPUTE_LETTER_GUIDE_ID, DISPUTE_LETTER_GUIDE_PAGE_COUNT } from '../../resources/disputeLetterGuideContent';
import {
  formatTrialExpiryLabel,
  getLeadMagnetTrial,
  isLeadMagnetTrialActive,
  LEAD_MAGNET_TRIAL_DAYS,
  type LeadMagnetTrialState,
} from '../../lib/leadMagnetTrial';
import { getLeadAttribution } from '../../lib/leadAttribution';
import { finelyOsCatalogCard, type FinelyOsPublicAccent } from '../../features/os/finelyOsLightUi';

const FEATURE_ACCENTS: FinelyOsPublicAccent[] = ['emerald', 'sky', 'violet', 'amber', 'fuchsia', 'emerald'];

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
    desc: 'Round-one dispute structure, evidence checklist, and language you can actually use.',
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
    desc: 'Choose factual language and FCRA timing based on what the bureau or furnisher must verify.',
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

export function CreditGuidePremiumLanding({
  config,
  guide,
  onGoForm,
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
  const goCapture = onGoForm;
  const [selectedIssueId, setSelectedIssueId] = useState<(typeof ISSUE_TRACKS)[number]['id']>('collections');
  const selectedIssue = ISSUE_TRACKS.find((item) => item.id === selectedIssueId) ?? ISSUE_TRACKS[0];
  const navigate = useNavigate();
  const trialActive = isLeadMagnetTrialActive(getLeadMagnetTrial());

  return (
    <div className="bg-mesh min-h-screen pb-14">
      <nav className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0a0f14]/90 backdrop-blur-xl">
        <div className="container mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <span className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-200">Finely Cred guide</span>
          <div className="flex items-center gap-2">
            {trialActive ? (
              <button
                type="button"
                onClick={() => navigate('/free-guide?step=track')}
                className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-100 sm:px-4"
              >
                Track dispute
              </button>
            ) : null}
            <button type="button" onClick={goCapture} className="rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-sky-100 sm:px-4">
              Get free access
            </button>
          </div>
        </div>
      </nav>

      <header id="fg-hero" className="container relative z-10 mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pt-10">
        <div className="fg-hero-shell relative overflow-x-clip rounded-[2rem] border border-white/[0.12] bg-[#101823]/90 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.35)] sm:rounded-[2.5rem] sm:p-6 md:p-5 lg:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-400/16 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-amber-300/10 blur-[90px]" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:gap-5 lg:gap-6">
            {/* Left: video then copy — stacks tight, no grid row stretch */}
            <div className="min-w-0 flex-1 flex flex-col gap-5">
              <div className="fg-video-hero-panel rounded-[1.65rem] border border-white/[0.08] bg-black/25 p-3 sm:p-4 lg:p-5">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-300/35 bg-sky-300/10 px-4 py-2">
                    <Sparkles className="h-3.5 w-3.5 text-sky-200" />
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-100">
                      Watch the free guide intro
                    </span>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/45">Then claim the kit</span>
                </div>
                {guide.id === DISPUTE_LETTER_GUIDE_ID || config.id === 'credit' ? (
                  <FreeDisputeGuideHeroVideo className="max-w-none rounded-[1.35rem] shadow-[0_30px_90px_rgba(0,0,0,0.38)]" />
                ) : null}
                <div className="mt-3 grid gap-2 md:grid-cols-1 lg:grid-cols-3">
                  {HERO_PROOF.map((line, index) => (
                    <div key={line} className={`rounded-2xl border p-3 text-sm font-semibold text-white/80 ${index === 0 ? 'border-sky-300/16 bg-sky-300/[0.07]' : index === 1 ? 'border-amber-300/16 bg-amber-300/[0.07]' : 'border-violet-300/16 bg-violet-300/[0.07]'}`}>
                      <CheckCircle2 className={`mb-2 h-4 w-4 ${index === 0 ? 'text-sky-200' : index === 1 ? 'text-amber-200' : 'text-violet-200'}`} />
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.65rem] border border-white/[0.1] bg-slate-900/55 p-5 sm:p-6 md:p-5 lg:p-8">
                <h1 className="max-w-5xl text-3xl font-black leading-[1.02] tracking-tight text-white sm:text-4xl md:text-[1.65rem] md:leading-[1.08] lg:text-5xl xl:text-6xl">
                  {headlineOverride ?? (
                    <>
                      Pick the negative item.
                      <span className="mt-2 block text-gradient-blue">Get the dispute angle free.</span>
                      <span className="mt-3 block text-xl font-black leading-tight text-white/85 sm:text-2xl md:text-lg lg:text-3xl">
                        Letters, timing, tracking, and a first-round workflow
                      </span>
                    </>
                  )}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/70 sm:text-base md:text-sm lg:text-lg">
                  {guide.desc} Watch the intro, choose the item hurting your file, then claim the kit and start with a focused plan instead of another vague credit tip.
                </p>

                <div className="fg-issue-picker mt-6 rounded-[1.5rem] border border-sky-300/14 bg-white/[0.05] p-4 sm:p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">Start with your biggest blocker</p>
                      <h2 className="mt-1 text-xl font-black text-white">What needs to be disputed first?</h2>
                    </div>
                    <span className="text-xs font-semibold text-white/45">Personalizes your kit</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                    {ISSUE_TRACKS.map((item) => {
                      const active = item.id === selectedIssueId;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedIssueId(item.id)}
                          className={`rounded-2xl border px-3 py-3 text-left text-xs font-black uppercase tracking-wider transition ${
                            active ? 'border-sky-300/60 bg-sky-300/10 text-sky-100' : 'border-white/[0.08] bg-slate-950/35 text-white/58 hover:border-sky-300/35 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-2xl border border-amber-300/18 bg-amber-300/[0.06] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-100">Your first-round angle</p>
                    <h3 className="mt-1 text-lg font-black leading-snug text-white">{selectedIssue.promise}</h3>
                    <div className="mt-3 grid gap-2 md:grid-cols-1 lg:grid-cols-3">
                      {selectedIssue.plan.map((line) => (
                        <div key={line} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/65">
                          <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5 text-amber-100" /> {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 lg:flex-row">
                  <a href="#fg-preview" className="rounded-xl border border-white/[0.14] bg-white/[0.06] px-8 py-4 text-center text-sm font-black uppercase tracking-wider text-white/85 transition hover:border-sky-300/40 hover:text-sky-100">
                    See portal preview
                  </a>
                  <a href="#fg-value" className="rounded-xl border border-sky-300/25 bg-sky-300/[0.08] px-8 py-4 text-center text-sm font-black uppercase tracking-wider text-sky-100 transition hover:border-sky-300/45 hover:bg-sky-300/[0.12]">
                    What&apos;s in the free kit
                  </a>
                </div>
              </div>
            </div>

            {/* Right: e-book + form — independent column, no height coupling */}
            <div className="flex w-full shrink-0 flex-col gap-4 md:w-[min(100%,300px)] md:gap-4 lg:w-[min(100%,340px)] lg:gap-5 xl:w-[min(100%,380px)]">
              <div className="fg-offer-display relative overflow-visible rounded-[1.65rem] border border-sky-300/20 bg-[#101827]/88 p-4 md:p-4 lg:p-6">
                <div className="absolute right-4 top-4 rounded-full border border-amber-300/35 bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-100">
                  ${totalValue} free
                </div>
                <div className="flex justify-center overflow-visible px-2 pr-4 pt-2 md:pt-1">
                  <LeadMagnetEbook />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 md:gap-2.5 lg:mt-5 lg:gap-3">
                  <div className="rounded-2xl border border-sky-300/14 bg-sky-300/[0.07] p-3 md:p-3 lg:p-4">
                    <p className="text-xl font-black text-white md:text-lg lg:text-2xl">{LEAD_MAGNET_TRIAL_DAYS} days</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/45">Portal preview</p>
                  </div>
                  <div className="rounded-2xl border border-amber-300/14 bg-amber-300/[0.07] p-3 md:p-3 lg:p-4">
                    <p className="text-xl font-black text-white md:text-lg lg:text-2xl">$0</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/45">No card needed</p>
                  </div>
                </div>
                <div className="mt-3 rounded-2xl border border-white/[0.1] bg-slate-200/[0.06] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">Best for</p>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-white/75">
                    {selectedIssue.bestFor}
                  </p>
                </div>
              </div>
              {captureForm}
            </div>
          </div>
        </div>
      </header>

      <section className="container relative z-10 mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {OFFER_PILLARS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="fg-conversion-box rounded-[1.5rem] border border-white/[0.1] bg-white/[0.045] p-5 backdrop-blur-xl sm:p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#39ff14]/30 bg-[#39ff14]/10 text-[#39ff14]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container relative z-10 mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="fg-path-section overflow-hidden rounded-[2rem] border border-white/[0.1] bg-white/[0.045] p-5 backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="grid gap-8 md:grid-cols-[0.92fr_1.08fr] md:items-center lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#39ff14]">Why people claim it</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
                It turns “I need credit help” into <span className="text-gradient-green">what to do first.</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/60 sm:text-base">
                This is not another generic PDF. It gives you a first-round plan, a toolkit, and a portal preview that makes the next action obvious.
              </p>
              <button type="button" onClick={goCapture} className="mt-6 fg-cta-primary rounded-xl px-8 py-4 text-sm inline-flex items-center justify-center gap-2">
                Claim my free plan <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {ACTION_STEPS.map((item) => (
                <div key={item.step} className="rounded-2xl border border-white/[0.09] bg-black/20 p-4 sm:p-5">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#39ff14]/25 bg-[#39ff14]/10 text-sm font-black text-[#39ff14]">
                    {item.step}
                  </div>
                  <h3 className="text-base font-black text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/58">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="fg-preview" className="container mx-auto px-4 sm:px-6 max-w-6xl pb-12 scroll-mt-16">
        <div className="fg-stage fg-preview-stage rounded-[1.75rem] sm:rounded-[2rem] p-6 sm:p-10 lg:p-12 xl:p-14 overflow-visible">
          <div className="grid gap-12 sm:gap-14 lg:gap-20 xl:gap-24 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:items-center">
            <div className="min-w-0 lg:max-w-sm xl:max-w-md lg:pr-4 xl:pr-8">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#39ff14] mb-3">Included free</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">
                Track every dispute in the <span className="text-gradient-green">partner portal</span>, not spreadsheets.
              </h2>
              <p className="text-white/60 text-sm sm:text-base mb-6 max-w-md">
                The PDF gives you the playbook. The portal preview makes it real: upload reports, log bureau responses, and see your next steps in one dashboard.
              </p>
              <button type="button" onClick={goCapture} className="fg-cta-primary py-3.5 px-8 rounded-xl inline-flex items-center gap-2 text-sm">
                Claim the free kit <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="min-w-0 overflow-visible lg:pl-6 xl:pl-10 2xl:pl-12">
              <LeadMagnetDeviceShowcase />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {OBJECTION_HANDLERS.map((item) => (
            <div key={item.title} className="rounded-[1.5rem] border border-[#39ff14]/18 bg-[#07110d]/65 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:p-6">
              <ShieldCheck className="mb-4 h-6 w-6 text-[#39ff14]" />
              <h3 className="text-base font-black text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/58">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <main id="fg-value" className="container mx-auto px-4 sm:px-6 max-w-6xl pb-16 scroll-mt-16">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            What you get <span className="text-gradient-green">free today</span>
          </h2>
          <p className="text-white/55 text-sm">A valuable stack with one clear action: claim access and start round one.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {config.features.map((f, i) => (
            <div key={f.title} className={`${finelyOsCatalogCard(FEATURE_ACCENTS[i % FEATURE_ACCENTS.length])} !p-4 sm:!p-5`} data-fc-accent={FEATURE_ACCENTS[i % FEATURE_ACCENTS.length]}>
              <FlashyIcon icon={f.icon} color="emerald" size="xs" className="!w-8 !h-8 mb-2" />
              <h3 className="text-sm font-bold mb-1">{f.title}</h3>
              <p className="text-xs opacity-75 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div id="fg-cta" className="fg-price-card rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto text-center scroll-mt-16">
          <p className="text-sm text-white/60 mb-2">Total value</p>
          <p className="text-3xl sm:text-4xl font-black text-white mb-4">
            <span className="line-through text-white/35 mr-2">${totalValue}</span>
            <span className="text-gradient-green">$0</span>
          </p>
          <ul className="text-left space-y-2 mb-6 max-w-md mx-auto">
            {config.valueStack.slice(0, 5).map((v) => (
              <li key={v.label} className="flex items-center justify-between gap-3 text-sm text-white/80 border-b border-white/[0.06] pb-2">
                <span className="inline-flex items-center gap-2 min-w-0">
                  <Check className="w-4 h-4 text-[#39ff14] shrink-0" /> {v.label}
                </span>
                <span className="text-emerald-400 font-bold shrink-0">{v.value}</span>
              </li>
            ))}
          </ul>
          <div className="mb-6 grid gap-2 sm:grid-cols-2">
            {TRUST_POINTS.map((point) => (
              <div key={point} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/65">
                <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5 text-[#39ff14]" /> {point}
              </div>
            ))}
          </div>
          <button type="button" onClick={goCapture} className="fg-cta-primary py-4 px-10 rounded-xl inline-flex items-center gap-2 text-base w-full sm:w-auto justify-center">
            {ctaOverride ?? 'Get free access'} <ArrowRight className="w-5 h-5" />
          </button>
          <p className="mt-3 text-xs text-white/45">
            <ShieldCheck className="w-3 h-3 inline mr-1" /> No credit card · Instant download · secure access
          </p>
        </div>
      </main>
    </div>
  );
}

export function CreditGuidePremiumDownload({
  guide,
  fullName,
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
    <main className="min-h-screen py-12 sm:py-16 px-4 bg-fc-shell">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-6 lg:gap-10 items-start">
        <DisputeLetterGuidePreview className="w-full" />
        <div className="bg-[#151c2a] border border-[#39ff14]/20 rounded-2xl sm:rounded-[2rem] p-6 sm:p-10 text-center shadow-[0_0_50px_rgba(57,255,20,0.12)]">
          {generating ? (
            <div className="py-12">
              <Loader2 className="w-12 h-12 text-[#39ff14] animate-spin mx-auto mb-4" />
              <p className="text-white font-semibold">Assembling your {DISPUTE_LETTER_GUIDE_PAGE_COUNT}-page guide…</p>
            </div>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/30 mb-6">
                <Unlock className="w-4 h-4 text-[#39ff14]" />
                <span className="text-xs font-bold text-[#39ff14] uppercase">Resource unlocked</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mb-2">
                Your download is <span className="text-gradient-green">ready.</span>
              </h1>
              <p className="text-gray-400 mb-2 text-sm sm:text-base">{guide.title}</p>
              {downloadErr ? <div className="mb-4 text-red-300 text-sm">{downloadErr}</div> : null}
              {trialActive ? (
                <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <LayoutDashboard className="w-3.5 h-3.5" /> {formatTrialExpiryLabel(trialState)} — portal tools unlocked
                </div>
              ) : null}
              <DisputeLetterGuideContentsList className="text-left mb-6 max-w-md mx-auto" />
              <div className="mb-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-left">
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                  <BookOpen className="w-4 h-4" /> Recommended next course
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {GUIDE_COURSE_RECOMMENDATIONS.map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => setCourseNeed(rec.id)}
                      className={`rounded-xl border px-3 py-2 text-left text-[10px] font-bold ${
                        courseNeed === rec.id ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-100' : 'border-white/[0.08] text-white/55'
                      }`}
                    >
                      {rec.label}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => navigate(courseOnboardingUrl)} className="mt-3 w-full py-3 rounded-xl border border-emerald-500/30 text-[10px] font-black uppercase text-emerald-100">
                  Start {recommendedCourse.title} <ArrowRight className="w-4 h-4 inline" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <button type="button" disabled={downloadBusy} onClick={onDownload} className="fg-cta-primary py-4 rounded-xl w-full disabled:opacity-60">
                  {downloadBusy ? 'Preparing…' : autoDownloaded ? 'Download again' : 'Download PDF now'}
                </button>
                <button type="button" onClick={() => navigate(onboardingUrl)} className="fg-cta-secondary py-4 rounded-xl w-full text-sm uppercase">
                  Continue to platform <ExternalLink className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
