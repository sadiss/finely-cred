import React, { useMemo } from 'react';
import { MessageCircle } from 'lucide-react';
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
  /** `ivory` = clean paper cards on wealthy public shells (no dark glass wash). */
  surface?: 'default' | 'ivory';
};

export function MarketingStaffChatStrip({ roleId, goal, roleLabel, subline, surface = 'default' }: Props) {
  const staffPool = useMemo(() => listMarketingDisplayStaff(roleId), [roleId]);
  if (!staffPool.length) return null;

  const ivory = surface === 'ivory';

  return (
    <div
      className={`${
        ivory
          ? 'rounded-2xl border border-[#0a1628]/12 bg-white/95 shadow-[0_16px_40px_-28px_rgba(10,22,40,0.22)] !p-5'
          : finelyOsCatalogCard('violet')
      } space-y-4`}
      data-fc-marketing-staff-strip="1"
    >
      <div className="min-w-0">
        <div className={`${ivory ? 'text-sm font-semibold tracking-tight text-[#0a1628]' : `${FINELY_OS_ENTITY_VALUE} text-sm`}`}>
          Meet part of our {roleLabel} team
        </div>
        {subline ? (
          <p className={`${ivory ? 'text-xs mt-0.5 text-[#0a1628]/70' : `${FINELY_OS_ENTITY_BODY} text-xs mt-0.5`}`}>
            {subline}
          </p>
        ) : null}
        <p className={`${ivory ? 'text-[10px] mt-1 font-semibold uppercase tracking-[0.12em] text-[#0a1628]/50' : `${FINELY_OS_ENTITY_SUBLABEL} text-[10px] mt-1`}`}>
          Tap a specialist below — our AI guide can help in chat if you are not sure where to start. Direct messages unlock after you sign up or log in.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {staffPool.map((staff) => (
          <div
            key={staff.id}
            className={`${
              ivory
                ? 'rounded-2xl border border-[#0a1628]/10 bg-[#faf6ee] !p-3 shadow-sm'
                : finelyOsCatalogCard('emerald')
            } flex flex-col gap-2`}
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
                <div className={`${ivory ? 'text-[9px] text-[#0a1628]/60 line-clamp-2' : `${FINELY_OS_ENTITY_SUBLABEL} text-[9px] line-clamp-2`}`}>
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
                  ? 'mt-auto w-full inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg border border-emerald-700/35 bg-emerald-600 text-[9px] font-black uppercase text-white hover:bg-emerald-700'
                  : 'mt-auto w-full inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[9px] font-black uppercase text-emerald-100 hover:bg-emerald-500/20'
              }
            >
              <MessageCircle size={10} /> Chat with {staff.firstName}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
