/**
 * Miriam Cole — Content Priority Review sub-agent (Phase 5b real-reasoning
 * upgrade). Reads real Content Studio social-draft state
 * (`contentStudioRepo.ts` assets, not a fabricated queue) and asks the agent
 * brain which waiting draft is worth prioritizing for publish/promote next.
 * `create_task` directives create a real, per-draft Marketing Desk task
 * (deep-linked into Content Studio) so the recommendation is actionable, not
 * just a log line.
 */
import { listContentStudioAssets } from '../../studioCommandOs/contentStudioRepo';
import type { ContentStudioAsset } from '../../studioCommandOs/types';
import { runAgentBrainStep } from '../growthAgentBrain';
import { createMarketingTask, findOpenMarketingTask } from '../../marketingDesk/marketingDeskTasks';
import { buildGrowthContentStudioPromoteUrl } from '../growthAgentRegistry';
import { ranToday, markRan } from './subagentCadence';

const AGENT_ID = 'social.content_priority';
const CADENCE_KEY = 'finely.miriam.content_priority_cadence.v1';

export type MiriamContentPriorityResult = {
  ok: boolean;
  action?: string;
  message: string;
};

function candidateSocialDrafts(): ContentStudioAsset[] {
  return listContentStudioAssets().filter(
    (a) => a.assetType === 'social_clip' && (a.status === 'draft' || a.status === 'needs_review'),
  );
}

/** Run once per local day — call from the shared `agent_team_tick` autopilot. */
export async function runMiriamContentPriorityReview(): Promise<MiriamContentPriorityResult> {
  try {
    if (ranToday(CADENCE_KEY, 'daily')) {
      return { ok: true, message: 'Content priority review already ran today.' };
    }

    const drafts = candidateSocialDrafts();
    markRan(CADENCE_KEY, 'daily');

    if (!drafts.length) {
      return { ok: true, action: 'no_action', message: 'No social drafts waiting in Content Studio.' };
    }

    const oldest = [...drafts].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))[0]!;
    const ageDays = Math.round((Date.now() - Date.parse(oldest.updatedAt)) / 86_400_000);
    const situationSummary = [
      `${drafts.length} social draft(s) waiting in Content Studio (status draft/needs_review).`,
      `Oldest untouched: "${oldest.title}" (status ${oldest.status}, last touched ${ageDays} day(s) ago).`,
    ].join(' ');

    const directive = await runAgentBrainStep({
      agentId: AGENT_ID,
      taskType: 'miriam_content_priority_review',
      situationSummary,
      allowedActions: ['create_task', 'no_action'],
      autoExecutableActions: ['create_task'],
      entityType: 'content_studio_asset',
      entityId: oldest.id,
    });

    if (directive.action === 'create_task' && directive.autoExecuted) {
      const existing = findOpenMarketingTask({ kind: 'nurture', recordId: oldest.id });
      if (!existing) {
        createMarketingTask({
          kind: 'nurture',
          title: `Publish/promote — ${oldest.title}`,
          notes: [directive.reasoning, `Open: ${buildGrowthContentStudioPromoteUrl()}`].join('\n'),
          recordId: oldest.id,
          href: '/admin/content-studio?room=video',
          tags: ['miriam-content-priority', 'persona:social'],
          priority: ageDays >= 3 ? 'high' : 'normal',
          dueAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          meta: { assetId: oldest.id, assetType: oldest.assetType, status: oldest.status, ageDays },
        });
      }
      return { ok: true, action: 'create_task', message: directive.reasoning };
    }

    return {
      ok: true,
      action: directive.action,
      message: directive.reasoning || `${drafts.length} draft(s) pending — below action threshold.`,
    };
  } catch (e) {
    return { ok: false, message: (e as Error)?.message || 'Miriam content priority review failed.' };
  }
}
