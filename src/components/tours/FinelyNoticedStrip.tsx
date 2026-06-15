import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { finelyOsCatalogCard } from '../../features/os/finelyOsLightUi';
import type { FinelyNoticedItem, FinelyNoticedTone } from '../../lib/finelyProactiveSignals';

const TONE_ACCENT: Record<FinelyNoticedTone, 'amber' | 'sky' | 'emerald'> = {
  warn: 'amber',
  info: 'sky',
  success: 'emerald',
};

function ToneIcon({ tone }: { tone: FinelyNoticedTone }) {
  if (tone === 'warn') return <AlertTriangle size={18} className="text-amber-300" />;
  if (tone === 'success') return <CheckCircle2 size={18} className="text-emerald-300" />;
  return <Sparkles size={18} className="text-sky-300" />;
}

type Props = {
  items: FinelyNoticedItem[];
  title?: string;
  className?: string;
};

/**
 * "Finely noticed…" — proactive next-best-action (Launch Part E3).
 * Each row: plain-English nudge + one big button. Senior-simple.
 */
export function FinelyNoticedStrip({ items, title = 'Finely noticed', className = '' }: Props) {
  const navigate = useNavigate();
  if (!items.length) return null;

  return (
    <div className={`fc-senior-simple space-y-3 ${className}`} data-fc-noticed-strip="1">
      <div className="flex items-center gap-2 text-white/70">
        <Sparkles size={16} className="text-violet-300" />
        <span className="text-xs font-bold uppercase tracking-[0.14em]">{title}</span>
      </div>
      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`${finelyOsCatalogCard(TONE_ACCENT[item.tone])} !p-4 flex flex-wrap items-center justify-between gap-3`}
            data-fc-accent={TONE_ACCENT[item.tone]}
          >
            <div className="flex items-start gap-3 min-w-0">
              <span className="mt-0.5 shrink-0">
                <ToneIcon tone={item.tone} />
              </span>
              <p className="text-base leading-relaxed text-white/85">{item.text}</p>
            </div>
            <button
              type="button"
              className="fc-senior-tap-target fc-light-chrome-btn rounded-xl px-4 py-3 text-sm font-semibold normal-case tracking-normal shrink-0"
              onClick={() => navigate(item.to)}
            >
              {item.actionLabel} <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
