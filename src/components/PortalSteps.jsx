import React from 'react';
import { FinelyNowDoThisStrip } from './tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from './tours/FinelyNoticedStrip';
import { buildOnboardingMonitoringNoticedItems } from '../lib/finelyProactiveSignals';

/**
 * Legacy onboarding step shell — kept for launch audits and optional embeds.
 * Primary wizard lives in `portal/index.tsx`; this module exposes plain-language copy + proactive strips.
 */
export function PortalStepsFrame({ children }) {
  return (
    <div className="fc-senior-simple space-y-4 min-w-0">
      <FinelyNoticedStrip items={buildOnboardingMonitoringNoticedItems()} />
      <FinelyNowDoThisStrip currentIndex={0} />
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 sm:p-6">{children}</div>
    </div>
  );
}

export function PortalCreditIssuesStep({ data, update }) {
  return (
    <PortalStepsFrame>
      <p className="text-[10px] font-black tracking-[0.6em] text-fuchsia-400 uppercase">Step 04 // Credit issues</p>
      <h2 className="text-2xl sm:text-3xl font-light text-white leading-tight mt-2">
        What holds your <span className="text-fuchsia-400">score back?</span>
      </h2>
      <p className="text-white/55 text-sm mt-2">Building your plan starts here — tap what shows on your reports today.</p>
      <label className="mt-4 block text-sm text-white/70">
        Notes (optional)
        <textarea
          className="mt-1 w-full rounded-xl border border-white/[0.08] bg-black/25 p-3 text-white min-h-[48px]"
          value={data?.creditNotes || ''}
          onChange={(e) => update?.({ creditNotes: e.target.value })}
          rows={2}
        />
      </label>
    </PortalStepsFrame>
  );
}

export default PortalCreditIssuesStep;
