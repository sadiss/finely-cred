import React, { useEffect } from 'react';

function useOnboardingScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.classList.add('fc-onboarding-portal-open');
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.classList.remove('fc-onboarding-portal-open');
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [active]);
}

type Props = {
  active?: boolean;
  /** @deprecated Scroll lock always applies while the shell is open; landing still shows through the glass. */
  lockBackground?: boolean;
  chrome?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  /** Pin footer to bottom of viewport — Continue/Previous always visible while content scrolls. */
  fixedFooter?: boolean;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  scrollClassName?: string;
  shellClassName?: string;
  children: React.ReactNode;
};

/** Header + footer pinned; only step content scrolls — Exit setup stays visible on desktop. */
export function OnboardingFlowShell({
  active = true,
  lockBackground: _lockBackground = false,
  chrome,
  header,
  footer,
  fixedFooter = false,
  scrollRef,
  scrollClassName = '',
  shellClassName = '',
  children,
}: Props) {
  useOnboardingScrollLock(active);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden fc-senior-simple ${shellClassName}`}
      data-fc-onboarding-shell="1"
    >
      <div className="pointer-events-none absolute inset-0 bg-[#070b10]/72 backdrop-blur-[2px]" aria-hidden />
      <div className="relative flex flex-col flex-1 min-h-0 h-full max-h-full overflow-hidden">
        {chrome}
        {header ? <div className="shrink-0 relative z-[55]">{header}</div> : null}
        <div
          ref={scrollRef}
          data-fc-onboarding-scroll="1"
          className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y scroll-smooth fc-onboarding-main-scroll"
        >
          <div className={scrollClassName}>{children}</div>
        </div>
        {footer ? (
          fixedFooter ? (
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60]" data-fc-onboarding-nav-fixed="1">
              <div className="pointer-events-auto">{footer}</div>
            </div>
          ) : (
            <div className="shrink-0 relative z-[60]">{footer}</div>
          )
        ) : null}
      </div>
    </div>
  );
}
