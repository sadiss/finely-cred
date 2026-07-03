import type { CommsComposeHandoff } from './commsConversationHandoff';
import { resolveBankruptcyScenarioTemplates } from './bankruptcyCommsTemplateMap';
import { BANKRUPTCY_LIBERATION_SCENARIOS } from '../legal/bankruptcyLiberationPaths';
import { resolveStaffForBankruptcyScenario } from '../data/staffRoster';
import { staffMemberFullName } from '../domain/staffMember';

export function buildComposeHandoffFromBankruptcyScenario(args: {
  partnerId: string;
  scenarioId: string;
  threadId?: string;
  channel: 'email' | 'sms' | 'portal';
}): CommsComposeHandoff {
  const scenario = BANKRUPTCY_LIBERATION_SCENARIOS.find((s) => s.id === args.scenarioId);
  const bundle = resolveBankruptcyScenarioTemplates(args.scenarioId);
  const coach = resolveStaffForBankruptcyScenario(args.scenarioId);
  const coachName = coach ? staffMemberFullName(coach) : 'Bankruptcy specialist';
  const title = scenario?.title ?? args.scenarioId;
  const steps = scenario?.steps?.map((s, i) => `${i + 1}. ${s}`).join('\n') ?? '';

  const templateHints = [bundle.email, bundle.sms, 'tpl_bk_fresh_start_ch7', 'sms_bk_nurture'].filter(
    Boolean,
  ) as string[];

  const subject = args.channel === 'sms' ? '' : `Bankruptcy path — ${title}`;
  const body =
    args.channel === 'sms'
      ? `Finely Cred: Your "${title}" liberation guide is ready. Message ${coachName} in portal. STOP to opt out.`
      : `Hi {{firstName}},\n\nFollowing up on your <strong>${title}</strong> liberation path.\n\nYour dedicated coach: ${coachName}\n\nNext steps:\n${steps}\n\n---\n[Your message here]\n\nEducational only — not legal advice.\n\nRespectfully,\n{{staffOnDuty}}`;

  return {
    channel: args.channel,
    partnerId: args.partnerId,
    threadId: args.threadId ?? `bankruptcy-${args.scenarioId}`,
    subject,
    body,
    templateHints,
    staffRoleHint: 'bankruptcy_specialist',
    topic: 'debt_summons',
  };
}

export function commsStudioUrlFromBankruptcyHandoff(h: CommsComposeHandoff): string {
  const params = new URLSearchParams({
    room: 'compose',
    channel: h.channel,
    partnerId: h.partnerId,
  });
  if (h.threadId && !h.threadId.startsWith('bankruptcy-')) params.set('threadId', h.threadId);
  if (h.templateHints[0]) params.set('templateId', h.templateHints[0]);
  return `/admin/comms?${params.toString()}`;
}
