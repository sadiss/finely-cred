import { resolveVoiceSampleUrl } from './voiceSampleCatalog';

let activeAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;

export function stopMediaPreview() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  activeUtterance = null;
}

export async function playSoundPreview(url: string): Promise<void> {
  stopMediaPreview();
  const audio = new Audio(url);
  audio.volume = 0.85;
  activeAudio = audio;
  await audio.play();
}

async function probeSampleUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'force-cache' });
    if (res.ok) return true;
    if (res.status === 405) {
      const getRes = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-1' }, cache: 'force-cache' });
      return getRes.ok;
    }
    return false;
  } catch {
    return false;
  }
}

function playBrowserVoicePreview(args: {
  text?: string;
  pitch?: number;
  rate?: number;
  gender?: 'masculine' | 'feminine' | 'neutral';
  onEnd?: () => void;
}): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const utter = new SpeechSynthesisUtterance(
    args.text ??
      'Welcome to Finely Cred. This is your selected voice persona for course narration and commercials.',
  );
  utter.rate = args.rate ?? 1;
  utter.pitch = args.pitch ?? 1;
  utter.onend = () => args.onEnd?.();
  utter.onerror = () => args.onEnd?.();

  const voices = window.speechSynthesis.getVoices();
  const prefer =
    args.gender === 'feminine'
      ? voices.find((v) => /female|woman|zira|samantha|jenny/i.test(v.name))
      : args.gender === 'masculine'
        ? voices.find((v) => /male|man|david|guy|ryan/i.test(v.name))
        : voices.find((v) => /english/i.test(v.name));
  if (prefer) utter.voice = prefer;

  activeUtterance = utter;
  window.speechSynthesis.speak(utter);
}

export type VoicePreviewMode = 'cached' | 'browser' | 'none';

/** Play cached ElevenLabs/Cartesia sample when available; fallback to browser TTS. */
export async function playVoicePreview(args: {
  voiceId?: string;
  sampleUrl?: string;
  text?: string;
  pitch?: number;
  rate?: number;
  gender?: 'masculine' | 'feminine' | 'neutral';
  onEnd?: () => void;
  /** When true, skip cached samples and use browser speechSynthesis only. */
  browserOnly?: boolean;
}): Promise<VoicePreviewMode> {
  stopMediaPreview();

  if (!args.browserOnly) {
    const candidate =
      args.sampleUrl ?? (args.voiceId ? await resolveVoiceSampleUrl(args.voiceId) : null);
    if (candidate) {
      const exists = await probeSampleUrl(candidate);
      if (exists) {
        try {
          const audio = new Audio(candidate);
          audio.volume = 0.9;
          audio.onended = () => args.onEnd?.();
          audio.onerror = () => args.onEnd?.();
          activeAudio = audio;
          await audio.play();
          return 'cached';
        } catch {
          /* fall through to browser preview */
        }
      }
    }
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    playBrowserVoicePreview(args);
    return 'browser';
  }

  args.onEnd?.();
  return 'none';
}
