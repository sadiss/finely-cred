import React, { useEffect, useState } from 'react';

export type FinelyCredLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
export type FinelyCredLogoVariant = 'full' | 'mark';

const SIZE_CLASS: Record<FinelyCredLogoSize, string> = {
  xs: 'h-5',
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-11',
  xl: 'h-14',
  hero: 'h-[4.5rem] sm:h-20 md:h-24',
};

const LOGO_DARK = '/brand/finely-cred-logo-dark.png';
const LOGO_LIGHT = '/brand/finely-cred-logo-light.png';
const LOGO_MARK = '/brand/finely-cred-mark.png';

/** Intrinsic pixels from process-finely-logo.mjs (@3x export — keeps nav/footer crisp on retina). */
const LOGO_FULL_INTRINSIC = { width: 638, height: 506 } as const;
const LOGO_MARK_INTRINSIC = { width: 512, height: 512 } as const;

export type FinelyCredLogoProps = {
  variant?: FinelyCredLogoVariant;
  size?: FinelyCredLogoSize;
  className?: string;
  title?: string;
  /** Force white letterforms (dark footer, hero on black, etc.) */
  forceLight?: boolean;
  /** Pin wordmark flush-left in chrome (nav bars). */
  alignLeft?: boolean;
};

function readSiteTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-fc-theme') === 'light' ? 'light' : 'dark';
}

/** Original Finely Cred wordmark — source artwork with metallic gold circle touch-up only. */
export function FinelyCredLogo({
  variant = 'full',
  size = 'md',
  className = '',
  title = 'Finely Cred',
  forceLight = false,
  alignLeft = false,
}: FinelyCredLogoProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => readSiteTheme());

  useEffect(() => {
    const sync = () => setTheme(readSiteTheme());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-fc-theme'] });
    window.addEventListener('finely:store', sync);
    return () => {
      observer.disconnect();
      window.removeEventListener('finely:store', sync);
    };
  }, []);

  const src =
    variant === 'mark'
      ? LOGO_MARK
      : forceLight || theme === 'dark'
        ? LOGO_DARK
        : LOGO_LIGHT;

  const sizeClass = SIZE_CLASS[size];
  const intrinsic = variant === 'mark' ? LOGO_MARK_INTRINSIC : LOGO_FULL_INTRINSIC;

  return (
    <img
      src={src}
      alt={title}
      width={intrinsic.width}
      height={intrinsic.height}
      decoding="async"
      draggable={false}
      className={`fc-brand-logo fc-brand-logo-img block shrink-0 w-auto max-w-none ${sizeClass} ${alignLeft ? 'fc-brand-logo-align-left' : ''} ${className}`}
    />
  );
}
