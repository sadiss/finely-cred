import { isBlueskyIntegrationLive, loadBlueskyIntegrationConfig, saveBlueskyIntegrationConfig } from '../data/blueskyIntegrationRepo';
import type { SocialScheduledPost } from '../data/socialHubRepo';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export type BlueskyPublishResult = {
  ok: boolean;
  uri?: string;
  did?: string;
  error?: string;
  mode: 'local' | 'bluesky';
};

async function invokeBluesky(body: Record<string, unknown>): Promise<BlueskyPublishResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase is not configured', mode: 'local' };
  }
  const cfg = loadBlueskyIntegrationConfig();
  try {
    const { data, error } = await supabase.functions.invoke('bluesky-publish', {
      body: {
        ...body,
        identifier: cfg.handle.trim(),
        password: cfg.appPassword.trim(),
      },
    });
    if (error) throw new Error(error.message);
    if (!data?.ok) throw new Error(data?.error || 'Bluesky call failed');
    return {
      ok: true,
      uri: data.uri,
      did: data.did,
      mode: 'bluesky',
    };
  } catch (e: unknown) {
    return { ok: false, error: (e as Error)?.message ?? 'Bluesky call failed', mode: 'bluesky' };
  }
}

export async function verifyBlueskySession(): Promise<BlueskyPublishResult> {
  const result = await invokeBluesky({ action: 'session' });
  const cfg = loadBlueskyIntegrationConfig();
  saveBlueskyIntegrationConfig({
    ...cfg,
    status: result.ok ? 'connected' : 'error',
    lastCheckedAt: new Date().toISOString(),
    lastError: result.ok ? undefined : result.error,
    did: result.did ?? cfg.did,
  });
  return result;
}

export async function publishBlueskyPostLive(post: SocialScheduledPost): Promise<BlueskyPublishResult> {
  if (!isBlueskyIntegrationLive()) {
    return { ok: false, error: 'Bluesky is not connected', mode: 'local' };
  }
  return invokeBluesky({
    action: 'publish',
    text: post.caption,
    scheduledPostId: post.id,
  });
}
