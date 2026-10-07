import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MarketingDeskHome } from '../marketingDesk/MarketingDeskHome';
import type { MarketingDeskHelperId } from '../marketingDesk/marketingDeskGlossary';
import { FindPeopleRoom } from '../marketingDesk/rooms/FindPeopleRoom';
import { BoardRoom } from '../marketingDesk/rooms/BoardRoom';
import { CleanOutRoom } from '../marketingDesk/rooms/CleanOutRoom';
import { RuthRoom } from '../marketingDesk/rooms/RuthRoom';
import { MailAutopilotRoom } from '../marketingDesk/rooms/MailAutopilotRoom';
import { FinelyOsAlertBanner } from '../os/FinelyOsAlertBanner';
import { isFeatureEnabled } from '../../data/settingsRepo';

const HELPERS = new Set<MarketingDeskHelperId>(['find', 'board', 'clean', 'ruth', 'mail']);

function parseHelper(raw: string | null): MarketingDeskHelperId | null {
  if (!raw) return null;
  return HELPERS.has(raw as MarketingDeskHelperId) ? (raw as MarketingDeskHelperId) : null;
}

/** Live Marketing Desk body — home or one room. No extra strips. */
export function MarketingDeskEmbeddedPanel() {
  const [params, setParams] = useSearchParams();
  const helper = useMemo(
    () => parseHelper(params.get('helper') || params.get('room')),
    [params],
  );
  const flagOn = isFeatureEnabled('marketingDesk');

  const openHelper = (id: MarketingDeskHelperId) => {
    const next = new URLSearchParams(params);
    next.set('helper', id);
    next.delete('room');
    next.delete('tab');
    setParams(next, { replace: false });
  };

  return (
    <div className="space-y-6">
      {!flagOn ? (
        <FinelyOsAlertBanner
          tone="warning"
          message="Marketing Desk flag is off in Settings → Features. This page still works."
        />
      ) : null}
      {!helper ? <MarketingDeskHome onOpenHelper={openHelper} /> : null}
      {helper === 'find' ? <FindPeopleRoom /> : null}
      {helper === 'board' ? <BoardRoom /> : null}
      {helper === 'clean' ? <CleanOutRoom /> : null}
      {helper === 'ruth' ? <RuthRoom /> : null}
      {helper === 'mail' ? <MailAutopilotRoom /> : null}
    </div>
  );
}
