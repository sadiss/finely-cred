/**
 * Jordan Ellis — Video Pipeline Review sub-agent (Phase 5b real-reasoning
 * upgrade). Reads the real pillar-video pipeline state
 * (`videoCommandRecordRepo.ts` via `growthPillarVideoPack.ts` —
 * import/understand/destinations/publish/promote lifecycle, not a fabricated
 * render queue) and asks the agent brain whether the latest pillar video needs
 * a nudge to move forward (promote, repurpose) or is fine as-is. `create_task`
 * directives create a real, deep-linked Marketing Desk task.
 */
import { listLatestPillarVideoCommandRecords } from '../growthPillarVideoPack';
import { runAgentBrainStep } from '../growthAgentBrain';
import { createMarketingTask, findOpenMarketingTask } from '../../marketingDesk/marketingDeskTasks';
import { buildGrowthContentStudioPromoteUrl } from '../growthAgentRegistry';
import { ranToday, markRan } from './subagentCadence';

const AGENT_ID = 'media.video_pipeline';
const CADENCE_KEY = 'finely.jordan.video_pipeline_cadence.v1';

export type JordanVideoPipelineResult = {
  ok: boolean;
  action?: string;
  message: string;
};

/** Run once per local day per latest pillar record — call from `agent_team_tick`. */
export async function runJordanVideoPipelineReview(): Promise<JordanVideoPipelineResult> {
  try {
    const records = listLatestPillarVideoCommandRecords(6);
    if (!records.length) {
      return { ok: true, action: 'no_action', message: 'No pillar video records in the pipeline yet.' };
    }

    const latest = records[0]!;
    if (ranToday(CADENCE_KEY, latest.id)) {
      return { ok: true, message: `Pipeline review for "${latest.title}" already ran today.` };
    }
    markRan(CADENCE_KEY, latest.id);

    const stageAgeDays = Math.round((Date.now() - Date.parse(latest.updatedAt)) / 86_400_000);
    const situationSummary = [
      `Latest pillar video "${latest.title}" is at lifecycle stage "${latest.lifecycle}" (last updated ${stageAgeDays} day(s) ago).`,
      `${records.length} pillar video record(s) exist in the pipeline.`,
    ].join(' ');

    const directive = await runAgentBrainStep({
      agentId: AGENT_ID,
      taskType: 'jordan_video_pipeline_review',
      situationSummary,
      allowedActions: ['create_task', 'no_action'],
      autoExecutableActions: ['create_task'],
      entityType: 'video_command_record',
      entityId: latest.id,
    });

    if (directive.action === 'create_task' && directive.autoExecuted) {
      const existing = findOpenMarketingTask({ kind: 'nurture', recordId: latest.id });
      if (!existing) {
        createMarketingTask({
          kind: 'nurture',
          title: `Video pipeline — ${latest.title} (${latest.lifecycle})`,
          notes: [directive.reasoning, `Open: ${buildGrowthContentStudioPromoteUrl(latest.resourceVideoId)}`].join('\n'),
          recordId: latest.id,
          href: '/admin/content-studio?room=video',
          tags: ['jordan-video-pipeline', 'persona:media'],
          growthAgentId: 'media',
          priority: stageAgeDays >= 5 ? 'high' : 'normal',
          dueAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          meta: { videoCommandRecordId: latest.id, lifecycle: latest.lifecycle, stageAgeDays },
        });
      }
      return { ok: true, action: 'create_task', message: directive.reasoning };
    }

    return {
      ok: true,
      action: directive.action,
      message: directive.reasoning || `"${latest.title}" at ${latest.lifecycle} — below action threshold.`,
    };
  } catch (e) {
    return { ok: false, message: (e as Error)?.message || 'Jordan video pipeline review failed.' };
  }
}
