import { submitLeadCapture } from '../data/leadsRepo';
import { addLeadNote } from '../data/leadOpsRepo';
import { recordFunnelConversion, assignFunnelVariant } from '../data/funnelExperimentsRepo';
import { emitFunnelStepCompleted } from '../domain/platformEvents';
import type { LeadMagnetFunnelConfig } from '../domain/leadMagnetFunnels';
import type { LeadGoal } from '../domain/leads';
import { getLeadAttribution } from './leadAttribution';
import { saveAgentHandoff } from './agentHandoffBridge';
import { startLeadMagnetTrial } from './leadMagnetTrial';
import { findFreeGuideById } from '../resources/freeGuides';

export type LeadMagnetCaptureInput = {
  funnelConfig: LeadMagnetFunnelConfig;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  consentToContact: boolean;
  consentEmailMarketing: boolean;
  consentSmsMarketing: boolean;
};

export type LeadMagnetCaptureResult = {
  leadId: string;
  fullName: string;
  email: string;
  phone: string;
};

export function goalForFunnelConfig(config: LeadMagnetFunnelConfig): LeadGoal {
  if (config.id === 'debt') return 'debt';
  if (config.id === 'business' || config.id === 'agency') return 'business';
  if (config.id === 'tradeline') return 'tradelines';
  if (config.id === 'score_roadmap') return 'credit';
  return 'credit';
}

export async function submitLeadMagnetCapture(args: LeadMagnetCaptureInput): Promise<LeadMagnetCaptureResult> {
  const fullName = `${args.firstName.trim()} ${args.lastName.trim()}`.trim();
  const email = args.email.trim();
  const phone = args.phone.trim();
  const guide = findFreeGuideById(args.funnelConfig.guideId);
  const attr = getLeadAttribution();
  const abVariant = assignFunnelVariant(args.funnelConfig.funnelId);

  const result = await submitLeadCapture({
    source: 'lead_magnet',
    offer: args.funnelConfig.offer as any,
    interest: guide?.title ?? args.funnelConfig.metaTitle,
    fullName,
    email,
    phone,
    consentToContact: args.consentToContact,
    consentEmailMarketing: args.consentEmailMarketing,
    consentSmsMarketing: args.consentSmsMarketing,
    referralCode: attr?.referralCode,
    utmSource: attr?.utmSource,
    utmMedium: attr?.utmMedium,
    utmCampaign: attr?.utmCampaign,
    funnelPath: args.funnelConfig.path,
    guideId: args.funnelConfig.guideId,
    guideTitle: guide?.title,
    funnelId: args.funnelConfig.funnelId,
    goal: goalForFunnelConfig(args.funnelConfig),
    giveawayStack: args.funnelConfig.valueStack.map((v) => v.label),
  });

  saveAgentHandoff({
    personaId: args.funnelConfig.agentPersonaId,
    goal: args.funnelConfig.onboardingLane,
    leadId: result.lead.id,
    email,
    surface: 'lead_magnet',
  });
  startLeadMagnetTrial({ leadId: result.lead.id, email });
  emitFunnelStepCompleted({
    tenantId: 'finely_cred',
    funnelId: args.funnelConfig.funnelId,
    step: 'form_submitted',
    leadId: result.lead.id,
    payload: { guideId: args.funnelConfig.guideId, agentPersonaId: args.funnelConfig.agentPersonaId },
  });
  if (attr?.referralCode) {
    addLeadNote(result.lead.id, `Referral: ${attr.referralCode}`);
  }
  recordFunnelConversion(args.funnelConfig.funnelId, abVariant);

  return { leadId: result.lead.id, fullName, email, phone };
}
