import React from 'react';
import { ArrowRight, LogIn } from 'lucide-react';
import { careerAccentChip, careerSolidBtn, type CareerAccent } from './careerUi';

type Props = {
  kicker?: string;
  title: string;
  selectedLabel: string;
  description?: string;
  /** e.g. "Requires a Finely login — sign in or create an account first." */
  loginNote?: string;
  accent?: CareerAccent;
  /** Optional short form fields (choice-first apply: pick path/tier above, then name/email/phone here). */
  children?: React.ReactNode;
  ctaLabel: string;
  /** Provide for a plain button CTA (no form). */
  onCtaClick?: () => void;
  /** Provide (with `children` as fields) to render as a form instead of a plain button. */
  onSubmit?: (e: React.FormEvent) => void;
  submitDisabled?: boolean;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
  className?: string;
};

/** Choice-first apply block: shows the current selection, then one clear commitment action. */
export function CareerChoiceApply({
  kicker = 'Apply',
  title,
  selectedLabel,
  description,
  loginNote,
  accent = 'navy',
  children,
  ctaLabel,
  onCtaClick,
  onSubmit,
  submitDisabled,
  secondaryLabel,
  onSecondaryClick,
  className = '',
}: Props) {
  const cta = (
    <button
      type={onSubmit ? 'submit' : 'button'}
      onClick={onSubmit ? undefined : onCtaClick}
      disabled={submitDisabled}
      className={`w-full sm:w-auto ${careerSolidBtn(accent, 'h-12 py-0')}`}
    >
      {ctaLabel} <ArrowRight size={15} />
    </button>
  );

  const body = (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className={careerAccentChip(accent)}>{kicker}</p>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-700">{selectedLabel}</span>
        </p>
        {description ? <p className="text-sm leading-relaxed text-slate-600">{description}</p> : null}
      </div>

      {children ? <div className="space-y-3">{children}</div> : null}

      <div className="flex flex-wrap items-center gap-3">
        {cta}
        {secondaryLabel ? (
          <button
            type="button"
            onClick={onSecondaryClick}
            className="text-sm font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-800"
          >
            {secondaryLabel}
          </button>
        ) : null}
      </div>

      {loginNote ? (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
          <LogIn size={13} className="mt-0.5 shrink-0" /> {loginNote}
        </p>
      ) : null}
    </div>
  );

  return (
    <div className={`rounded-2xl border-2 border-slate-200 bg-white p-6 sm:p-7 ${className}`}>
      {onSubmit ? <form onSubmit={onSubmit}>{body}</form> : body}
    </div>
  );
}
