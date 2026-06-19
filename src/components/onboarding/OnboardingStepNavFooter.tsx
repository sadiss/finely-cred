import React from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '../ui';

/** Short label for the sticky mobile header — full text stays in title when disabled. */
export function onboardingHeaderContinueLabel(nextLabel: string): string {
  if (/create account/i.test(nextLabel)) return 'Create';
  if (/continue to profile/i.test(nextLabel)) return 'Continue';
  if (nextLabel.length > 14) return 'Continue';
  return nextLabel;
}

/** Primary action pinned in the header on phone and tablet — always visible without scrolling. */
export function OnboardingWizardHeaderContinue({
  onNext,
  nextLabel = 'Continue',
  nextDisabled,
}: {
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  const short = onboardingHeaderContinueLabel(nextLabel);
  return (
    <span className="lg:hidden ml-auto shrink-0" title={nextDisabled && nextLabel !== short ? nextLabel : undefined}>
      <Button
        onClick={onNext}
        disabled={nextDisabled}
        size="sm"
        className="min-h-[44px] min-w-[7.5rem] px-4 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-fuchsia-500/10 touch-manipulation"
      >
        {short}
      </Button>
    </span>
  );
}

/** Header Previous on phone/tablet — replaces Start over in the top bar. */
export function OnboardingWizardHeaderPrevious({ prev }: { prev?: () => void }) {
  if (!prev) return null;
  return (
    <button
      type="button"
      onClick={prev}
      className="lg:hidden inline-flex items-center gap-2 min-h-[44px] text-[10px] font-black uppercase tracking-widest text-white/55 hover:text-white transition-colors px-2 shrink-0 touch-manipulation"
    >
      <ArrowLeft size={14} /> Previous
    </button>
  );
}

/** Wizard footer — desktop only; phone/tablet use header Previous + Continue. */
export function OnboardingWizardNavBar({
  prev,
  onNext,
  onStartOver,
  nextLabel = 'Continue',
  nextDisabled,
}: {
  prev?: () => void;
  onNext: () => void;
  onStartOver?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div
      data-fc-onboarding-nav="1"
      className="fc-onboarding-wizard-nav hidden lg:block shrink-0 relative z-[60] border-t border-white/15 bg-[#070b10]/98 backdrop-blur-xl shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.65)] px-4 sm:px-6 md:px-12 py-3 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex flex-col gap-3 max-w-4xl mx-auto w-full md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex w-full md:w-auto md:flex md:flex-row md:gap-3">
          {prev ? (
            <button
              type="button"
              onClick={prev}
              className="inline-flex w-full md:w-auto items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl border border-white/15 bg-white/[0.06] text-[10px] font-black uppercase tracking-widest text-white/85 hover:bg-white/10 transition-all touch-manipulation"
            >
              <ArrowLeft size={14} /> Previous
            </button>
          ) : (
            <div className="hidden md:block min-h-[48px] w-[140px]" aria-hidden />
          )}
          {onStartOver ? (
            <button
              type="button"
              onClick={onStartOver}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 text-[10px] font-black uppercase tracking-widest text-fuchsia-100 hover:bg-fuchsia-500/20 transition-all touch-manipulation"
            >
              <RotateCcw size={13} /> Start over
            </button>
          ) : null}
        </div>
        <Button
          onClick={onNext}
          disabled={nextDisabled}
          size="lg"
          className="w-full md:w-auto md:min-w-[200px] min-h-[48px] shadow-lg shadow-fuchsia-500/10 touch-manipulation shrink-0"
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}

export const OnboardingStepNavFooter = OnboardingWizardNavBar;
