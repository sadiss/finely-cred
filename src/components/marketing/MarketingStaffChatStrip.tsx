import React, { useMemo } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import type { AgentPersonaId } from '../../domain/agentPersonas';
import { listStaffByRole } from '../../data/staffRoster';
import { staffMemberFullName } from '../../domain/staffMember';
import { openPublicChat, type PublicChatGoal } from '../../lib/publicChatEvents';
import { openCommunicationHub } from '../chat/communicationHubModel';
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
  const staffPool = useMemo(() => listStaffByRole(roleId), [roleId]);
  if (!staffPool.length) return null;

  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
      <div className="min-w-0">
        <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>Chat with our {roleLabel} team</div>
        {subline ? <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-0.5`}>{subline}</p> : null}
        <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-[10px] mt-1`}>
          Pick anyone below — AI chat or direct message in your portal.
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
            <div className="flex flex-wrap gap-1 mt-auto">
              <button
                type="button"
                onClick={() =>
                  openPublicChat({
                    goal,
                    personaId: staff.primaryRoleId,
                  })
                }
                className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[9px] font-black uppercase text-emerald-100 hover:bg-emerald-500/20"
              >
                <Sparkles size={10} /> AI
              </button>
              <button
                type="button"
                onClick={() => {
                  openCommunicationHub({ tab: 'team', expanded: true });
                  window.dispatchEvent(
                    new CustomEvent('finely:staff-direct-message', {
                      detail: { staffId: staff.id, staffName: staffMemberFullName(staff) },
                    }),
                  );
                }}
                className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 text-[9px] font-black uppercase text-sky-100 hover:bg-sky-500/20"
              >
                <MessageCircle size={10} /> DM
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
