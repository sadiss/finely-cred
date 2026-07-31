import React, { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Moon, Radar, Settings2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsMicroStat,
  finelyOsStatusChip,
} from '../../os/finelyOsLightUi';
import { FinelyOsAlertBanner } from '../../os/FinelyOsAlertBanner';
import { FinelyOsPaginatedStack } from '../../os/FinelyOsPaginatedStack';
import {
  approveMarketingStaged,
  clearMarketingStagingExceptions,
  countMarketingStagingPending,
  getMarketingDailyPackLanes,
  getMarketingFindGeo,
  getMarketingFindLastRun,
  getMarketingFindReadiness,
  getMarketingFindSchedule,
  huntForMarketingReview,
  listMarketingFindLaneOptions,
  listMarketingStagingQueue,
  rejectMarketingStaged,
  runMarketingDailyPack,
  setMarketingDailyPackLanes,
  setMarketingFindGeo,
  setMarketingFindSchedule,
} from '../marketingDeskHunt';
import type { LeadEngineLane } from '../../leadIntel/leadEngineAutonomy';
import { getMarketingLanePerformanceChips } from '../marketingDeskLanePerformance';

export function FindPeopleRoom() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showFix, setShowFix] = useState(false);
  const [geo, setGeo] = useState(() => getMarketingFindGeo());

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

  const finishRun = (r: Awaited<ReturnType<typeof huntForMarketingReview>>) => {
    if (r.error && r.found === 0) setErr(r.error);
    else {
      setNotice(
        `Found ${r.found} · auto-saved ${r.autoSaved} · review ${r.review} · skipped ${r.skipped}` +
          (r.errors.length ? ` · ${r.errors.length} lane issue(s)` : ''),
      );
    }
    if (needsSetup || r.error?.includes('Needs setup') || r.error?.includes('Search API')) setShowFix(true);
    setTick((t) => t + 1);
  };

  const runFindNow = async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    setNotice(null);
    setProgress('Finding…');
    setMarketingFindGeo(geo);
    try {
      if (needsSetup) {
        setShowFix(true);
        setErr('Needs setup — follow the Fix setup steps, then try Find now.');
        return;
      }
      const r = await huntForMarketingReview({ lane: 'business_credit', location: geo });
      finishRun(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Find failed');
    } finally {
      setProgress(null);
      setBusy(false);
    }
  };

  const runDailyPack = async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    setNotice(null);
    setProgress('Running today’s pack…');
    setMarketingFindGeo(geo);
    try {
      if (needsSetup) {
        setShowFix(true);
        setErr('Needs setup — follow the Fix setup steps, then try Daily pack.');
        return;
      }
      const r = await runMarketingDailyPack({ location: geo });
      finishRun(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Daily pack failed');
    } finally {
      setProgress(null);
      setBusy(false);
    }
  };

  return (
    <div className={`space-y-3 ${busy ? 'pointer-events-none opacity-90' : ''}`}>
      <div className="sticky top-0 z-10 rounded-2xl border border-emerald-400/25 bg-black/70 backdrop-blur-md !p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Find new people</div>
            <h2 className="text-xl font-bold text-white">Find → auto-save good fits</h2>
          </div>
          <span className={finelyOsStatusChip(readiness.ready ? 'ok' : 'blocked')}>{readiness.label}</span>
        </div>
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
          Strong fits save themselves. Mid fits land in Review (max 8). Junk and duplicates skip quietly.
        </p>
        <label className="block max-w-md">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Location</div>
          <input
            value={geo}
            disabled={busy}
            onChange={(e) => setGeo(e.target.value)}
            onBlur={() => setMarketingFindGeo(geo)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40"
            placeholder="United States"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} className={FINELY_OS_PRIMARY_BTN} onClick={() => void runFindNow()}>
            {busy && progress?.startsWith('Finding') ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Radar size={14} />
            )}
            {needsSetup ? 'Fix setup first' : busy && progress?.startsWith('Finding') ? 'Finding…' : 'Find now'}
          </button>
          <button type="button" disabled={busy} className={FINELY_OS_SECONDARY_BTN} onClick={() => void runDailyPack()}>
            {busy && progress?.includes('pack') ? <Loader2 size={14} className="animate-spin" /> : null}
            {busy && progress?.includes('pack') ? 'Pack running…' : 'Daily pack'}
          </button>
          <button
            type="button"
            disabled={busy}
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => setShowFix((v) => !v)}
          >
            <Settings2 size={14} /> Fix setup
          </button>
        </div>
        {busy && progress ? (
          <div className={`text-xs ${FINELY_OS_ENTITY_BODY} flex items-center gap-2`}>
            <Loader2 size={12} className="animate-spin text-emerald-300" />
            {progress} Double-run locked until this finishes.
          </div>
        ) : null}
      </div>

      {err ? <FinelyOsAlertBanner tone="blocking" message={err} /> : null}
      {notice ? <FinelyOsAlertBanner tone="success" message={notice} /> : null}

      {showFix || needsSetup ? (
        <section className={`${finelyOsCatalogCardCompact('amber')} space-y-2`} data-fc-accent="amber">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Fix setup wizard</div>
          <ol className="space-y-2">
            {readiness.steps.map((step, i) => (
              <li
                key={step.id}
                className="rounded-xl border border-white/10 bg-black/30 !p-3 flex flex-wrap items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-white text-sm">
                    {i + 1}. {step.label}
                  </div>
                  <p className={`text-xs mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>{step.detail}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
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

      <section className={`${finelyOsCatalogCardCompact('sky')} space-y-2`} data-fc-accent="sky">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Schedule · multi-lane</div>
            <div className="font-semibold text-white flex items-center gap-2">
              <Moon size={14} className="text-sky-200" /> Find while I sleep
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            className={schedule.enabled ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
            onClick={() => {
              setMarketingFindSchedule(!schedule.enabled, geo, packLanes);
              setTick((t) => t + 1);
            }}
          >
            {schedule.enabled ? 'On' : 'Off'}
          </button>
        </div>
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Daily pack lanes remembered below. When On and Owner keeps platform cron live (not dry-run), the same pack
          runs once per local day overnight. Use Daily pack here anytime — overnight does not replace it.
        </p>
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
      </section>

      {lastRun ? (
        <section className={`${finelyOsCatalogCardCompact('violet')} space-y-2`} data-fc-accent="violet">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Last run</div>
          <div className="flex flex-wrap gap-2">
            <span className={finelyOsMicroStat('violet')}>Found {lastRun.found}</span>
            <span className={finelyOsMicroStat('emerald')}>Auto-saved {lastRun.autoSaved}</span>
            <span className={finelyOsMicroStat('amber')}>Review {lastRun.review}</span>
            <span className={finelyOsMicroStat('sky')}>Skipped {lastRun.skipped}</span>
            {lastRun.errors.length ? (
              <span className={finelyOsMicroStat('rose')}>Errors {lastRun.errors.length}</span>
            ) : null}
          </div>
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            {new Date(lastRun.at).toLocaleString()} · {lastRun.mode.replace('_', ' ')} ·{' '}
            {lastRun.lanes.length} lane(s) · {lastRun.location}
          </p>
          {lastRun.errors[0] ? (
            <p className={`text-xs text-rose-200/90`}>{lastRun.errors[0]}</p>
          ) : null}
        </section>
      ) : null}

      {laneChips.length > 0 ? (
        <section className={`${finelyOsCatalogCardCompact('emerald')} space-y-2`} data-fc-accent="emerald">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Lane pace · found → booked (30d)</div>
          <div className="flex flex-wrap gap-2">
            {laneChips.map((c) => (
              <span
                key={c.lane}
                className={finelyOsMicroStat('emerald')}
                title={`${c.found} found · ${c.booked} booked`}
              >
                {c.label} {c.ratePct}%
              </span>
            ))}
          </div>
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Top 3 lanes by book rate — not a full report.</p>
        </section>
      ) : null}

      <section className={`${finelyOsCatalogCardCompact('emerald')} space-y-2`} data-fc-accent="emerald" id="exceptions">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Exception queue · mid-score only</div>
            <div className="font-semibold text-white">Clear exceptions · max 8 on screen</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={finelyOsMicroStat(pendingTotal > 0 ? 'amber' : 'emerald')}>
              {pendingTotal} exception{pendingTotal === 1 ? '' : 's'}
            </span>
            {pendingTotal > 0 ? (
              <button
                type="button"
                disabled={busy}
                className={FINELY_OS_SECONDARY_BTN}
                onClick={() => {
                  const r = clearMarketingStagingExceptions();
                  setNotice(
                    r.cleared
                      ? `Cleared ${r.cleared} exception${r.cleared === 1 ? '' : 's'} — queue matches morning brief.`
                      : 'No exceptions left to clear.',
                  );
                  setTick((t) => t + 1);
                }}
              >
                Clear all
              </button>
            ) : null}
          </div>
        </div>
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Count matches Desk home / While you slept. High scores auto-save; junk skips quietly. You only
          clear mid-score leftovers here.
        </p>
        <FinelyOsPaginatedStack
          items={queue}
          pageSize={8}
          emptyMessage="All clear — 0 exceptions. Find now or Daily pack; only mid-score people land here."
          itemSpacingClassName="space-y-2"
          renderItem={(hit) => (
            <div key={hit.url} className="rounded-xl border border-white/10 bg-black/30 !p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">{hit.title || hit.domain || hit.url}</div>
                  <p className={`text-xs mt-1 line-clamp-2 ${FINELY_OS_ENTITY_BODY}`}>
                    {hit.whyReason || hit.whyNote || 'Mid-score fit — approve or reject.'}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-amber-200/90 tabular-nums">score {hit.score}</span>
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
              </div>
            </div>
          )}
        />
      </section>
    </div>
  );
}
