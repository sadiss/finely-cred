import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, X, RotateCw, Wand2, FileDown, Layers, Trash2, Crop, SwitchCamera, Zap } from 'lucide-react';
import type { CropMargins, DocScanProfile, ScanPreset } from '../../utils/imageScan';
import {
  detectDocumentBoundsAdvanced,
  detectDocumentCropMargins,
  documentAspectForProfile,
  guideCropForProfile,
  renderScannedJpeg,
  resolveCaptureCrop,
  scanPresetForProfile,
} from '../../utils/imageScan';
import { DocumentScannerGuideFrame } from './DocumentScannerGuideFrame';

type PageDraft = {
  id: string;
  original: Blob;
  preset: ScanPreset;
  rotateDeg: 0 | 90 | 180 | 270;
  crop: CropMargins;
  previewUrl?: string;
  rendered?: Blob;
  rendering?: boolean;
  error?: string;
};

function newPageId() {
  return `cap_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp01(v: number) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

type DocScanProfileLocal = DocScanProfile;

const PROFILE_PRESETS: Record<DocScanProfileLocal, ScanPreset> = {
  general: 'document_scan',
  id_card: 'id_card_enhance',
  ssn_card: 'id_card_enhance',
  bureau_mail: 'document_scan',
  creditor_letter: 'document_scan',
};

const DEFAULT_CROP: CropMargins = { left: 0, top: 0, right: 0, bottom: 0 };

const DOC_PROFILES: Array<{ id: DocScanProfileLocal; label: string }> = [
  { id: 'id_card', label: 'ID / license' },
  { id: 'ssn_card', label: 'SSN card' },
  { id: 'bureau_mail', label: 'Bureau mail' },
  { id: 'creditor_letter', label: 'Collector' },
  { id: 'general', label: 'General' },
];

export function CameraCaptureModal({
  open,
  onClose,
  caption,
  onSaveFiles,
  defaultProfile = 'general',
  title = 'Document scanner',
  subtitle,
}: {
  open: boolean;
  onClose: () => void;
  caption?: string;
  onSaveFiles: (args: { mode: 'pdf' | 'images'; files: File[] }) => Promise<void> | void;
  defaultProfile?: DocScanProfileLocal;
  title?: string;
  subtitle?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<'pdf' | 'images'>('pdf');

  const [pages, setPages] = useState<PageDraft[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = useMemo(() => pages.find((p) => p.id === activeId) ?? null, [pages, activeId]);

  const [defaultPreset, setDefaultPreset] = useState<ScanPreset>(scanPresetForProfile(defaultProfile));
  const [docProfile, setDocProfile] = useState<DocScanProfileLocal>(defaultProfile);
  const [liveCrop, setLiveCrop] = useState<CropMargins | null>(null);
  const [guideCrop, setGuideCrop] = useState<CropMargins>({ left: 0.08, top: 0.18, right: 0.08, bottom: 0.18 });
  const [detectConfidence, setDetectConfidence] = useState(0);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraReady, setCameraReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const loadPdfLib = async () => {
    const { PDFDocument } = await import('pdf-lib');
    return { PDFDocument };
  };

  const ensureStream = async () => {
    stopStream();
    setStarting(true);
    setCameraReady(false);
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera is not available in this browser. Use “Choose file” instead.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 3840, min: 1280 },
          height: { ideal: 2160, min: 720 },
          frameRate: { ideal: 30, max: 60 },
          exposureMode: 'continuous',
          focusMode: 'continuous',
          whiteBalanceMode: 'continuous',
        } as MediaTrackConstraints,
        audio: false,
      });
      streamRef.current = stream;
      if (torchOn) {
        const track = stream.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
        if (caps?.torch) {
          await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] });
        }
      }
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
        setCameraReady(true);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to start camera.');
    } finally {
      setStarting(false);
    }
  };

  const stopStream = () => {
    const s = streamRef.current;
    if (s) s.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (!open) return;
    setDocProfile(defaultProfile);
    setDefaultPreset(scanPresetForProfile(defaultProfile));
    void ensureStream();
    return () => {
      stopStream();
      setCameraReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultProfile, facingMode, torchOn]);

  // Live document edge detection — focuses on ID/SSN even with hand/background clutter
  useEffect(() => {
    if (!open || starting) return;
    let raf = 0;
    let lastRun = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - lastRun < 450) return;
      lastRun = t;
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return;
      const sampleW = 320;
      const sampleH = Math.round((h / w) * sampleW);
      const c = document.createElement('canvas');
      c.width = sampleW;
      c.height = sampleH;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, sampleW, sampleH);
      const aspect = documentAspectForProfile(docProfile);
      const bounds = detectDocumentBoundsAdvanced(c, {
        targetAspect: aspect,
        centerBias: docProfile === 'id_card' || docProfile === 'ssn_card' ? 0.62 : 0.45,
        paddingPct: 0.018,
      });
      setLiveCrop(bounds.crop);
      setDetectConfidence(bounds.confidence);
      setGuideCrop(guideCropForProfile(docProfile, w, h));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, starting, docProfile]);

  // Kill object URLs on unmount/close.
  useEffect(() => {
    if (open) return;
    pages.forEach((p) => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
    setPages([]);
    setActiveId(null);
    setError(null);
    setSaveMode('pdf');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video) return;
    setCapturing(true);
    setError(null);
    try {
      const w = Math.max(1, video.videoWidth || 1280);
      const h = Math.max(1, video.videoHeight || 720);
      const maxLongEdge = 2400;
      const longEdge = Math.max(w, h);
      const scale = longEdge > maxLongEdge ? maxLongEdge / longEdge : 1;
      const outW = Math.max(1, Math.round(w * scale));
      const outH = Math.max(1, Math.round(h * scale));
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable.');
      ctx.drawImage(video, 0, 0, outW, outH);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to capture image.'))), 'image/jpeg', 0.92);
      });

      let autoCrop = guideCropForProfile(docProfile, outW, outH);
      try {
        const aspect = documentAspectForProfile(docProfile);
        const bounds = detectDocumentBoundsAdvanced(canvas, {
          targetAspect: aspect,
          centerBias: docProfile === 'id_card' || docProfile === 'ssn_card' ? 0.62 : 0.45,
          paddingPct: 0.012,
        });
        autoCrop = resolveCaptureCrop(docProfile, outW, outH, bounds);
        setDetectConfidence(bounds.confidence);
      } catch {
        try {
          autoCrop = detectDocumentCropMargins(canvas, 0.015);
        } catch {
          autoCrop = guideCropForProfile(docProfile, outW, outH);
        }
      }

      const preset = PROFILE_PRESETS[docProfile] ?? defaultPreset;
      const id = newPageId();
      const page: PageDraft = {
        id,
        original: blob,
        preset,
        rotateDeg: 0,
        crop: autoCrop,
      };
      setPages((prev) => [page, ...prev]);
      setActiveId(id);
    } catch (e: any) {
      setError(e?.message || 'Capture failed.');
    } finally {
      setCapturing(false);
    }
  };

  const updatePage = (id: string, patch: Partial<PageDraft>) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return { ...p, ...patch };
      }),
    );
  };

  const deletePage = (id: string) => {
    setPages((prev) => {
      const next = prev.filter((p) => p.id !== id);
      const removed = prev.find((p) => p.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      if (activeId === id) setActiveId(next[0]?.id ?? null);
      return next;
    });
  };

  const renderPage = async (p: PageDraft): Promise<{ rendered: Blob; previewUrl: string }> => {
    const rendered = await renderScannedJpeg(p.original, {
      preset: p.preset,
      rotateDeg: p.rotateDeg,
      crop: p.crop,
      maxDimension: 2200,
      quality: p.preset === 'bw_crisp' ? 0.9 : 0.92,
    });
    const previewUrl = URL.createObjectURL(rendered);
    return { rendered, previewUrl };
  };

  // Re-render active page when controls change.
  useEffect(() => {
    if (!open) return;
    if (!active) return;
    let cancelled = false;
    const id = active.id;
    updatePage(id, { rendering: true, error: undefined });
    void (async () => {
      try {
        const { rendered, previewUrl } = await renderPage(active);
        if (cancelled) {
          URL.revokeObjectURL(previewUrl);
          return;
        }
        // Replace old preview URL if present.
        setPages((prev) =>
          prev.map((p) => {
            if (p.id !== id) return p;
            if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
            return { ...p, rendered, previewUrl, rendering: false };
          }),
        );
      } catch (e: any) {
        if (cancelled) return;
        updatePage(id, { rendering: false, error: e?.message || 'Failed to render preview.' });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active?.id, active?.preset, active?.rotateDeg, active?.crop.left, active?.crop.top, active?.crop.right, active?.crop.bottom]);

  const buildFilesForSave = async (): Promise<File[]> => {
    // Ensure all pages are rendered first.
    const ensured: Array<{ idx: number; blob: Blob }> = [];
    for (let i = pages.length - 1; i >= 0; i--) {
      const p = pages[i]!;
      const rendered = p.rendered ?? (await renderPage(p)).rendered;
      ensured.push({ idx: i, blob: rendered });
    }
    // ensured is in original order; keep it stable.
    ensured.sort((a, b) => a.idx - b.idx);

    if (saveMode === 'images') {
      return ensured.map(({ blob }, n) => new File([blob], `scan_page_${String(n + 1).padStart(2, '0')}.jpg`, { type: 'image/jpeg' }));
    }

    // saveMode === 'pdf'
    const { PDFDocument } = await loadPdfLib();
    const doc = await PDFDocument.create();
    for (let i = 0; i < ensured.length; i++) {
      const bytes = await ensured[i]!.blob.arrayBuffer();
      const jpg = await doc.embedJpg(bytes);
      const page = doc.addPage([jpg.width, jpg.height]);
      page.drawImage(jpg, { x: 0, y: 0, width: jpg.width, height: jpg.height });
    }
    const pdfBytes = await doc.save();
    // pdf-lib types return Uint8Array<ArrayBufferLike>; copy into ArrayBuffer-backed Uint8Array for TS + Blob safety.
    const pdfBytesStd = new Uint8Array(pdfBytes);
    const pdfBlob = new Blob([pdfBytesStd], { type: 'application/pdf' });
    const base = (caption || 'Scanned_document').trim().replace(/[^\w\- ]+/g, '').slice(0, 80) || 'Scanned_document';
    return [new File([pdfBlob], `${base}.pdf`, { type: 'application/pdf' })];
  };

  const handleSave = async () => {
    if (pages.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const files = await buildFilesForSave();
      await onSaveFiles({ mode: saveMode, files });
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-6xl min-h-0 max-h-[100dvh] sm:max-h-[94vh] rounded-none sm:rounded-2xl border-0 sm:border border-white/[0.08] bg-fc-shell shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between gap-4 p-4 border-b border-white/[0.08]">
          <div className="min-w-0">
            <div className="text-white font-semibold">{title}</div>
            <div className="text-white/50 text-xs mt-1">
              {subtitle ??
                'Align your document in the frame — only the card/letter inside the box is captured and enhanced.'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/10 transition-all"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-0 flex-1 min-h-0 overflow-y-auto">
          <div className="lg:col-span-7 border-r border-white/[0.08] p-3 sm:p-4 space-y-3">
            <div className="fc-light-glass-panel fc-light-chrome-panel overflow-hidden">
              <div className="aspect-[3/4] sm:aspect-[4/3] max-h-[52vh] bg-black relative overflow-hidden">
                <video ref={videoRef} className="w-full h-full object-contain bg-black" playsInline muted autoPlay />
                <DocumentScannerGuideFrame
                  profile={docProfile}
                  guideCrop={guideCrop}
                  detectedCrop={liveCrop}
                  confidence={detectConfidence}
                  cameraReady={cameraReady && !starting}
                />
                <div className="absolute top-3 right-3 z-20 flex gap-2 pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setTorchOn((v) => !v);
                      void ensureStream();
                    }}
                    className={`p-2 rounded-xl border text-white/80 hover:text-white ${
                      torchOn ? 'bg-amber-500/30 border-amber-400/40' : 'bg-black/55 border-white/20'
                    }`}
                    title="Toggle flash / torch (rear camera)"
                  >
                    <Zap size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))}
                    className="p-2 rounded-xl bg-black/55 border border-white/20 text-white/80 hover:text-white"
                    title="Flip camera"
                  >
                    <SwitchCamera size={16} />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 right-3 z-20 text-center text-[10px] uppercase tracking-widest text-white/90 bg-black/55 rounded-lg py-2 px-3 border border-white/10">
                  {docProfile === 'id_card' || docProfile === 'ssn_card' ? (
                    <span className="inline-flex items-center gap-1.5 justify-center">
                      <Zap size={11} className="text-amber-300" />
                      Hold ID flat · fill the green frame · avoid glare
                    </span>
                  ) : (
                    'Fill the frame with your document — background is ignored'
                  )}
                </div>
                {starting && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center text-white/80 text-sm bg-black/40">
                    Starting camera…
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void captureFrame()}
                    disabled={starting || capturing || saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Camera size={14} />
                    {capturing ? 'Capturing…' : 'Capture page'}
                  </button>
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                    pages: <span className="text-white/70">{pages.length}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                    <input
                      type="radio"
                      name="savemode"
                      checked={saveMode === 'pdf'}
                      onChange={() => setSaveMode('pdf')}
                      className="accent-amber-500"
                      disabled={saving}
                    />
                    <span className="inline-flex items-center gap-2">
                      <FileDown size={14} /> Save PDF
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                    <input
                      type="radio"
                      name="savemode"
                      checked={saveMode === 'images'}
                      onChange={() => setSaveMode('images')}
                      className="accent-amber-500"
                      disabled={saving}
                    />
                    <span className="inline-flex items-center gap-2">
                      <Layers size={14} /> Save images
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm">{error}</div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Captured pages</div>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={pages.length === 0 || saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FileDown size={14} />
                {saving ? 'Saving…' : 'Save to vault'}
              </button>
            </div>

            {pages.length === 0 ? (
              <div className="fc-light-glass-panel fc-light-chrome-panel p-6 text-white/60 text-sm">
                Capture at least one page to preview and save.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {pages.map((p) => {
                  const isActive = p.id === activeId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActiveId(p.id)}
                      className={`rounded-2xl border overflow-hidden text-left transition-all ${
                        isActive ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/[0.08] bg-white/[0.07] hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="aspect-[4/3] bg-fc-input flex items-center justify-center">
                        {p.previewUrl ? (
                          <img src={p.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-white/40 text-xs">Rendering…</div>
                        )}
                      </div>
                      <div className="p-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-white/80 text-xs font-semibold truncate">{p.preset}</div>
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">rot:{p.rotateDeg}</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePage(p.id);
                          }}
                          className="p-2 rounded-xl bg-white/5 border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/10 transition-all"
                          title="Delete page"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 p-4 space-y-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Document type</div>
            <div className="flex flex-wrap gap-2">
              {DOC_PROFILES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setDocProfile(p.id);
                    setDefaultPreset(PROFILE_PRESETS[p.id]);
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${
                    docProfile === p.id ? 'border-amber-500/40 bg-amber-500/10 text-amber-100' : 'border-white/[0.08] text-white/50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">Edit page</div>

            {!active ? (
              <div className="fc-light-glass-panel fc-light-chrome-panel p-6 text-white/60 text-sm">
                Select a captured page to edit scan settings.
              </div>
            ) : (
              <>
                <div className="fc-light-glass-panel fc-light-chrome-panel overflow-hidden">
                  <div className="aspect-[4/3] bg-fc-input flex items-center justify-center">
                    {active.previewUrl ? (
                      <img src={active.previewUrl} alt="Active preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-white/40 text-xs">Rendering…</div>
                    )}
                  </div>
                  <div className="p-3 border-t border-white/[0.08] flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updatePage(active.id, {
                          rotateDeg: (((active.rotateDeg + 90) % 360) as any) as 0 | 90 | 180 | 270,
                        })
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.06] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      disabled={saving}
                      title="Rotate 90°"
                    >
                      <RotateCw size={14} /> Rotate
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePage(active.id, { crop: { ...DEFAULT_CROP } })}
                      className="inline-flex items-center gap-2 px-3 py-2 fc-light-glass-panel fc-light-chrome-panel rounded-xl hover:bg-white/[0.06] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      disabled={saving}
                      title="Reset crop"
                    >
                      <Crop size={14} /> Reset crop
                    </button>
                  </div>
                </div>

                <div className="fc-light-glass-panel fc-light-chrome-panel p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-amber-400">
                      <Wand2 size={16} />
                      <span className="text-xs font-semibold uppercase tracking-wider">Scan preset</span>
                    </div>
                    {active.rendering && <div className="text-white/40 text-xs">Rendering…</div>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { id: 'document_scan', label: 'White paper scan' },
                      { id: 'id_card_enhance', label: 'ID / color enhance' },
                      { id: 'clean', label: 'Clean scan' },
                      { id: 'bw_crisp', label: 'B/W crisp' },
                      { id: 'color_enhance', label: 'Color enhance' },
                      { id: 'original', label: 'Original' },
                    ] as Array<{ id: ScanPreset; label: string }>).map((opt) => {
                      const on = active.preset === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updatePage(active.id, { preset: opt.id })}
                          disabled={saving}
                          className={`rounded-xl border px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest transition-all ${
                            on
                              ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                              : 'border-white/[0.08] bg-white/[0.07] text-white/60 hover:bg-white/[0.03] hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="fc-light-glass-panel fc-light-chrome-panel rounded-xl p-3 space-y-2">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Default preset for new pages</div>
                    <select
                      value={defaultPreset}
                      onChange={(e) => setDefaultPreset(e.target.value as ScanPreset)}
                      className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm"
                      disabled={saving}
                    >
                      <option value="document_scan">White paper scan (recommended)</option>
                      <option value="id_card_enhance">ID / color enhance</option>
                      <option value="clean">Clean scan</option>
                      <option value="bw_crisp">B/W crisp</option>
                      <option value="color_enhance">Color enhance</option>
                      <option value="original">Original</option>
                    </select>
                  </div>
                </div>

                <div className="fc-light-glass-panel fc-light-chrome-panel p-4 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/70 inline-flex items-center gap-2">
                    <Crop size={16} className="text-amber-400" /> Crop (manual)
                  </div>
                  <div className="text-white/50 text-xs">
                    Auto-detected on capture; fine-tune margins if needed.
                  </div>

                  {([
                    { k: 'top', label: 'Top' },
                    { k: 'bottom', label: 'Bottom' },
                    { k: 'left', label: 'Left' },
                    { k: 'right', label: 'Right' },
                  ] as Array<{ k: keyof CropMargins; label: string }>).map((row) => (
                    <div key={row.k} className="grid grid-cols-12 items-center gap-3">
                      <div className="col-span-3 text-[10px] uppercase tracking-widest text-white/40">{row.label}</div>
                      <input
                        className="col-span-7"
                        type="range"
                        min={0}
                        max={30}
                        value={Math.round(active.crop[row.k] * 100)}
                        onChange={(e) => {
                          const pct = clamp01(parseFloat(e.target.value) / 100);
                          updatePage(active.id, { crop: { ...active.crop, [row.k]: pct } });
                        }}
                        disabled={saving}
                      />
                      <div className="col-span-2 text-[10px] uppercase tracking-widest text-white/40 font-mono text-right">
                        {Math.round(active.crop[row.k] * 100)}%
                      </div>
                    </div>
                  ))}
                </div>

                {active.error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm">{active.error}</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

