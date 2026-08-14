/** Renders one `BusinessCreditTierStrategy` entry — shared across C1 business-credit articles. */
import React from 'react';
import type { BusinessCreditTierStrategy } from '../../data/businessCreditDoctrineRepo';
import { DoctrineAccordionCard, DoctrineFieldList, DoctrineProseBlock } from './DoctrineArticleParts';
import { FINELY_OS_ENTITY_BODY } from '../../features/os/finelyOsLightUi';
import type { FinelyOsPublicAccent } from '../../features/os/finelyOsLightUi';

const BUREAU_LABELS: Record<string, string> = {
  dnb: 'D&B (PAYDEX)',
  experian_small_business: 'Experian Small Business',
  equifax_business: 'Equifax Business',
};

export function BusinessCreditTierCard({
  tier,
  accent = 'violet',
  defaultOpen = false,
}: {
  tier: BusinessCreditTierStrategy;
  accent?: FinelyOsPublicAccent;
  defaultOpen?: boolean;
}) {
  const chips = [
    `Tier ${tier.tier}`,
    ...tier.targetBureaus.map((b) => BUREAU_LABELS[b] ?? b),
    tier.timeToNextTierWeeks > 0 ? `~${tier.timeToNextTierWeeks} wks to next tier` : 'Ceiling tier',
  ];
  return (
    <DoctrineAccordionCard accent={accent} eyebrow={`Minimum score/Paydex target: ${tier.minimumPaydexOrScore || 'n/a (no history yet)'}`} title={tier.tierName} chips={chips} defaultOpen={defaultOpen}>
      {tier.bankRatingRequired ? (
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
          <span className="font-semibold text-white/85">Bank-rating benchmark: </span>
          {tier.bankRatingRequired}
        </p>
      ) : null}
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Real vendors commonly cited at this tier</div>
        <div className="mt-2 space-y-2">
          {tier.vendorList.map((v) => (
            <div key={v.name} className="rounded-lg border border-white/10 bg-black/20 p-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-bold text-white">{v.name}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-white/40">{v.reportingBureau}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-white/60">{v.approvalCriteria}</p>
            </div>
          ))}
        </div>
      </div>
      <DoctrineFieldList label="Industry (NAICS) risk notes & bypass strategy" items={tier.naicsRiskBypass} />
      {tier.pgReleaseStrategy ? <DoctrineProseBlock label="Personal-guarantee release strategy" text={tier.pgReleaseStrategy} /> : null}
      <DoctrineFieldList label="Common mistakes at this tier" items={tier.commonMistakes} tone="warn" />
    </DoctrineAccordionCard>
  );
}
