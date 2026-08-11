import React from 'react';
import type { Prospect } from '../../domain/crmProspects';
import { consentLabelForProspect } from './marketingProspectConsent';
import { finelyOsMicroStat } from '../os/finelyOsLightUi';

export function MarketingConsentChip({ prospect }: { prospect?: Prospect | null }) {
  const { chip, tone } = consentLabelForProspect(prospect ?? null);
  return (
    <span className={finelyOsMicroStat(tone)} title="Email nurture policy for this person">
      {chip}
    </span>
  );
}

export function MarketingConsentChipFromHit(args: {
  consentBasis?: Prospect['consentBasis'];
  leadType?: Prospect['leadType'];
  emailMarketingAllowed?: boolean;
}) {
  const pseudo: Prospect = {
    id: '_chip',
    createdAt: '',
    updatedAt: '',
    target: 'clients',
    stage: 'new',
    source: 'lead_intel_search',
    score: 0,
    tags: [],
    company: {},
    contact: { emails: [], phones: [] },
    notes: [],
    touches: [],
    consentBasis: args.consentBasis,
    leadType: args.leadType,
    emailMarketingAllowed: args.emailMarketingAllowed,
  };
  return <MarketingConsentChip prospect={pseudo} />;
}
