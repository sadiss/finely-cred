import React, { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Settings2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsMicroStat,
  finelyOsStatusChip,
} from '../../os/finelyOsLightUi';
import { FinelyOsAlertBanner } from '../../os/FinelyOsAlertBanner';
import {
  approveMarketingStaged,
  clearMarketingStagingExceptions,
  countMarketingStagingPending,
  getMarketingDailyPackLanes,
  getMarketingFindEffectiveLocation,
  getMarketingFindLastRun,
  getMarketingFindReadiness,
  getMarketingFindSchedule,
  getMarketingFindSuggestedQuery,
  clearMarketingFindSuggestedQuery,
  huntForMarketingReview,
  listMarketingFindLaneOptions,
  listMarketingStagingQueue,
  MARKETING_FIND_SKIP_LABELS,
  rejectMarketingStaged,
  runMarketingDailyPack,
  setMarketingDailyPackLanes,
  setMarketingFindSchedule,
  type MarketingDeskFindRequest,
} from '../marketingDeskHunt';
import type { LeadEngineLane } from '../../leadIntel/leadEngineAutonomy';
import { getMarketingLanePerformanceChips } from '../marketingDeskLanePerformance';
import { prospectScoresFromHuntHit } from '../../growthAgents/growthMlScore';
import { getGrowthMlLabel, saveLabelForHit } from '../../growthAgents/growthMlLabels';
import { MarketingConsentChipFromHit } from '../MarketingConsentChip';
import { consentForMarketingDeskHit } from '../marketingProspectConsent';
import { getLeadIntelSourceRuntimeLabel } from '../../overnight50/sourceAdapters';
import { MarketingDeskEasyAskBar } from '../MarketingDeskEasyAskBar';

type RunSnapshot = {
  result: Awaited<ReturnType<typeof huntForMarketingReview>>;
  detailsOpen: boolean;
};

function skipReasonEntries(reasons: Record<string, number> | undefined): Array<{ code: string; count: number; label: string }> {
  if (!reasons) return [];
  return Object.entries(reasons)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => ({
      code,
      count,
      label: MARKETING_FIND_SKIP_LABELS[code] || code.replace(/_/g, ' '),
    }));
}

