import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GrowthAgentWorkspaceShell } from './GrowthAgentWorkspaceShell';
import { getGrowthAgent, type GrowthAgentDef, buildGrowthContentStudioPromoteUrl, GROWTH_AGENT_WAVE0_LANE } from './growthAgentRegistry';
import { getAgentMaturity } from './growthAgentMaturity';
import { GrowthAgentCalebWorkspace } from './GrowthAgentCalebWorkspace';
import { GrowthAgentHannahWorkspace } from './GrowthAgentHannahWorkspace';
import { GrowthAgentEstherWorkspace } from './GrowthAgentEstherWorkspace';
import { GrowthAgentBenjaminWorkspace } from './GrowthAgentBenjaminWorkspace';
import { GrowthAgentRebeccaWorkspace } from './GrowthAgentRebeccaWorkspace';
import { GrowthAgentLydiaWorkspace } from './GrowthAgentLydiaWorkspace';
import { GrowthAgentMiriamWorkspace } from './GrowthAgentMiriamWorkspace';
import { GrowthAgentJordanWorkspace } from './GrowthAgentJordanWorkspace';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
} from '../os/finelyOsLightUi';
import { buildGrowthResultsSnapshot } from './growthResultsMetrics';
import { getVideoCommandRecord, listVideoCommandRecords } from '../../data/videoCommandRecordRepo';
import {
  buildGrowthHuntQueryFromPillar,
  buildGrowthPillarScript,
  buildGrowthShortsPack,
  promoteVideoIdForGrowthRecord,
  resolveGrowthPillarVideoRecord,
} from './growthPillarVideoPack';
import {
  buildLaneAcquisitionUrl,
  buildVideoUtmContent,
  LEAD_ACQUISITION_LANES,
} from '../../lib/leadAcquisitionCatalog';
import { getResourceVideo } from '../../data/resourceVideosRepo';

