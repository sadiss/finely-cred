import React, { useEffect, useMemo, useState } from 'react';
import { Camera, Download, Eye, FileText, Image as ImageIcon, Trash2, X } from 'lucide-react';
import type { EvidenceItem } from '../../domain/evidence';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { openBlobRefInNewTab } from '../../lib/openBlobRef';
import { isLegacyPendingReportBlob } from '../../lib/legacyPendingReport';
import { triggerBrowserDownload } from '../../utils/download';
import { profileForDocType } from '../../lib/evidenceDocumentTaxonomy';
import type { DocumentType } from '../../domain/documents';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlowKpi,
  finelyOsGlowTile,
} from '../../features/os/finelyOsLightUi';

type CategoryKey =
  | ''
  | 'collections'
  | 'inquiries'
  | 'public_records'
  | 'bankruptcy'
  | 'id_docs'
  | 'bureau_response'
  | 'affidavit'
  | 'summons_court'
  | 'debt_collector'
  | 'creditor_response'
  | 'court_filing'
  | 'bankruptcy_court'
  | 'identity'
  | 'proof_of_address'
  | 'dispute_proof'
  | 'contracts'
  | 'credit_report'
  | 'other';

const CATEGORY_OPTIONS: { key: CategoryKey; label: string }[] = [
  { key: '', label: 'Uncategorized' },
  { key: 'identity', label: 'Identification' },
  { key: 'proof_of_address', label: 'Proof of address' },
  { key: 'bureau_response', label: 'Bureau responses' },
  { key: 'affidavit', label: 'Affidavits' },
  { key: 'summons_court', label: 'Summons / complaints' },
  { key: 'court_filing', label: 'Court filings' },
  { key: 'debt_collector', label: 'Debt collector mail' },
  { key: 'creditor_response', label: 'Creditor responses' },
  { key: 'bankruptcy_court', label: 'Bankruptcy court docs' },
  { key: 'credit_report', label: 'Credit reports' },
  { key: 'collections', label: 'Collections' },
  { key: 'bankruptcy', label: 'Bankruptcy (tradelines)' },
  { key: 'public_records', label: 'Public records' },
  { key: 'inquiries', label: 'Inquiries' },
  { key: 'id_docs', label: 'ID / Address (legacy)' },
  { key: 'dispute_proof', label: 'Dispute proof' },
  { key: 'contracts', label: 'Contracts' },
  { key: 'other', label: 'Other' },
];

function folderLabel(key?: string): string {
  if (!key) return 'Other';
  return CATEGORY_OPTIONS.find((c) => c.key === key)?.label ?? key.replace(/_/g, ' ');
}

function doctypeFromItem(item: EvidenceItem): DocumentType | null {
  const tag = (item.tags ?? []).find((t) => t.startsWith('doctype:'));
  if (tag) return tag.replace('doctype:', '') as DocumentType;
  return null;
}

function shortName(item: EvidenceItem): string {
  const dt = doctypeFromItem(item);
  if (dt) return profileForDocType(dt).label;
  if (item.creditorName) return item.creditorName.slice(0, 22);
  const base = (item.filename || 'File').replace(/\.[^.]+$/, '');
  return base.length > 20 ? `${base.slice(0, 18)}…` : base;
}

function scrapedHint(item: EvidenceItem): string | null {
  const entityTag = (item.tags ?? []).find((t) => t.startsWith('entity:'));
  if (entityTag) {
    const val = entityTag.split(':').slice(2).join(':');
    if (val) return val.slice(0, 28);
  }
  if (item.caption && item.caption.includes(':')) {
    const part = item.caption.split('·').pop()?.trim();
    if (part && part.length < 40) return part;
  }
  return null;
}

function EvidenceThumb({ item }: { item: EvidenceItem }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    let revoke: (() => void) | undefined;
    if (!item.mimeType.startsWith('image/') || isLegacyPendingReportBlob(item.blobRef)) return;
    void getBlobUrl(item.blobRef, { mimeType: item.mimeType }).then((res) => {
      if (!alive) {
        res?.revoke?.();
        return;
      }
      revoke = res?.revoke;
      setUrl(res?.url ?? null);
    });
    return () => {
      alive = false;
      revoke?.();
    };
  }, [item.blobRef, item.mimeType]);

  if (url) {
    return <img src={url} alt="" className="w-full h-14 object-cover rounded-lg border border-white/10 bg-black/40" />;
  }
  const Icon = item.type === 'screenshot' ? Camera : item.mimeType.startsWith('image/') ? ImageIcon : FileText;
  return (
    <div className="w-full h-14 rounded-lg border border-white/10 bg-black/40 flex items-center justify-center">
      <Icon size={18} className="text-white/45" />
    </div>
  );
}

