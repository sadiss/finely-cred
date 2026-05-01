import React, { useMemo, useState } from 'react';
import { Download, Eye, FileText, Maximize2, Minimize2, Tag, Trash2, X } from 'lucide-react';
import type { EvidenceItem } from '../../domain/evidence';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { openUrlInNewTab, triggerBrowserDownload } from '../../utils/download';

type CategoryKey =
  | ''
  | 'collections'
  | 'inquiries'
  | 'public_records'
  | 'bankruptcy'
  | 'id_docs'
  | 'bureau_response'
  | 'contracts'
  | 'other';

const CATEGORY_OPTIONS: { key: CategoryKey; label: string }[] = [
  { key: '', label: 'Uncategorized' },
  { key: 'collections', label: 'Collections' },
  { key: 'inquiries', label: 'Inquiries' },
  { key: 'public_records', label: 'Public records' },
  { key: 'bankruptcy', label: 'Bankruptcy' },
  { key: 'id_docs', label: 'ID / Address docs' },
  { key: 'bureau_response', label: 'Bureau responses' },
  { key: 'contracts', label: 'Contracts' },
  { key: 'other', label: 'Other' },
];

export function EvidenceList({
  items,
  onDelete,
  onUpsert,
}: {
  items: EvidenceItem[];
  onDelete: (id: string) => void;
  onUpsert?: (item: EvidenceItem) => void;
}) {
  if (items.length === 0) {
    return <div className="text-white/50 text-sm">No evidence uploaded yet.</div>;
  }

  const [preview, setPreview] = useState<{ item: EvidenceItem; url: string; kind: 'image' | 'video'; revoke?: () => void } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const closePreview = () => {
    preview?.revoke?.();
    setPreview(null);
  };

  const handlePreview = async (item: EvidenceItem) => {
    setErr(null);
    setBusyId(item.id);
    try {
      const res = await getBlobUrl(item.blobRef, { mimeType: item.mimeType });
      if (!res?.url) {
        setErr('Could not load this file from storage.');
        return;
      }

      // Images/videos: show modal. PDFs: open new tab. Others: download.
      if (item.mimeType.startsWith('image/')) {
        preview?.revoke?.();
        setPreview({ item, url: res.url, revoke: res.revoke, kind: 'image' });
        return;
      }

      if (item.mimeType.startsWith('video/')) {
        preview?.revoke?.();
        setPreview({ item, url: res.url, revoke: res.revoke, kind: 'video' });
        return;
      }

      if (item.mimeType === 'application/pdf') {
        openUrlInNewTab({ url: res.url, revoke: res.revoke, revokeAfterMs: 60_000 });
        return;
      }

      triggerBrowserDownload({
        url: res.url,
        filename: item.filename || 'evidence',
        revoke: res.revoke,
        revokeAfterMs: 30_000,
        targetBlank: true,
      });
    } catch (e: any) {
      setErr(e?.message || 'Failed to open evidence.');
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
    } catch (e: any) {
      setErr(e?.message || 'Failed to download evidence.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closePreview} />
          <div
            className="relative w-full max-w-5xl rounded-2xl border border-white/10 bg-[#0a0f0d] shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 p-4 border-b border-white/10">
              <div className="min-w-0">
                <div className="text-white font-semibold truncate">{preview.item.filename}</div>
                {preview.item.caption && <div className="text-white/60 text-sm mt-1">{preview.item.caption}</div>}
              </div>
              <button
                onClick={closePreview}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              {preview.kind === 'image' ? (
                <img
                  src={preview.url}
                  alt={preview.item.filename}
                  className="w-full h-auto rounded-xl border border-white/10 bg-black/30"
                />
              ) : (
                <video
                  src={preview.url}
                  controls
                  className="w-full rounded-xl border border-white/10 bg-black/30"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {err && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm">
          {err}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] uppercase tracking-widest text-white/40">
          Evidence items <span className="font-mono">({items.length})</span>
        </div>
        {items.length > 8 ? (
          <button type="button" onClick={() => setExpanded((v) => !v)} className="fc-action-link fc-focus-ring">
            {expanded ? (
              <>
                <Minimize2 size={14} /> Clamp list
              </>
            ) : (
              <>
                <Maximize2 size={14} /> Expand list
              </>
            )}
          </button>
        ) : null}
      </div>

      {(() => {
        const clampOn = !expanded && items.length > 8;
        const visible = clampOn ? items.slice(0, 10) : items;
        return (
          <div className={clampOn ? 'relative overflow-hidden' : ''}>
            <div className="grid md:grid-cols-2 gap-3">
              {visible.map((e) => {
                const busy = busyId === e.id;
                return (
                  <div
                    key={e.id}
                    className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4 flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-white">
                        <FileText size={14} className="text-white/60" />
                        <span className="font-semibold truncate">{e.filename}</span>
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        {new Date(e.createdAt).toLocaleString()} • {(e.sizeBytes / 1024).toFixed(0)} KB • {e.type}
                      </div>
                      {e.caption && <div className="mt-2 text-white/60 text-sm">{e.caption}</div>}
                      {onUpsert ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                            <Tag size={12} className="text-amber-300/80" /> Category
                          </div>
                          <select
                            value={(e.sectionKey as CategoryKey | undefined) ?? ''}
                            onChange={(ev) => {
                              const next = (ev.target.value as CategoryKey) || '';
                              onUpsert({ ...e, sectionKey: next || undefined });
                            }}
                            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80 text-[11px] focus:outline-none focus:border-amber-500 transition-colors"
                            title="Category"
                          >
                            {CATEGORY_OPTIONS.map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => void handlePreview(e)}
                          disabled={busy}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
                          title={
                            e.mimeType.startsWith('image/') ? 'Preview image' : e.mimeType === 'application/pdf' ? 'Open PDF' : 'Open'
                          }
                        >
                          <Eye size={14} />
                          {busy ? 'Loading…' : 'Open'}
                        </button>
                        <button
                          onClick={() => void handleDownload(e)}
                          disabled={busy}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
                          title="Download"
                        >
                          <Download size={14} />
                          Download
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => onDelete(e.id)}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
            {clampOn ? (
              <div className="mt-3 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                showing {visible.length} / {items.length}
              </div>
            ) : null}
            {clampOn ? <div aria-hidden="true" className="fc-clamp-fade" /> : null}
          </div>
        );
      })()}
    </>
  );
}

