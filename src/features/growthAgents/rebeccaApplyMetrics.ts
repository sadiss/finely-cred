import type { LeadCapture } from '../../domain/leads';
import { listLeadCaptures } from '../../data/leadsRepo';
import { listNurtureEnrollments } from '../../lib/nurtureEngine';
import { isCreditSpecialistLeadOffer } from '../../lib/leadOfferLabels';

export const REBECCA_SPECIALIST_SEQUENCE_ID = 'seq_specialist_apply_funnel';

function withinDays(iso: string, days: number) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= days * 86400000;
}

/** Lead captures tied to specialist apply / guide funnels and tags. */
export function isSpecialistTaggedLead(lead: LeadCapture): boolean {
  if (isCreditSpecialistLeadOffer(lead.offer)) return true;
  const interest = (lead.interest ?? '').toLowerCase();
  const hay = [
    lead.utmCampaign,
    lead.promoAsset,
    lead.funnelId,
    lead.funnelPath,
    lead.utmContent,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return interest.includes('specialist') || hay.includes('specialist') || hay.includes('acq_specialist');
}

export type RebeccaApplyMetrics = {
  totalAllTime: number;
  applies7d: number;
  guides7d: number;
  emailOptIn7d: number;
  activeNurture: number;
  completedNurture: number;
  todaySentence: string;
};

export function buildRebeccaApplyMetrics(): RebeccaApplyMetrics {
  const specialistLeads = listLeadCaptures().filter(isSpecialistTaggedLead);
  const applies7d = specialistLeads.filter(
    (l) =>
      withinDays(l.createdAt, 7) &&
      (l.offer === 'credit_specialist_join' || l.offer === 'agent_application'),
  ).length;
  const guides7d = specialistLeads.filter(
    (l) => withinDays(l.createdAt, 7) && l.offer === 'credit_specialist_guide',
  ).length;
  const emailOptIn7d = specialistLeads.filter(
    (l) => withinDays(l.createdAt, 7) && l.consentEmailMarketing === true,
  ).length;

  const enrollments = listNurtureEnrollments(300).filter((e) => e.sequenceId === REBECCA_SPECIALIST_SEQUENCE_ID);
  const activeNurture = enrollments.filter((e) => e.status === 'active').length;
  const completedNurture = enrollments.filter((e) => e.status === 'completed').length;

  let todaySentence = 'Copy the specialist apply link — post where credit pros look for work.';
  if (activeNurture > 0 && applies7d === 0) {
    todaySentence = `${activeNurture} active nurture enrollment(s) — open Desk · Mail to confirm handoff.`;
  } else if (applies7d > 0) {
    todaySentence = `${applies7d} specialist apply(s) this week — review Mail nurture and follow up hot replies.`;
  } else if (guides7d > 0) {
    todaySentence = `${guides7d} guide download(s) — nudge apply funnel in Mail when Ready.`;
  }

  return {
    totalAllTime: specialistLeads.length,
    applies7d,
    guides7d,
    emailOptIn7d,
    activeNurture,
    completedNurture,
    todaySentence,
  };
}

/** Marketing Desk Mail deep link — specialist apply nurture sequence. */
export function rebeccaMailHandoffHref(): string {
  return `/admin/marketing?tab=desk&helper=mail&sequence=${REBECCA_SPECIALIST_SEQUENCE_ID}`;
}
