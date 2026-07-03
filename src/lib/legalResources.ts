/** Curated official links — coaches, escalations, and playbooks cite these directly. */

export type LegalResourceLink = {
  id: string;
  label: string;
  href: string;
  hint?: string;
  external?: boolean;
};

export const REGULATORY_PORTALS: LegalResourceLink[] = [
  { id: 'cfpb', label: 'CFPB complaint', href: 'https://www.consumerfinance.gov/complaint/', hint: 'Debt collection & credit reporting', external: true },
  { id: 'ftc', label: 'FTC Report Fraud', href: 'https://reportfraud.ftc.gov/', hint: 'Imposter / fraud collectors', external: true },
  { id: 'naag', label: 'Find your AG', href: 'https://www.naag.org/find-my-ag/', hint: 'State Attorney General', external: true },
  { id: 'bbb', label: 'BBB complaint', href: 'https://www.bbb.org/file-a-complaint', hint: 'Business complaints', external: true },
];

export const LAW_REFERENCES: LegalResourceLink[] = [
  { id: 'fdcpa-1692g', label: 'FDCPA § 1692g', href: 'https://www.law.cornell.edu/uscode/text/15/1692g', hint: 'Validation of debts', external: true },
  { id: 'fdcpa-1692e', label: 'FDCPA § 1692e', href: 'https://www.law.cornell.edu/uscode/text/15/1692e', hint: 'False/misleading representations', external: true },
  { id: 'fcra-611', label: 'FCRA § 611', href: 'https://www.law.cornell.edu/uscode/text/15/1681i', hint: 'Bureau reinvestigation', external: true },
  { id: 'fcra-623', label: 'FCRA § 623', href: 'https://www.law.cornell.edu/uscode/text/15/1681s-2', hint: 'Furnisher duties', external: true },
  { id: 'ucc-3-308', label: 'UCC § 3-308', href: 'https://www.law.cornell.edu/ucc/3/3-308', hint: 'Burden of proof on signature', external: true },
  { id: 'sec-edgar', label: 'SEC EDGAR', href: 'https://www.sec.gov/edgar/search/', hint: 'ABS / securitization filings', external: true },
];

export const PORTAL_WORKSPACE_LINKS: LegalResourceLink[] = [
  { id: 'debt', label: 'Debt Center', href: '/portal/debt', hint: 'Cases & strategy' },
  { id: 'letters', label: 'Letter Studio', href: '/portal/letters', hint: 'Bureau disputes' },
  { id: 'vault', label: 'Letters Vault', href: '/portal/letters/vault', hint: 'Saved PDFs' },
  { id: 'escalations', label: 'Escalations', href: '/portal/escalations', hint: 'CFPB / AG drafts' },
  { id: 'documents', label: 'Documents', href: '/portal/documents', hint: 'Summons & uploads' },
];

export function resourcesForCoach(mode: 'validation' | 'court' | 'foreclosure' | 'repossession'): LegalResourceLink[] {
  const internal = PORTAL_WORKSPACE_LINKS.filter((l) => ['debt', 'vault', 'escalations', 'documents'].includes(l.id));
  const laws =
    mode === 'validation'
      ? LAW_REFERENCES.filter((l) => ['fdcpa-1692g', 'fdcpa-1692e', 'fcra-623', 'ucc-3-308'].includes(l.id))
      : mode === 'foreclosure'
        ? [
            ...LAW_REFERENCES.filter((l) => ['fcra-611', 'fcra-623', 'ucc-3-308'].includes(l.id)),
            { id: 'respa-2605', label: 'RESPA § 2605', href: 'https://www.law.cornell.edu/uscode/text/12/2605', hint: 'Servicing & QWR', external: true },
          ]
        : mode === 'repossession'
          ? [
              ...LAW_REFERENCES.filter((l) => ['fdcpa-1692g', 'fcra-611', 'ucc-3-308'].includes(l.id)),
              { id: 'ucc-9-609', label: 'UCC § 9-609', href: 'https://www.law.cornell.edu/ucc/9/9-609', hint: 'Secured party possession', external: true },
              { id: 'ucc-9-615', label: 'UCC § 9-615', href: 'https://www.law.cornell.edu/ucc/9/9-615', hint: 'Deficiency & surplus', external: true },
            ]
          : LAW_REFERENCES.filter((l) => ['fdcpa-1692g', 'fdcpa-1692e', 'fcra-611', 'ucc-3-308', 'sec-edgar'].includes(l.id));
  const reg = REGULATORY_PORTALS.filter((l) => ['cfpb', 'naag', 'ftc'].includes(l.id));
  return [...internal, ...laws, ...reg];
}

export function resourcesForEscalations(): LegalResourceLink[] {
  return [...PORTAL_WORKSPACE_LINKS, ...REGULATORY_PORTALS, ...LAW_REFERENCES.filter((l) => l.id.startsWith('fdcpa') || l.id.startsWith('fcra'))];
}
