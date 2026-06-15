/** Supabase sync for Social Hub scheduled posts + autopilot config (server cron persistence). */
import type { SocialScheduledPost } from './socialHubRepo';
import { listScheduledPosts, mergeScheduledPosts } from './socialHubRepo';
import type { SocialAutopilotConfig } from '../lib/socialAutopilotEngine';
import { loadSocialAutopilotConfig, saveSocialAutopilotConfig } from '../lib/socialAutopilotEngine';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { FINELY_TENANT_ID } from '../domain/tenants';

function rowFromPost(post: SocialScheduledPost, tenantId: string, imageUrl?: string) {
  return {
    id: post.id,
    tenant_id: tenantId,
    caption: post.caption,
    scheduled_at: post.scheduledAt,
    status: post.status,
    page_id: post.pageId ?? null,
    platforms: post.platforms ?? null,
    sop_template_id: post.sopTemplateId ?? null,
    assigned_staff_id: post.assignedStaffId ?? null,
    compliance_status: post.complianceStatus ?? null,
    image_url: imageUrl ?? null,
    created_at: post.createdAt,
    updated_at: post.updatedAt ?? post.createdAt,
  };
}

function postFromRow(row: Record<string, unknown>): SocialScheduledPost {
  return {
    id: String(row.id),
    caption: String(row.caption ?? ''),
    scheduledAt: String(row.scheduled_at ?? row.scheduledAt ?? new Date().toISOString()),
    status: String(row.status ?? 'queued') as SocialScheduledPost['status'],
    pageId: row.page_id ? String(row.page_id) : undefined,
    platforms: Array.isArray(row.platforms) ? (row.platforms as SocialScheduledPost['platforms']) : undefined,
    sopTemplateId: row.sop_template_id ? String(row.sop_template_id) : undefined,
    assignedStaffId: row.assigned_staff_id ? String(row.assigned_staff_id) : undefined,
    complianceStatus: row.compliance_status
      ? (String(row.compliance_status) as SocialScheduledPost['complianceStatus'])
      : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
  };
}

export async function syncSocialPostToSupabase(post: SocialScheduledPost, imageUrl?: string) {
  if (!isSupabaseConfigured) return { ok: false as const, error: 'Supabase not configured' };
  try {
    const { error } = await supabase
      .from('social_scheduled_posts')
      .upsert(rowFromPost(post, FINELY_TENANT_ID, imageUrl), { onConflict: 'id' });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  } catch (err: unknown) {
    return { ok: false as const, error: (err as Error)?.message ?? String(err) };
  }
}

export async function syncAllSocialPostsToSupabase(posts?: SocialScheduledPost[]) {
  const rows = posts ?? listScheduledPosts();
  if (!rows.length) return { ok: true as const, count: 0 };
  if (!isSupabaseConfigured) return { ok: false as const, count: 0, error: 'Supabase not configured' };
  try {
    const payload = rows.map((p) => rowFromPost(p, FINELY_TENANT_ID));
    const { error } = await supabase.from('social_scheduled_posts').upsert(payload, { onConflict: 'id' });
    if (error) return { ok: false as const, count: 0, error: error.message };
    return { ok: true as const, count: rows.length };
  } catch (err: unknown) {
    return { ok: false as const, count: 0, error: (err as Error)?.message ?? String(err) };
  }
}

export async function syncSocialPostsFromSupabase(): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, count: 0, error: 'Supabase not configured' };
  try {
    const { data, error } = await supabase
      .from('social_scheduled_posts')
      .select('*')
      .eq('tenant_id', FINELY_TENANT_ID)
      .order('scheduled_at', { ascending: true });
    if (error) return { ok: false, count: 0, error: error.message };
    const remote = (data ?? []).map((r) => postFromRow(r as Record<string, unknown>));
    if (remote.length === 0) return { ok: true, count: 0 };
    mergeScheduledPosts(remote);
    return { ok: true, count: remote.length };
  } catch (err: unknown) {
    return { ok: false, count: 0, error: (err as Error)?.message ?? String(err) };
  }
}

export async function syncAutopilotConfigToSupabase(cfg?: SocialAutopilotConfig) {
  if (!isSupabaseConfigured) return { ok: false as const, error: 'Supabase not configured' };
  const config = cfg ?? loadSocialAutopilotConfig();
  try {
    const { error } = await supabase.from('social_autopilot_config').upsert(
      {
        tenant_id: FINELY_TENANT_ID,
        config,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' },
    );
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  } catch (err: unknown) {
    return { ok: false as const, error: (err as Error)?.message ?? String(err) };
  }
}

export async function syncAutopilotConfigFromSupabase(): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase not configured' };
  try {
    const { data, error } = await supabase
      .from('social_autopilot_config')
      .select('config, updated_at')
      .eq('tenant_id', FINELY_TENANT_ID)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data?.config) return { ok: true };
    saveSocialAutopilotConfig({ ...loadSocialAutopilotConfig(), ...(data.config as SocialAutopilotConfig) });
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error)?.message ?? String(err) };
  }
}

/** Boot: hydrate from Supabase; push local queue when remote empty. */
export async function ensureSocialHubSyncedOnce() {
  if (!isSupabaseConfigured) return;

  await syncAutopilotConfigFromSupabase();
  const remote = await syncSocialPostsFromSupabase();
  if (remote.ok && remote.count > 0) return;

  const local = listScheduledPosts();
  if (remote.ok && remote.count === 0 && local.length > 0) {
    await syncAllSocialPostsToSupabase(local);
  }
}

/** Pull server-side publish results back into local cache. */
export async function refreshSocialPostsFromSupabase() {
  return syncSocialPostsFromSupabase();
}
