import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Gift,
  LayoutDashboard,
  Loader2,
  Lock,
  PlayCircle,
  Unlock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LeadMagnetEbook, LeadMagnetDeviceShowcase } from './LeadMagnetHeroMockup';
import { DisputeLetterGuideContentsList, DisputeLetterGuidePreview } from './DisputeLetterGuidePreview';
import { FlashyIcon } from '../ui';
import type { FreeGuide } from '../../resources/freeGuides';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { DISPUTE_LETTER_GUIDE_PAGE_COUNT } from '../../resources/disputeLetterGuideContent';
import {
  formatTrialExpiryLabel,
  getLeadMagnetTrial,
  isLeadMagnetFeatureUnlocked,
  isLeadMagnetTrialActive,
  LEAD_MAGNET_TRIAL_DAYS,
  type LeadMagnetTrialFeatureId,
  type LeadMagnetTrialState,
} from '../../lib/leadMagnetTrial';
import { getLeadAttribution } from '../../lib/leadAttribution';
import { finelyOsCatalogCard, finelyOsLeadMagnetPanel, type FinelyOsPublicAccent } from '../../features/os/finelyOsLightUi';

const FEATURE_ACCENTS: FinelyOsPublicAccent[] = ['emerald', 'sky', 'violet', 'amber', 'fuchsia', 'emerald'];

const LANDING_SECTIONS = [
  { id: 'fg-hero', label: 'Overview' },
  { id: 'fg-preview', label: 'Dashboard' },
  { id: 'fg-value', label: 'Toolkit' },
  { id: 'fg-cta', label: 'Get access' },
] as const;

