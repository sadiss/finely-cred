import React from 'react';
import { HubAiCoachPanel } from './HubAiCoachPanel';
import { OnDutyStaffCoachHeader } from './OnDutyStaffCoachHeader';

type Props = {
  partnerId?: string;
  partnerName?: string;
  lane: string;
  scenarioId?: string;
  focusId?: string;
  journeyStage?: string;
  compact?: boolean;
  coachSubtitle?: string;
};

export function PartnerLaneCoachPanel({
  partnerId,
  partnerName,
  lane,
  scenarioId,
  focusId,
  journeyStage,
  compact,
  coachSubtitle,
}: Props) {
  return (
    <div className="space-y-3">
      <OnDutyStaffCoachHeader lane={lane} scenarioId={scenarioId} focusId={focusId} subtitle={coachSubtitle} />
      <HubAiCoachPanel
        partnerId={partnerId}
        lane={lane}
        journeyStage={journeyStage}
        compact={compact}
        userName={partnerName}
      />
    </div>
  );
}
