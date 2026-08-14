import React from 'react';
import { CheckCircle2, Mail } from 'lucide-react';
import { LetterEmailPartnerToggle } from './LetterEmailPartnerToggle';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_MODAL_HEADER,
  FINELY_OS_MODAL_OVERLAY,
  FINELY_OS_MODAL_SHELL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../../features/os/FinelyOsModalCloseButton';

export function MarkLetterFinalModal({
  open,
  title,
  withPdf = false,
  emailPartner,
  onEmailPartnerChange,
  emailHint,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  withPdf?: boolean;
  emailPartner: boolean;
  onEmailPartnerChange: (next: boolean) => void;
  emailHint?: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9200] flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className={FINELY_OS_MODAL_OVERLAY} onClick={busy ? undefined : onClose} aria-hidden />
      <div
        className={`relative w-full max-w-lg ${FINELY_OS_MODAL_SHELL}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mark-letter-final-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={FINELY_OS_MODAL_HEADER}>
          <div className="min-w-0">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Mark as final</div>
            <div id="mark-letter-final-title" className="mt-1 text-lg font-semibold text-white">
              Ready to send?
            </div>
            <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
              {withPdf
                ? 'This saves your PDF and moves the letter out of Drafts into your main vault.'
                : 'Final letters are ready to mail. Drafts stay editable until you confirm here.'}
            </p>
          </div>
          <FinelyOsModalCloseButton onClick={onClose} disabled={busy} />
        </div>

        <div className="p-4 md:p-5 space-y-4">
          <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-300 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-emerald-50 truncate">{title}</div>
                <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  Review recipient address and enclosures one last time before mailing.
                </p>
              </div>
            </div>
          </div>

          <LetterEmailPartnerToggle
            checked={emailPartner}
            onChange={onEmailPartnerChange}
            hint={emailHint}
            label="Email partner when final"
          />

          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" className={`${FINELY_OS_PRIMARY_BTN} gap-2`} disabled={busy} onClick={onConfirm}>
              <Mail size={16} /> {busy ? 'Saving…' : withPdf ? 'Mark final & save PDF' : 'Mark as final'}
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={busy} onClick={onClose}>
              Keep as draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
