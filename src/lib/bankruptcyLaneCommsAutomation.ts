import type { Partner } from '../domain/partners';
import { getCommsTemplate } from '../data/commsRepo';
import { ensureProfessionalCommsTemplatesOnce } from '../data/commsProfessionalTemplateSeed';
import {
  isDisputeRoundCommsLive,
  isBankruptcyLaneCommsAutoEnabled,
  loadCommsEmailProvidersConfig,
} from '../data/commsEmailProviderRepo';
import { isFeatureEnabled } from '../data/settingsRepo';
import { createThread } from '../data/supportRepo';
import { emitPlatformEvent } from '../domain/platformEvents';
import { sendEmailFromTemplate, sendSmsFromTemplate } from './commsEngine';
import { recordPartnerSuccessMilestone } from './partnerSuccessMilestones';
import { BANKRUPTCY_LIBERATION_SCENARIOS } from '../legal/bankruptcyLiberationPaths';
import { saveBankruptcyScenarioSelection } from '../data/bankruptcyLaneStateRepo';
import { resolveBankruptcyScenarioTemplates } from './bankruptcyCommsTemplateMap';

function resolveDryRun(): boolean {
  const cfg = loadCommsEmailProvidersConfig();
  if (!isFeatureEnabled('commsDelivery')) return true;
  if (!cfg.disputeRoundCommsLive && !isDisputeRoundCommsLive()) return true;
  return false;
}

export async function onBankruptcyScenarioSelected(args: {
  partner: Partner;
  scenarioId: string;
}): Promise<{ sent: number; threadId?: string }> {
  ensureProfessionalCommsTemplatesOnce();
  const scenario = BANKRUPTCY_LIBERATION_SCENARIOS.find((s) => s.id === args.scenarioId);
  const bundle = resolveBankruptcyScenarioTemplates(args.scenarioId);
  const dryRun = resolveDryRun();
  let sent = 0;

  if (!isBankruptcyLaneCommsAutoEnabled()) {
    saveBankruptcyScenarioSelection(args.partner.id, {
      scenarioId: args.scenarioId,
      scenarioTitle: scenario?.title,
    });
    recordPartnerSuccessMilestone(args.partner.id, 'ps_bankruptcy_milestone');
    return { sent: 0 };
  }

  emitPlatformEvent({
    type: 'automation.triggered',
    tenantId: 'finely_cred',
    partnerId: args.partner.id,
    entityType: 'bankruptcy_scenario',
    entityId: args.scenarioId,
    payload: {
      kind: 'bankruptcy_scenario_selected',
      scenarioId: args.scenarioId,
      title: scenario?.title,
    },
  });

  const { thread } = createThread({
    partnerId: args.partner.id,
    topic: 'debt_summons',
    subject: `Bankruptcy path — ${scenario?.title ?? args.scenarioId}`,
    initialMessage: {
      fromPartner: false,
      body:
        `You selected the "${scenario?.title ?? args.scenarioId}" liberation path. ` +
        `Your bankruptcy specialist will follow up here. Educational guidance only — not legal advice.\n\n` +
        (scenario?.steps?.map((s, i) => `${i + 1}. ${s}`).join('\n') ?? ''),
    },
  });

  const ctx = {
    scenarioId: args.scenarioId,
    scenarioTitle: scenario?.title ?? '',
    links: { portal: '/portal/bankruptcy', messages: '/portal/messages?hub=team' },
  };

  recordPartnerSuccessMilestone(args.partner.id, 'ps_bankruptcy_milestone');

  saveBankruptcyScenarioSelection(args.partner.id, {
    scenarioId: args.scenarioId,
    scenarioTitle: scenario?.title,
    threadId: thread.id,
  });

  for (const [channel, templateId] of Object.entries({ email: bundle.email, sms: bundle.sms })) {
    if (!templateId) continue;
    const tpl = getCommsTemplate(templateId);
    if (!tpl?.enabled) continue;
    try {
      const res =
        channel === 'email'
          ? await sendEmailFromTemplate({ template: tpl, partner: args.partner, ctx, dryRun })
          : await sendSmsFromTemplate({ template: tpl, partner: args.partner, ctx, dryRun });
      if (res.ok) sent += 1;
    } catch {
      /* continue */
    }
  }

  return { sent, threadId: thread.id };
}
