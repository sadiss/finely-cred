import React from 'react';
import { Check } from 'lucide-react';
import { careerAccentBar, type CareerAccent } from './careerUi';

export type CareerProgressStep = {
  id: string;
  label: string;
  /** Fun result/reward text shown under the active dot, e.g. "3 leads · 30 days". */
  resultLabel?: string;
};

type Props = {
  steps: CareerProgressStep[];
  activeId: string;
  /** Only fires for steps at or before the active step — no skipping ahead. */
  onStepClick?: (id: string) => void;
  accent?: CareerAccent;
  className?: string;
};

/** Fun step dots with a per-step "what you get" result label — used on join/apply flows. */
export function CareerSignupProgress({ steps, activeId, onStepClick, accent = 'gold', className = '' }: Props) {
  const activeIndex = Math.max(0, steps.findIndex((s) => s.id === activeId));
  const activeStep = steps[activeIndex];
  const pct = steps.length > 1 ? (activeIndex / (steps.length - 1)) * 100 : 0;

  return (
    <div className={className}>
      <div className="relative">
        <div className="absolute left-0 right-0 top-[13px] h-1 rounded-full bg-slate-200" aria-hidden />
        <div
          className={`absolute left-0 top-[13px] h-1 rounded-full transition-all duration-300 ${careerAccentBar(accent)}`}
          style={{ width: `${pct}%` }}
          aria-hidden
        />
        <ol className="relative flex items-start justify-between gap-1">
          {steps.map((step, i) => {
            const done = i < activeIndex;
            const active = i === activeIndex;
            const clickable = Boolean(onStepClick) && i <= activeIndex;
            return (
              <li key={step.id} className="flex flex-col items-center gap-1.5 text-center" style={{ flex: 1 }}>
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onStepClick?.(step.id)}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-black transition-all ${
                    done
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : active
                        ? 'border-amber-500 bg-amber-500 text-[#1c1206] shadow-[0_0_0_4px_rgba(245,158,11,0.18)]'
                        : 'border-slate-300 bg-white text-slate-400'
                  } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? <Check size={13} strokeWidth={3} /> : i + 1}
                </button>
                <span className={`hidden text-[10px] font-bold uppercase tracking-wide sm:block ${active ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {activeStep?.resultLabel ? (
        <div className="mt-3 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
            {activeStep.resultLabel}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default CareerSignupProgress;
