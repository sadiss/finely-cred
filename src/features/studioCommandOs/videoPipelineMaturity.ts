import type { ContentStudioAsset, ContentStudioJob, ContentStudioJobStatus } from './types';
import {
  getSelectedContentStudioJobId,
  listContentStudioAssets,
  listContentStudioJobs,
} from './contentStudioRepo';

export type VideoPipelineStageId = 'script' | 'images' | 'vo' | 'stitch' | 'published';

export const VIDEO_PIPELINE_STAGE_LABELS: Record<VideoPipelineStageId, string> = {
  script: 'Script',
  images: 'Images',
  vo: 'Voice',
  stitch: 'Stitch',
  published: 'Published',
};

export type VideoPipelineStage = {
  id: VideoPipelineStageId;
  label: string;
  percent: number;
  done: boolean;
  hint: string;
};

export type VideoPipelineMaturityReport = {
  percent: number;
  label: string;
  stages: VideoPipelineStage[];
  jobId?: string;
  jobTitle?: string;
};

const STATUS_RANK: Record<ContentStudioJobStatus, number> = {
  draft: 0,
  researching: 1,
  script_ready: 2,
  design_ready: 3,
  voice_ready: 4,
  video_ready: 5,
  needs_review: 6,
  approved: 7,
  published: 8,
  failed: -1,
};

const VIDEO_ASSET_TYPES = new Set([
  'video',
  'course_lesson_video',
  'tour_demo',
  'testimonial_video',
  'social_clip',
]);

function jobAssets(job: ContentStudioJob, assets: ContentStudioAsset[]): ContentStudioAsset[] {
  const ids = new Set(job.assetIds);
  return assets.filter((a) => a.jobId === job.id || ids.has(a.id));
}

function isVideoJob(job: ContentStudioJob): boolean {
  return VIDEO_ASSET_TYPES.has(job.intake.requestedAssetType);
}

function stageScript(job: ContentStudioJob): { percent: number; done: boolean; hint: string } {
  const hasScript = Boolean(job.scriptDraft?.trim() || job.scenePlan?.trim());
  const rank = STATUS_RANK[job.status] ?? 0;
  if (hasScript || rank >= STATUS_RANK.script_ready) {
    return { percent: 100, done: true, hint: hasScript ? 'Script or scene plan on file' : 'Status: script ready' };
  }
  if (job.researchBrief?.trim()) {
    return { percent: 40, done: false, hint: 'Research brief exists — script pending' };
  }
  return { percent: rank >= STATUS_RANK.researching ? 20 : 0, done: false, hint: 'No script yet' };
}

function stageImages(
  job: ContentStudioJob,
  related: ContentStudioAsset[],
): { percent: number; done: boolean; hint: string } {
  const imageAssets = related.filter((a) => a.assetType === 'image' || a.assetType === 'thumbnail');
  const hasDesign = Boolean(job.designPlan?.trim());
  const rank = STATUS_RANK[job.status] ?? 0;
  const providerDone = job.providerPlan.some(
    (p) => ['openai_images', 'canva'].includes(p.provider) && p.status === 'complete',
  );
  if (imageAssets.length > 0 || providerDone || rank >= STATUS_RANK.design_ready) {
    return {
      percent: 100,
      done: true,
      hint: imageAssets.length
        ? `${imageAssets.length} image asset(s)`
        : hasDesign
          ? 'Design plan ready'
          : 'Design stage complete',
    };
  }
  if (hasDesign) return { percent: 55, done: false, hint: 'Design plan — images pending' };
  return { percent: rank >= STATUS_RANK.script_ready ? 25 : 0, done: false, hint: 'Scene images not generated' };
}

function stageVo(
  job: ContentStudioJob,
  related: ContentStudioAsset[],
): { percent: number; done: boolean; hint: string } {
  const audioAssets = related.filter((a) => a.assetType === 'audio');
  const hasVoice = Boolean(job.voicePlan?.trim());
  const rank = STATUS_RANK[job.status] ?? 0;
  const providerDone = job.providerPlan.some(
    (p) => ['voice_studio', 'elevenlabs'].includes(p.provider) && p.status === 'complete',
  );
  if (audioAssets.length > 0 || providerDone || rank >= STATUS_RANK.voice_ready) {
    return {
      percent: 100,
      done: true,
      hint: audioAssets.length ? `${audioAssets.length} audio track(s)` : 'Voice stage complete',
    };
  }
  if (hasVoice) return { percent: 50, done: false, hint: 'Voice plan — narration pending' };
  return { percent: 0, done: false, hint: 'No narration yet' };
}

