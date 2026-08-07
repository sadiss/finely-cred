import React from 'react';
import { Check } from 'lucide-react';
import { careerAccentText, type CareerAccent } from './careerUi';

export type CareerPackageBlock = {
  key: string;
  /** Overrides the default label lookup for `key`. */
  title?: string;
  items: string[];
};

const BLOCK_TITLES: Record<string, string> = {
  access: 'Access',
  education: 'Education',
  methods: 'Methods',
  tools: 'Tools',
  included: 'What you get',
  buyin: 'One-time buy-in',
  tier: 'This tier includes',
};

function blockTitle(block: CareerPackageBlock): string {
  if (block.title) return block.title;
  if (BLOCK_TITLES[block.key]) return BLOCK_TITLES[block.key]!;
  return block.key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

type Props = {
  /** Multi-block mode — a headline panel containing one card per bucket (Access/Education/Methods/Tools). */
  heading?: string;
  subheading?: string;
  blocks?: CareerPackageBlock[];
  /** Single-card mode — one bucket rendered as its own compact card (kicker + title + checklist). */
  kicker?: string;
  title?: string;
  included?: string[];
  accent?: CareerAccent;
  className?: string;
};

/**
 * "What you get" — supports two shapes:
 *  - Multi-block: pass `heading` + `blocks` for a full panel with one card per bucket.
 *  - Single-card: pass `kicker` + `title` + `included` to render one compact bucket card
 *    (drop several instances into your own grid for a multi-bucket layout).
 */
export function CareerPackagePanel({ heading, subheading, blocks, kicker, title, included, accent = 'slate', className = '' }: Props) {
  if (blocks?.length) {
    const visible = blocks.filter((b) => b.items?.length);
    if (!visible.length) return null;
    return (
      <div className={className}>
        {heading ? (
          <div className="max-w-2xl space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{heading}</h2>
            {subheading ? <p className="text-sm sm:text-base leading-relaxed text-slate-600">{subheading}</p> : null}
          </div>
        ) : null}
        <div className={`${heading ? 'mt-4' : ''} grid gap-3 sm:gap-4 ${visible.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {visible.map((block) => (
            <div key={block.key} className="rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-6">
              <p className={`text-[11px] font-black uppercase tracking-widest ${careerAccentText(accent)}`}>{blockTitle(block)}</p>
              <ul className="mt-3 space-y-2">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                    <Check size={15} className={`mt-0.5 shrink-0 ${careerAccentText(accent)}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!included?.length) return null;
  return (
    <div className={`rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-6 ${className}`}>
      {kicker ? <p className={`text-[11px] font-black uppercase tracking-widest ${careerAccentText(accent)}`}>{kicker}</p> : null}
      {title ? <p className="mt-1 text-sm font-bold text-slate-900">{title}</p> : null}
      <ul className="mt-3 space-y-2">
        {included.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
            <Check size={15} className={`mt-0.5 shrink-0 ${careerAccentText(accent)}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CareerPackagePanel;
