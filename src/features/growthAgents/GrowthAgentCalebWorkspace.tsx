import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GrowthAgentWorkspaceShell } from './GrowthAgentWorkspaceShell';
import { GrowthDailyPlaybook } from './GrowthDailyPlaybook';
import { getGrowthAgent } from './growthAgentRegistry';
import { getCalebMaturity } from './growthAgentMaturity';
import {
  countMarketingStagingPending,
  getMarketingFindLastRun,
  getMarketingFindReadiness,
  huntForMarketingReview,
  setMarketingFindGeo,
  setMarketingFindSuggestedQuery,
} from '../marketingDesk/marketingDeskHunt';
import { runGrowthFindTestSearch } from './growthFindTest';
import { getTodaysContactQueue } from './growthProspectQueue';
import { getGrowthWeekFocus, setGrowthWeekFocus } from './growthWeekFocus';
import { buildGrowthResultsSnapshot } from './growthResultsMetrics';
import { LeadEngineOneButton } from '../leadIntel/LeadEngineOneButton';
import { LeadIntelCopilot } from '../leadIntel/LeadIntelCopilot';
import { LeadIntelHub } from '../leadIntel/LeadIntelHub';
import { buildHuntQueries } from '../leadIntel/leadEngineAutonomy';
import { listProspects } from '../../data/crmProspectsRepo';
import { GrowthAgentInfraStrip } from './GrowthAgentInfraStrip';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsMicroStat,
} from '../os/finelyOsLightUi';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import { GROWTH_AGENT_WAVE0_LANE } from './growthAgentRegistry';
import { buildGrowthHuntQueryFromPillar, resolveGrowthPillarVideoRecord } from './growthPillarVideoPack';

