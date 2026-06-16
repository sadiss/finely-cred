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
} from '../../features/os/finelyOsLightUi';

type Props = {
  roleId: AgentPersonaId;
  goal: PublicChatGoal;
  roleLabel: string;
  subline?: string;
  /** @deprecated styling is unified in the staff grid */
  buttonTone?: 'success' | 'secondary';
};

export function MarketingStaffChatStrip({ roleId, goal, roleLabel, subline }: Props) {
  const staffPool = useMemo(() => listMarketingDisplayStaff(roleId), [roleId]);
  if (!staffPool.length) return null;

  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
      <div className="min-w-0">
        <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>Meet part of our {roleLabel} team</div>
        {subline ? <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-0.5`}>{subline}</p> : null}
        <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-[10px] mt-1`}>
          Start with Aia, our AI guide — she connects you to a live specialist. Direct messages unlock after you sign up or log in.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {staffPool.map((staff) => (
          <div key={staff.id} className={`${finelyOsCatalogCard('emerald')} !p-3 flex flex-col gap-2`}>
            <div className="flex items-center gap-2 min-w-0">
              <StaffPortraitImg staff={staff} className="w-11 h-11 rounded-full border border-emerald-400/30 shrink-0" />
              <div className="min-w-0">
                <div className={`${FINELY_OS_ENTITY_VALUE} text-xs truncate`}>{staff.firstName}</div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-[9px] line-clamp-2`}>{staff.bioLine}</div>
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
              className="mt-auto w-full inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[9px] font-black uppercase text-emerald-100 hover:bg-emerald-500/20"
            >
              <Sparkles size={10} /> Chat with Aia
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
