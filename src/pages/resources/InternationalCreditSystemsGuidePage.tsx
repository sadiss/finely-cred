/**
 * `/resources/international-credit-systems-guide`
 *
 * C1 doctrine article — how consumer credit reporting works outside the U.S. (Canada, UK, Germany,
 * EU general). Sourced directly from `internationalAndNonCitizenCreditRepo.ts`'s
 * `INTERNATIONAL_CREDIT_SYSTEMS` — a distinct angle from the non-citizen funding article (consumer
 * credit reporting abroad vs. U.S. business funding for non-citizens), same source repo reused.
 */
import React from 'react';
import { Landmark } from 'lucide-react';
import { getAllInternationalCreditSystems } from '../../data/internationalAndNonCitizenCreditRepo';
import { DoctrineArticleShell } from '../../components/resources/DoctrineArticleShell';
import { DoctrineSectionHeading, DoctrineAccordionCard, DoctrineFieldList, DoctrineProseBlock } from '../../components/resources/DoctrineArticleParts';
import { FINELY_OS_ENTITY_CHIP } from '../../features/os/finelyOsLightUi';

const ACCENTS = ['sky', 'rose', 'amber', 'violet'] as const;

export default function InternationalCreditSystemsGuidePage() {
  const systems = getAllInternationalCreditSystems();

  return (
    <DoctrineArticleShell
      seo={{
        title: 'How Credit Reporting Works Abroad — Canada, UK, Germany & the EU Compared to the U.S.',
        description:
          'Score scales, major bureaus, data-protection regimes, and dispute rights in Canada, the UK, Germany, and the EU generally — compared point-by-point to the U.S. FCRA/FICO system, for partners with international credit history or clients relocating internationally.',
        path: '/resources/international-credit-systems-guide',
      }}
      badge="Business credit"
      kicker="Business credit · international credit systems"
      title="Your credit score doesn't"
      accentWord="travel the way you'd think."
      subtitle="A Canadian 750 is not a U.S. 750. Germany doesn't use a point score at all. Here is how consumer credit reporting actually works in Canada, the UK, Germany, and the EU generally — the bureaus, the score scales, the data-protection regimes, and how dispute rights compare to the U.S. FCRA."
      sourceNote="Sourced from Finely Cred's international & non-citizen credit repository — general educational guidance only, not legal or financial advice. Rules vary by country/region and change over time."
      accent="sky"
      chatRoleId="funding_strategist"
      chatGoal="business"
      chatRoleLabel="funding strategy"
      chatSubline="Building credit history in more than one country? Ask how it compares before you assume a U.S. rule applies."
      relatedLinks={[
        { label: 'Non-citizen & international business credit', to: '/resources/non-citizen-business-credit' },
        { label: 'Business credit tier matrix', to: '/resources/business-credit-tier-matrix' },
        { label: 'Business funding instruments landscape', to: '/resources/business-credit-funding-instruments' },
      ]}
    >
      <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
        <DoctrineSectionHeading Icon={Landmark} title="Credit systems compared" eyebrow={`${systems.length} regions covered`} />
        <div className="mt-4 space-y-3">
          {systems.map((sys, i) => (
            <DoctrineAccordionCard
              key={sys.countryCode}
              accent={ACCENTS[i % ACCENTS.length]}
              eyebrow={sys.majorBureaus.join(' · ')}
              title={sys.countryName}
              chips={[sys.scoreRangeLabel, `~${sys.reportingWindowYears}yr reporting window`]}
              defaultOpen={i === 0}
            >
              <DoctrineProseBlock label="Scoring model notes" text={sys.scoringModelNotes} />
              <DoctrineProseBlock label="Data protection regime" text={sys.dataProtectionRegime} />
              <DoctrineFieldList label="Key differences from the U.S. FCRA system" items={sys.keyDifferencesFromUS} tone="cite" />
              <DoctrineProseBlock label="Dispute rights summary" text={sys.disputeRightsSummary} />
              <div className="flex flex-wrap gap-1.5">
                <span className={FINELY_OS_ENTITY_CHIP}>~{sys.reportingWindowYears}-year typical retention</span>
              </div>
            </DoctrineAccordionCard>
          ))}
        </div>
      </section>
    </DoctrineArticleShell>
  );
}
