import type { CmoAutonomousRun, CmoAutopilotSettings, CmoCampaignPlaybook } from '../../domain/cmoPhase3';
import { createCmoRun, getCmoAutopilotSettings, listCmoPlaybooks, saveManyCmoPlaybooks } from '../../data/cmoPhase3Repo';
import { buildDefaultCmoPlaybooks } from './cmoCampaignPlaybooks';
import { buildTwoHundredLeadQuotaPlan, summarizeLeadQuota } from './cmoLeadQuotaEngine';
import { applyApprovalPolicy } from './cmoApprovalEngine';

function getReadyPlaybooks(): CmoCampaignPlaybook[] {
  let playbooks = listCmoPlaybooks();
  if (!playbooks.length) playbooks = saveManyCmoPlaybooks(buildDefaultCmoPlaybooks());
  return playbooks.filter((item) => ['ready', 'running', 'scaled'].includes(item.status)).sort((a, b) => b.priorityScore - a.priorityScore);
}

export function buildDailyAutopilotRun(settings: CmoAutopilotSettings = getCmoAutopilotSettings()): CmoAutonomousRun {
  const quota = buildTwoHundredLeadQuotaPlan(settings.dailyLeadTarget, settings.allowedChannels);
  const quotaSummary = summarizeLeadQuota(quota);
  const playbooks = getReadyPlaybooks().slice(0, 5);
  const rawSteps = playbooks.flatMap((playbook) => playbook.automationSteps.map((step) => ({ ...step, inputRefs: [...step.inputRefs, playbook.id] })));
  const steps = applyApprovalPolicy(rawSteps, settings);
  const projectedLeadTotal = Math.min(
    settings.dailyLeadTarget,
    quotaSummary.totalLeads,
    Math.round(playbooks.reduce((sum, item) => sum + item.leadTargetPerDay, 0)),
  );
  const blockedReasons = steps.filter((step) => step.status === 'blocked').flatMap((step) => step.notes);
  const needsApproval = steps.filter((step) => step.status === 'needs_approval').length;
  return createCmoRun({
    title: 'Daily CMO Autopilot Growth Run',
    runType: projectedLeadTotal < settings.dailyLeadTarget ? 'lead_quota_recovery' : 'daily_growth_ops',
    status: needsApproval ? 'needs_approval' : 'ready',
    playbookIds: playbooks.map((item) => item.id),
    steps,
    leadTarget: settings.dailyLeadTarget,
    projectedLeadTotal,
    blockedReasons,
    executiveSummary: `Projected ${projectedLeadTotal}/${settings.dailyLeadTarget} daily leads using ${playbooks.length} priority playbooks. ${needsApproval} steps need approval.`,
    nextBestActions: [
      'Approve safe internal execution steps.',
      'Review all outbound Comms drafts before sending.',
      'Publish or manually post the highest-scoring Shorts/Reels first.',
      'Route hot replies into CRM within the same day.',
      'Kill weak hooks fast. Scale the winners like they owe you rent.',
    ],
  });
}

export function buildCampaignLaunchRun(playbookId: string, settings: CmoAutopilotSettings = getCmoAutopilotSettings()): CmoAutonomousRun {
  const playbook = getReadyPlaybooks().find((item) => item.id === playbookId);
  if (!playbook) {
    return createCmoRun({
      title: 'Campaign Launch Run Failed',
      runType: 'campaign_launch',
      status: 'failed',
      playbookIds: [playbookId],
      steps: [],
      leadTarget: settings.dailyLeadTarget,
      projectedLeadTotal: 0,
      blockedReasons: ['Playbook not found or not ready.'],
      executiveSummary: 'No ready playbook was found for this campaign launch.',
      nextBestActions: ['Create or activate a playbook first.'],
    });
  }
  const steps = applyApprovalPolicy(playbook.automationSteps, settings);
  return createCmoRun({
    title: `Launch: ${playbook.name}`,
    runType: 'campaign_launch',
    status: steps.some((step) => step.status === 'needs_approval') ? 'needs_approval' : 'ready',
    playbookIds: [playbook.id],
    steps,
    leadTarget: playbook.leadTargetPerDay,
    projectedLeadTotal: playbook.leadTargetPerDay,
    blockedReasons: steps.filter((step) => step.status === 'blocked').flatMap((step) => step.notes),
    executiveSummary: `${playbook.name} is staged with ${steps.length} execution steps and a ${playbook.leadTargetPerDay}/day lead target.`,
    nextBestActions: ['Approve assets.', 'Build Comms drafts.', 'Create media assets.', 'Schedule distribution.', 'Monitor replies.'],
  });
}
