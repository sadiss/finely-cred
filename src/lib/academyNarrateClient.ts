/**
 * Academy narration — separate from Media Studio voice pipeline.
 * Prefer optional HTTP TTS (Edge TTS / Piper hook via env). Browser speechSynthesis is last resort.
 */

export type AcademyNarrateLang = 'en' | 'ht';

const NARRATE_URL = (import.meta.env.VITE_ACADEMY_NARRATE_URL as string | undefined)?.trim() || '';

export function academyNarrateConfigured(): boolean {
  return Boolean(NARRATE_URL);
}

export function academySpeechSynthesisAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Play via configured edge endpoint (returns audio blob URL). */
export async function narrateViaProvider(text: string, lang: AcademyNarrateLang): Promise<string | null> {
  if (!NARRATE_URL) return null;
  try {
    const res = await fetch(NARRATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 8000), lang }),
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.size) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

let speaking = false;

export function stopAcademySpeech() {
  if (academySpeechSynthesisAvailable()) {
    window.speechSynthesis.cancel();
  }
  speaking = false;
}

/** Last-resort browser voice — often robotic; academy UI labels this clearly. */
export function narrateViaBrowser(text: string, lang: AcademyNarrateLang): boolean {
  if (!academySpeechSynthesisAvailable()) return false;
  stopAcademySpeech();
  const u = new SpeechSynthesisUtterance(text.slice(0, 4000));
  u.lang = lang === 'ht' ? 'fr-HT' : 'en-US';
  u.rate = 0.95;
  u.onend = () => {
    speaking = false;
  };
  speaking = true;
  window.speechSynthesis.speak(u);
  return true;
}

export function isAcademySpeaking() {
  return speaking;
}
