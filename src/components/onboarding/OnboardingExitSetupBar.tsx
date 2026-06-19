import React from 'react';
import { ArrowLeft, X } from 'lucide-react';

/** Clear X exit — visible on desktop, tablet, and phone. */
export function OnboardingExitCloseButton({
  onClick,
  showLabel = false,
  className = '',
}: {
  onClick: () => void;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Exit setup"
      title="Exit setup"
      className={`inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] shrink-0 rounded-xl border border-white/25 bg-white/[0.1] px-3 py-2 text-white/90 hover:text-white hover:border-white/40 hover:bg-white/[0.16] transition-colors touch-manipulation shadow-sm ${className}`}
    >
      <X size={20} strokeWidth={2.25} aria-hidden />
      {showLabel ? (
        <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest pr-0.5">Exit setup</span>
      ) : null}
    </button>
  );
}

/** @deprecated use OnboardingExitCloseButton */
export function OnboardingExitSetupButton({
  onClick,
  className = '',
}: {
  onClick: () => void;
  className?: string;
}) {
  return <OnboardingExitCloseButton onClick={onClick} showLabel className={className} />;
}

/** Top bar — account picker, sign-in, forgot password. */
export function OnboardingExitSetupBar({ onExit }: { onExit: () => void }) {
  return (
    <div className="relative bg-fc-shell/90 backdrop-blur-2xl border-b border-slate-800/60 px-4 sm:px-6 md:px-12 py-2.5 sm:py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="max-w-6xl mx-auto flex items-center">
        <OnboardingExitCloseButton onClick={onExit} showLabel />
      </div>
    </div>
  );
}

/** Desktop wizard row — exit left, center content, sign-in right. */
export function OnboardingWizardDesktopToolbar({
  onExit,
  onSignIn,
  center,
}: {
  onExit: () => void;
  onSignIn: () => void;
  center: React.ReactNode;
}) {
  return (
    <div className="hidden lg:flex items-center gap-5 max-w-6xl mx-auto w-full pt-2 pb-1">
      <OnboardingExitCloseButton onClick={onExit} showLabel />
      <div className="flex flex-1 flex-wrap items-center justify-center gap-2 min-w-0">{center}</div>
      <button
        type="button"
        onClick={onSignIn}
        className="shrink-0 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors min-h-[44px] px-2 whitespace-nowrap"
        title="Already have an account?"
      >
        Already have an account? Sign in
      </button>
    </div>
  );
}

/** Phone / tablet wizard top actions. */
export function OnboardingWizardMobileToolbar({
  onExit,
  prev,
  continueSlot,
}: {
  onExit: () => void;
  prev?: () => void;
  continueSlot: React.ReactNode;
}) {
  return (
    <div className="flex lg:hidden flex-wrap items-center gap-2 sm:gap-3">
      <OnboardingExitCloseButton onClick={onExit} />
      {prev ? (
        <button
          type="button"
          onClick={prev}
          className="inline-flex items-center gap-2 min-h-[44px] text-[10px] font-black uppercase tracking-widest text-white/55 hover:text-white transition-colors px-2 shrink-0 touch-manipulation"
        >
          <ArrowLeft size={14} /> Previous
        </button>
      ) : null}
      {continueSlot}
    </div>
  );
}
