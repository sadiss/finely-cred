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
  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || !onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKey}
      title={title}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={`fc-clickable-card fc-focus-ring ${disabled ? 'opacity-60 cursor-not-allowed' : onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
