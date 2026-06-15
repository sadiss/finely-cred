import { isMetaIntegrationLive, loadMetaIntegrationConfig } from '../data/metaIntegrationRepo';
import type { SocialScheduledPost } from '../data/socialHubRepo';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export type MetaPublishResult = {
  ok: boolean;
  postId?: string;
  error?: string;
  mode: 'local' | 'meta';
};

/** Publish one scheduled post to Meta when connected; otherwise no-op (caller marks local queue). */
export async function publishSocialPostLive(post: SocialScheduledPost): Promise<MetaPublishResult> {
  if (!isMetaIntegrationLive() || !isSupabaseConfigured) {
    return { ok: false, error: 'Meta integration not live', mode: 'local' };
  }

  const cfg = loadMetaIntegrationConfig();
  const pageId = post.pageId ?? cfg.connectedPages[0]?.pageId;
  if (!pageId) {
    return { ok: false, error: 'No connected Meta page', mode: 'local' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('meta-publish-post', {
      body: {
        pageId,
        caption: post.caption,
        platforms: post.platforms ?? ['facebook'],
        scheduledPostId: post.id,
        imageUrl: cfg.defaultIgImageUrl,
      },
    });
    if (error) throw new Error(error.message);
    if (!data?.ok) throw new Error(data?.error || 'Meta publish failed');
    return { ok: true, postId: data.postId, mode: 'meta' };
  } catch (e: unknown) {
    return { ok: false, error: (e as Error)?.message ?? 'Meta publish failed', mode: 'meta' };
  }
}

export async function publishDueSocialPostsLive(
  posts: SocialScheduledPost[],
  opts?: { dryRun?: boolean },
): Promise<{ published: number; failed: number; meta: number }> {
  if (opts?.dryRun) {
    const due = posts.filter(
      (p) =>
        p.status === 'queued' &&
        p.complianceStatus !== 'needs_review' &&
        p.complianceStatus !== 'blocked' &&
        Date.parse(p.scheduledAt) <= Date.now(),
    );
    return { published: 0, failed: 0, meta: due.length };
  }

  let published = 0;
  let failed = 0;
  let meta = 0;
  const now = Date.now();

  for (const post of posts) {
    if (post.status !== 'queued') continue;
    if (post.complianceStatus === 'needs_review' || post.complianceStatus === 'blocked') continue;
    if (Date.parse(post.scheduledAt) > now) continue;

    if (isMetaIntegrationLive()) {
      const result = await publishSocialPostLive(post);
      if (result.ok) {
        published += 1;
        meta += 1;
      } else {
        failed += 1;
      }
    } else {
      published += 1;
    }
  }

  return { published, failed, meta };
}
