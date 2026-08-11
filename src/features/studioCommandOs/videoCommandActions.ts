import { callAiGateway } from '../../lib/aiClient';
import { generateImages } from '../../lib/imageGenClient';
import { downloadBlob, exportScenesToWebm } from '../../lib/mediaExport';
import { aspectToSize, MEDIA_RENDER_PRESETS, type MediaProject } from '../../domain/mediaStudio';
import {
  addAudioTrack,
  addRenderHistory,
  createMediaProject,
  patchScene,
  upsertMediaProject,
} from '../../data/mediaStudioRepo';
import { getBlobStore } from '../../storage/getBlobStore';
import { getResourceVideo, upsertResourceVideo } from '../../data/resourceVideosRepo';
import { saveContentStudioAsset } from './contentStudioRepo';
import { saveVideoCommandPlan } from './studioCommandRepo';
import {
  buildAiStoryboardPrompt,
  buildFallbackVideoPlan,
  convertPlanToMediaProject,
  normalizeVideoRequest,
  summarizePlan,
} from './mediaCommandBrain';
import type { VideoCommandPlan, VideoCommandRequest, VideoScenePlan } from './types';
import { createVideoCommandRecord, upsertVideoCommandRecord } from '../../data/videoCommandRecordRepo';
import { applyDefaultUtmToRecord } from '../../lib/videoCommandService';

function parseJson<T>(text: string): T | null {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const slice = start >= 0 && end >= start ? text.slice(start, end + 1) : text;
    return JSON.parse(slice) as T;
  } catch {
    return null;
  }
}

export function cleanVideoFilename(s: string) {
  return (s || 'finely-video').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'finely-video';
}

export function planFromAiJson(raw: unknown, request: VideoCommandRequest): VideoCommandPlan | null {
  const data = raw as { scenes?: unknown[]; title?: string; hook?: string; cta?: string; platformCutdowns?: unknown[]; renderChecklist?: unknown[]; complianceFlags?: unknown[] };
  if (!data || !Array.isArray(data.scenes)) return null;
  const fallback = buildFallbackVideoPlan(request);
  const scenes = data.scenes.slice(0, 18).map((s: unknown, idx: number) => {
    const scene = s as Record<string, unknown>;
    return {
      id: `scene_${idx + 1}`,
      beat: String(scene.beat || scene.title || fallback.scenes[idx]?.beat || `Scene ${idx + 1}`),
      durationSec: Math.max(2, Math.min(10, Math.round(Number(scene.durationSec || fallback.scenes[idx]?.durationSec || 4)))),
      visualPrompt: String(scene.visualPrompt || scene.imagePrompt || fallback.scenes[idx]?.visualPrompt || request.prompt),
      motionPrompt: String(scene.motionPrompt || fallback.scenes[idx]?.motionPrompt || 'Subtle cinematic motion, polished and professional.'),
      caption: String(scene.caption || fallback.scenes[idx]?.caption || ''),
      voiceover: String(scene.voiceover || fallback.scenes[idx]?.voiceover || ''),
      callout: scene.callout ? String(scene.callout) : fallback.scenes[idx]?.callout,
      complianceNote: scene.complianceNote ? String(scene.complianceNote) : fallback.scenes[idx]?.complianceNote,
    };
  });
  return {
    ...fallback,
    id: `video_plan_${Date.now().toString(16)}`,
    title: String(data.title || fallback.title).slice(0, 120),
    hook: String(data.hook || fallback.hook),
    cta: String(data.cta || fallback.cta),
    scenes,
    totalDurationSec: scenes.reduce((a, b) => a + b.durationSec, 0),
    platformCutdowns: Array.isArray(data.platformCutdowns) ? (data.platformCutdowns as VideoCommandPlan['platformCutdowns']).slice(0, 8) : fallback.platformCutdowns,
    renderChecklist: Array.isArray(data.renderChecklist) ? data.renderChecklist.slice(0, 12).map(String) : fallback.renderChecklist,
    complianceFlags: Array.isArray(data.complianceFlags) ? data.complianceFlags.slice(0, 12).map(String) : fallback.complianceFlags,
  };
}

export type GenerateVideoPlanResult = {
  plan: VideoCommandPlan;
  normalizedRequest: VideoCommandRequest;
  notice?: string;
};

/** AI storyboard with local fallback — same path as GeminiStyleVideoCommand.generatePlan. */
export async function generateVideoPlan(
  input: Partial<VideoCommandRequest>,
  mode: 'ai' | 'fallback' = 'ai',
): Promise<GenerateVideoPlanResult> {
  const normalized = normalizeVideoRequest(input);
  let plan: VideoCommandPlan | null = null;
  let notice: string | undefined;
  if (mode === 'ai') {
    const ai = buildAiStoryboardPrompt(normalized);
    try {
      const out = await callAiGateway({
        taskType: ai.taskType,
        responseFormat: 'json',
        messages: [
          { role: 'system', content: ai.system },
          { role: 'user', content: ai.user },
        ],
      });
      const parsed = parseJson<unknown>(out.text);
      plan = parsed ? planFromAiJson(parsed, normalized) : null;
    } catch (e: unknown) {
      plan = null;
      notice = `AI plan fell back to local planner: ${(e as Error)?.message || 'gateway unavailable'}`;
    }
  }
  if (!plan) plan = buildFallbackVideoPlan(normalized);
  saveVideoCommandPlan(plan);
  return { plan, normalizedRequest: normalized, notice };
}

export function createProjectFromVideoPlan(plan: VideoCommandPlan): MediaProject {
  const base = createMediaProject({
    title: plan.title,
    aspect: plan.request.aspect,
    stylePreset: plan.request.visualStyle as MediaProject['stylePreset'],
  });
  const next = convertPlanToMediaProject(plan, base);
  upsertMediaProject(next);
  return next;
}

