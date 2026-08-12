import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Crown, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  FINELY_OS_AI_DRAFT_BTN_SM,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsMicroStat,
} from '../os/finelyOsLightUi';
import { FinelyOsAlertBanner } from '../os/FinelyOsAlertBanner';
import { runCalebTodaysMission } from '../growthAgents/calebQuotaMission';
import { getRuthCommandFocus } from './marketingDeskRuthFocus';
import { FINELY_MARKETING_DESK_WOW_LINES } from '../../config/finelyMarketingDifferentiators';
import type { MarketingDeskHelperId } from './marketingDeskGlossary';

type Props = {
  onOpenHelper?: (id: MarketingDeskHelperId) => void;
};

/** Ruth Steward co-owner command strip — weekly focus + one-click Caleb pack. */
export function MarketingDeskRuthCommandStrip({ onOpenHelper }: Props) {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [packBusy, setPackBusy] = useState(false);
  const [packMsg, setPackMsg] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const focus = useMemo(() => {
    void tick;
    return getRuthCommandFocus();
  }, [tick]);

  const runCalebPack = async () => {
    setPackBusy(true);
    setPackMsg(null);
    try {
      const r = await runCalebTodaysMission(focus.city);
      setPackMsg(r.message);
      setTick((t) => t + 1);
    } finally {
      setPackBusy(false);
    }
  };

  return (
    <div className={`${finelyOsCatalogCardCompact('amber')} space-y-3`} data-fc-accent="amber">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-amber-200/90 text-[10px] font-black uppercase tracking-[0.2em]">
            <Crown size={14} /> {focus.fullName} · {focus.roleLabel}
          </div>
          <h2 className="mt-1 text-xl font-bold text-white">Co-owner weekly focus</h2>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            {focus.weeklyTip || `Lean ${focus.laneLabel} near ${focus.city} — then clear exceptions only.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            className={FINELY_OS_PRIMARY_BTN}
            disabled={packBusy}
            onClick={() => void runCalebPack()}
          >
            {packBusy ? <Loader2 size={14} className="animate-spin" /> : null}
            Run Caleb pack <ArrowRight size={14} />
          </button>
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => (onOpenHelper ? onOpenHelper('ruth') : navigate('/admin/marketing-desk?helper=ruth'))}
          >
            Ask Ruth
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={FINELY_OS_ENTITY_SUBLABEL}>This week</span>
        <button
          type="button"
          className={finelyOsMicroStat('emerald')}
          title="Lane focus"
          onClick={() => navigate('/admin/growth-agents/lead-discovery')}
        >
          Lane · {focus.laneLabel}
        </button>
        <button
          type="button"
          className={finelyOsMicroStat('sky')}
          title="Find geo"
          onClick={() => navigate('/admin/marketing-desk?helper=find')}
        >
          City · {focus.city}
        </button>
        <button
          type="button"
          className={finelyOsMicroStat('violet')}
          title={focus.offerLabel}
          onClick={() => window.open(focus.offerPath, '_blank')}
        >
          Offer · {focus.offerLabel}
        </button>
        <button
          type="button"
          className={FINELY_OS_AI_DRAFT_BTN_SM}
          title={focus.calebPreview}
          onClick={() => navigate('/admin/growth-agents/lead-discovery')}
        >
          Caleb · {focus.calebPreview.split('·')[0]?.trim() || 'Daily pack'}
        </button>
      </div>

      {packMsg ? <FinelyOsAlertBanner tone={packMsg.includes('paused') ? 'warning' : 'success'} message={packMsg} /> : null}

      <div className="flex flex-wrap gap-2 pt-1 border-t border-white/[0.06]">
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Wow angles</span>
        {FINELY_MARKETING_DESK_WOW_LINES.slice(0, 3).map((line) => (
          <span key={line} className={finelyOsMicroStat('emerald')} title={line}>
            {line.length > 52 ? `${line.slice(0, 49)}…` : line}
          </span>
        ))}
      </div>
    </div>
  );
}
