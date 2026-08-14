import React from 'react';
import { Mic, Square } from 'lucide-react';
import { useFinelyVoiceInput } from '../../hooks/useFinelyVoiceInput';
import { FINELY_OS_ENTITY_LABEL, finelyOsGlowField, type FinelyOsGlowAccent } from '../../features/os/finelyOsLightUi';

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  accent?: FinelyOsGlowAccent;
  /** Extra control shown next to the mic button — e.g. an "AI-draft" button. */
  rightSlot?: React.ReactNode;
};

/**
 * Agenda/notes textarea with an optional mic button that transcribes speech via the
 * Web Speech API into this *editable* field — never a raw audio blob. Feature-detects
 * browser support and hides the mic entirely when unavailable (Safari/older browsers)
 * instead of showing a broken control.
 */
export function VoiceTranscriptField({ label, value, onChange, placeholder, rows = 3, accent = 'violet', rightSlot }: Props) {
  const { supported, listening, interimTranscript, start, stop } = useFinelyVoiceInput({
    onResult: (text) => {
      const chunk = text.trim();
      if (!chunk) return;
      onChange(value.trim() ? `${value.trim()} ${chunk}` : chunk);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        {label ? <span className={FINELY_OS_ENTITY_LABEL}>{label}</span> : <span />}
        <div className="flex items-center gap-1.5">
          {rightSlot}
          {supported ? (
            <button
              type="button"
              onClick={() => (listening ? stop() : start())}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[9px] font-black uppercase tracking-widest transition-all ${
                listening
                  ? 'border-rose-400/50 bg-rose-500/15 text-rose-100 animate-pulse'
                  : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {listening ? <Square size={11} /> : <Mic size={11} />} {listening ? 'Stop' : 'Speak'}
            </button>
          ) : null}
        </div>
      </div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={finelyOsGlowField(accent, 'resize-y')}
      />
      {listening ? (
        <div className="mt-1 text-[10px] text-white/45 italic">
          Listening… {interimTranscript || 'speak your agenda'} — it will drop into the field above, editable before you submit.
        </div>
      ) : null}
    </div>
  );
}
