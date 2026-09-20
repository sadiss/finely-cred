import React from 'react';
import { Phone, ShieldCheck } from 'lucide-react';
import { leadMagnetCallSlaLabel, leadMagnetCallSlaLabelHt } from '../../lib/leadMagnetCallSla';

type Props = {
  kreyol?: boolean;
  /** Extra trust line under the SLA. */
  trustLine?: string;
  tone?: 'light' | 'dark';
  className?: string;
};

export function FunnelHeroProofStrip({ kreyol = false, trustLine, tone = 'light', className = '' }: Props) {
  const sla = kreyol ? leadMagnetCallSlaLabelHt() : leadMagnetCallSlaLabel();
  const defaultTrust = kreyol
    ? 'Edikasyon sèlman · rezilta yo varye · pa gen pwomès nòt'
    : 'Educational only · results vary · no score promises';
  const isDark = tone === 'dark';

  return (
    <div
      className={
        className ||
        `mt-4 flex flex-col gap-2 rounded-2xl border px-3.5 py-3 sm:flex-row sm:items-center sm:gap-4 ${
          isDark
            ? 'border-amber-300/25 bg-black/35 text-amber-50'
            : 'border-[#fbbf24]/25 bg-[#fbbf24]/08 text-[#0a100e]'
        }`
      }
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <Phone className={`mt-0.5 h-4 w-4 shrink-0 ${isDark ? 'text-amber-200' : 'text-[#b45309]'}`} />
        <p className={`text-[13px] font-bold leading-snug ${isDark ? 'text-amber-50' : 'text-[#0a100e]'}`}>
          {sla}
        </p>
      </div>
      <p
        className={`inline-flex items-start gap-1.5 text-[11px] leading-snug sm:ml-auto ${
          isDark ? 'text-white/55' : 'text-[#0a100e]/55'
        }`}
      >
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {trustLine ?? defaultTrust}
      </p>
    </div>
  );
}
