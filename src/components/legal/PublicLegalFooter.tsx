import React from 'react';
import { Link } from 'react-router-dom';

type Props = {
  className?: string;
};

/** Privacy, terms, disclaimer, and marketing unsubscribe links for public routes. */
export function PublicLegalFooter({ className = '' }: Props) {
  const linkClass = 'hover:text-white transition-colors';
  return (
    <nav
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/30 ${className}`.trim()}
      aria-label="Legal links"
    >
      <Link to="/privacy" className={linkClass}>
        Privacy Policy
      </Link>
      <Link to="/terms" className={linkClass}>
        Terms &amp; Conditions
      </Link>
      <Link to="/disclaimer" className={linkClass}>
        Disclaimer
      </Link>
      <Link to="/unsubscribe" className={linkClass}>
        Unsubscribe
      </Link>
    </nav>
  );
}
