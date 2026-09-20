import { VERTICAL_LABELS } from './icp.ts';
import { normText } from './normalize.ts';
import type { PartnerProspect, RawProspectCandidate } from './types.ts';

export function buildDraftStub(input: Pick<RawProspectCandidate, 'businessName' | 'personName' | 'city' | 'vertical'>): string {
  const name = normText(input.personName) || 'there';
  const biz = normText(input.businessName) || 'your desk';
  const city = normText(input.city) || 'South Florida';
  const label = VERTICAL_LABELS[input.vertical];

  return [
    `Hi ${name} —`,
    ``,
    `I’m reaching out from Finely Cred, a credit restore desk — not a lender, and restore ≠ debt gone.`,
    ``,
    `Two doors, both optional:`,
    `Door A — clients you already serve at ${biz} (${city} ${label}). When files are messy, restore work can sit beside your existing relationship. Restore ≠ debt gone.`,
    `Door B — you as an owner: business-credit / funding-readiness education. No loan or funding guarantees.`,
    ``,
    `Live Haitian / Kreyòl path: /haitian`,
    ``,
    `Draft only — not sent. Reply if a 15-minute intro is useful.`,
  ].join('\n');
}

export function attachDraftStub(prospect: PartnerProspect): PartnerProspect {
  if (prospect.draftStub) return prospect;
  return { ...prospect, draftStub: buildDraftStub(prospect) };
}
