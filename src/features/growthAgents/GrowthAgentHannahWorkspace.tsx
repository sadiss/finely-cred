import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GrowthAgentWorkspaceShell } from './GrowthAgentWorkspaceShell';
import { getGrowthAgent, GROWTH_AGENT_WAVE0_LANE } from './growthAgentRegistry';
import { getHannahMaturity, markHannahCampaignLinkCopied } from './growthAgentMaturity';
import { buildGrowthResultsSnapshot } from './growthResultsMetrics';
import { setGrowthWeekFocus } from './growthWeekFocus';
import {
  buildLaneAcquisitionUrl,
  buildVideoUtmContent,
  laneSyndicationMessage,
  LEAD_ACQUISITION_LANES,
  resolveLaneCtaIntentMeta,
  resolvePromoteVideoIdFromSearch,
  type LeadAcquisitionLane,
} from '../../lib/leadAcquisitionCatalog';
import { listDistributionJobs, patchDistributionJob } from '../../data/leadDistributionRepo';
import { GrowthAgentHannahCommandGuide } from './GrowthAgentHannahCommandGuide';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowTile,
  finelyOsMicroStat,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';

function hannahLanesForPicker(): LeadAcquisitionLane[] {
  const agent = getGrowthAgent('capture-links');
  const ids = agent?.acquisitionLaneIds;
  if (!ids?.length) return LEAD_ACQUISITION_LANES;
  return LEAD_ACQUISITION_LANES.filter((l) => ids.includes(l.id));
}

