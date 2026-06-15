import React from 'react';
import { Link } from 'react-router-dom';

export function ActionLink({
  children,
  to,
  href,
  onClick,
  className = '',
  icon,
  title,
  target,
  rel,
}: {
  children: React.ReactNode;
  to?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  target?: string;
  rel?: string;
}) {
  const content = (
    <>
      {icon ? <span className="shrink-0 opacity-90">{icon}</span> : null}
      <span className="min-w-0">{children}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} title={title} className={`fc-action-link fc-focus-ring ${className}`}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} title={title} target={target} rel={rel} className={`fc-action-link fc-focus-ring ${className}`}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" title={title} onClick={onClick} className={`fc-action-link fc-focus-ring ${className}`}>
      {content}
    </button>
  );
}

