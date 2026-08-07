import React from 'react';
import { FINELY_OS_COMPACT_TEXTAREA, FINELY_OS_FIELD_WIDTH } from '../../features/os/finelyOsLightUi';

type Props = {
  value: string;
  onChange: (next: string) => void;
  label?: string;
  placeholder?: string;
  id?: string;
};

/** Compact optional note → PartnerNotes on Save / Mail */
export function LetterPartnerNoteField({
  value,
  onChange,
  label = 'Optional partner note',
  placeholder = 'Add a note to the partner record (saved with this letter action)…',
  id = 'letter-partner-note',
}: Props) {
  return (
    <label className={`block ${FINELY_OS_FIELD_WIDTH}`} htmlFor={id}>
      <span className="text-[10px] font-black uppercase tracking-widest text-white/45">{label}</span>
      <textarea
        id={id}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${FINELY_OS_COMPACT_TEXTAREA} mt-1.5 w-full`}
      />
    </label>
  );
}
