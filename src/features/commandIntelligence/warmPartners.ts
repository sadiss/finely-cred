import { listPartnersLocal } from '../../data/partnersRepo';
import type { Partner, PartnerJourneyStage } from '../../domain/partners';

const NEXT_BY_STAGE: Record<PartnerJourneyStage, string> = {
  intake: 'Finish onboarding details on the partner file.',
  report_upload: 'Ask for the credit report upload. Do not invent a score.',
  analysis: 'Review the uploaded report before drafting letters.',
  evidence: 'Collect the missing exhibit listed on the file.',
  letters: 'Draft the next letter and wait for approval.',
  mailing: 'Confirm the mail log before another round.',
  funding: 'Open the business-credit journey and check fundability docs.',
  complete: 'Schedule the maintenance check-in.',
};

export type WarmPartnerRow = {
  id: string;
  name: string;
  email: string;
  lane: string;
  stage: string;
  next: string;
  updatedAt: string;
};

export function warmPartnerRows(limit = 6): WarmPartnerRow[] {
  const partners = listPartnersLocal()
    .filter((partner) => partner.status !== 'paused')
    .slice()
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return partners.slice(0, limit).map(toRow);
}

export function findPartnerByName(query: string): Partner | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  const partners = listPartnersLocal();
  return (
    partners.find((partner) => partner.profile.fullName.toLowerCase() === needle) ||
    partners.find((partner) => partner.profile.fullName.toLowerCase().includes(needle)) ||
    null
  );
}

export function nextActionFor(partner: Partner): string {
  if (partner.journeyStage && NEXT_BY_STAGE[partner.journeyStage]) return NEXT_BY_STAGE[partner.journeyStage];
  if (!partner.profile.email) return 'Add an email before any partner message.';
  return 'Open the partner file and confirm the current stage. No score is inferred.';
}

function toRow(partner: Partner): WarmPartnerRow {
  return {
    id: partner.id,
    name: partner.profile.fullName || 'Unnamed partner',
    email: partner.profile.email || '',
    lane: (partner.lane || partner.primaryRoute || 'unset').replace(/_/g, ' '),
    stage: (partner.journeyStage || 'unset').replace(/_/g, ' '),
    next: nextActionFor(partner),
    updatedAt: partner.updatedAt,
  };
}
