import React from 'react';

export function ClickableCard({
  children,
  onClick,
  disabled,
  className = '',
  title,
  ariaLabel,
}: React.PropsWithChildren<{
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  ariaLabel?: string;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={`fc-clickable-card fc-focus-ring ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

