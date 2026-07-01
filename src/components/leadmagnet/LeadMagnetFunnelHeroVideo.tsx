import React, { useEffect, useRef, useState } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';
import type { LeadMagnetFunnelConfig } from '../../domain/leadMagnetFunnels';
import { getFunnelMediaForConfig } from '../../data/leadMagnetFunnelMediaRepo';
import { getResourceVideo } from '../../data/resourceVideosRepo';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { FREE_DISPUTE_GUIDE_HERO_VIDEO_SRC } from './FreeDisputeGuideHeroVideo';
import type { LeadMagnetVisualTheme } from './leadMagnetVisualThemes';

type Props = {
  config: LeadMagnetFunnelConfig;
  theme: LeadMagnetVisualTheme;
  posterUrl?: string | null;
  className?: string;
  onGoForm?: () => void;
};

export function LeadMagnetFunnelHeroVideo({ config, theme, posterUrl, className = '', onGoForm }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [posterSrc, setPosterSrc] = useState<string | null>(posterUrl ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const revokes: Array<() => void> = [];

    async function resolve() {
      setLoading(true);
      const media = getFunnelMediaForConfig(config);
      let src: string | null = null;
      let poster: string | null = posterUrl ?? null;

      if (media?.heroVideoBlobRef) {
        const res = await getBlobUrl(media.heroVideoBlobRef, {
          mimeType: media.heroVideoMimeType ?? 'video/mp4',
          preferSigned: true,
          signedTtlSeconds: 60 * 30,
        });
        if (res?.url) {
          src = res.url;
          revokes.push(() => res.revoke?.());
        }
        if (media.heroVideoPosterBlobRef) {
          const p = await getBlobUrl(media.heroVideoPosterBlobRef, { mimeType: 'image/jpeg', preferSigned: true });
          if (p?.url) {
            poster = p.url;
            revokes.push(() => p.revoke?.());
          }
        }
      } else if (media?.resourceVideoId) {
        const rv = getResourceVideo(media.resourceVideoId);
        if (rv) {
          const res = await getBlobUrl(rv.blobRef, { mimeType: rv.mimeType, preferSigned: true, signedTtlSeconds: 60 * 30 });
          if (res?.url) {
            src = res.url;
            revokes.push(() => res.revoke?.());
          }
          if (rv.posterBlobRef) {
            const p = await getBlobUrl(rv.posterBlobRef, { mimeType: 'image/jpeg', preferSigned: true });
            if (p?.url) {
              poster = p.url;
              revokes.push(() => p.revoke?.());
            }
          }
        }
      } else if (media?.staticVideoSrc) {
        src = media.staticVideoSrc;
      } else if (config.id === 'credit') {
        src = FREE_DISPUTE_GUIDE_HERO_VIDEO_SRC;
      }

      if (!cancelled) {
        setVideoSrc(src);
        setPosterSrc(poster ?? posterUrl ?? theme.videoPosterImage);
        setLoading(false);
      }
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
  }, [config.funnelId, config.id, posterUrl, theme.videoPosterImage]);

  const toggleSound = () => {
    const el = videoRef.current;
    if (!el) return;
    const next = !muted;
    el.muted = next;
    setMuted(next);
    if (!next) void el.play().catch(() => undefined);
  };

  const label = getFunnelMediaForConfig(config)?.videoTitle ?? `Watch the ${theme.badge.toLowerCase()}`;

  if (!videoSrc && !loading) {
    return (
      <button
        type="button"
        onClick={onGoForm}
        className={`lm-video-shell lm-video-placeholder group ${className}`}
        style={{ backgroundImage: `url(${posterSrc ?? theme.videoPosterImage})` }}
      >
        <div className="lm-video-placeholder-veil" />
        <div className="relative z-10 flex flex-col items-center gap-3 p-6">
          <span className="lm-video-play-ring">
            <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
          </span>
          <span className="text-sm font-bold text-white">{label}</span>
          <span className="text-[10px] uppercase tracking-widest text-white/50">Tap to unlock the kit</span>
        </div>
      </button>
    );
  }

  return (
    <div className={`lm-video-shell relative overflow-hidden group ${className}`}>
      <div className="absolute inset-0 opacity-30 pointer-events-none z-[1] lm-video-glow" aria-hidden />
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-[2]">
          <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      ) : null}
      {videoSrc ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={videoSrc}
          poster={posterSrc ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label={label}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/30 pointer-events-none z-[1]" />
      <div className="absolute top-3 left-3 z-[2] px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-wider bg-black/50 backdrop-blur-md lm-video-badge">
        {label}
      </div>
      {videoSrc ? (
        <button
          type="button"
          onClick={toggleSound}
          className="absolute bottom-3 right-3 z-[2] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/65 border border-white/15 text-[10px] font-semibold text-white/90 hover:border-white/30 transition backdrop-blur-sm"
          aria-label={muted ? 'Unmute video' : 'Mute video'}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          {muted ? 'Sound' : 'On'}
        </button>
      ) : null}
    </div>
  );
}
