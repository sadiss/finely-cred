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
  className?: string;
};

export function AgencySplitBreakdown({ tier, variant = 'full', className = '' }: Props) {
  const rows = getAgencyTierSplitBreakdown(tier);
  if (!rows.length) return null;

  const headline = formatAgencyTierKeepHeadline(tier);
  const showHeadline = variant === 'full';

  return (
    <div className={`space-y-3 ${className}`}>
      {showHeadline && headline ? (
        <div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-300">{headline}</div>
          <div className="text-white/50 text-sm mt-1">Revenue share only — no platform access fee</div>
        </div>
      ) : null}

      <div
        className={`fc-light-glass-panel fc-light-chrome-panel rounded-xl overflow-hidden ${
          variant === 'compact' ? 'text-xs' : 'text-sm'
        }`}
      >
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-3 py-2 border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-white/40 font-semibold">
          <span>Phase</span>
          <span className="text-right">You</span>
          <span className="text-right">Finely</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-3 py-2.5 border-b border-white/5 last:border-b-0 items-start"
          >
            <div className="min-w-0">
              <div className="text-white/90 font-medium">{row.label}</div>
              {row.description && variant === 'full' ? (
                <div className="text-white/45 text-xs mt-0.5 leading-snug">{row.description}</div>
              ) : null}
            </div>
            <div className="text-emerald-300 font-semibold tabular-nums text-right shrink-0">{row.agentKeepPct}%</div>
            <div className="text-amber-200/80 font-semibold tabular-nums text-right shrink-0">{row.platformPct}%</div>
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
