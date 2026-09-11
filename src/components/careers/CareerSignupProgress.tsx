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

const ACTIVE_DOT: Record<CareerAccent, string> = {
  slate: 'border-white bg-white text-slate-900 shadow-[0_0_0_4px_rgba(255,255,255,0.18)]',
  gold: 'border-emerald-400 bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.22)]',
  amber: 'border-emerald-400 bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.22)]',
  emerald: 'border-emerald-400 bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.22)]',
  navy: 'border-sky-300 bg-sky-500 text-white shadow-[0_0_0_4px_rgba(56,189,248,0.22)]',
  sky: 'border-sky-300 bg-sky-500 text-white shadow-[0_0_0_4px_rgba(56,189,248,0.22)]',
  rose: 'border-rose-300 bg-rose-500 text-white shadow-[0_0_0_4px_rgba(244,63,94,0.22)]',
};

const RESULT_CHIP: Record<CareerAccent, string> = {
  slate: 'border-white/25 bg-white/10 text-white',
  gold: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  amber: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  emerald: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  navy: 'border-sky-400/40 bg-sky-500/15 text-sky-100',
  sky: 'border-sky-400/40 bg-sky-500/15 text-sky-100',
  rose: 'border-rose-400/40 bg-rose-500/15 text-rose-100',
};

/** Step dots for join/apply flows — readable on the dark OS join floor. */
export function CareerSignupProgress({ steps, activeId, onStepClick, accent = 'emerald', className = '' }: Props) {
  const activeIndex = Math.max(0, steps.findIndex((s) => s.id === activeId));
  const activeStep = steps[activeIndex];
  const pct = steps.length > 1 ? (activeIndex / (steps.length - 1)) * 100 : 0;

  return (
    <div className={className}>
      <div className="relative">
        <div className="absolute left-0 right-0 top-[13px] h-1 rounded-full bg-white/15" aria-hidden />
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
                      ? 'border-emerald-300 bg-emerald-500 text-white'
                      : active
                        ? ACTIVE_DOT[accent]
                        : 'border-white/25 bg-white/5 text-white/45'
                  } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? <Check size={13} strokeWidth={3} /> : i + 1}
                </button>
                <span className={`hidden text-[10px] font-bold uppercase tracking-wide sm:block ${active ? 'text-white' : 'text-white/45'}`}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {activeStep?.resultLabel ? (
        <div className="mt-3 flex justify-center">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${RESULT_CHIP[accent]}`}>
            {activeStep.resultLabel}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default CareerSignupProgress;
