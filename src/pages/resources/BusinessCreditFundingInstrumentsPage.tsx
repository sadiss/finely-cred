/**
 * `/resources/business-credit-funding-instruments`
 *
 * C1 doctrine article — the corporate funding-instrument landscape (SBA loans, lines of credit,
 * equipment financing, factoring, MCA, term loans, CRE, card stacking). Sourced directly from
 * `businessCreditDoctrineRepo.ts`'s `BUSINESS_FUNDING_INSTRUMENTS`.
 */
import React from 'react';
import { Landmark } from 'lucide-react';
import { getAllFundingInstruments } from '../../data/businessCreditDoctrineRepo';
import { DoctrineArticleShell } from '../../components/resources/DoctrineArticleShell';
import { DoctrineSectionHeading } from '../../components/resources/DoctrineArticleParts';
import { BusinessFundingInstrumentCard } from '../../components/resources/BusinessFundingInstrumentCard';

const ACCENTS = ['sky', 'violet', 'amber', 'emerald', 'rose', 'fuchsia'] as const;

export default function BusinessCreditFundingInstrumentsPage() {
  const instruments = getAllFundingInstruments();

  return (
    <DoctrineArticleShell
      seo={{
        title: 'Business Funding Instruments — SBA Loans, Lines of Credit, Equipment Financing & More',
        description:
          'Nine business-funding instruments compared: SBA 7(a) and 504, business lines of credit, equipment financing, invoice factoring, merchant cash advances, term loans, commercial real estate, and credit-card stacking — underwriting factors, documentation, and real risk warnings for each.',
        path: '/resources/business-credit-funding-instruments',
      }}
      badge="Business credit"
      kicker="Business credit · funding instruments"
      title="Nine ways to fund a business —"
      accentWord="and what each one actually costs."
      subtitle="Not every funding instrument fits every business stage. Here is the full landscape — underwriting factors, documentation, funding ranges, and the honest risk warnings behind each one, including the real annualized cost behind a merchant cash advance's factor rate."
      sourceNote="Sourced from Finely Cred's business-credit doctrine repository — general market education, not a guarantee of approval, limits, or terms."
      accent="sky"
      chatRoleId="funding_strategist"
      chatGoal="business"
      chatRoleLabel="funding strategy"
      chatSubline="Not sure which instrument fits your business stage? Ask before you apply."
      relatedLinks={[
        { label: 'Business credit tier matrix', to: '/resources/business-credit-tier-matrix' },
        { label: 'Business credit-building mistakes', to: '/resources/business-credit-building-mistakes' },
        { label: 'Non-citizen & international business credit', to: '/resources/non-citizen-business-credit' },
      ]}
    >
      <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
        <DoctrineSectionHeading Icon={Landmark} title="Funding instruments compared" eyebrow={`${instruments.length} instruments`} />
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Expand an instrument for its typical underwriting factors, required documentation, and the risks/cautions worth
          reading before you sign anything.
        </p>
        <div className="mt-4 space-y-3">
          {instruments.map((inst, i) => (
            <BusinessFundingInstrumentCard key={inst.id} instrument={inst} accent={ACCENTS[i % ACCENTS.length]} defaultOpen={i === 0} />
          ))}
        </div>
      </section>
    </DoctrineArticleShell>
  );
}
