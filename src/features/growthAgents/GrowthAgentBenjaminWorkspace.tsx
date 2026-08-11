import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GrowthAgentWorkspaceShell } from './GrowthAgentWorkspaceShell';
import { getGrowthAgent } from './growthAgentRegistry';
import { getBenjaminMaturity, markBenjaminReferralLinkCopied } from './growthAgentMaturity';
import { buildGrowthResultsSnapshot } from './growthResultsMetrics';
import { GrowthAgentBenjaminCommandGuide } from './GrowthAgentBenjaminCommandGuide';
import { countBenjaminPipeline, getBenjaminPartnershipQueue } from './benjaminPipelineQueue';
import {
  buildLaneAcquisitionUrl,
  lanesByAudience,
  laneSyndicationMessage,
  type LeadAcquisitionLane,
} from '../../lib/leadAcquisitionCatalog';
import { AF } from '../../config/affiliateProgram';
import { MarketingConsentChip } from '../marketingDesk/MarketingConsentChip';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCardCompact,
  finelyOsMicroStat,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';

const REFERRAL_LOOP_LANE_IDS = ['affiliate', 'affiliate_program', 'agency_white_label'] as const;

function benjaminReferralLanes(): LeadAcquisitionLane[] {
  const byId = new Map(lanesByAudience('all').map((l) => [l.id, l]));
  return REFERRAL_LOOP_LANE_IDS.map((id) => byId.get(id)).filter(Boolean) as LeadAcquisitionLane[];
}

function buildReferralUrl(lane: LeadAcquisitionLane, referralCode: string): string {
  return buildLaneAcquisitionUrl(lane, {
    referralCode: referralCode.trim() || undefined,
    utmSource: 'growth_agent_benjamin',
  });
}

