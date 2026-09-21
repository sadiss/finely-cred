import React from 'react';

type GuideCoverImageProps = {
  alt: string;
  /** Primary cover path; falls back to medallion */
  src?: string;
  className?: string;
};

const FALLBACK_PNG = '/brand/finely-cred-mark.png';
const FALLBACK_SVG = '/brand/finely-cred-icon.svg';

/**
 * Guide/marketing covers with safe fallback when bundled assets are missing on host.
 */
export function GuideCoverImage({ alt, src, className = 'w-24 h-24 rounded-full object-cover' }: GuideCoverImageProps) {
  const [fallbackStep, setFallbackStep] = React.useState(0);
  const effective =
    fallbackStep >= 2 ? FALLBACK_SVG : fallbackStep === 1 ? FALLBACK_PNG : src || FALLBACK_PNG;

  return (
    <img
      src={effective}
      alt={alt}
      className={className}
      width={96}
      height={96}
      loading="lazy"
      decoding="async"
      onError={() => setFallbackStep((s) => Math.min(s + 1, 2))}
    />
  );
}
