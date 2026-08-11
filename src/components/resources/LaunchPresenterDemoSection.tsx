import React, { useMemo, useState } from 'react';
import { Film, Play, Volume2, VolumeX } from 'lucide-react';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

const DEMO_SRC = '/demos/finely-launch-demo.webm';
const DEMO_POSTER = '/tours/tour-home-overview/step-01.png';

type LaunchDemoManifest = {
  label?: string;
  durationSec?: number;
  cinematicApi?: boolean;
};

export function LaunchPresenterDemoSection({ className = '' }: { className?: string }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [manifest, setManifest] = useState<LaunchDemoManifest | null>(null);
  const [videoError, setVideoError] = useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void fetch('/demos/finely-launch-demo.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setManifest(data as LaunchDemoManifest);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const badge = useMemo(() => {
    if (manifest?.cinematicApi) return 'Content Studio voice';
    if (manifest?.label) return manifest.label;
    return 'Presenter demo';
  }, [manifest]);

  const durationLabel = manifest?.durationSec ? `${manifest.durationSec}s` : '~28s';

  return (
    <section id="presenter-demo" className={`fc-scroll-section space-y-3 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="fc-launch-lane-header">Presenter demo</h2>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Ken Burns motion + voice walkthrough — {durationLabel} overview of restore, disputes, and next steps.
          </p>
        </div>
        <span className={`${FINELY_OS_ENTITY_SUBLABEL} inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1`}>
          <Film size={12} /> {badge}
        </span>
      </div>

      <div className={`${finelyOsCatalogCard('sky')} !p-3`} data-fc-accent="sky">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
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
          {videoError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-4 text-center">
              <p className={`text-sm ${FINELY_OS_ENTITY_VALUE}`}>Video not generated yet</p>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Install ffmpeg, then run <code className="text-white/70">npm run demo:launch:video</code>
              </p>
            </div>
          ) : null}
          {!playing ? (
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
          <span className={`inline-flex items-center gap-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            {muted ? 'Muted — unmute in player for narration' : 'Narration on'}
          </span>
        </div>

        <p className={`mt-3 text-sm ${FINELY_OS_ENTITY_VALUE}`}>
          Generated locally via <code className="text-white/70">npm run demo:launch:video</code> — not a static screenshot reel.
        </p>
        <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-2`}>
          Results vary · not legal advice · presenter demo for partner education.
        </p>
      </div>
    </section>
  );
}
