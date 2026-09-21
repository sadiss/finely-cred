import React, { useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, MousePointerClick } from 'lucide-react';
import type { WalkthroughStep } from '../../../specialistAcademy/academyWalkthroughs';
import { ProductDemoFrame } from './ProductDemoFrames';
import { AcademyPresence } from './AcademyMotion';
import { useReducedMotion } from './useReducedMotion';

function Hotspot({
  x,
  y,
  label,
  tone = 'amber',
}: {
  x: number;
  y: number;
  label: string;
  tone?: 'amber' | 'rose' | 'emerald';
}) {
  const colors =
    tone === 'rose'
      ? 'bg-rose-500 text-white border-rose-300'
      : tone === 'emerald'
        ? 'bg-emerald-500 text-black border-emerald-200'
        : 'bg-amber-400 text-black border-amber-200';
  return (
    <div
      className="absolute z-10 flex items-center gap-1 pointer-events-none academy-hotspot-pulse"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wide shadow-lg ${colors}`}>
        <MousePointerClick size={12} />
        {label}
      </span>
    </div>
  );
}

export function AcademyWalkthroughGallery({
  steps,
  lang,
  title,
  reduceMotion,
}: {
  steps: WalkthroughStep[];
  lang: 'en' | 'ht';
  title?: string;
  reduceMotion?: boolean;
}) {
  const systemReduced = useReducedMotion();
  const reduced = reduceMotion ?? systemReduced;
  const [idx, setIdx] = useState(0);
  if (!steps.length) return null;

  const step = steps[idx];
  const caption = lang === 'ht' ? step.captionHt : step.captionEn;
  const why = lang === 'ht' ? step.whyHt : step.whyEn;
  const nextClick = lang === 'ht' ? step.nextClickHt : step.nextClickEn;
  const stepLabel = lang === 'ht' ? step.stepLabelHt : step.stepLabelEn;

  return (
    <section className="mt-10 rounded-[28px] border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.07] via-black/40 to-emerald-500/[0.05] p-6 md:p-8 space-y-6 academy-card-lift">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-amber-200/70 font-black">Visual walkthrough</div>
          <h3 className="text-xl font-bold text-white mt-1">{title ?? (lang === 'ht' ? 'Chemen pwodwi' : 'Product path')}</h3>
        </div>
        <div className="text-white/50 text-sm">
          Step {idx + 1} / {steps.length}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIdx(i)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
              i === idx
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
            }`}
          >
            {lang === 'ht' ? s.stepLabelHt : s.stepLabelEn}
          </button>
        ))}
      </div>

      <AcademyPresence showKey={step.id} reduceMotion={reduced}>
      <div className="relative">
        <div className="relative">
          <ProductDemoFrame scene={step.scene} />
          {step.hotspots.map((h, i) => (
            <Hotspot
              key={i}
              x={h.x}
              y={h.y}
              label={lang === 'ht' ? h.labelHt : h.labelEn}
              tone={h.tone}
            />
          ))}
        </div>
        <p className="mt-4 text-white/80 text-[15px] leading-relaxed">
          <span className="text-amber-300 font-semibold">{stepLabel} — </span>
          {caption.replace(/\*\*([^*]+)\*\*/g, '$1')}
        </p>
        <p className="mt-2 text-white/55 text-sm">{why}</p>
        <div className="mt-4 flex items-center gap-2 text-emerald-300/90 text-sm font-medium">
          <ArrowRight size={16} className="shrink-0" />
          {nextClick}
        </div>
      </div>
      </AcademyPresence>

      <div className="flex justify-between pt-2">
        <button
          type="button"
          disabled={idx === 0}
          onClick={() => setIdx((n) => Math.max(0, n - 1))}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-white/10 text-white/70 disabled:opacity-30 text-sm"
        >
          <ChevronLeft size={16} /> {lang === 'ht' ? 'Anvan' : 'Back'}
        </button>
        <button
          type="button"
          disabled={idx >= steps.length - 1}
          onClick={() => setIdx((n) => Math.min(steps.length - 1, n + 1))}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-sm disabled:opacity-30"
        >
          {lang === 'ht' ? 'Apre' : 'Next step'} <ChevronRight size={16} />
        </button>
      </div>
    </section>
  );
}
