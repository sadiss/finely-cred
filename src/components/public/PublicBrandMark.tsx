import React from 'react';

/** Gold medallion mark — use instead of shield/wordmark-only branding on public chrome. */
const MARK_PNG = '/brand/finely-cred-mark.png';
const MARK_SVG = '/brand/finely-cred-icon.svg';

export function PublicBrandMark({
  className = 'h-8 w-8',
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  const [src, setSrc] = React.useState(MARK_PNG);
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={`rounded-full object-cover shrink-0 ${className}`}
      width={size}
      height={size}
      loading="eager"
      decoding="async"
      onError={() => {
        if (src !== MARK_SVG) setSrc(MARK_SVG);
      }}
    />
  );
}
