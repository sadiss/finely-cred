import type { MediaProject } from '../domain/mediaStudio';
import {
  buildMatchPresenterRequest,
  DEFAULT_PRESENTER_QUALITY,
  type LaunchDemoManifest,
  PRESENTER_DEMO_MANIFEST_URL,
  profileFromLaunchManifest,
  type PresenterVideoQualityProfile,
  presenterQualitySummary,
} from '../domain/presenterVideoQuality';
import {
  getAdminPresenterQualityOverride,
  resolvePresenterQualityProfile,
  saveAdminPresenterQualityOverride,
} from '../data/presenterVideoQualityRepo';
import { assignTransitionForScene } from '../domain/videoStylePresets';
import { renderVoice } from './mediaProviderRouter';
import { addAudioTrack, getMediaProject, patchScene, upsertMediaProject } from '../data/mediaStudioRepo';
import { scriptFromVideoPlan } from '../features/studioCommandOs/contentStudioVoice';
import { updateContentStudioAsset } from '../features/studioCommandOs/contentStudioRepo';
import type { VideoCommandPlan, VideoCommandRequest } from '../features/studioCommandOs/types';

export { buildMatchPresenterRequest, presenterQualitySummary };

export async function fetchLaunchDemoManifest(): Promise<LaunchDemoManifest | null> {
  try {
    const res = await fetch(PRESENTER_DEMO_MANIFEST_URL);
    if (!res.ok) return null;
    return (await res.json()) as LaunchDemoManifest;
  } catch {
    return null;
  }
}

export async function loadPresenterQualityProfile(): Promise<PresenterVideoQualityProfile> {
  const manifest = await fetchLaunchDemoManifest();
  const fromManifest = profileFromLaunchManifest(manifest);
  return resolvePresenterQualityProfile(fromManifest);
}

export function exportToPresenterReference(args: {
  blobRef: string;
  assetId?: string;
  title: string;
  plan?: VideoCommandPlan | null;
  project?: MediaProject | null;
}): PresenterVideoQualityProfile {
  const base = getAdminPresenterQualityOverride() ?? DEFAULT_PRESENTER_QUALITY;
  const req = args.plan?.request;
  const profile: PresenterVideoQualityProfile = {
    ...base,
    source: 'admin_export',
    blobRef: args.blobRef,
    assetId: args.assetId,
    title: args.title,
    label: `Admin reference · ${args.title.slice(0, 48)}`,
    durationSec: args.plan?.totalDurationSec ?? req?.durationSec ?? base.durationSec,
    aspect: req?.aspect ?? args.project?.aspect ?? base.aspect,
    visualStyle: req?.visualStyle ?? (args.project?.stylePreset as PresenterVideoQualityProfile['visualStyle']) ?? base.visualStyle,
    voiceStyle: req?.voiceStyle ?? base.voiceStyle,
    includeCaptions: req?.includeCaptions ?? base.includeCaptions,
    cinematicApi: true,
    sceneCount: args.plan?.scenes.length ?? args.project?.scenes.length ?? base.sceneCount,
    fps: base.fps,
    transitionTypes: base.transitionTypes,
    exportedAt: new Date().toISOString(),
    manifestUrl: base.manifestUrl,
    videoUrl: base.videoUrl,
  };
  const saved = saveAdminPresenterQualityOverride(profile);
  if (args.assetId) {
    updateContentStudioAsset(args.assetId, {
      summary: `Presenter quality reference — ${presenterQualitySummary(saved)}`,
      publishTargets: ['resources', 'download_only'],
      complianceNotes: ['Marked as presenter quality bar for Content Studio matching.'],
    });
  }
  return saved;
}

export type AutoProductionResult = {
  plan: VideoCommandPlan;
  voiceAdded: boolean;
  captionsFilled: number;
  transitionsAssigned: number;
  notice: string;
};

