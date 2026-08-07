import React from 'react';
import {
  ArrowRight,
  Bell,
  FileText,
  FolderOpen,
  Gavel,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { DISPUTE_LETTER_GUIDE_COVER } from '../../resources/disputeLetterGuideContent';

/** Demo partner file — conversion-forward mid-journey snapshot. */
const DEMO = {
  overallScore: 682,
  scoreDelta: 24,
  readinessPct: 68,
  negatives: 4,
  letters: 2,
  vaultFiles: 6,
  roundReady: 1,
} as const;

const SOLUTION_PILLARS = [
  { title: 'Credit restore', hint: 'Clear the path', icon: TrendingUp },
  { title: 'Dispute letters', hint: 'Round 1 ready', icon: Gavel },
  { title: 'Funding readiness', hint: 'Education track', icon: Sparkles },
] as const;

export function FreeGuideBook({ className = '' }: { className?: string }) {
  return (
    <div className={`fg-book relative aspect-[723/1024] ${className}`}>
      <div className="fg-book-spine absolute inset-y-[2%] left-0 w-[7px] -translate-x-[4px] rounded-l-[4px] z-[5]" />
      <div className="fg-book-pages absolute top-0 bottom-0 left-3 right-[-10px] rounded-[3px_12px_12px_3px] z-[8]" />
      <div className="fg-book-cover absolute inset-y-0 left-[6px] right-0 rounded-[3px_12px_12px_3px] overflow-hidden z-[10]">
        <img
          src={DISPUTE_LETTER_GUIDE_COVER}
          alt="Free Credit Dispute Letter Guide"
          className="absolute inset-0 w-full h-full fg-book-cover-img"
          loading="eager"
        />
        <div className="absolute inset-y-0 left-0 w-[4%] bg-gradient-to-r from-black/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

export function LeadMagnetEbook({ compact = false }: { compact?: boolean }) {
  const shell = compact
    ? 'fg-book-shell relative w-full max-w-[240px] sm:max-w-[260px] mx-auto overflow-visible py-4 sm:py-5'
    : 'fg-book-shell relative mx-auto w-full max-w-[min(100%,240px)] overflow-visible py-5 sm:max-w-[min(100%,260px)] md:max-w-[min(100%,200px)] md:py-3 lg:max-w-[min(100%,280px)] lg:py-6 xl:max-w-[min(100%,340px)] xl:py-8 2xl:max-w-[400px] 2xl:py-10';

  return (
    <div className={shell}>
      <div className="fg-hero-aura absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[125%] h-[120%] -z-10 pointer-events-none" />
      <FreeGuideBook className="mx-auto w-[84%] sm:w-[86%] md:w-[88%] lg:w-[86%]" />
    </div>
  );
}

/** Tablet screen — converting offer board (not a dense portal walkthrough). */
function PortalDashboardBrowserMock() {
  return (
    <div className="fg-device-browser">
      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#070b10] border-b border-emerald-400/25">
        <div className="flex gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500/80" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/90 shadow-[0_0_8px_rgba(52,211,153,0.95)]" />
        </div>
        <div className="flex flex-1 items-center min-w-0 px-2 py-0.5 rounded-md bg-black/40 border border-[#c9a227]/30">
          <span className="text-[8px] text-[#e8c96a]/85 truncate font-semibold tracking-wide">
            finelycred.com · full credit solutions
          </span>
        </div>
        <Bell className="w-3 h-3 text-emerald-300/60 shrink-0" />
      </div>

      <div className="fg-device-browser-body space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[7px] font-black uppercase tracking-[0.2em] text-[#e8c96a]">Finely Cred · partners</div>
            <div className="text-[13px] font-black text-white leading-tight mt-0.5">
              Restore · Disputes · Funding path
            </div>
          </div>
          <span className="shrink-0 rounded-md border border-emerald-400/50 bg-emerald-500/20 px-1.5 py-1 text-[8px] font-black uppercase tracking-wide text-emerald-200 shadow-[0_0_14px_-2px_rgba(52,211,153,0.75)]">
            Free today
          </span>
        </div>

        <div className="grid grid-cols-12 gap-1.5">
          <div className="col-span-4 rounded-xl border border-emerald-400/45 bg-gradient-to-br from-emerald-500/25 to-emerald-900/40 p-2 text-center shadow-[0_0_28px_-6px_rgba(57,255,20,0.55)]">
            <div className="text-[7px] font-bold uppercase tracking-wider text-emerald-200/80">Score climb</div>
            <div className="mt-0.5 text-[1.35rem] font-extralight tabular-nums text-emerald-200 leading-none drop-shadow-[0_0_14px_rgba(52,211,153,0.7)]">
              {DEMO.overallScore}
            </div>
            <div className="mt-1 text-[10px] font-black text-[#e8c96a]">+{DEMO.scoreDelta} pts</div>
            <div className="text-[6px] text-emerald-100/50 mt-0.5">Results vary</div>
          </div>

          <div className="col-span-8 rounded-xl border border-[#c9a227]/40 bg-gradient-to-br from-[#c9a227]/18 to-black/40 p-2 shadow-[0_0_24px_-6px_rgba(201,162,39,0.55)]">
            <div className="text-[7px] font-black uppercase tracking-[0.16em] text-[#e8c96a]">What you unlock free</div>
            <div className="mt-1.5 grid grid-cols-3 gap-1">
              {SOLUTION_PILLARS.map(({ title, hint, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-lg border border-white/10 bg-black/35 px-1 py-1.5 text-center"
                >
                  <Icon className="mx-auto h-3 w-3 text-[#e8c96a] mb-0.5" />
                  <div className="text-[8px] font-bold text-white leading-tight">{title}</div>
                  <div className="text-[6.5px] text-emerald-200/70 mt-0.5">{hint}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-400/30 via-amber-500/20 to-emerald-500/15 px-2.5 py-2 flex items-center justify-between gap-2 shadow-[0_0_26px_-4px_rgba(251,191,36,0.7)]">
          <div className="min-w-0">
            <div className="text-[7px] font-black uppercase tracking-[0.18em] text-amber-100">Do this next</div>
            <div className="text-[11px] font-black text-white leading-snug">
              Sign up free · draft Round 1 letters
            </div>
          </div>
          <span className="shrink-0 inline-flex items-center gap-0.5 rounded-lg bg-[#1aad4b] px-2 py-1.5 text-[9px] font-black uppercase tracking-wide text-[#04140a] shadow-[0_0_18px_rgba(57,255,20,0.55)]">
            Sign up free <ArrowRight className="h-3 w-3" />
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {[
            { title: 'Round 1', stat: 'Letters ready', icon: Gavel },
            { title: 'Proof vault', stat: `${DEMO.vaultFiles} files`, icon: FolderOpen },
            { title: 'Negatives', stat: `${DEMO.negatives} in scope`, icon: FileText },
            { title: 'Next step', stat: 'Claim free', icon: ListChecks },
          ].map(({ title, stat, icon: Icon }) => (
            <div
              key={title}
              className="rounded-lg border border-emerald-400/30 bg-emerald-500/[0.12] px-1 py-1.5 text-center shadow-[0_0_16px_-8px_rgba(52,211,153,0.65)]"
            >
              <Icon className="mx-auto h-2.5 w-2.5 text-emerald-300 mb-0.5" />
              <div className="text-[8px] font-bold text-white">{title}</div>
              <div className="text-[7px] text-emerald-100/70">{stat}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Phone screen — glowing one-tap conversion surface. */
function PortalPhoneMock() {
  return (
    <div className="fg-device-phone-bezel relative">
      <div className="fg-phone-notch" aria-hidden />
      <div className="fg-device-phone-screen relative">
        <div className="fg-phone-ui">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="fg-phone-title">Finely Cred</span>
            <Bell className="w-[1.15em] h-[1.15em] text-emerald-300/80 shrink-0" strokeWidth={2.25} />
          </div>

          <div className="rounded-[0.5em] border border-[#c9a227]/55 bg-gradient-to-br from-[#c9a227]/30 to-emerald-600/20 px-[0.45em] py-[0.4em] mb-[0.55em] text-center shadow-[0_0_18px_-3px_rgba(201,162,39,0.75)]">
            <div className="fg-phone-label font-black text-[#e8c96a]">Full credit solution</div>
            <div className="fg-phone-title mt-[0.15em] text-white">Restore · Disputes · Funding</div>
          </div>

          <div className="rounded-[0.5em] border border-emerald-400/50 bg-emerald-500/18 px-[0.45em] py-[0.6em] text-center mb-[0.55em] shadow-[0_0_22px_-4px_rgba(57,255,20,0.65),inset_0_0_20px_rgba(16,185,129,0.2)]">
            <div className="fg-phone-label">Score climb</div>
            <div className="fg-phone-score">{DEMO.overallScore}</div>
            <div className="font-black text-[#e8c96a]" style={{ fontSize: '1em' }}>
              +{DEMO.scoreDelta} · results vary
            </div>
          </div>

          <div className="rounded-[0.45em] border border-emerald-400/35 bg-black/35 px-[0.4em] py-[0.4em] mb-[0.55em]">
            <div className="fg-phone-label mb-[0.25em]">Round 1 letters</div>
            <div className="flex items-center justify-between gap-1">
              <span className="fg-phone-title text-white">{DEMO.roundReady} draft ready</span>
              <Gavel className="w-[1.1em] h-[1.1em] text-emerald-300" />
            </div>
          </div>

          <div className="rounded-[0.55em] border border-amber-300/60 bg-gradient-to-br from-amber-400/40 to-[#1aad4b]/35 px-[0.45em] py-[0.65em] mt-auto text-center shadow-[0_0_24px_-2px_rgba(251,191,36,0.85)]">
            <div className="fg-phone-label font-black text-amber-50">One tap</div>
            <div className="fg-phone-title mt-[0.15em] text-white" style={{ fontSize: '1.15em' }}>
              Sign up free
            </div>
            <div className="mt-[0.2em] text-emerald-100 font-bold" style={{ fontSize: '0.85em' }}>
              Then draft Round 1 →
            </div>
          </div>

          <div className="grid grid-cols-4 gap-[0.25em] pt-[0.55em] mt-[0.45em] border-t border-emerald-400/20">
            {[LayoutDashboard, FileText, Gavel, MessageSquare].map((Icon, i) => (
              <div
                key={i}
                className={`flex justify-center py-[0.35em] rounded-[0.35em] ${
                  i === 2
                    ? 'text-amber-100 bg-amber-500/25 shadow-[0_0_12px_-2px_rgba(251,191,36,0.85)]'
                    : 'text-emerald-200/55'
                }`}
              >
                <Icon className="w-[1.15em] h-[1.15em]" strokeWidth={2.25} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeadMagnetDeviceShowcase({ className = '' }: { className?: string }) {
  return (
    <div className={`fg-device-showcase ${className}`}>
      <div className="fg-device-composition fg-device-composition--duo">
        <div className="fg-device-ambient" aria-hidden />
        <div className="fg-device-tablet-wrap">
          <p className="fg-device-kicker">Tablet · score climb + Round 1</p>
          <PortalDashboardBrowserMock />
        </div>
        <div className="fg-device-phone-solo">
          <p className="fg-device-kicker fg-device-kicker--phone">Phone · Sign up free</p>
          <PortalPhoneMock />
        </div>
      </div>
    </div>
  );
}

/** Standalone phone mock for wealth materials bands. */
export function FreeGuidePhoneMock({ className = '' }: { className?: string }) {
  return (
    <div className={`fg-materials-phone ${className}`}>
      <PortalPhoneMock />
    </div>
  );
}

const MATERIALS_SPREADS = [
  '/guides/credit-dispute-letter-guide/page-01.png',
  '/guides/credit-dispute-letter-guide/page-03.png',
  '/guides/credit-dispute-letter-guide/page-06.png',
] as const;

/**
 * One composition: glossy brochure pages + guide book + phone showing the e-guide cover
 * (not a separate portal phone parked beside the kit).
 */
export function FreeGuideMaterialsShowcase({ className = '' }: { className?: string }) {
  return (
    <div className={`fg-materials-showcase ${className}`}>
      <div className="fg-materials-stage" aria-label="Dispute guide materials mockup">
        {MATERIALS_SPREADS.map((src) => (
          <figure key={src} className="fg-materials-sheet">
            <img src={src} alt="" loading="lazy" />
          </figure>
        ))}
        <div className="fg-materials-book">
          <LeadMagnetEbook compact />
        </div>
        <div className="fg-materials-phone" aria-hidden={false}>
          <div className="fg-materials-phone-bezel relative">
            <span className="fg-materials-phone-notch" aria-hidden />
            <div className="fg-materials-phone-screen">
              <img src={DISPUTE_LETTER_GUIDE_COVER} alt="Dispute letter guide on phone" loading="lazy" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
