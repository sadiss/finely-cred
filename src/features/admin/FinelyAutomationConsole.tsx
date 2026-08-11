import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Moon, Play, RefreshCw, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  approveAutomationException,
  AUTOMATION_JOB_LABELS,
  getWhileYouSleptSummary,
  isGrowthAutopilotEnabled,
  listAutomationExceptions,
  listAutomationJobRuns,
  rejectAutomationException,
  runAutomationJob,
  runGrowthAutopilotTick,
  setGrowthAutopilotEnabled,
  type FinelyAutomationJobKind,
  type FinelyAutomationJobRecord,
} from '../../lib/finelyAutomationOrchestrator';
import { FinelyOsAlertBanner } from '../os/FinelyOsAlertBanner';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsDeckTile,
  finelyOsMicroStat,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

function jobStatusChip(status: FinelyAutomationJobRecord['status']) {
  if (status === 'completed') return finelyOsStatusChip('ok');
  if (status === 'failed') return finelyOsStatusChip('blocked');
  if (status === 'needs_approval' || status === 'skipped') return finelyOsStatusChip('warn');
  return finelyOsStatusChip('warn');
}

function ExceptionRow({
  hit,
  onAction,
}: {
  hit: ReturnType<typeof listAutomationExceptions>[number];
  onAction: () => void;
}) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const title = hit.title?.trim() || hit.domain || hit.url;

  const act = async (kind: 'approve' | 'reject') => {
    setBusy(kind);
    try {
      if (kind === 'approve') approveAutomationException(hit.url);
      else rejectAutomationException(hit.url);
      onAction();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-white truncate">{title}</div>
        <div className={`mt-0.5 text-[11px] ${FINELY_OS_ENTITY_BODY} truncate`}>{hit.url}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className={finelyOsMicroStat('violet')}>Score {hit.score}</span>
          {hit.lane ? <span className={finelyOsMicroStat('sky')}>{hit.lane}</span> : null}
          {hit.emails?.length ? (
            <span className={finelyOsMicroStat('emerald')}>{hit.emails.length} email</span>
          ) : null}
        </div>
        {hit.whyNote ? (
          <p className={`mt-2 text-[11px] ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>{hit.whyNote}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          className={FINELY_OS_PRIMARY_BTN}
          disabled={busy !== null}
          onClick={() => void act('approve')}
        >
          {busy === 'approve' ? 'Saving…' : 'Approve'}
        </button>
        <button
          type="button"
          className={FINELY_OS_SECONDARY_BTN}
          disabled={busy !== null}
          onClick={() => void act('reject')}
        >
          {busy === 'reject' ? 'Saving…' : 'Reject'}
        </button>
      </div>
    </div>
  );
}

export function FinelyAutomationConsole() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [ticking, setTicking] = useState(false);
  const [runningKind, setRunningKind] = useState<FinelyAutomationJobKind | null>(null);

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const summary = useMemo(() => {
    void tick;
    return getWhileYouSleptSummary();
  }, [tick]);

  const exceptions = useMemo(() => {
    void tick;
    return listAutomationExceptions(24);
  }, [tick]);

  const jobs = useMemo(() => {
    void tick;
    return listAutomationJobRuns(30);
  }, [tick]);

  const autopilotOn = useMemo(() => {
    void tick;
    return isGrowthAutopilotEnabled();
  }, [tick]);

  const toggleAutopilot = (next: boolean) => {
    setGrowthAutopilotEnabled(next);
    setTick((t) => t + 1);
  };

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const runTick = async () => {
    setTicking(true);
    try {
      await runGrowthAutopilotTick({ dryRun: !autopilotOn, force: false });
      refresh();
    } finally {
      setTicking(false);
    }
  };

  const runOne = async (kind: FinelyAutomationJobKind) => {
    setRunningKind(kind);
    try {
      await runAutomationJob(kind, { dryRun: !autopilotOn, force: true });
      refresh();
    } finally {
      setRunningKind(null);
    }
  };

  return (
    <div className={FINELY_OS_COMPACT_PAGE}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Growth autopilot</div>
          <h2 className={`${FINELY_OS_ENTITY_TITLE} text-white`}>Automation console</h2>
          <p className={`text-sm max-w-2xl ${FINELY_OS_ENTITY_BODY}`}>
            One master switch runs daily find, week sync, nurture, scorecard, and course stubs while you work.
            Review exceptions before they enter CRM.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/growth-agents" className={FINELY_OS_SECONDARY_BTN}>
            Growth Agents
          </Link>
          <Link to="/admin/marketing-desk" className={FINELY_OS_SECONDARY_BTN}>
            Marketing Desk
          </Link>
        </div>
      </div>

      <div className={finelyOsCatalogCardCompact('amber')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10">
              <Zap size={18} className="text-amber-200" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Autopilot master</div>
              <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                {autopilotOn
                  ? 'On — Caleb find, nurture tick, and scorecard refresh run on hub load.'
                  : 'Off — preview jobs with Run tick (dry run).'}
              </p>
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <span className={`text-xs font-semibold ${autopilotOn ? 'text-emerald-300' : 'text-white/50'}`}>
              {autopilotOn ? 'On' : 'Off'}
            </span>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-black/30 accent-amber-400"
              checked={autopilotOn}
              onChange={(e) => toggleAutopilot(e.target.checked)}
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={ticking} onClick={() => void runTick()}>
            {ticking ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Running tick…
              </>
            ) : (
              <>
                <Play size={14} /> Run tick {autopilotOn ? '' : '(dry run)'}
              </>
            )}
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={refresh}>
            Refresh
          </button>
        </div>
      </div>

      {(summary.hasSignal || summary.autopilotOn || summary.sleepOn) && (
        <section className={`${finelyOsDeckTile('violet')} !p-4 space-y-2`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} inline-flex items-center gap-1.5`}>
                <Moon size={12} />
                {summary.overnight || summary.autopilotOn ? 'While you slept' : 'Morning brief'}
              </div>
              <p className="text-sm font-semibold text-white">{summary.summaryLine}</p>
              <p className={`mt-1 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
                {summary.autopilotOn ? 'Growth autopilot is On. ' : ''}
                {summary.sleepOn ? 'Find while I sleep is On. ' : ''}
                {summary.lastTickAt
                  ? `Last tick ${new Date(summary.lastTickAt).toLocaleString()}.`
                  : 'No autopilot tick yet — turn On or Run tick.'}
              </p>
            </div>
            {summary.findFailed ? (
              <button
                type="button"
                className={FINELY_OS_PRIMARY_BTN}
                onClick={() => navigate('/admin/marketing-desk?helper=find')}
              >
                Fix setup <ArrowRight size={14} />
              </button>
            ) : summary.exceptions > 0 ? (
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => window.scrollTo({ top: 9999, behavior: 'smooth' })}>
                Review exceptions <ArrowRight size={14} />
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={finelyOsMicroStat('violet')}>{summary.found} found</span>
            <span className={finelyOsMicroStat('emerald')}>{summary.autoSaved} auto-saved</span>
            <span className={finelyOsMicroStat('amber')}>{summary.exceptions} exceptions</span>
            <span className={finelyOsMicroStat('sky')}>{summary.mailed} mailed</span>
            <span className={finelyOsMicroStat('fuchsia')}>{summary.booked} booked</span>
            <span className={finelyOsMicroStat('violet')}>
              Quota {summary.quotaProgress.totalCount}/{summary.quotaProgress.totalCap}
            </span>
            {summary.jobsCompleted > 0 ? (
              <span className={finelyOsMicroStat('emerald')}>{summary.jobsCompleted} jobs done</span>
            ) : null}
            {summary.jobsFailed > 0 ? (
              <span className={finelyOsMicroStat('rose')}>{summary.jobsFailed} failed</span>
            ) : null}
          </div>
        </section>
      )}

      <FinelyOsAlertBanner
        tone="info"
        message="Results vary · not legal advice · outbound mail requires consent evidence. Approve exceptions before CRM enroll."
      />

      <div className={finelyOsCatalogCardCompact('fuchsia')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Exception inbox</div>
            <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
              {exceptions.length
                ? `${exceptions.length} people need your approve/reject before CRM + mail.`
                : 'No pending exceptions — Find auto-saved high scores or queue is clear.'}
            </p>
          </div>
          {exceptions.length > 0 ? (
            <button
              type="button"
              className={FINELY_OS_SECONDARY_BTN}
              onClick={() => navigate('/admin/marketing-desk?helper=find#exceptions')}
            >
              Open in Desk
            </button>
          ) : null}
        </div>

        {exceptions.length > 0 ? (
          <div className="mt-3 space-y-2">
            <FinelyOsPaginatedStack
              items={exceptions}
              pageSize={6}
              renderItem={(hit) => <ExceptionRow key={hit.url} hit={hit} onAction={refresh} />}
            />
          </div>
        ) : null}
      </div>

      <div className={finelyOsCatalogCardCompact('sky')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Job queue</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Manual run any job — stubs for pillar render and course batch until Content Studio batch ships.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(AUTOMATION_JOB_LABELS) as FinelyAutomationJobKind[]).map((kind) => (
            <button
              key={kind}
              type="button"
              className={`${FINELY_OS_SECONDARY_BTN} !py-1 !px-2 text-[10px]`}
              disabled={runningKind !== null}
              onClick={() => void runOne(kind)}
            >
              {runningKind === kind ? 'Running…' : AUTOMATION_JOB_LABELS[kind]}
            </button>
          ))}
        </div>
      </div>

      <div className={finelyOsCatalogCardCompact('emerald')}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Recent runs</div>
        {jobs.length === 0 ? (
          <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>No automation runs yet — turn autopilot On or Run tick.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {jobs.slice(0, 12).map((job) => (
              <div
                key={job.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white">{AUTOMATION_JOB_LABELS[job.kind]}</div>
                  <div className={`text-[11px] ${FINELY_OS_ENTITY_BODY} truncate`}>{job.summary}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={jobStatusChip(job.status)}>{job.status}</span>
                  <span className="text-[10px] text-white/45">
                    {job.finishedAt ? new Date(job.finishedAt).toLocaleString() : '…'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
