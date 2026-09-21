import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import type { LoungeChannelId, LoungePost, LoungeRole } from '../domain/specialistLounge';

const KEY = 'finely.specialistLounge.v1';

type Store = { posts: LoungePost[]; lastReadAt: Record<string, string> };

function load(): Store {
  const s = loadJson<Store>(KEY, { posts: [], lastReadAt: {} }, 1);
  if (!s.posts.length) {
    s.posts = seedPosts();
    saveJson(KEY, s, 1);
  }
  return s;
}

function save(store: Store) {
  saveJson(KEY, store, 1);
}

function seedPosts(): LoungePost[] {
  const now = new Date().toISOString();
  return [
    {
      id: newId('lp'),
      channelId: 'announce',
      authorEmail: 'coach@finelycred.com',
      authorName: 'Finely Coach',
      role: 'coach',
      body: 'Specialist Lounge is live — pair every academy module with a huddle thread. Educational wins only; no deletion guarantees.',
      createdAt: now,
      pinned: true,
    },
    {
      id: newId('lp'),
      channelId: 'general',
      authorEmail: 'desk@finelycred.com',
      authorName: 'Haitian Desk',
      role: 'coach',
      body: 'Byenveni! Kreyòl + English — montre respe, montre pwosesis. 🇭🇹',
      createdAt: now,
    },
  ];
}

export function listLoungePosts(channelId?: LoungeChannelId): LoungePost[] {
  const s = load();
  let posts = s.posts.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (channelId) posts = posts.filter((p) => p.channelId === channelId);
  return posts;
}

export function createLoungePost(args: {
  channelId: LoungeChannelId;
  authorEmail: string;
  authorName: string;
  role: LoungeRole;
  body: string;
  moduleLessonId?: string;
  meetLink?: string;
  reviewScore?: number;
  threadParentId?: string;
}): LoungePost {
  const s = load();
  const post: LoungePost = {
    id: newId('lp'),
    createdAt: new Date().toISOString(),
    ...args,
    reactions: {},
  };
  s.posts.push(post);
  save(s);
  return post;
}

export function markLoungeChannelRead(channelId: LoungeChannelId) {
  const s = load();
  s.lastReadAt[channelId] = new Date().toISOString();
  save(s);
}

export function loungeUnreadCount(channelId: LoungeChannelId): number {
  const s = load();
  const since = s.lastReadAt[channelId];
  return s.posts.filter((p) => p.channelId === channelId && (!since || p.createdAt > since)).length;
}

export function loungeKpis() {
  const posts = load().posts;
  const ask = posts.filter((p) => p.channelId === 'ask_desk');
  const wins = posts.filter((p) => p.channelId === 'wins');
  const meets = posts.filter((p) => p.channelId === 'meeting_lobby');
  return {
    totalPosts: posts.length,
    askDeskOpen: ask.length,
    winsShared: wins.length,
    meetThreads: meets.length,
    reviewsWithScore: wins.filter((p) => p.reviewScore != null).length,
  };
}
