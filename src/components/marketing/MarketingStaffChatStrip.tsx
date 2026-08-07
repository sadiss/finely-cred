import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import type { AgentPersonaId } from '../../domain/agentPersonas';
import { listMarketingDisplayStaff } from '../../data/staffRoster';
import { openPublicChat, type PublicChatGoal } from '../../lib/publicChatEvents';
import { StaffPortraitImg } from '../staff/StaffPortraitImg';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
  finelyOsLandingIvoryCard,
} from '../../features/os/finelyOsLightUi';

type Props = {
  roleId: AgentPersonaId;
  goal: PublicChatGoal;
  roleLabel: string;
  subline?: string;
  /** @deprecated styling is unified in the staff grid */
  buttonTone?: 'success' | 'secondary';
  /** `ivory` = navy-on-champagne chrome for wealthy public shells (no dark glass). */
  surface?: 'default' | 'ivory';
};

export function MarketingStaffChatStrip({ roleId, goal, roleLabel, subline, surface = 'default' }: Props) {
  const staffPool = useMemo(() => listMarketingDisplayStaff(roleId), [roleId]);
  if (!staffPool.length) return null;

  const ivory = surface === 'ivory';

  return (
    <div className={`${ivory ? `${finelyOsLandingIvoryCard()} !p-5` : finelyOsCatalogCard('violet')} space-y-4`}>
      <div className="min-w-0">
        <div className={`${ivory ? 'text-sm font-semibold tracking-tight text-[#0a1628]' : `${FINELY_OS_ENTITY_VALUE} text-sm`}`}>
          Meet part of our {roleLabel} team
        </div>
        {subline ? (
          <p className={`${ivory ? 'text-xs mt-0.5 text-[#0a1628]/70' : `${FINELY_OS_ENTITY_BODY} text-xs mt-0.5`}`}>
            {subline}
          </p>
        ) : null}
        <p className={`${ivory ? 'text-[10px] mt-1 font-semibold uppercase tracking-[0.12em] text-[#0a1628]/45' : `${FINELY_OS_ENTITY_SUBLABEL} text-[10px] mt-1`}`}>
          Start with Aia, our AI guide — she connects you to a live specialist. Direct messages unlock after you sign up or log in.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {staffPool.map((staff) => (
          <div
            key={staff.id}
            className={`${ivory ? 'fc-glass-ivory rounded-2xl border border-amber-900/10 !p-3' : finelyOsCatalogCard('emerald')} flex flex-col gap-2`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <StaffPortraitImg
                staff={staff}
                className={`w-11 h-11 rounded-full shrink-0 border ${ivory ? 'border-emerald-700/25' : 'border-emerald-400/30'}`}
              />
              <div className="min-w-0">
                <div className={`${ivory ? 'text-xs font-semibold text-[#0a1628] truncate' : `${FINELY_OS_ENTITY_VALUE} text-xs truncate`}`}>
                  {staff.firstName}
                </div>
                <div className={`${ivory ? 'text-[9px] text-[#0a1628]/55 line-clamp-2' : `${FINELY_OS_ENTITY_SUBLABEL} text-[9px] line-clamp-2`}`}>
                  {staff.bioLine}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                openPublicChat({
                  goal,
                  personaId: roleId,
                })
              }
              className={
                ivory
                  ? 'mt-auto w-full inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg border border-emerald-700/30 bg-emerald-600/10 text-[9px] font-black uppercase text-emerald-900 hover:bg-emerald-600/15'
                  : 'mt-auto w-full inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[9px] font-black uppercase text-emerald-100 hover:bg-emerald-500/20'
              }
            >
              <Sparkles size={10} /> Chat with Aia
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
