import React from 'react';
import { Mail } from 'lucide-react';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL } from '../../features/os/finelyOsLightUi';

/** Compact “Email partner” control for letter lifecycle actions. */
export function LetterEmailPartnerToggle({
  checked,
  onChange,
  disabled,
  hint,
  label = 'Email partner',
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  hint?: string;
  label?: string;
}) {
  return (
    <label
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
        checked
          ? 'border-emerald-400/45 bg-emerald-500/15 text-emerald-50'
          : 'border-white/12 bg-black/25 text-white/70'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'}`}
    >
      <input
        type="checkbox"
        className="accent-emerald-500"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <Mail size={14} className="shrink-0 opacity-80" />
      <span className="font-semibold">{label}</span>
      {hint ? <span className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal hidden sm:inline`}>{hint}</span> : null}
      {!hint ? (
        <span className={`${FINELY_OS_ENTITY_BODY} text-xs hidden md:inline`}>Notify when marked final / mailed</span>
      ) : null}
    </label>
  );
}
