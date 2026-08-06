import React from 'react';
import { ArrowRight } from 'lucide-react';
import { careerSolidBtn, type CareerAccent } from './careerUi';

export type CareerTierStickySummaryEconomics = {
  keepPctLabel?: string;
  buyInLabel?: string;
  commissionLabel?: string;
};

type Props = {
  roleLabel: string;
  tierName?: string;
  economics?: CareerTierStickySummaryEconomics;
  ctaLabel: string;
  onCta?: () => void;
  accent?: CareerAccent;
  /** Hide the bar entirely (e.g. before any tier is selected). Defaults to visible. */
  visible?: boolean;
  className?: string;
};

/**
 * Fixed bottom summary bar — keeps the current choice + CTA reachable on long
 * career pages. Pages using this should add bottom padding (e.g. `pb-16`) to
 * their last section so content never sits under the bar.
 */
export function CareerTierStickySummary({
  roleLabel,
  tierName,
  economics,
  ctaLabel,
  onCta,
  accent = 'navy',
  visible = true,
  className = '',
}: Props) {
  if (!visible) return null;
  const stats = [economics?.keepPctLabel, economics?.buyInLabel, economics?.commissionLabel].filter(Boolean) as string[];

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t-2 border-slate-200 bg-white/97 backdrop-blur-md shadow-[0_-20px_50px_-20px_rgba(15,23,42,0.25)] ${className}`}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {roleLabel}
            {tierName ? ` · ${tierName}` : ''}
          </p>
          {stats.length ? <p className="mt-0.5 truncate text-sm font-bold text-slate-800">{stats.join(' · ')}</p> : null}
        </div>
        <button type="button" onClick={onCta} disabled={!onCta} className={careerSolidBtn(accent, 'h-11 py-0')}>
          {ctaLabel} <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
