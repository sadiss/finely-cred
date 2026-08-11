import React from 'react';
import type { Bureau } from '../../domain/creditReports';
import { bureauFullName, bureauShortCode } from '../../utils/bureaus';

const BUREAUS: Bureau[] = ['EXP', 'EQF', 'TUC'];

function bureauPanelStyles(b: Bureau, active: boolean, hasItems: boolean) {
  const base =
    'flex flex-col justify-between min-h-[8.5rem] sm:min-h-[9.5rem] rounded-2xl border-2 px-5 py-5 sm:py-6 text-left transition-all ' +
    (hasItems ? 'hover:scale-[1.02] active:scale-[0.99] cursor-pointer' : 'opacity-35 cursor-not-allowed');

  if (b === 'EXP') {
    return active
      ? `${base} border-sky-300 bg-sky-600/90 text-white shadow-[0_0_36px_-8px_rgba(56,189,248,0.7)] ring-2 ring-sky-200/60`
      : `${base} border-sky-500/50 bg-sky-950/70 text-sky-50 hover:border-sky-400`;
  }
  if (b === 'EQF') {
    return active
      ? `${base} border-rose-300 bg-rose-600/90 text-white shadow-[0_0_36px_-8px_rgba(244,63,94,0.65)] ring-2 ring-rose-200/60`
      : `${base} border-rose-500/50 bg-rose-950/70 text-rose-50 hover:border-rose-400`;
  }
  return active
    ? `${base} border-emerald-300 bg-emerald-600/90 text-white shadow-[0_0_36px_-8px_rgba(52,211,153,0.65)] ring-2 ring-emerald-200/60`
    : `${base} border-emerald-500/50 bg-emerald-950/70 text-emerald-50 hover:border-emerald-400`;
}

/** Full-width three-column bureau letter switcher — below the letter you are working on. */
export function LetterStudioBureauSwitcher({
  active,
  countsByBureau,
  onSelect,
  trailingActions,
}: {
  active: Bureau;
  countsByBureau: Record<Bureau, number>;
  onSelect: (b: Bureau) => void;
  /** Compact actions on the bureau switcher header row (e.g. attach screenshot). */
  trailingActions?: React.ReactNode;
}) {
  const withItems = BUREAUS.filter((b) => (countsByBureau[b] ?? 0) > 0);
  if (withItems.length < 2 && !trailingActions) return null;

  return (
    <section
      id="fc-bureau-letter-switcher"
      className="w-full mt-6 pt-6 border-t-2 border-white/20 space-y-4 scroll-mt-6"
      data-fc-bureau-switcher="1"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
            {withItems.length >= 2 ? 'Work on another bureau letter' : 'Bureau letter studio'}
          </h3>
          <p className="mt-1 text-sm text-white/65 max-w-3xl">
            {withItems.length >= 2
              ? 'One letter per bureau. Each block is a full studio — click to switch. Blue = Experian, Red = Equifax, Green = TransUnion.'
              : 'Attach bureau proof for this letter, then save PDF when you mail.'}
          </p>
        </div>
        {trailingActions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{trailingActions}</div> : null}
      </div>
      {withItems.length >= 2 ? (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {BUREAUS.map((b) => {
          const n = countsByBureau[b] ?? 0;
          const hasItems = n > 0;
          const on = b === active;
          return (
            <button
              key={b}
              type="button"
              disabled={!hasItems}
              onClick={() => {
                if (!hasItems) return;
                onSelect(b);
                requestAnimationFrame(() => {
                  document.getElementById('fc-focused-item')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
              }}
              className={bureauPanelStyles(b, on, hasItems)}
            >
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.2em] opacity-90">
                  {on ? 'You are here' : hasItems ? 'Open letter studio' : 'No items'}
                </div>
                <div className="text-xl sm:text-2xl font-black mt-2 leading-tight">{bureauFullName(b)}</div>
                <div className="text-sm font-semibold mt-2 opacity-90">
                  {hasItems ? `${n} negative${n === 1 ? '' : 's'}` : '—'} · {bureauShortCode(b)}
                </div>
              </div>
              <div className="mt-4 text-[11px] font-black uppercase tracking-wider">
                {on ? '● Active studio' : hasItems ? 'Tap to switch →' : 'Select disputes first'}
              </div>
            </button>
          );
        })}
      </div>
      ) : null}
    </section>
  );
}

/** @deprecated Use LetterStudioBureauSwitcher */
export function LetterStudioBureauQueue(props: {
  active: Bureau;
  countsByBureau: Record<Bureau, number>;
  onSelect: (b: Bureau) => void;
}) {
  return <LetterStudioBureauSwitcher {...props} />;
}

export function LetterStudioBureauAccordion(_props: {
  active: Bureau;
  countsByBureau: Record<Bureau, number>;
  expandedBureau: Bureau | null;
  onToggle: (b: Bureau) => void;
  onSelect: (b: Bureau) => void;
}) {
  return null;
}
