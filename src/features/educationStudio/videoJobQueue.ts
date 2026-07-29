/**
 * Phase 1 video job queue — persists motion render jobs; live adapter hits edge when configured.
 */
import type { VideoProviderId, VideoScenePlan } from '../../domain/educationStudio';

export type VideoRenderJob = {
  id: string;
  provider: VideoProviderId;
  sceneId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  outputUrl?: string;
  error?: string;
  requestId?: string;
  statusUrl?: string;
};

const KEY = 'finely.video.jobs.v1';

type Store = { jobs: VideoRenderJob[] };

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { jobs: [] };
    const parsed = JSON.parse(raw) as Store;
    return { jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [] };
  } catch {
    return { jobs: [] };
  }
}

function save(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ jobs: s.jobs.slice(0, 80) }));
    window.dispatchEvent(new Event('finely:store'));
  } catch {
    /* ignore */
  }
}

export function listVideoJobs(limit = 40): VideoRenderJob[] {
  return load().jobs.slice(0, limit);
}

export function upsertVideoJob(job: VideoRenderJob) {
  const s = load();
  const i = s.jobs.findIndex((j) => j.id === job.id);
  if (i >= 0) s.jobs[i] = job;
  else s.jobs.unshift(job);
  save(s);
  return job;
}

export function getVideoJob(id: string) {
  return load().jobs.find((j) => j.id === id);
}

/** UI hint that live motion is intended / env flagged. */
export function isLiveMotionConfigured(): boolean {
  try {
    const flags = localStorage.getItem('finely.settings.v1');
    if (flags) {
      const parsed = JSON.parse(flags) as { videoMotionLive?: boolean; falApiConfigured?: boolean };
      if (parsed.videoMotionLive || parsed.falApiConfigured) return true;
    }
  } catch {
    /* ignore */
  }
  return Boolean(import.meta.env.VITE_VIDEO_MOTION_LIVE === '1' || import.meta.env.VITE_FAL_KEY);
}

export function queueLocalSceneJob(args: {
  provider: VideoProviderId;
  scene: VideoScenePlan;
  status?: VideoRenderJob['status'];
  outputUrl?: string;
  error?: string;
}): VideoRenderJob {
  const job: VideoRenderJob = {
    id: `job_${args.provider}_${args.scene.id}_${Date.now().toString(36)}`,
    provider: args.provider,
    sceneId: args.scene.id,
    status: args.status ?? 'queued',
    outputUrl: args.outputUrl,
    error: args.error,
  };
  return upsertVideoJob(job);
}
