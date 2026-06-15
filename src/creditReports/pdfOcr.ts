import * as pdfjsLib from 'pdfjs-dist';

// Use the worker bundled by Vite.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function ocrPdfToText(
  file: File,
  opts?: {
    onProgress?: (p: { page: number; numPages: number; status: string; progress01?: number }) => void;
    /** First page to OCR (1-indexed). Defaults 1. */
    startPage?: number;
    /** Max pages to OCR from startPage. Defaults all pages. */
    maxPages?: number;
    /** Specific pages to OCR (1-indexed). If provided, overrides startPage/maxPages. */
    pages?: number[];
  }
): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjsLib.getDocument({ data }).promise;

  const TesseractMod: any = await import('tesseract.js');
  const recognize: any = TesseractMod.recognize || TesseractMod.default?.recognize;
  if (typeof recognize !== 'function') {
    throw new Error('OCR engine failed to load (tesseract.js).');
  }

  const parts: string[] = [];
  const desiredPages = Array.isArray(opts?.pages) && opts!.pages!.length
    ? Array.from(new Set(opts!.pages!.map((p) => Math.max(1, Math.round(p))).filter((p) => p >= 1 && p <= doc.numPages))).sort((a, b) => a - b)
    : null;

  const start = Math.max(1, Math.round(opts?.startPage ?? 1));
  const cap = opts?.maxPages == null ? doc.numPages : Math.max(1, Math.round(opts.maxPages));
  const end = Math.min(doc.numPages, start + cap - 1);
  const pageList = desiredPages ?? Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
  const total = Math.max(1, pageList.length);

  for (let idx = 0; idx < pageList.length; idx++) {
    const pageNum = pageList[idx]!;
    const doneIdx = idx;
    opts?.onProgress?.({ page: pageNum, numPages: doc.numPages, status: 'rendering page', progress01: doneIdx / total });
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.2 }); // higher = better OCR, slower
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not allocate canvas for OCR.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // pdfjs-dist typings vary by version; include both canvas + context to satisfy types.
    await (page as any).render({ canvasContext: ctx as any, canvas: canvas as any, viewport }).promise;

    const dataUrl = canvas.toDataURL('image/png');
    opts?.onProgress?.({ page: pageNum, numPages: doc.numPages, status: 'recognizing text', progress01: (doneIdx + 0.5) / total });
    const result = await recognize(dataUrl, 'eng', {
      logger: (m: any) => {
        if (!m) return;
        if (m.status && typeof m.progress === 'number') {
          // Map inner OCR progress to overall-ish progress (within our selected range).
          const base = doneIdx / total;
          const span = 1 / total;
          const p01 = Math.min(1, Math.max(0, base + span * m.progress));
          opts?.onProgress?.({ page: pageNum, numPages: doc.numPages, status: m.status, progress01: p01 });
        }
      },
    });

    const text = String(result?.data?.text || '').replace(/\r/g, '').trim();
    if (text) parts.push(text);
  }

  const lastPage = pageList[pageList.length - 1] ?? end;
  opts?.onProgress?.({ page: lastPage, numPages: doc.numPages, status: 'done', progress01: 1 });
  return parts.join('\n\n');
}

