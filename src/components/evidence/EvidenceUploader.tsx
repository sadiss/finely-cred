import React, { useEffect, useMemo, useState } from 'react';
import { Camera, FileUp, Image as ImageIcon } from 'lucide-react';
import type { EvidenceItem } from '../../domain/evidence';
import { getBlobStore } from '../../storage/getBlobStore';
import { newId } from '../../utils/ids';
import { renderScannedJpeg, type DocScanProfile } from '../../utils/imageScan';
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

export function EvidenceUploader({
  partnerId,
  reportId,
  onCreated,
  initialCaption = '',
  prominent = false,
  scannerProfile = 'general',
}: {
  partnerId: string;
  reportId?: string;
  onCreated: (item: EvidenceItem, file?: File) => void;
  initialCaption?: string;
  prominent?: boolean;
  scannerProfile?: DocScanProfile;
}) {
  const [busy, setBusy] = useState(false);
  const [caption, setCaption] = useState(initialCaption);
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    if (initialCaption) setCaption(initialCaption);
  }, [initialCaption]);

  const accept = useMemo(() => 'image/*,application/pdf,video/mp4,video/webm,video/quicktime', []);

  const scanifyImage = async (file: File): Promise<File> => {
    const type = file.type || '';
    if (!type.startsWith('image/')) return file;
    const blob = await renderScannedJpeg(file, { preset: 'document_scan', rotateDeg: 0, maxDimension: 2200, quality: 0.94 });
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
    <div className={`${finelyOsGlassShell('catalog', prominent ? 'amber' : 'emerald')} space-y-6`}>
      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        caption={caption}
        defaultProfile={scannerProfile}
        title={scannerProfile === 'id_card' || scannerProfile === 'ssn_card' ? 'ID card scanner' : 'Document scanner'}
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
        <div className="min-w-0">
          <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>Evidence vault</p>
          <h3 className={`${FINELY_OS_ENTITY_TITLE} mt-2`}>{prominent ? 'Scan or upload proof' : 'Upload Evidence'}</h3>
          <p className={`${FINELY_OS_ENTITY_BODY} mt-1`}>
            {prominent
              ? 'Camera flattens photos onto white paper (ID, SSN, bureau mail). PDFs and images route to the right workflow after upload.'
              : 'Upload screenshots, PDFs, videos, or supporting documents. These will be attachable to dispute letters.'}
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
          <ImageIcon size={14} /> files
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 min-w-0">
          <label className={FINELY_OS_ENTITY_SUBLABEL}>Caption</label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className={FINELY_OS_ENTITY_INPUT}
            placeholder="Example: Screenshot of payment history showing CO on EXP"
          />
        </div>
        <div className="min-w-0">
          <label className={FINELY_OS_ENTITY_SUBLABEL}>File</label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <label className={`w-full cursor-pointer ${FINELY_OS_SECONDARY_BTN} !w-full justify-center`}>
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
              className={`w-full ${FINELY_OS_PRIMARY_BTN} justify-center disabled:opacity-60 disabled:cursor-not-allowed`}
              title="Open camera scanner (multi-page)"
            >
              <Camera size={14} />
              {busy ? 'Uploading…' : 'Camera scan'}
            </button>
          </div>

          <div className={`mt-3 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
            Tip: on mobile, you can also use “Choose file” and select “Camera” if your browser doesn’t allow in-app capture.
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
            <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>
              <input
                type="checkbox"
                checked={scanMode}
                onChange={(e) => setScanMode(e.target.checked)}
                className="accent-amber-500"
              />
              Scan-style (white paper document)
            </label>
            <div className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>Best for correspondence/photos of letters.</div>
          </div>
        </div>
      </div>

      {error && <div className={FINELY_OS_NOTICE_ERROR}>{error}</div>}
    </div>
  );
}

