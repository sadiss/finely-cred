import React, { useEffect } from 'react';
import { LiveApprovalTicker } from '../ui';
import { PublicChatWidget } from '../chat/PublicChatWidget';
import { getPublicChromeProfile } from '../../routing/publicMarketingRoutes';

/**
 * Single mount point for floating public UI (approval toast + Ask Finely).
 * Profile driven by route so forms and CTAs stay uncovered.
 */
export function PublicFloatingChrome({ pathname }: { pathname: string }) {
  const profile = getPublicChromeProfile(pathname);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--fc-public-safe-bottom', profile.safeBottom);
    if (profile.formHeavy) {
      document.body.setAttribute('data-fc-public-form', '1');
    } else {
      document.body.removeAttribute('data-fc-public-form');
    }
    return () => {
      document.body.removeAttribute('data-fc-public-form');
    };
  }, [profile.formHeavy, profile.safeBottom]);

  return (
    <>
      {!profile.hideApprovalTicker ? <LiveApprovalTicker /> : null}
      <PublicChatWidget layout={profile.chatLayout} />
    </>
  );
}
