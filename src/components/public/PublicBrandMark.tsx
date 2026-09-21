import React from 'react';

/** Gold medallion mark — use instead of shield/wordmark-only branding on public chrome. */
export function PublicBrandMark({
  className = 'h-8 w-8',
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <img
      src="/brand/finely-cred-mark.png"
      alt=""
      aria-hidden="true"
      className={`rounded-full object-cover shrink-0 ${className}`}
      width={size}
      height={size}
      loading="eager"
      decoding="async"
    />
  );
}
