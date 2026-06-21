import { getBlobUrl } from '../storage/getBlobUrl';
import { isLegacyPendingReportBlob, legacyPendingReportFilename } from './legacyPendingReport';
import { openUrlInNewTab, triggerBrowserDownload } from '../utils/download';

export type OpenBlobRefResult =
  | { ok: true }
  | { ok: false; message: string; kind: 'legacy_pending' | 'missing' | 'blocked' | 'error' };

function legacyPendingMessage(ref: string): string {
  const name = legacyPendingReportFilename(ref);
  return `This file was imported from the legacy system without the original bytes. Re-upload "${name}" from your archive to view it.`;
}

/** Opens a blank tab synchronously (preserves user gesture), then loads the blob URL. */
export async function openBlobRefInNewTab(args: {
  blobRef: string;
  mimeType?: string;
  preferSigned?: boolean;
}): Promise<OpenBlobRefResult> {
  const ref = String(args.blobRef || '').trim();
  if (!ref) return { ok: false, message: 'No file reference on this record.', kind: 'missing' };

  if (isLegacyPendingReportBlob(ref)) {
    return { ok: false, message: legacyPendingMessage(ref), kind: 'legacy_pending' };
  }

  const popup = window.open('about:blank', '_blank', 'noopener,noreferrer');
  if (!popup) {
    return {
      ok: false,
      message: 'Pop-up blocked. Allow pop-ups for this site, then try again.',
      kind: 'blocked',
    };
  }

  try {
    const res = await getBlobUrl(ref, {
      mimeType: args.mimeType,
      preferSigned: args.preferSigned ?? true,
    });
    if (!res?.url) {
      popup.close();
      return {
        ok: false,
        message: 'File not found in storage. Re-upload the document or regenerate it.',
        kind: 'missing',
      };
    }
    popup.location.href = res.url;
    if (res.revoke) {
      window.setTimeout(() => {
        try {
          res.revoke?.();
        } catch {
          // ignore
        }
      }, 60_000);
    }
    return { ok: true };
  } catch (e: any) {
    try {
      popup.close();
    } catch {
      // ignore
    }
    return { ok: false, message: e?.message || 'Could not open this file.', kind: 'error' };
  }
}

export async function previewBlobRef(args: {
  blobRef: string;
  mimeType: string;
  preferSigned?: boolean;
  mode?: 'tab' | 'download';
  filename?: string;
}): Promise<OpenBlobRefResult & { url?: string; revoke?: () => void }> {
  const ref = String(args.blobRef || '').trim();
  if (!ref) return { ok: false, message: 'No file reference on this record.', kind: 'missing' };

  if (isLegacyPendingReportBlob(ref)) {
    return { ok: false, message: legacyPendingMessage(ref), kind: 'legacy_pending' };
  }

  try {
    const res = await getBlobUrl(ref, {
      mimeType: args.mimeType,
      preferSigned: args.preferSigned ?? true,
    });
    if (!res?.url) {
      return {
        ok: false,
        message: 'File not found in storage. Re-upload the document or regenerate it.',
        kind: 'missing',
      };
    }

    const mime = (args.mimeType || '').toLowerCase();
    if (mime.startsWith('image/') || mime.startsWith('video/')) {
      return { ok: true, url: res.url, revoke: res.revoke };
    }

    if (mime === 'application/pdf' || args.mode === 'tab') {
      openUrlInNewTab({ url: res.url, revoke: res.revoke, revokeAfterMs: 60_000 });
      return { ok: true };
    }

    triggerBrowserDownload({
      url: res.url,
      filename: args.filename || 'document',
      revoke: res.revoke,
      revokeAfterMs: 30_000,
      targetBlank: true,
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Could not open this file.', kind: 'error' };
  }
}
