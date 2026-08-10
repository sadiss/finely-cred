import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import {
  FINELY_OS_DANGER_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_SHELL,
  finelyOsGlowField,
} from './finelyOsLightUi';

export type FinelyOsTypedDeleteDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmPhrase?: string;
  entityLabel?: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function FinelyOsTypedDeleteDialog({
  open,
  title,
  description,
  confirmPhrase = 'DELETE',
  entityLabel,
  busy = false,
  onClose,
  onConfirm,
}: FinelyOsTypedDeleteDialogProps) {
  const inputId = useId();
  const [phrase, setPhrase] = useState('');

  useEffect(() => {
    if (!open) setPhrase('');
  }, [open]);

  if (!open) return null;

  const ok = phrase.trim().toUpperCase() === confirmPhrase.toUpperCase();

  return createPortal(
    <div className={`${FINELY_OS_FIXED_OVERLAY} z-[9500] flex items-center justify-center p-4`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={busy ? undefined : onClose} aria-hidden />
      <div
        className={`${FINELY_OS_MODAL_SHELL} relative z-[1] w-full max-w-md border-rose-500/25 shadow-[0_24px_80px_-24px_rgba(244,63,94,0.45)]`}
        role="alertdialog"
        aria-labelledby={`${inputId}-title`}
        aria-describedby={`${inputId}-desc`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-rose-400/35 bg-rose-500/15 text-rose-200">
              <AlertTriangle size={18} />
            </span>
            <div className="min-w-0">
              <h2 id={`${inputId}-title`} className={`text-base font-bold ${FINELY_OS_ENTITY_VALUE}`}>
                {title}
              </h2>
              {entityLabel ? <p className="mt-0.5 text-xs text-rose-200/80 truncate">{entityLabel}</p> : null}
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className={`${FINELY_OS_SECONDARY_BTN} !p-2`} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="px-4 py-4 space-y-4">
          <p id={`${inputId}-desc`} className={`text-sm leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>
            {description}
          </p>
          <div>
            <label htmlFor={inputId} className="text-xs font-semibold text-white/70">
              Type <span className="font-mono text-rose-200">{confirmPhrase}</span> to confirm
            </label>
            <input
              id={inputId}
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder={confirmPhrase}
              className={`${finelyOsGlowField('rose')} mt-2 w-full`}
              disabled={busy}
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" disabled={!ok || busy} className={FINELY_OS_DANGER_BTN} onClick={() => void onConfirm()}>
              {busy ? 'Removing…' : 'Confirm delete'}
            </button>
            <button type="button" disabled={busy} className={FINELY_OS_SECONDARY_BTN} onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
