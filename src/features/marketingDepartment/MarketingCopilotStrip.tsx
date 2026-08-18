import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_PRIMARY_BTN,
} from '../os/finelyOsLightUi';
import { MARKETING_HUB_CONTENT_SHELL } from './marketingHubUi';
import { getMarketingCopilotRecommendation } from './marketingCopilotRecommendations';

export function MarketingCopilotStrip() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore);
    return () => window.removeEventListener('finely:store', onStore);
  }, []);
  const rec = useMemo(() => getMarketingCopilotRecommendation(), [version]);

  return (
    <div className={`${MARKETING_HUB_CONTENT_SHELL} flex flex-col sm:flex-row sm:items-center gap-3 border-violet-400/25`}>
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="shrink-0 rounded-xl border border-violet-400/35 bg-violet-500/15 p-2 text-violet-200">
          <Sparkles size={18} />
        </div>
        <div className="min-w-0">
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Marketing Copilot</p>
          <h3 className={`${FINELY_OS_ENTITY_TITLE} text-lg`}>{rec.headline}</h3>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{rec.reason}</p>
        </div>
      </div>
      <button type="button" className={`${FINELY_OS_PRIMARY_BTN} shrink-0`} onClick={() => navigate(rec.href)}>
        {rec.ctaLabel}
      </button>
    </div>
  );
}
