import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { FINELY_OS_SECONDARY_BTN } from './finelyOsLightUi';
import { finelyOsVisibleTintIcon, finelyOsVisibleTintMuted, finelyOsVisibleTintShell } from './finelyOsVisibleTint';

type Props = {
  message: string;
  hint?: string;
  onRetry?: () => void;
  className?: string;
  /** `light` = ivory/workspace beds — visible rose tint, dark ink (not pink wash). */
  surface?: 'dark' | 'light';
};

export function FinelyOsDataErrorBanner({ message, hint, onRetry, className = '', surface = 'dark' }: Props) {
  const light = surface === 'light';

  if (light) {
    return (
      <div
        className={`${finelyOsVisibleTintShell('rose')} flex flex-wrap items-start justify-between gap-3 ${className}`}
        data-fc-visible-tint="rose"
      >
        <div className="flex min-w-0 items-start gap-3">
          <AlertTriangle size={18} className={`${finelyOsVisibleTintIcon('rose')} shrink-0 mt-0.5`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-rose-950">{message}</p>
            {hint ? <p className={`mt-1 text-xs ${finelyOsVisibleTintMuted('rose')}`}>{hint}</p> : null}
          </div>
        </div>
        {onRetry ? (
          <button type="button" onClick={onRetry} className="fc-senior-tap-target rounded-xl border border-rose-500/45 bg-rose-600/20 px-3 py-2 text-xs font-bold text-rose-900 hover:bg-rose-600/30">
            <RefreshCw size={14} className="inline mr-1" /> Retry
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 flex flex-wrap items-start justify-between gap-3 ${className}`}>
      <div className="flex items-start gap-3 min-w-0">
        <AlertTriangle size={18} className="text-rose-300 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm text-rose-100">{message}</p>
          {hint ? <p className="text-xs text-rose-200/70 mt-1">{hint}</p> : null}
        </div>
      </div>
      {onRetry ? (
        <button type="button" onClick={onRetry} className={FINELY_OS_SECONDARY_BTN}>
          <RefreshCw size={14} /> Retry
        </button>
      ) : null}
    </div>
  );
}
