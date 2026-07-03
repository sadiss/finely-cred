import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDebtLaneFocus } from '../../data/debtLaneStateRepo';
import { resolveStaffForLaneFocus } from '../../data/staffRoster';
import { staffMemberFullName } from '../../domain/staffMember';
import { StaffPortraitImg } from '../staff/StaffPortraitImg';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_PRIMARY_BTN } from '../../features/os/finelyOsLightUi';

const WORKSTATION_LABELS: Record<string, string> = {
  validation: 'Validation & FDCPA',
  court: 'Court & summons',
  foreclosure: 'Foreclosure defense',
  repossession: 'Repossession defense',
  bankruptcy: 'Bankruptcy prep',
};

export function DebtLaneHandoffStrip({ partnerId }: { partnerId: string }) {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);

  const focus = useMemo(() => {
    void version;
    return getDebtLaneFocus(partnerId);
  }, [partnerId, version]);

  const coach = useMemo(() => {
    if (!focus?.workstation) return null;
    return resolveStaffForLaneFocus(focus.workstation, focus.workstation);
  }, [focus?.workstation]);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore);
    return () => window.removeEventListener('finely:store', onStore);
  }, []);

  if (!focus?.workstation || !coach) return null;

  return (
    <div className="rounded-2xl border border-violet-500/25 bg-violet-500/10 p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <StaffPortraitImg staff={coach} className="h-12 w-12 rounded-xl border border-violet-400/30 shrink-0" />
        <div>
          <div className="text-sm font-bold text-white">
            {WORKSTATION_LABELS[focus.workstation] ?? focus.workstation}: {staffMemberFullName(coach)}
          </div>
          <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>Your debt workstation specialist — expand the coach dock on any tab.</p>
        </div>
      </div>
      <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/portal/messages?hub=team')}>
        <MessageSquare size={14} /> Open messages
      </button>
    </div>
  );
}
