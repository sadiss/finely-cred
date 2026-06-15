/**
 * Co-owner Ruth — automations that execute real platform actions (not prompt-only).
 */

import { listTasks } from '../data/tasksRepo';
import { getPhoneOpsSnapshot, listMissedCalls } from '../data/phoneThreadsRepo';
import { buildPhoneQueueBriefing } from './phoneVoicemailOps';
import { summarizePhoneProductionForCoOwner } from './phoneProductionOps';
import { summarizeGoLiveForCoOwner } from './goLiveCommandOps';
import { summarizeLaunchWavesForCoOwner } from './launchWaveRegistry';
import { summarizeLaunchPlanClosureForCoOwner } from './launchPlanClosure';
import { summarizeProductionLaunchForCoOwner } from './productionLaunchOps';
import { summarizeEnvBootstrapForCoOwner } from './envBootstrapOps';
import { summarizeSeniorQaSignoffForCoOwner } from './seniorQaSignoffOps';
import { summarizeDeployGoLiveForCoOwner } from './deployGoLiveOps';
import { summarizeLaunchFinalReadinessForCoOwner } from './launchFinalReadinessOps';
import { summarizeLaunchHandoffForCoOwner } from './launchHandoffOps';
import { summarizeProductionGoLiveSequencerForCoOwner } from './productionGoLiveSequencer';
import { summarizeProductionOpsRunnerForCoOwner } from './productionOpsRunnerOps';
import { summarizeLaunchOsNavForCoOwner } from './launchOsNavOps';
import { summarizeLightThemeGoLiveForCoOwner } from './lightThemeGoLiveOps';
import { listOpenValidationClocks, summarizeValidationClocksForCoOwner } from './validationLetterEngine';
import { listDisputeOpsAttentionRows, summarizeDisputeOpsForCoOwner } from './disputeOpsSummary';
import { listRoleCoverageGaps, loadStaffRoster } from '../data/staffRoster';
import { AGENT_PERSONAS } from '../domain/agentPersonas';
import { getCoOwnerStaffSnapshot } from './coOwnerStaffActions';
import { summarizeSocialAutopilotForCoOwner, processSocialAutopilotTick } from './socialAutopilotEngine';
import { autonomousHireAll, summarizeAutonomousHiringForCoOwner } from './coOwnerAutonomousHiring';
import { summarizeExecutiveStructureForCoOwner } from '../domain/coOwnerExecutiveStructure';
import { CO_OWNER_IDENTITY } from '../domain/coOwnerPersona';
import { buildCoOwnerSiteKnowledgeContext, summarizeSiteKnowledgeMapForCoOwner } from './coOwnerSiteKnowledgeMap';
import { summarizeDevStudioForCoOwner } from './coOwnerDevStudio';
import { buildOpsHealthSnapshot } from './opsHealthDashboard';
import { summarizeExecutionRegistryForCoOwner } from './coOwnerExecutionRegistry';
import { summarizeCoOwnerSuperhumanForCoOwner } from './coOwnerSuperhumanOps';

export type CoOwnerAutomationExecResult = {
  ok: boolean;
  message: string;
  prompt?: string;
  navigateTo?: string;
};

const PROMPTS: Record<string, string> = {
  daily_ops:
    'Run a 5× deep daily ops review. Environment is TESTING unless snapshot says otherwise — low CRM counts are expected QA, not business failure. Nine-lens synthesis: headline verdict, deep read, top 5 priorities with verify steps, people/automations, stewardship close.',
  launch_audit: 'Run a strict launch-readiness audit: identify what is missing, broken, inconsistent, or confusing. Give a punchlist ordered by impact.',
  nurture_health: 'Audit nurture sequences: dry-run vs live comms, welcome dedupe, and completion rates. List fixes.',
  phone_sla: 'Review phone queue SLA: missed calls, voicemail backlog, and agent callback tasks.',
  validation_clocks: 'List all open validation letter deadlines, FDCPA 30-day windows, and summons clocks requiring action.',
  billing_dunning: 'Review past-due partners, invoice dunning cadence, and billing blocks.',
  affiliate_residual: 'Check affiliate commission accrual, payout readiness, and compliance copy on promo links.',
  it_health: 'Run platform health check: typecheck, launch gates, Supabase sync, and critical UX regressions.',
  auto_hire_staff: 'Autonomous hiring complete — report C-suite and coverage gap fills executed on roster.',
  executive_org: 'Map the executive org: vacant hats, division coverage, and who Ruth should hire next.',
  suggest_hires: 'Legacy alias — run autonomous hiring for gaps and executives.',
  dispute_workflow: 'Walk the dispute workflow: reports → evidence → ID vault → factual reasons → letters → mail tasks.',
  route_comms: 'Review comms routing: which partner messages should go to team chat vs AI coach vs specialist.',
  social_content_ops: 'Audit social SOP autopilot: today\'s slots, compliance blocks, queued posts, and whether autoPublish is safe to enable.',
  course_build: 'Propose a new Training Academy module for our weakest role lane with lesson objectives and quiz.',
  co_ceo_brief: 'Deliver a 5× deep executive brief: nine-lens synthesis, 48h priorities, 2-week risks, people/automation moves. Testing-aware — never alarm on empty CRM.',
  dev_triage: 'Run dev triage: engineering priorities, launch gate failures, ops health status, UX regressions — ordered by impact.',
  site_map_scan: 'Scan the full site map: admin + portal + public surfaces, knowledge index, execution registry. Report gaps and top 5 wiring fixes.',
  code_studio: 'Open a Dev Studio session: propose site feature or external script with complete code via coowner-dev block. Purposeful, production-quality.',
  create_agent: 'Design a new specialist AI agent: system prompt, tone, channels, optional roster hire via coowner-dev block.',
  superhuman_sweep: 'Run superhuman automation sweep: validation clocks, phone SLA, social dry-run, autonomous hiring dry-run, ops health — summarize all in one brief.',
};

