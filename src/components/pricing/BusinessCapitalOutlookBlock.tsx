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
  className?: string;
};

/** Three figures: program fee · est. vendor/trade outlay · potential BC capital. */
export function BusinessCapitalOutlookBlock({ pkg, compact = false, className = '' }: Props) {
  const outlook = formatBusinessCapitalOutlook(pkg);
  if (!outlook) return null;

  const labelCls = compact
    ? 'text-[10px] uppercase tracking-wider text-white/50'
    : 'text-[11px] uppercase tracking-wider text-white/50';
  const valueCls = 'text-sm font-semibold text-white';

  return (
    <div className={`rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2 ${className}`}>
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
          <div className={`${valueCls} text-amber-200`}>{outlook.potentialLabel}</div>
        </div>
      </div>
      <p className="text-[10px] leading-snug text-white/45">{outlook.outlayNote}</p>
      <p className="text-[10px] uppercase tracking-wider text-white/40">
        {BC_CAPITAL_OUTLOOK_COMPLIANCE}
      </p>
    </div>
  );
}
