/** Client error capture for ops monitoring — Sentry-ready hook (Phase 44). */
import { loadJson, saveJson } from '../data/localJsonStore';

const KEY = 'finely.errorReports.v1';
const MAX = 80;

export type ClientErrorReport = {
  id: string;
  at: string;
  message: string;
  source?: string;
  stack?: string;
};

type Store = { entries: ClientErrorReport[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { entries: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function recordClientError(args: { message: string; source?: string; stack?: string }) {
  const store = loadStore();
  store.entries.unshift({
    id: `err_${Date.now()}`,
    at: new Date().toISOString(),
    message: args.message.slice(0, 500),
    source: args.source,
    stack: args.stack?.slice(0, 1200),
  });
  store.entries = store.entries.slice(0, MAX);
  saveStore(store);
}

export function listClientErrors(limit = 20): ClientErrorReport[] {
  return loadStore().entries.slice(0, limit);
}

export function buildErrorOpsSnapshot() {
  const entries = loadStore().entries;
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recent = entries.filter((e) => Date.parse(e.at) >= dayAgo);
  return {
    at: new Date().toISOString(),
    total24h: recent.length,
    last: entries[0] ?? null,
  };
}

let wired = false;

export function wireErrorReportingBridge() {
  if (wired || typeof window === 'undefined') return;
  wired = true;
  window.addEventListener('error', (ev) => {
    recordClientError({
      message: ev.message || 'Unknown error',
      source: ev.filename ? `${ev.filename}:${ev.lineno}` : undefined,
      stack: ev.error instanceof Error ? ev.error.stack : undefined,
    });
  });
  window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev.reason;
    recordClientError({
      message: reason instanceof Error ? reason.message : String(reason ?? 'Unhandled rejection'),
      source: 'unhandledrejection',
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
}

if (typeof window !== 'undefined') {
  wireErrorReportingBridge();
}
