import type { MetaThreadMessage } from '../domain/metaIntegration';
import { emitPlatformEvent } from '../domain/platformEvents';
import { FINELY_TENANT_ID } from '../domain/tenants';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

function touchPost(post: SocialScheduledPost): SocialScheduledPost {
  return { ...post, updatedAt: new Date().toISOString() };
}

function syncPostBestEffort(post: SocialScheduledPost) {
  if (typeof window === 'undefined') return;
  void import('./socialHubSupabaseSync').then((m) => m.syncSocialPostToSupabase(post));
}

function emitMetaInboundIfNeeded(msg: MetaThreadMessage) {
  if (msg.direction !== 'inbound') return;
  try {
    emitPlatformEvent({
      type: 'chat.message_received',
      tenantId: FINELY_TENANT_ID,
      entityType: 'meta_thread',
      entityId: msg.threadId,
      payload: {
        channel: msg.channel,
        direction: 'inbound',
        pageId: msg.pageId,
        messageId: msg.id,
        preview: msg.text.slice(0, 200),
        source: 'meta',
      },
    });
  } catch {
    // non-blocking
  }
}

export type SocialScheduledPost = {
  id: string;
  caption: string;
  scheduledAt: string;
  status: 'queued' | 'published' | 'failed' | 'needs_review';
  pageId?: string;
  platforms?: Array<'facebook' | 'instagram' | 'threads' | 'linkedin'>;
  sopTemplateId?: string;
  assignedStaffId?: string;
  complianceStatus?: 'approved' | 'needs_review' | 'blocked';
  createdAt: string;
  updatedAt?: string;
};

const POSTS_KEY = 'finely.socialHub.posts.v1';
const INBOX_KEY = 'finely.socialHub.inbox.v1';

type PostsStore = { posts: SocialScheduledPost[] };
type InboxStore = { messages: MetaThreadMessage[] };

function loadPosts(): PostsStore {
  return loadJson(POSTS_KEY, { posts: [] }, 1);
}

function savePosts(store: PostsStore) {
  saveJson(POSTS_KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function mergeScheduledPosts(remote: SocialScheduledPost[]) {
  const store = loadPosts();
  const byId = new Map(store.posts.map((p) => [p.id, p]));
  for (const r of remote) {
    const local = byId.get(r.id);
    const remoteTs = Date.parse(r.updatedAt ?? r.createdAt);
    const localTs = local ? Date.parse(local.updatedAt ?? local.createdAt) : 0;
    if (!local || remoteTs >= localTs) byId.set(r.id, r);
  }
  store.posts = Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  savePosts(store);
}

export function replaceScheduledPostsStore(posts: SocialScheduledPost[]) {
  savePosts({ posts: [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
}

function loadInbox(): InboxStore {
  return loadJson(INBOX_KEY, { messages: [] }, 1);
}

function saveInbox(store: InboxStore) {
  saveJson(INBOX_KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function listScheduledPosts(): SocialScheduledPost[] {
  return loadPosts().posts.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

export function queueSocialPost(args: {
  caption: string;
  scheduledAt: string;
  pageId?: string;
  platforms?: SocialScheduledPost['platforms'];
  sopTemplateId?: string;
  assignedStaffId?: string;
  complianceStatus?: SocialScheduledPost['complianceStatus'];
}): SocialScheduledPost {
  const store = loadPosts();
  const post: SocialScheduledPost = {
    id: newId('post'),
    caption: args.caption.trim(),
    scheduledAt: args.scheduledAt,
    status: args.complianceStatus === 'needs_review' ? 'needs_review' : 'queued',
    pageId: args.pageId,
    platforms: args.platforms,
    sopTemplateId: args.sopTemplateId,
    assignedStaffId: args.assignedStaffId,
    complianceStatus: args.complianceStatus ?? 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.posts.unshift(post);
  savePosts(store);
  syncPostBestEffort(post);
  return post;
}

export function updateSocialPostStatus(
  id: string,
  status: SocialScheduledPost['status'],
  patch?: Partial<Pick<SocialScheduledPost, 'complianceStatus'>>,
): SocialScheduledPost | null {
  const store = loadPosts();
  const idx = store.posts.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const next = touchPost({
    ...store.posts[idx],
    ...patch,
    status,
  });
  store.posts[idx] = next;
  savePosts(store);
  syncPostBestEffort(next);
  return next;
}

export function listInboxMessages(): MetaThreadMessage[] {
  return loadInbox().messages.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function ingestInboxMessage(msg: Omit<MetaThreadMessage, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): MetaThreadMessage {
  const store = loadInbox();
  const id = msg.id ?? newId('meta');
  if (store.messages.some((m) => m.id === id)) {
    return store.messages.find((m) => m.id === id)!;
  }
  const row: MetaThreadMessage = {
    id,
    threadId: msg.threadId,
    channel: msg.channel,
    direction: msg.direction,
    text: msg.text,
    createdAt: msg.createdAt ?? new Date().toISOString(),
    pageId: msg.pageId,
  };
  store.messages.unshift(row);
  store.messages = store.messages.slice(0, 500);
  saveInbox(store);
  emitMetaInboundIfNeeded(row);
  return row;
}

export function getSocialHubStats() {
  const posts = listScheduledPosts();
  const inbox = listInboxMessages();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = Date.now() - 7 * 86400000;
  return {
    scheduledToday: posts.filter((p) => p.scheduledAt.slice(0, 10) === today && p.status === 'queued').length,
    inboxUnread: inbox.filter((m) => m.direction === 'inbound').length,
    leadsThisWeek: inbox.filter((m) => m.text.toLowerCase().includes('lead') && Date.parse(m.createdAt) >= weekAgo).length,
    queuedPosts: posts.filter((p) => p.status === 'queued').length,
  };
}

/** Pull server-side meta_inbox_messages into local cache (admin RLS). */
export async function syncMetaInboxFromSupabase(
  fetchRows: () => Promise<Array<{ id: string; thread_id: string; channel: string; direction: string; text: string; created_at: string; page_id: string }>>,
): Promise<number> {
  const rows = await fetchRows();
  const seen = new Set(loadInbox().messages.map((m) => m.id));
  let added = 0;
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    ingestInboxMessage({
      id: r.id,
      threadId: r.thread_id,
      channel: r.channel as MetaThreadMessage['channel'],
      direction: r.direction as MetaThreadMessage['direction'],
      text: r.text,
      createdAt: r.created_at,
      pageId: r.page_id,
    });
    seen.add(r.id);
    added += 1;
  }
  return added;
}

export function simulateMetaLeadInbox(args: { pageId: string; name: string; email: string }) {
  return ingestInboxMessage({
    threadId: `lead_${args.email}`,
    channel: 'messenger',
    direction: 'inbound',
    pageId: args.pageId,
    text: `Facebook lead form — ${args.name} (${args.email}) requested free guide`,
  });
}
