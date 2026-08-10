import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GrowthAgentWorkspaceShell } from './GrowthAgentWorkspaceShell';
import { getGrowthAgent, GROWTH_AGENT_WAVE0_LANE } from './growthAgentRegistry';
import { getAgentMaturity, markHannahCampaignLinkCopied } from './growthAgentMaturity';
import { buildGrowthResultsSnapshot } from './growthResultsMetrics';
import { setGrowthWeekFocus } from './growthWeekFocus';
import {
  buildLaneAcquisitionUrl,
  buildVideoUtmContent,
  laneSyndicationMessage,
  LEAD_ACQUISITION_LANES,
  resolvePromoteVideoIdFromSearch,
  type LeadAcquisitionLane,
} from '../../lib/leadAcquisitionCatalog';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCardCompact,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

function hannahLanesForPicker(): LeadAcquisitionLane[] {
  const agent = getGrowthAgent('capture-links');
  const ids = agent?.acquisitionLaneIds;
  if (!ids?.length) return LEAD_ACQUISITION_LANES;
  return LEAD_ACQUISITION_LANES.filter((l) => ids.includes(l.id));
}

export function GrowthAgentHannahWorkspace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const agent = getGrowthAgent('capture-links')!;
  const lanes = useMemo(() => hannahLanesForPicker(), []);
  const [laneId, setLaneId] = useState<string>(() => {
    const preferred = lanes.find((l) => l.id === GROWTH_AGENT_WAVE0_LANE)?.id ?? lanes[0]?.id ?? GROWTH_AGENT_WAVE0_LANE;
    return preferred;
  });
  const [referralCode, setReferralCode] = useState('finely');
  const [copied, setCopied] = useState<string | null>(null);
  const [maturityTick, setMaturityTick] = useState(0);

  const promoteVideoId = useMemo(
    () => resolvePromoteVideoIdFromSearch(searchParams.toString()),
    [searchParams],
  );
  const videoUtmContent = promoteVideoId ? buildVideoUtmContent(promoteVideoId) : undefined;

  useEffect(() => {
    if (!promoteVideoId) return;
    setGrowthWeekFocus({ pillarVideoId: promoteVideoId });
  }, [promoteVideoId]);

  const lane = lanes.find((l) => l.id === laneId) ?? lanes[0];
  const acquisitionUrl = lane
    ? buildLaneAcquisitionUrl(lane, {
        referralCode: referralCode.trim() || undefined,
        utmSource: 'growth_agent_hannah',
        utmContent: videoUtmContent,
      })
    : '';
  const syndicationBlurb = lane ? laneSyndicationMessage(lane, acquisitionUrl) : '';

  const maturity = useMemo(() => {
    void maturityTick;
    return getAgentMaturity(agent);
  }, [agent, maturityTick]);
  const results = useMemo(() => buildGrowthResultsSnapshot(), []);

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      if (key === 'link') {
        markHannahCampaignLinkCopied();
        setMaturityTick((t) => t + 1);
      }
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <GrowthAgentWorkspaceShell
      accent={agent.accent}
      name={agent.name}
      roleTitle={agent.roleTitle}
      mission={agent.mission}
      maturityPercent={maturity.percent}
      maturityLabel={maturity.label}
      alertMessage={
        promoteVideoId
          ? `Content Studio promote — links include utm_content=${videoUtmContent}. Copy before posting.`
          : 'Wave 1 — copy tracked links before posting in directories or forums.'
      }
      alertTone="info"
      primaryAction={{
        label: copied === 'link' ? 'Copied' : 'Copy tracked link',
        onClick: () => void copyText('link', acquisitionUrl),
      }}
      secondaryAction={{
        label: copied === 'blurb' ? 'Copied' : 'Copy syndication blurb',
        onClick: () => void copyText('blurb', syndicationBlurb),
      }}
      nextStep={results.todaySentence}
      setupBlock={
        <ul className="space-y-1 text-sm">
          {maturity.items.map((i) => (
            <li key={i.id} className={i.done ? 'text-emerald-300/90' : 'text-amber-200/90'}>
              {i.done ? '✓' : '○'} {i.label}
            </li>
          ))}
        </ul>
      }
      lastRunBlock={
        <p className={FINELY_OS_ENTITY_BODY}>
          Default campaign: credit restore guide — matches Wave 0 lane. Open Lead Acquisition for QR and webhook tools.
        </p>
      }
      statusBlock={
        <ul className="space-y-1 text-sm">
          <li>Campaigns in picker: {lanes.length}</li>
          <li>Active lane: {lane?.label ?? '—'}</li>
          {promoteVideoId ? <li>Video attribution: {videoUtmContent}</li> : null}
        </ul>
      }
    >
      <div className={finelyOsCatalogCardCompact('amber')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Campaign</div>
        {promoteVideoId ? (
          <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Promote step video id <span className="font-mono text-amber-200/90">{promoteVideoId}</span> — tracked in utm_content.
          </p>
        ) : null}
        <select
          className={`${FINELY_OS_ENTITY_SELECT} mt-2 max-w-md`}
          value={laneId}
          onChange={(e) => setLaneId(e.target.value)}
        >
          {lanes.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
        <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>{lane?.description}</p>

        <label className={`mt-3 block text-xs ${FINELY_OS_ENTITY_BODY}`}>Referral code</label>
        <input
          className={`${FINELY_OS_ENTITY_INPUT} mt-1 max-w-md`}
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
        />

        <div className={`mt-3 text-xs font-mono break-all ${FINELY_OS_ENTITY_BODY}`}>{acquisitionUrl}</div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={copied === 'link' ? FINELY_OS_SUCCESS_BTN : FINELY_OS_SECONDARY_BTN}
            onClick={() => void copyText('link', acquisitionUrl)}
          >
            {copied === 'link' ? 'Link copied' : 'Copy link'}
          </button>
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => void copyText('blurb', syndicationBlurb)}
          >
            {copied === 'blurb' ? 'Blurb copied' : 'Copy blurb'}
          </button>
          {lane?.id === GROWTH_AGENT_WAVE0_LANE ? finelyOsStatusChip('ok') : finelyOsStatusChip('warn')}
        </div>
      </div>

      <div className={finelyOsCatalogCardCompact('amber')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Syndication blurb</div>
        <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>{syndicationBlurb}</p>
        <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Educational only · results vary · not legal advice. Approve before webhooks or RSS fire.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/lead-acquisition')}>
          Open Lead Acquisition
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/marketing-desk')}>
          Marketing Desk
        </button>
      </div>
    </GrowthAgentWorkspaceShell>
  );
}
