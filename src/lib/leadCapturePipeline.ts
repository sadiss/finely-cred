import type { LeadCapture } from '../domain/leads';
import { emitLeadMagnetDownload, emitLeadCreated } from '../domain/platformEvents';
import { resolveSequenceForLead } from '../domain/nurtureSequences';
import { enrollLeadInNurtureSequence } from './nurtureEngine';
import { sendImmediateWelcomeEmail } from './funnelEmail';
import { startLeadMagnetTrial } from './leadMagnetTrial';
import { syncLeadToCrmProspect } from './crmLeadSync';
import { recordAffiliateLeadAttribution } from './affiliateLeadAttribution';
import { recordReferralLeadCapture } from './referralGrowthEngine';
import { recordSecurityAudit } from './securityAuditBridge';
import { scoreLead } from './leadScoring';
import { emitPlatformEvent } from '../domain/platformEvents';
import { ensureNurtureCommsTemplatesOnce } from '../data/commsNurtureSeed';
import { getNurtureSequence } from '../domain/nurtureSequences';
import { buildFunnelDownloadUrl } from './funnelPublicLinks';
import { wireLeadToOvernight50 } from './overnight50Bridge';

export type LeadCapturePipelineArgs = {
  lead: LeadCapture;
  guideId?: string;
  guideTitle?: string;
  funnelId?: string;
};

/** Unified post-capture hook — nurture, welcome email, trial, platform events. */
export async function runLeadCapturePipeline(args: LeadCapturePipelineArgs): Promise<void> {
  const { lead } = args;
  const sequence = resolveSequenceForLead({
    funnelPath: lead.funnelPath,
    offer: lead.offer,
    interest: lead.interest,
    utmSource: lead.utmSource,
    utmMedium: lead.utmMedium,
  });

  const scored = scoreLead(lead);
  const sequenceId = scored.suggestedSequenceId || sequence.id;
  const enrolledSequence = getNurtureSequence(sequenceId) ?? sequence;
  const funnelId = args.funnelId ?? enrolledSequence.funnelId;

  ensureNurtureCommsTemplatesOnce();

  emitLeadCreated({
    tenantId: 'finely_cred',
    leadId: lead.id,
    funnelId,
    email: lead.email,
    payload: { goal: lead.goal, source: lead.source, offer: lead.offer },
  });

  recordSecurityAudit({
    action: 'lead.captured',
    actorType: 'system',
    entityType: 'lead',
    entityId: lead.id,
    meta: { email: lead.email, funnelId, source: lead.source },
  });

  emitLeadMagnetDownload({
    tenantId: 'finely_cred',
    leadId: lead.id,
    funnelId,
    guideId: args.guideId,
    email: lead.email,
  });

  try {
    syncLeadToCrmProspect(lead, funnelId);
  } catch {
    // non-blocking
  }

  emitPlatformEvent({
    type: 'automation.triggered',
    tenantId: 'finely_cred',
    leadId: lead.id,
    entityType: 'lead',
    entityId: lead.id,
    payload: {
      kind: 'lead_scored',
      score: scored.score,
      band: scored.band,
      fit: scored.fit,
      suggestedPersonaId: scored.suggestedPersonaId,
      suggestedSequenceId: scored.suggestedSequenceId,
      reasons: scored.reasons,
    },
  });

  await recordAffiliateLeadAttribution(lead);
  try {
    wireLeadToOvernight50(lead, { guideId: args.guideId, funnelId });
  } catch {
    // non-blocking
  }
  recordReferralLeadCapture({ referralCode: lead.referralCode, leadId: lead.id, funnelId });
  if (lead.referralCode) {
    void import('./referralRewardsEngine').then(({ processReferralReward }) =>
      processReferralReward({ referralCode: lead.referralCode!, amountCents: 0, eventType: 'lead' }),
    );
  }

  enrollLeadInNurtureSequence({
    leadId: lead.id,
    sequenceId,
    tenantId: 'finely_cred',
    context: {
      email: lead.email,
      fullName: lead.fullName,
      guideId: args.guideId,
      guideTitle: args.guideTitle,
      funnelPath: lead.funnelPath,
      personaId: enrolledSequence.agentPersonaId,
      immediateWelcomeSent: true,
    },
  });

  if (lead.email?.trim()) {
    startLeadMagnetTrial({ leadId: lead.id, email: lead.email.trim() });
  }

  await sendImmediateWelcomeEmail({
    lead,
    guideTitle: args.guideTitle,
    downloadUrl: lead.funnelPath ? buildFunnelDownloadUrl(lead.funnelPath) : undefined,
  });
}
