import React from 'react';

export type NcgLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type NcgLogoVariant = 'mark' | 'calligraphic';

const SIZE_CLASS: Record<NcgLogoSize, string> = {
  xs: 'h-6',
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
  xl: 'h-16',
};

/** Provided NCG artwork — do not recreate. */
const LOGO_MARK = '/images/brand/ncg-logo-mark.png';
const LOGO_CALLIGRAPHIC = '/images/brand/ncg-logo-calligraphic.png';

const INTRINSIC = { width: 1250, height: 1250 } as const;

export type NcgLogoProps = {
  variant?: NcgLogoVariant;
  size?: NcgLogoSize;
  className?: string;
  title?: string;
};

/** Nora Capital Group (NCG) logo from supplied zip assets. */
export function NcgLogo({
  variant = 'calligraphic',
  size = 'md',
  className = '',
  title = 'Nora Capital Group',
}: NcgLogoProps) {
  const src = variant === 'mark' ? LOGO_MARK : LOGO_CALLIGRAPHIC;
  return (
    <img
      src={src}
      alt={title}
      width={INTRINSIC.width}
      height={INTRINSIC.height}
      decoding="async"
      draggable={false}
      className={`block shrink-0 w-auto max-w-none object-contain ${SIZE_CLASS[size]} ${className}`}
    />
  );
}
