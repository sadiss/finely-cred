import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Play, Sparkles, Volume2, VolumeX } from 'lucide-react';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';
import { ContentStudioVideoPreview } from '../../features/studioCommandOs/ContentStudioVideoPreview';
import {
  contentStudioMatchPresenterUrl,
  loadPresenterQualityProfile,
  presenterQualitySummary,
} from '../../lib/presenterVideoQualityBridge';
import { isUsingAdminReference } from '../../data/presenterVideoQualityRepo';
import type { PresenterVideoQualityProfile } from '../../domain/presenterVideoQuality';

const DEMO_SRC = '/demos/finely-launch-demo.webm';
const DEMO_POSTER = '/tours/tour-home-overview/step-01.png';

export function LaunchPresenterDemoSection({
  className = '',
  showAdminTools = true,
}: {
  className?: string;
  /** Hide Content Studio quality-bar CTAs for public guests. */
  showAdminTools?: boolean;
}) {
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [profile, setProfile] = useState<PresenterVideoQualityProfile | null>(null);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadPresenterQualityProfile().then((p) => {
      if (!cancelled) setProfile(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const badge = useMemo(() => {
    if (profile && isUsingAdminReference(profile)) return 'Admin quality reference';
    if (profile?.cinematicApi) return 'Content Studio voice';
    if (profile?.label) return profile.label;
    return 'Presenter demo';
  }, [profile]);

  const durationLabel = profile?.durationSec ? `${profile.durationSec}s` : '~34s';
  const qualitySummary = profile ? presenterQualitySummary(profile) : null;
  const adminRefActive = profile ? isUsingAdminReference(profile) : false;

  return (
    <section id="presenter-demo" className={`fc-scroll-section space-y-3 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="fc-launch-lane-header">Presenter demo</h2>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            34s cinematic reel — live portal tools, fight-back debt lane, dispute vault, and book-a-session CTA. Ken Burns motion + voice.
          </p>
        </div>
        <span className={`${FINELY_OS_ENTITY_SUBLABEL} inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1`}>
          <Film size={12} /> {badge}
        </span>
      </div>

      {qualitySummary && showAdminTools ? (
        <div className={`${finelyOsCatalogCard('emerald')} !p-3 flex flex-wrap items-center justify-between gap-3`} data-fc-accent="emerald">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest text-emerald-200`}>Quality bar</p>
            <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_VALUE}`}>{qualitySummary}</p>
            {adminRefActive ? (
              <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Admin export is the live reference — public embed still uses committed WebM until you replace{' '}
                <code className="text-white/70">public/demos/finely-launch-demo.webm</code>.
              </p>
            ) : (
              <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Match this bar in Content Studio — Ken Burns, warm voice, compliance-safe captions.
              </p>
            )}
          </div>
          <button
            type="button"
            className={FINELY_OS_PRIMARY_BTN}
            onClick={() => navigate(contentStudioMatchPresenterUrl())}
          >
            <Sparkles size={14} /> Match presenter quality
          </button>
        </div>
      ) : null}

      <div className={`${finelyOsCatalogCard('sky')} !p-3`} data-fc-accent="sky">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
          {adminRefActive && profile?.blobRef ? (
            <ContentStudioVideoPreview blobRef={profile.blobRef} className="!rounded-2xl !border-0" />
          ) : (
            <video
              src={DEMO_SRC}
              poster={DEMO_POSTER}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full bg-black"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
              onError={() => setVideoError(true)}
            />
          )}
          {videoError && !adminRefActive ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-4 text-center">
              <p className={`text-sm ${FINELY_OS_ENTITY_VALUE}`}>Video not generated yet</p>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Install ffmpeg, then run <code className="text-white/70">npm run demo:launch:video</code>
              </p>
            </div>
          ) : null}
          {!playing && !adminRefActive ? (
            <div className="pointer-events-none absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/55 via-transparent to-transparent p-3">
              <span className={`inline-flex items-center gap-1.5 text-xs text-white/75 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <Play size={12} /> Tap play for motion + voice
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a href={DEMO_SRC} download className={FINELY_OS_SECONDARY_BTN}>
            Download WebM
          </a>
          {showAdminTools ? (
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(contentStudioMatchPresenterUrl())}>
              <Sparkles size={14} /> Match in Content Studio
            </button>
          ) : null}
          <span className={`inline-flex items-center gap-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            {muted ? 'Muted — unmute in player for narration' : 'Narration on'}
          </span>
        </div>

        <p className={`mt-3 text-sm ${FINELY_OS_ENTITY_VALUE}`}>
          {showAdminTools
            ? 'Generated locally via npm run demo:launch:video — export from Content Studio to update the admin reference loop.'
            : '34-second overview — live portal tools, dispute vault, fight-back debt lane, and how to start with Finely Cred.'}
        </p>
        <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-2`}>
          Results vary · not legal advice · presenter demo for partner education.
        </p>
      </div>
    </section>
  );
}
