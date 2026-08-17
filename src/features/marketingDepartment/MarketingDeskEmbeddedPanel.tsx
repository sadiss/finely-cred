import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MarketingDeskAgentStrip } from '../marketingDesk/MarketingDeskAgentStrip';
import { AgentTaskHierarchyPanel } from './AgentTaskHierarchyPanel';
import { MarketingDeskHome } from '../marketingDesk/MarketingDeskHome';
import { MarketingDeskRuthCommandStrip } from '../marketingDesk/MarketingDeskRuthCommandStrip';
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

/** Marketing Desk without outer PageShell — for Marketing Department tab embed. */
export function MarketingDeskEmbeddedPanel() {
  const [params, setParams] = useSearchParams();
  const helper = useMemo(
    () => parseHelper(params.get('helper') || params.get('room') || params.get('tab')),
    [params],
  );
  const flagOn = isFeatureEnabled('marketingDesk');

  const openHelper = (id: MarketingDeskHelperId) => {
    const next = new URLSearchParams(params);
    next.set('tab', 'desk');
    next.set('helper', id);
    next.delete('room');
    setParams(next, { replace: false });
  };

  return (
    <div className="space-y-3">
      {!flagOn ? (
        <FinelyOsAlertBanner
          tone="warning"
          message="Marketing Desk flag is off in Settings → Features. Surface still available for preview."
        />
      ) : null}
      {!helper ? <MarketingDeskRuthCommandStrip onOpenHelper={openHelper} /> : null}
      {!helper ? <AgentTaskHierarchyPanel scope="desk" showArchitect={false} /> : null}
      {!helper ? <MarketingDeskAgentStrip /> : null}
      {!helper ? <MarketingDeskHome onOpenHelper={openHelper} /> : null}
      {helper === 'find' ? <FindPeopleRoom /> : null}
      {helper === 'board' ? <BoardRoom /> : null}
      {helper === 'clean' ? <CleanOutRoom /> : null}
      {helper === 'ruth' ? <RuthRoom /> : null}
      {helper === 'mail' ? <MailAutopilotRoom /> : null}
    </div>
  );
}
