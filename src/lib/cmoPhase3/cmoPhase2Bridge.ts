import type { CmoAutonomousRun, CmoExecutionStep } from '../../domain/cmoPhase3';
import {
  buildAudienceFromLeadIntel,
  createCampaignFromAudience,
  createStarterAssetsForCampaign,
  pushCampaignAssetsToComms,
  pushCampaignToMediaStudio,
  scheduleCampaignContent,
  createCampaignFollowUpTasks,
  routeEngagementText,
} from '../cmoPhase2/cmoExecutionBridge';
import { emitCmoEvent } from '../cmoPhase2/cmoEventBus';

export interface CmoPhase2BridgeResult {
  ok: boolean;
  message: string;
  createdRefs: string[];
  skippedRefs: string[];
  warnings: string[];
}

type CampaignContext = {
  campaignId?: string;
  assetIds: string[];
};

function makeDefaultOffer(run: CmoAutonomousRun) {
  const lower = `${run.title} ${run.executiveSummary}`.toLowerCase();
  if (lower.includes('interview') || lower.includes('press')) return 'Expert interview, founder commentary, and authority education campaign.';
  if (lower.includes('affiliate') || lower.includes('partner')) return 'Affiliate/referral partner activation campaign.';
  if (lower.includes('funding')) return 'Funding readiness consultation and business credit roadmap.';
  if (lower.includes('short')) return 'Short-form video to consultation campaign.';
  return 'Finely Cred consultation, education, and growth campaign.';
}

function ensureCampaign(run: CmoAutonomousRun, ctx: CampaignContext) {
  if (ctx.campaignId) return ctx.campaignId;
  const audience = buildAudienceFromLeadIntel({ stage: 'contact_ready', minScore: 20, limit: 200 });
  const campaign = createCampaignFromAudience({
    audience,
    title: run.title,
    offer: makeDefaultOffer(run),
  });
  const assets = createStarterAssetsForCampaign(campaign.id);
  ctx.campaignId = campaign.id;
  ctx.assetIds.push(...assets.map((asset) => asset.id));
  return campaign.id;
}

function runStep(step: CmoExecutionStep, run: CmoAutonomousRun, ctx: CampaignContext): string[] {
  const refs: string[] = [];
  const campaignId = ensureCampaign(run, ctx);

  switch (step.actionType) {
    case 'create_campaign': {
      refs.push(campaignId);
      break;
    }
    case 'create_copy':
    case 'score_assets': {
      const assets = createStarterAssetsForCampaign(campaignId);
      refs.push(...assets.map((asset) => asset.id));
      ctx.assetIds.push(...assets.map((asset) => asset.id));
      break;
    }
    case 'create_comms_sequence': {
      const comms = pushCampaignAssetsToComms(campaignId);
      refs.push(...comms.templateIds);
      if (comms.sequenceId) refs.push(comms.sequenceId);
      break;
    }
    case 'create_media_project': {
      const project = pushCampaignToMediaStudio(campaignId);
      refs.push(project.id);
      break;
    }
    case 'create_scheduler_posts':
    case 'export_for_manual_publish': {
      const posts = scheduleCampaignContent(campaignId);
      refs.push(...posts.map((post) => post.id));
      break;
    }
    case 'create_crm_tasks': {
      const tasks = createCampaignFollowUpTasks(campaignId);
      refs.push(...tasks.map((task) => task.id));
      break;
    }
    case 'classify_inbox': {
      const engagement = routeEngagementText({
        text: 'Manual inbox triage queued from CMO Phase 3. Review comments, DMs, SMS replies, email replies, and form leads for buying intent.',
        source: 'manual',
        campaignId,
      });
      refs.push(engagement.id);
      break;
    }
    case 'generate_brief':
    case 'report':
    case 'sync_to_supabase': {
      emitCmoEvent({
        type: 'playbook_executed',
        source: 'marketing_agent',
        campaignId,
        labels: [step.actionType, step.status],
        meta: { runId: run.id, stepId: step.id, note: 'Phase 3 step acknowledged by Phase 2 bridge.' },
      });
      refs.push(`${step.actionType}:${step.id}`);
      break;
    }
    case 'external_publish_adapter': {
      // External publishing stays blocked here by design. Manual queues are safe; real platform APIs belong in a later approved Phase 4 adapter.
      refs.push(`blocked_external_publish:${step.id}`);
      break;
    }
    default: {
      refs.push(`unhandled:${step.id}`);
      break;
    }
  }

  emitCmoEvent({
    type: 'playbook_executed',
    source: 'marketing_agent',
    campaignId,
    labels: [step.actionType, step.status],
    meta: { runId: run.id, stepId: step.id, createdRefs: refs },
  });
  return refs;
}

export async function bridgePhase3RunToPhase2(run: CmoAutonomousRun): Promise<CmoPhase2BridgeResult> {
  const executable = run.steps.filter((step) => step.status === 'ready');
  const skipped = run.steps.filter((step) => step.status !== 'ready');
  const ctx: CampaignContext = { assetIds: [] };
  const createdRefs: string[] = [];
  const warnings: string[] = [];

  executable.forEach((step) => {
    try {
      createdRefs.push(...runStep(step, run, ctx));
    } catch (error) {
      warnings.push(`${step.title}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  const externalBlocked = executable.filter((step) => step.actionType === 'external_publish_adapter').length;
  if (externalBlocked) warnings.push('External publishing was intentionally blocked. Use manual queues or approved Phase 4 provider adapters.');

  return {
    ok: warnings.length === 0,
    message: `Executed ${executable.length} ready Phase 3 steps through the Phase 2 bridge. Created ${createdRefs.length} local records. Skipped ${skipped.length} steps that still need approval or were blocked.`,
    createdRefs,
    skippedRefs: skipped.map((step) => step.id),
    warnings,
  };
}
