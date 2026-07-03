import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDisputeLaneFocus } from '../../data/disputeLaneStateRepo';
import { resolveStaffForLaneFocus } from '../../data/staffRoster';
import { staffMemberFullName } from '../../domain/staffMember';
import { bureauFullName } from '../../utils/bureaus';
import type { Bureau } from '../../domain/creditReports';
import { StaffPortraitImg } from '../staff/StaffPortraitImg';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_PRIMARY_BTN } from '../../features/os/finelyOsLightUi';

export function DisputeLaneHandoffStrip({ partnerId }: { partnerId: string }) {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);

  const focus = useMemo(() => {
    void version;
    return getDisputeLaneFocus(partnerId);
  }, [partnerId, version]);

  const coach = useMemo(() => {
    if (!focus?.bureau) return null;
    return resolveStaffForLaneFocus(focus.bureau, 'dispute');
  }, [focus?.bureau]);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore);
    return () => window.removeEventListener('finely:store', onStore);
  }, []);

  if (!focus?.bureau || !coach) return null;

  return (
    <div className="rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/10 p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <StaffPortraitImg staff={coach} className="h-12 w-12 rounded-xl border border-fuchsia-400/30 shrink-0" />
        <div>
          <div className="text-sm font-bold text-white">
            {bureauFullName(focus.bureau as Bureau)} specialist: {staffMemberFullName(coach)}
          </div>
          <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>Your bureau dispute coach for this file — message anytime.</p>
        </div>
      </div>
      <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/portal/messages?hub=team')}>
        <MessageSquare size={14} /> Open messages
      </button>
    </div>
  );
}
