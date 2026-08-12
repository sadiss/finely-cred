import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, FileText, X } from 'lucide-react';
import type { LetterRecord, DisputeLetterMeta } from '../../domain/letters';
import { bureauShortCode } from '../../utils/bureaus';
import type { Bureau } from '../../domain/creditReports';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { openBlobRefInNewTab } from '../../lib/openBlobRef';
import { isProbablyHtml } from '../../utils/richText';
import { DebtLetterPreview } from './DebtLetterPreview';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';

export function LetterFullPreviewModal({
  letter,
  onClose,
  onOpenPdfTab,
  onEdit,
}: {
  letter: LetterRecord;
  evidence?: unknown[];
  onClose: () => void;
  onOpenPdfTab?: () => void;
  onEdit?: () => void;
}) {
  const [pdfUrl, setPdfUrl] = useState('');
  const hasPdf = Boolean(letter.pdfBlobRef);
  const hasBody = Boolean(letter.body?.trim());
  const meta = letter.meta as DisputeLetterMeta | undefined;
  const bodyHtml = hasBody && isProbablyHtml(letter.body!) ? letter.body : undefined;
  const bodyText = hasBody && !bodyHtml ? letter.body : undefined;

  useEffect(() => {
    if (!hasPdf) return undefined;
    let alive = true;
    void getBlobUrl(letter.pdfBlobRef!, { mimeType: 'application/pdf', preferSigned: true }).then((res) => {
      if (!alive) {
        res?.revoke?.();
        return;
      }
      if (res?.url) setPdfUrl(res.url);
    });
    return () => {
      alive = false;
    };
  }, [hasPdf, letter.pdfBlobRef]);

  const openExternal = () => {
    if (onOpenPdfTab) {
      onOpenPdfTab();
      return;
    }
    if (!letter.pdfBlobRef) return;
    void openBlobRefInNewTab({ blobRef: letter.pdfBlobRef, mimeType: 'application/pdf', preferSigned: true });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9000] isolate flex flex-col sm:flex-row sm:items-center sm:justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-[1] flex w-full sm:max-w-6xl max-h-[100dvh] sm:max-h-[94vh] flex-col overflow-hidden rounded-none sm:rounded-[1.75rem] border-0 sm:border border-fuchsia-400/20 bg-[#070b10] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]">
        <div className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4 flex items-start justify-between gap-3 bg-[radial-gradient(900px_360px_at_5%_0%,rgba(217,70,239,0.15),transparent_60%),linear-gradient(180deg,#120a18_0%,#070b10_100%)]">
          <div className="min-w-0 flex-1">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>{hasPdf ? 'View PDF — full letter' : 'Letter preview'}</div>
            <div className={`text-base sm:text-xl font-black truncate ${FINELY_OS_ENTITY_VALUE}`}>{letter.title}</div>
            {meta?.bureau ? (
              <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                {bureauShortCode(meta.bureau as Bureau)}
                {meta.round ? ` · ${meta.round}` : ''}
              </div>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className={`${FINELY_OS_SECONDARY_BTN} !py-2 shrink-0`} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-3 sm:p-6 min-h-0">
          {hasPdf ? (
            pdfUrl ? (
              <iframe
                title="Letter PDF"
                src={pdfUrl}
                className="h-full min-h-[50vh] sm:min-h-0 w-full rounded-xl sm:rounded-2xl border border-white/10 bg-white shadow-2xl"
              />
            ) : (
              <div className={`${FINELY_OS_ENTITY_BODY} text-center py-16`}>Loading PDF…</div>
            )
          ) : hasBody ? (
            <div className="h-full min-h-[50vh] sm:min-h-0 overflow-y-auto rounded-xl sm:rounded-2xl border border-white/10 bg-[#0a0f0d] p-3 sm:p-4">
              <DebtLetterPreview
                html={bodyHtml}
                text={bodyText}
                showToolbar={false}
                showAddressChrome={false}
                compact
                accent="fuchsia"
              />
            </div>
          ) : (
            <div className={`${FINELY_OS_ENTITY_BODY} text-center py-16 space-y-3`}>
              <FileText className="mx-auto text-white/30" size={40} />
              <p>No PDF stored yet. Edit the letter or resume Letter Studio to generate one.</p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-white/10 px-3 py-3 sm:px-6 flex flex-wrap gap-2 bg-[#070b10]">
          {hasPdf ? (
            <button type="button" onClick={openExternal} className={`${FINELY_OS_PRIMARY_BTN} !py-2.5 !text-sm flex-1 sm:flex-none min-w-[8rem]`}>
              <ExternalLink size={16} /> Open PDF
            </button>
          ) : null}
          {onEdit ? (
            <button type="button" onClick={onEdit} className={`${FINELY_OS_SECONDARY_BTN} !py-2.5 !text-sm flex-1 sm:flex-none`}>
              Edit letter
            </button>
          ) : null}
          <button type="button" onClick={onClose} className={`${FINELY_OS_SECONDARY_BTN} !py-2.5 !text-sm sm:ml-auto`}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
