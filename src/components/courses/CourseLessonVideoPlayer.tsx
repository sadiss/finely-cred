import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Play, Volume2, VolumeX } from 'lucide-react';
import type { CourseLesson } from '../../domain/courses';
import { getResourceVideo } from '../../data/resourceVideosRepo';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { lessonHasAttachedVideo } from '../../features/educationStudio/courseVideoBridge';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, finelyOsGlassShell } from '../../features/os/finelyOsLightUi';

function videoAssetId(lesson: CourseLesson): string | null {
  const block = (lesson.content ?? []).find((b) => b.type === 'video_asset' && b.data?.videoAssetId);
  return block ? String(block.data.videoAssetId) : null;
}

export function CourseLessonVideoPlayer({ lesson, title }: { lesson: CourseLesson; title?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [posterSrc, setPosterSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const assetId = useMemo(() => videoAssetId(lesson), [lesson]);
  const hasVideo = lessonHasAttachedVideo(lesson);

  useEffect(() => {
    if (!hasVideo || !assetId) {
      setVideoSrc(null);
      setPosterSrc(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const revokes: Array<() => void> = [];

    async function resolve() {
      setLoading(true);
      setErr(null);
      const rv = getResourceVideo(assetId!);
      if (!rv) {
        if (!cancelled) {
          setErr('Video asset not found.');
          setVideoSrc(null);
          setLoading(false);
        }
        return;
      }

      const res = await getBlobUrl(rv.blobRef, {
        mimeType: rv.mimeType,
        preferSigned: true,
        signedTtlSeconds: 60 * 30,
      });
      if (cancelled) return;
      if (res?.url) {
        setVideoSrc(res.url);
        revokes.push(() => res.revoke?.());
      } else {
        setErr('Could not load video.');
      }

      if (rv.posterBlobRef) {
        const p = await getBlobUrl(rv.posterBlobRef, { mimeType: 'image/jpeg', preferSigned: true });
        if (!cancelled && p?.url) {
          setPosterSrc(p.url);
          revokes.push(() => p.revoke?.());
        }
      }
      if (!cancelled) setLoading(false);
    }

    void resolve();
    const onStore = () => void resolve();
    window.addEventListener('finely:store', onStore);
    return () => {
      cancelled = true;
      window.removeEventListener('finely:store', onStore);
      revokes.forEach((fn) => {
        try {
          fn();
        } catch {
          // ignore
        }
      });
    };
  }, [assetId, hasVideo, lesson.id]);

  if (!hasVideo) return null;

  const caption =
    (lesson.content ?? []).find((b) => b.type === 'video_asset')?.data?.caption ?? title ?? lesson.title;

  return (
    <div className={`${finelyOsGlassShell('inner', 'fuchsia')} overflow-hidden !p-0`}>
      <div className="relative aspect-video w-full bg-black/50">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-white/60">
            <Loader2 size={20} className="animate-spin" /> Loading video…
          </div>
        ) : err ? (
          <div className={`absolute inset-0 flex items-center justify-center p-4 text-sm ${FINELY_OS_ENTITY_BODY}`}>{err}</div>
        ) : videoSrc ? (
          <>
            <video
              ref={videoRef}
              className="h-full w-full object-contain bg-black"
              src={videoSrc}
              poster={posterSrc ?? undefined}
              controls
              playsInline
              muted={muted}
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-white/20 bg-black/60 p-2 text-white/80 hover:bg-black/80"
                onClick={() => {
                  const v = videoRef.current;
                  if (v?.paused) void v.play();
                  else v?.pause();
                }}
                aria-label="Play or pause"
              >
                <Play size={16} />
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/20 bg-black/60 p-2 text-white/80 hover:bg-black/80"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>
          </>
        ) : null}
      </div>
      {caption ? (
        <div className={`border-t border-white/[0.06] px-4 py-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>{String(caption)}</div>
      ) : null}
    </div>
  );
}
