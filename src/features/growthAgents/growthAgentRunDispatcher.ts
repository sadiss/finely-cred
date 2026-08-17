/**
 * Dispatches ?run= query params on growth agent workspace load.
 */
import { runEstherStrategyReview } from './subagents/estherStrategySubagent';
import { runLydiaSeoHealthCheck } from './subagents/lydiaSeoHealthSubagent';
import { runMiriamContentPriorityReview } from './subagents/miriamContentPrioritySubagent';
import { runJordanVideoPipelineReview } from './subagents/jordanVideoPipelineSubagent';
import { runBenjaminPartnershipReview } from './subagents/benjaminPartnershipSubagent';
import { runRebeccaRecruitingReview } from './subagents/rebeccaRecruitingSubagent';
import { runHannahSyndicationWatcher } from './subagents/hannahSyndicationWatcher';
import { runAlexAppointmentAutopilotIfDue, runAlexAppointmentOutreach } from './alexAppointmentAutomation';
import { runAlexNoShowRecoverySweep } from './subagents/alexNoShowRecovery';
import { runGrowthFindTestSearch } from './growthFindTest';
import { getTodaysContactQueue } from './growthProspectQueue';
import { buildAgentArchitectBrief } from './growthAgentArchitectBrief';

export type GrowthAgentRunResult = {
  runKey: string;
  ok: boolean;
  message: string;
};

export async function dispatchGrowthAgentRun(agentId: string, runKey: string): Promise<GrowthAgentRunResult | null> {
  const key = runKey.trim();
  if (!key) return null;

  try {
    switch (key) {
      case 'esther_strategy_review': {
        const r = await runEstherStrategyReview();
        return { runKey: key, ok: r.ok, message: r.message };
      }
      case 'lydia_seo_health_check': {
        const r = await runLydiaSeoHealthCheck();
        return { runKey: key, ok: r.ok, message: r.message };
      }
      case 'miriam_content_priority_review': {
        const r = await runMiriamContentPriorityReview();
        return { runKey: key, ok: r.ok, message: r.message };
      }
      case 'jordan_video_pipeline_review': {
        const r = await runJordanVideoPipelineReview();
        return { runKey: key, ok: r.ok, message: r.message };
      }
      case 'benjamin_partnership_review': {
        const r = await runBenjaminPartnershipReview();
        return { runKey: key, ok: r.ok, message: r.message };
      }
      case 'rebecca_recruiting_review': {
        const r = await runRebeccaRecruitingReview();
        return { runKey: key, ok: r.ok, message: r.message };
      }
      case 'hannah_syndication_watcher': {
        const r = runHannahSyndicationWatcher();
        return {
          runKey: key,
          ok: true,
          message:
            r.channelsScored > 0 && r.topChannel
              ? `Top: ${r.topChannel.channelKey} (${Math.round(r.topChannel.conversionRate * 100)}% conv)`
              : 'Not enough channel data yet (need 3+ leads per channel).',
        };
      }
      case 'alex_outreach':
      case 'alex_appointment_autopilot': {
        const r =
          (await runAlexAppointmentAutopilotIfDue()) ??
          (await runAlexAppointmentOutreach({ limit: 5, force: false }));
        return {
          runKey: key,
          ok: true,
          message: `${r.emailsSent} email(s) · ${r.invitesCreated} invite(s) · ${r.skipped} skipped`,
        };
      }
      case 'alex_no_show_recovery': {
        const r = await runAlexNoShowRecoverySweep();
        return { runKey: key, ok: true, message: `Recovery: ${r.recovered} processed` };
      }
      case 'test_search': {
        const r = await runGrowthFindTestSearch();
        return { runKey: key, ok: r.ok, message: r.message };
      }
      case 'today_ten': {
        const q = getTodaysContactQueue(10);
        return { runKey: key, ok: true, message: `${q.length} contact(s) ranked for today.` };
      }
      case 'agent_architect_brief': {
        const b = buildAgentArchitectBrief();
        return { runKey: key, ok: true, message: b.headline };
      }
      default:
        return null;
    }
  } catch (e) {
    return { runKey: key, ok: false, message: e instanceof Error ? e.message : 'Run failed' };
  }
}
