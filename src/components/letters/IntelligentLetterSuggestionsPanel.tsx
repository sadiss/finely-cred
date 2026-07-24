import React from 'react';
import { ArrowRight, FileText, Sparkles } from 'lucide-react';
import type { DebtLetterType } from '../../domain/debtLegal';
import type { IntelligentLetterSuggestions, RankedLetterSuggestion } from '../../lib/intelligentLetterSuggestions';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

function urgencyChip(u: RankedLetterSuggestion['urgency']) {
  if (u === 'critical') return finelyOsStatusChip('blocked');
  if (u === 'high') return finelyOsStatusChip('warn');
  return finelyOsStatusChip('ok');
}

export function IntelligentLetterSuggestionsPanel({
  suggestions,
  onBuild,
  accent = 'fuchsia',
}: {
  suggestions: IntelligentLetterSuggestions;
  onBuild: (args: { letterType?: DebtLetterType; catalogId?: string }) => void;
  accent?: 'fuchsia' | 'emerald' | 'violet' | 'sky';
}) {
  const border =
    accent === 'emerald'
      ? 'border-emerald-400/35 bg-emerald-500/10'
      : accent === 'violet'
        ? 'border-violet-400/35 bg-violet-500/10'
        : accent === 'sky'
          ? 'border-sky-400/35 bg-sky-500/10'
          : 'border-fuchsia-400/35 bg-fuchsia-500/10';

  const primary = suggestions.primary;
  const alts = suggestions.alternatives;

  return (
    <section className={`rounded-2xl border ${border} px-3 py-3 space-y-3`} aria-label="Recommended letters">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-amber-200/90">
            <Sparkles size={12} /> Intelligent next letter
          </div>
          <h3 className="mt-1 text-sm font-bold text-white">{suggestions.headline}</h3>
          {suggestions.patternLabel ? (
            <p className={`mt-0.5 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>{suggestions.patternLabel}</p>
          ) : null}
        </div>
        <span className={urgencyChip(primary.urgency)}>{primary.urgency}</span>
      </div>

      <div className="rounded-xl border border-amber-400/40 bg-black/40 px-3 py-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <FileText size={16} className="text-amber-200 shrink-0" />
          <div className="text-base font-black text-white">{primary.title}</div>
          <span className={finelyOsStatusChip('ok')}>Primary</span>
        </div>
        <p className={`text-xs leading-snug ${FINELY_OS_ENTITY_BODY}`}>
          <span className="text-white/80 font-semibold">Why now: </span>
          {primary.why}
        </p>
        <button
          type="button"
          className={`${FINELY_OS_PRIMARY_BTN} w-full sm:w-auto justify-center min-h-11`}
          onClick={() => onBuild({ letterType: primary.letterType, catalogId: primary.catalogId })}
        >
          Build this letter next <ArrowRight size={16} />
        </button>
      </div>

      {alts.length > 0 ? (
        <div className="space-y-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/55">Also recommended</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {alts.map((s) => (
              <div key={`${s.rank}-${s.catalogId || s.letterType}`} className="rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-white/40">#{s.rank}</span>
                  <div className="text-xs font-semibold text-white/95">{s.title}</div>
                  <span className={urgencyChip(s.urgency)}>{s.urgency}</span>
                </div>
                <p className={`text-[11px] leading-snug ${FINELY_OS_ENTITY_BODY}`}>{s.why}</p>
                <button
                  type="button"
                  className={`${FINELY_OS_SECONDARY_BTN} text-[10px]`}
                  onClick={() => onBuild({ letterType: s.letterType, catalogId: s.catalogId })}
                >
                  Build alternative
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