function withSnapshot(prefix: string, prompt: string) {
  return `${prefix}\n\n---\n${prompt}`;
}

export function executeCoOwnerAutomationNow(executeKey: string): CoOwnerAutomationExecResult {
  switch (executeKey) {
    case 'validation_clocks': {
      const open = listOpenValidationClocks();
      const disputes = listDisputeOpsAttentionRows();
      const summary = [summarizeValidationClocksForCoOwner(), summarizeDisputeOpsForCoOwner()].join('\n\n');
      return {
        ok: true,
        message: open.length || disputes.length
          ? `Scanned ${open.length} validation clock(s) and ${disputes.length} dispute follow-up(s).`
          : 'No urgent validation clocks or dispute follow-ups — all clear.',
        navigateTo: open.length || disputes.length ? '/admin/workflow' : '/portal/debt',
        prompt: withSnapshot(summary, PROMPTS.validation_clocks),
      };
    }
    case 'phone_sla': {
      const snap = getPhoneOpsSnapshot();
      const missed = listMissedCalls();
      const prefix = [
        summarizePhoneProductionForCoOwner(),
        buildPhoneQueueBriefing(
          missed.map((c) => ({ from: c.from, status: c.status, transcription: c.transcription })),
        ),
      ].join('\n\n');
      return {
        ok: true,
        message: snap.missedCalls ? `${snap.missedCalls} missed call(s) need callback.` : 'Phone queue clear.',
        navigateTo: '/admin/phone-hub',
        prompt: withSnapshot(prefix, PROMPTS.phone_sla),
      };
    }
    case 'dispute_workflow':
      return {
        ok: true,
        message: 'Opening Letter Studio dispute rail.',
        navigateTo: '/portal/letters?tab=dispute',
        prompt: PROMPTS.dispute_workflow,
      };
    case 'suggest_hires':
    case 'auto_hire_staff': {
      const run = autonomousHireAll({ executiveMax: 3, gapMax: 3 });
      const prefix = [summarizeAutonomousHiringForCoOwner(), summarizeExecutiveStructureForCoOwner(), run.summary].join('\n\n');
      const details = [...run.executives, ...run.gaps].map((r) => r.message).join(' · ');
      return {
        ok: true,
        message: run.summary,
        navigateTo: '/admin/ops-agent?tab=staff',
        prompt: withSnapshot(`${prefix}\n\n${details}`, PROMPTS.auto_hire_staff),
      };
    }
    case 'executive_org':
      return {
        ok: true,
        message: `${CO_OWNER_IDENTITY.name} executive org snapshot ready.`,
        navigateTo: '/admin/ops-agent',
        prompt: withSnapshot(summarizeExecutiveStructureForCoOwner(), PROMPTS.executive_org),
      };
    case 'billing_dunning':
      return {
        ok: true,
        message: 'Opening billing ops.',
        navigateTo: '/admin/billing',
        prompt: PROMPTS.billing_dunning,
      };
    case 'it_health':
      return {
        ok: true,
        message: 'Opening launch checklist for platform health.',
        navigateTo: '/admin/launch-os#go-live',
        prompt: withSnapshot(
          [
            summarizeGoLiveForCoOwner(),
            summarizeLaunchWavesForCoOwner(),
            summarizeLaunchPlanClosureForCoOwner(),
            summarizeProductionLaunchForCoOwner(),
            summarizeEnvBootstrapForCoOwner(),
            summarizeSeniorQaSignoffForCoOwner(),
            summarizeDeployGoLiveForCoOwner(),
            summarizeLaunchFinalReadinessForCoOwner(),
            summarizeLaunchHandoffForCoOwner(),
            summarizeProductionGoLiveSequencerForCoOwner(),
            summarizeProductionOpsRunnerForCoOwner(),
            summarizeLaunchOsNavForCoOwner(),
            summarizeLightThemeGoLiveForCoOwner(),
            summarizeSocialAutopilotForCoOwner(),
            summarizeExecutiveStructureForCoOwner(),
            summarizeAutonomousHiringForCoOwner(),
          ].join('\n\n'),
          PROMPTS.it_health,
        ),
      };
    case 'nurture_health':
      return {
        ok: true,
        message: 'Opening Comms Studio for nurture audit.',
        navigateTo: '/admin/comms-studio',
        prompt: PROMPTS.nurture_health,
      };
    case 'social_content_ops': {
      const preview = processSocialAutopilotTick({ dryRun: true, force: true });
      const summary = summarizeSocialAutopilotForCoOwner();
      return {
        ok: true,
        message: `Social autopilot dry-run — ${preview.generated} draft(s), ${preview.complianceBlocked} compliance block(s).`,
        navigateTo: '/admin/social-hub',
        prompt: withSnapshot(summary, PROMPTS.social_content_ops),
      };
    }
    case 'daily_ops': {
      const tasks = listTasks().filter((t) => t.status === 'pending' || t.status === 'in_progress');
      const staff = getCoOwnerStaffSnapshot();
      const prefix = [
        `Open tasks: ${tasks.length}`,
        `Active staff: ${staff.activeStaff}`,
        `Coverage gaps: ${staff.coverageGaps.length}`,
      ].join(' · ');
      return {
        ok: true,
        message: 'Daily ops snapshot ready.',
        navigateTo: '/admin/workflow',
        prompt: withSnapshot(prefix, PROMPTS.daily_ops),
      };
    }
    case 'launch_audit':
      return {
        ok: true,
        message: 'Launch audit queued — go-live command center.',
        navigateTo: '/admin/launch-os#go-live',
        prompt: withSnapshot(
          [summarizeGoLiveForCoOwner(), summarizeLaunchWavesForCoOwner(), summarizeLaunchPlanClosureForCoOwner(), summarizeProductionLaunchForCoOwner(), summarizeEnvBootstrapForCoOwner(), summarizeSeniorQaSignoffForCoOwner(), summarizeDeployGoLiveForCoOwner(), summarizeLaunchFinalReadinessForCoOwner(), summarizeLaunchHandoffForCoOwner(), summarizeProductionGoLiveSequencerForCoOwner(), summarizeProductionOpsRunnerForCoOwner(), summarizeLaunchOsNavForCoOwner(), summarizeSocialAutopilotForCoOwner(), summarizeExecutiveStructureForCoOwner(), summarizeAutonomousHiringForCoOwner()].join('\n\n'),
          PROMPTS.launch_audit,
        ),
      };
    case 'dev_triage': {
      const health = buildOpsHealthSnapshot();
      const prefix = [
        `Ops health: ${health.status}`,
        `Automations: ${health.automationsEnabled}/${health.automationsTotal}`,
        `Support SLA breaches: ${health.supportSlaBreaches}`,
        summarizeDevStudioForCoOwner(),
      ].join('\n · ');
      return {
        ok: true,
        message: `Dev triage — platform ${health.status}.`,
        navigateTo: '/admin/monitoring',
        prompt: withSnapshot(
          [prefix, summarizeLaunchFinalReadinessForCoOwner(), summarizeProductionOpsRunnerForCoOwner()].join('\n\n'),
          PROMPTS.dev_triage,
        ),
      };
    }
    case 'site_map_scan':
      return {
        ok: true,
        message: 'Site map scan complete — full surface + knowledge index.',
        navigateTo: '/admin/ops-agent#dev-studio',
        prompt: withSnapshot(
          [summarizeSiteKnowledgeMapForCoOwner(), summarizeExecutionRegistryForCoOwner(), buildCoOwnerSiteKnowledgeContext('site map audit', '/admin/ops-agent')].join('\n\n'),
          PROMPTS.site_map_scan,
        ),
      };
    case 'code_studio':
      return {
        ok: true,
        message: 'Dev Studio session ready — Ruth can author code.',
        navigateTo: '/admin/ops-agent#dev-studio',
        prompt: withSnapshot(summarizeDevStudioForCoOwner(), PROMPTS.code_studio),
      };
    case 'create_agent':
      return {
        ok: true,
        message: 'Agent factory ready — design a specialist.',
        navigateTo: '/admin/ops-agent#dev-studio',
        prompt: withSnapshot(summarizeDevStudioForCoOwner(), PROMPTS.create_agent),
      };
    case 'superhuman_sweep': {
      const health = buildOpsHealthSnapshot();
      const clocks = listOpenValidationClocks();
      const missed = listMissedCalls().length;
      const social = summarizeSocialAutopilotForCoOwner();
      const hiring = summarizeAutonomousHiringForCoOwner();
      const prefix = [
        `Ops: ${health.status}`,
        `Validation clocks: ${clocks.length}`,
        `Missed calls: ${missed}`,
        hiring.split('\n')[0] ?? '',
      ].join(' · ');
      return {
        ok: true,
        message: `Superhuman sweep — ${health.status} · ${clocks.length} validation clock(s).`,
        navigateTo: '/admin/ops-agent',
        prompt: withSnapshot([prefix, social, summarizeCoOwnerSuperhumanForCoOwner()].join('\n\n'), PROMPTS.superhuman_sweep),
      };
    }
    default: {
      const prompt = PROMPTS[executeKey];
      if (!prompt) return { ok: false, message: `Unknown automation: ${executeKey}` };
      return { ok: true, message: `Queued: ${executeKey}`, prompt };
    }
  }
}