const GUIDE_COURSE_RECOMMENDATIONS = [
  { id: 'dispute_basics', label: 'Dispute basics', title: 'Credit Dispute Fundamentals', desc: 'Round 1 workflow, evidence, and timelines.', next: '/portal/courses/credit-dispute-fundamentals' },
  { id: 'portal_tour', label: 'Portal tour', title: 'Finely Cred Partner Portal Tour', desc: 'Upload, checklist, and letter vault walkthrough.', next: '/portal/dashboard' },
] as const;

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function CreditGuidePremiumLanding({
  config,
  guide,
  onGoForm,
  headlineOverride,
  ctaOverride,
}: {
  config: LeadMagnetFunnelConfig;
  guide: FreeGuide;
  onGoForm: () => void;
  headlineOverride?: string;
  ctaOverride?: string;
}) {
  const trialState = getLeadMagnetTrial();

  return (
    <div className="bg-mesh min-h-screen">
      <nav className="sticky top-0 z-30 fc-funnel-nav backdrop-blur border-b border-white/[0.08]">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl flex gap-2 overflow-x-auto py-2.5">
          {LANDING_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollToSection(s.id)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border border-white/[0.08] text-white/60 hover:text-[#39ff14] hover:border-[#39ff14]/30 transition"
            >
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      <header id="fg-hero" className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-10 sm:pb-14 max-w-7xl relative z-10 scroll-mt-16">
        <div className={`${finelyOsLeadMagnetPanel('emerald')} p-5 sm:p-8 lg:p-12`} data-fc-accent="emerald">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full fg-kicker-pill mb-6 sm:mb-8">
                <span className="h-2 w-2 rounded-full bg-[#39ff14] animate-pulse shadow-[0_0_8px_#39ff14]" />
                <span className="text-[10px] sm:text-xs font-bold text-[#39ff14] uppercase tracking-widest">Free lead magnet</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] mb-4 sm:mb-6 text-white">
                {headlineOverride ?? (
                  <>
                    {config.heroHeadline}{' '}
                    <span className="text-gradient-green">{config.heroHighlight}</span> {config.heroSub}
                  </>
                )}
              </h1>
              <p className="text-white/70 text-base sm:text-lg mb-6 sm:mb-8 max-w-lg leading-relaxed">{guide.desc}</p>

              <div className="mb-6 sm:mb-8 aspect-video max-w-lg rounded-2xl fg-video-tile flex items-center justify-center relative overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(57,255,20,0.15),transparent_60%)]" />
                <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-slate-900/60 border border-[#39ff14]/30 text-[9px] font-bold text-[#39ff14] uppercase tracking-wider">
                  Preview dashboard
                </div>
                <FlashyIcon icon={PlayCircle} color="emerald" size="lg" className="group-hover:scale-110 transition-transform" />
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={onGoForm}
                  className="fg-cta-primary text-base sm:text-lg py-4 px-6 sm:px-10 rounded-xl shadow-glow shadow-glow-hover inline-flex items-center justify-center gap-3 w-full sm:w-auto"
                >
                  {ctaOverride ?? 'Get free access now'} <ArrowRight className="w-5 h-5" />
                </button>
                <span className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" /> No card. Instant download.
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#39ff14]/20 bg-[#39ff14]/5 text-[#39ff14]">
                  <Check className="w-3 h-3" /> Instant PDF
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-200">
                  <Lock className="w-3 h-3" /> Secure portal preview
                </span>
              </div>

              <div className="mt-6 grid sm:grid-cols-2 gap-2 max-w-xl">
                {config.trustCerts.map((cert) => (
                  <div key={cert} className="fg-trust-card rounded-2xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-2">
                    <FlashyIcon icon={Award} color="emerald" size="xs" className="!w-8 !h-8 !rounded-lg shrink-0" /> {cert}
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end px-1 sm:px-0">
              <LeadMagnetEbook />
            </div>
          </div>
        </div>
      </header>

      <section id="fg-preview" className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10 pb-10 sm:pb-16 scroll-mt-16">
        <div className="fg-stage relative overflow-hidden rounded-[1.75rem] sm:rounded-[2.25rem] p-6 sm:p-10 lg:p-14">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full fg-kicker-pill mb-5">
                <LayoutDashboard className="w-3.5 h-3.5 text-[#39ff14]" />
                <span className="text-[10px] font-bold text-[#39ff14] uppercase tracking-widest">Bonus — live platform preview</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-3">
                Plus a peek at your <span className="text-gradient-green">restoration dashboard.</span>
              </h2>
              <p className="text-gray-400 text-sm sm:text-base max-w-lg mb-6">
                Track dispute letters, monitor bureau responses, and keep every outcome organized in one place.
              </p>
              <ul className="space-y-2.5">
                {[
                  'Score trajectory views & round tracking',
                  'Every bureau response logged in one timeline',
                  'Mobile + desktop — your file travels with you',
                ].map((line) => (
                  <li key={line} className="flex items-center gap-2.5 text-gray-200 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#39ff14] shrink-0" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <LeadMagnetDeviceShowcase />
            </div>
          </div>
        </div>
      </section>

      <div className="bg-[#151c2a] border-y border-[#39ff14]/15 py-4 overflow-hidden">
        <div className="marquee-container gap-12 sm:gap-16 px-8 text-gray-400 font-bold text-xs sm:text-sm uppercase tracking-widest">
          {['Equifax', 'Experian', 'TransUnion', 'Encrypted', 'Funding-readiness path'].map((label) => (
            <span key={label} className="flex items-center gap-2 shrink-0">
              {label === 'Encrypted' ? <Lock className="w-4 h-4 text-fuchsia-400" /> : <Check className="text-[#39ff14] w-4 h-4" />}
              {label}
            </span>
          ))}
        </div>
      </div>

      <main id="fg-value" className="py-12 sm:py-20 container mx-auto px-4 sm:px-6 max-w-6xl relative z-10 scroll-mt-16">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full fg-kicker-pill mb-4">
            <Gift className="w-3.5 h-3.5 text-[#39ff14]" />
            <span className="text-[10px] font-bold text-[#39ff14] uppercase tracking-widest">Everything you get — free</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
            A complete <span className="text-gradient-green">dispute toolkit</span>, not just a PDF.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {config.features.map((f, i) => (
            <div key={f.title} className={`${finelyOsCatalogCard(FEATURE_ACCENTS[i % FEATURE_ACCENTS.length])} !p-5 sm:!p-6 transition-all`} data-fc-accent={FEATURE_ACCENTS[i % FEATURE_ACCENTS.length]}>
              <FlashyIcon icon={f.icon} color={FEATURE_ACCENTS[i % FEATURE_ACCENTS.length] === 'amber' ? 'amber' : FEATURE_ACCENTS[i % FEATURE_ACCENTS.length] === 'violet' ? 'violet' : FEATURE_ACCENTS[i % FEATURE_ACCENTS.length] === 'sky' ? 'sky' : FEATURE_ACCENTS[i % FEATURE_ACCENTS.length] === 'fuchsia' ? 'fuchsia' : 'emerald'} size="sm" className="mb-4" />
              <h3 className="text-base sm:text-lg font-bold mb-1.5">{f.title}</h3>
              <p className="text-xs sm:text-sm leading-relaxed opacity-80">{f.desc}</p>
            </div>
          ))}
        </div>

        <div id="fg-cta" className="mt-10 sm:mt-16 grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch scroll-mt-16">
          <div className="flex flex-col justify-center">
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Real value: <span className="text-gray-500 line-through decoration-2">$297</span>{' '}
              <span className="text-gradient-green">— yours $0 today.</span>
            </h3>
            <p className="text-gray-400 text-sm sm:text-base mb-6">
              Full toolkit free — plus a {LEAD_MAGNET_TRIAL_DAYS}-day DIY portal trial.
            </p>
            <ul className="space-y-3">
              {config.valueStack.map((v) => {
                const locked = v.locksAfterTrial && v.trialFeature && !isLeadMagnetFeatureUnlocked(v.trialFeature as LeadMagnetTrialFeatureId, trialState);
                return (
                  <li key={v.label} className="flex items-center justify-between gap-4 border-b border-slate-700/50 pb-3">
                    <span className="inline-flex items-center gap-2.5 text-gray-200 text-sm min-w-0">
                      {locked ? <Lock className="w-4 h-4 text-gray-500 shrink-0" /> : <Check className="w-4 h-4 text-[#39ff14] shrink-0" />}
                      {v.label}
                    </span>
                    <span className="text-emerald-400 font-bold text-sm shrink-0">{v.value}</span>
                  </li>
                );
              })}
            </ul>
            <button type="button" onClick={onGoForm} className="mt-8 fg-cta-primary py-4 px-8 rounded-xl inline-flex items-center justify-center gap-2 w-full sm:w-auto">
              {ctaOverride ?? 'Unlock everything free'} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <div className="rounded-2xl border border-[#39ff14]/20 bg-[#151c2a]/80 p-6 flex flex-col justify-center">
            <p className="text-sm text-gray-400 mb-4">Join thousands of partners who started with this free playbook.</p>
            <button type="button" onClick={onGoForm} className="fg-cta-secondary py-3 rounded-xl font-bold uppercase tracking-wider text-sm">
              Start now — no card
            </button>
          </div>
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
        <div className="bg-[#151c2a] border border-[#39ff14]/20 rounded-2xl sm:rounded-[2rem] p-6 sm:p-10 text-center shadow-[0_0_50px_rgba(57,255,20,0.1)]">
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
