import React, { useEffect, useState } from 'react';
import { Eye, Sparkles } from 'lucide-react';
import type { DebtLetterType } from '../../domain/debtLegal';
import type { IntelligentLetterSuggestions, RankedLetterSuggestion } from '../../lib/intelligentLetterSuggestions';
import { FINELY_OS_ENTITY_BODY, finelyOsStatusChip } from '../../features/os/finelyOsLightUi';
import {
  LETTER_TEMPLATE_CATALOG_GRID,
  LETTER_TEMPLATE_CATALOG_SHELL,
  LetterTemplateCatalogCard,
} from '../debt/LetterTemplateCatalogCard';
import '../debt/validationDebtLayout.css';

export const LETTER_SUGGEST_PANEL_ID = 'fc-letter-suggest-panel';
export const LETTER_SUGGEST_PRIMARY_ID = 'fc-letter-suggest-primary';
export const LETTER_SUGGEST_GENERATE_ID = 'fc-letter-suggest-generate';

function urgencyChip(u: RankedLetterSuggestion['urgency']) {
  if (u === 'critical') return finelyOsStatusChip('blocked');
  if (u === 'high') return finelyOsStatusChip('warn');
  return finelyOsStatusChip('ok');
}

function suggestionMetaRow(s: RankedLetterSuggestion, primary = false) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {primary ? (
          <span className={finelyOsStatusChip('ok')}>Primary</span>
        ) : (
          <span className="text-[9px] font-black uppercase tracking-widest text-white/55">Alt #{s.rank}</span>
        )}
        <span className={finelyOsStatusChip(s.uiOnly ? 'warn' : 'ok')}>{s.productBadge}</span>
      </div>
      <span className={urgencyChip(s.urgency)}>{s.urgency}</span>
    </div>
  );
}

export function IntelligentLetterSuggestionsPanel({
  suggestions,
  onBuild,
  onOpenHearingKit,
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
    if (s.uiOnly || s.productKind === 'hearing_kit_ui') {
      if (onOpenHearingKit) {
        onOpenHearingKit();
        return;
      }
      const letterAlt = suggestions.all.find((x) => !x.uiOnly && x.productKind !== 'hearing_kit_ui') || null;
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

  const primaryCta = primary.uiOnly ? 'Open hearing kit' : primary.generateLabel || 'Generate letter';

  return (
    <section
      id={LETTER_SUGGEST_PANEL_ID}
      className={`fc-validation-suggest-shell relative overflow-hidden rounded-2xl px-3 py-3 space-y-3 scroll-mt-4 ${flash ? 'ring-2 ring-amber-300/70' : ''}`}
      aria-label="Recommended letters"
    >
      <style>{`
        @keyframes fcSuggestPulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.95; transform: scale(1.08); }
        }
        @keyframes fcGenerateGlow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(251,191,36,0.4), 0 0 16px rgba(251,191,36,0.28); }
          50% { box-shadow: 0 0 0 2px rgba(253,230,138,0.7), 0 0 22px rgba(251,191,36,0.4); }
        }
        .fc-suggest-orb { animation: fcSuggestPulse 2.8s ease-in-out infinite; }
        .fc-generate-cta { animation: fcGenerateGlow 2.4s ease-in-out infinite; }
        .fc-suggest-hit { outline: 2px solid rgba(251,191,36,0.95); outline-offset: 3px; }
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

      <div id={LETTER_SUGGEST_PRIMARY_ID} className={`relative ${LETTER_TEMPLATE_CATALOG_SHELL} fc-suggest-hit-target`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">Recommended next</span>
          <span className="text-[10px] text-white/50">
            {1 + alts.length} letter pick{1 + alts.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className={LETTER_TEMPLATE_CATALOG_GRID}>
          <LetterTemplateCatalogCard
            className="sm:col-span-2 lg:col-span-2"
            title={primary.title}
            keyPrinciple={primary.why}
            metaRow={suggestionMetaRow(primary, true)}
            ctaLabel={primaryCta}
            busy={busy}
            disabled={busy}
            generateButtonId={LETTER_SUGGEST_GENERATE_ID}
            onGenerate={() => focusAndAct(primary)}
          />
          {alts.map((s) => (
            <LetterTemplateCatalogCard
              key={`${s.rank}-${s.catalogId || s.letterType}`}
              title={s.title}
              keyPrinciple={s.why}
              metaRow={suggestionMetaRow(s)}
              ctaLabel={s.uiOnly ? 'Open hearing kit' : 'Generate letter'}
              busy={busy}
              disabled={busy}
              onGenerate={() => focusAndAct(s)}
            />
          ))}
        </div>

        <p className="text-[11px] text-amber-100/80 flex flex-wrap items-center gap-1.5">
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
    </section>
  );
}