function SocialMediaPillarStrip({ agent }: { agent: GrowthAgentDef }) {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [copied, setCopied] = useState<'shorts' | 'script' | null>(null);

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const pillar = useMemo(() => {
    void tick;
    return resolveGrowthPillarVideoRecord();
  }, [tick]);

  const promoteId = useMemo(() => (pillar ? promoteVideoIdForGrowthRecord(pillar) : undefined), [pillar]);

  const captureUrl = useMemo(() => {
    if (!promoteId) return undefined;
    const lane = LEAD_ACQUISITION_LANES.find((l) => l.id === GROWTH_AGENT_WAVE0_LANE);
    if (!lane) return undefined;
    return buildLaneAcquisitionUrl(lane, {
      utmSource: 'growth_agent_miriam',
      utmContent: buildVideoUtmContent(promoteId),
    });
  }, [promoteId]);

  const shortsPack = useMemo(() => {
    if (!pillar) return '';
    return buildGrowthShortsPack({ record: pillar, captureUrl });
  }, [pillar, captureUrl]);

  const pillarScript = useMemo(() => {
    if (!pillar) return '';
    return buildGrowthPillarScript({ record: pillar });
  }, [pillar]);

  const resourceLabel = useMemo(() => {
    if (!pillar?.resourceVideoId) return null;
    const rv = getResourceVideo(pillar.resourceVideoId);
    if (!rv) return null;
    return rv.isPublic ? 'Public resource' : 'Draft resource';
  }, [pillar]);

  if (!pillar) {
    return (
      <div className={finelyOsCatalogCardCompact(agent.accent)}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Pillar video</div>
        <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
          Upload a pillar in Content Studio or set Esther&apos;s pillar video — Miriam and Jordan pull shorts + script from the latest command record.
        </p>
        <button
          type="button"
          className={`${FINELY_OS_SECONDARY_BTN} mt-3`}
          onClick={() => navigate(buildGrowthContentStudioPromoteUrl())}
        >
          Open promote step
        </button>
      </div>
    );
  }

  const copy = async (key: 'shorts' | 'script', text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <div className={finelyOsCatalogCardCompact(agent.accent)}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Shorts pack</div>
        <p className={`mt-1 text-xs font-semibold text-white truncate`}>{pillar.title}</p>
        <p className={`mt-1 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
          {resourceLabel ?? pillar.lifecycle} · Hannah link {captureUrl ? 'included' : '— set pillar id'}
        </p>
        <pre className={`mt-2 max-h-32 overflow-auto rounded-lg border border-white/10 bg-black/30 p-2 text-[10px] leading-relaxed text-white/75 whitespace-pre-wrap`}>
          {shortsPack.slice(0, 480)}
          {shortsPack.length > 480 ? '…' : ''}
        </pre>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void copy('shorts', shortsPack)}>
            {copied === 'shorts' ? 'Copied' : 'Copy pack'}
          </button>
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => navigate(buildGrowthContentStudioPromoteUrl(promoteId))}
          >
            Studio promote
          </button>
        </div>
      </div>
      <div className={finelyOsCatalogCardCompact(agent.accent)}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Script from pillar</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          {agent.id === 'media' ? 'Shot beats + narration for Jordan cuts.' : 'Caption-safe narration outline.'}
        </p>
        <pre className={`mt-2 max-h-32 overflow-auto rounded-lg border border-white/10 bg-black/30 p-2 text-[10px] leading-relaxed text-white/75 whitespace-pre-wrap`}>
          {pillarScript.slice(0, 480)}
          {pillarScript.length > 480 ? '…' : ''}
        </pre>
        <button type="button" className={`${FINELY_OS_SECONDARY_BTN} mt-3`} onClick={() => void copy('script', pillarScript)}>
          {copied === 'script' ? 'Copied' : 'Copy script'}
        </button>
      </div>
    </div>
  );
}

function GenericAgentWorkspace({ agent }: { agent: GrowthAgentDef }) {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const maturity = useMemo(() => {
    void tick;
    return getAgentMaturity(agent);
  }, [agent, tick]);
  const results = useMemo(() => {
    void tick;
    return buildGrowthResultsSnapshot();
  }, [tick]);

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const primary = agent.capabilities.find((c) => c.tier === 'live');
  const pillarRecord = useMemo(() => {
    void tick;
    return agent.id === 'social' || agent.id === 'media' ? resolveGrowthPillarVideoRecord() : null;
  }, [agent.id, tick]);
  const pillarPromoteId = pillarRecord ? promoteVideoIdForGrowthRecord(pillarRecord) : undefined;

  const capabilityHref = (c: (typeof agent.capabilities)[number]) => {
    if (c.promoteVideoId && c.href) return buildGrowthContentStudioPromoteUrl(pillarPromoteId);
    return c.href;
  };

  return (
    <GrowthAgentWorkspaceShell
      accent={agent.accent}
      name={agent.name}
      roleTitle={agent.roleTitle}
      mission={agent.mission}
      maturityPercent={maturity.percent}
      maturityLabel={maturity.label}
      alertMessage={agent.wave > 1 ? `Wave ${agent.wave} — core tools open; advanced ML ships next.` : undefined}
      primaryAction={
        primary?.href
          ? {
              label: primary.label,
              onClick: () => navigate(capabilityHref(primary) ?? primary.href!),
            }
          : undefined
      }
      nextStep={results.todaySentence}
      setupBlock={<p>Wave {agent.wave} specialist — use the buttons below.</p>}
      lastRunBlock={<p>{results.lastFindSummary || 'No find run yet.'}</p>}
      statusBlock={<p>Booked (7d): {results.booked7d} · Signups (7d): {results.signups7d}</p>}
    >
      {agent.id === 'social' || agent.id === 'media' ? <SocialMediaPillarStrip agent={agent} /> : null}
      <div className="grid sm:grid-cols-2 gap-3">
        {agent.capabilities.map((c) => (
          <div key={c.id} className={finelyOsCatalogCardCompact(agent.accent)}>
            <div className="text-sm font-bold text-white">{c.label}</div>
            <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{c.description}</p>
            <span className="text-[10px] uppercase text-white/40">{c.tier === 'live' ? 'Live' : c.tier === 'preview' ? 'Preview' : 'Soon'}</span>
            {c.href ? (
              <button
                type="button"
                className={`${FINELY_OS_SECONDARY_BTN} mt-3`}
                onClick={() => navigate(capabilityHref(c) ?? c.href!)}
              >
                Open
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </GrowthAgentWorkspaceShell>
  );
}

export function GrowthAgentWorkspaceView({ agentId }: { agentId: string }) {
  const agent = getGrowthAgent(agentId);
  if (!agent) {
    return <p className="text-white/70">Specialist not found.</p>;
  }
  if (agent.id === 'lead-discovery') {
    return <GrowthAgentCalebWorkspace />;
  }
  if (agent.id === 'capture-links') {
    return <GrowthAgentHannahWorkspace />;
  }
  if (agent.id === 'marketing-director') {
    return <GrowthAgentEstherWorkspace />;
  }
  if (agent.id === 'seo-local') {
    return <GrowthAgentLydiaWorkspace />;
  }
  if (agent.id === 'social') {
    return <GrowthAgentMiriamWorkspace />;
  }
  if (agent.id === 'media') {
    return <GrowthAgentJordanWorkspace />;
  }
  if (agent.id === 'partnerships') {
    return <GrowthAgentBenjaminWorkspace />;
  }
  if (agent.id === 'specialist-recruit') {
    return <GrowthAgentRebeccaWorkspace />;
  }
  return <GenericAgentWorkspace agent={agent} />;
}
