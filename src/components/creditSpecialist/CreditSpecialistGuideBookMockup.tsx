import React from 'react';
import './CreditSpecialistGuideBookMockup.css';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export type CreditSpecialistGuideBookMockupProps = {
  title: string;
  edition: string;
  tagline: string;
  valueLabel: string;
  onOpen: () => void;
  className?: string;
  /** Extra vertical breathing room — use in a tall hero column. */
  tall?: boolean;
  ariaLabel?: string;
};

/**
 * CSS 3D book mockup for the Credit Specialist e-guide — extracted from
 * `CreditSpecialistGuideLandingPage.tsx` so it can also anchor the pricing page
 * hero (or any other surface) without duplicating markup/CSS. Self-contained via
 * `.csg-book-standalone`, so it renders correctly whether or not the page also
 * loads `creditSpecialistGuideLanding.css`.
 */
export function CreditSpecialistGuideBookMockup({
  title,
  edition,
  tagline,
  valueLabel,
  onOpen,
  className,
  tall,
  ariaLabel,
}: CreditSpecialistGuideBookMockupProps) {
  return (
    <div className={cn('csg-book-standalone csg-mockup-stage', tall && 'py-4 md:py-6', className)}>
      <div className="csg-mockup-glow" aria-hidden />
      <button
        type="button"
        onClick={onOpen}
        className="csg-book-btn"
        aria-label={ariaLabel ?? `Open ${title} in the guide reader`}
      >
        <div className="csg-book">
          <div className="csg-book-spine" aria-hidden />
          <div className="csg-book-pages" aria-hidden />
          <div className="csg-book-cover">
            <div className="relative z-10">
              <img
                src="/brand/finely-cred-logo-light.png"
                alt=""
                className="mb-4 h-8 w-auto object-contain opacity-90"
                width={120}
                height={40}
              />
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#95e000]/90">{edition}</p>
              <h3 className="mt-2 text-[1.35rem] font-semibold leading-tight text-white sm:text-[1.5rem]">{title}</h3>
              <p className="mt-2 text-[10px] leading-relaxed text-white/55">{tagline}</p>
            </div>
            <div className="relative z-10">
              <div className="text-[9px] uppercase tracking-[0.18em] text-white/40">Free in-app guide</div>
              <div className="mt-1 text-2xl font-black tabular-nums text-[#f0cc75]">{valueLabel}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#95e000]">Open to read →</div>
            </div>
          </div>
        </div>
      </button>
      <div className="csg-book-open-hint">Click cover to open the reader</div>
      <div className="csg-mockup-pedestal" aria-hidden />
    </div>
  );
}

export default CreditSpecialistGuideBookMockup;
