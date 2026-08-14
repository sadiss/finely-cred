import React from 'react';
import { Mic, Square } from 'lucide-react';
import { useFinelyVoiceInput } from '../../hooks/useFinelyVoiceInput';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  finelyOsGlowField,
} from '../../features/os/finelyOsLightUi';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
  compact?: boolean;
};

/**
 * Editable meeting notes with optional speech → text (never raw audio).
 * Used during and after calls — not on booking forms.
 */
export function MeetingNotesEditor({
  value,
  onChange,
  placeholder = 'Action items, follow-ups, dispute notes…',
  rows = 4,
  hint,
  compact,
}: Props) {
  const appendChunk = (text: string) => {
    const chunk = text.trim();
    if (!chunk) return;
    onChange(value.trim() ? `${value.trim()} ${chunk}` : chunk);
  };

  const { supported, listening, interimTranscript, start, stop } = useFinelyVoiceInput({
    onResult: appendChunk,
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Meeting notes</span>
        {supported ? (
          <button
            type="button"
            onClick={() => (listening ? stop() : start())}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${
              listening
                ? 'border-rose-400/50 bg-rose-500/15 text-rose-100 animate-pulse'
                : 'border-violet-400/40 bg-violet-500/10 text-violet-100 hover:bg-violet-500/15'
            }`}
          >
            {listening ? <Square size={11} /> : <Mic size={11} />}
            {listening ? 'Stop' : 'Speak → notes'}
          </button>
        ) : (
          <span className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>Type below — voice-to-text unavailable.</span>
        )}
      </div>

      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={
          compact
            ? `${FINELY_OS_ENTITY_INPUT} min-h-[80px] resize-y w-full`
            : finelyOsGlowField('violet', 'resize-y w-full min-h-[96px]')
        }
      />

      {listening ? (
        <p className={`text-[10px] italic ${FINELY_OS_ENTITY_BODY}`}>
          Listening… {interimTranscript || 'speak now'} — text lands in notes. Edit before you save.
        </p>
      ) : hint ? (
        <p className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>{hint}</p>
      ) : (
        <p className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
          Voice becomes editable text only — not a recording. Tap Speak, then edit before saving.
        </p>
      )}
    </div>
  );
}
