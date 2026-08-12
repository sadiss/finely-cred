import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FINELY_WOW_CHIPS, type FinelyWowChip } from '../../config/finelyMarketingDifferentiators';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  finelyOsCatalogCardCompact,
  finelyOsMicroStat,
} from '../../features/os/finelyOsLightUi';

type Props = {
  chips?: FinelyWowChip[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
};

/** Compact luxury wow strip — Finely differentiators as chips, not feature-gap copy. */
export function FinelyMarketingWowStrip({
  chips = FINELY_WOW_CHIPS,
  title = 'Why Finely feels different',
  subtitle = 'Live tools, fight-back debt lane, and credit-building financing — not “missing features.”',
  compact = false,
  className = '',
}: Props) {
  const navigate = useNavigate();

  return (
    <section className={`${finelyOsCatalogCardCompact('emerald')} space-y-3 ${className}`} data-fc-accent="emerald">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-emerald-300/90 text-[10px] font-black uppercase tracking-[0.2em]">
            <Sparkles size={12} /> Finely edge
          </div>
          <h3 className={`mt-1 font-bold text-white ${compact ? 'text-base' : 'text-xl'}`}>{title}</h3>
          {!compact ? <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{subtitle}</p> : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={`text-left ${finelyOsMicroStat(chip.accent)} max-w-xs`}
            title={chip.hint}
            onClick={() => chip.path && navigate(chip.path)}
          >
            <span className={FINELY_OS_ENTITY_SUBLABEL}>{chip.label}</span>
            <span className={`block mt-0.5 text-[11px] font-normal normal-case tracking-normal ${FINELY_OS_ENTITY_BODY}`}>
              {chip.hint}
            </span>
          </button>
        ))}
      </div>
      {!compact ? (
        <button type="button" className="fc-wayfinder-secondary inline-flex items-center gap-2 text-xs font-semibold" onClick={() => navigate('/free-guide')}>
          Start free guide <ArrowRight size={12} />
        </button>
      ) : null}
    </section>
  );
}
