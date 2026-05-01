import React, { useMemo, useState } from 'react';
import { Camera, FileUp, Image as ImageIcon } from 'lucide-react';
import type { EvidenceItem } from '../../domain/evidence';
import { getBlobStore } from '../../storage/getBlobStore';
import { newId } from '../../utils/ids';
import { renderScannedJpeg } from '../../utils/imageScan';
import { CameraCaptureModal } from './CameraCaptureModal';

const blobStore = getBlobStore();

export function EvidenceUploader({
  partnerId,
  reportId,
  onCreated,
}: {
  partnerId: string;
  reportId?: string;
  onCreated: (item: EvidenceItem, file?: File) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);

  const accept = useMemo(() => 'image/*,application/pdf,video/mp4,video/webm,video/quicktime', []);

  const scanifyImage = async (file: File): Promise<File> => {
    const type = file.type || '';
    if (!type.startsWith('image/')) return file;
    const blob = await renderScannedJpeg(file, { preset: 'clean', rotateDeg: 0, maxDimension: 2200, quality: 0.92 });
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
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        caption={caption}
        onSaveFiles={async ({ files }) => {
          const baseCap = caption.trim();
          for (let i = 0; i < files.length; i++) {
            const f = files[i]!;
            const cap =
              !baseCap
                ? undefined
                : files.length > 1
                  ? `${baseCap} — page ${i + 1}/${files.length}`
                  : baseCap;
            // Camera capture already produced final output; do not re-scan.
            await handleFile(f, { skipScan: true, captionOverride: cap, clearCaptionAfter: false });
          }
          setCaption('');
        }}
      />
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Evidence vault</p>
          <h3 className="text-xl font-light text-white mt-2">Upload Evidence</h3>
          <p className="text-white/50 text-sm mt-1">
            Upload screenshots, PDFs, videos, or supporting documents. These will be attachable to dispute letters.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest">
          <ImageIcon size={14} /> files
        </div>
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Caption</label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
            placeholder="Example: Screenshot of payment history showing CO on EXP"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">File</label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <label className="w-full cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/15 transition-all">
              <FileUp size={14} />
              {busy ? 'Uploading…' : 'Choose file'}
              <input
                type="file"
                accept={accept}
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                  e.currentTarget.value = '';
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              title="Open camera scanner (multi-page)"
            >
              <Camera size={14} />
              {busy ? 'Uploading…' : 'Camera scan'}
            </button>
          </div>

          <div className="mt-3 text-[11px] text-white/40">
            Tip: on mobile, you can also use “Choose file” and select “Camera” if your browser doesn’t allow in-app capture.
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
              <input
                type="checkbox"
                checked={scanMode}
                onChange={(e) => setScanMode(e.target.checked)}
                className="accent-amber-500"
              />
              Scan-style (clean white paper)
            </label>
            <div className="text-[11px] text-white/40">Best for correspondence/photos of letters.</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

