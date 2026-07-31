import type { LeadCapture } from '../domain/leads';
import { createProspect, listProspects } from '../data/crmProspectsRepo';
import { setLeadStage } from '../data/leadOpsRepo';
import { scoreLead, leadOpsStageForLead } from './leadScoring';
import { isCreditSpecialistLeadOffer } from './leadOfferLabels';

function normEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Sync inbound lead capture into CRM prospects for Leads OS / intel workflows. */
export function syncLeadToCrmProspect(lead: LeadCapture, funnelId?: string) {
  const email = normEmail(lead.email || '');
  if (!email) return null;

  const existing = listProspects().find((p) => (p.contact.emails ?? []).some((e) => normEmail(e) === email));
  if (existing) return existing;

  const scored = scoreLead(lead);
  setLeadStage(lead.id, leadOpsStageForLead(lead));
  const target = isCreditSpecialistLeadOffer(lead.offer)
    ? 'agents'
    : scored.fit === 'business'
      ? 'b2b_partners'
      : 'clients';

  const tags = [
    'inbound',
    `fit:${scored.fit}`,
    ...(funnelId ? [`funnel:${funnelId}`] : []),
    ...(lead.funnelPath ? [`path:${lead.funnelPath}`] : []),
    ...(lead.source ? [`source:${lead.source}`] : []),
    ...(isCreditSpecialistLeadOffer(lead.offer) ? ['credit-specialist', `offer:${lead.offer}`] : []),
  ];

  return createProspect({
    target,
    source: 'lead_capture',
    score: scored.score,
    tags,
    contact: {
      name: lead.fullName,
      emails: [lead.email],
      phones: lead.phone ? [lead.phone] : [],
    },
    company: {
      description: lead.interest ?? lead.offer,
    },
  });
}
