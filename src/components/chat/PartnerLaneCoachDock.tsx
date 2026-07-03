import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PartnerLaneCoachPanel } from './PartnerLaneCoachPanel';

type Props = {
  partnerId?: string;
  partnerName?: string;
  lane: string;
  focusId?: string;
  scenarioId?: string;
  coachSubtitle?: string;
  defaultOpen?: boolean;
};

/** Collapsible on-duty coach — visible on every portal tab without crowding the workstation. */
export function PartnerLaneCoachDock({ partnerId, partnerName, lane, focusId, scenarioId, coachSubtitle, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-white/5 transition"
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-sky-300/90">On-duty specialist · {lane.replace(/_/g, ' ')}</span>
        {open ? <ChevronUp size={14} className="text-white/50" /> : <ChevronDown size={14} className="text-white/50" />}
      </button>
      {open ? (
        <div className="px-4 pb-4 border-t border-white/5">
          <PartnerLaneCoachPanel
            partnerId={partnerId}
            partnerName={partnerName}
            lane={lane}
            focusId={focusId}
            scenarioId={scenarioId}
            coachSubtitle={coachSubtitle}
            compact
          />
        </div>
      ) : null}
    </div>
  );
}
