import type { LeadCapture } from '../domain/leads';
import { createProspect, listProspects, patchProspect } from '../data/crmProspectsRepo';
import { addLeadTags, getLeadOp, setLeadStage } from '../data/leadOpsRepo';
import { HAITIAN_COLD_TEMPERATURE_TAGS, HAITIAN_HOT_OPT_IN_TAGS } from './haitianLeadTags';
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
  const opTags = getLeadOp(lead.id).tags ?? [];
  const optedIn = opTags.includes('hot-opt-in') || opTags.includes('temperature:hot');
  if (isSessionBookedLeadOffer(lead.offer)) {
    syncInboundLeadSessionBooked(lead, funnelId);
  } else {
    setLeadStage(lead.id, leadOpsStageForLead(lead));
  }

  if (existing) {
    if (optedIn) {
      const drop = new Set<string>(HAITIAN_COLD_TEMPERATURE_TAGS);
      patchProspect(existing.id, {
        score: scored.score,
        tags: Array.from(
          new Set([
            ...(existing.tags ?? []).filter((t) => !drop.has(t)),
            ...HAITIAN_HOT_OPT_IN_TAGS,
            'haitian-community',
          ]),
        ),
      });
    }
    return existing;
  }
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
    ...(lead.offer ? [`offer:${lead.offer}`] : []),
    ...(isCreditSpecialistLeadOffer(lead.offer) ? ['credit-specialist'] : []),
    ...(lead.offer === 'financing_preapproval' ? ['financing-preapproval', 'in-house-financing'] : []),
    ...(lead.source === 'haitian_csv_import' && !optedIn
      ? ['haitian-community', 'cold', 'audience:haitian_community', 'source:haitian_csv_import', 'temperature:cold']
      : lead.offer === 'haitian_credit_kit' ||
          lead.funnelId === 'kreyol_companion' ||
          /haitian|krey[oò]l/i.test(lead.interest ?? '') ||
          optedIn
        ? ['haitian-community', ...(optedIn ? [...HAITIAN_HOT_OPT_IN_TAGS] : [])]
        : []),
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
