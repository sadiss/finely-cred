/** Voice / CDN asset memo cache with TTL (Phase 40). */

type CacheEntry = { url: string; cachedAt: number; hits: number };

const TTL_MS = 1000 * 60 * 60 * 6;
const MAX_ENTRIES = 200;

const voiceUrlCache = new Map<string, CacheEntry>();

export function getCachedVoiceUrl(assetKey: string): string | null {
  const hit = voiceUrlCache.get(assetKey);
  if (!hit) return null;
  if (Date.now() - hit.cachedAt > TTL_MS) {
    voiceUrlCache.delete(assetKey);
    return null;
  }
  hit.hits += 1;
  return hit.url;
}

export function setCachedVoiceUrl(assetKey: string, url: string) {
  if (voiceUrlCache.size >= MAX_ENTRIES) {
    const oldest = [...voiceUrlCache.entries()].sort((a, b) => a[1].cachedAt - b[1].cachedAt)[0];
    if (oldest) voiceUrlCache.delete(oldest[0]);
  }
  voiceUrlCache.set(assetKey, { url, cachedAt: Date.now(), hits: 0 });
}

export function getEdgeCacheStats() {
  const entries = [...voiceUrlCache.values()];
  return {
    voiceEntries: entries.length,
    totalHits: entries.reduce((n, e) => n + e.hits, 0),
    ttlHours: TTL_MS / (1000 * 60 * 60),
  };
}

export function clearEdgeAssetCache() {
  voiceUrlCache.clear();
}
