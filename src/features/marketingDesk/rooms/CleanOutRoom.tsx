import React from 'react';
import { LeadTrashPanel } from '../../studioCommandOs/LeadTrashPanel';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_PRIMARY_BTN } from '../../os/finelyOsLightUi';
import { useNavigate } from 'react-router-dom';
import { MARKETING_DESK_CARD } from '../marketingDeskGlossary';

export function CleanOutRoom() {
  const navigate = useNavigate();
  return (
    <div className="space-y-3">
      <div className={`${MARKETING_DESK_CARD} sticky top-0 z-10 space-y-3`}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Clean out junk</div>
        <h2 className="text-xl font-bold text-[#0a1628]">Hide from Board · Put back anytime</h2>
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
          Clean out removes people from the Board immediately. Put back restores them.
        </p>
        <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/admin/marketing-desk?helper=board')}>
          Back to Board
        </button>
      </div>
      <LeadTrashPanel compact />
    </div>
  );
}
