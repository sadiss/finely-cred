import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { FINELY_OS_NOTICE_ERROR, FINELY_OS_SECONDARY_BTN, finelyOsStatusChip } from '../../os/finelyOsLightUi';

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: SpeechRecognitionResultList }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecCtor = new () => SpeechRec;

function getSpeechRecognition(): SpeechRecCtor | null {
  const w = window as Window & { SpeechRecognition?: SpeechRecCtor; webkitSpeechRecognition?: SpeechRecCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function parseVoiceToTask(text: string): { title: string; notes?: string } {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (!cleaned) return { title: 'Voice task' };
  const firstSentence = cleaned.split(/[.!?]/)[0]?.trim() || cleaned;
  const title = firstSentence.length > 100 ? `${firstSentence.slice(0, 97)}…` : firstSentence;
  const notes = cleaned.length > title.length ? cleaned : undefined;
  return { title: title || 'Voice task', notes };
}

export function VoiceToTaskButton({
  onCapture,
  disabled,
}: {
  onCapture: (payload: { title: string; notes?: string; raw: string }) => void;
  disabled?: boolean;
}) {
  const [listening, setListening] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const recRef = useRef<SpeechRec | null>(null);

  const supported = typeof window !== 'undefined' && Boolean(getSpeechRecognition());

  const stop = useCallback(() => {
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const start = () => {
    setErr(null);
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setErr('Speech recognition not supported in this browser.');
      return;
    }
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev) => {
      const raw = ev.results[0]?.[0]?.transcript?.trim() ?? '';
      if (raw) onCapture({ ...parseVoiceToTask(raw), raw });
      stop();
    };
    rec.onerror = () => {
      setErr('Could not capture voice. Try again or type the task.');
      stop();
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  if (!supported) return null;

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => (listening ? stop() : start())}
        className={
          listening
            ? `${finelyOsStatusChip('blocked')} !px-4 !py-2 animate-pulse`
            : FINELY_OS_SECONDARY_BTN
        }
        title="Voice to task — speak title and details"
      >
        {listening ? <MicOff size={14} /> : <Mic size={14} />}
        {listening ? 'Stop' : 'Voice task'}
      </button>
      {err ? <span className={`text-[10px] max-w-[200px] text-right ${FINELY_OS_NOTICE_ERROR} !p-2`}>{err}</span> : null}
    </div>
  );
}
