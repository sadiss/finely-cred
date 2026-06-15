import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { FINELY_OS_SECONDARY_BTN } from './finelyOsLightUi';

type Props = {
  message: string;
  hint?: string;
  onRetry?: () => void;
  className?: string;
};

export function FinelyOsDataErrorBanner({ message, hint, onRetry, className = '' }: Props) {
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
