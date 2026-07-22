import React from 'react';
import type { Bureau } from '../../domain/creditReports';
import { bureauFullName } from '../../utils/bureaus';
import {
  LETTER_L4_BUREAU_META,
  LETTER_L4_BUREAU_NAME,
  LETTER_L4_BUREAU_TAB,
} from './letterEasyFlowTokens';

const BUREAU_ACCENTS: Record<
  Bureau,
  { code: string; selected: string; idle: string; muted: string; badge: string }
> = {
  EXP: {
    code: 'EXP',
    selected: 'border-sky-400/55 bg-sky-500/20 text-white shadow-[0_0_24px_-8px_rgba(56,189,248,0.7)]',
    idle: 'border-sky-400/25 bg-sky-500/10 text-sky-50 hover:border-sky-400/40',
    muted: 'border-white/10 bg-black/20 text-white/40',
    badge: 'bg-sky-500/25 text-sky-100 border-sky-400/30',
  },
  EQF: {
    code: 'EQF',
    selected: 'border-violet-400/55 bg-violet-500/20 text-white shadow-[0_0_24px_-8px_rgba(167,139,250,0.7)]',
    idle: 'border-violet-400/25 bg-violet-500/10 text-violet-50 hover:border-violet-400/40',
    muted: 'border-white/10 bg-black/20 text-white/40',
    badge: 'bg-violet-500/25 text-violet-100 border-violet-400/30',
  },
  TUC: {
    code: 'TUC',
    selected: 'border-fuchsia-400/55 bg-fuchsia-500/20 text-white shadow-[0_0_24px_-8px_rgba(232,121,249,0.7)]',
    idle: 'border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-50 hover:border-fuchsia-400/40',
    muted: 'border-white/10 bg-black/20 text-white/40',
    badge: 'bg-fuchsia-500/25 text-fuchsia-100 border-fuchsia-400/30',
  },
};

export function LetterBureauTabs({
  active,
  counts,
  missingEvidence,
  onChange,
  onlyWithItems,
}: {
  active: Bureau;
  counts: Record<Bureau, number>;
  /** Per-bureau count of selected disputes missing evidence (optional). */
  missingEvidence?: Record<Bureau, number>;
  onChange: (b: Bureau) => void;
  /** When true, hide bureaus with 0 items (unless all are 0 — then show all muted). */
  onlyWithItems?: boolean;
}) {
  const all: Bureau[] = ['EXP', 'EQF', 'TUC'];
  const anyItems = all.some((b) => (counts[b] ?? 0) > 0);
  const visible = onlyWithItems && anyItems ? all : all;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="tablist" aria-label="Credit bureau letters">
      {visible.map((b) => {
        const selected = active === b;
        const n = counts[b] ?? 0;
        const missing = missingEvidence?.[b] ?? 0;
        const accent = BUREAU_ACCENTS[b];
        const chrome = selected ? accent.selected : n === 0 ? accent.muted : accent.idle;
        return (
          <button
            key={b}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(b)}
            className={`${LETTER_L4_BUREAU_TAB} ${chrome}`}
          >
            <div className="flex items-center gap-2">
              <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-black tracking-widest ${accent.badge}`}>
                {accent.code}
              </span>
              <div className={LETTER_L4_BUREAU_NAME}>{bureauFullName(b)}</div>
            </div>
            <div className={LETTER_L4_BUREAU_META}>
              {n === 0
                ? 'No items yet'
                : `${n} dispute${n === 1 ? '' : 's'}${missing > 0 ? ` · ${missing} missing evidence` : ''}`}
            </div>
          </button>
        );
      })}
    </div>
  );
}
