export function downloadBlob(args: { blob: Blob; filename: string }) {
  const filename = (args.filename || 'download').trim() || 'download';
  const url = URL.createObjectURL(args.blob);
  // Use a longer revoke window to avoid blank downloads on slower devices.
  triggerBrowserDownload({ url, filename, revoke: () => URL.revokeObjectURL(url), revokeAfterMs: 60_000 });
}

export function downloadText(args: { text: string; filename: string; mimeType?: string }) {
  const blob = new Blob([args.text], { type: args.mimeType || 'text/plain' });
  downloadBlob({ blob, filename: args.filename });
}

export function triggerBrowserDownload(args: {
  url: string;
  filename: string;
  revoke?: () => void;
  /** Default is 60s to avoid blank downloads on slower devices. */
  revokeAfterMs?: number;
  /** When true, sets target=_blank for better behavior with signed URLs. */
  targetBlank?: boolean;
}) {
  const url = String(args.url || '').trim();
  if (!url) throw new Error('Download URL is empty.');
  const filename = (args.filename || 'download').trim() || 'download';

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  if (args.targetBlank) {
    a.target = '_blank';
    a.rel = 'noopener,noreferrer';
  }

  // Some browsers require the anchor to be in the DOM.
  document.body.appendChild(a);
  a.click();
  a.remove();

  if (args.revoke) {
    window.setTimeout(() => {
      try {
        args.revoke?.();
      } catch {
        // ignore
      }
    }, Math.max(2_000, Number(args.revokeAfterMs ?? 60_000)));
  }
}

export function openUrlInNewTab(args: { url: string; revoke?: () => void; revokeAfterMs?: number }) {
  const url = String(args.url || '').trim();
  if (!url) throw new Error('URL is empty.');
  window.open(url, '_blank', 'noopener,noreferrer');
  if (args.revoke) {
    window.setTimeout(() => {
      try {
        args.revoke?.();
      } catch {
        // ignore
      }
    }, Math.max(5_000, Number(args.revokeAfterMs ?? 60_000)));
  }
}

