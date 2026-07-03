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

export function playVoicePreview(args: {
  text?: string;
  pitch?: number;
  rate?: number;
  gender?: 'masculine' | 'feminine' | 'neutral';
  onEnd?: () => void;
}): void {
  stopMediaPreview();
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const utter = new SpeechSynthesisUtterance(
    args.text ?? 'Welcome to Finely Cred. This is your selected voice persona for course narration and commercials.',
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
