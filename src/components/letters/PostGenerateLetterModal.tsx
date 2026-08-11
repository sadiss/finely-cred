import React from 'react';
import { FileText, PenLine, Send, X } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_MODAL_OVERLAY,
  FINELY_OS_MODAL_SHELL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';

export type PostGenerateLetterAction = 'mail' | 'creditLetters' | 'savePdf' | 'stay';

export function PostGenerateLetterModal({
  open,
  handoffCount,
  onClose,
  onAction,
}: {
  open: boolean;
  handoffCount: number;
  onClose: () => void;
  onAction: (action: PostGenerateLetterAction) => void;
}) {
  if (!open) return null;

  const handoffLine =
    handoffCount > 0
      ? `${handoffCount} matching bureau dispute item${handoffCount === 1 ? '' : 's'} can load on Credit Letters when you are ready.`
      : 'No bureau matches were found — you can still open Credit Letters or mail this validation letter from Debt Letters.';

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center p-4">
      <div className={FINELY_OS_MODAL_OVERLAY} onClick={onClose} aria-hidden />
      <div
        className={`relative w-full max-w-lg ${FINELY_OS_MODAL_SHELL}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-generate-letter-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-5 border-b border-white/[0.08] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Validation letter ready</div>
            <div id="post-generate-letter-title" className="mt-1 text-lg font-semibold text-white">
              What do you want to do next?
            </div>
            <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>{handoffLine}</p>
          </div>
          <button type="button" onClick={onClose} className={`${FINELY_OS_SECONDARY_BTN} !py-2 shrink-0`} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 md:p-5 space-y-2">
          <button
            type="button"
            className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center gap-2`}
            onClick={() => onAction('mail')}
          >
            <Send size={16} /> Mail
          </button>
          <button
            type="button"
            className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center gap-2`}
            onClick={() => onAction('creditLetters')}
          >
            <PenLine size={16} /> Go to Credit Letters
          </button>
          <button
            type="button"
            className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center gap-2`}
            onClick={() => onAction('savePdf')}
          >
            <FileText size={16} /> Save PDF
          </button>
          <button
            type="button"
            className="w-full text-center text-sm text-white/55 hover:text-white/80 py-2 transition-colors"
            onClick={() => onAction('stay')}
          >
            Stay on Debt
          </button>
        </div>
      </div>
    </div>
  );
}
