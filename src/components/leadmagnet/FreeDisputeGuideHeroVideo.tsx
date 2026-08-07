import React, { useEffect, useRef, useState } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';

export const FREE_DISPUTE_GUIDE_HERO_VIDEO_SRC = '/media/free-dispute-guide-main.mp4';
/** Cache-bust when poster art changes — partners must see the solutions thumbnail, not a stale demo frame. */
export const FREE_DISPUTE_GUIDE_HERO_POSTER = '/media/free-dispute-guide-poster.png?v=solutions-20260807';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

/**
 * Finely Cred credit solutions overview — autoplay ON (muted, loop, inline) on the dispute letter guide funnel.
 * Poster fades once playback starts; partners can unmute for sound. Reduced motion → click-to-play.
 */
export function FreeDisputeGuideHeroVideo({
  className = '',
  showBadge = true,
}: {
  className?: string;
  showBadge?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [clickToPlay] = useState(() => prefersReducedMotion());
  const [autoplayFailed, setAutoplayFailed] = useState(false);

  const shouldAutoplay = !clickToPlay && !autoplayFailed;

  useEffect(() => {
    if (clickToPlay) return;
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    void el
      .play()
      .then(() => setPlaying(true))
      .catch(() => setAutoplayFailed(true));
  }, [clickToPlay]);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = videoRef.current;
    if (!el) return;
    const next = !muted;
    el.muted = next;
    setMuted(next);
    if (!next) void el.play().catch(() => undefined);
  };

  const startPlayback = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = muted;
    void el.play().then(() => setPlaying(true)).catch(() => undefined);
  };

  const showPlayOverlay = !playing;

  return (
    <div className={`relative w-full aspect-video rounded-2xl fg-video-tile overflow-hidden group ${className}`}>
      <img
        src={FREE_DISPUTE_GUIDE_HERO_POSTER}
        alt="Finely Cred full credit solutions — restore, disputes, funding readiness"
        className={`absolute inset-0 z-[1] h-full w-full object-cover transition-opacity duration-500 ${
          playing ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      />

      <video
        ref={videoRef}
        className={`absolute inset-0 z-[0] h-full w-full object-cover transition-opacity duration-500 ${
          playing ? 'opacity-100' : 'opacity-0'
        }`}
        src={FREE_DISPUTE_GUIDE_HERO_VIDEO_SRC}
        poster={FREE_DISPUTE_GUIDE_HERO_POSTER}
        autoPlay={shouldAutoplay}
        muted={muted}
        loop
        playsInline
        preload="auto"
        aria-label="Finely Cred credit solutions overview"
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/65 via-transparent to-black/30 pointer-events-none" />

      {showPlayOverlay ? (
        <button
          type="button"
          onClick={startPlayback}
          className="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-3"
          aria-label="Play Finely Cred credit solutions overview"
        >
          <span className="relative inline-flex h-[4.25rem] w-[4.25rem] sm:h-[5rem] sm:w-[5rem] items-center justify-center rounded-full bg-gradient-to-br from-[#39ff14] via-[#1aad4b] to-[#0f8a3a] text-[#04140a] shadow-[0_0_0_10px_rgba(26,173,75,0.28),0_20px_48px_-8px_rgba(0,0,0,0.6)] ring-1 ring-white/35 transition-transform duration-200 group-hover:scale-105">
            <Play className="ml-1 h-8 w-8 sm:h-9 sm:w-9 fill-current" strokeWidth={0} />
          </span>
          <span className="rounded-full bg-black/60 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/95 border border-[#c9a227]/35 backdrop-blur-sm">
            See what Finely Cred offers
          </span>
        </button>
      ) : null}

      {showBadge ? (
        <div className="absolute top-3 left-3 z-[4] px-2.5 py-1 rounded-lg bg-[#0b1a12]/90 border border-[#c9a227]/40 text-[9px] font-bold text-[#e8c96a] uppercase tracking-wider backdrop-blur-sm">
          Credit solutions overview
        </div>
      ) : null}

      {showPlayOverlay ? (
        <div className="absolute bottom-3 left-3 right-3 z-[4] flex flex-wrap gap-1.5 pointer-events-none">
          {['Restore', 'Disputes', 'Funding path'].map((pill) => (
            <span
              key={pill}
              className="rounded-md bg-black/55 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#4ade80] border border-[#1aad4b]/35 backdrop-blur-sm"
            >
              {pill}
            </span>
          ))}
        </div>
      ) : null}

      {playing ? (
        <button
          type="button"
          onClick={toggleSound}
          className="absolute bottom-3 right-3 z-[4] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/65 border border-white/15 text-[10px] font-semibold text-white/90 hover:border-[#1aad4b]/50 hover:text-[#4ade80] transition backdrop-blur-sm"
          aria-label={muted ? 'Unmute video' : 'Mute video'}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          {muted ? 'Tap for sound' : 'Sound on'}
        </button>
      ) : null}
    </div>
  );
}
