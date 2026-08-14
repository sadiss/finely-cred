/**
 * Growth autopilot orchestrator — schedules daily find, week sync, nurture, scorecard, and course stubs.
 * Client-side tick (browser session); server cron can mirror these job kinds later.
 */
import { loadJson, saveJson } from '../data/localJsonStore';
import { isFeatureEnabled, updateFeatureFlags } from '../data/settingsRepo';
import { listAllCourses } from '../data/coursesRepo';
import {
  advanceCourseLessonVideoStage,
  listCourseVideoJobs,
  upsertCourseLessonVideoJob,
} from '../data/courseVideoPipelineRepo';
import {
  countLessonScenesForLesson,
  inferLessonVideoStage,
  lessonHasAttachedVideo,
  lessonMarkdownFromBlocks,
} from '../features/educationStudio/courseVideoBridge';
import { getDailyQuotaProgress, type GrowthDailyQuotaProgress } from '../features/growthAgents/growthDailyQuota';
import {
  ensureCalebFeatureFlags,
  isCalebAutoFindEnabled,
  runCalebAutoFindIfDue,
  setCalebAutoFindEnabled,
} from '../features/growthAgents/calebAutoFind';
import { getGrowthWeekFocus, setGrowthWeekFocus } from '../features/growthAgents/growthWeekFocus';
import { resolveGrowthPillarVideoRecord } from '../features/growthAgents/growthPillarVideoPack';
import {
  approveMarketingStaged,
  countMarketingStagingPending,
  getMarketingFindLastRun,
  listMarketingStagingQueue,
  rejectMarketingStaged,
  runMarketingDailyPack,
  setMarketingFindGeo,
  type MarketingStagedHit,
} from '../features/marketingDesk/marketingDeskHunt';
import { getMarketingMorningBrief, type MarketingMorningBrief } from '../features/marketingDesk/marketingDeskMorningBrief';
import { buildFinelyCapabilityReport, type FinelyCapabilityReport } from './finelyCapabilityMetrics';
import { processDueNurtureSteps } from './nurtureEngine';
import { newId } from '../utils/ids';
import { runAlexAppointmentAutopilotIfDue } from '../features/growthAgents/alexAppointmentAutomation';
import { runAlexNoShowRecoverySweep } from '../features/growthAgents/subagents/alexNoShowRecovery';
import { runHannahSyndicationWatcher } from '../features/growthAgents/subagents/hannahSyndicationWatcher';
import { runEstherStrategyReview } from '../features/growthAgents/subagents/estherStrategySubagent';
import { runLydiaSeoHealthCheck } from '../features/growthAgents/subagents/lydiaSeoHealthSubagent';
import { runMiriamContentPriorityReview } from '../features/growthAgents/subagents/miriamContentPrioritySubagent';
import { runJordanVideoPipelineReview } from '../features/growthAgents/subagents/jordanVideoPipelineSubagent';
import { runBenjaminPartnershipReview } from '../features/growthAgents/subagents/benjaminPartnershipSubagent';
import { runRebeccaRecruitingReview } from '../features/growthAgents/subagents/rebeccaRecruitingSubagent';

export type FinelyAutomationJobKind =
  | 'daily_find_pack'
  | 'week_plan_sync'
  | 'pillar_video_render'
  | 'course_lesson_video_batch'
  | 'course_auto_narrate'
  | 'inbound_nurture_tick'
  | 'scorecard_refresh'
  | 'agent_team_tick';

export type FinelyAutomationJobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'needs_approval';

export type FinelyAutomationJobRecord = {
  id: string;
  kind: FinelyAutomationJobKind;
  status: FinelyAutomationJobStatus;
  startedAt: string;
  finishedAt?: string;
  summary: string;
  detail?: string;
  counts?: Record<string, number>;
  error?: string;
};

export type GrowthAutopilotSettings = {
  enabled: boolean;
  lastTickAt?: string;
  updatedAt: string;
};

export type WhileYouSleptSummary = MarketingMorningBrief & {
  autopilotOn: boolean;
  jobsCompleted: number;
  jobsFailed: number;
  lastTickAt?: string;
  quotaProgress: GrowthDailyQuotaProgress;
  recentJobs: FinelyAutomationJobRecord[];
};

const AUTOPILOT_KEY = 'finely.growth_autopilot.v1';
const RUNS_KEY = 'finely.automation_runs.v1';
const SCORECARD_CACHE_KEY = 'finely.automation_scorecard_cache.v1';

const MAX_RUNS = 80;

