import React from 'react';

type Props = {
  className?: string;
  size?: number;
  alt?: string;
};

/** HOS brand mark — ascending peaks in gold ring (neutral, not medical). */
export function HosBrandMark({ className = '', size = 20, alt = 'Head of Society' }: Props) {
  return (
    <img
      src="/hos/hos-mark.svg"
      alt={alt}
      width={size}
      height={size}
      className={className}
      draggable={false}
    />
  );
}