export async function generateProjectSceneVisuals(
  project: MediaProject,
  onProgress?: (message: string) => void,
): Promise<{ projectId: string; generated: number }> {
  const size = aspectToSize(project.aspect);
  const missing = project.scenes.filter((s) => !s.imageDataUrl);
  if (!missing.length) return { projectId: project.id, generated: 0 };
  for (let i = 0; i < missing.length; i += 1) {
    const s = missing[i]!;
    onProgress?.(`Generating scene visual ${i + 1}/${missing.length}…`);
    // eslint-disable-next-line no-await-in-loop
    const gen = await generateImages({
      prompt: `${s.prompt}\nNo logos, no watermarks, no text overlays. Premium Finely Cred cinematic style.`,
      size: size.imageSize,
      quality: 'high',
      style: 'vivid',
      n: 1,
      idempotencyKey: `studio-command:${project.id}:${s.id}:${s.prompt.slice(0, 70)}`,
    });
    const img = gen.images[0];
    if (img?.dataUrl) patchScene(project.id, s.id, { imageDataUrl: img.dataUrl });
  }
  return { projectId: project.id, generated: missing.length };
}

export type ExportMediaProjectResult = {
  blobRef: string;
  filename: string;
  title: string;
  assetId: string;
  resourceVideoId: string;
  commandRecordId: string;
  projectId: string;
};

/** WebM export + private resource + content studio asset — mirrors GeminiStyleVideoCommand.exportProject. */
export async function exportMediaProjectWebm(project: MediaProject): Promise<ExportMediaProjectResult> {
  const preset =
    MEDIA_RENDER_PRESETS.find((p) => p.id === project.renderPresetId) ??
    MEDIA_RENDER_PRESETS.find((p) => (project.aspect === '9:16' ? p.id.includes('1080x1920') : p.id.includes('1080p'))) ??
    MEDIA_RENDER_PRESETS[0];
  const scenes = project.scenes
    .filter((s) => s.imageDataUrl)
    .map((s) => ({
      id: s.id,
      imageDataUrl: s.imageDataUrl!,
      caption: s.caption,
      durationSec: s.durationSec,
      transition: s.transition,
    }));
  if (!scenes.length) throw new Error('Generate visuals before exporting video.');
  const store = getBlobStore();
  const audioBlobs: Array<{ blob: Blob; volume?: number; startSec?: number; endSec?: number }> = [];
  for (const t of (project.audioTracks ?? []).slice(0, 6)) {
    // eslint-disable-next-line no-await-in-loop
    const audio = await store.get(t.blobRef);
    if (audio) audioBlobs.push({ blob: audio, volume: t.volume, startSec: t.startSec, endSec: t.endSec });
  }
  const blob = await exportScenesToWebm({
    scenes,
    width: preset.width,
    height: preset.height,
    fps: preset.fps,
    captionStyle: project.captionStyle,
    audioTracks: audioBlobs.length ? audioBlobs : undefined,
  });
  const filename = `${cleanVideoFilename(project.title)}.webm`;
  const { ref } = await store.put(blob, {
    kind: 'content_studio_video',
    source: 'content_studio',
    projectId: project.id,
    title: project.title,
  });
  const resource = upsertResourceVideo({
    title: `${project.title} (Content Studio)`,
    desc: 'Generated and exported from Content Studio. Review before making public.',
    blobRef: ref,
    mimeType: blob.type || 'video/webm',
    tags: ['content-studio', project.aspect, project.stylePreset],
    isPublic: false,
  });
  const asset = saveContentStudioAsset({
    title: project.title,
    assetType: 'video',
    status: 'needs_review',
    provider: 'ffmpeg',
    blobRef: ref,
    summary: `Rendered ${project.scenes.length} scene(s) as ${filename}. Saved to Resources as ${resource.title}.`,
    publishTargets: ['resources', 'download_only'],
    complianceNotes: ['Resource video is private by default. Review copy, claims, captions, and target page before publishing.'],
  });
  addRenderHistory(project.id, {
    presetId: preset.id,
    filename,
    blobRef: ref,
    note: 'Content Studio export + private Resource video',
  });
  const record = createVideoCommandRecord({ title: project.title, lifecycle: 'publish' });
  const linked = upsertVideoCommandRecord(record.id, {
    resourceVideoId: resource.id,
    contentStudioAssetId: asset.id,
    destinationMode: 'resources',
    lifecycle: 'promote',
  });
  applyDefaultUtmToRecord(linked?.id ?? record.id);
  return {
    blobRef: ref,
    filename,
    title: project.title,
    assetId: asset.id,
    resourceVideoId: resource.id,
    commandRecordId: linked?.id ?? record.id,
    projectId: project.id,
  };
}

export function downloadExportedVideo(blobRef: string, filename: string) {
  void (async () => {
    const b = await getBlobStore().get(blobRef);
    if (b) downloadBlob(b, filename);
  })();
}

export function publishResourceVideo(resourceVideoId: string): boolean {
  const existing = getResourceVideo(resourceVideoId);
  if (!existing) return false;
  upsertResourceVideo({ ...existing, isPublic: true });
  return true;
}

export function patchVideoPlanScene(plan: VideoCommandPlan, sceneId: string, patch: Partial<VideoScenePlan>): VideoCommandPlan {
  const scenes = plan.scenes.map((s) => (s.id === sceneId ? { ...s, ...patch } : s));
  return {
    ...plan,
    scenes,
    totalDurationSec: scenes.reduce((a, b) => a + b.durationSec, 0),
  };
}

export { summarizePlan, normalizeVideoRequest };
