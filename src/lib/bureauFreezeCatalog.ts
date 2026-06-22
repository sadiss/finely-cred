/** Official freeze, opt-out, and specialty consumer-report links. */
export type BureauResourceLink = {
  label: string;
  href: string;
  group: 'credit_bureau' | 'specialty' | 'banking' | 'privacy' | 'identity';
  note?: string;
};

export const BUREAU_FREEZE_LINKS: BureauResourceLink[] = [
  { label: 'Equifax — security freeze', href: 'https://www.equifax.com/personal/credit-report-services/credit-freeze/', group: 'credit_bureau' },
  { label: 'Experian — security freeze', href: 'https://www.experian.com/freeze/center.html', group: 'credit_bureau' },
  { label: 'TransUnion — security freeze', href: 'https://www.transunion.com/credit-freeze', group: 'credit_bureau' },
  { label: 'Innovis — security freeze', href: 'https://www.innovis.com/personal/securityFreeze', group: 'specialty' },
  { label: 'SageStream (LexisNexis Risk) — freeze/opt-out', href: 'https://consumer.risk.lexisnexis.com/freeze', group: 'specialty', note: 'Formerly SageStream; used by some lenders.' },
  { label: 'NCTUE (telecom/utility) — freeze', href: 'https://www.nctue.com/Consumers', group: 'specialty' },
  { label: 'ChexSystems — security freeze', href: 'https://www.chexsystems.com/security-freeze', group: 'banking' },
  { label: 'Early Warning Services (EWS)', href: 'https://www.earlywarning.com/consumer-information', group: 'banking' },
  { label: 'CoreLogic Credco — freeze request info', href: 'https://www.corelogic.com/solutions/credco', group: 'specialty', note: 'Mortgage tri-merge data provider — contact for freeze procedures.' },
  { label: 'LexisNexis — full file disclosure / opt-out', href: 'https://optout.lexisnexis.com/', group: 'privacy' },
  { label: 'Annual Credit Report (free)', href: 'https://www.annualcreditreport.com/', group: 'privacy' },
  { label: 'FTC Identity Theft Report', href: 'https://www.identitytheft.gov/', group: 'identity' },
  { label: 'OptOutPrescreen.com (prescreen opt-out)', href: 'https://www.optoutprescreen.com/', group: 'privacy' },
];

export function bureauLinksByGroup(group: BureauResourceLink['group']) {
  return BUREAU_FREEZE_LINKS.filter((l) => l.group === group);
}
