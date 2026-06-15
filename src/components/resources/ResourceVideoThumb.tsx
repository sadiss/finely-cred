import React, { useEffect, useRef, useState } from 'react';
import { Film, Play } from 'lucide-react';
import type { ResourceVideo } from '../../domain/resourceVideos';
import { getBlobUrl } from '../../storage/getBlobUrl';

type Props = {
  video: ResourceVideo;
  className?: string;
  onClick?: () => void;
  showPlay?: boolean;
};

export function ResourceVideoThumb({ video, className = '', onClick, showPlay = true }: Props) {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const revokeRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    let alive = true;
    revokeRef.current.forEach((fn) => {
      try {
        fn();
      } catch {
        // ignore
      }
    });
    revokeRef.current = [];
    setPosterUrl(null);
    setVideoUrl(null);

    (async () => {
      if (video.posterBlobRef) {
        const res = await getBlobUrl(video.posterBlobRef, { mimeType: 'image/jpeg', preferSigned: true, signedTtlSeconds: 60 * 30 });
        if (!alive) {
          res?.revoke?.();
          return;
        }
        if (res?.url) {
          if (res.revoke) revokeRef.current.push(res.revoke);
          setPosterUrl(res.url);
          return;
        }
      }
      const res = await getBlobUrl(video.blobRef, { mimeType: video.mimeType, preferSigned: true, signedTtlSeconds: 60 * 20 });
      if (!alive) {
        res?.revoke?.();
        return;
      }
      if (res?.url) {
        if (res.revoke) revokeRef.current.push(res.revoke);
        setVideoUrl(res.url);
      }
    })();

    return () => {
      alive = false;
      revokeRef.current.forEach((fn) => {
        try {
          fn();
        } catch {
          // ignore
        }
      });
      revokeRef.current = [];
    };
  }, [video.id, video.posterBlobRef, video.blobRef, video.mimeType]);

  const inner = (
    <div className={`relative aspect-video overflow-hidden rounded-xl border border-sky-500/25 bg-gradient-to-br from-sky-950/80 via-black/60 to-black/80 ${className}`}>
      {posterUrl ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img src={posterUrl} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      ) : videoUrl ? (
        <video
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          preload="metadata"
          muted
          playsInline
          aria-hidden
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sky-300/70">
          <Film size={28} />
          <span className="text-[10px] uppercase tracking-widest font-black">Loading preview…</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
      {showPlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-sky-500/90 border border-white/20 flex items-center justify-center shadow-lg shadow-sky-500/30">
            <Play size={22} className="text-black ml-0.5" fill="currentColor" />
          </div>
        </div>
      )}
      <span className="absolute top-2 left-2 px-2 py-1 rounded-lg border border-sky-400/40 bg-sky-500/20 text-[9px] font-black uppercase tracking-widest text-sky-100">
        Video
      </span>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left group">
        {inner}
      </button>
    );
  }

  return inner;
}
