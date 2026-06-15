import type { VideoProviderId, VideoScenePlan } from '../../../domain/educationStudio';

export type VideoRenderJob = {
  id: string;
  provider: VideoProviderId;
  sceneId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  outputUrl?: string;
  error?: string;
};

export interface VideoProviderAdapter {
  id: VideoProviderId;
  label: string;
  description: string;
  /** Stub: queue render job (real API wired via settings keys) */
  queueScene(scene: VideoScenePlan): Promise<VideoRenderJob>;
}

function stubAdapter(id: VideoProviderId, label: string, description: string): VideoProviderAdapter {
  return {
    id,
    label,
    description,
    async queueScene(scene) {
      return {
        id: `job_${id}_${scene.id}`,
        provider: id,
        sceneId: scene.id,
        status: 'queued',
      };
    },
  };
}

export const VIDEO_PROVIDER_ADAPTERS: Record<VideoProviderId, VideoProviderAdapter> = {
  kling: stubAdapter('kling', 'Kling AI', 'Cinematic motion + character consistency.'),
  runway: stubAdapter('runway', 'Runway Gen-3', 'High-fidelity generative video.'),
  veo: stubAdapter('veo', 'Google Veo', 'Long-form narrative scenes.'),
  pika: stubAdapter('pika', 'Pika', 'Fast social-ready clips.'),
  luma: stubAdapter('luma', 'Luma Dream Machine', '3D-aware camera motion.'),
  manual: stubAdapter('manual', 'Manual export', 'Export scene plan for external editor.'),
};

export function getVideoProviderAdapter(id: VideoProviderId) {
  return VIDEO_PROVIDER_ADAPTERS[id] ?? VIDEO_PROVIDER_ADAPTERS.manual;
}
