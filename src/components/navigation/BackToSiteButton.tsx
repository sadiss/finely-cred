import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Props = {
  variant?: 'primary' | 'ghost' | 'bar';
  className?: string;
  label?: string;
};

export function BackToSiteButton({ variant = 'primary', className = '', label = 'Back to site' }: Props) {
  const navigate = useNavigate();

  if (variant === 'bar') {
    return (
      <div className={`fc-signed-out-bar ${className}`}>
        <div className="fc-container py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-white">You&apos;re signed out</p>
            <p className="text-sm text-white/60 mt-1">Browse the public site or sign back in to continue.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate('/onboarding')} className="fc-button-brand px-6 py-3.5 text-sm">
              Sign in
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/15 bg-white/[0.08] text-sm font-semibold text-white/90"
            >
              <Home size={16} className="text-fuchsia-300" />
              Explore site
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'ghost') {
    return (
      <button
        type="button"
        onClick={() => navigate('/')}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.10] text-sm font-semibold text-white/85 transition-all fc-focus-ring ${className}`}
      >
        <Home size={16} className="text-fuchsia-300" />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/')}
      className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl border border-fuchsia-500/35 bg-gradient-to-r from-fuchsia-500/20 via-violet-500/10 to-transparent hover:from-fuchsia-500/30 text-sm sm:text-base font-bold text-fuchsia-50 shadow-lg shadow-fuchsia-950/30 transition-all fc-focus-ring ${className}`}
    >
      <Home size={18} className="text-fuchsia-300 shrink-0" />
      {label}
    </button>
  );
}

export function markSignedOutAndGoHome(navigate: (path: string) => void) {
  try {
    sessionStorage.setItem('finely.signedOut', '1');
  } catch {
    // ignore
  }
  navigate('/');
}

export function consumeSignedOutFlag(): boolean {
  try {
    if (sessionStorage.getItem('finely.signedOut') !== '1') return false;
    sessionStorage.removeItem('finely.signedOut');
    return true;
  } catch {
    return false;
  }
}
