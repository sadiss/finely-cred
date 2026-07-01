import React from 'react';
import {
  formatAgencyTierKeepHeadline,
  getAgencyTierSplitBreakdown,
  type AgencyTier,
} from '../../config/pricingCatalog';

type Props = {
  tier: AgencyTier;
  /** Compact: single-line summary + stacked rows. Inline: rows only. */
  variant?: 'full' | 'compact' | 'inline';
  /** light = public marketing pages; dark = hub/admin glass panels */
  theme?: 'light' | 'dark';
  className?: string;
};

export function AgencySplitBreakdown({ tier, variant = 'full', theme = 'dark', className = '' }: Props) {
  const rows = getAgencyTierSplitBreakdown(tier);
  if (!rows.length) return null;

  const headline = formatAgencyTierKeepHeadline(tier);
  const showHeadline = variant === 'full';
  const isLight = theme === 'light';

  return (
    <div className={`space-y-3 ${className}`}>
      {showHeadline && headline ? (
        <div>
          <div className={`text-2xl sm:text-3xl font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>{headline}</div>
          <div className={`text-base mt-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Revenue share only — no platform fee</div>
        </div>
      ) : null}

      <div
        className={`rounded-xl overflow-hidden ${
          isLight
            ? 'border border-slate-200 bg-white text-sm'
            : `fc-light-glass-panel fc-light-chrome-panel ${variant === 'compact' ? 'text-xs' : 'text-sm'}`
        }`}
      >
        <div
          className={`grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-3 border-b text-xs sm:text-sm uppercase tracking-wider font-bold ${
            isLight ? 'border-slate-200 text-slate-500 bg-slate-50' : 'border-white/[0.08] text-white/40'
          }`}
        >
          <span>Phase</span>
          <span className="text-right">You keep</span>
          <span className="text-right">Finely</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.label}
            className={`grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-4 border-b last:border-b-0 items-start ${
              isLight ? 'border-slate-100' : 'border-white/5'
            }`}
          >
            <div className="min-w-0">
              <div className={`font-bold text-base sm:text-lg ${isLight ? 'text-slate-900' : 'text-white/90'}`}>{row.label}</div>
              {row.description && variant === 'full' ? (
                <div className={`text-sm mt-1 leading-snug ${isLight ? 'text-slate-500' : 'text-white/45'}`}>{row.description}</div>
              ) : null}
            </div>
            <div className={`text-xl sm:text-2xl font-black tabular-nums text-right shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
              {row.agentKeepPct}%
            </div>
            <div className={`text-lg sm:text-xl font-bold tabular-nums text-right shrink-0 ${isLight ? 'text-amber-700' : 'text-amber-200/80'}`}>
              {row.platformPct}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** One-line keep summary for tier pickers and lists. */
export function AgencySplitSummaryLine({ tier }: { tier: AgencyTier }) {
  const rows = getAgencyTierSplitBreakdown(tier);
  if (!rows.length) {
    return tier.pricingModel === 'custom' ? <>Custom split</> : null;
  }
  if (tier.pricingModel === 'custom' && rows.length >= 2) {
    const certified = rows.find((r) => r.label.toLowerCase().includes('certified')) ?? rows[1];
    return <>From {certified.agentKeepPct}% keep (custom)</>;
  }
  if (rows.length === 1) return <>{rows[0].agentKeepPct}% keep</>;
  return (
    <>
      {rows[0].agentKeepPct}% → {rows[rows.length - 1].agentKeepPct}% keep
    </>
  );
}
