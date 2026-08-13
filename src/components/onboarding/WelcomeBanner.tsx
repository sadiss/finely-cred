import React, { useMemo, useState } from 'react';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import type { Partner } from '../../domain/partners';
import { dismissWelcome, getRenderedWelcomeMessage, isWelcomeDismissed } from '../../onboarding/welcomeMessage';
import { sanitizeHtmlForPreview } from '../../utils/richText';
import { FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN } from '../../features/os/finelyOsLightUi';

type WelcomeBannerProps = {
  user: User | null | undefined;
  partner?: Partner | null;
  className?: string;
  /** Dark partner portal shell — white copy on emerald glass */
  surface?: 'default' | 'portal';
};

/** Soft fuchsia tint for ivory dashboard — no dark black glass / opaque slabs. */
const WELCOME_SHELL =
  'rounded-3xl border border-fuchsia-500/40 bg-transparent relative overflow-hidden p-6 ' +
  'shadow-[0_0_0_1px_rgba(217,70,239,0.14),0_14px_44px_-16px_rgba(217,70,239,0.42),0_0_28px_-8px_rgba(217,70,239,0.2)] ' +
  'ring-1 ring-inset ring-fuchsia-400/15';

const WELCOME_SHELL_PORTAL =
  'rounded-3xl border border-emerald-400/40 relative overflow-hidden p-6 sm:p-7 ' +
  'bg-gradient-to-br from-[#0c2a22] via-[#061612] to-[#0a1f18] ' +
  'shadow-[0_0_0_1px_rgba(52,211,153,0.22),0_20px_48px_-16px_rgba(6,78,59,0.55),0_0_32px_-8px_rgba(52,211,153,0.28)]';

export function WelcomeBanner({ user, partner, className = '', surface = 'default' }: WelcomeBannerProps) {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(() => isWelcomeDismissed(user?.id));

  const welcome = useMemo(() => getRenderedWelcomeMessage({ user, partner }), [user, partner, user?.id]);

  if (hidden || !user || !welcome.enabled) return null;

  const useHtml = Boolean(welcome.bodyHtml && (welcome.mode === 'html' || welcome.mode === 'comms'));

  const portal = surface === 'portal';

  return (
    <div className={`${portal ? WELCOME_SHELL_PORTAL : WELCOME_SHELL} ${className}`} data-fc-partner-welcome={portal ? '1' : undefined}>
      <div className={`pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl ${portal ? 'bg-emerald-400/20' : 'bg-fuchsia-400/15'}`} />
      <button
        type="button"
        onClick={() => {
          dismissWelcome(user.id);
          setHidden(true);
        }}
        className={`absolute top-4 right-4 z-10 ${FINELY_OS_SECONDARY_BTN} !p-2`}
        title="Dismiss welcome message"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
      <div className="relative flex flex-wrap items-start gap-4 pr-10">
        {!useHtml ? (
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${portal ? 'border-emerald-400/35 bg-emerald-500/15' : 'border-fuchsia-500/35 bg-fuchsia-500/10'}`}>
            <Sparkles size={20} className={portal ? 'text-emerald-300' : 'text-fuchsia-700'} />
          </div>
        ) : null}
        <div className="min-w-0 flex-1 space-y-2">
          {!useHtml ? (
            <div className={`text-xl md:text-2xl font-semibold tracking-tight ${portal ? 'text-white' : 'text-slate-900'}`}>{welcome.headline}</div>
          ) : null}
          {useHtml ? (
            <div
              className={`welcome-html-preview prose max-w-none text-sm ${portal ? 'text-white/85 prose-invert' : 'text-slate-700'}`}
              dangerouslySetInnerHTML={{ __html: sanitizeHtmlForPreview(welcome.bodyHtml!) }}
            />
          ) : (
            <p className={`text-sm md:text-base leading-relaxed max-w-3xl ${portal ? 'text-white/80' : 'text-slate-600'}`}>{welcome.body}</p>
          )}
          {welcome.ctaLabel && welcome.ctaPath ? (
            <button type="button" onClick={() => navigate(welcome.ctaPath!)} className={`mt-2 ${FINELY_OS_PRIMARY_BTN}`}>
              {welcome.ctaLabel}
              <ArrowRight size={14} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
