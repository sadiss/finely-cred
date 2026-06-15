import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import type { ResourceVideo } from '../domain/resourceVideos';

const KEY = 'finely.resourceVideos.v1';
const VERSION = 1;

type Store = { items: ResourceVideo[] };

function nowIso() {
  return new Date().toISOString();
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { items: [] }, VERSION);
}

function saveStore(store: Store) {
  saveJson(KEY, store, VERSION);
}

export function listResourceVideos(): ResourceVideo[] {
  return loadStore()
    .items.slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listPublicResourceVideos(): ResourceVideo[] {
  return listResourceVideos().filter((v) => v.isPublic);
}

export function getResourceVideo(id: string): ResourceVideo | null {
  const t = (id || '').trim();
  if (!t) return null;
  return loadStore().items.find((x) => x.id === t) ?? null;
}

export function upsertResourceVideo(video: Omit<ResourceVideo, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): ResourceVideo {
  const store = loadStore();
  const now = nowIso();
  const id = (video.id || '').trim() || newId('rvid');
  const existingIdx = store.items.findIndex((x) => x.id === id);
  const next: ResourceVideo = {
    id,
    title: String(video.title || '').trim() || 'Untitled video',
    desc: (video.desc || '').trim() || undefined,
    blobRef: video.blobRef,
    mimeType: String(video.mimeType || '').trim() || 'video/mp4',
    posterBlobRef: video.posterBlobRef,
    tags: Array.isArray(video.tags) ? video.tags.map((t) => String(t).trim()).filter(Boolean) : undefined,
    isPublic: Boolean(video.isPublic),
    createdAt: existingIdx >= 0 ? store.items[existingIdx]!.createdAt : now,
    updatedAt: now,
  };
  if (existingIdx >= 0) store.items[existingIdx] = next;
  else store.items.unshift(next);
  saveStore(store);
  return next;
}

export function deleteResourceVideo(id: string) {
  const t = (id || '').trim();
  if (!t) return;
  const store = loadStore();
  store.items = store.items.filter((x) => x.id !== t);
  saveStore(store);
}

