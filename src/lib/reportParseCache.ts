import type { ParsedCreditReport } from '../domain/creditReports';
import { loadJson, saveJson } from '../data/localJsonStore';

const KEY = 'finely.reportParseCache.v1';

type CacheEntry = {
  reportId: string;
  contentHash: string;
  parsed: ParsedCreditReport;
  cachedAt: string;
};

type Store = { entries: CacheEntry[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { entries: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function simpleHash(text: string): string {
  let h = 0;
  const len = Math.min(text.length, 48000);
  for (let i = 0; i < len; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return `${len}:${h}`;
}

export function getCachedParsedReport(args: {
  reportId: string;
  contentHash: string;
}): ParsedCreditReport | null {
  const hit = loadStore().entries.find(
    (e) => e.reportId === args.reportId && e.contentHash === args.contentHash,
  );
  return hit?.parsed ?? null;
}

export function setCachedParsedReport(args: {
  reportId: string;
  contentHash: string;
  parsed: ParsedCreditReport;
}) {
  const store = loadStore();
  store.entries = store.entries.filter((e) => e.reportId !== args.reportId);
  store.entries.unshift({
    reportId: args.reportId,
    contentHash: args.contentHash,
    parsed: args.parsed,
    cachedAt: new Date().toISOString(),
  });
  store.entries = store.entries.slice(0, 120);
  saveStore(store);
}

export function hashReportContent(text: string): string {
  return simpleHash(text);
}
