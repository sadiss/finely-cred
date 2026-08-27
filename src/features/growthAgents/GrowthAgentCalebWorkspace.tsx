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
import { LeadIntelSwarmDashboard } from '../overnight50/LeadIntelSwarmDashboard';
import { buildHuntQueries } from '../leadIntel/leadEngineAutonomy';
import { listProspects } from '../../data/crmProspectsRepo';
import { GrowthAgentInfraStrip } from './GrowthAgentInfraStrip';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_PRIMARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsMicroStat,
} from '../os/finelyOsLightUi';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import { GROWTH_AGENT_WAVE0_LANE } from './growthAgentRegistry';
import { buildGrowthHuntQueryFromPillar, resolveGrowthPillarVideoRecord } from './growthPillarVideoPack';
import { GrowthAgentCalebCommandGuide } from './GrowthAgentCalebCommandGuide';
import {
  calebAutoStatusLine,
  isCalebAutoFindEnabled,
  isColdOutboundAutopilotEnabled,
  runCalebAutoFindIfDue,
  setCalebAutoFindEnabled,
  setColdOutboundAutopilotEnabled,
} from './calebAutoFind';
import { buildCalebFindDiagnostics } from './calebFindDiagnostics';
import { MarketingConsentChip } from '../marketingDesk/MarketingConsentChip';
import { getDailyQuotaProgress, GROWTH_DAILY_QUOTA_TOTAL } from './growthDailyQuota';
import { calebTodaysMissionPreview, runCalebTodaysMission } from './calebQuotaMission';
import { MarketingChecklistTile, MarketingKpiChip } from '../marketingDepartment/marketingHubUi';

