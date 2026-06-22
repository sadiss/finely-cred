import { getBlobStore } from '../storage/getBlobStore';
import { downloadBlob, openUrlInNewTab } from '../utils/download';

export type CreditAnalysisDocResult = { ok: true } | { ok: false; message: string };

function isPdfBytes(buf: Uint8Array) {
  if (buf.length < 5) return false;
  return buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46 && buf[4] === 0x2d;
}

async function loadPdfBlob(blobRef: string): Promise<{ blob: Blob } | { error: string }> {
  const ref = String(blobRef || '').trim();
  if (!ref) return { error: 'No file reference on this report.' };

  const store = getBlobStore();
  let blob: Blob | null = null;
  try {
    blob = await store.get(ref);
  } catch {
    blob = null;
  }
  if (!blob || blob.size < 64) {
    return { error: 'PDF not found in storage. Regenerate the report and try again.' };
  }

  const buf = new Uint8Array(await blob.arrayBuffer());
  if (!isPdfBytes(buf)) {
    return { error: 'Stored file is not a valid PDF. Regenerate the report.' };
  }

  const typed = blob.type === 'application/pdf' ? blob : new Blob([buf], { type: 'application/pdf' });
  return { blob: typed };
}

export async function openCreditAnalysisPdf(args: {
  blobRef: string;
  filename: string;
}): Promise<CreditAnalysisDocResult> {
  const loaded = await loadPdfBlob(args.blobRef);
  if ('error' in loaded) return { ok: false, message: loaded.error };

  const url = URL.createObjectURL(loaded.blob);
  openUrlInNewTab({ url, revoke: () => URL.revokeObjectURL(url), revokeAfterMs: 120_000 });
  return { ok: true };
}

export async function downloadCreditAnalysisPdf(args: {
  blobRef: string;
  filename: string;
}): Promise<CreditAnalysisDocResult> {
  const loaded = await loadPdfBlob(args.blobRef);
  if ('error' in loaded) return { ok: false, message: loaded.error };

  downloadBlob({ blob: loaded.blob, filename: args.filename || 'Credit Analysis.pdf' });
  return { ok: true };
}
