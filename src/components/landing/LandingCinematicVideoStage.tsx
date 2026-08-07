/** Homepage — full credit solutions overview video (not a site-demo walkthrough). */
import React, { useEffect, useRef, useState } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';
import { Reveal } from '../ui';
import { finelyOsLandingContrastSection } from '../../features/os/finelyOsLightUi';
import { LandingTypewriterTitle } from './LandingTypewriterTitle';
import { VideoFinelyCredWordmark } from '../leadmagnet/VideoFinelyCredWordmark';
import '../leadmagnet/premiumLeadMagnetShared.css';
import './landingSellBands.css';

/**
 * Poster sells the company offering. Replace HOME_VIDEO_SRC with a true
 * solutions explainer mp4 when available (restore · disputes · debt · funding).
 */
const HOME_VIDEO_SRC = '/tours/cloud-home-overview.mp4';
/** Green materials composite — keep this art; typography plaque replaces any logo in-frame. */
const HOME_VIDEO_POSTER = '/media/home-credit-solutions-poster.png?v=solutions-home-20260807';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

export function LandingCinematicVideoStage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!prefersReducedMotion()) return;
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    setPlaying(false);
  }, []);

  const startPlayback = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = muted;
    void el.play().then(() => setPlaying(true)).catch(() => undefined);
  };

  const toggleSound = () => {
    const el = videoRef.current;
    if (!el) return;
    const next = !muted;
    el.muted = next;
    setMuted(next);
    if (!next && playing) void el.play().catch(() => undefined);
  };

  return (
    <section
      id="home-cinematic"
      className={`fc-sell py-14 sm:py-16 relative overflow-hidden ${finelyOsLandingContrastSection('fc-band-dark')}`}
      data-fc-contrast-band="1"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(224,178,74,0.16),transparent_60%),radial-gradient(ellipse_50%_40%_at_10%_80%,rgba(16,185,129,0.12),transparent_55%)] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 max-w-5xl relative z-10">
        <div className="text-center mb-8 sm:mb-10 max-w-2xl mx-auto">
          <Reveal>
            <p className="fc-sell-kicker mb-4">What we offer partners</p>
            <LandingTypewriterTitle
              text="Full credit solutions — "
              accentText="not a software tour"
              className="fc-sell-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold leading-[1.1] text-white"
              accentClassName="text-[#ffd993] italic"
              speedMs={42}
            />
            <p className="mt-4 text-sm sm:text-base text-white/55 leading-relaxed">
              Personal restore · dispute letters · debt &amp; summons response · business credit &amp; funding readiness —
              one partner path from messy file to clear next step.
            </p>
          </Reveal>
        </div>

        <Reveal delay={160}>
          <div className="relative mx-auto max-w-4xl">
            <div
              className="absolute -inset-[1px] rounded-[1.65rem] sm:rounded-[1.85rem] pointer-events-none"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,217,147,0.55), rgba(255,255,255,0.12) 28%, rgba(224,178,74,0.35) 55%, rgba(52,211,153,0.25) 78%, rgba(196,128,61,0.45))',
                boxShadow: '0 40px 100px -36px rgba(0,0,0,0.85), 0 0 60px -20px rgba(224,178,74,0.35)',
              }}
              aria-hidden
            />
            <div className="lm-video-shell lm-video-shell--framed lm-video-grade--gold relative overflow-hidden rounded-[1.55rem] sm:rounded-[1.75rem] border border-white/10 bg-black aspect-video">
              <div className="absolute inset-0 opacity-30 pointer-events-none z-[1] lm-video-glow" aria-hidden />

              <img
                src={HOME_VIDEO_POSTER}
                alt=""
                className={`absolute inset-0 z-[1] h-full w-full object-cover transition-opacity duration-500 ${
                  playing ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              />

              <video
                ref={videoRef}
                className={`absolute inset-0 z-[0] h-full w-full object-cover transition-opacity duration-500 ${
                  playing ? 'opacity-100' : 'opacity-0'
                }`}
                src={HOME_VIDEO_SRC}
                poster={HOME_VIDEO_POSTER}
                muted={muted}
                playsInline
                preload="metadata"
                loop
                aria-label="Finely Cred full credit solutions overview"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
              <div className="absolute inset-0 lm-video-veil bg-gradient-to-t from-black/60 via-black/10 to-amber-900/10 pointer-events-none z-[2]" />
              <div className="lm-video-warm-overlay z-[2]" aria-hidden />

              <VideoFinelyCredWordmark
                className="absolute top-3 left-3 z-[4]"
                size={playing ? 'sm' : 'md'}
                plaque
              />

              <div className="absolute top-3 right-3 z-[3] px-3 py-1.5 rounded-full border border-[#e0b24a]/40 text-[9px] font-bold uppercase tracking-wider bg-black/55 backdrop-blur-md text-[#ffd993]">
                Full credit solutions
              </div>

              {!playing ? (
                <button
                  type="button"
                  onClick={startPlayback}
                  className="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-3 group"
                  aria-label="Play Finely Cred credit solutions overview"
                >
                  <span
                    className="lm-video-play-ring flex h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] items-center justify-center rounded-full border border-[#ffd993]/50 bg-black/55 backdrop-blur-md shadow-[0_0_40px_-8px_rgba(224,178,74,0.65)] transition-transform duration-300 group-hover:scale-105"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle at 35% 30%, rgba(255,217,147,0.35), transparent 55%), linear-gradient(160deg, rgba(20,16,8,0.85), rgba(8,10,14,0.9))',
                    }}
                  >
                    <Play className="w-7 h-7 text-[#ffd993] ml-1" fill="currentColor" />
                  </span>
                  <span className="text-sm font-semibold text-white/95 tracking-wide">See what Finely Cred offers</span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#ffd993]/70">
                    Restore · Disputes · Debt · Funding
                  </span>
                </button>
              ) : null}

              {playing ? (
                <button
                  type="button"
                  onClick={toggleSound}
                  className="absolute bottom-3 right-3 z-[3] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/65 border border-white/15 text-[10px] font-semibold text-white/90 hover:border-white/30 transition backdrop-blur-sm"
                  aria-label={muted ? 'Unmute video' : 'Mute video'}
                >
                  {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  {muted ? 'Sound' : 'On'}
                </button>
              ) : null}

              {!playing ? (
                <div className="absolute bottom-3 left-3 z-[3] flex flex-wrap gap-1.5 max-w-[70%] pointer-events-none">
                  {['Personal restore', 'Dispute letters', 'Debt & summons', 'Funding path'].map((pill) => (
                    <span
                      key={pill}
                      className="rounded-md bg-black/55 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300 border border-emerald-400/30 backdrop-blur-sm"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </Reveal>
        <p className="fc-sell-compliance text-center mt-5">Results vary · not legal advice · funding subject to underwriting</p>
      </div>
    </section>
  );
}
