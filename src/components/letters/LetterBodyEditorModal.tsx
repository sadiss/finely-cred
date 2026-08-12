import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Save, X } from 'lucide-react';
import type { LetterRecord, DisputeLetterMeta } from '../../domain/letters';
import type { EvidenceItem } from '../../domain/evidence';
import { upsertLetter } from '../../data/lettersRepo';
import { ensureHtmlDraft, htmlToPlainText } from '../../utils/richText';
import { stripLetterVendorBranding, stripLetterVendorBrandingHtml } from '../../lib/letterBodySafety';
import { regenerateSavedLetterPdf } from '../../lib/regenerateSavedLetterPdf';
import { LetterEditorShell } from './LetterEditorShell';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_SHELL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';

function isDisputeMeta(meta: LetterRecord['meta']): meta is DisputeLetterMeta {
  return Boolean(meta && typeof meta === 'object' && 'bureau' in meta);
}

export function LetterBodyEditorModal({
  letter,
  open,
  onClose,
  onSaved,
  evidence = [],
  partnerName,
}: {
  letter: LetterRecord;
  open: boolean;
  onClose: () => void;
  onSaved?: (updated: LetterRecord) => void;
  evidence?: EvidenceItem[];
  partnerName?: string;
}) {
  const [bodyHtml, setBodyHtml] = useState('<p></p>');
  const [introHtml, setIntroHtml] = useState('<p></p>');
  const [footerHtml, setFooterHtml] = useState('<p></p>');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isDispute = letter.type === 'dispute' && isDisputeMeta(letter.meta);
  const hasPdf = Boolean(letter.pdfBlobRef);

  useEffect(() => {
    if (!open) return;
    const rawBody = letter.body?.trim() || '';
    setBodyHtml(rawBody ? ensureHtmlDraft(rawBody) : '<p></p>');

    const meta = letter.meta as DisputeLetterMeta | undefined;
    setIntroHtml(ensureHtmlDraft(meta?.introOverride || ''));
    setFooterHtml(ensureHtmlDraft(meta?.footerOverride || ''));
    setErr(null);
  }, [open, letter.id, letter.body, letter.meta]);

  if (!open) return null;

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const safeBody = stripLetterVendorBrandingHtml(ensureHtmlDraft(bodyHtml));
      const introText = stripLetterVendorBranding(htmlToPlainText(introHtml));
      const footerText = stripLetterVendorBranding(htmlToPlainText(footerHtml));

      if (isDispute) {
        if (!introText.trim() && !footerText.trim() && !htmlToPlainText(safeBody).trim()) {
          setErr('Add opening or closing text before saving.');
          return;
        }
      } else if (!htmlToPlainText(safeBody).trim()) {
        setErr('Letter body is empty.');
        return;
      }

      let nextMeta = letter.meta;
      if (isDispute && letter.meta) {
        nextMeta = {
          ...(letter.meta as DisputeLetterMeta),
          introOverride: introText || undefined,
          footerOverride: footerText || undefined,
        };
      }

      let updated = upsertLetter({
        ...letter,
        body: safeBody,
        meta: nextMeta,
      });

      if (hasPdf) {
        const regen = await regenerateSavedLetterPdf({
          letter: updated,
          evidence,
          partnerName,
          introOverride: isDispute ? introHtml : undefined,
          footerOverride: isDispute ? footerHtml : undefined,
          bodyHtml: safeBody,
        });
        if (regen?.pdfBlobRef) {
          updated = upsertLetter({
            ...updated,
            pdfBlobRef: regen.pdfBlobRef,
            pdfFilename: regen.filename,
          });
        }
      }

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
      <div
        className={`${FINELY_OS_MODAL_SHELL} relative z-[1] w-full ${
          isDispute ? 'max-w-6xl' : 'max-w-5xl'
        } border-fuchsia-400/20 flex flex-col max-h-[92vh]`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4 shrink-0">
          <div className="min-w-0">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Edit letter</div>
            <div className={`text-lg font-bold truncate ${FINELY_OS_ENTITY_VALUE}`}>{letter.title}</div>
            <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
              {isDispute
                ? 'Opening and closing blocks reload from your saved letter meta. PDF refreshes automatically when one is on file.'
                : 'Rich editor with live paper preview — PDF refreshes automatically when one is on file.'}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className={`${FINELY_OS_SECONDARY_BTN} !p-2`}>
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {isDispute ? (
            <>
              <LetterEditorShell
                html={introHtml}
                onChangeHtml={setIntroHtml}
                editorLabel="Opening paragraphs"
                accent="fuchsia"
                minHeightPx={480}
                placeholder="Write the opening paragraphs here…"
                disabled={busy}
                previewCompact
                showViewToggle={false}
              />
              <LetterEditorShell
                html={footerHtml}
                onChangeHtml={setFooterHtml}
                editorLabel="Closing / demand block"
                accent="fuchsia"
                minHeightPx={480}
                placeholder="Write the closing block here…"
                disabled={busy}
                previewCompact
                showViewToggle={false}
              />
            </>
          ) : (
            <LetterEditorShell
              html={bodyHtml}
              onChangeHtml={setBodyHtml}
              accent={letter.type === 'court' ? 'fuchsia' : 'emerald'}
              minHeightPx={480}
              placeholder="Letter body…"
              disabled={busy}
              initialView="split"
            />
          )}

          {err ? <p className="text-xs text-rose-200/90">{err}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3 shrink-0">
          <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={busy} onClick={() => void save()}>
            <Save size={14} /> {busy ? 'Saving…' : hasPdf ? 'Save & refresh PDF' : 'Save letter'}
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
