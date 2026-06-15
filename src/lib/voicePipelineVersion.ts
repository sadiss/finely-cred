/** Voice pipeline version + cache invalidation (Phase 45). */
export const VOICE_PIPELINE_VERSION =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VOICE_PIPELINE_VERSION) || 'v1';

const VERSION_KEY = 'finely.voice_studio.pipeline_version.v1';

export function getStoredVoicePipelineVersion(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(VERSION_KEY) ?? '';
  } catch {
    return '';
  }
}

export function markVoicePipelineVersionStored() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VERSION_KEY, VOICE_PIPELINE_VERSION);
  } catch {
    // ignore
  }
}

export function voicePipelineVersionChanged(): boolean {
  const stored = getStoredVoicePipelineVersion();
  return Boolean(stored && stored !== VOICE_PIPELINE_VERSION);
}
