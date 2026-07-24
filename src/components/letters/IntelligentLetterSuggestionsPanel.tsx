import React, { useEffect, useState } from 'react';
import { ArrowRight, Eye, FileText, Loader2, Sparkles } from 'lucide-react';
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
export const LETTER_SUGGEST_GENERATE_ID = 'fc-letter-suggest-generate';

function urgencyChip(u: RankedLetterSuggestion['urgency']) {
  if (u === 'critical') return finelyOsStatusChip('blocked');
  if (u === 'high') return finelyOsStatusChip('warn');
  return finelyOsStatusChip('ok');
}

export function IntelligentLetterSuggestionsPanel({
  suggestions,
  onBuild,
  onOpenHearingKit,
  accent = 'fuchsia',
  busy = false,
  error = null,
}: {
  suggestions: IntelligentLetterSuggestions;
  onBuild: (args: { letterType?: DebtLetterType; catalogId?: string }) => void;
  /** Court-day kit stays UI-only — parent opens hearing card instead of vault draft. */
  onOpenHearingKit?: () => void;
  accent?: 'fuchsia' | 'emerald' | 'violet' | 'sky';
  busy?: boolean;
  error?: string | null;
}) {
  const [flash, setFlash] = useState(false);
  const primary = suggestions.primary;
  const alts = suggestions.alternatives;

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(false), 1800);
    return () => window.clearTimeout(t);
  }, [flash]);

  const focusAndAct = (s: RankedLetterSuggestion) => {
    if (busy) return;
    setFlash(true);
    const el = document.getElementById(LETTER_SUGGEST_PRIMARY_ID);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.classList.add('fc-suggest-hit');
    window.setTimeout(() => el?.classList.remove('fc-suggest-hit'), 1600);
    // Hearing kit is UI-only — never call the letter generator for it.
    if (s.uiOnly || s.productKind === 'hearing_kit_ui') {
      if (onOpenHearingKit) {
        onOpenHearingKit();
        return;
      }
      // No kit handler (e.g. Validation track) — generate the next real letter instead.
      const letterAlt =
        suggestions.all.find((x) => !x.uiOnly && x.productKind !== 'hearing_kit_ui') || null;
      if (letterAlt) {
        onBuild({ letterType: letterAlt.letterType, catalogId: letterAlt.catalogId });
        return;
      }
      return;
    }
    onBuild({
      letterType: s.letterType,
      catalogId: s.catalogId || (s.letterType ? undefined : 'court_courtroom_written_answer'),
    });
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
          0%, 100% { box-shadow: 0 0 0 1px rgba(251,191,36,0.45), 0 0 32px rgba(251,191,36,0.35); }
          50% { box-shadow: 0 0 0 3px rgba(251,191,36,0.85), 0 0 52px rgba(251,191,36,0.55); }
        }
        @keyframes fcGenerateGlow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(251,191,36,0.4), 0 0 16px rgba(251,191,36,0.28); }
          50% { box-shadow: 0 0 0 2px rgba(253,230,138,0.7), 0 0 22px rgba(251,191,36,0.4); }
        }
        .fc-suggest-orb {
          animation: fcSuggestPulse 2.8s ease-in-out infinite;
        }
        .fc-suggest-primary {
          animation: fcSuggestBorder 2.4s ease-in-out infinite;
        }
        .fc-generate-cta {
          animation: fcGenerateGlow 2.4s ease-in-out infinite;
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

      <div
        id={LETTER_SUGGEST_PRIMARY_ID}
        className={`fc-suggest-primary relative w-full rounded-xl border border-amber-300/55 bg-gradient-to-br from-amber-500/25 via-black/50 to-fuchsia-500/15 px-3 py-3 space-y-3 ${finelyOsGlowTile(
          'amber',
          true,
        )}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <FileText size={18} className="text-amber-200 shrink-0 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
          <div className="text-lg font-black text-white tracking-tight">{primary.title}</div>
          <span className={finelyOsStatusChip('ok')}>Primary</span>
          <span className={finelyOsStatusChip(primary.uiOnly ? 'warn' : 'ok')}>{primary.productBadge}</span>
        </div>
        <p className="text-sm leading-snug text-amber-50/95">
          <span className="font-black text-amber-200 uppercase tracking-wider text-[10px] mr-1.5">Why now</span>
          {primary.why}
        </p>

        <button
          type="button"
          id={LETTER_SUGGEST_GENERATE_ID}
          disabled={busy}
          className={`fc-generate-cta ${FINELY_OS_PRIMARY_BTN} w-full sm:w-auto justify-center gap-1.5 !bg-amber-400 !text-black hover:!brightness-110 disabled:opacity-60 disabled:cursor-not-allowed`}
          onClick={() => focusAndAct(primary)}
          aria-label={primary.generateLabel}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          {busy ? 'Generating…' : primary.generateLabel}
          {!busy ? <ArrowRight size={14} /> : null}
        </button>
        <p className="text-[11px] text-amber-100/80 flex flex-wrap items-center gap-1.5 justify-center text-center">
          <Eye size={12} /> {primary.generateHint}
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="relative rounded-xl border border-rose-400/50 bg-rose-500/15 px-3 py-2.5 text-sm text-rose-50"
        >
          <div className="font-bold text-rose-100">Could not generate letter</div>
          <p className="mt-0.5 text-rose-50/90">{error}</p>
        </div>
      ) : null}

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
                <p className="text-[10px] font-semibold text-amber-100/80">{s.productBadge}</p>
                <p className={`text-[11px] leading-snug ${FINELY_OS_ENTITY_BODY}`}>{s.why}</p>
                <button
                  type="button"
                  disabled={busy}
                  className={`${FINELY_OS_SECONDARY_BTN} text-[10px] border-amber-300/40 text-amber-100 disabled:opacity-60`}
                  onClick={() => focusAndAct(s)}
                >
                  {s.uiOnly ? 'Open hearing kit' : s.generateLabel.replace(/^Generate /i, 'Generate ')}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
