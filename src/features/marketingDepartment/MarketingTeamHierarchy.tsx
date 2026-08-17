import React, { useState } from 'react';
import { FinelyTourPlayer } from '../../components/tours/FinelyTourPlayer';
import { getTourById } from '../../config/tourManifest';
import { FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';
import {
  MARKETING_DESK_TOUR_ID,
  markMarketingDeskTourSeen,
} from '../marketingDesk/marketingDeskTour';
import { AgentTaskHierarchyPanel } from './AgentTaskHierarchyPanel';

/** Marketing team tab — agent → task hierarchy with live status + desk tour. */
export function MarketingTeamHierarchy() {
  const [tourOpen, setTourOpen] = useState(false);
  const tour = getTourById(MARKETING_DESK_TOUR_ID);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className={FINELY_OS_SECONDARY_BTN}
          onClick={() => setTourOpen(true)}
        >
          Watch how — Marketing Desk tour
        </button>
      </div>
      <AgentTaskHierarchyPanel scope="team" showArchitect />
      {tour ? (
        <FinelyTourPlayer
          tour={tour}
          open={tourOpen}
          onClose={() => {
            markMarketingDeskTourSeen();
            setTourOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
