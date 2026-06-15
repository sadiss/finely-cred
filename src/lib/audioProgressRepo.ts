import type { FinelyAudioContentType } from '../components/audio/FinelyAudioPlayer.types';
import { loadJson, saveJson } from '../data/localJsonStore';

const KEY = 'finely.audioProgress.v1';

export type AudioProgressEntry = {
  contentId: string;
  contentType: FinelyAudioContentType;
  seconds: number;
  duration?: number;
  updatedAt: string;
};

type Store = { entries: Record<string, AudioProgressEntry> };

function progressKey(contentType: FinelyAudioContentType, contentId: string) {
  return `${contentType}:${contentId}`;
}

function loadStore(): Store {
  return loadJson(KEY, { entries: {} }, 1);
}

export function getAudioProgress(contentType: FinelyAudioContentType, contentId: string): AudioProgressEntry | null {
  const store = loadStore();
  return store.entries[progressKey(contentType, contentId)] ?? null;
}

export function saveAudioProgress(args: {
  contentType: FinelyAudioContentType;
  contentId: string;
  seconds: number;
  duration?: number;
}) {
  const store = loadStore();
  const k = progressKey(args.contentType, args.contentId);
  store.entries[k] = {
    contentId: args.contentId,
    contentType: args.contentType,
    seconds: Math.max(0, args.seconds),
    duration: args.duration,
    updatedAt: new Date().toISOString(),
  };
  saveJson(KEY, store, 1);
}

export function clearAudioProgress(contentType: FinelyAudioContentType, contentId: string) {
  const store = loadStore();
  delete store.entries[progressKey(contentType, contentId)];
  saveJson(KEY, store, 1);
}