export function GrowthAgentBenjaminWorkspace() {
  const navigate = useNavigate();
  const agent = getGrowthAgent('partnerships')!;
  const [tick, setTick] = useState(0);
  const [referralCode, setReferralCode] = useState('finely');
  const [laneId, setLaneId] = useState<string>('affiliate');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const maturity = useMemo(() => {
    void tick;
    return getBenjaminMaturity();
  }, [tick]);

  const results = useMemo(() => buildGrowthResultsSnapshot(), []);
  const pipelineCounts = useMemo(() => {
    void tick;
    return countBenjaminPipeline();
  }, [tick]);

  const queue = useMemo(() => {
    void tick;
    return getBenjaminPartnershipQueue(12);
  }, [tick]);

  const referralLanes = useMemo(() => benjaminReferralLanes(), []);
  const activeLane = referralLanes.find((l) => l.id === laneId) ?? referralLanes[0];
  const primaryUrl = activeLane ? buildReferralUrl(activeLane, referralCode) : '';

  const loopRows = useMemo(
    () =>
      referralLanes.map((lane) => ({
        lane,
        url: buildReferralUrl(lane, referralCode),
        blurb: laneSyndicationMessage(lane, buildReferralUrl(lane, referralCode)),
      })),
    [referralLanes, referralCode],
  );

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      if (key === 'primary') {
        markBenjaminReferralLinkCopied();
        setTick((t) => t + 1);
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
      headerAside={<GrowthAgentBenjaminCommandGuide tick={tick} />}
      alertMessage={
        pipelineCounts.total > 0
          ? `${pipelineCounts.total} affiliate/B2B prospect(s) in pipeline — copy referral loop links before outreach.`
          : 'Wave 4 — seed affiliate/B2B targets in Lead Intel, then copy referral loop links.'
      }
      alertTone={pipelineCounts.contactReady > 0 ? 'success' : 'info'}
      primaryAction={{
        label: copied === 'primary' ? 'Copied' : 'Copy referral link',
        onClick: () => void copyText('primary', primaryUrl),
      }}
      secondaryAction={{
        label: 'Open Lead Intel',
        onClick: () => navigate('/admin/lead-intel'),
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
          Pipeline: {pipelineCounts.total} · Contact-ready: {pipelineCounts.contactReady} · Outreach: {pipelineCounts.outreachSent}
          {pipelineCounts.booked > 0 ? ` · Booked: ${pipelineCounts.booked}` : ''}
        </p>
      }
      statusBlock={
        <ul className="space-y-1 text-sm">
          <li>Referral loop lanes: {referralLanes.length}</li>
          <li>Queue depth: {queue.length}</li>
          <li>Week focus: {results.weekFocusLabel}</li>
        </ul>
      }
    >
      <div className={finelyOsCatalogCardCompact('amber')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Referral loop link</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Affiliate toolkit, program signup, and agency white-label — tracked for partnership outreach.
        </p>
        <select
          className={`${FINELY_OS_ENTITY_SELECT} mt-2 max-w-md`}
          value={laneId}
          onChange={(e) => setLaneId(e.target.value)}
        >
          {referralLanes.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
        <label className={`mt-3 block text-xs ${FINELY_OS_ENTITY_BODY}`}>Referral code</label>
        <input
          className={`${FINELY_OS_ENTITY_INPUT} mt-1 max-w-md`}
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
        />
        <div className={`mt-3 text-xs font-mono break-all ${FINELY_OS_ENTITY_BODY}`}>{primaryUrl}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={copied === 'primary' ? FINELY_OS_SUCCESS_BTN : FINELY_OS_PRIMARY_BTN}
            onClick={() => void copyText('primary', primaryUrl)}
          >
            {copied === 'primary' ? 'Link copied' : 'Copy link'}
          </button>
          {activeLane ? (
            <button
              type="button"
              className={FINELY_OS_SECONDARY_BTN}
              onClick={() => void copyText('blurb', laneSyndicationMessage(activeLane, primaryUrl))}
            >
              {copied === 'blurb' ? 'Blurb copied' : 'Copy blurb'}
            </button>
          ) : null}
        </div>
      </div>

      <div className={finelyOsCatalogCardCompact('sky')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Referral loop factory</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          One URL per partnership lane — same ref code. Educational only; results vary.
        </p>
        <FinelyOsPaginatedStack
          items={loopRows}
          pageSize={3}
          renderItem={(row) => (
            <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-white">{row.lane.label}</span>
                <span className={finelyOsMicroStat('amber')}>{row.lane.utmCampaign}</span>
              </div>
              <p className={`text-[10px] font-mono break-all ${FINELY_OS_ENTITY_BODY}`}>{row.url}</p>
              <button
                type="button"
                className={FINELY_OS_SECONDARY_BTN}
                onClick={() => void copyText(`loop-${row.lane.id}`, row.url)}
              >
                {copied === `loop-${row.lane.id}` ? 'Copied' : 'Copy loop link'}
              </button>
            </div>
          )}
        />
      </div>

      <div className={finelyOsCatalogCardCompact('emerald')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Partnership pipeline queue</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          CRM prospects targeting affiliates, B2B partners, agencies, and referral tags — sorted by partnership fit.
        </p>
        {queue.length === 0 ? (
          <p className={`mt-3 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            No affiliate/B2B rows yet — run Caleb Find on agency_affiliates lane or import partners in Lead Intel.
          </p>
        ) : (
          <FinelyOsPaginatedStack
            items={queue}
            pageSize={4}
            renderItem={(row) => {
              const p = row.prospect;
              const email = p.contact.emails?.[0];
              const name = p.contact.name || p.company.name || 'Prospect';
              return (
                <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white truncate max-w-[180px]">{name}</span>
                    <span className={finelyOsMicroStat('emerald')}>Score {row.partnershipScore}</span>
                    <span className={finelyOsStatusChip(p.stage === 'contact_ready' ? 'ok' : 'warn')}>{p.stage.replace(/_/g, ' ')}</span>
                    <span className={finelyOsMicroStat('sky')}>{p.target.replace(/_/g, ' ')}</span>
                  </div>
                  {email ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>{email}</span>
                      <MarketingConsentChip prospect={p} />
                    </div>
                  ) : (
                    <p className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>No email — enrich in Find before Mail.</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={FINELY_OS_SECONDARY_BTN}
                      onClick={() => navigate('/admin/marketing-desk?helper=board')}
                    >
                      Desk · Board
                    </button>
                    <button
                      type="button"
                      className={FINELY_OS_SECONDARY_BTN}
                      onClick={() => navigate('/admin/marketing-desk?helper=mail')}
                    >
                      Desk · Mail
                    </button>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/growth-agents/capture-links')}>
          Hannah · tracked links
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(AF.publicPath)}>
          Affiliate program
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/marketing-desk?helper=find')}>
          Desk · Find
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/growth-agents/marketing-director')}>
          Esther · week focus
        </button>
      </div>
    </GrowthAgentWorkspaceShell>
  );
}
