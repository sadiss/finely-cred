import React from 'react';

type Props = {
  eyebrow?: string;
  /** Book/guide cover visual — a mockup component or an <img>. */
  book: React.ReactNode;
  /** Second visual slot (e.g. a real bundle screenshot). Falls back to a generated folio graphic using `folioTitle`/`folioPageLabels` when omitted. */
  bundle?: React.ReactNode;
  folioTitle?: string;
  folioPageLabels?: string[];
  /** Read / Download CTA row — equal-weight, distinct colors. */
  actions: React.ReactNode;
  helperText?: string;
  /** `dark` for hero panels on obsidian/navy backgrounds, `light` for white/slate panels. */
  theme?: 'dark' | 'light';
  className?: string;
};

function GeneratedFolio({ title, pageLabels }: { title?: string; pageLabels?: string[] }) {
  if (!title && !pageLabels?.length) return null;
  return (
    <div className="flex h-full flex-col justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 sm:p-6">
      {title ? <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">{title}</p> : null}
      <div className="space-y-2">
        {(pageLabels ?? []).map((label, i) => (
          <div
            key={label}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
            style={{ marginLeft: i * 10 }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Large two-sheet guide media: book cover + a second visual (real bundle image or
 * a generated folio graphic), paired with an equal-weight Read/Download action row.
 */
export function CareerGuideTwoSheetMedia({
  eyebrow,
  book,
  bundle,
  folioTitle,
  folioPageLabels,
  actions,
  helperText,
  theme = 'dark',
  className = '',
}: Props) {
  const dark = theme === 'dark';
  return (
    <div className={`space-y-5 ${className}`}>
      {eyebrow ? (
        <p className={`text-center text-[11px] font-bold uppercase tracking-widest lg:text-left ${dark ? 'text-white/50' : 'text-slate-500'}`}>
          {eyebrow}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        <div>{book}</div>
        <div>{bundle ?? <GeneratedFolio title={folioTitle} pageLabels={folioPageLabels} />}</div>
      </div>
      <div>{actions}</div>
      {helperText ? <p className={`text-xs leading-relaxed ${dark ? 'text-white/45' : 'text-slate-500'}`}>{helperText}</p> : null}
    </div>
  );
}
