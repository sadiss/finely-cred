import type { VideoProviderId, VideoScenePlan } from '../../../domain/educationStudio';
import { isSupabaseConfigured, supabase } from '../../../lib/supabaseClient';
import {
  isLiveMotionConfigured,
  queueLocalSceneJob,
  upsertVideoJob,
  type VideoRenderJob,
} from '../videoJobQueue';

export type { VideoRenderJob };

export interface VideoProviderAdapter {
  id: VideoProviderId;
  label: string;
  description: string;
  /** Live when edge + FAL_KEY configured; otherwise honest failed/queued stub */
  queueScene(scene: VideoScenePlan): Promise<VideoRenderJob>;
  live?: boolean;
}

function stubAdapter(id: VideoProviderId, label: string, description: string): VideoProviderAdapter {
  return {
    id,
    label,
    description,
    live: false,
    async queueScene(scene) {
      return queueLocalSceneJob({
        provider: id,
        scene,
        status: 'failed',
        error: `${label} is Planned — use Live motion (Luma/Fal) or Presenter Mode (stills + VO).`,
      });
    },
  };
}

async function queueLiveMotion(scene: VideoScenePlan, provider: VideoProviderId): Promise<VideoRenderJob> {
  const prompt = [scene.visualPrompt, scene.cameraDirection, scene.onScreenText].filter(Boolean).join('\n');
  const local = queueLocalSceneJob({ provider, scene, status: 'queued' });

  if (!isSupabaseConfigured) {
    return upsertVideoJob({
      ...local,
      status: 'failed',
      error: 'Supabase not configured — cannot call video-motion-render.',
    });
  }

  try {
    const { data, error } = await supabase.functions.invoke('video-motion-render', {
      body: {
        prompt,
        sceneId: scene.id,
        provider,
      },
    });
    if (error) throw new Error(error.message);
    if (!data?.ok) {
      return upsertVideoJob({
        ...local,
        status: 'failed',
        error: data?.error || 'Motion render rejected (set FAL_KEY on video-motion-render).',
      });
    }
    return upsertVideoJob({
      ...local,
      status: (data.status as VideoRenderJob['status']) || 'processing',
      requestId: data.requestId,
      statusUrl: data.statusUrl,
      outputUrl: data.outputUrl,
    });
  } catch (e) {
    return upsertVideoJob({
      ...local,
      status: 'failed',
      error: (e as Error)?.message || 'video-motion-render invoke failed',
    });
  }
}

const lumaLive: VideoProviderAdapter = {
  id: 'luma',
  label: 'Live motion (Fal / Luma path)',
  description: isLiveMotionConfigured()
    ? 'Phase 1 live path via video-motion-render + FAL_KEY.'
    : 'Phase 1 live path — deploy video-motion-render and set FAL_KEY (or VITE_VIDEO_MOTION_LIVE=1 for UI badge).',
  live: true,
  async queueScene(scene) {
    return queueLiveMotion(scene, 'luma');
  },
};

export const VIDEO_PROVIDER_ADAPTERS: Record<VideoProviderId, VideoProviderAdapter> = {
  kling: stubAdapter('kling', 'Kling AI', 'Cinematic motion — Planned until dedicated adapter.'),
  runway: stubAdapter('runway', 'Runway Gen-3', 'Planned until dedicated adapter.'),
  veo: stubAdapter('veo', 'Google Veo', 'Planned until dedicated adapter.'),
  pika: stubAdapter('pika', 'Pika', 'Planned until dedicated adapter.'),
  luma: lumaLive,
  manual: {
    id: 'manual',
    label: 'Presenter / manual',
    description: 'Export scene for Presenter Mode (stills + VO → WebM) or external editor.',
    live: true,
    async queueScene(scene) {
      return queueLocalSceneJob({
        provider: 'manual',
        scene,
        status: 'completed',
        outputUrl: undefined,
        error: undefined,
      });
    },
  },
};

export function getVideoProviderAdapter(id: VideoProviderId) {
  return VIDEO_PROVIDER_ADAPTERS[id] ?? VIDEO_PROVIDER_ADAPTERS.manual;
}

export function listLiveVideoProviders() {
  return Object.values(VIDEO_PROVIDER_ADAPTERS).filter((a) => a.live);
}
