/** Voice render success/failure log for ops monitoring (Phase 44). */
import { loadJson, saveJson } from '../data/localJsonStore';

const KEY = 'finely.voiceRenderHealth.v1';
const MAX = 120;

export type VoiceRenderLogEntry = {
  id: string;
  at: string;
  ok: boolean;
  contentId?: string;
  contentType?: string;
  error?: string;
  provider?: string;
};

type Store = { entries: VoiceRenderLogEntry[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { entries: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function recordVoiceRenderAttempt(args: {
  ok: boolean;
  contentId?: string;
  contentType?: string;
  error?: string;
  provider?: string;
}) {
  const store = loadStore();
  store.entries.unshift({
    id: `vr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    ok: args.ok,
    contentId: args.contentId,
    contentType: args.contentType,
    error: args.error?.slice(0, 240),
    provider: args.provider,
  });
  store.entries = store.entries.slice(0, MAX);
  saveStore(store);
}

export function buildVoiceRenderHealthSnapshot() {
  const entries = loadStore().entries;
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recent = entries.filter((e) => Date.parse(e.at) >= dayAgo);
  const failures = recent.filter((e) => !e.ok);
  const successes = recent.filter((e) => e.ok);
  return {
    at: new Date().toISOString(),
    total24h: recent.length,
    failures24h: failures.length,
    successes24h: successes.length,
    failureRate24h: recent.length ? failures.length / recent.length : 0,
    lastFailure: failures[0] ?? null,
    lastSuccess: successes[0] ?? null,
  };
}

export function listVoiceRenderLogs(limit = 20): VoiceRenderLogEntry[] {
  return loadStore().entries.slice(0, limit);
}
