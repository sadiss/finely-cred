import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ListChecks } from 'lucide-react';
import { resolveFinelyPageContext } from '../../lib/finelyBrain/finelyBrainOrchestrate';
import { FINELY_OS_PRIMARY_BTN, finelyOsCatalogCard } from '../../features/os/finelyOsLightUi';

export type NowDoThisItem = { label: string; detail?: string; to: string };

type Props = {
  /** Explicit steps. When omitted, derives the single next step from the page's SOP. */
  items?: NowDoThisItem[];
  /** Which step is the current "one job" (0-based). Pass partner progress to advance. */
  currentIndex?: number;
  title?: string;
  className?: string;
};

/**
 * "Now do this" — one job per screen (Launch Part D3).
 * Senior-simple: one big primary action + a small numbered preview of what's next.
 */
export function FinelyNowDoThisStrip({ items, currentIndex = 0, title = 'Now do this', className = '' }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const steps = useMemo<NowDoThisItem[]>(() => {
    if (items?.length) return items;
    const ctx = resolveFinelyPageContext(pathname);
    if (!ctx.sop) return [];
    const fallback = ctx.sop.relatedRoutes[0] ?? pathname;
    return ctx.sop.steps.map((s) => ({ label: s.label, detail: s.detail, to: s.route ?? fallback }));
  }, [items, pathname]);

  if (!steps.length) return null;

  const total = steps.length;
  const idx = Math.max(0, Math.min(currentIndex, total - 1));
  const current = steps[idx];
  const upcoming = steps.slice(idx + 1, idx + 4);

  return (
    <div
      className={`fc-senior-simple ${finelyOsCatalogCard('amber')} !p-5 space-y-4 ${className}`}
      data-fc-accent="amber"
      data-fc-now-do-this="1"
    >
      <div className="flex items-center gap-2 text-amber-300">
        <ListChecks size={18} />
        <span className="text-xs font-bold uppercase tracking-[0.14em]">
          {title} · Step {idx + 1} of {total}
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-xl font-bold text-white/90">{current.label}</p>
        {current.detail ? <p className="text-base leading-relaxed text-white/70">{current.detail}</p> : null}
      </div>
      <button
        type="button"
        className={`fc-senior-tap-target ${FINELY_OS_PRIMARY_BTN} !py-4 !px-6 !text-base justify-center`}
        onClick={() => navigate(current.to)}
      >
        Do this now <ArrowRight size={18} />
      </button>
      {upcoming.length ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {upcoming.map((s, i) => (
            <button
              key={`${s.label}-${i}`}
              type="button"
              onClick={() => navigate(s.to)}
              className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/65 hover:text-white hover:border-white/25 transition-colors"
              title={s.detail}
            >
              {idx + i + 2}. {s.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
