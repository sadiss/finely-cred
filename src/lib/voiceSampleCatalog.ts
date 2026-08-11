/**
 * Cached ElevenLabs/Cartesia voice preview samples (3–5s per persona).
 * Generated via `scripts/prerender-voice-samples.mjs` → public/voice-samples/.
 */

export type VoiceSampleManifest = {
  version?: number;
  /** voiceId → public URL path */
  samples: Record<string, string>;
};

const MANIFEST_URL = '/voice-samples/manifest.json';

let manifestPromise: Promise<VoiceSampleManifest | null> | null = null;

function samplePathForVoice(voiceId: string): string {
  return `/voice-samples/${encodeURIComponent(voiceId)}.mp3`;
}

async function loadManifest(): Promise<VoiceSampleManifest | null> {
  if (typeof window === 'undefined') return null;
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL, { cache: 'force-cache' })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as VoiceSampleManifest;
        if (!data?.samples || typeof data.samples !== 'object') return { samples: {} };
        return data;
      })
      .catch(() => null);
  }
  return manifestPromise;
}

/** Resolve a cached preview URL for a voice persona, if prerendered. */
export async function resolveVoiceSampleUrl(voiceId: string): Promise<string | null> {
  const id = voiceId.trim();
  if (!id) return null;

  const manifest = await loadManifest();
  const fromManifest = manifest?.samples?.[id];
  if (fromManifest) return fromManifest;

  // Convention path — caller may probe with play; manifest is authoritative when present.
  if (manifest && Object.keys(manifest.samples).length > 0) return null;
  return samplePathForVoice(id);
}

/** Reset manifest cache (e.g. after batch prerender in dev). */
export function clearVoiceSampleManifestCache() {
  manifestPromise = null;
}
