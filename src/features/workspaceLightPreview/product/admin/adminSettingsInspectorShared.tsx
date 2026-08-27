import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';

export function StatusBadge({ status }: { status: 'not_configured' | 'test_mode' | 'live' }) {
  const colors = {
    not_configured: finelyOsStatusChip('warn'),
    test_mode: finelyOsStatusChip('warn'),
    live: finelyOsStatusChip('ok'),
  };
  const labels = {
    not_configured: 'Not Configured',
    test_mode: 'Test Mode',
    live: 'Live',
  };
  return <span className={colors[status]}>{labels[status]}</span>;
}

export function SecretInput({
  label,
  value,
  onChange,
  placeholder,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helperText?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1">
      <label className={FINELY_OS_ENTITY_SUBLABEL}>{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${FINELY_OS_ENTITY_INPUT} pr-10 font-mono`}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal hover:text-[color:var(--fc-os-entity-ink)]`}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {helperText && <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{helperText}</p>}
    </div>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helperText?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className={FINELY_OS_ENTITY_SUBLABEL}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={FINELY_OS_ENTITY_INPUT}
      />
      {helperText && <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{helperText}</p>}
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-emerald-500' : 'bg-white/20'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
      <div className="flex-1">
        <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{label}</div>
        {description && <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-0.5`}>{description}</div>}
      </div>
    </div>
  );
}
