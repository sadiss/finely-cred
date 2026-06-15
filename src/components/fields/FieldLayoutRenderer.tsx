import React, { useMemo } from 'react';
import type { CustomFieldDefinition } from '../../domain/customFields';
import type { FieldLayout } from '../../domain/fieldLayouts';

function commonInputClass() {
  return 'mt-2 w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors';
}

function FieldInput(args: {
  def: CustomFieldDefinition;
  value: any;
  onChange: (next: any, persist: boolean) => void;
}) {
  const { def, value, onChange } = args;
  const cls = commonInputClass();

  if (def.type === 'textarea' || def.type === 'json') {
    return (
      <textarea
        value={typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value, null, 2)}
        onChange={(e) => onChange(e.target.value, false)}
        onBlur={(e) => onChange(e.target.value, true)}
        rows={def.type === 'json' ? 6 : 4}
        className={cls}
        placeholder={def.type === 'json' ? '{ "example": true }' : 'Enter text…'}
      />
    );
  }
  if (def.type === 'number') {
    return (
      <input
        type="number"
        value={value == null ? '' : String(value)}
        onChange={(e) => onChange(e.target.value, false)}
        onBlur={(e) => onChange(e.target.value, true)}
        className={cls}
        placeholder="0"
      />
    );
  }
  if (def.type === 'date') {
    return (
      <input
        type="date"
        value={value == null ? '' : String(value)}
        onChange={(e) => onChange(e.target.value, true)}
        className={cls}
      />
    );
  }
  if (def.type === 'boolean') {
    return (
      <label className="mt-3 inline-flex items-center gap-3 text-white/70">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked, true)}
          className="accent-amber-500"
        />
        <span className="text-sm">{Boolean(value) ? 'Yes' : 'No'}</span>
      </label>
    );
  }
  if (def.type === 'select') {
    return (
      <select value={value == null ? '' : String(value)} onChange={(e) => onChange(e.target.value, true)} className={cls}>
        <option value="">Select…</option>
        {(def.options ?? []).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  if (def.type === 'multiselect') {
    return (
      <select
        multiple
        value={Array.isArray(value) ? (value as string[]) : []}
        onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((o) => o.value), true)}
        className={cls}
      >
        {(def.options ?? []).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      value={value == null ? '' : String(value)}
      onChange={(e) => onChange(e.target.value, false)}
      onBlur={(e) => onChange(e.target.value, true)}
      className={cls}
      placeholder="Enter value…"
    />
  );
}

export function FieldLayoutRenderer(args: {
  layout: FieldLayout | null;
  definitions: CustomFieldDefinition[];
  values: Record<string, any>;
  onChangeValue: (key: string, next: any, persist: boolean) => void;
}) {
  const defsById = useMemo(() => new Map(args.definitions.map((d) => [d.id, d])), [args.definitions]);
  const placed = new Set<string>();
  const hidden = new Set<string>(args.layout?.hiddenFieldIds ?? []);

  const sections =
    args.layout?.sections?.length
      ? args.layout.sections
      : [{ id: 'main', title: 'Fields', fieldIds: args.definitions.map((d) => d.id) }];

  // collect placed
  for (const s of sections) for (const id of s.fieldIds) placed.add(id);

  const unplaced = args.definitions.filter((d) => !placed.has(d.id));

  return (
    <div className="space-y-6">
      {sections.map((s) => {
        const fieldDefs = s.fieldIds.map((id) => defsById.get(id) ?? null).filter(Boolean) as CustomFieldDefinition[];
        const visible = fieldDefs.filter((d) => !hidden.has(d.id));
        if (visible.length === 0) return null;
        return (
          <div key={s.id} className="fc-light-glass-panel fc-light-chrome-panel p-5">
            <div className="text-[10px] uppercase tracking-widest text-white/40">{s.title}</div>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              {visible.map((def) => {
                const v = args.values?.[def.key];
                return (
                  <div key={def.id} className="rounded-2xl border border-white/[0.08] bg-fc-input p-4">
                    <div className="text-white/85 font-semibold">{def.label}</div>
                    {def.helpText ? <div className="mt-1 text-white/45 text-xs">{def.helpText}</div> : null}
                    <FieldInput def={def} value={v} onChange={(next, persist) => args.onChangeValue(def.key, next, persist)} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {unplaced.length ? (
        <details className="fc-light-glass-panel fc-light-chrome-panel p-5">
          <summary className="cursor-pointer select-none text-white/70 font-semibold">
            Unplaced fields ({unplaced.length})
          </summary>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            {unplaced
              .filter((d) => !hidden.has(d.id))
              .map((def) => {
                const v = args.values?.[def.key];
                return (
                  <div key={def.id} className="rounded-2xl border border-white/[0.08] bg-fc-input p-4">
                    <div className="text-white/85 font-semibold">{def.label}</div>
                    {def.helpText ? <div className="mt-1 text-white/45 text-xs">{def.helpText}</div> : null}
                    <FieldInput def={def} value={v} onChange={(next, persist) => args.onChangeValue(def.key, next, persist)} />
                  </div>
                );
              })}
          </div>
        </details>
      ) : null}
    </div>
  );
}

