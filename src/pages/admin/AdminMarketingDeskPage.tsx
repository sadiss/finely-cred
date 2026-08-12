import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FINELY_OS_BACK_LINK, FINELY_OS_COMPACT_PAGE, FINELY_OS_SECONDARY_BTN } from '../../features/os/finelyOsLightUi';
import { MarketingDeskAgentStrip } from '../../features/marketingDesk/MarketingDeskAgentStrip';
import { MarketingDeskHome } from '../../features/marketingDesk/MarketingDeskHome';
import { MarketingDeskRuthCommandStrip } from '../../features/marketingDesk/MarketingDeskRuthCommandStrip';
import type { MarketingDeskHelperId } from '../../features/marketingDesk/marketingDeskGlossary';
import { FindPeopleRoom } from '../../features/marketingDesk/rooms/FindPeopleRoom';
import { BoardRoom } from '../../features/marketingDesk/rooms/BoardRoom';
import { CleanOutRoom } from '../../features/marketingDesk/rooms/CleanOutRoom';
import { RuthRoom } from '../../features/marketingDesk/rooms/RuthRoom';
import { MailAutopilotRoom } from '../../features/marketingDesk/rooms/MailAutopilotRoom';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';

const HELPERS = new Set<MarketingDeskHelperId>(['find', 'board', 'clean', 'ruth', 'mail']);

function parseHelper(raw: string | null): MarketingDeskHelperId | null {
  if (!raw) return null;
  return HELPERS.has(raw as MarketingDeskHelperId) ? (raw as MarketingDeskHelperId) : null;
}

export default function AdminMarketingDeskPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const helper = useMemo(
    () => parseHelper(params.get('helper') || params.get('room') || params.get('tab')),
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

  const closeHelper = () => {
    const next = new URLSearchParams(params);
    next.delete('helper');
    next.delete('room');
    next.delete('tab');
    setParams(next, { replace: true });
  };

  return (
    <PageShell
      badge="Admin"
      title="Marketing Desk"
      subtitle="Caleb's daily workroom — Find · Board · Mail."
    >
      <div className={FINELY_OS_COMPACT_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => (helper ? closeHelper() : navigate('/admin'))}
            className={FINELY_OS_BACK_LINK}
          >
            <ArrowLeft size={16} /> {helper ? 'Marketing Desk home' : 'Admin Dashboard'}
          </button>
          {!helper ? (
            <button
              type="button"
              className={FINELY_OS_SECONDARY_BTN}
              onClick={() => navigate('/admin/growth-agents/lead-discovery')}
            >
              Open Caleb desk
            </button>
          ) : null}
        </div>

        {!flagOn ? (
          <FinelyOsAlertBanner
            tone="warning"
            message="Marketing Desk flag is off in Settings → Features. Surface still available for preview."
          />
        ) : null}

        {!helper ? <MarketingDeskRuthCommandStrip onOpenHelper={openHelper} /> : null}
        {!helper ? <MarketingDeskAgentStrip /> : null}
        {!helper ? <MarketingDeskHome onOpenHelper={openHelper} /> : null}
        {helper === 'find' ? <FindPeopleRoom /> : null}
        {helper === 'board' ? <BoardRoom /> : null}
        {helper === 'clean' ? <CleanOutRoom /> : null}
        {helper === 'ruth' ? <RuthRoom /> : null}
        {helper === 'mail' ? <MailAutopilotRoom /> : null}

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
