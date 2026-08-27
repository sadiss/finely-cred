import React, { useEffect, useState } from 'react';
import './finelyCredLogo.css';

export type FinelyCredLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
export type FinelyCredLogoVariant = 'full' | 'mark';
export type FinelyCredLogoTone = 'gold' | 'emerald' | 'mono';

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

/**
 * Owner-supplied override. Drop a transparent PNG at `public/brand/finely-cred-button.png` and
 * every `treatment="button"` logo switches to it automatically — no code change, no rebuild of
 * the CSS treatment below. Until that file exists we compose the button ourselves (see
 * `.fc-brand-logo-button` in `finelyCredLogo.css`).
 */
const LOGO_BUTTON_OVERRIDE = '/brand/finely-cred-button.png';

type OverrideState = 'unknown' | 'present' | 'absent';
let buttonOverrideState: OverrideState = 'unknown';
const buttonOverrideWaiters = new Set<(state: OverrideState) => void>();

function probeButtonOverride(): void {
  if (buttonOverrideState !== 'unknown' || typeof window === 'undefined') return;
  const probe = new Image();
  const settle = (state: OverrideState) => {
    buttonOverrideState = state;
    buttonOverrideWaiters.forEach((notify) => notify(state));
    buttonOverrideWaiters.clear();
  };
  probe.onload = () => settle('present');
  probe.onerror = () => settle('absent');
  probe.src = LOGO_BUTTON_OVERRIDE;
}

function useButtonOverride(enabled: boolean): boolean {
  const [state, setState] = useState<OverrideState>(buttonOverrideState);

  useEffect(() => {
    if (!enabled || buttonOverrideState !== 'unknown') {
      setState(buttonOverrideState);
      return;
    }
    buttonOverrideWaiters.add(setState);
    probeButtonOverride();
    return () => {
      buttonOverrideWaiters.delete(setState);
    };
  }, [enabled]);

  return enabled && state === 'present';
}

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
  /** Workspace tones recolor the mark without hue-rotating the raster. Default preserves marketing gold. */
  tone?: FinelyCredLogoTone;
  /** When `tone="mono"`, pick contrast against the host bed. */
  monoBed?: 'light' | 'dark';
  /**
   * `button` renders the mark as a physical metallic-green key with a dark rim and the
   * letterforms knocked out (transparent), rather than a flat recoloured raster.
   */
  treatment?: 'flat' | 'button';
};

function readSiteTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-fc-theme') === 'light' ? 'light' : 'dark';
}

function resolveLogoSrc(
  variant: FinelyCredLogoVariant,
  theme: 'dark' | 'light',
  forceLight: boolean,
): string {
  if (variant === 'mark') return LOGO_MARK;
  return forceLight || theme === 'dark' ? LOGO_DARK : LOGO_LIGHT;
}

/** Original Finely Cred wordmark — source artwork with metallic gold circle touch-up only. */
export function FinelyCredLogo({
  variant = 'full',
  size = 'md',
  className = '',
  title = 'Finely Cred',
  forceLight = false,
  alignLeft = false,
  tone = 'gold',
  monoBed = 'dark',
  treatment = 'flat',
}: FinelyCredLogoProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => readSiteTheme());
  const useOverrideAsset = useButtonOverride(treatment === 'button');

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

  const src = resolveLogoSrc(variant, theme, forceLight);
  const sizeClass = SIZE_CLASS[size];
  const intrinsic = variant === 'mark' ? LOGO_MARK_INTRINSIC : LOGO_FULL_INTRINSIC;
  const aspectRatio = intrinsic.width / intrinsic.height;

  if (treatment === 'button') {
    if (useOverrideAsset) {
      return (
        <img
          src={LOGO_BUTTON_OVERRIDE}
          alt={title}
          decoding="async"
          draggable={false}
          className={`fc-brand-logo fc-brand-logo-img block shrink-0 w-auto max-w-none ${sizeClass} ${className}`}
        />
      );
    }

    return (
      <span
        role="img"
        aria-label={title}
        className={`fc-brand-logo fc-brand-logo-button ${sizeClass} ${className}`}
      >
        <span
          className="fc-brand-logo-button-face"
          style={{
            WebkitMaskImage: `linear-gradient(#000, #000), url(${LOGO_MARK})`,
            maskImage: `linear-gradient(#000, #000), url(${LOGO_MARK})`,
          }}
        />
      </span>
    );
  }

  if (tone === 'emerald' || tone === 'mono') {
    const maskToneClass =
      tone === 'mono'
        ? `fc-brand-logo-tone--mono fc-brand-logo-tone--on-${monoBed}`
        : 'fc-brand-logo-tone--emerald';

    return (
      <span
        role="img"
        aria-label={title}
        className={`fc-brand-logo fc-brand-logo-tone fc-brand-logo-tone--${tone} ${maskToneClass} ${sizeClass} ${alignLeft ? 'fc-brand-logo-align-left' : ''} ${className}`}
        style={{
          aspectRatio: `${intrinsic.width} / ${intrinsic.height}`,
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
        }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={title}
      width={intrinsic.width}
      height={intrinsic.height}
      decoding="async"
      draggable={false}
      className={`fc-brand-logo fc-brand-logo-img block shrink-0 w-auto max-w-none ${sizeClass} ${alignLeft ? 'fc-brand-logo-align-left' : ''} ${className}`}
      style={{ aspectRatio }}
    />
  );
}
