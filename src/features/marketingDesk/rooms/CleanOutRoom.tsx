import React from 'react';
import { LeadTrashPanel } from '../../studioCommandOs/LeadTrashPanel';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_PRIMARY_BTN } from '../../os/finelyOsLightUi';
import { useNavigate } from 'react-router-dom';

export function CleanOutRoom() {
  const navigate = useNavigate();
  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 rounded-2xl border border-rose-400/25 bg-black/70 backdrop-blur-md !p-4 space-y-2">
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Clean out junk</div>
        <h2 className="text-xl font-bold text-white">Hide from Board · Put back anytime</h2>
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
