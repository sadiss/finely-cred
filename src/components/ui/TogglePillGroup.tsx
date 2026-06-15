import React from 'react';

type Option<T extends string> = { id: T; label: string; hint?: string };

type Props<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T | T[];
  onChange: (value: T | T[]) => void;
  multiple?: boolean;
  variant?: 'amber' | 'emerald' | 'white';
};

function pillClass(active: boolean, variant: 'amber' | 'emerald' | 'white') {
  if (active) {
    if (variant === 'emerald') return 'fc-toggle-pill fc-toggle-pill-on-emerald';
    if (variant === 'white') return 'fc-toggle-pill fc-toggle-pill-on-white';
    return 'fc-toggle-pill fc-toggle-pill-on';
  }
  return 'fc-toggle-pill';
}

/** High-contrast toggle pills — active state is obvious (white/amber/emerald). */
export function TogglePillGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  multiple,
  variant = 'amber',
}: Props<T>) {
  const isActive = (id: T) => (Array.isArray(value) ? value.includes(id) : value === id);

  const toggle = (id: T) => {
    if (multiple && Array.isArray(value)) {
      onChange(isActive(id) ? (value.filter((x) => x !== id) as T[]) : ([...value, id] as T[]));
    } else {
      onChange(id);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-black uppercase tracking-widest text-white/80">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            title={opt.hint}
            className={pillClass(isActive(opt.id), variant)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
