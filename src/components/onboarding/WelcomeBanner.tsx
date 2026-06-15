import React, { useMemo, useState } from 'react';

import { ArrowRight, Sparkles, X } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import type { User } from '@supabase/supabase-js';

import type { Partner } from '../../domain/partners';

import { dismissWelcome, getRenderedWelcomeMessage, isWelcomeDismissed } from '../../onboarding/welcomeMessage';
import { sanitizeHtmlForPreview } from '../../utils/richText';

import {

  FINELY_OS_ENTITY_BODY,

  FINELY_OS_ENTITY_VALUE,

  FINELY_OS_PRIMARY_BTN,

  FINELY_OS_SECONDARY_BTN,

  finelyOsGlassShell,

} from '../../features/os/finelyOsLightUi';



type WelcomeBannerProps = {

  user: User | null | undefined;

  partner?: Partner | null;

  className?: string;

};



export function WelcomeBanner({ user, partner, className = '' }: WelcomeBannerProps) {

  const navigate = useNavigate();

  const [hidden, setHidden] = useState(() => isWelcomeDismissed(user?.id));



  const welcome = useMemo(() => getRenderedWelcomeMessage({ user, partner }), [user, partner, user?.id]);



  if (hidden || !user || !welcome.enabled) return null;



  const useHtml = Boolean(welcome.bodyHtml && (welcome.mode === 'html' || welcome.mode === 'comms'));



  return (

    <div className={`${finelyOsGlassShell('panel', 'fuchsia')} p-6 relative overflow-hidden ${className}`}>

      <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-fuchsia-500/10 blur-3xl" />

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

          <div className="w-11 h-11 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/15 flex items-center justify-center shrink-0">

            <Sparkles size={20} className="text-fuchsia-300" />

          </div>

        ) : null}

        <div className="min-w-0 flex-1 space-y-2">

          {!useHtml ? (

            <div className={`text-xl md:text-2xl font-light ${FINELY_OS_ENTITY_VALUE}`}>{welcome.headline}</div>

          ) : null}

          {useHtml ? (

            <div

              className="welcome-html-preview prose prose-invert max-w-none text-sm"

              dangerouslySetInnerHTML={{ __html: sanitizeHtmlForPreview(welcome.bodyHtml!) }}

            />

          ) : (

            <p className={`${FINELY_OS_ENTITY_BODY} md:text-base leading-relaxed max-w-3xl`}>{welcome.body}</p>

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

