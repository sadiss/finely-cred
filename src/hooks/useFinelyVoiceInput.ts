import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionResultLike = {
  isFinal?: boolean;
  0?: { transcript?: string };
};
type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
  resultIndex: number;
};
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type FinelyVoiceInputOptions = {
  /** Called with the final transcript chunk when recognition completes a phrase. */
  onResult?: (text: string) => void;
  /** Called on every interim/final chunk — use for live typewriter in the composer. */
  onInterim?: (text: string, isFinal: boolean) => void;
  /** Browser speech-recognition locale, for example `en-US` or `ht-HT`. */
  lang?: string;
};

/** Legacy signature: useFinelyVoiceInput(onResult) */
export function useFinelyVoiceInput(onResult: (text: string) => void): ReturnType<typeof useFinelyVoiceInputHook>;
export function useFinelyVoiceInput(options: FinelyVoiceInputOptions): ReturnType<typeof useFinelyVoiceInputHook>;
export function useFinelyVoiceInput(
  arg: ((text: string) => void) | FinelyVoiceInputOptions,
): ReturnType<typeof useFinelyVoiceInputHook> {
  const options: FinelyVoiceInputOptions = typeof arg === 'function' ? { onResult: arg } : arg;
  return useFinelyVoiceInputHook(options);
}

function useFinelyVoiceInputHook(options: FinelyVoiceInputOptions) {
  const { onResult, onInterim, lang } = options;
  const onResultRef = useRef(onResult);
  const onInterimRef = useRef(onInterim);
  const langRef = useRef(lang);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    onResultRef.current = onResult;
    onInterimRef.current = onInterim;
    langRef.current = lang;
  }, [onResult, onInterim, lang]);

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()));
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
    setInterimTranscript('');
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    stop();
    const rec = new Ctor();
    rec.lang = langRef.current ?? 'en-US';
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;
    rec.onresult = (ev) => {
      let interim = '';
      let finalText = '';
      for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
        const result = ev.results[i];
        const chunk = result?.[0]?.transcript?.trim() ?? '';
        if (!chunk) continue;
        if (result.isFinal) finalText = finalText ? `${finalText} ${chunk}` : chunk;
        else interim = interim ? `${interim} ${chunk}` : chunk;
      }
      if (interim) {
        setInterimTranscript(interim);
        onInterimRef.current?.(interim, false);
      }
      if (finalText) {
        setInterimTranscript('');
        onInterimRef.current?.(finalText, true);
        onResultRef.current?.(finalText);
      }
    };
    rec.onend = () => {
      setListening(false);
      setInterimTranscript('');
    };
    rec.onerror = () => {
      setListening(false);
      setInterimTranscript('');
    };
    recRef.current = rec;
    setListening(true);
    setInterimTranscript('');
    rec.start();
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  return { supported, listening, interimTranscript, start, stop };
}

export function speakFinelyText(text: string, lang = 'en-US') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = 0.92;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
}
