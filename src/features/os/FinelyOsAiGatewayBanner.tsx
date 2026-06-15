import React from 'react';
import { Sparkles } from 'lucide-react';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { FINELY_OS_BANNER, FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_VALUE } from './finelyOsLightUi';

type Props = {
  className?: string;
  compact?: boolean;
};

/** Shown when AI Gateway is off — copilots fall back to rules/catalog logic. */
export function FinelyOsAiGatewayBanner({ className = '', compact }: Props) {
  if (isFeatureEnabled('aiGateway')) return null;

  return (
    <div className={`${FINELY_OS_BANNER} flex items-start gap-3 ${className}`}>
      <Sparkles size={16} className="text-amber-300 shrink-0 mt-0.5" />
      <div>
        <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>AI off — using rules</div>
        <p className={`${compact ? 'text-xs' : 'text-sm'} ${FINELY_OS_ENTITY_BODY} mt-1`}>
          Server-side AI Gateway is disabled. Suggestions use catalog rules and heuristics until you enable{' '}
          <span className="font-mono text-white/70">aiGateway</span> in Admin Settings → Features.
        </p>
      </div>
    </div>
  );
}
