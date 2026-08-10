/** Homepage — full credit solutions overview video (not a site-demo walkthrough). */
import React, { useEffect, useRef, useState } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';
import { Reveal } from '../ui';
import { finelyOsLandingContrastSection } from '../../features/os/finelyOsLightUi';
import { LandingTypewriterTitle } from './LandingTypewriterTitle';
import '../leadmagnet/premiumLeadMagnetShared.css';
import './landingSellBands.css';

const HOME_VIDEO_SRC = '/tours/cloud-home-overview.mp4';

const HOME_VIDEO_STATS = [
  { value: '700+', label: 'Funding-ready path' },
  { value: '3', label: 'Bureau coverage' },
  { value: '24/7', label: 'Partner OS access' },
] as const;

const HOME_VIDEO_LANES = ['Restore', 'Disputes', 'Debt', 'Funding', 'Letters'] as const;

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
            <div className="fc-home-video-green-stage lm-video-shell lm-video-shell--framed lm-video-grade--gold relative overflow-hidden rounded-[1.55rem] sm:rounded-[1.75rem] border border-emerald-400/25 aspect-video">
              {/* Wealthy green stage — no raster poster / no FC shield artwork */}
              <div
                className={`absolute inset-0 z-[0] transition-opacity duration-500 ${
                  playing ? 'opacity-0' : 'opacity-100'
                }`}
                aria-hidden={playing}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a2e1c] via-[#0c3d28] to-[#061a12]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_35%,rgba(56,189,120,0.22),transparent_55%),radial-gradient(ellipse_60%_50%_at_85%_80%,rgba(224,178,74,0.14),transparent_50%)]" />
                <div className="absolute inset-0 opacity-[0.07] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9Ii4xNSIvPjwvc3ZnPg==')]" />

                <div className="relative z-[1] flex h-full flex-col justify-between p-5 sm:p-8 pointer-events-none">
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                    {HOME_VIDEO_LANES.map((lane) => (
                      <span
                        key={lane}
                        className="rounded-md border border-emerald-300/25 bg-black/20 px-2.5 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100/90 backdrop-blur-sm"
                      >
                        {lane}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-lg mx-auto w-full">
                    {HOME_VIDEO_STATS.map((stat) => (
                      <div key={stat.label} className="text-center">
                        <div className="fc-sell-serif text-xl sm:text-2xl md:text-3xl font-bold tabular-nums text-[#ffd993] drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
                          {stat.value}
                        </div>
                        <div className="mt-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.14em] text-white/55">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="h-8 sm:h-10" />
                </div>
              </div>

              <video
                ref={videoRef}
                className={`absolute inset-0 z-[1] h-full w-full object-cover transition-opacity duration-500 ${
                  playing ? 'opacity-100' : 'opacity-0'
                }`}
                src={HOME_VIDEO_SRC}
                muted={muted}
                playsInline
                preload="metadata"
                loop
                aria-label="Finely Cred full credit solutions overview"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />

              {!playing ? (
                <button
                  type="button"
                  onClick={startPlayback}
                  className="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-3 group"
                  aria-label="Play Finely Cred credit solutions overview"
                >
                  <span className="relative inline-flex h-[4.5rem] w-[4.5rem] sm:h-[5.25rem] sm:w-[5.25rem] items-center justify-center rounded-full border-2 border-[#ffd993]/60 bg-gradient-to-br from-[#1aad4b]/90 via-[#0d8a3a] to-[#065a28] text-[#04140a] shadow-[0_0_0_12px_rgba(26,173,75,0.25),0_0_48px_rgba(56,189,120,0.45),0_24px_64px_rgba(0,0,0,0.5)] ring-1 ring-white/30 transition-transform duration-300 group-hover:scale-105">
                    <Play className="ml-1 h-9 w-9 sm:h-10 sm:w-10 fill-current text-[#fffef8]" strokeWidth={0} />
                  </span>
                  <span className="rounded-full bg-black/45 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/95 border border-emerald-400/30 backdrop-blur-md">
                    Watch overview
                  </span>
                </button>
              ) : null}

              {playing ? (
                <button
                  type="button"
                  onClick={toggleSound}
                  className="absolute bottom-3 right-3 z-[4] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/65 border border-white/15 text-[10px] font-semibold text-white/90 hover:border-white/30 transition backdrop-blur-sm"
                  aria-label={muted ? 'Unmute video' : 'Mute video'}
                >
                  {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  {muted ? 'Sound' : 'On'}
                </button>
              ) : null}

              <div className="absolute top-3 right-3 z-[2] px-3 py-1.5 rounded-full border border-[#e0b24a]/35 text-[9px] font-bold uppercase tracking-wider bg-black/40 backdrop-blur-md text-[#ffd993] pointer-events-none">
                Full credit solutions
              </div>
            </div>
          </div>
        </Reveal>
        <p className="fc-sell-compliance text-center mt-5">Results vary · not legal advice · funding subject to underwriting</p>
      </div>
    </section>
  );
}
