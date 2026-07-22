import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';
import {
  LETTER_L2_PATH_CARD,
  LETTER_L2_PATH_HINT,
  LETTER_L2_PATH_TITLE,
  LETTER_L2_STEP_ARROW,
  LETTER_L2_STEP_ARROW_MUTED,
  LETTER_L2_STEP_BTN,
  LETTER_L2_STEP_NUM,
  LETTER_L2_STEP_ROW,
} from './letterEasyFlowTokens';

export type LetterStepPathItem = {
  id: string;
  label: string;
  meta?: string;
  done: boolean;
  /** When true, step is visible but not required for Generate readiness */
  optional?: boolean;
  disabled?: boolean;
  disabledReason?: string;
};

export function LetterStepPath({
  title = 'What to do next',
  steps,
  draftSavedAt,
  onStep,
  onContinue,
  onDiscardDraft,
  showDraftBanner,
  continueLabel,
}: {
  title?: string;
  steps: LetterStepPathItem[];
  draftSavedAt?: string | null;
  onStep: (id: string) => void;
  /** Must run the real next-step action (not a noop). */
  onContinue: () => void;
  onDiscardDraft?: () => void;
  showDraftBanner?: boolean;
  continueLabel?: string;
}) {
  const mainSteps = steps.filter((s) => !s.optional);
  const optionalSteps = steps.filter((s) => s.optional);
  const next = mainSteps.find((s) => !s.done && !s.disabled) ?? mainSteps.find((s) => !s.done) ?? mainSteps[mainSteps.length - 1];
  const ready = mainSteps.filter((s) => s.id !== 'generate').every((s) => s.done || s.disabled);

  const savedLabel = (() => {
    if (!draftSavedAt) return null;
    try {
      const ms = Date.now() - new Date(draftSavedAt).getTime();
      if (!Number.isFinite(ms) || ms < 0) return 'Draft saved';
      const mins = Math.round(ms / 60_000);
      if (mins < 1) return 'Draft saved just now';
      if (mins < 60) return `Draft saved ${mins}m ago`;
      return `Draft saved ${Math.round(mins / 60)}h ago`;
    } catch {
      return 'Draft saved';
    }
  })();

  const primaryLabel =
    continueLabel ||
    (ready ? 'Generate PDF' : next ? `Continue — ${next.label}` : 'Continue');

  return (
    <div className={`${LETTER_L2_PATH_CARD} space-y-3`}>
      {showDraftBanner && savedLabel ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2.5">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-amber-50">Letter draft ready</div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>{savedLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={onContinue}>
              Continue <ChevronRight size={16} />
            </button>
            {onDiscardDraft ? (
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={onDiscardDraft}>
                Discard
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={LETTER_L2_PATH_TITLE}>{title}</p>
          <p className={LETTER_L2_PATH_HINT}>
            Follow the arrows. The amber step is where you are.
          </p>
        </div>
        <button type="button" className={`${FINELY_OS_PRIMARY_BTN} shrink-0`} onClick={onContinue}>
          {primaryLabel} <ChevronRight size={16} />
        </button>
      </div>

      <div className={LETTER_L2_STEP_ROW}>
        {mainSteps.map((s, idx) => {
          const isCurrent = next?.id === s.id;
          return (
            <React.Fragment key={s.id}>
              {idx > 0 ? (
                <ChevronRight
                  size={20}
                  className={isCurrent || s.done ? LETTER_L2_STEP_ARROW : LETTER_L2_STEP_ARROW_MUTED}
                  aria-hidden
                />
              ) : null}
              <button
                type="button"
                disabled={s.disabled}
                title={s.disabled ? s.disabledReason || s.meta : s.meta}
                onClick={() => onStep(s.id)}
                className={
                  `${LETTER_L2_STEP_BTN} disabled:opacity-40 disabled:cursor-not-allowed ` +
                  (s.done
                    ? 'border-emerald-400/45 bg-emerald-500/15 text-emerald-50'
                    : isCurrent
                      ? 'border-amber-400/60 bg-amber-500/20 text-white shadow-[0_0_20px_-6px_rgba(251,191,36,0.65)]'
                      : 'border-white/12 bg-black/30 text-white/70 hover:bg-white/5')
                }
              >
                <span className={LETTER_L2_STEP_NUM}>
                  {s.done ? <Check size={14} /> : idx + 1}
                </span>
                <span className="truncate">{s.label}</span>
                {s.meta ? <span className="text-xs font-normal opacity-70 hidden sm:inline truncate">{s.meta}</span> : null}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {optionalSteps.length ? (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/45">Optional</span>
          {optionalSteps.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onStep(s.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-black/25 px-3 py-2 text-sm text-white/75 hover:bg-white/5"
            >
              {s.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
