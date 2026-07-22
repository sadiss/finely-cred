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

function isPdfMime(mimeType?: string) {
  return String(mimeType || '').toLowerCase().includes('pdf');
}

/**
 * Navigate a popup we opened from a user gesture.
 * Do NOT use noopener on about:blank — that drops the window handle and leaves a blank tab.
 */
function navigateOpenedTab(popup: Window, url: string, mimeType?: string) {
  const mime = String(mimeType || '').toLowerCase();
  const isPdf = mime.includes('pdf') || /\.pdf(\?|$)/i.test(url);

  try {
    if (isPdf) {
      // Embed PDF so Chrome/Edge don't show an empty tab for blob:/signed PDFs.
      popup.document.open();
      popup.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Document</title>
  <style>
    html, body { margin: 0; height: 100%; background: #111; }
    iframe, embed { border: 0; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <iframe src="${url.replace(/"/g, '&quot;')}" title="PDF" type="application/pdf"></iframe>
</body>
</html>`);
      popup.document.close();
    } else {
      popup.location.href = url;
    }
  } catch {
    try {
      popup.location.replace(url);
    } catch {
      popup.location.href = url;
    }
  }

  try {
    popup.opener = null;
  } catch {
    // ignore
  }
}

/** Opens a blank tab synchronously (preserves user gesture), then loads the blob/signed URL. */
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

  // Important: no "noopener" here — we must keep the Window handle to navigate after fetch.
  const popup = window.open('about:blank', '_blank');
  if (!popup) {
    return {
      ok: false,
      message: 'Pop-up blocked. Allow pop-ups for this site, then try again.',
      kind: 'blocked',
    };
  }

  try {
    popup.document.title = 'Loading…';
  } catch {
    // cross-origin / restricted — ok
  }

  try {
    const res = await getBlobUrl(ref, {
      mimeType: args.mimeType,
      preferSigned: args.preferSigned ?? true,
    });
    if (!res?.url) {
      try {
        popup.close();
      } catch {
        // ignore
      }
      return {
        ok: false,
        message: 'File not found in storage. Re-upload the document or regenerate it.',
        kind: 'missing',
      };
    }

    navigateOpenedTab(popup, res.url, args.mimeType);

    // Keep blob URLs alive long enough for the viewer to load; never revoke signed URLs early.
    if (res.revoke) {
      window.setTimeout(() => {
        try {
          res.revoke?.();
        } catch {
          // ignore
        }
      }, isPdfMime(args.mimeType) ? 120_000 : 60_000);
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
      const popup = window.open('about:blank', '_blank');
      if (!popup) {
        return {
          ok: false,
          message: 'Pop-up blocked. Allow pop-ups for this site, then try again.',
          kind: 'blocked',
        };
      }
      navigateOpenedTab(popup, res.url, args.mimeType);
      if (res.revoke) {
        window.setTimeout(() => {
          try {
            res.revoke?.();
          } catch {
            // ignore
          }
        }, 120_000);
      }
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