function parseUtmFields(fullUrl: string): Record<string, string> {
  try {
    const u = new URL(fullUrl, typeof window !== 'undefined' ? window.location.origin : 'https://finelycred.com');
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref'];
    const out: Record<string, string> = {};
    for (const k of keys) {
      const v = u.searchParams.get(k)?.trim();
      if (v) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function buildMagnetUrl(
  lane: LeadAcquisitionLane,
  referralCode: string,
  videoUtmContent?: string,
): string {
  return buildLaneAcquisitionUrl(lane, {
    referralCode: referralCode.trim() || undefined,
    utmSource: 'growth_agent_hannah',
    utmContent: videoUtmContent,
  });
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
  const [tick, setTick] = useState(0);

  const promoteVideoId = useMemo(
    () => resolvePromoteVideoIdFromSearch(searchParams.toString()),
    [searchParams],
  );
  const videoUtmContent = promoteVideoId ? buildVideoUtmContent(promoteVideoId) : undefined;

  useEffect(() => {
    if (!promoteVideoId) return;
    setGrowthWeekFocus({ pillarVideoId: promoteVideoId });
  }, [promoteVideoId]);

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const lane = lanes.find((l) => l.id === laneId) ?? lanes[0];
  const acquisitionUrl = lane ? buildMagnetUrl(lane, referralCode, videoUtmContent) : '';
  const syndicationBlurb = lane ? laneSyndicationMessage(lane, acquisitionUrl) : '';
  const utmFields = useMemo(() => parseUtmFields(acquisitionUrl), [acquisitionUrl]);

  const magnetRows = useMemo(() => {
    return lanes.map((l) => ({
      lane: l,
      url: buildMagnetUrl(l, referralCode, videoUtmContent),
      cta: resolveLaneCtaIntentMeta(l),
    }));
  }, [lanes, referralCode, videoUtmContent]);

  const activeCta = useMemo(() => (lane ? resolveLaneCtaIntentMeta(lane) : null), [lane]);

  const approveQueue = useMemo(() => {
    void tick;
    return listDistributionJobs(40).filter((j) => j.status === 'draft' || j.status === 'queued');
  }, [tick]);

  const maturity = useMemo(() => {
    void tick;
    return getHannahMaturity();
  }, [tick]);
  const results = useMemo(() => buildGrowthResultsSnapshot(), []);

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      if (key === 'link') {
        markHannahCampaignLinkCopied();
        setTick((t) => t + 1);
      }
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const approveJob = (jobId: string) => {
    patchDistributionJob(jobId, { status: 'approved' });
    setTick((t) => t + 1);
  };

  return (
    <GrowthAgentWorkspaceShell
      accent={agent.accent}
      name={agent.name}
      roleTitle={agent.roleTitle}
      mission={agent.mission}
      maturityPercent={maturity.percent}
      maturityLabel={maturity.label}
      headerAside={<GrowthAgentHannahCommandGuide tick={tick} />}
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
          Active lane: {lane?.label ?? '—'} · {approveQueue.length} job(s) awaiting approve in queue stub.
        </p>
      }
      statusBlock={
        <ul className="space-y-1 text-sm">
          <li>Campaigns in picker: {lanes.length}</li>
          <li>Week focus lane: {results.weekFocusLabel}</li>
          {promoteVideoId ? <li>Video attribution: {videoUtmContent}</li> : null}
        </ul>
      }
    >
      <div className={finelyOsCatalogCardCompact('amber')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Campaign link</div>
        {promoteVideoId ? (
          <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Promote video id <span className="font-mono text-amber-200/90">{promoteVideoId}</span>
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-1.5 max-w-md">
          {lanes.map((l) => {
            const active = l.id === laneId;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setLaneId(l.id)}
                className={`px-2.5 py-1.5 text-[10px] font-bold ${finelyOsGlowTile(active ? 'amber' : 'sky', active)} ${active ? 'text-amber-100' : 'text-white/70'}`}
              >
                {l.label}
              </button>
            );
          })}
        </div>
        <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>{lane?.description}</p>
        {activeCta ? (
          <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            CTA intent:{' '}
            <span className={finelyOsMicroStat('amber')}>{activeCta.intentLabel}</span>
            <span className="text-white/50"> · </span>
            <span className="font-mono text-[10px] text-white/70">{activeCta.path}</span>
          </p>
        ) : null}

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
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void copyText('blurb', syndicationBlurb)}>
            {copied === 'blurb' ? 'Blurb copied' : 'Copy blurb'}
          </button>
          {lane?.id === GROWTH_AGENT_WAVE0_LANE ? finelyOsStatusChip('ok') : finelyOsStatusChip('warn')}
        </div>

        <div className={`mt-3 ${FINELY_OS_ENTITY_SUBLABEL}`}>UTM copy chips</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(utmFields).map(([k, v]) => (
            <button
              key={k}
              type="button"
              className={finelyOsMicroStat('amber')}
              title={v}
              onClick={() => void copyText(`utm-${k}`, v)}
            >
              {copied === `utm-${k}` ? 'Copied' : `${k}=${v.length > 18 ? `${v.slice(0, 16)}…` : v}`}
            </button>
          ))}
          {!Object.keys(utmFields).length ? (
            <span className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Pick a lane to load UTM chips.</span>
          ) : null}
        </div>
      </div>

      <div className={finelyOsCatalogCardCompact('amber')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Lane magnet link factory</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          One tracked URL per offer lane — paths resolve via finelyCtaIntent (guide, intake, career, consultation).
        </p>
        <FinelyOsPaginatedStack
          items={magnetRows}
          pageSize={4}
          renderItem={(row) => (
            <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-white">{row.lane.label}</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className={finelyOsMicroStat('emerald')}>{row.cta.intentLabel}</span>
                  <span className={finelyOsMicroStat('sky')}>{row.lane.utmCampaign}</span>
                </div>
              </div>
              <p className={`text-[10px] font-mono break-all text-white/60`}>{row.cta.path}</p>
              <p className={`text-[10px] font-mono break-all ${FINELY_OS_ENTITY_BODY}`}>{row.url}</p>
              <button
                type="button"
                className={FINELY_OS_SECONDARY_BTN}
                onClick={() => void copyText(`magnet-${row.lane.id}`, row.url)}
              >
                {copied === `magnet-${row.lane.id}` ? 'Copied' : 'Copy magnet link'}
              </button>
            </div>
          )}
        />
      </div>

      <div className={finelyOsCatalogCardCompact('sky')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Syndication approve queue</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Approve distribution jobs before webhooks fire. Empty queue? Build campaigns in Lead Acquisition.
        </p>
        {approveQueue.length === 0 ? (
          <p className={`mt-3 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            No draft jobs — stub shows lanes ready to copy. Open Lead Acquisition to queue webhook posts.
          </p>
        ) : (
          <FinelyOsPaginatedStack
            items={approveQueue}
            pageSize={3}
            renderItem={(job) => (
              <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white truncate max-w-[200px]">
                    {job.message.length > 48 ? `${job.message.slice(0, 48)}…` : job.message}
                  </span>
                  <span className={finelyOsStatusChip(job.status === 'queued' ? 'warn' : 'blocked')}>{job.status}</span>
                </div>
                <p className={`text-[10px] font-mono break-all ${FINELY_OS_ENTITY_BODY}`}>{job.finalUrl}</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => approveJob(job.id)}>
                    Approve locally
                  </button>
                  <button
                    type="button"
                    className={FINELY_OS_SECONDARY_BTN}
                    onClick={() => navigate('/admin/lead-acquisition')}
                  >
                    Run in hub
                  </button>
                </div>
              </div>
            )}
          />
        )}
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
          Lead Acquisition
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/marketing-desk?helper=board')}>
          Desk · Board
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/marketing-desk?helper=mail')}>
          Desk · Mail
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