export function GrowthAgentCalebWorkspace() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [testing, setTesting] = useState(false);
  const [finding, setFinding] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [findMsg, setFindMsg] = useState<string | null>(null);
  const [missionBusy, setMissionBusy] = useState(false);
  const [missionMsg, setMissionMsg] = useState<string | null>(null);
  const [autoBusy, setAutoBusy] = useState(false);
  const agent = getGrowthAgent('lead-discovery')!;

  const autoEnabled = useMemo(() => {
    void tick;
    return isCalebAutoFindEnabled();
  }, [tick]);

  const coldOutboundEnabled = useMemo(() => {
    void tick;
    return isColdOutboundAutopilotEnabled();
  }, [tick]);

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

  useEffect(() => {
    if (!isCalebAutoFindEnabled()) return;
    let cancelled = false;
    setAutoBusy(true);
    void runCalebAutoFindIfDue(focus.city, { force: false })
      .then((r) => {
        if (cancelled || !r) return;
        if (r.error && r.found === 0) setFindMsg(r.error);
        else
          setFindMsg(
            `Auto daily pack · ${r.found} from search · ${r.autoSaved} saved · ${r.review} to review` +
              (r.errors.length ? ` · ${r.errors[0]}` : ''),
          );
      })
      .finally(() => {
        if (!cancelled) {
          setAutoBusy(false);
          setTick((t) => t + 1);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [focus.city]);

  const toggleAutoFind = () => {
    const next = !isCalebAutoFindEnabled();
    setCalebAutoFindEnabled(next, focus.city);
    if (next) {
      setAutoBusy(true);
      void runCalebAutoFindIfDue(focus.city, { force: false })
        .then((r) => {
          if (r?.error && r.found === 0) setFindMsg(r.error);
          else if (r)
            setFindMsg(
              `Auto daily pack · ${r.found} from search · ${r.autoSaved} saved · ${r.review} to review`,
            );
        })
        .finally(() => {
          setAutoBusy(false);
          setTick((t) => t + 1);
        });
    } else {
      setFindMsg('Auto-find off — Caleb will not run daily pack or overnight find until you turn it back on.');
      setTick((t) => t + 1);
    }
  };

  const results = useMemo(() => {
    void tick;
    return buildGrowthResultsSnapshot();
  }, [tick]);

  const dailyQuota = useMemo(() => {
    void tick;
    return getDailyQuotaProgress();
  }, [tick]);

  const todayQueue = useMemo(() => {
    void tick;
    return getTodaysContactQueue(10);
  }, [tick]);

  const findDiagnostic = useMemo(() => {
    void tick;
    return buildCalebFindDiagnostics();
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

  const runTodaysMission = async () => {
    setMissionBusy(true);
    setMissionMsg(null);
    try {
      const r = await runCalebTodaysMission(focus.city);
      setMissionMsg(r.message);
      if (r.findResult && !r.skippedFind) {
        setFindMsg(r.message);
      }
    } finally {
      setMissionBusy(false);
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
      headerAside={<GrowthAgentCalebCommandGuide tick={tick} />}
      alertMessage={
        autoEnabled
          ? calebAutoStatusLine()
          : !readiness.ready
            ? 'Turn auto-find on below — we enable Find flags for you. Supabase + Serper on the server still required for live results.'
            : undefined
      }
      alertTone={autoEnabled && readiness.ready ? 'success' : 'warning'}
      primaryAction={{
        label: autoBusy
          ? 'Auto-find running…'
          : autoEnabled
            ? 'Turn auto-find off'
            : 'Turn auto-find on',
        onClick: toggleAutoFind,
        disabled: autoBusy,
      }}
      secondaryAction={
        pending > 0
          ? {
              label: `Review ${pending} people`,
              onClick: () => navigate('/admin/marketing-desk?helper=find'),
            }
          : undefined
      }
      nextStep={autoEnabled ? calebAutoStatusLine() : results.todaySentence}
      setupBlock={
        <div className="grid sm:grid-cols-2 gap-2">
          {maturity.items.map((i) => (
            <MarketingChecklistTile key={i.id} done={i.done} label={i.label} />
          ))}
          <div className="sm:col-span-2 pt-1">
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/settings')}>
              Open settings
            </button>
          </div>
        </div>
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
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <MarketingKpiChip label="Week focus" value={results.weekFocusLabel} accent="violet" />
            <MarketingKpiChip label="Review queue" value={String(pending)} accent="amber" />
            <MarketingKpiChip
              label="Search"
              value={readiness.ready ? 'Ready' : 'Setup'}
              accent={readiness.ready ? 'emerald' : 'rose'}
            />
          </div>
          <GrowthAgentInfraStrip compactWorkerLine />
        </div>
      }
    >
      {findDiagnostic ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            findDiagnostic.tone === 'error'
              ? 'border-rose-500/45 bg-rose-500/15 text-rose-100'
              : findDiagnostic.tone === 'warning'
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                : 'border-sky-500/35 bg-sky-500/10 text-sky-100'
          }`}
        >
          <p className="font-semibold text-white">{findDiagnostic.headline}</p>
          <p className="mt-1 text-white/80">{findDiagnostic.detail}</p>
          {findDiagnostic.fixSteps.length > 0 ? (
            <ol className="mt-2 list-decimal list-inside text-xs text-white/70 space-y-0.5">
              {findDiagnostic.fixSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}

      <div className={finelyOsCatalogCardCompact('sky')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Daily mission · {GROWTH_DAILY_QUOTA_TOTAL}/day balanced</div>
        <p className={`mt-1 text-sm font-semibold text-white`}>
          Today {dailyQuota.totalCount}/{dailyQuota.totalCap} pipeline events ({dailyQuota.totalPct}%)
        </p>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{calebTodaysMissionPreview(focus.city)}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {dailyQuota.buckets.map((b) => (
            <span key={b.id} className={finelyOsMicroStat('sky')}>
              {b.label}: {b.count}/{b.cap}
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={FINELY_OS_PRIMARY_BTN}
            disabled={missionBusy}
            onClick={() => void runTodaysMission()}
          >
            {missionBusy ? 'Running mission…' : "Run today's mission"}
          </button>
        </div>
        {missionMsg ? <p className={`mt-2 text-xs text-emerald-200/90`}>{missionMsg}</p> : null}
        <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Week focus {results.weekFocusLabel}. Inbound + link-first outreach only — no unconsented cold mail.
        </p>
      </div>

      <div className={finelyOsCatalogCardCompact('emerald')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Auto-find</div>
            <p className={`mt-1 text-sm font-semibold text-white`}>
              {autoEnabled ? 'On — daily pack runs for you' : 'Off — nothing runs until you turn it on'}
            </p>
            <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
              Set your city below once. Caleb handles search test, daily pack, and Find while I sleep. Only use{' '}
              <strong className="text-white/90">Turn auto-find off</strong> to stop.
            </p>
          </div>
          <button
            type="button"
            className={FINELY_OS_PRIMARY_BTN}
            disabled={autoBusy}
            onClick={toggleAutoFind}
          >
            {autoBusy ? 'Working…' : autoEnabled ? 'Turn off' : 'Turn on'}
          </button>
        </div>
      </div>

      <div className={finelyOsCatalogCardCompact('rose')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Cold outbound autopilot</div>
            <p className={`mt-1 text-sm font-semibold text-white`}>
              {coldOutboundEnabled ? 'On — seq_cold_prospect when consent allows' : 'Off by default — link-first invite only'}
            </p>
            <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
              Manual Approve still queues link-first invites for discovered contacts. Turn this on only when you have lawful B2B outreach basis.
            </p>
          </div>
          <button
            type="button"
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => {
              setColdOutboundAutopilotEnabled(!coldOutboundEnabled);
              setTick((t) => t + 1);
            }}
          >
            {coldOutboundEnabled ? 'Turn off' : 'Turn on'}
          </button>
        </div>
      </div>

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

      <details className={`${finelyOsCatalogCardCompact('sky')} group`}>
        <summary className={`cursor-pointer list-none flex items-center justify-between gap-2 ${FINELY_OS_ENTITY_VALUE} text-sm font-semibold`}>
          Manual find (optional)
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-open:text-sky-200">Expand</span>
        </summary>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
          <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={finding} onClick={() => void runFind()}>
            {finding ? 'Finding…' : 'Find once now'}
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={testing} onClick={() => void runTest()}>
            {testing ? 'Testing…' : 'Test search again'}
          </button>
        </div>
      </details>

      <div className={finelyOsCatalogCardCompact('amber')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Today&apos;s 10 to contact</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Ranked by Talk score (book a session). Guide score favors free-guide signup.
        </p>
        {todayQueue.length === 0 ? (
          <p className={`mt-3 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            {autoEnabled ? 'Auto-find will populate this after today’s pack runs.' : 'Turn auto-find on or use Manual find.'}
          </p>
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
                      <MarketingConsentChip prospect={p} />
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

      <details className={`${finelyOsCatalogCardCompact('fuchsia')} group`}>
        <summary className={`cursor-pointer list-none flex items-center justify-between gap-2 ${FINELY_OS_ENTITY_VALUE} text-sm font-semibold`}>
          Strategy copilot (optional)
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-open:text-fuchsia-200">Expand</span>
        </summary>
        <div className="mt-3 border-t border-white/10 pt-3">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Lead Intelligence Director</div>
          <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Chat only — live imports come from auto-find. Practice mode counters are simulation unless the live worker flag is on.
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
      </details>

      <details className={`${finelyOsCatalogCardCompact('violet')} group`}>
        <summary className={`cursor-pointer list-none flex items-center justify-between gap-2 ${FINELY_OS_ENTITY_VALUE} text-sm font-semibold`}>
          Advanced find (full Lead Intel)
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-open:text-violet-200">Expand</span>
        </summary>
        <div className="mt-3 border-t border-white/10 pt-3">
          <LeadIntelHub embedded showCompliance={false} />
        </div>
      </details>

      <details className={`${finelyOsCatalogCardCompact('amber')} group`}>
        <summary className={`cursor-pointer list-none flex items-center justify-between gap-2 ${FINELY_OS_ENTITY_VALUE} text-sm font-semibold`}>
          Overnight50 simulation (advanced)
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-open:text-amber-200">Expand</span>
        </summary>
        <div className="mt-3 border-t border-white/10 pt-3 space-y-3">
          <LeadIntelSwarmDashboard />
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
