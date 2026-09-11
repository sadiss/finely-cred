import React from 'react';
import {
  formatBusinessCapitalOutlook,
  type PricingPackage,
} from '../../config/pricingCatalog';
import { BC_CAPITAL_OUTLOOK_COMPLIANCE } from '../../config/businessCapitalOutlook';

type Props = {
  pkg: PricingPackage;
  /** Compact = tighter type for quote/catalog cards */
  compact?: boolean;
  tone?: 'dark' | 'light';
  className?: string;
};

/** Three figures: program fee · est. vendor/trade outlay · potential BC capital. */
export function BusinessCapitalOutlookBlock({ pkg, compact = false, tone = 'dark', className = '' }: Props) {
  const outlook = formatBusinessCapitalOutlook(pkg);
  if (!outlook) return null;

  const light = tone === 'light';
  const labelCls = compact
    ? `text-[10px] font-extrabold uppercase tracking-wider ${light ? 'text-[#3d4f66]' : 'text-white/50'}`
    : `text-[11px] font-extrabold uppercase tracking-wider ${light ? 'text-[#3d4f66]' : 'text-white/50'}`;
  const valueCls = `text-sm font-semibold ${light ? 'text-[#0a1628]' : 'text-white'}`;

  return (
    <div
      className={`rounded-xl border p-3 space-y-2 ${
        light ? 'border-emerald-600/20 bg-emerald-500/8' : 'border-amber-500/20 bg-amber-500/5'
      } ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <div className={labelCls}>Program fee</div>
          <div className={valueCls}>{outlook.programLabel}</div>
        </div>
        <div>
          <div className={labelCls}>Est. vendor/trade outlay</div>
          <div className={valueCls}>{outlook.outlayLabel}</div>
        </div>
        <div>
          <div className={labelCls}>Potential capital (BC only)</div>
          <div className={`${valueCls} ${light ? 'text-emerald-800' : 'text-amber-200'}`}>{outlook.potentialLabel}</div>
        </div>
      </div>
      <p className={`text-[11px] font-semibold leading-snug ${light ? 'text-[#3d4f66]' : 'text-white/45'}`}>{outlook.outlayNote}</p>
      <p className={`text-[11px] font-bold uppercase tracking-wider ${light ? 'text-[#3d4f66]' : 'text-white/40'}`}>
        {BC_CAPITAL_OUTLOOK_COMPLIANCE}
      </p>
    </div>
  );
}
