import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';
import { getRuthCommandFocus } from './marketingDeskRuthFocus';
import type { MarketingDeskHelperId } from './marketingDeskGlossary';

type Props = {
  onOpenHelper?: (id: MarketingDeskHelperId) => void;
};

const weeklyFocusLine = (focus: ReturnType<typeof getRuthCommandFocus>) =>
  focus.weeklyTip || `Lean ${focus.laneLabel} near ${focus.city} — then clear exceptions only.`;

/** Ruth Steward co-owner command strip — weekly focus on a readable white card. */
export function MarketingDeskRuthCommandStrip({ onOpenHelper }: Props) {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const focus = useMemo(() => {
    void tick;
    return getRuthCommandFocus();
  }, [tick]);

  const openRuth = () => {
    if (onOpenHelper) onOpenHelper('ruth');
    else navigate('/admin/marketing-desk?helper=ruth');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-600">Ruth Steward · co-owner</div>
          <h2 className="mt-1 text-xl font-bold text-[#0a1628]">{weeklyFocusLine(focus)}</h2>
        </div>
        <div className="shrink-0">
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={openRuth}>
            Ask Ruth
          </button>
        </div>
      </div>

      <p className="text-sm font-semibold text-slate-900">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-600">This week </span>
        Lane · {focus.laneLabel}
        <span className="mx-2 text-slate-300" aria-hidden>|</span>
        City · {focus.city}
        <span className="mx-2 text-slate-300" aria-hidden>|</span>
        Offer · {focus.offerLabel}
      </p>
    </div>
  );
}
