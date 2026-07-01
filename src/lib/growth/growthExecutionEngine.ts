import { newId } from '../../utils/ids';
import { buildDefaultPlaybooks, executeApprovedCampaignBuildout, runSafeCmoPlaybook } from '../cmoPhase2/cmoExecutionBridge';
import { launchCmoPlaybookByIntent } from '../cmoPhase2/cmoStaffBrain';
import { listCmoCampaigns, upsertCmoDirective } from '../../data/cmoPhase2Repo';
import { cmoNowIso } from '../../domain/cmoPhase2';
import { enqueueLeadIntelSwarm, isSwarmEnabled, setSwarmEnabled } from '../../features/overnight50/leadIntelSwarmRepo';
import { DEFAULT_OVERNIGHT50_CITIES } from '../../features/overnight50/queryExpander';
import type { OvernightCity } from '../../features/overnight50/types';

export type GrowthDelegate =
  | 'cmo_prime'
  | 'night_owl_intel'
  | 'geo_commander'
  | 'nurture_concierge'
  | 'content_director'
  | 'compliance_officer';

export type GrowthActionKind =
  | 'start_deep_swarm'
  | 'stage_playbook'
  | 'create_campaign'
  | 'geo_scan'
  | 'queue_comms'
  | 'morning_brief'
  | 'import_hot_leads'
  | 'pause_external';

export type GrowthExecutionStep = {
  id: string;
  label: string;
  delegate: GrowthDelegate;
  action: GrowthActionKind;
  status: 'pending' | 'running' | 'done' | 'blocked' | 'needs_approval';
  result?: string;
};

const DELEGATE_LABEL: Record<GrowthDelegate, string> = {
  cmo_prime: 'CMO Prime',
  night_owl_intel: 'Night Owl Intel',
  geo_commander: 'Geo Commander',
  nurture_concierge: 'Nurture Concierge',
  content_director: 'Content Director',
  compliance_officer: 'Compliance Officer',
};

export function delegateLabel(d: GrowthDelegate) {
  return DELEGATE_LABEL[d];
}

/** Rule-based plan — always ready even if AI is offline. */
export function planGrowthExecution(message: string, surface: 'cmo' | 'lead_intel' = 'cmo'): GrowthExecutionStep[] {
  const lower = message.toLowerCase();
  const steps: GrowthExecutionStep[] = [];

  const add = (label: string, delegate: GrowthDelegate, action: GrowthActionKind, status: GrowthExecutionStep['status'] = 'pending') => {
    steps.push({ id: newId('gstep'), label, delegate, action, status });
  };

  if (/\b(swarm|scrape|scraper|discover|prospect|intel|search everywhere|all day|overnight)\b/.test(lower)) {
    add('Start deep Lead Intel swarm (multi-hour discovery)', 'night_owl_intel', 'start_deep_swarm');
    add('Rotate geo queries across priority cities', 'geo_commander', 'geo_scan');
  }

  if (/\b(lead|200|growth|scale|traffic|funnel|magnet)\b/.test(lower)) {
    add('Stage lead-generation playbook (campaign + assets)', 'cmo_prime', 'stage_playbook');
    add('Build Comms + Media drafts from playbook', 'content_director', 'queue_comms');
  }

  if (/\b(city|geo|dallas|houston|atlanta|phoenix|charlotte|local|hyperlocal)\b/.test(lower)) {
    add('Enqueue geo-targeted discovery jobs', 'geo_commander', 'geo_scan');
  }

  if (/\b(email|sms|nurture|sequence|follow.?up|revival)\b/.test(lower)) {
    add('Queue nurture / revival handoff (approval-first)', 'nurture_concierge', 'queue_comms', 'needs_approval');
  }

  if (/\b(import|crm|hot|qualified)\b/.test(lower) || surface === 'lead_intel') {
    add('Score + route hot prospects to CRM import queue', 'night_owl_intel', 'import_hot_leads');
  }

  if (/\b(compliance|safe|approval|block|risk)\b/.test(lower)) {
    add('Verify external publish remains approval-gated', 'compliance_officer', 'pause_external', 'done');
  }

  if (/\b(execute|run it|do it|automate|hands?.off|make it happen)\b/.test(lower) && steps.length === 0) {
    add('Start deep Lead Intel swarm', 'night_owl_intel', 'start_deep_swarm');
    add('Stage default growth playbook', 'cmo_prime', 'stage_playbook');
  }

  if (steps.length === 0) {
    add('Stage recommended growth playbook from your question', 'cmo_prime', 'stage_playbook');
    add('Start background intel discovery', 'night_owl_intel', 'start_deep_swarm');
  }

  return steps.slice(0, 6);
}

