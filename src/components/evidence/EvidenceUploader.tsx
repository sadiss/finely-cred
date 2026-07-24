import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, FileUp, Image as ImageIcon, Images, Loader2, X } from 'lucide-react';
import type { EvidenceItem } from '../../domain/evidence';
import { getBlobStore } from '../../storage/getBlobStore';
import { newId } from '../../utils/ids';
import { scanUploadedImageFile, type DocScanProfile } from '../../utils/imageScan';
import { CameraCaptureModal } from './CameraCaptureModal';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
} from '../../features/os/finelyOsLightUi';

const blobStore = getBlobStore();

type PendingThumb = {
  id: string;
  file: File;
  url: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
};

/**
 * Low-level evidence capture (admin / AU / picker). Portal hubs should use
 * {@link UnifiedEvidenceCapture} for the full type-chips + scrape composition.
 */
export function EvidenceUploader({
  partnerId,
  reportId,
  onCreated,
  initialCaption = '',
  prominent = false,
  compact = false,
  scannerProfile = 'general',
  multiple = true,
}: {
  partnerId: string;
  reportId?: string;
  onCreated: (item: EvidenceItem, file?: File) => void;
  initialCaption?: string;
  prominent?: boolean;
  compact?: boolean;
  scannerProfile?: DocScanProfile;
  multiple?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [caption, setCaption] = useState(initialCaption);
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<PendingThumb[]>([]);

  useEffect(() => {
    if (initialCaption) setCaption(initialCaption);
  }, [initialCaption]);

  const accept = useMemo(() => 'image/*,application/pdf,video/mp4,video/webm,video/quicktime', []);

  const scanifyImage = async (file: File): Promise<File> => {
    const type = file.type || '';
    if (!type.startsWith('image/')) return file;
    const blob = await scanUploadedImageFile(file, scannerProfile);
    const base = file.name.replace(/\.[a-z0-9]+$/i, '') || 'Document';
    return new File([blob], `${base}_scanned.jpg`, { type: 'image/jpeg' });
  };

  const handleFile = async (
    file: File,
    opts?: { skipScan?: boolean; captionOverride?: string; clearCaptionAfter?: boolean },
  ) => {
    setBusy(true);
    setError(null);
    try {
      const shouldScan = !opts?.skipScan && scanMode;
      const finalFile = shouldScan ? await scanifyImage(file) : file;
      const effectiveCaption = (opts?.captionOverride ?? caption).trim() || undefined;
      const { ref } = await blobStore.put(finalFile, {
        partnerId,
        reportId,
        caption: effectiveCaption,
        scanMode: shouldScan,
        kind: 'evidence',
      });
      const item: EvidenceItem = {
        id: newId('evidence'),
        partnerId,
        reportId,
        type: 'upload',
        source: 'upload',
        caption: effectiveCaption,
        filename: finalFile.name,
        mimeType: finalFile.type || 'application/octet-stream',
        sizeBytes: finalFile.size,
        blobRef: ref,
        createdAt: new Date().toISOString(),
      };
      onCreated(item, finalFile);
      if (opts?.clearCaptionAfter ?? true) setCaption('');
    } catch (e: any) {
      setError(e?.message || 'Evidence upload failed.');
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const processFiles = async (files: File[], opts?: { skipScan?: boolean }) => {
    if (!files.length) return;
    const thumbs: PendingThumb[] = files.map((file) => ({
      id: newId('pend'),
      file,
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      status: 'queued' as const,
    }));
    setPending(thumbs);
    const baseCap = caption.trim();
    for (let i = 0; i < thumbs.length; i++) {
      const t = thumbs[i]!;
      setPending((prev) => prev.map((p) => (p.id === t.id ? { ...p, status: 'uploading' } : p)));
      const cap =
        !baseCap
          ? undefined
          : thumbs.length > 1
            ? `${baseCap} — ${i + 1}/${thumbs.length}`
            : baseCap;
      try {
        await handleFile(t.file, {
          skipScan: opts?.skipScan,
          captionOverride: cap,
          clearCaptionAfter: i === thumbs.length - 1,
        });
        setPending((prev) => prev.map((p) => (p.id === t.id ? { ...p, status: 'done' } : p)));
      } catch {
        setPending((prev) => prev.map((p) => (p.id === t.id ? { ...p, status: 'error' } : p)));
      }
    }
  };

  return (
    <div className={`${finelyOsGlassShell('catalog', prominent ? 'amber' : 'emerald')} ${compact ? 'space-y-3 !p-4' : 'space-y-4'}`}>
      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        caption={caption}
        defaultProfile={scannerProfile}
        title={scannerProfile === 'id_card' || scannerProfile === 'ssn_card' ? 'ID card scanner' : 'Document scanner'}
        subtitle={
          scannerProfile === 'id_card' || scannerProfile === 'ssn_card'
            ? 'Wait for the quality bar and “Ready” before capture — bright, even lighting required.'
            : 'Align your document — we crop, enhance, and classify after capture.'
        }
        onSaveFiles={async ({ files }) => {
          await processFiles(files, { skipScan: true });
          setCaption('');
        }}
      />
      {!compact ? (
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>Capture</p>
            <h3 className={`${FINELY_OS_ENTITY_TITLE} mt-2`}>{prominent ? 'Scan or upload proof' : 'Upload Evidence'}</h3>
            <p className={`${FINELY_OS_ENTITY_BODY} mt-1`}>
              {prominent
                ? 'Camera, gallery, or drag-drop. Multi-file with preview thumbs.'
                : 'Upload screenshots, PDFs, videos, or supporting documents. Attachable to dispute letters.'}
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <ImageIcon size={14} /> files
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className={FINELY_OS_ENTITY_SUBLABEL}>Caption</label>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className={FINELY_OS_ENTITY_INPUT}
          placeholder="Example: Screenshot of payment history showing CO on EXP"
        />
      </div>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const list = Array.from(e.dataTransfer.files || []);
          if (list.length) void processFiles(list);
        }}
        className={`rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragOver
            ? 'border-amber-400/70 bg-amber-500/15'
            : 'border-emerald-400/35 bg-black/30 hover:border-emerald-300/50'
        }`}
      >
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-100">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
          {busy ? 'Uploading…' : 'Drag & drop — or choose below'}
        </div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>Images, PDF, video · multi-select supported</p>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const list = Array.from(e.target.files || []);
            e.target.value = '';
            if (list.length) void processFiles(list);
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*,application/pdf"
          multiple={multiple}
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const list = Array.from(e.target.files || []);
            e.target.value = '';
            if (list.length) void processFiles(list);
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className={`${FINELY_OS_SECONDARY_BTN} !w-full justify-center`}>
          <FileUp size={14} /> Files
        </button>
        <button type="button" disabled={busy} onClick={() => galleryRef.current?.click()} className={`${FINELY_OS_SECONDARY_BTN} !w-full justify-center`}>
          <Images size={14} /> Gallery
        </button>
        <button type="button" disabled={busy} onClick={() => setCameraOpen(true)} className={`${FINELY_OS_PRIMARY_BTN} !w-full justify-center`}>
          <Camera size={14} /> Camera
        </button>
      </div>

      {pending.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {pending.map((p) => (
            <div key={p.id} className="relative w-14 h-14 rounded-lg border border-white/15 overflow-hidden bg-black/40">
              {p.url ? <img src={p.url} alt="" className="w-full h-full object-cover" /> : <div className="text-[8px] text-white/50 p-1">PDF</div>}
              <div className="absolute inset-x-0 bottom-0 text-[8px] text-center bg-black/70">{p.status}</div>
              {(p.status === 'done' || p.status === 'error') && (
                <button
                  type="button"
                  className="absolute top-0.5 right-0.5 bg-black/70 rounded-full p-0.5"
                  onClick={() => {
                    setPending((prev) => {
                      const next = prev.filter((x) => x.id !== p.id);
                      if (p.url) URL.revokeObjectURL(p.url);
                      return next;
                    });
                  }}
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : null}

      <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>
        <input type="checkbox" checked={scanMode} onChange={(e) => setScanMode(e.target.checked)} className="accent-amber-500" />
        Scan-style (white paper document)
      </label>

      {error && <div className={FINELY_OS_NOTICE_ERROR}>{error}</div>}
    </div>
  );
}
