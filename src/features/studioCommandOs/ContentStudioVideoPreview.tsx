import React, { useEffect, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { getBlobUrl } from '../../storage/getBlobUrl';

export function ContentStudioVideoPreview({
  blobRef,
  mimeType = 'video/webm',
  className = '',
}: {
  blobRef: string;
  mimeType?: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let revoke: (() => void) | undefined;
    let cancelled = false;
    setLoading(true);
    setErr(null);
    void (async () => {
      try {
        const res = await getBlobUrl(blobRef, { mimeType });
        if (cancelled) {
          res?.revoke?.();
          return;
        }
        if (!res?.url) {
          setErr('Video file not found in storage.');
          setSrc(null);
          return;
        }
        revoke = res.revoke;
        setSrc(res.url);
      } catch {
        if (!cancelled) setErr('Could not load video preview.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      revoke?.();
    };
  }, [blobRef, mimeType]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center rounded-2xl border border-white/10 bg-black/40 aspect-video ${className}`}>
        <Loader2 size={24} className="animate-spin text-white/40" />
      </div>
    );
  }
  if (err || !src) {
    return (
      <div className={`rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-6 text-sm text-rose-100 aspect-video flex items-center justify-center ${className}`}>
        {err ?? 'Preview unavailable'}
      </div>
    );
  }
  return (
    <video
      src={src}
      controls
      playsInline
      className={`w-full rounded-2xl border border-white/10 bg-black aspect-video ${className}`}
    />
  );
}
