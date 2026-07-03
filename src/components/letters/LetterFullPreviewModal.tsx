import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Image as ImageIcon, ScrollText, X } from 'lucide-react';
import type { LetterRecord, DisputeLetterMeta } from '../../domain/letters';
import type { EvidenceItem } from '../../domain/evidence';
import { bureauShortCode } from '../../utils/bureaus';
import type { Bureau } from '../../domain/creditReports';
import { sanitizeHtmlForPreview } from '../../utils/richText';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { openBlobRefInNewTab } from '../../lib/openBlobRef';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

function EvidencePreviewThumb({ ev }: { ev: EvidenceItem }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let alive = true;
    if (!ev.blobRef) return undefined;
    void getBlobUrl(ev.blobRef, { mimeType: ev.mimeType, preferSigned: true }).then((res) => {
      if (!alive) {
        res?.revoke?.();
        return;
      }
      if (res?.url) setUrl(res.url);
    });
    return () => {
      alive = false;
    };
  }, [ev.blobRef, ev.mimeType]);

  const isImage = String(ev.mimeType || '').toLowerCase().startsWith('image/');

  return (
    <button
      type="button"
      onClick={() => {
        if (!ev.blobRef) return;
        void openBlobRefInNewTab({ blobRef: ev.blobRef, mimeType: ev.mimeType, preferSigned: true });
      }}
      className="group rounded-2xl border border-white/10 bg-black/30 overflow-hidden text-left hover:border-sky-400/35 transition-all"
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-900 to-black flex items-center justify-center overflow-hidden">
        {url && isImage ? (
          <img src={url} alt={ev.filename || 'Evidence'} className="h-full w-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/40 p-4">
            <ImageIcon size={28} />
            <span className="text-[10px] uppercase tracking-widest">{ev.mimeType || 'file'}</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className={`text-xs font-semibold truncate ${FINELY_OS_ENTITY_VALUE}`}>{ev.filename || ev.caption || 'Exhibit'}</div>
        <div className={`text-[10px] mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>Tap to open full size</div>
      </div>
    </button>
  );
}

export function LetterFullPreviewModal({
  letter,
  evidence = [],
  onClose,
}: {
  letter: LetterRecord;
  evidence?: EvidenceItem[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'full' | 'pdf'>('full');
  const [pdfUrl, setPdfUrl] = useState('');
  const hasPdf = Boolean(letter.pdfBlobRef);
  const meta = letter.meta as DisputeLetterMeta | undefined;
  const evidenceById = useMemo(() => new Map(evidence.map((e) => [e.id, e])), [evidence]);

  const exhibitItems = useMemo(() => {
    if (!meta?.evidenceByCandidateId) return [];
    const ids = Object.values(meta.evidenceByCandidateId).filter(Boolean) as string[];
    return [...new Set(ids)].map((id) => evidenceById.get(id)).filter(Boolean) as EvidenceItem[];
  }, [meta, evidenceById]);

  const reasonBlocks = useMemo(() => {
    if (!meta?.reasonsByCandidateId) return [];
    return Object.entries(meta.reasonsByCandidateId)
      .map(([key, reasons]) => ({
        key,
        reasons: (reasons ?? []).filter(Boolean),
      }))
      .filter((x) => x.reasons.length > 0);
  }, [meta]);

  useEffect(() => {
    if (!hasPdf || tab !== 'pdf') return undefined;
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
  }, [hasPdf, letter.pdfBlobRef, tab]);

  return (
    <div className="fixed inset-0 z-[2100] isolate flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-[2101] flex w-full max-w-6xl max-h-[94vh] flex-col overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#070b10] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]">
        <div className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Generated letter — full view</div>
            <div className={`text-lg sm:text-xl font-black truncate ${FINELY_OS_ENTITY_VALUE}`}>{letter.title}</div>
            {meta?.bureau ? (
              <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                {bureauShortCode(meta.bureau as Bureau)}
                {meta.round ? ` · ${meta.round}` : ''}
                {meta.tone ? ` · ${meta.tone}` : ''}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('full')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
                tab === 'full' ? 'border-violet-400/40 bg-violet-500/15 text-violet-100' : 'border-white/10 text-white/55'
              }`}
            >
              <ScrollText size={12} /> Full letter
            </button>
            {hasPdf ? (
              <button
                type="button"
                onClick={() => setTab('pdf')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
                  tab === 'pdf' ? 'border-sky-400/40 bg-sky-500/15 text-sky-100' : 'border-white/10 text-white/55'
                }`}
              >
                <FileText size={12} /> PDF
              </button>
            ) : null}
            <button type="button" onClick={onClose} className={`${FINELY_OS_SECONDARY_BTN} !py-2`}>
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {tab === 'pdf' && hasPdf ? (
            pdfUrl ? (
              <iframe title="Letter PDF" src={pdfUrl} className="h-[min(72vh,820px)] w-full rounded-2xl border border-white/10 bg-white shadow-2xl" />
            ) : (
              <div className={`${FINELY_OS_ENTITY_BODY} text-center py-16`}>Loading PDF…</div>
            )
          ) : (
            <>
              {exhibitItems.length > 0 ? (
                <div className={`${finelyOsCatalogCard('sky')} !p-4 space-y-3`}>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Attached screenshots & exhibits</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {exhibitItems.map((ev) => (
                      <EvidencePreviewThumb key={ev.id} ev={ev} />
                    ))}
                  </div>
                </div>
              ) : null}

              {reasonBlocks.length > 0 ? (
                <div className={`${finelyOsCatalogCard('emerald')} !p-4 space-y-3`}>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Dispute reasons by item</div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {reasonBlocks.map((block, i) => (
                      <div key={block.key} className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <div className={`text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_BODY}`}>Item {i + 1}</div>
                        <ol className={`mt-2 list-decimal pl-4 text-xs space-y-1 ${FINELY_OS_ENTITY_BODY}`}>
                          {block.reasons.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {letter.body ? (
                <div className="rounded-2xl border border-white/10 bg-[#0c1018] p-4 sm:p-6 shadow-inner">
                  <div className="mx-auto max-w-3xl rounded-xl border border-slate-200/20 bg-[#111827] p-5 sm:p-8 shadow-xl">
                    <div
                      className="prose prose-invert prose-sm max-w-none leading-relaxed letter-preview-snapshot"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtmlForPreview(letter.body) }}
                    />
                  </div>
                </div>
              ) : (
                <div className={`${FINELY_OS_ENTITY_BODY} text-center py-12`}>No letter snapshot stored — open the PDF tab if available.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
