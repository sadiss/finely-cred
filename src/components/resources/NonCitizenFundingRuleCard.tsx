/** Renders one `NonCitizenFundingRule` entry — shared across C1's non-citizen/international articles. */
import React from 'react';
import type { NonCitizenFundingRule } from '../../data/internationalAndNonCitizenCreditRepo';
import { DoctrineAccordionCard, DoctrineFieldList, DoctrineProseBlock } from './DoctrineArticleParts';
import type { FinelyOsPublicAccent } from '../../features/os/finelyOsLightUi';

const LOAN_TYPE_LABELS: Record<NonCitizenFundingRule['loanType'], string> = {
  business_line_of_credit: 'Business line of credit',
  equipment_financing: 'Equipment financing',
  sba_7a: 'SBA 7(a) loan',
  merchant_cash_advance: 'Merchant cash advance',
  business_term_loan: 'Business term loan',
  commercial_real_estate: 'Commercial real estate',
};

export function NonCitizenFundingRuleCard({
  rule,
  accent = 'violet',
  defaultOpen = false,
}: {
  rule: NonCitizenFundingRule;
  accent?: FinelyOsPublicAccent;
  defaultOpen?: boolean;
}) {
  const chips = [
    LOAN_TYPE_LABELS[rule.loanType],
    rule.ssnRequired ? 'SSN required' : 'No SSN required',
    rule.itinAccepted ? 'ITIN accepted' : 'ITIN not accepted',
  ];
  return (
    <DoctrineAccordionCard accent={accent} title={LOAN_TYPE_LABELS[rule.loanType]} chips={chips} defaultOpen={defaultOpen}>
      <DoctrineFieldList label="Key requirements" items={rule.keyRequirements} />
      <DoctrineProseBlock label="How lenders actually view this (realistic underwriting optics)" text={rule.lenderUnderwritingOptics} />
      <DoctrineFieldList label="Alternative proof documents (in place of SSN)" items={rule.alternativeProofDocs} tone="cite" />
    </DoctrineAccordionCard>
  );
}