/** Auto VO, captions, and transitions before export — Phase 4 production hooks. */
export async function runAutoProductionPipeline(args: {
  plan: VideoCommandPlan;
  projectId: string;
  onProgress?: (msg: string) => void;
}): Promise<AutoProductionResult> {
  const { plan, projectId, onProgress } = args;
  let voiceAdded = false;
  let captionsFilled = 0;
  let transitionsAssigned = 0;

  const presetId = plan.request.visualStyle;
  const scenes = plan.scenes.map((s, idx) => {
    let next = { ...s };
    if (!next.transition) {
      next = { ...next, transition: assignTransitionForScene(presetId, idx, plan.scenes.length) };
      transitionsAssigned += 1;
    }
    if (plan.request.includeCaptions && !next.caption?.trim()) {
      const fallback =
        idx === 0
          ? plan.hook
          : idx === plan.scenes.length - 1
            ? plan.cta
            : next.beat.replace(/^Show /, '').replace(/^Add /, '');
      next = { ...next, caption: fallback.slice(0, 120) };
      captionsFilled += 1;
    }
    return next;
  });

  const nextPlan: VideoCommandPlan = {
    ...plan,
    scenes,
    totalDurationSec: scenes.reduce((a, b) => a + b.durationSec, 0),
  };

  const project = getMediaProject(projectId);
  if (project) {
    const syncedScenes = project.scenes.map((ps, idx) => {
      const planScene = scenes[idx];
      if (!planScene) return ps;
      return {
        ...ps,
        caption: planScene.caption,
        durationSec: planScene.durationSec,
        transition: planScene.transition ?? ps.transition,
      };
    });
    upsertMediaProject({ ...project, scenes: syncedScenes, captionStyle: project.captionStyle });

    for (let i = 0; i < syncedScenes.length; i += 1) {
      const ps = syncedScenes[i]!;
      const planScene = scenes[i];
      if (!planScene) continue;
      patchScene(projectId, ps.id, {
        caption: planScene.caption,
        durationSec: planScene.durationSec,
        transition: planScene.transition,
      });
    }
  }

  const hasVoice = Boolean(project?.audioTracks?.some((t) => t.kind === 'voiceover'));
  if (!hasVoice && plan.request.voiceStyle !== 'none') {
    onProgress?.('Auto-rendering voiceover…');
    try {
      const script = scriptFromVideoPlan(nextPlan);
      const voiced = await renderVoice({
        contentId: nextPlan.id,
        title: nextPlan.title,
        script,
        voiceDirection: 'Premium Finely Cred narration — warm authority, compliance-safe, presenter-demo pacing.',
      });
      addAudioTrack(projectId, {
        kind: 'voiceover',
        title: `${nextPlan.title} narration`,
        blobRef: voiced.blobRef,
        volume: 0.9,
      });
      voiceAdded = true;
    } catch {
      /* voice optional when Voice Studio offline */
    }
  }

  const parts: string[] = [];
  if (voiceAdded) parts.push('voice rendered');
  if (captionsFilled) parts.push(`${captionsFilled} caption(s) filled`);
  if (transitionsAssigned) parts.push(`${transitionsAssigned} transition(s) assigned`);
  const notice = parts.length ? `Auto production: ${parts.join(', ')}.` : 'Auto production ready — export when satisfied.';

  return { plan: nextPlan, voiceAdded, captionsFilled, transitionsAssigned, notice };
}

export function contentStudioMatchPresenterUrl(): string {
  return '/admin/content-studio?wizard=open&preset=reel_28&match=presenter';
}

export function parseMatchPresenterFromSearch(params: URLSearchParams): Partial<VideoCommandRequest> | undefined {
  if (params.get('match') !== 'presenter') return undefined;
  const override = getAdminPresenterQualityOverride();
  const profile = override ?? DEFAULT_PRESENTER_QUALITY;
  return buildMatchPresenterRequest(profile);
}
