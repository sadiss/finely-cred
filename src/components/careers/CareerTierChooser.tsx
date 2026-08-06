import React from 'react';
import { Check } from 'lucide-react';
import { careerAccentChip, careerAccentText, careerCardClass, type CareerAccent } from './careerUi';

export type { CareerAccent };

export type CareerChoiceOption = {
  id: string;
  /** Card headline. `title` is accepted as an alias. */
  name?: string;
  title?: string;
  /** Short label under the name, e.g. "Starter buy-in" or "20% upfront". `tagline` is an alias for `subtitle`. */
  subtitle?: string;
  tagline?: string;
  /** Longer explanatory line — shown under tagline/subtitle when both are present. */
  description?: string;
  /** Small badge, e.g. "Popular". `chip` is an alias for `badge`. */
  badge?: string;
  chip?: string;
  /** Headline economics line, e.g. "30–45% keep" or "$497". `priceLine` is an alias for `priceLabel`. */
  priceLabel?: string;
  priceLine?: string;
  /** Small caption under the price line. */
  priceHint?: string;
  bestFor?: string;
  /** Optional per-option override — lets one chooser show distinct tier accents instead of one uniform color. */
  accent?: CareerAccent;
};

/** Alias — some callers prefer this name for the option shape. */
export type CareerTierChooserOption = CareerChoiceOption;

type Props = {
  title?: string;
  heading?: string;
  subtitle?: string;
  subheading?: string;
  options: CareerChoiceOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Fallback accent for options that don't specify their own. */
  accent?: CareerAccent;
  columns?: 2 | 3 | 4 | 6;
  className?: string;
};

/** Clickable choice grid (buy-in tiers, capacity tiers, affiliate paths, specialist tiers). */
export function CareerTierChooser({
  title,
  heading,
  subtitle,
  subheading,
  options,
  selectedId,
  onSelect,
  accent: fallbackAccent = 'slate',
  columns = 3,
  className = '',
}: Props) {
  const headline = title ?? heading;
  const sub = subtitle ?? subheading;
  const colClass =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : columns === 6
          ? 'sm:grid-cols-3 lg:grid-cols-6'
          : 'sm:grid-cols-3';

  return (
    <div className={className}>
      {headline ? <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{headline}</h2> : null}
      {sub ? <p className="mt-2 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600">{sub}</p> : null}
      <div className={`mt-4 grid grid-cols-1 gap-3 sm:gap-4 ${colClass}`}>
        {options.map((opt) => {
          const accent = opt.accent ?? fallbackAccent;
          const selected = opt.id === selectedId;
          const optTitle = opt.name ?? opt.title ?? '';
          const optSubtitle = opt.subtitle ?? opt.tagline;
          const optBadge = opt.badge ?? opt.chip;
          const optPrice = opt.priceLabel ?? opt.priceLine;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              aria-pressed={selected}
              className={careerCardClass(accent, selected, 'w-full')}
            >
              {optBadge ? <span className={`absolute -top-2.5 right-4 ${careerAccentChip(accent)}`}>{optBadge}</span> : null}
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-slate-900">{optTitle}</span>
                {selected ? <Check size={16} className={`shrink-0 ${careerAccentText(accent)}`} /> : null}
              </div>
              {optSubtitle ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{optSubtitle}</p> : null}
              {opt.description ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{opt.description}</p> : null}
              {optPrice ? (
                <div className="mt-3">
                  <p className={`text-lg font-black ${careerAccentText(accent)}`}>{optPrice}</p>
                  {opt.priceHint ? <p className="text-[11px] text-slate-400">{opt.priceHint}</p> : null}
                </div>
              ) : null}
              {opt.bestFor ? <p className="mt-2 text-[11px] leading-relaxed text-slate-500">Best for: {opt.bestFor}</p> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CareerTierChooser;
