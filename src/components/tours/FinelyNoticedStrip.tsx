import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { finelyOsCatalogCard, finelyOsIvorySolidTile, FINELY_OS_ENTITY_BODY } from '../../features/os/finelyOsLightUi';
import type { FinelyNoticedItem, FinelyNoticedTone } from '../../lib/finelyProactiveSignals';

const TONE_ACCENT: Record<FinelyNoticedTone, 'rose' | 'sky' | 'emerald'> = {
  warn: 'rose',
  info: 'sky',
  success: 'emerald',
};

function ToneIcon({ tone, light }: { tone: FinelyNoticedTone; light?: boolean }) {
  if (tone === 'warn') return <AlertTriangle size={18} className={light ? 'text-rose-700' : 'text-rose-300'} />;
  if (tone === 'success') return <CheckCircle2 size={18} className={light ? 'text-emerald-600' : 'text-emerald-300'} />;
  return <Sparkles size={18} className={light ? 'text-sky-600' : 'text-sky-300'} />;
}

type Props = {
  items: FinelyNoticedItem[];
  title?: string;
  className?: string;
  /** Use on `PageShell` ivory / fc-light-readable pages. */
  surface?: 'dark' | 'light';
};

/**
 * "Finely noticed…" — proactive next-best-action (Launch Part E3).
 * Each row: plain-English nudge + one big button. Senior-simple.
 */
export function FinelyNoticedStrip({ items, title = 'Finely noticed', className = '', surface = 'dark' }: Props) {
  const navigate = useNavigate();
  if (!items.length) return null;
  const light = surface === 'light';

  return (
    <div className={`fc-senior-simple space-y-3 ${className}`} data-fc-noticed-strip="1">
      <div className={`flex items-center gap-2 ${light ? 'text-[#0a1628]' : 'text-white/85'}`}>
        <Sparkles size={16} className={light ? 'text-violet-700' : 'text-violet-300'} />
        <span className="text-sm font-extrabold uppercase tracking-[0.14em]">{title}</span>
      </div>
      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`${
              light ? finelyOsIvorySolidTile(TONE_ACCENT[item.tone]) : finelyOsCatalogCard(TONE_ACCENT[item.tone])
            } !p-4 flex flex-wrap items-center justify-between gap-3`}
            data-fc-accent={TONE_ACCENT[item.tone]}
          >
            <div className="flex items-start gap-3 min-w-0">
              <span className="mt-0.5 shrink-0">
                <ToneIcon tone={item.tone} light={light} />
              </span>
              <p className={`text-base leading-relaxed ${light ? FINELY_OS_ENTITY_BODY : 'text-[color:var(--fc-os-entity-body)]'}`}>{item.text}</p>
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
