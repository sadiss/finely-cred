/** Renders one `BusinessFundingInstrument` entry — shared across C1 business-credit articles. */
import React from 'react';
import type { BusinessFundingInstrument } from '../../data/businessCreditDoctrineRepo';
import { DoctrineAccordionCard, DoctrineFieldList } from './DoctrineArticleParts';
import type { FinelyOsPublicAccent } from '../../features/os/finelyOsLightUi';

const STAGE_LABELS: Record<BusinessFundingInstrument['bestFitBusinessStage'], string> = {
  startup_0_6mo: 'Best fit: 0-6 months in business',
  established_6_24mo: 'Best fit: 6-24 months in business',
  mature_2yr_plus: 'Best fit: 2+ years in business',
};

const INSTRUMENT_LABELS: Record<BusinessFundingInstrument['instrumentType'], string> = {
  sba_7a: 'SBA 7(a) loan',
  sba_504: 'SBA 504 fixed-asset loan',
  business_line_of_credit: 'Business line of credit',
  equipment_financing: 'Equipment financing',
  invoice_factoring: 'Invoice factoring',
  merchant_cash_advance: 'Merchant cash advance (MCA)',
  term_loan: 'Term loan',
  commercial_real_estate: 'Commercial real estate loan',
  business_credit_card_stacking: 'Business credit-card stacking',
};

export function BusinessFundingInstrumentCard({
  instrument,
  accent = 'sky',
  defaultOpen = false,
}: {
  instrument: BusinessFundingInstrument;
  accent?: FinelyOsPublicAccent;
  defaultOpen?: boolean;
}) {
  return (
    <DoctrineAccordionCard
      accent={accent}
      eyebrow={STAGE_LABELS[instrument.bestFitBusinessStage]}
      title={INSTRUMENT_LABELS[instrument.instrumentType]}
      chips={[instrument.fundingRangeLabel]}
      defaultOpen={defaultOpen}
    >
      <DoctrineFieldList label="Typical underwriting factors" items={instrument.typicalUnderwritingFactors} />
      <DoctrineFieldList label="Documentation generally needed" items={instrument.documentationNeeded} tone="cite" />
      <DoctrineFieldList label="Risks & cautions" items={instrument.risksAndCautions} tone="warn" />
    </DoctrineAccordionCard>
  );
}
