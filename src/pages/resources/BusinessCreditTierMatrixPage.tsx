/**
 * `/resources/business-credit-tier-matrix`
 *
 * C1 doctrine article — the 5-tier business-credit ladder (no-PG vendor credit through
 * institutional unsecured lines). Sourced directly from `businessCreditDoctrineRepo.ts`.
 */
import React from 'react';
import { Building2 } from 'lucide-react';
import { getAllTierStrategies } from '../../data/businessCreditDoctrineRepo';
import { getCaseStudiesByCategory } from '../../data/caseStudiesRepo';
import { DoctrineArticleShell } from '../../components/resources/DoctrineArticleShell';
import { DoctrineSectionHeading, DoctrineProofStrip } from '../../components/resources/DoctrineArticleParts';
import { BusinessCreditTierCard } from '../../components/resources/BusinessCreditTierCard';

const ACCENTS = ['emerald', 'sky', 'amber', 'violet', 'fuchsia'] as const;
const STANDARD_DISCLAIMER =
  'Results vary. Individual outcomes depend on your unique credit profile, income, documentation, and cooperation with the process. This is not legal advice.';

export default function BusinessCreditTierMatrixPage() {
  const tiers = getAllTierStrategies();
  const proofStudies = getCaseStudiesByCategory('business_credit').slice(0, 3);

  return (
    <DoctrineArticleShell
      seo={{
        title: 'Business Credit Tier Matrix — The 5-Tier Path From Vendor Credit to Institutional Lines',
        description:
          'Tier 1 no-PG vendor accounts through Tier 5 institutional unsecured lines — real vendor names, Paydex/Intelliscore targets, personal-guarantee release strategy, and common mistakes at each tier.',
        path: '/resources/business-credit-tier-matrix',
      }}
      badge="Business credit"
      kicker="Business credit · tier matrix"
      title="Five tiers stand between you"
      accentWord="and institutional credit."
      subtitle="Business credit is built in a sequence, not a single application. Here is the full 5-tier ladder — real vendor names, the score/Paydex targets underwriters actually use, and how a personal guarantee typically gets released as the file matures."
      sourceNote="Sourced from Finely Cred's business-credit doctrine repository — general market education, not a guarantee of approval, limits, or terms."
      accent="emerald"
      chatRoleId="funding_strategist"
      chatGoal="business"
      chatRoleLabel="funding strategy"
      chatSubline="Not sure which tier your business is actually in? Ask before applying anywhere."
      relatedLinks={[
        { label: 'Business funding instruments landscape', to: '/resources/business-credit-funding-instruments' },
        { label: 'Business credit-building mistakes', to: '/resources/business-credit-building-mistakes' },
        { label: 'Non-citizen & international business credit', to: '/resources/non-citizen-business-credit' },
      ]}
    >
      <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
        <DoctrineSectionHeading Icon={Building2} title="The 5-tier business credit ladder" eyebrow="Tier 1 → Tier 5" />
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Expand a tier for the vendor list, bureau targets, industry (NAICS) risk notes, and the personal-guarantee release
          path — every vendor name below is a real, well-known account commonly cited in business-credit-building practice.
        </p>
        <div className="mt-4 space-y-3">
          {tiers.map((t, i) => (
            <BusinessCreditTierCard key={t.tier} tier={t} accent={ACCENTS[i % ACCENTS.length]} defaultOpen={i === 0} />
          ))}
        </div>
      </section>

      <DoctrineProofStrip studies={proofStudies} disclaimer={STANDARD_DISCLAIMER} />
    </DoctrineArticleShell>
  );
}
