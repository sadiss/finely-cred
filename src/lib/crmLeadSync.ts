import type { LeadCapture } from '../domain/leads';
import { createProspect, listProspects } from '../data/crmProspectsRepo';
import { addLeadTags, setLeadStage } from '../data/leadOpsRepo';
import { scoreLead, leadOpsStageForLead } from './leadScoring';
import { isCreditSpecialistLeadOffer } from './leadOfferLabels';

export function isSessionBookedLeadOffer(offer: LeadCapture['offer']): boolean {
  return offer === 'enlightenment_session';
}

/** Growth / Results scoreboard — inbound lead card stage `booked` after strategy-call request. */
export function syncInboundLeadSessionBooked(lead: LeadCapture, funnelId?: string) {
  if (!lead.id) return;
  setLeadStage(lead.id, 'booked');
  addLeadTags(lead.id, [
    'session:booked',
    'offer:enlightenment_session',
    ...(funnelId ? [`funnel:${funnelId}`] : []),
    ...(lead.funnelPath ? [`path:${lead.funnelPath}`] : []),
  ]);
}

function normEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Sync inbound lead capture into CRM prospects for Leads OS / intel workflows. */
export function syncLeadToCrmProspect(lead: LeadCapture, funnelId?: string) {
  const email = normEmail(lead.email || '');
  if (!email) return null;

  const existing = listProspects().find((p) => (p.contact.emails ?? []).some((e) => normEmail(e) === email));

  const scored = scoreLead(lead);
  if (isSessionBookedLeadOffer(lead.offer)) {
    syncInboundLeadSessionBooked(lead, funnelId);
  } else {
    setLeadStage(lead.id, leadOpsStageForLead(lead));
  }

  if (existing) return existing;
  const coldNoOutreach =
    !lead.consentToContact &&
    !lead.consentEmailMarketing &&
    (lead.source === 'haitian_csv_import' || lead.source === 'directory_cold_import');
  const target =
    lead.offer === 'affiliate_application'
      ? 'affiliates'
      : isCreditSpecialistLeadOffer(lead.offer)
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
    ...(lead.offer ? [`offer:${lead.offer}`] : []),
    ...(isCreditSpecialistLeadOffer(lead.offer) ? ['credit-specialist'] : []),
    ...(lead.offer === 'financing_preapproval' ? ['financing-preapproval', 'in-house-financing'] : []),
    ...(lead.source === 'haitian_csv_import'
      ? ['haitian-community', 'cold', 'audience:haitian_community', 'source:haitian_csv_import', 'no-outreach']
      : lead.source === 'directory_cold_import'
        ? [
            'temperature:cold',
            'no-outreach',
            'source:directory_cold_import',
            ...(/haitian|krey[oò]l/i.test(`${lead.interest ?? ''} ${lead.funnelPath ?? ''}`)
              ? ['haitian-community', 'cold']
              : []),
          ]
        : lead.offer === 'haitian_credit_kit' ||
            lead.funnelId === 'kreyol_companion' ||
            /haitian|krey[oò]l/i.test(lead.interest ?? '')
          ? ['haitian-community']
          : []),
  ];

  return createProspect({
    target,
    source: 'lead_capture',
    score: scored.score,
    autoEnroll: !coldNoOutreach,
    tags,
    contact: {
      name: lead.fullName,
      emails: [lead.email],
      phones: lead.phone ? [lead.phone] : [],
    },
    company: {
      name: lead.source === 'directory_cold_import' ? lead.fullName : undefined,
      website: lead.source === 'directory_cold_import' ? lead.promoAsset : undefined,
      location: lead.source === 'directory_cold_import' ? lead.utmContent : undefined,
      description: lead.interest ?? lead.offer,
    },
  });
}