export async function runGrowthExecutionStep(step: GrowthExecutionStep, context?: { message?: string; cities?: OvernightCity[] }): Promise<GrowthExecutionStep> {
  const next = { ...step, status: 'running' as const };
  try {
    switch (step.action) {
      case 'start_deep_swarm': {
        if (!isSwarmEnabled()) setSwarmEnabled(true);
        const jobs = await enqueueLeadIntelSwarm({
          cities: context?.cities ?? [...DEFAULT_OVERNIGHT50_CITIES],
          limit: 720,
          remote: true,
          deep: true,
        });
        return { ...next, status: 'done', result: `Deep swarm queued ${jobs.length} jobs. Discovery runs for hours — check Live feed.` };
      }
      case 'geo_scan': {
        const jobs = await enqueueLeadIntelSwarm({
          cities: context?.cities ?? [...DEFAULT_OVERNIGHT50_CITIES],
          limit: 240,
          remote: true,
          deep: true,
        });
        return { ...next, status: 'done', result: `Geo Commander queued ${jobs.length} city-scoped scans.` };
      }
      case 'stage_playbook': {
        const out = launchCmoPlaybookByIntent(context?.message || 'generate leads');
        return { ...next, status: 'done', result: `Playbook staged: ${out.directive.title}. Campaign: ${out.campaign?.title ?? 'created'}.` };
      }
      case 'create_campaign': {
        const playbook = buildDefaultPlaybooks()[0]!;
        const out = runSafeCmoPlaybook({ playbookId: playbook.id });
        if (!out.campaign) return { ...next, status: 'blocked', result: 'Campaign staging failed.' };
        return { ...next, status: 'done', result: `Campaign staged: ${out.campaign.title}. Assets: ${out.assets.length}.` };
      }
      case 'queue_comms': {
        const campaign = listCmoCampaigns().find((c) => c.status === 'draft' || c.status === 'active');
        if (!campaign) {
          const staged = runSafeCmoPlaybook({ playbookId: buildDefaultPlaybooks()[0]!.id });
          if (!staged.campaign) return { ...next, status: 'blocked', result: 'No campaign to build out.' };
          const built = executeApprovedCampaignBuildout(staged.campaign.id);
          return { ...next, status: 'done', result: `Created campaign + Comms templates (${built.comms.templateIds.length}) + scheduler queue.` };
        }
        const built = executeApprovedCampaignBuildout(campaign.id);
        return { ...next, status: 'done', result: `Comms/Media queue updated. Templates: ${built.comms.templateIds.length}, scheduled: ${built.scheduledPostIds.length}.` };
      }
      case 'import_hot_leads':
        return { ...next, status: 'needs_approval', result: 'Hot lead import requires admin to confirm selection in Lead Intel staging board.' };
      case 'pause_external':
        return { ...next, status: 'done', result: 'External publish/send remains approval-first. No rogue auto-posting.' };
      case 'morning_brief':
        upsertCmoDirective({
          id: newId('cmodir'),
          createdAt: cmoNowIso(),
          updatedAt: cmoNowIso(),
          role: 'cmo_prime',
          title: 'Morning growth brief',
          body: 'Review Overnight50 ledger, swarm stats, and top channel movers.',
          priority: 'high',
          status: 'needs_review',
          actions: [],
          meta: { source: 'growth_execution_engine' },
        });
        return { ...next, status: 'done', result: 'Morning brief directive created in CMO queue.' };
      default:
        return { ...next, status: 'blocked', result: 'Unknown action.' };
    }
  } catch (e: unknown) {
    return { ...next, status: 'blocked', result: (e as Error)?.message || 'Execution failed.' };
  }
}

export async function runAllSafeGrowthSteps(message: string, surface: 'cmo' | 'lead_intel' = 'cmo') {
  const planned = planGrowthExecution(message, surface);
  const results: GrowthExecutionStep[] = [];
  for (const step of planned) {
    if (step.status === 'needs_approval') {
      results.push(step);
      continue;
    }
    results.push(await runGrowthExecutionStep(step, { message }));
  }
  const done = results.filter((r) => r.status === 'done').length;
  const summary = results.map((r) => `• ${delegateLabel(r.delegate)}: ${r.label} — ${r.status}${r.result ? ` (${r.result})` : ''}`).join('\n');
  return { steps: results, done, summary };
}

export function buildExecutionAwareSystemPrompt(surface: 'cmo' | 'lead_intel') {
  const capabilities = [
    'Start deep Lead Intel swarm (hours-long multi-source discovery)',
    'Enqueue geo scans for Dallas, Houston, Atlanta, Phoenix, Charlotte',
    'Stage CMO playbooks → campaigns → Comms/Media/scheduler drafts',
    'Delegate to Night Owl Intel, Geo Commander, Nurture Concierge, Content Director, Compliance Officer',
    'Score and route hot prospects (import needs admin confirm)',
    'Never auto-publish external or send without approval when risk is medium+',
  ];
  return `You are Finely Cred ${surface === 'cmo' ? 'CMO Prime' : 'Lead Intelligence Director'}. You ALREADY KNOW the full execution playbook. When asked a question:
1) Answer directly with strategy
2) List what you will execute now vs what needs approval
3) Name which delegate owns each step
You can execute internally: swarm, playbooks, drafts, geo queues. You cannot bypass compliance.

Capabilities you control:
${capabilities.map((c) => `- ${c}`).join('\n')}

Tone: structured, disciplined, fun, energetic. No guaranteed credit outcomes.`;
}
