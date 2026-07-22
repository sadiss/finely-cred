import React from 'react';
import {
  Check,
  ChevronRight,
  FileKey2,
  FileText,
  Gavel,
  Image as ImageIcon,
  Scale,
  Sparkles,
  BookOpen,
  Wand2,
} from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
} from '../../features/os/finelyOsLightUi';

export type LetterBuildStepId =
  | 'disputes'
  | 'screenshots'
  | 'reasons'
  | 'laws'
  | 'identity'
  | 'ai'
  | 'templates'
  | 'generate';

export type LetterBuildStep = {
  id: LetterBuildStepId;
  label: string;
  meta: string;
  done: boolean;
};

const ICONS: Record<LetterBuildStepId, React.ReactNode> = {
  disputes: <Gavel size={16} />,
  screenshots: <ImageIcon size={16} />,
  reasons: <Sparkles size={16} />,
  laws: <Scale size={16} />,
  identity: <FileKey2 size={16} />,
  ai: <Wand2 size={16} />,
  templates: <BookOpen size={16} />,
  generate: <FileText size={16} />,
};

export function LetterBuildCommandStrip({
  steps,
  draftSavedAt,
  onStep,
  onResume,
  onDiscardDraft,
  showDraftBanner,
}: {
  steps: LetterBuildStep[];
  draftSavedAt?: string | null;
  onStep: (id: LetterBuildStepId) => void;
  onResume?: () => void;
  onDiscardDraft?: () => void;
  showDraftBanner?: boolean;
}) {
  const next = steps.find((s) => !s.done && s.id !== 'generate') ?? steps.find((s) => s.id === 'generate') ?? steps[steps.length - 1]!;
  const generateStep = steps.find((s) => s.id === 'generate');
  const readyToGenerate = steps.filter((s) => s.id !== 'generate' && s.id !== 'ai' && s.id !== 'templates').every((s) => s.done);

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

  return (
    <div className={`${finelyOsCatalogCardCompact('amber')} space-y-3`}>
      {showDraftBanner && savedLabel ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-amber-100">Letter draft ready</div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>{savedLabel} — leave anytime; progress stays here.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onResume ? (
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={onResume}>
                Continue <ChevronRight size={14} />
              </button>
            ) : null}
            {onDiscardDraft ? (
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={onDiscardDraft}>
                Discard
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} !text-xs`}>What to do next</div>
          <p className="text-base font-semibold text-white">Easy letter path</p>
        </div>
        <button
          type="button"
          className={FINELY_OS_PRIMARY_BTN}
          onClick={() => onStep(readyToGenerate && generateStep ? 'generate' : next.id)}
        >
          {readyToGenerate ? 'Generate PDF' : `Next: ${next.label}`} <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {steps
          .filter((s) => s.id !== 'generate')
          .map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onStep(s.id)}
              className={
                'flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left transition-all min-h-[4.25rem] ' +
                (s.done
                  ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-50'
                  : s.id === next.id
                    ? 'border-amber-400/50 bg-amber-500/15 text-white'
                    : 'border-white/12 bg-black/30 text-white/80 hover:bg-white/5')
              }
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                {s.done ? <Check size={16} /> : ICONS[s.id]}
                {s.label}
              </span>
              <span className="text-xs text-white/60">{s.meta}</span>
            </button>
          ))}
      </div>
    </div>
  );
}
