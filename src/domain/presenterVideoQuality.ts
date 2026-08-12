import type { MediaTransitionType } from './mediaStudio';
import type { VideoCommandRequest } from '../features/studioCommandOs/types';

/** Canonical quality bar for presenter-style walkthrough clips. */
export type PresenterVideoQualityProfile = {
  id: 'finely-launch-presenter';
  source: 'manifest' | 'admin_export';
  label: string;
  durationSec: number;
  aspect: VideoCommandRequest['aspect'];
  visualStyle: VideoCommandRequest['visualStyle'];
  voiceStyle: VideoCommandRequest['voiceStyle'];
  includeCaptions: boolean;
  cinematicApi: boolean;
  sceneCount: number;
  fps: number;
  transitionTypes: MediaTransitionType[];
  /** Admin-approved export stored in blob vault — overrides manifest preview in admin UI. */
  blobRef?: string;
  assetId?: string;
  title?: string;
  exportedAt?: string;
  manifestUrl: string;
  videoUrl: string;
};

export const PRESENTER_DEMO_MANIFEST_URL = '/demos/finely-launch-demo.json';
export const PRESENTER_DEMO_VIDEO_URL = '/demos/finely-launch-demo.webm';

export type LaunchDemoManifest = {
  label?: string;
  durationSec?: number;
  cinematicApi?: boolean;
  title?: string;
  scenes?: Array<{ id?: string; beat?: string; caption?: string; durationSec?: number; motion?: string }>;
  generatedAt?: string;
};

/** Default profile derived from scripts/generate-launch-demo-video.mjs + manifest. */
export const DEFAULT_PRESENTER_QUALITY: PresenterVideoQualityProfile = {
  id: 'finely-launch-presenter',
  source: 'manifest',
  label: 'Presenter demo quality bar',
  durationSec: 28,
  aspect: '16:9',
  visualStyle: 'documentary',
  voiceStyle: 'warm_authority',
  includeCaptions: true,
  cinematicApi: false,
  sceneCount: 3,
  fps: 30,
  transitionTypes: ['ken_burns', 'fade', 'cut'],
  manifestUrl: PRESENTER_DEMO_MANIFEST_URL,
  videoUrl: PRESENTER_DEMO_VIDEO_URL,
};

export function profileFromLaunchManifest(manifest: LaunchDemoManifest | null): PresenterVideoQualityProfile {
  if (!manifest) return { ...DEFAULT_PRESENTER_QUALITY };
  const sceneCount = manifest.scenes?.length ?? DEFAULT_PRESENTER_QUALITY.sceneCount;
  return {
    ...DEFAULT_PRESENTER_QUALITY,
    source: 'manifest',
    label: manifest.label ?? DEFAULT_PRESENTER_QUALITY.label,
    durationSec: manifest.durationSec ?? DEFAULT_PRESENTER_QUALITY.durationSec,
    cinematicApi: Boolean(manifest.cinematicApi),
    sceneCount,
    title: manifest.title,
  };
}

/** Request patch to match presenter reference quality in Content Studio wizard. */
export function buildMatchPresenterRequest(profile: PresenterVideoQualityProfile): Partial<VideoCommandRequest> {
  return {
    prompt:
      'Plan a ~28s presenter-style walkthrough like our admin Resources reference demo: hook, three clear beats (restore, disputes, next step), warm voice, premium but not hypey.',
    durationSec: profile.durationSec,
    aspect: profile.aspect,
    visualStyle: profile.visualStyle,
    voiceStyle: profile.voiceStyle,
    includeCaptions: profile.includeCaptions,
    complianceStrict: true,
    intent: 'lead_magnet_ad',
    audience: 'credit-focused partners',
    offer: 'Finely Cred guide',
  };
}

export function presenterQualitySummary(profile: PresenterVideoQualityProfile): string {
  const voice = profile.cinematicApi ? 'Content Studio voice' : profile.voiceStyle.replace(/_/g, ' ');
  const transitions = profile.transitionTypes.slice(0, 3).join(' · ');
  return `${profile.durationSec}s · ${profile.sceneCount} scenes · ${profile.visualStyle} · ${voice} · ${transitions}`;
}
