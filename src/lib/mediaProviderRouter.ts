import { aspectToSize, MEDIA_RENDER_PRESETS, type Aspect, type MediaProject } from '../domain/mediaStudio';
import { generateImages } from './imageGenClient';
import { exportScenesToWebm, type VideoScene } from './mediaExport';
import { getBlobStore } from '../storage/getBlobStore';
import { renderContentStudioNarration } from '../features/studioCommandOs/contentStudioVoice';
import type { VideoCommandPlan } from '../features/studioCommandOs/types';

export type MediaRenderProvider = 'openai_images' | 'elevenlabs' | 'cartesia' | 'browser_webm';

export type RenderSceneArgs = {
  projectId: string;
  sceneId: string;
  prompt: string;
  aspect: Aspect;
  onProgress?: (message: string) => void;
};

export type RenderSceneResult = {
  provider: MediaRenderProvider;
  imageDataUrl: string;
  mimeType: string;
};

export type RenderVoiceArgs = {
  contentId: string;
  title: string;
  script: string;
  voiceDirection?: string;
  voicePersonaId?: string;
  jobId?: string;
};

export type RenderVoiceResult = {
  provider: MediaRenderProvider;
  blobRef: string;
  assetId: string;
};

export type StitchProjectArgs = {
  project: MediaProject;
  plan?: VideoCommandPlan | null;
};

export type StitchProjectResult = {
  provider: MediaRenderProvider;
  blob: Blob;
  filename: string;
  presetId: string;
};

const SCENE_STYLE_SUFFIX = '\nPremium Finely Cred cinematic style. No logos or text overlays.';

/** Scene still — OpenAI images via gateway (Cartesia/secondary model fallback TBD). */
export async function renderScene(args: RenderSceneArgs): Promise<RenderSceneResult> {
  const size = aspectToSize(args.aspect);
  args.onProgress?.('Generating scene visual…');

  const gen = await generateImages({
    prompt: `${args.prompt}${SCENE_STYLE_SUFFIX}`,
    size: size.imageSize,
    quality: 'high',
    style: 'vivid',
    n: 1,
    idempotencyKey: `router:${args.projectId}:${args.sceneId}`,
  });

  const img = gen.images[0];
  if (!img?.dataUrl) throw new Error('Scene image generation returned no image.');

  return {
    provider: gen.provider === 'cartesia' ? 'cartesia' : 'openai_images',
    imageDataUrl: img.dataUrl,
    mimeType: img.mimeType,
  };
}

/** Narration — Voice Studio (ElevenLabs primary; Cartesia when edge routes there). */
export async function renderVoice(args: RenderVoiceArgs): Promise<RenderVoiceResult> {
  const rendered = await renderContentStudioNarration({
    jobId: args.jobId,
    contentId: args.contentId,
    title: args.title,
    script: args.script,
    voiceDirection:
      args.voiceDirection ??
      (args.voicePersonaId
        ? `Voice persona ${args.voicePersonaId} — premium Finely Cred narration, compliance-safe.`
        : 'Premium Finely Cred narration — warm authority, compliance-safe.'),
  });

  return {
    provider: 'elevenlabs',
    blobRef: rendered.blobRef,
    assetId: rendered.assetId,
  };
}

/** Stitch stills + VO into WebM (browser canvas path; server ffmpeg MP4 in Advanced). */
export async function stitchProject(args: StitchProjectArgs): Promise<StitchProjectResult> {
  const { project, plan } = args;
  const preset =
    MEDIA_RENDER_PRESETS.find((p) => p.id === project.renderPresetId) ??
    MEDIA_RENDER_PRESETS.find((p) =>
      project.aspect === '9:16' ? p.id.includes('1080x1920') : p.id.includes('1080p'),
    ) ??
    MEDIA_RENDER_PRESETS[0];

  const scenes: VideoScene[] = project.scenes
    .filter((s) => s.imageDataUrl)
    .map((s) => ({
      id: s.id,
      imageDataUrl: s.imageDataUrl!,
      caption: s.caption,
      durationSec: s.durationSec,
      transition: s.transition,
    }));

  if (!scenes.length) throw new Error('No scenes with visuals to stitch.');

  const store = getBlobStore();
  const audioBlobs: Array<{ blob: Blob; volume?: number }> = [];
  for (const t of (project.audioTracks ?? []).slice(0, 4)) {
    // eslint-disable-next-line no-await-in-loop
    const audio = await store.get(t.blobRef);
    if (audio) audioBlobs.push({ blob: audio, volume: t.volume });
  }

  const blob = await exportScenesToWebm({
    scenes,
    width: preset.width,
    height: preset.height,
    fps: preset.fps,
    captionStyle: project.captionStyle,
    audioTracks: audioBlobs.length ? audioBlobs : undefined,
  });

  const title = plan?.title ?? project.title;
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60) || 'finely-video'}.webm`;

  return {
    provider: 'browser_webm',
    blob,
    filename,
    presetId: preset.id,
  };
}
