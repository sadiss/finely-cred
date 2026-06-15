import React, { useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export const FREE_DISPUTE_GUIDE_HERO_VIDEO_SRC = '/media/free-dispute-guide-main.mp4';

/** Autoplay hero video for the free dispute letter guide funnel. */
export function FreeDisputeGuideHeroVideo({ className = '' }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  const toggleSound = () => {
    const el = videoRef.current;
    if (!el) return;
    const next = !muted;
    el.muted = next;
    setMuted(next);
    if (!next) void el.play().catch(() => undefined);
  };

  return (
    <div className={`relative aspect-video max-w-lg rounded-2xl fg-video-tile overflow-hidden group ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(57,255,20,0.12),transparent_55%)] pointer-events-none z-[1]" />
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={FREE_DISPUTE_GUIDE_HERO_VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label="Free Credit Dispute Letter Guide overview video"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none z-[1]" />
      <div className="absolute top-3 left-3 z-[2] px-2.5 py-1 rounded-lg bg-slate-900/75 border border-[#39ff14]/35 text-[9px] font-bold text-[#39ff14] uppercase tracking-wider backdrop-blur-sm">
        Watch the guide
      </div>
      <button
        type="button"
        onClick={toggleSound}
        className="absolute bottom-3 right-3 z-[2] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/65 border border-white/15 text-[10px] font-semibold text-white/90 hover:border-[#39ff14]/40 hover:text-[#39ff14] transition backdrop-blur-sm"
        aria-label={muted ? 'Unmute video' : 'Mute video'}
      >
        {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        {muted ? 'Tap for sound' : 'Sound on'}
      </button>
    </div>
  );
}
