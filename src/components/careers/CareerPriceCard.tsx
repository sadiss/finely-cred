import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { careerAccentChip, careerAccentText, careerCardClass, type CareerAccent } from './careerUi';

export type CareerPriceCardOption = {
  id: string;
  name: string;
  tagline?: string;
  /** Small badge, e.g. "Popular" or "White-Label". */
  badge?: string;
  /** Price hero — e.g. "$1,000". */
  priceLabel: string;
  /** Small caption under the price, e.g. "one-time buy-in". */
  priceSubLabel?: string;
  /** 3–4 short facts — seats, files, white-label depth, keep %. Extra items are hidden, not scrolled. */
  bullets: string[];
  accent?: CareerAccent;
};

type Props = {
  options: CareerPriceCardOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Max columns at desktop width — always 1 column on phone, 2 on tablet. */
  columns?: 2 | 3 | 4;
  maxBullets?: number;
  className?: string;
};

/**
 * Luxury "product card" choice grid — price hero + a short bullet list, for choices with
 * serious price tags (agency buy-ins, big one-time packages, specialist revenue-share tiers).
 * Unlike `CareerTierChooser`'s compact tiles, these are built to stand alone as the primary
 * decision on the page — always 1 → 2 → 3/4 columns so cards never crush into a spreadsheet
 * on phone.
 */
export function CareerPriceCardGrid({ options, selectedId, onSelect, columns = 3, maxBullets = 4, className = '' }: Props) {
  const colClass =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid grid-cols-1 gap-4 sm:gap-5 ${colClass} ${className}`}>
      {options.map((opt) => {
        const accent = opt.accent ?? 'slate';
        const selected = opt.id === selectedId;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            aria-pressed={selected}
            className={careerCardClass(accent, selected, 'w-full flex flex-col')}
          >
            {opt.badge ? (
              <span className={`absolute -top-2.5 left-5 ${careerAccentChip(accent)}`}>{opt.badge}</span>
            ) : null}

            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-lg font-black text-slate-900">{opt.name}</p>
                {opt.tagline ? <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{opt.tagline}</p> : null}
              </div>
              {selected ? (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-900 text-white">
                  <Check size={13} />
                </span>
              ) : null}
            </div>

            <div className="mt-4">
              <span className={`text-3xl font-black tracking-tight ${careerAccentText(accent)}`}>{opt.priceLabel}</span>
              {opt.priceSubLabel ? (
                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{opt.priceSubLabel}</p>
              ) : null}
            </div>

            <ul className="mt-4 flex-1 space-y-1.5">
              {opt.bullets.slice(0, maxBullets).map((b) => (
                <li key={b} className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                  <Check size={13} className={`mt-0.5 shrink-0 ${careerAccentText(accent)}`} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div
              className={`mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-wide ${
                selected ? 'bg-slate-900 text-white' : 'border-2 border-slate-200 text-slate-600 group-hover:border-slate-300'
              }`}
            >
              {selected ? 'Selected' : 'Select'}
              {!selected ? <ArrowRight size={12} /> : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default CareerPriceCardGrid;
