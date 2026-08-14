import React, { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { useFinelyVoiceInput } from '../../hooks/useFinelyVoiceInput';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_LABEL,
  finelyOsGlowField,
  finelyOsGlowTile,
  type FinelyOsGlowAccent,
} from '../../features/os/finelyOsLightUi';

export type VoiceDictationTarget = 'agenda' | 'details';

type FieldConfig = {
  id: VoiceDictationTarget;
  label: string;
  placeholder: string;
  rows: number;
  accent: FinelyOsGlowAccent;
};

const FIELDS: FieldConfig[] = [
  {
    id: 'agenda',
    label: 'Meeting agenda',
    placeholder: 'What we should cover on the call…',
    rows: 2,
    accent: 'violet',
  },
  {
    id: 'details',
    label: 'More details',
    placeholder: 'Timeline, documents, urgency, context…',
    rows: 2,
    accent: 'sky',
  },
];

type Props = {
  agenda: string;
  details: string;
  onAgendaChange: (v: string) => void;
  onDetailsChange: (v: string) => void;
  agendaRightSlot?: React.ReactNode;
};

/**
 * Speech → editable text (never raw audio). Partner picks which field the mic fills.
 * Notes are intentionally excluded — live/post-meeting notes belong in the meeting room.
 */
export function VoiceDictationChooser({ agenda, details, onAgendaChange, onDetailsChange, agendaRightSlot }: Props) {
  const [target, setTarget] = useState<VoiceDictationTarget>('agenda');

  const appendToTarget = (text: string) => {
    const chunk = text.trim();
    if (!chunk) return;
    if (target === 'agenda') {
      onAgendaChange(agenda.trim() ? `${agenda.trim()} ${chunk}` : chunk);
    } else {
      onDetailsChange(details.trim() ? `${details.trim()} ${chunk}` : chunk);
    }
  };

  const { supported, listening, interimTranscript, start, stop } = useFinelyVoiceInput({
    onResult: appendToTarget,
  });

  const activeField = FIELDS.find((f) => f.id === target)!;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={FINELY_OS_ENTITY_LABEL}>Tell us in your own words</span>
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
            {listening ? 'Stop' : `Speak → ${activeField.label}`}
          </button>
        ) : (
          <span className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>Type below — voice-to-text unavailable in this browser.</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FIELDS.map((f) => {
          const active = f.id === target;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setTarget(f.id)}
              className={`px-2.5 py-1.5 text-[10px] font-bold ${finelyOsGlowTile(active ? f.accent : 'sky', active)}`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {FIELDS.map((f) => (
        <div key={f.id} className={f.id === target ? 'block' : 'hidden'}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={FINELY_OS_ENTITY_LABEL}>{f.label}</span>
            {f.id === 'agenda' ? agendaRightSlot : null}
          </div>
          <textarea
            rows={f.rows}
            value={f.id === 'agenda' ? agenda : details}
            onChange={(e) => (f.id === 'agenda' ? onAgendaChange(e.target.value) : onDetailsChange(e.target.value))}
            placeholder={f.placeholder}
            className={finelyOsGlowField(f.accent, 'resize-y w-full')}
          />
        </div>
      ))}

      {listening ? (
        <p className={`text-[10px] italic ${FINELY_OS_ENTITY_BODY}`}>
          Listening… {interimTranscript || 'speak now'} — text lands in <strong>{activeField.label}</strong>. Edit before you submit.
        </p>
      ) : (
        <p className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
          Voice becomes editable text only — not a recording. Choose Agenda or More details, then tap Speak.
        </p>
      )}
    </div>
  );
}