export function EvidenceVaultTiles({
  items,
  onDelete,
  onUpsert,
}: {
  items: EvidenceItem[];
  onDelete: (id: string) => void;
  onUpsert?: (item: EvidenceItem) => void;
}) {
  const visibleItems = useMemo(
    () => items.filter((e) => !(e.tags ?? []).includes('analysis_report')),
    [items],
  );

  const grouped = useMemo(() => {
    const m = new Map<string, EvidenceItem[]>();
    for (const e of visibleItems) {
      const key = e.sectionKey || 'other';
      const arr = m.get(key) ?? [];
      arr.push(e);
      m.set(key, arr);
    }
    return Array.from(m.entries()).sort((a, b) => folderLabel(a[0]).localeCompare(folderLabel(b[0])));
  }, [visibleItems]);

  const [preview, setPreview] = useState<{ item: EvidenceItem; url: string; kind: 'image' | 'video'; revoke?: () => void } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (visibleItems.length === 0) {
    return <div className={FINELY_OS_ENTITY_BODY}>No evidence uploaded yet — use the upload tab to add documents.</div>;
  }

  const closePreview = () => {
    preview?.revoke?.();
    setPreview(null);
  };

  const handlePreview = async (item: EvidenceItem) => {
    setErr(null);
    setBusyId(item.id);
    try {
      if (isLegacyPendingReportBlob(item.blobRef)) {
        const result = await openBlobRefInNewTab({ blobRef: item.blobRef, mimeType: item.mimeType });
        if (!result.ok) setErr(result.message);
        return;
      }
      if (item.mimeType.startsWith('image/')) {
        const res = await getBlobUrl(item.blobRef, { mimeType: item.mimeType });
        if (!res?.url) {
          setErr('Could not load this file from storage.');
          return;
        }
        preview?.revoke?.();
        setPreview({ item, url: res.url, revoke: res.revoke, kind: 'image' });
        return;
      }
      if (item.mimeType.startsWith('video/')) {
        const res = await getBlobUrl(item.blobRef, { mimeType: item.mimeType });
        if (!res?.url) {
          setErr('Could not load this file from storage.');
          return;
        }
        preview?.revoke?.();
        setPreview({ item, url: res.url, revoke: res.revoke, kind: 'video' });
        return;
      }
      // PDFs and other docs: open in a new tab (gesture-safe) so they can be viewed, not only downloaded.
      const mime =
        item.mimeType === 'application/pdf' || String(item.filename || '').toLowerCase().endsWith('.pdf')
          ? 'application/pdf'
          : item.mimeType;
      const result = await openBlobRefInNewTab({ blobRef: item.blobRef, mimeType: mime });
      if (!result.ok) setErr(result.message);
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Failed to open evidence.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDownload = async (item: EvidenceItem) => {
    setErr(null);
    setBusyId(item.id);
    try {
      const res = await getBlobUrl(item.blobRef, { mimeType: item.mimeType });
      if (!res?.url) {
        setErr('Could not load this file from storage.');
        return;
      }
      triggerBrowserDownload({
        url: res.url,
        filename: item.filename || 'evidence',
        revoke: res.revoke,
        revokeAfterMs: 30_000,
        targetBlank: true,
      });
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Failed to download evidence.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {preview ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closePreview} />
          <div className="relative w-full max-w-5xl rounded-2xl border border-white/10 bg-[#0a0f0d] shadow-2xl overflow-hidden" role="dialog" aria-modal="true">
            <div className="flex items-center justify-between gap-4 p-4 border-b border-white/10">
              <div className="min-w-0">
                <div className="font-semibold text-white truncate">{preview.item.filename}</div>
                {preview.item.caption ? <div className={`${FINELY_OS_ENTITY_BODY} mt-1 text-sm`}>{preview.item.caption}</div> : null}
              </div>
              <button type="button" onClick={closePreview} className={FINELY_OS_SECONDARY_BTN}>
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              {preview.kind === 'image' ? (
                <img src={preview.url} alt={preview.item.filename} className="w-full h-auto rounded-xl border border-white/10" />
              ) : (
                <video src={preview.url} controls className="w-full rounded-xl border border-white/10" />
              )}
            </div>
          </div>
        </div>
      ) : null}

      {err ? <div className={`mb-3 ${FINELY_OS_NOTICE_ERROR}`}>{err}</div> : null}

      <div className="space-y-5">
        {grouped.map(([sectionKey, sectionItems]) => (
          <div key={sectionKey}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>{folderLabel(sectionKey)}</div>
              <span className={`${finelyOsGlowKpi('emerald')} !py-1 !px-2 text-[10px]`}>{sectionItems.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {sectionItems.map((e) => {
                const busy = busyId === e.id;
                return (
                  <div key={e.id} className={`${finelyOsGlowTile('emerald', false)} !p-2 flex flex-col gap-1.5 min-h-[7.5rem]`}>
                    <EvidenceThumb item={e} />
                    <div className="text-[11px] font-semibold text-white/90 line-clamp-2 leading-snug min-h-[2rem]">{shortName(e)}</div>
                    {scrapedHint(e) ? (
                      <div className="text-[9px] text-emerald-300/80 line-clamp-1" title={scrapedHint(e)!}>
                        {scrapedHint(e)}
                      </div>
                    ) : null}
                    <div className="text-[9px] text-white/45 uppercase tracking-wide">
                      {e.type === 'screenshot' ? 'Screenshot' : 'Upload'} · {(e.sizeBytes / 1024).toFixed(0)} KB
                    </div>
                    {onUpsert ? (
                      <select
                        value={(e.sectionKey as CategoryKey | undefined) ?? ''}
                        onChange={(ev) => {
                          const next = (ev.target.value as CategoryKey) || '';
                          onUpsert({ ...e, sectionKey: next || undefined });
                        }}
                        className={`${FINELY_OS_ENTITY_SELECT} !text-[9px] !py-1 !px-1.5 mt-auto`}
                        title="Category"
                      >
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => void handlePreview(e)}
                        disabled={busy}
                        className={`${FINELY_OS_SECONDARY_BTN} !px-1.5 !py-1 !text-[9px] inline-flex items-center gap-0.5`}
                        title="View document"
                      >
                        <Eye size={10} /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDownload(e)}
                        disabled={busy}
                        className={`${FINELY_OS_SECONDARY_BTN} !px-1.5 !py-1 !text-[9px] inline-flex items-center gap-0.5`}
                        title="Download"
                      >
                        <Download size={10} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(e.id)}
                        className={`${FINELY_OS_SECONDARY_BTN} !px-1.5 !py-1 !text-[9px] text-red-200/90`}
                        title="Delete"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export { CATEGORY_OPTIONS as EVIDENCE_CATEGORY_OPTIONS };