function stageStitch(
  job: ContentStudioJob,
  related: ContentStudioAsset[],
): { percent: number; done: boolean; hint: string } {
  const videoAssets = related.filter((a) => VIDEO_ASSET_TYPES.has(a.assetType));
  const withBlob = videoAssets.filter((a) => Boolean(a.blobRef || a.dataUrl));
  const rank = STATUS_RANK[job.status] ?? 0;
  if (withBlob.length > 0 || rank >= STATUS_RANK.video_ready) {
    return {
      percent: 100,
      done: true,
      hint: withBlob.length ? `${withBlob.length} rendered file(s)` : 'Video ready status',
    };
  }
  if (videoAssets.length) return { percent: 35, done: false, hint: 'Video asset stub — no file yet' };
  return { percent: 0, done: false, hint: 'No stitched export' };
}

function stagePublished(
  job: ContentStudioJob,
  related: ContentStudioAsset[],
): { percent: number; done: boolean; hint: string } {
  const publishedAssets = related.filter((a) => a.status === 'published');
  if (job.status === 'published' || publishedAssets.length > 0) {
    return {
      percent: 100,
      done: true,
      hint: publishedAssets.length ? `${publishedAssets.length} live asset(s)` : 'Job published',
    };
  }
  if (job.status === 'approved') return { percent: 75, done: false, hint: 'Approved — publish pending' };
  if (job.status === 'needs_review') return { percent: 50, done: false, hint: 'In review queue' };
  return { percent: 0, done: false, hint: 'Not published' };
}

/** Stage % for one Content Studio job — script → images → VO → stitch → published. */
export function computeJobVideoPipelineMaturity(
  job: ContentStudioJob,
  assets: ContentStudioAsset[] = listContentStudioAssets(),
): VideoPipelineMaturityReport {
  const related = jobAssets(job, assets);
  const builders: Array<[VideoPipelineStageId, () => ReturnType<typeof stageScript>]> = [
    ['script', () => stageScript(job)],
    ['images', () => stageImages(job, related)],
    ['vo', () => stageVo(job, related)],
    ['stitch', () => stageStitch(job, related)],
    ['published', () => stagePublished(job, related)],
  ];
  const stages: VideoPipelineStage[] = builders.map(([id, fn]) => {
    const s = fn();
    return { id, label: VIDEO_PIPELINE_STAGE_LABELS[id], ...s };
  });
  const percent = Math.round(stages.reduce((sum, s) => sum + s.percent, 0) / stages.length);
  const doneCount = stages.filter((s) => s.done).length;
  const label =
    percent >= 90
      ? 'Ready to publish or live'
      : percent >= 60
        ? `${doneCount}/5 stages complete`
        : percent >= 30
          ? 'Mid-pipeline — keep generating'
          : 'Early pipeline — run wizard or workrooms';
  return { percent, label, stages, jobId: job.id, jobTitle: job.title };
}

function emptyPipelineReport(): VideoPipelineMaturityReport {
  return {
    percent: 0,
    label: 'No video jobs yet',
    stages: (Object.keys(VIDEO_PIPELINE_STAGE_LABELS) as VideoPipelineStageId[]).map((id) => ({
      id,
      label: VIDEO_PIPELINE_STAGE_LABELS[id],
      percent: 0,
      done: false,
      hint: 'Create a video in Content Studio',
    })),
  };
}

/** Selected (or latest) video job pipeline maturity. */
export function computeVideoPipelineMaturity(): VideoPipelineMaturityReport {
  const jobs = listContentStudioJobs().filter(isVideoJob);
  const assets = listContentStudioAssets();
  if (!jobs.length) return emptyPipelineReport();
  const selectedId = getSelectedContentStudioJobId();
  const primary = (selectedId ? jobs.find((j) => j.id === selectedId) : undefined) ?? jobs[0]!;
  return computeJobVideoPipelineMaturity(primary, assets);
}

/** Highest-completion video job — useful for agent desks. */
export function computeBestVideoPipelineMaturity(): VideoPipelineMaturityReport {
  const jobs = listContentStudioJobs().filter(isVideoJob);
  const assets = listContentStudioAssets();
  if (!jobs.length) return emptyPipelineReport();
  const reports = jobs.map((j) => computeJobVideoPipelineMaturity(j, assets));
  return reports.sort((a, b) => b.percent - a.percent)[0]!;
}
