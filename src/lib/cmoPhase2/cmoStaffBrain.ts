import { newId } from '../../utils/ids';
import { callAiGateway } from '../aiClient';
import type { CmoDirective, CmoObjective } from '../../domain/cmoPhase2';
import { cmoNowIso } from '../../domain/cmoPhase2';
import { cmoSummary, getCmoSettings, listCmoCampaigns, listCmoDirectives, upsertCmoDirective } from '../../data/cmoPhase2Repo';
import { buildDefaultPlaybooks, runSafeCmoPlaybook } from './cmoExecutionBridge';
import { recommendChannels } from './cmoLearningEngine';
import { buildExecutionAwareSystemPrompt, planGrowthExecution } from '../growth/growthExecutionEngine';

type StaffReply = {
  text: string;
  directive?: CmoDirective;
  actions: Array<{ label: string; kind: string; status: string }>;
};

function systemPrompt() {
  const settings = getCmoSettings();
  return `${buildExecutionAwareSystemPrompt('cmo')} Daily lead target: ${settings.dailyLeadTarget}. Humor: ${settings.humorLevel}/10.`;
}

function fallbackReply(message: string): StaffReply {
  const lower = message.toLowerCase();
  const summary = cmoSummary();
  const channels = recommendChannels({ limit: 5 });
  const wantsLeads = /\b(lead|200|growth|scale|follower|followers|traffic)\b/.test(lower);
  const wantsPress = /\b(press|interview|podcast|authority|media)\b/.test(lower);
  const wantsCampaign = /\b(campaign|launch|promote|product|course|book)\b/.test(lower);
  const wantsAutomation = /\b(auto|automate|hands off|without me|execute|run it)\b/.test(lower);

  const title = wantsPress
    ? 'Authority + interview campaign recommended'
    : wantsLeads
      ? '200-lead operating loop recommended'
      : wantsCampaign
        ? 'Campaign buildout recommended'
        : 'CMO growth directive';
  const body = wantsAutomation
    ? 'I can stage the campaign, assets, Comms drafts, Media project, schedule queue, and follow-up tasks. I will not auto-publish or spam. I am a CMO, not a raccoon with API keys.'
    : 'I recommend staging the next growth action, scoring it, and routing it through approval before external publishing.';
  const directive: CmoDirective = {
    id: newId('cmodir'),
    createdAt: cmoNowIso(),
    updatedAt: cmoNowIso(),
    role: 'cmo_prime',
    title,
    body,
    priority: wantsLeads ? 'urgent' : 'high',
    status: 'needs_review',
    actions: [
      { id: newId('cmoact'), label: 'Build Lead Intel audience snapshot', kind: 'route_leads', status: 'needs_review' },
      { id: newId('cmoact'), label: 'Create campaign and starter assets', kind: 'create_campaign', status: 'needs_review' },
      { id: newId('cmoact'), label: 'Push approved drafts to Comms/Media/Scheduler', kind: 'create_comms', status: 'needs_review' },
    ],
    meta: { summary, recommendedChannels: channels },
  };
  upsertCmoDirective(directive);
  const punchline = wantsLeads
    ? 'To reach 200 leads/day, we need daily channel quotas, lead magnets, creator cadence, affiliate amplification, and ruthless follow-up. Not vibes. Vibes do not book calls.'
    : 'The next move is to turn ideas into staged assets, then push only approved work into execution.';
  return { text: `${punchline}\n\nCurrent CMO state: ${summary.activeCampaigns} active campaigns, ${summary.scheduled} scheduled/approved posts, ${summary.pendingDirectives} pending directives. Strongest channel candidates: ${channels.map((c) => c.channel).join(', ')}.`, directive, actions: directive.actions.map((a) => ({ label: a.label, kind: a.kind, status: a.status })) };
}

export async function askCmoPrime(message: string): Promise<StaffReply> {
  const trimmed = message.trim();
  if (!trimmed) return fallbackReply('What should we do next?');
  try {
    const settings = getCmoSettings();
    const summary = cmoSummary();
    const campaigns = listCmoCampaigns().slice(0, 5).map((c) => ({ title: c.title, objective: c.objective, status: c.status, score150: c.score150 }));
    const directives = listCmoDirectives(5).map((d) => ({ title: d.title, priority: d.priority, status: d.status }));
    const response = await callAiGateway({
      taskType: 'cmo.staff.reply.phase2',
      responseFormat: 'json',
      messages: [
        { role: 'system', content: systemPrompt() },
        {
          role: 'user',
          content: JSON.stringify({
            message: trimmed,
            settings,
            summary,
            recentCampaigns: campaigns,
            pendingDirectives: directives,
            requiredOutput: {
              text: 'staff-style response: answer + what you will execute now vs delegate vs needs approval',
              directiveTitle: 'optional directive title',
              priority: 'low|normal|high|urgent',
              actions: ['executable action labels — swarm, playbook, comms, geo'],
              executionPlan: planGrowthExecution(trimmed, 'cmo').map((s) => ({ delegate: s.delegate, action: s.action, label: s.label })),
            },
          }),
        },
      ],
      context: { source: 'cmo_phase2_staff_room' },
    });
    const raw = JSON.parse(response.text || '{}') as any;
    const directive: CmoDirective | undefined = raw.directiveTitle
      ? upsertCmoDirective({
          id: newId('cmodir'),
          createdAt: cmoNowIso(),
          updatedAt: cmoNowIso(),
          role: 'cmo_prime',
          title: String(raw.directiveTitle || 'CMO directive'),
          body: String(raw.text || ''),
          priority: ['low', 'normal', 'high', 'urgent'].includes(raw.priority) ? raw.priority : 'high',
          status: 'needs_review',
          actions: Array.isArray(raw.actions)
            ? raw.actions.slice(0, 8).map((label: any) => ({ id: newId('cmoact'), label: String(label), kind: 'manual', status: 'needs_review' }))
            : [],
          meta: { source: 'ai_gateway', provider: response.provider, model: response.model },
        })
      : undefined;
    return { text: String(raw.text || response.text || '').trim() || fallbackReply(trimmed).text, directive, actions: directive?.actions.map((a) => ({ label: a.label, kind: a.kind, status: a.status })) ?? [] };
  } catch {
    return fallbackReply(trimmed);
  }
}

export function launchCmoPlaybookByIntent(message: string, args?: { offer?: string }) {
  const lower = message.toLowerCase();
  const objective: CmoObjective = /\b(press|interview|podcast|authority)\b/.test(lower)
    ? 'get_interviews'
    : /\b(product|course|book|promotion|launch)\b/.test(lower)
      ? 'sell_course_or_book'
      : 'generate_leads';
  const playbook = buildDefaultPlaybooks().find((p) => p.objective === objective) ?? buildDefaultPlaybooks()[0]!;
  return runSafeCmoPlaybook({ playbookId: playbook.id, offer: args?.offer });
}