export function GrowthAgentCalebWorkspace() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [testing, setTesting] = useState(false);
  const [finding, setFinding] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [findMsg, setFindMsg] = useState<string | null>(null);
  const agent = getGrowthAgent('lead-discovery')!;

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const maturity = useMemo(() => {
    void tick;
    return getCalebMaturity();
  }, [tick]);

  const readiness = useMemo(() => {
    void tick;
    return getMarketingFindReadiness();
  }, [tick]);

  const last = useMemo(() => {
    void tick;
    return getMarketingFindLastRun();
  }, [tick]);

  const focus = useMemo(() => {
    void tick;
    return getGrowthWeekFocus();
  }, [tick]);

  const results = useMemo(() => {
    void tick;
    return buildGrowthResultsSnapshot();
  }, [tick]);

  const todayQueue = useMemo(() => {
    void tick;
    return getTodaysContactQueue(10);
  }, [tick]);

  const pending = useMemo(() => {
    void tick;
    return countMarketingStagingPending();
  }, [tick]);

  const copilotQuery = useMemo(() => {
    void tick;
    const f = getGrowthWeekFocus();
    return buildHuntQueries({ lane: f.lane, location: f.city })[0] ?? '';
  }, [tick]);

  const pillarHuntRecord = useMemo(() => {
    void tick;
    const key = focus.pillarVideoId?.trim();
    if (!key) return null;
    return resolveGrowthPillarVideoRecord(key);
  }, [focus.pillarVideoId, tick]);

  const pillarHuntPreview = useMemo(() => {
    if (!pillarHuntRecord) return '';
    return buildGrowthHuntQueryFromPillar(pillarHuntRecord, focus.city);
  }, [pillarHuntRecord, focus.city]);

  const prefillFindFromPillarVideo = () => {
    if (!pillarHuntRecord || !pillarHuntPreview) return;
    setMarketingFindGeo(focus.city);
    setMarketingFindSuggestedQuery(pillarHuntPreview);
    navigate('/admin/marketing-desk?helper=find');
  };

  const importedIntelCount = useMemo(() => {
    void tick;
    return listProspects({ target: 'all' }).filter((p) => (p.tags ?? []).includes('lead-intel')).length;
  }, [tick]);

  const runTest = async () => {
    setTesting(true);
    setTestMsg(null);
    try {
      const r = await runGrowthFindTestSearch();
      setTestMsg(r.message);
    } finally {
      setTesting(false);
      setTick((t) => t + 1);
    }
  };

  const runFind = async () => {
    setFinding(true);
    setFindMsg(null);
    try {
      setMarketingFindGeo(focus.city);
      const r = await huntForMarketingReview({
        lane: GROWTH_AGENT_WAVE0_LANE,
        location: focus.city,
        mode: 'one_tap',
      });
      if (r.error && r.found === 0) setFindMsg(r.error);
      else
        setFindMsg(
          `${r.found} from search · ${r.autoSaved} saved · ${r.review} to review · ${r.skipped} skipped` +
            (r.errors.length ? ` · ${r.errors[0]}` : ''),
        );
    } finally {
      setFinding(false);
      setTick((t) => t + 1);
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
      alertMessage={!readiness.ready ? 'Finish setup below before expecting finds.' : undefined}
      alertTone="warning"
      primaryAction={{
        label: finding ? 'Finding…' : 'Find new people',
        onClick: () => void runFind(),
        disabled: finding,
      }}
      secondaryAction={{
        label: testing ? 'Testing…' : 'Test search',
        onClick: () => void runTest(),
      }}
      nextStep={results.todaySentence}
      setupBlock={
        <ul className="space-y-1">
          {maturity.items.map((i) => (
            <li key={i.id} className={i.done ? 'text-emerald-300/90' : 'text-amber-200/90'}>
              {i.done ? '✓' : '○'} {i.label}
            </li>
          ))}
          <li className="pt-2">
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/settings')}>
              Open settings
            </button>
          </li>
        </ul>
      }
      lastRunBlock={
        <div>
          {last?.at ? (
            <p>{results.lastFindSummary}</p>
          ) : (
            <p>No find run yet.</p>
          )}
          {testMsg ? <p className="mt-2 text-sky-200/90">{testMsg}</p> : null}
          {findMsg ? <p className="mt-2 text-emerald-200/90">{findMsg}</p> : null}
        </div>
      }
      statusBlock={
        <ul className="space-y-1">
          <li>Week focus: {results.weekFocusLabel}</li>
          <li>Review queue: {pending}</li>
          <li>Search: {readiness.ready ? 'ready to run' : 'needs setup'}</li>
          <GrowthAgentInfraStrip compactWorkerLine />
        </ul>
      }
    >
      <GrowthAgentInfraStrip />

      <div className={finelyOsCatalogCardCompact('emerald')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Your city for finds</div>
        <input
          className={`${FINELY_OS_ENTITY_INPUT} mt-2 max-w-md`}
          value={focus.city}
          onChange={(e) => {
            setGrowthWeekFocus({ city: e.target.value });
            setMarketingFindGeo(e.target.value);
            setTick((t) => t + 1);
          }}
        />
        <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>Restore lane only in Wave 0 — matches Esther&apos;s weekly focus.</p>
        {focus.pillarVideoId && pillarHuntPreview ? (
          <div className="mt-3 space-y-2">
            <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
              Pillar hunt suggestion: <span className="text-white/90">{pillarHuntPreview}</span>
            </p>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={prefillFindFromPillarVideo}>
              Suggest hunt from video topics
            </button>
          </div>
        ) : null}
      </div>

      <GrowthDailyPlaybook />

      <div className={finelyOsCatalogCardCompact('amber')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Today&apos;s 10 to contact</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Ranked by Talk score (book a session). Guide score favors free-guide signup.
        </p>
        {todayQueue.length === 0 ? (
          <p className={`mt-3 text-sm ${FINELY_OS_ENTITY_BODY}`}>Run Find new people first.</p>
        ) : (
          <FinelyOsPaginatedStack
            items={todayQueue}
            pageSize={5}
            renderItem={(row) => {
              const p = row.prospect;
              return (
                <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="font-semibold text-white min-w-0 truncate">
                      {p.company?.name || p.company?.website || 'Prospect'}
                    </div>
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      <span className={finelyOsMicroStat('emerald')} title={row.reasons[0]}>
                        Talk {row.conversationScore}
                      </span>
                      <span className={finelyOsMicroStat('sky')} title={row.reasons[1] || row.reasons[0]}>
                        Guide {row.selfSignupScore}
                      </span>
                    </div>
                  </div>
                  <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                    Hunt {p.score ?? '—'} · {(p.contact?.emails ?? [])[0] || 'no email yet'}
                  </div>
                </div>
              );
            }}
          />
        )}
        <button
          type="button"
          className={`${FINELY_OS_SECONDARY_BTN} mt-3`}
          onClick={() => navigate('/admin/crm')}
        >
          Open CRM
        </button>
      </div>

      <LeadEngineOneButton />

      <div className={finelyOsCatalogCardCompact('fuchsia')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Lead Intelligence Director</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Strategy copilot only — live Serper search is Caleb Find (Marketing Desk) or the Live Lead Engine card below. Swarm queues are simulation unless{' '}
          <code className="text-fuchsia-200/90">lead-intel-worker-tick</code> runs with GROWTH_WORKER_LIVE=true.
        </p>
        <div className="mt-3">
          <LeadIntelCopilot
            target="clients"
            query={copilotQuery}
            results={[]}
            selectedUrls={[]}
            importedCount={importedIntelCount}
          />
        </div>
      </div>

      <details className={`${finelyOsCatalogCardCompact('violet')} group`}>
        <summary className={`cursor-pointer list-none flex items-center justify-between gap-2 ${FINELY_OS_ENTITY_VALUE} text-sm font-semibold`}>
          Advanced find (full Lead Intel)
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-open:text-violet-200">Expand</span>
        </summary>
        <div className="mt-3 border-t border-white/10 pt-3">
          <LeadIntelHub embedded showCompliance={false} />
        </div>
      </details>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/marketing-desk?helper=find')}>
          Review people
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/marketing-desk?helper=board')}>
          Open Board
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/growth-agents/capture-links')}>
          Hannah · guide links
        </button>
      </div>
    </GrowthAgentWorkspaceShell>
  );
}
