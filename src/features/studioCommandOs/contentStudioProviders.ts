import { getVoiceStudioStatus } from '../../lib/voiceStudioClient';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import type { ContentStudioJob } from './types';

/** Client-side provider availability — updates blocked/planned flags for the production queue UI. */
export function hydrateProviderPlan(plan: ContentStudioJob['providerPlan']): ContentStudioJob['providerPlan'] {
  const voice = getVoiceStudioStatus();
  const aiReady = isSupabaseConfigured;

  return plan.map((row) => {
    if (row.provider === 'ai_gateway' || row.provider === 'openai_images' || row.provider === 'ffmpeg' || row.provider === 'manual') {
      return { ...row, status: aiReady ? row.status === 'complete' ? 'complete' : 'planned' : 'blocked' };
    }
    if (row.provider === 'voice_studio' || row.provider === 'elevenlabs') {
      return { ...row, status: voice.available ? (row.status === 'complete' ? 'complete' : 'planned') : 'blocked' };
    }
    if (row.provider === 'runway' || row.provider === 'kling' || row.provider === 'luma' || row.provider === 'heygen' || row.provider === 'canva') {
      return { ...row, status: 'blocked' };
    }
    return row;
  });
}
