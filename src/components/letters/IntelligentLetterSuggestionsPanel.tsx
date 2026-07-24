import React, { useEffect, useState } from 'react';
import { ArrowRight, Eye, FileText, Sparkles } from 'lucide-react';
import type { DebtLetterType } from '../../domain/debtLegal';
import type { IntelligentLetterSuggestions, RankedLetterSuggestion } from '../../lib/intelligentLetterSuggestions';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlowPanel,
  finelyOsGlowTile,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

export const LETTER_SUGGEST_PANEL_ID = 'fc-letter-suggest-panel';
export const LETTER_SUGGEST_PRIMARY_ID = 'fc-letter-suggest-primary';

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
  const [flash, setFlash] = useState(false);
  const primary = suggestions.primary;
  const alts = suggestions.alternatives;

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(false), 1800);
    return () => window.clearTimeout(t);
  }, [flash]);

  const focusAndBuild = (args: { letterType?: DebtLetterType; catalogId?: string }) => {
    setFlash(true);
    const el = document.getElementById(LETTER_SUGGEST_PRIMARY_ID);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.classList.add('fc-suggest-hit');
    window.setTimeout(() => el?.classList.remove('fc-suggest-hit'), 1600);
    onBuild(args);
  };

  const glowAccent = accent === 'emerald' ? 'emerald' : accent === 'sky' ? 'sky' : accent === 'violet' ? 'violet' : 'fuchsia';

  return (
    <section
      id={LETTER_SUGGEST_PANEL_ID}
      className={`relative overflow-hidden rounded-2xl border px-3 py-3 space-y-3 scroll-mt-4 ${finelyOsGlowPanel(
        primary.urgency === 'critical' ? 'amber' : glowAccent,
      )} ${flash ? 'ring-2 ring-amber-300/70' : ''}`}
      aria-label="Recommended letters"
    >
      <style>{`
        @keyframes fcSuggestPulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.95; transform: scale(1.08); }
        }
        @keyframes fcSuggestBorder {
          0%, 100% { box-shadow: 0 0 0 1px rgba(251,191,36,0.35), 0 0 28px rgba(251,191,36,0.22); }
          50% { box-shadow: 0 0 0 2px rgba(251,191,36,0.7), 0 0 42px rgba(251,191,36,0.45); }
        }
        .fc-suggest-orb {
          animation: fcSuggestPulse 2.8s ease-in-out infinite;
        }
        .fc-suggest-primary {
          animation: fcSuggestBorder 2.4s ease-in-out infinite;
        }
        .fc-suggest-hit {
          outline: 2px solid rgba(251,191,36,0.95);
          outline-offset: 3px;
        }
      `}</style>

      <div
        className="fc-suggest-orb pointer-events-none absolute -top-10 -right-6 h-36 w-36 rounded-full blur-3xl bg-amber-400/40"
        aria-hidden
      />
      <div
        className="fc-suggest-orb pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full blur-3xl bg-fuchsia-400/25"
        aria-hidden
        style={{ animationDelay: '0.8s' }}
      />

      <div className="relative flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">
            <Sparkles size={12} className="text-amber-300" /> Intelligent next letter
          </div>
          <h3 className="mt-1 text-base font-black tracking-tight text-white drop-shadow-[0_0_18px_rgba(251,191,36,0.35)]">
            {suggestions.headline}
          </h3>
          {suggestions.patternLabel ? (
            <p className={`mt-0.5 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>{suggestions.patternLabel}</p>
          ) : null}
        </div>
        <span className={urgencyChip(primary.urgency)}>{primary.urgency}</span>
      </div>

      <button
        type="button"
        id={LETTER_SUGGEST_PRIMARY_ID}
        className={`fc-suggest-primary relative w-full text-left rounded-xl border border-amber-300/55 bg-gradient-to-br from-amber-500/25 via-black/50 to-fuchsia-500/15 px-3 py-3 space-y-2 transition-all hover:border-amber-200/80 hover:from-amber-500/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80 ${finelyOsGlowTile(
          'amber',
          true,
        )}`}
        onClick={() => focusAndBuild({ letterType: primary.letterType, catalogId: primary.catalogId })}
        aria-label={`Build and preview ${primary.title}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <FileText size={18} className="text-amber-200 shrink-0 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
          <div className="text-lg font-black text-white tracking-tight">{primary.title}</div>
          <span className={finelyOsStatusChip('ok')}>Primary</span>
        </div>
        <p className={`text-sm leading-snug text-amber-50/95`}>
          <span className="font-black text-amber-200 uppercase tracking-wider text-[10px] mr-1.5">Why now</span>
          {primary.why}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className={`${FINELY_OS_PRIMARY_BTN} min-h-11 justify-center pointer-events-none`}>
            Build this letter next <ArrowRight size={16} />
          </span>
          <span className={`${FINELY_OS_SECONDARY_BTN} min-h-11 justify-center pointer-events-none text-amber-100 border-amber-300/40`}>
            <Eye size={14} /> Opens letter preview
          </span>
        </div>
      </button>

      {alts.length > 0 ? (
        <div className="relative space-y-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/55">Also recommended</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {alts.map((s) => (
              <div
                key={`${s.rank}-${s.catalogId || s.letterType}`}
                className={`${finelyOsGlowTile(glowAccent)} px-3 py-2.5 space-y-1.5`}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-white/40">#{s.rank}</span>
                  <div className="text-xs font-semibold text-white/95">{s.title}</div>
                  <span className={urgencyChip(s.urgency)}>{s.urgency}</span>
                </div>
                <p className={`text-[11px] leading-snug ${FINELY_OS_ENTITY_BODY}`}>{s.why}</p>
                <button
                  type="button"
                  className={`${FINELY_OS_SECONDARY_BTN} text-[10px]`}
                  onClick={() => focusAndBuild({ letterType: s.letterType, catalogId: s.catalogId })}
                >
                  Build + preview
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
