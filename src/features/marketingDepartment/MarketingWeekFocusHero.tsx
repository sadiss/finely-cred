import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Target, Video } from 'lucide-react';
import { getGrowthWeekFocus } from '../growthAgents/growthWeekFocus';
import { FINELY_WOW_CHIPS } from '../../config/finelyMarketingDifferentiators';
import { MARKETING_HUB_CONTENT_SHELL, MarketingSectionHeader, marketingVividShell } from './marketingHubUi';
import { MarketingHelpButton } from './MarketingHelpModal';

export function MarketingWeekFocusHero() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const focus = useMemo(() => {
    void tick;
    return getGrowthWeekFocus();
  }, [tick]);

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const wow = FINELY_WOW_CHIPS.slice(0, 6);

  return (
    <div className={`${MARKETING_HUB_CONTENT_SHELL} space-y-4`}>
      <MarketingSectionHeader
        eyebrow="Co-owner command"
        title="Weekly focus & wow angles"
        subtitle="Everything on this hub should align to the lane + city on the left."
        helpId="weekly_focus"
      />
      <div className="grid lg:grid-cols-[1.15fr_1fr] gap-3">
        <div className={`${marketingVividShell('violet')} !p-4`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Weekly focus</p>
            <MarketingHelpButton helpId="weekly_focus" />
          </div>
          <h3 className="mt-1 text-2xl font-black tracking-tight">{focus.laneLabel}</h3>
          <div className="mt-3 grid sm:grid-cols-2 gap-2">
            <div className={`${marketingVividShell('sky', false)} !p-3 flex items-center gap-2`}>
              <MapPin size={18} />
              <div>
                <div className="text-[10px] font-bold uppercase opacity-80">City</div>
                <div className="text-sm font-bold">{focus.city}</div>
              </div>
            </div>
            <div className={`${marketingVividShell('emerald', false)} !p-3 flex items-center gap-2`}>
              <Target size={18} />
              <div>
                <div className="text-[10px] font-bold uppercase opacity-80">Lane</div>
                <div className="text-sm font-bold">{focus.lane}</div>
              </div>
            </div>
          </div>
          {focus.pillarVideoId ? (
            <div className={`${marketingVividShell('fuchsia', false)} !p-2 mt-2 flex items-center gap-2 text-xs`}>
              <Video size={14} />
              Pillar: <span className="font-bold">{focus.pillarVideoId}</span>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-black/30 border border-white/25 px-3 py-2 text-xs font-bold hover:bg-black/40 fc-mkt-hover-lift"
              onClick={() => navigate('/admin/marketing?tab=plan')}
            >
              Edit plan
            </button>
            <button
              type="button"
              className="rounded-lg bg-black/30 border border-white/25 px-3 py-2 text-xs font-bold hover:bg-black/40 fc-mkt-hover-lift"
              onClick={() => navigate('/admin/growth-agents/marketing-director')}
            >
              Esther workspace
            </button>
          </div>
        </div>

        <div className={`${marketingVividShell('emerald')} !p-4`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Wow angles</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {wow.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => chip.path && navigate(chip.path)}
                className={`${marketingVividShell(chip.accent, false)} !p-2.5 text-left fc-mkt-hover-lift`}
                title={chip.hint}
              >
                <div className="text-[10px] font-bold uppercase">{chip.label}</div>
                <p className="mt-1 text-[10px] leading-snug text-white/90 line-clamp-2">{chip.hint}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
