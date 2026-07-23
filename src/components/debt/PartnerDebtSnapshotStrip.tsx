import React, { useMemo } from 'react';
import { Scale } from 'lucide-react';
import { computePartnerDebtSnapshot } from '../../lib/debtCreditorIntel';
import { finelyOsGlowKpi } from '../../features/os/finelyOsLightUi';

function usd(cents: number): string {
  if (!cents) return '—';
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function PartnerDebtSnapshotStrip({
  partnerId,
  compact = false,
  accent = 'fuchsia' as const,
}: {
  partnerId: string;
  compact?: boolean;
  accent?: 'emerald' | 'fuchsia' | 'sky' | 'amber' | 'violet';
}) {
  const snap = useMemo(() => computePartnerDebtSnapshot(partnerId), [partnerId]);

  const chips = [
    { label: 'On report', value: usd(snap.reportedCents), hint: snap.reportedCount ? `${snap.reportedCount} tradeline${snap.reportedCount === 1 ? '' : 's'}` : 'Upload report' },
    { label: 'In cases', value: usd(snap.claimedCents), hint: 'Your case file' },
    { label: 'Summons claimed', value: usd(snap.summonsClaimedCents), hint: snap.summonsCount ? `${snap.summonsCount} case${snap.summonsCount === 1 ? '' : 's'}` : 'None yet' },
  ];

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <div key={c.label} className={`${finelyOsGlowKpi(accent)} !px-3 !py-2 text-left`}>
            <div className="text-[10px] uppercase tracking-widest text-white/50">{c.label}</div>
            <div className="text-sm font-bold text-white">{c.value}</div>
            <div className="text-[10px] text-white/45">{c.hint}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-white/10 bg-black/25 !p-3 space-y-2`}>
      <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
        <Scale size={14} className="text-fuchsia-300" />
        Debt snapshot
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {chips.map((c) => (
          <div key={c.label} className={`${finelyOsGlowKpi(accent)} !p-3`}>
            <div className="text-[10px] uppercase tracking-widest text-white/50">{c.label}</div>
            <div className="mt-1 text-lg font-black text-white">{c.value}</div>
            <div className="text-[10px] text-white/45">{c.hint}</div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-white/40">Educational totals from your cases and uploaded reports — not legal advice.</p>
    </div>
  );
}
