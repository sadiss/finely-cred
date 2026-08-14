/**
 * `/resources/business-credit-building-mistakes`
 *
 * C1 doctrine article — common business-credit-building mistakes that trigger denials, organized
 * by tier. Sourced directly from `businessCreditDoctrineRepo.ts`'s `commonMistakes` and
 * `naicsRiskBypass` fields — a distinct angle on the same doctrine repo as the tier-matrix article
 * ("what to avoid" vs. "what to do"), not a duplicate of it.
 */
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { getAllTierStrategies } from '../../data/businessCreditDoctrineRepo';
import { DoctrineArticleShell } from '../../components/resources/DoctrineArticleShell';
import { DoctrineSectionHeading, DoctrineFieldList } from '../../components/resources/DoctrineArticleParts';
import { finelyOsCatalogCardCompact, FINELY_OS_ENTITY_CHIP } from '../../features/os/finelyOsLightUi';

const ACCENTS = ['rose', 'amber', 'violet', 'sky', 'fuchsia'] as const;

export default function BusinessCreditBuildingMistakesPage() {
  const tiers = getAllTierStrategies();

  return (
    <DoctrineArticleShell
      seo={{
        title: 'Common Business Credit-Building Mistakes That Trigger Denials',
        description:
          'The mistakes that most often sink a business-credit file at every tier — from applying to too many Tier 1 vendors in one week to carrying high utilization on a new Tier 2 store card — organized by tier, sourced from Finely Cred\'s business-credit doctrine library.',
        path: '/resources/business-credit-building-mistakes',
      }}
      badge="Business credit"
      kicker="Business credit · common mistakes"
      title="The denial isn't bad luck —"
      accentWord="it's usually a sequencing mistake."
      subtitle="Most business-credit denials trace back to a handful of repeatable mistakes: applying too fast, missing a reporting cycle, or picking a tier before the file is ready for it. Here is the mistake list at every tier, straight from Finely Cred's doctrine library."
      sourceNote="Sourced from Finely Cred's business-credit doctrine repository — general market education, not a guarantee of approval, limits, or terms."
      accent="rose"
      chatRoleId="funding_strategist"
      chatGoal="business"
      chatRoleLabel="funding strategy"
      chatSubline="Not sure if you already made one of these mistakes? Ask before you apply again."
      relatedLinks={[
        { label: 'Business credit tier matrix', to: '/resources/business-credit-tier-matrix' },
        { label: 'Business funding instruments landscape', to: '/resources/business-credit-funding-instruments' },
        { label: 'Non-citizen & international business credit', to: '/resources/non-citizen-business-credit' },
      ]}
    >
      <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
        <DoctrineSectionHeading Icon={AlertTriangle} title="Mistakes to avoid, tier by tier" eyebrow={`${tiers.length} tiers covered`} />
        <div className="mt-4 space-y-3">
          {tiers.map((tier, i) => (
            <div key={tier.tier} className={finelyOsCatalogCardCompact(ACCENTS[i % ACCENTS.length])}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={FINELY_OS_ENTITY_CHIP}>Tier {tier.tier}</span>
                <span className="text-base font-bold text-white">{tier.tierName}</span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <DoctrineFieldList label="Common mistakes at this tier" items={tier.commonMistakes} tone="warn" />
                <DoctrineFieldList label="Industry (NAICS) risk notes" items={tier.naicsRiskBypass} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </DoctrineArticleShell>
  );
}