export const AUTOMATION_JOB_LABELS: Record<FinelyAutomationJobKind, string> = {
  daily_find_pack: 'Daily find pack',
  week_plan_sync: 'Week plan sync',
  pillar_video_render: 'Pillar video render',
  course_lesson_video_batch: 'Course lesson video batch',
  course_auto_narrate: 'Course auto-narrate',
  inbound_nurture_tick: 'Inbound nurture tick',
  scorecard_refresh: 'Scorecard refresh',
  agent_team_tick: 'Agent team tick (Alex + growth-agent sub-agents)',
};

function dispatchStore() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

function isSameLocalDay(iso: string, now = new Date()): boolean {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return false;
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isSameLocalWeek(iso: string, now = new Date()): boolean {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return false;
  const weekStart = (n: Date) => {
    const copy = new Date(n);
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy.getTime();
  };
  return weekStart(d) === weekStart(now);
}

function loadRuns(): FinelyAutomationJobRecord[] {
  return loadJson<{ runs: FinelyAutomationJobRecord[] }>(RUNS_KEY, { runs: [] }, 1).runs;
}

function saveRun(record: FinelyAutomationJobRecord) {
  const runs = [record, ...loadRuns()].slice(0, MAX_RUNS);
  saveJson(RUNS_KEY, { runs }, 1);
  dispatchStore();
}

export function getGrowthAutopilotSettings(): GrowthAutopilotSettings {
  const raw = loadJson<Partial<GrowthAutopilotSettings>>(AUTOPILOT_KEY, {}, 1);
  return {
    enabled: Boolean(raw.enabled),
    lastTickAt: raw.lastTickAt,
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

/** Master growth autopilot — coordinates Caleb find, nurture tick, and capability refresh. */
export function isGrowthAutopilotEnabled(): boolean {
  return getGrowthAutopilotSettings().enabled;
}

export function setGrowthAutopilotEnabled(enabled: boolean) {
  const prev = getGrowthAutopilotSettings();
  saveJson(
    AUTOPILOT_KEY,
    {
      enabled,
      lastTickAt: prev.lastTickAt,
      updatedAt: new Date().toISOString(),
    },
    1,
  );

  if (enabled) {
    ensureCalebFeatureFlags();
    if (!isFeatureEnabled('automationAutopilot')) {
      updateFeatureFlags({ automationAutopilot: true });
    }
    const focus = getGrowthWeekFocus();
    setCalebAutoFindEnabled(true, focus.city);
    setMarketingFindGeo(focus.city);
  }

  dispatchStore();
}

export function touchGrowthAutopilotTick(at = new Date().toISOString()) {
  const prev = getGrowthAutopilotSettings();
  saveJson(
    AUTOPILOT_KEY,
    {
      ...prev,
      lastTickAt: at,
      updatedAt: new Date().toISOString(),
    },
    1,
  );
}

export function listAutomationJobRuns(limit = 20): FinelyAutomationJobRecord[] {
  return loadRuns().slice(0, limit);
}

export function getLastJobRun(kind: FinelyAutomationJobKind): FinelyAutomationJobRecord | null {
  return loadRuns().find((r) => r.kind === kind) ?? null;
}

function jobRanToday(kind: FinelyAutomationJobKind, now = new Date()): boolean {
  const last = getLastJobRun(kind);
  return Boolean(last?.finishedAt && isSameLocalDay(last.finishedAt, now) && last.status === 'completed');
}

function jobRanThisWeek(kind: FinelyAutomationJobKind, now = new Date()): boolean {
  const last = getLastJobRun(kind);
  return Boolean(last?.finishedAt && isSameLocalWeek(last.finishedAt, now) && last.status === 'completed');
}

function beginJob(kind: FinelyAutomationJobKind): FinelyAutomationJobRecord {
  return {
    id: newId('autojob'),
    kind,
    status: 'running',
    startedAt: new Date().toISOString(),
    summary: AUTOMATION_JOB_LABELS[kind],
  };
}

function finishJob(
  record: FinelyAutomationJobRecord,
  patch: Partial<Pick<FinelyAutomationJobRecord, 'status' | 'summary' | 'detail' | 'counts' | 'error'>>,
): FinelyAutomationJobRecord {
  const finished: FinelyAutomationJobRecord = {
    ...record,
    ...patch,
    finishedAt: new Date().toISOString(),
  };
  saveRun(finished);
  return finished;
}

export async function runAutomationJob(
  kind: FinelyAutomationJobKind,
  opts?: { dryRun?: boolean; force?: boolean },
): Promise<FinelyAutomationJobRecord> {
  const dryRun = opts?.dryRun ?? !isGrowthAutopilotEnabled();
  const record = beginJob(kind);

  try {
    switch (kind) {
      case 'daily_find_pack': {
        if (!opts?.force && jobRanToday(kind)) {
          return finishJob(record, {
            status: 'skipped',
            summary: 'Daily find pack already ran today',
          });
        }
        if (dryRun) {
          const last = getMarketingFindLastRun();
          return finishJob(record, {
            status: 'skipped',
            summary: 'Dry run — daily find pack not executed',
            detail: last?.at ? `Last find ${new Date(last.at).toLocaleString()}` : 'No prior find run',
          });
        }
        ensureCalebFeatureFlags();
        const focus = getGrowthWeekFocus();
        const result =
          (await runCalebAutoFindIfDue(focus.city)) ??
          (await runMarketingDailyPack({ location: focus.city, mode: 'daily_pack' }));
        return finishJob(record, {
          status: result.error && result.found === 0 ? 'failed' : 'completed',
          summary: `${result.found} found · ${result.autoSaved} auto-saved · ${result.review} review`,
          counts: {
            found: result.found,
            autoSaved: result.autoSaved,
            review: result.review,
            skipped: result.skipped,
          },
          error: result.error,
        });
      }

      case 'week_plan_sync': {
        if (!opts?.force && jobRanThisWeek(kind)) {
          return finishJob(record, {
            status: 'skipped',
            summary: 'Week plan already synced this week',
          });
        }
        const focus = getGrowthWeekFocus();
        if (dryRun) {
          return finishJob(record, {
            status: 'skipped',
            summary: 'Dry run — week plan sync preview',
            detail: `${focus.laneLabel} · ${focus.city}`,
          });
        }
        setMarketingFindGeo(focus.city);
        if (isCalebAutoFindEnabled() || isGrowthAutopilotEnabled()) {
          setCalebAutoFindEnabled(true, focus.city);
        }
        setGrowthWeekFocus({
          lane: focus.lane,
          city: focus.city,
          ctaPath: focus.ctaPath,
          pillarVideoId: focus.pillarVideoId,
        });
        return finishJob(record, {
          status: 'completed',
          summary: `Synced ${focus.laneLabel} · ${focus.city}`,
          detail: focus.pillarVideoId ? `Pillar ${focus.pillarVideoId}` : 'No pillar id set',
        });
      }

      case 'pillar_video_render': {
        const pillar = resolveGrowthPillarVideoRecord(getGrowthWeekFocus().pillarVideoId);
        if (!pillar) {
          return finishJob(record, {
            status: 'skipped',
            summary: 'No pillar video — set Esther week focus first',
          });
        }
        if (dryRun) {
          return finishJob(record, {
            status: 'needs_approval',
            summary: `Render queued (stub) — ${pillar.title || pillar.id}`,
            detail: 'Pillar render ships via Content Studio promote workflow.',
          });
        }
        return finishJob(record, {
          status: 'completed',
          summary: `Pillar render stub queued — ${pillar.title || pillar.id}`,
          detail: 'Open Content Studio promote to finish render.',
          counts: { queued: 1 },
        });
      }

      case 'course_lesson_video_batch': {
        const courses = listAllCourses();
        let queued = 0;
        let scanned = 0;
        for (const course of courses) {
          for (const mod of course.modules ?? []) {
            for (const lesson of mod.lessons ?? []) {
              scanned += 1;
              if (lessonHasAttachedVideo(lesson)) continue;
              const existing = listCourseVideoJobs(course.id).find((j) => j.lessonId === lesson.id);
              if (existing && existing.stage !== 'draft' && existing.stage !== 'script') continue;
              if (dryRun) {
                queued += 1;
                continue;
              }
              const sceneCount = countLessonScenesForLesson(course, lesson.id);
              const stage = inferLessonVideoStage({ lesson, sceneCount, pipelineStage: existing?.stage });
              upsertCourseLessonVideoJob({
                courseId: course.id,
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                stage: stage === 'draft' || stage === 'script' ? 'render_queued' : stage,
                sceneCount,
                notes: 'Queued by growth autopilot batch (stub render).',
              });
              queued += 1;
              if (queued >= 12) break;
            }
            if (queued >= 12) break;
          }
          if (queued >= 12) break;
        }
        return finishJob(record, {
          status: queued > 0 ? (dryRun ? 'needs_approval' : 'completed') : 'skipped',
          summary:
            queued > 0
              ? `${dryRun ? 'Would queue' : 'Queued'} ${queued} lesson video(s)`
              : 'All scanned lessons have video or pipeline jobs',
          counts: { scanned, queued },
        });
      }

      case 'course_auto_narrate': {
        const courses = listAllCourses();
        let advanced = 0;
        let scanned = 0;
        for (const course of courses) {
          for (const mod of course.modules ?? []) {
            for (const lesson of mod.lessons ?? []) {
              scanned += 1;
              const md = lessonMarkdownFromBlocks(lesson);
              if (md.length < 80) continue;
              const job = listCourseVideoJobs(course.id).find((j) => j.lessonId === lesson.id);
              if (job && job.stage !== 'draft' && job.stage !== 'script') continue;
              if (dryRun) {
                advanced += 1;
                continue;
              }
              if (job) {
                advanceCourseLessonVideoStage(course.id, lesson.id, 'script', {
                  lessonTitle: lesson.title,
                  notes: 'Auto-narrate stub advanced script stage.',
                });
              } else {
                upsertCourseLessonVideoJob({
                  courseId: course.id,
                  lessonId: lesson.id,
                  lessonTitle: lesson.title,
                  stage: 'script',
                  notes: 'Auto-narrate stub — script stage from lesson markdown.',
                });
              }
              advanced += 1;
              if (advanced >= 8) break;
            }
            if (advanced >= 8) break;
          }
          if (advanced >= 8) break;
        }
        return finishJob(record, {
          status: advanced > 0 ? (dryRun ? 'needs_approval' : 'completed') : 'skipped',
          summary:
            advanced > 0
              ? `${dryRun ? 'Would advance' : 'Advanced'} ${advanced} lesson script(s)`
              : 'No draft lessons ready for auto-narrate',
          counts: { scanned, advanced },
        });
      }

      case 'inbound_nurture_tick': {
        const results = await processDueNurtureSteps({ dryRun });
        const sent = results.filter((r) => r.status === 'sent').length;
        const skipped = results.filter((r) => r.status === 'skipped').length;
        return finishJob(record, {
          status: results.length ? 'completed' : 'skipped',
          summary: dryRun
            ? `Nurture dry run — ${results.length} due step(s)`
            : `${sent} sent · ${skipped} skipped · ${results.length} processed`,
          counts: { processed: results.length, sent, skipped },
        });
      }

      case 'scorecard_refresh': {
        if (!opts?.force && jobRanToday(kind)) {
          return finishJob(record, {
            status: 'skipped',
            summary: 'Scorecard already refreshed today',
          });
        }
        const report = buildFinelyCapabilityReport();
        saveJson(SCORECARD_CACHE_KEY, report, 1);
        const avg = Math.round(
          report.domains.reduce((n, d) => n + d.percent, 0) / Math.max(1, report.domains.length),
        );
        return finishJob(record, {
          status: 'completed',
          summary: `Capability scorecard refreshed — ${avg}% avg`,
          counts: { domains: report.domains.length, avgPercent: avg },
        });
      }

      case 'agent_team_tick': {
        if (dryRun) {
          return finishJob(record, {
            status: 'skipped',
            summary: 'Dry run — Alex outreach + growth-agent sub-agent reasoning not executed',
          });
        }
        const alexOutreach = await runAlexAppointmentAutopilotIfDue();
        const noShow = await runAlexNoShowRecoverySweep();
        const shouldRunWatcher = !opts?.force ? !jobRanThisWeek('agent_team_tick') : true;
        const syndication = shouldRunWatcher ? runHannahSyndicationWatcher() : null;

        // Phase 5b — Esther/Lydia/Miriam/Jordan/Benjamin/Rebecca real reasoning sub-agents.
        // Each function guards its own daily/weekly cadence internally (subagentCadence.ts),
        // so it is safe to call every tick without duplicate spam.
        const esther = await runEstherStrategyReview();
        const lydia = await runLydiaSeoHealthCheck();
        const miriam = await runMiriamContentPriorityReview();
        const jordan = await runJordanVideoPipelineReview();
        const benjamin = await runBenjaminPartnershipReview();
        const rebecca = await runRebeccaRecruitingReview();

        const parts = [
          alexOutreach ? `${alexOutreach.emailsSent} outreach email(s)` : 'outreach already ran today',
          `${noShow.recovered} no-show recover(y/ies)`,
          syndication?.topChannel ? `top channel: ${syndication.topChannel.channelKey}` : 'channel scoring skipped',
          esther.action && esther.action !== 'no_action' ? `Esther: ${esther.action}` : null,
          lydia.action && lydia.action !== 'no_action' ? `Lydia: ${lydia.action}` : null,
          miriam.action && miriam.action !== 'no_action' ? `Miriam: ${miriam.action}` : null,
          jordan.action && jordan.action !== 'no_action' ? `Jordan: ${jordan.action}` : null,
          benjamin.processed ? `Benjamin: ${benjamin.processed} affiliate action(s)` : null,
          rebecca.processed ? `Rebecca: ${rebecca.processed} follow-up(s)` : null,
        ].filter(Boolean);

        return finishJob(record, {
          status: 'completed',
          summary: `Agent team tick — ${parts.join(' · ')}`,
          counts: {
            outreachEmails: alexOutreach?.emailsSent ?? 0,
            noShowsRecovered: noShow.recovered,
            channelsScored: syndication?.channelsScored ?? 0,
            estherActed: esther.ok && esther.action && esther.action !== 'no_action' ? 1 : 0,
            lydiaActed: lydia.ok && lydia.action && lydia.action !== 'no_action' ? 1 : 0,
            miriamActed: miriam.ok && miriam.action && miriam.action !== 'no_action' ? 1 : 0,
            jordanActed: jordan.ok && jordan.action && jordan.action !== 'no_action' ? 1 : 0,
            benjaminProcessed: benjamin.processed ?? 0,
            rebeccaProcessed: rebecca.processed ?? 0,
          },
        });
      }

      default:
        return finishJob(record, {
          status: 'failed',
          summary: 'Unknown job kind',
          error: String(kind),
        });
    }
  } catch (err) {
    return finishJob(record, {
      status: 'failed',
      summary: `${AUTOMATION_JOB_LABELS[kind]} failed`,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Run due autopilot jobs once — call on Growth hub load or manual tick. */
export async function runGrowthAutopilotTick(opts?: {
  dryRun?: boolean;
  now?: Date;
  force?: boolean;
}): Promise<FinelyAutomationJobRecord[]> {
  const now = opts?.now ?? new Date();
  const dryRun = opts?.dryRun ?? !isGrowthAutopilotEnabled();
  if (!dryRun && !isGrowthAutopilotEnabled()) return [];

  const queue: FinelyAutomationJobKind[] = [];

  if (opts?.force || !jobRanToday('week_plan_sync', now)) {
    if (opts?.force || !jobRanThisWeek('week_plan_sync', now)) queue.push('week_plan_sync');
  }
  if (opts?.force || !jobRanToday('daily_find_pack', now)) queue.push('daily_find_pack');
  queue.push('inbound_nurture_tick');
  if (opts?.force || !jobRanToday('scorecard_refresh', now)) queue.push('scorecard_refresh');
  queue.push('agent_team_tick');
  if (opts?.force || !jobRanThisWeek('pillar_video_render', now)) queue.push('pillar_video_render');
  if (opts?.force || !jobRanToday('course_lesson_video_batch', now)) queue.push('course_lesson_video_batch');
  if (opts?.force || !jobRanToday('course_auto_narrate', now)) queue.push('course_auto_narrate');

  const results: FinelyAutomationJobRecord[] = [];
  for (const kind of queue) {
    results.push(await runAutomationJob(kind, { dryRun, force: opts?.force }));
  }

  if (!dryRun) touchGrowthAutopilotTick(now.toISOString());
  return results;
}

export function getCachedCapabilityReport(): FinelyCapabilityReport | null {
  return loadJson<FinelyCapabilityReport | null>(SCORECARD_CACHE_KEY, null, 1);
}

export function getWhileYouSleptSummary(): WhileYouSleptSummary {
  const brief = getMarketingMorningBrief();
  const settings = getGrowthAutopilotSettings();
  const recentJobs = listAutomationJobRuns(8);
  const sinceTick = settings.lastTickAt
    ? recentJobs.filter((j) => j.finishedAt && j.finishedAt >= settings.lastTickAt!)
    : recentJobs;
  const jobsCompleted = sinceTick.filter((j) => j.status === 'completed').length;
  const jobsFailed = sinceTick.filter((j) => j.status === 'failed').length;

  return {
    ...brief,
    autopilotOn: settings.enabled,
    jobsCompleted,
    jobsFailed,
    lastTickAt: settings.lastTickAt,
    quotaProgress: getDailyQuotaProgress(),
    recentJobs,
  };
}

export function listAutomationExceptions(limit = 12): MarketingStagedHit[] {
  return listMarketingStagingQueue(limit);
}

export function countAutomationExceptions(): number {
  return countMarketingStagingPending();
}

export function approveAutomationException(url: string) {
  return approveMarketingStaged(url);
}

export function rejectAutomationException(url: string) {
  rejectMarketingStaged(url);
}
