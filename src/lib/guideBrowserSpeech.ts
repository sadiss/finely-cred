import type { GuideNarration } from '../resources/guideNarration';
import { narrationToNaturalSpeechText } from '../resources/guideNarration';
import type { NarrationSegment } from '../resources/guideNarration';

export type GuideSpeechVoice = SpeechSynthesisVoice | null;

const VOICE_PATTERNS = [
  /Microsoft (Aria|Jenny|Guy|Zira|David)/i,
  /Google US English/i,
  /Samantha|Daniel|Karen|Moira|Alex/i,
  /Natural/i,
  /Neural/i,
];

let activeSession = 0;

export function pickGuideSpeechVoice(voices: SpeechSynthesisVoice[] = getSpeechVoices()): GuideSpeechVoice {
  if (!voices.length) return null;
  for (const pattern of VOICE_PATTERNS) {
    const hit = voices.find((v) => pattern.test(v.name) && v.lang.toLowerCase().startsWith('en'));
    if (hit) return hit;
  }
  return voices.find((v) => v.lang.toLowerCase().startsWith('en')) ?? voices[0] ?? null;
}

export function getSpeechVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices() ?? [];
}

/** Chrome and Edge lazy-load voices; retry on user gesture. */
export async function ensureGuideSpeechVoices(timeoutMs = 2500): Promise<GuideSpeechVoice> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  const synth = window.speechSynthesis;
  let voice = pickGuideSpeechVoice();
  if (voice) return voice;

  await new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      synth.removeEventListener('voiceschanged', onChange);
      resolve();
    };
    const onChange = () => {
      voice = pickGuideSpeechVoice();
      if (voice) finish();
    };
    synth.addEventListener('voiceschanged', onChange);
    window.setTimeout(finish, timeoutMs);
    synth.getVoices();
  });

  return pickGuideSpeechVoice();
}

function pause(ms: number, signal: { cancelled: boolean }) {
  if (!ms || signal.cancelled) return Promise.resolve();
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

/** Natural single-utterance read — avoids robotic segment breaks and repeats. */
export async function speakGuideNaturalText(args: {
  narration: GuideNarration;
  voice: GuideSpeechVoice;
  signal: { cancelled: boolean };
  rate?: number;
}): Promise<void> {
  const synth = window.speechSynthesis;
  if (!synth) throw new Error('This browser does not support narration playback.');

  const session = ++activeSession;
  synth.cancel();
  await pause(80, args.signal);

  const text = narrationToNaturalSpeechText(args.narration);
  if (!text || args.signal.cancelled || session !== activeSession) return;

  await new Promise<void>((resolve, reject) => {
    const utter = new SpeechSynthesisUtterance(text);
    if (args.voice) utter.voice = args.voice;
    utter.rate = args.rate ?? 0.93;
    utter.pitch = 1;
    utter.volume = 1;

    const resumeTimer = window.setInterval(() => {
      if (args.signal.cancelled || session !== activeSession) {
        window.clearInterval(resumeTimer);
        synth.cancel();
        resolve();
        return;
      }
      if (synth.paused) synth.resume();
    }, 300);

    utter.onend = () => {
      window.clearInterval(resumeTimer);
      resolve();
    };
    utter.onerror = (event) => {
      window.clearInterval(resumeTimer);
      if (args.signal.cancelled || session !== activeSession || event.error === 'interrupted') {
        resolve();
        return;
      }
      reject(new Error(event.error || 'Speech playback failed.'));
    };
    synth.speak(utter);
  });
}

/** @deprecated Prefer speakGuideNaturalText for browser preview. */
export async function speakGuideSegments(args: {
  segments: NarrationSegment[];
  voice: GuideSpeechVoice;
  startIndex?: number;
  onIndex?: (index: number) => void;
  signal: { cancelled: boolean };
}): Promise<void> {
  const synth = window.speechSynthesis;
  if (!synth) throw new Error('This browser does not support narration playback.');

  const session = ++activeSession;
  synth.cancel();
  await pause(60, args.signal);

  const start = args.startIndex ?? 0;
  for (let i = start; i < args.segments.length; i += 1) {
    if (args.signal.cancelled || session !== activeSession) return;
    args.onIndex?.(i);

    const seg = args.segments[i];
    if (!seg?.text?.trim()) {
      await pause(seg?.pauseMs ?? 400, args.signal);
      continue;
    }

    await new Promise<void>((resolve, reject) => {
      const utter = new SpeechSynthesisUtterance(seg.text);
      if (args.voice) utter.voice = args.voice;
      utter.rate = seg.rate ?? 0.94;
      utter.pitch = 1;
      utter.volume = 1;

      const resumeTimer = window.setInterval(() => {
        if (args.signal.cancelled || session !== activeSession) {
          window.clearInterval(resumeTimer);
          synth.cancel();
          resolve();
          return;
        }
        if (synth.paused) synth.resume();
      }, 250);

      utter.onend = () => {
        window.clearInterval(resumeTimer);
        resolve();
      };
      utter.onerror = (event) => {
        window.clearInterval(resumeTimer);
        if (args.signal.cancelled || session !== activeSession || event.error === 'interrupted') {
          resolve();
          return;
        }
        reject(new Error(event.error || 'Speech playback failed.'));
      };
      synth.speak(utter);
    });

    await pause(seg.pauseMs ?? 700, args.signal);
  }
}

export function pauseGuideSpeech() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.pause();
}

export function resumeGuideSpeech() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.resume();
}

export function isGuideSpeechPaused() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  return window.speechSynthesis.paused;
}

export function isGuideSpeechActive() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  const synth = window.speechSynthesis;
  return synth.speaking || synth.pending;
}

export function stopGuideSpeech() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  activeSession += 1;
  window.speechSynthesis.cancel();
}
