import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Save, X } from 'lucide-react';
import type { LetterRecord } from '../../domain/letters';
import { upsertLetter } from '../../data/lettersRepo';
import { plainTextToHtml } from '../../utils/richText';
import {
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_SHELL,
  FINELY_OS_PRIMARY_BTN,
  finelyOsGlowTextarea,
} from '../../features/os/finelyOsLightUi';

function htmlToPlain(html: string) {
  const input = (html || '').trim();
  if (!input) return '';
  try {
    const doc = new DOMParser().parseFromString(input, 'text/html');
    return (doc.body.textContent || '').replace(/\s+\n/g, '\n').trim();
  } catch {
    return input.replace(/<[^>]+>/g, ' ').trim();
  }
}

export function LetterBodyEditorModal({
  letter,
  open,
  onClose,
  onSaved,
}: {
  letter: LetterRecord;
  open: boolean;
  onClose: () => void;
  onSaved?: (updated: LetterRecord) => void;
}) {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const initial = letter.body?.trim() ? htmlToPlain(letter.body) : '';
    setDraft(initial);
    setErr(null);
  }, [open, letter.id, letter.body]);

  if (!open) return null;

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const bodyHtml = plainTextToHtml(draft);
      const updated = upsertLetter({
        ...letter,
        body: bodyHtml,
      });
      onSaved?.(updated);
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Could not save letter.');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className={`${FINELY_OS_FIXED_OVERLAY} z-[9100] flex items-center justify-center p-3 sm:p-4`}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={busy ? undefined : onClose} aria-hidden />
      <div className={`${FINELY_OS_MODAL_SHELL} relative z-[1] w-full max-w-2xl border-fuchsia-400/20`}>
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="min-w-0">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Edit letter</div>
            <div className={`text-lg font-bold truncate ${FINELY_OS_ENTITY_VALUE}`}>{letter.title}</div>
            <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
              Same editor flow as studio chat — update text, then regenerate PDF in Letter Studio if needed.
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className={`${FINELY_OS_SECONDARY_BTN} !p-2`}>
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={14}
            className={`${finelyOsGlowTextarea('fuchsia')} w-full text-sm leading-relaxed`}
            placeholder="Letter body…"
            disabled={busy}
          />
          {err ? <p className="text-xs text-rose-200/90">{err}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
          <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={busy} onClick={() => void save()}>
            <Save size={14} /> {busy ? 'Saving…' : 'Save letter'}
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={busy} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