export function FindPeopleRoom() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showFix, setShowFix] = useState(false);
  const [runSnapshot, setRunSnapshot] = useState<RunSnapshot | null>(null);

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#exceptions') return;
    const el = document.getElementById('exceptions');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [tick]);

  const queue = useMemo(() => {
    void tick;
    return listMarketingStagingQueue(8);
  }, [tick]);

  const pendingTotal = useMemo(() => {
    void tick;
    return countMarketingStagingPending();
  }, [tick]);

  const readiness = useMemo(() => {
    void tick;
    return getMarketingFindReadiness();
  }, [tick]);

  const lastRun = useMemo(() => {
    void tick;
    return getMarketingFindLastRun();
  }, [tick]);

  const schedule = useMemo(() => {
    void tick;
    return getMarketingFindSchedule();
  }, [tick]);

  const suggestedQuery = useMemo(() => {
    void tick;
    return getMarketingFindSuggestedQuery();
  }, [tick]);

  const packLanes = useMemo(() => {
    void tick;
    return getMarketingDailyPackLanes();
  }, [tick]);

  const laneOptions = useMemo(() => listMarketingFindLaneOptions(), []);
  const laneChips = useMemo(() => {
    void tick;
    return getMarketingLanePerformanceChips(3);
  }, [tick]);

  const needsSetup = !readiness.ready;

  const togglePackLane = (id: LeadEngineLane) => {
    const set = new Set(packLanes);
    if (set.has(id)) {
      if (set.size <= 1) return;
      set.delete(id);
    } else if (set.size < 5) {
      set.add(id);
    }
    setMarketingDailyPackLanes(Array.from(set));
    setTick((t) => t + 1);
  };

  const finishRun = (r: Awaited<ReturnType<typeof huntForMarketingReview>>, where: string) => {
    const searchFailed = Boolean(r.error) && r.found === 0;
    if (searchFailed) setErr(r.error ?? 'Search failed');
    else {
      setNotice(
        `${where} · Found ${r.found} · auto-saved ${r.autoSaved} · review ${r.review} · skipped ${r.skipped}` +
          (r.errors.length ? ` · ${r.errors.length} lane issue(s)` : ''),
      );
    }
    setRunSnapshot({ result: r, detailsOpen: true });
    if (needsSetup || r.error?.includes('Needs setup') || r.error?.includes('Search API')) setShowFix(true);
    setTick((t) => t + 1);
  };

  const runFindNow = async (request: MarketingDeskFindRequest) => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    setNotice(null);
    setRunSnapshot(null);
    try {
      if (needsSetup) {
        setShowFix(true);
        setErr('Needs setup — follow the Fix setup steps, then try Find.');
        return;
      }
      const r = await huntForMarketingReview({
        lane: request.lane,
        location: request.location,
        ask: request.ask,
      });
      finishRun(r, request.effectiveLocation);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Find failed');
    } finally {
      setBusy(false);
    }
  };

  const runDailyPack = async (request: MarketingDeskFindRequest) => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    setNotice(null);
    setRunSnapshot(null);
    try {
      if (needsSetup) {
        setShowFix(true);
        setErr('Needs setup — follow the Fix setup steps, then try Daily pack.');
        return;
      }
      const r = await runMarketingDailyPack({
        location: request.location,
        ask: request.ask,
        lanes: request.lane ? [request.lane, ...packLanes.filter((id) => id !== request.lane)].slice(0, 5) : undefined,
      });
      finishRun(r, request.location ? request.effectiveLocation : 'today’s metros');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Daily pack failed');
    } finally {
      setBusy(false);
    }
  };

  const foundStat = runSnapshot?.result.found ?? lastRun?.found ?? 0;
  const savedStat = runSnapshot?.result.autoSaved ?? lastRun?.autoSaved ?? 0;
  const reviewStat = runSnapshot?.result.review ?? lastRun?.review ?? pendingTotal;
  const skippedStat = runSnapshot?.result.skipped ?? lastRun?.skipped ?? 0;

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Find</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Who are we looking for?</h2>
            <p className={`mt-2 max-w-2xl text-sm ${FINELY_OS_ENTITY_BODY}`}>
              Ask the way you would ask a person. Strong fits save themselves. You only review the maybes.
            </p>
          </div>
          <span className={finelyOsStatusChip(readiness.ready ? 'ok' : 'blocked')}>{readiness.label}</span>
        </div>

        {suggestedQuery ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/75">
            <p>Suggested from a pillar video: {suggestedQuery}</p>
            <button
              type="button"
              className={FINELY_OS_SECONDARY_BTN}
              onClick={() => {
                clearMarketingFindSuggestedQuery();
                setTick((t) => t + 1);
              }}
            >
              Clear suggestion
            </button>
          </div>
        ) : null}

        <MarketingDeskEasyAskBar
          busy={busy}
          initialQuery={suggestedQuery}
          onSubmit={(request) => void runFindNow(request)}
          onDailyPack={(request) => void runDailyPack(request)}
        />

        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} className={FINELY_OS_SECONDARY_BTN} onClick={() => setShowFix((v) => !v)}>
            <Settings2 size={14} /> {showFix || needsSetup ? 'Hide setup' : 'Fix setup'}
          </button>
        </div>
      </section>

      {err ? <FinelyOsAlertBanner tone="blocking" message={err} /> : null}
      {notice ? <FinelyOsAlertBanner tone="success" message={notice} /> : null}

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Found" value={foundStat} />
        <Kpi label="Auto-saved" value={savedStat} />
        <Kpi label="To review" value={reviewStat} />
        <Kpi label="Skipped" value={skippedStat} />
      </section>

      {runSnapshot?.detailsOpen ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-white">This run</h3>
          <div className="flex flex-wrap gap-2">
            {skipReasonEntries(runSnapshot.result.skipReasons).map((row) => (
              <span key={row.code} className={finelyOsMicroStat('violet')} title={row.code}>
                {row.label} · {row.count}
              </span>
            ))}
          </div>
          {runSnapshot.result.error && runSnapshot.result.found === 0 ? (
            <p className="text-sm text-rose-200/90">{runSnapshot.result.error}</p>
          ) : null}
        </section>
      ) : null}

      {showFix || needsSetup ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Fix setup</h3>
          <ol className="grid gap-4 lg:grid-cols-2">
            {readiness.steps.map((step, i) => (
              <li key={step.id} className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-white">
                    {i + 1}. {step.label}
                  </div>
                  <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{step.detail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={finelyOsStatusChip(step.done ? 'ok' : step.id === 'serper' ? 'warn' : 'blocked')}>
                    {step.done ? 'Done' : step.id === 'serper' ? 'Owner' : 'Needed'}
                  </span>
                  {step.href && !step.done ? (
                    <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(step.href!)}>
                      Open
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section id="exceptions" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Review</h3>
            <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
              {pendingTotal === 0
                ? 'Nothing waiting. Mid-score people show up here.'
                : `${pendingTotal} ${pendingTotal === 1 ? 'person' : 'people'} to approve or reject.`}
            </p>
          </div>
          {pendingTotal > 0 ? (
            <button
              type="button"
              disabled={busy}
              className={FINELY_OS_SECONDARY_BTN}
              onClick={() => {
                const r = clearMarketingStagingExceptions();
                setNotice(
                  r.cleared
                    ? `Cleared ${r.cleared} exception${r.cleared === 1 ? '' : 's'}.`
                    : 'No exceptions left to clear.',
                );
                setTick((t) => t + 1);
              }}
            >
              Clear all
            </button>
          ) : null}
        </div>

        {queue.length === 0 ? (
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>All clear. Ask above, or run today’s pack.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {queue.map((hit) => {
              const ml = prospectScoresFromHuntHit(hit);
              const saved = getGrowthMlLabel(hit.url || hit.domain || '');
              const consent = consentForMarketingDeskHit({ emails: hit.emails });
              return (
                <article key={hit.url} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate font-semibold text-white">{hit.title || hit.domain || hit.url}</h4>
                      <p className={`mt-1 line-clamp-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                        {hit.whyReason || hit.whyNote || 'Mid-score fit — approve or reject.'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs tabular-nums text-amber-200/90">hunt {hit.score}</span>
                      <MarketingConsentChipFromHit
                        consentBasis={consent.consentBasis}
                        leadType={consent.leadType}
                        emailMarketingAllowed={consent.emailMarketingAllowed}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hit.sourceRuntime === 'live' ? (
                      <span className={finelyOsMicroStat('emerald')}>
                        {getLeadIntelSourceRuntimeLabel(hit.overnightSourceId ?? 'serper_web')}
                      </span>
                    ) : null}
                    <span className={finelyOsMicroStat('emerald')}>Talk {ml.conversationScore}</span>
                    <span className={finelyOsMicroStat('sky')}>Guide {ml.selfSignupScore}</span>
                    {saved ? (
                      <span className={finelyOsMicroStat(saved.label === 'approve' ? 'emerald' : 'rose')}>
                        {saved.label === 'approve' ? 'Good fit saved' : 'Wrong fit saved'}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      className={FINELY_OS_PRIMARY_BTN}
                      onClick={() => {
                        const r = approveMarketingStaged(hit.url);
                        setNotice(r.message);
                        setTick((t) => t + 1);
                      }}
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className={FINELY_OS_SECONDARY_BTN}
                      onClick={() => {
                        rejectMarketingStaged(hit.url);
                        setTick((t) => t + 1);
                      }}
                    >
                      <X size={14} /> Reject
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className={FINELY_OS_SECONDARY_BTN}
                      onClick={() => {
                        saveLabelForHit(hit, 'approve');
                        setNotice('Saved Good fit — trains Wave ML ranking.');
                        setTick((t) => t + 1);
                      }}
                    >
                      Good fit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className={FINELY_OS_SECONDARY_BTN}
                      onClick={() => {
                        saveLabelForHit(hit, 'reject');
                        setNotice('Saved Wrong fit — trains Wave ML ranking.');
                        setTick((t) => t + 1);
                      }}
                    >
                      Wrong fit
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {laneChips.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-white">Lane pace · 30 days</h3>
          <div className="flex flex-wrap gap-2">
            {laneChips.map((c) => (
              <span key={c.lane} className={finelyOsMicroStat('emerald')} title={`${c.found} found · ${c.booked} booked`}>
                {c.label} {c.ratePct}%
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <details className="space-y-3">
        <summary className="cursor-pointer select-none text-sm font-semibold text-white">Find while I sleep</summary>
        <div className="space-y-3 pt-3">
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
            {schedule.enabled ? 'On. ' : 'Off. '}
            Overnight uses the same lanes. An empty city still runs — your saved metro leads the pack.
          </p>
          <button
            type="button"
            disabled={busy}
            className={schedule.enabled ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
            onClick={() => {
              setMarketingFindSchedule(!schedule.enabled, getMarketingFindEffectiveLocation());
              setTick((t) => t + 1);
            }}
          >
            {schedule.enabled ? 'Turn off' : 'Turn on'}
          </button>
          <div className="flex flex-wrap gap-2">
            {laneOptions.map((lane) => {
              const on = packLanes.includes(lane.id);
              return (
                <button
                  key={lane.id}
                  type="button"
                  disabled={busy}
                  className={on ? finelyOsMicroStat('emerald') : finelyOsMicroStat('violet')}
                  onClick={() => togglePackLane(lane.id)}
                >
                  {lane.label}
                </button>
              );
            })}
          </div>
        </div>
      </details>

      {lastRun ? (
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Last run {new Date(lastRun.at).toLocaleString()} · {lastRun.mode.replace('_', ' ')} · {lastRun.location}
          {lastRun.errors[0] ? ` · ${lastRun.errors[0]}` : ''}
        </p>
      ) : null}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
      <div className={FINELY_OS_ENTITY_SUBLABEL}>{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-white">{value}</div>
    </div>
  );
}
