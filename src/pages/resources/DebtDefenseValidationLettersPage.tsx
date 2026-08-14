/**
 * `/resources/debt-defense-validation-letters`
 *
 * C1 doctrine article — pre-suit validation & cease-communication rights across every debt type
 * in `debtLitigationDoctrineRepo.ts`. Content is rendered directly from the repo's structured
 * fields (overview, statutoryBasis, remedyAction, practicalWarnings) — nothing paraphrased away
 * from its own citations, nothing invented.
 */
import React from 'react';
import { ScrollText } from 'lucide-react';
import { getPlaybooksByPhase } from '../../data/debtLitigationDoctrineRepo';
import { getCaseStudiesByCategory } from '../../data/caseStudiesRepo';
import { DoctrineArticleShell } from '../../components/resources/DoctrineArticleShell';
import { DoctrineSectionHeading, DoctrineProofStrip } from '../../components/resources/DoctrineArticleParts';
import { DebtLitigationPlaybookCard } from '../../components/resources/DebtLitigationPlaybookCard';

const STANDARD_DISCLAIMER =
  'Results vary. Individual outcomes depend on your unique credit profile, income, documentation, and cooperation with the process. This is not legal advice.';

export default function DebtDefenseValidationLettersPage() {
  const playbooks = getPlaybooksByPhase('pre_suit_validation');
  const proofStudies = getCaseStudiesByCategory('debt_legal').slice(0, 3);

  return (
    <DoctrineArticleShell
      seo={{
        title: 'Debt Validation Letters & Cease-Communication Rights',
        description:
          'How to demand written debt validation and send a cease-communication letter before a collector sues — by debt type (credit card, medical, auto, mortgage, student loan, tax, and more), with the real FDCPA/FCRA citations behind each right.',
        path: '/resources/debt-defense-validation-letters',
      }}
      badge="Debt defense"
      kicker="Debt defense · pre-suit validation"
      title="Demand validation before you"
      accentWord="say a word back."
      subtitle="Before you respond to a collection call or letter, federal law gives you the right to demand written proof of the debt and to stop unwanted contact — here is exactly how that works, debt type by debt type, sourced from Finely Cred's debt-litigation doctrine library."
      sourceNote="Sourced from Finely Cred's debt-litigation doctrine repository — real, verifiable federal statutes and case law only. General legal education, not legal advice."
      accent="rose"
      chatRoleId="dispute_coach"
      chatGoal="debt"
      chatRoleLabel="debt defense"
      chatSubline="Not sure if your debt is still within the statute of limitations? Ask before you respond."
      relatedLinks={[
        { label: 'Answering a lawsuit summons', to: '/resources/debt-defense-summons-answer' },
        { label: 'Post-judgment garnishment exemptions', to: '/resources/debt-defense-post-judgment' },
        { label: 'FDCPA counter-suits', to: '/resources/fdcpa-collector-violations' },
      ]}
    >
      <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
        <DoctrineSectionHeading
          Icon={ScrollText}
          title="Validation & cease-communication playbooks by debt type"
          eyebrow={`${playbooks.length} debt types covered`}
        />
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Expand a card for the exact statutes, the case law behind them, and a general step-by-step — every citation below is
          a real, verifiable federal law or reported court decision, not a summary invented for this page.
        </p>
        <div className="mt-4 space-y-3">
          {playbooks.map((p, i) => (
            <DebtLitigationPlaybookCard key={p.id} playbook={p} accent="rose" defaultOpen={i === 0} />
          ))}
        </div>
      </section>

      <DoctrineProofStrip studies={proofStudies} disclaimer={STANDARD_DISCLAIMER} />
    </DoctrineArticleShell>
  );
}
