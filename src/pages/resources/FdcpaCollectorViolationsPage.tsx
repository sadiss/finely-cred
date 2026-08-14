/**
 * `/resources/fdcpa-collector-violations`
 *
 * C1 doctrine article — FDCPA counter-suits when a collector's own conduct breaks the law, by debt
 * type. Sourced directly from `debtLitigationDoctrineRepo.ts`'s `counter_suit` phase entries.
 */
import React from 'react';
import { Scale } from 'lucide-react';
import { getPlaybooksByPhase } from '../../data/debtLitigationDoctrineRepo';
import { getCitationsForCategory } from '../../data/authorityCitationsRepo';
import { DoctrineArticleShell } from '../../components/resources/DoctrineArticleShell';
import { DoctrineSectionHeading, DoctrineAccordionCard, DoctrineProseBlock } from '../../components/resources/DoctrineArticleParts';
import { DebtLitigationPlaybookCard } from '../../components/resources/DebtLitigationPlaybookCard';

export default function FdcpaCollectorViolationsPage() {
  const playbooks = getPlaybooksByPhase('counter_suit');
  const citations = getCitationsForCategory('debt_summons').slice(0, 6);

  return (
    <DoctrineArticleShell
      seo={{
        title: 'FDCPA Counter-Suits — When the Debt Collector Breaks the Law',
        description:
          'Repeated calls after a written cease-and-desist, false statements about a debt, threats of action a collector cannot legally take — when a collector crosses these lines, the FDCPA gives you an independent legal remedy. Here is how it works.',
        path: '/resources/fdcpa-collector-violations',
      }}
      badge="Debt defense"
      kicker="Debt defense · FDCPA counter-suit"
      title="When the collector"
      accentWord="is the one breaking the law."
      subtitle="A genuine FDCPA violation — repeated contact after a cease-and-desist, false statements about the debt, unfair collection tactics — can be raised as a counterclaim or filed on its own, with statutory damages and attorney fees available. This does not erase a valid underlying debt, but it is a real remedy for the collector's own misconduct."
      sourceNote="Sourced from Finely Cred's debt-litigation doctrine repository and authority-citation library — real, verifiable federal statutes and case law only. General legal education, not legal advice."
      accent="emerald"
      chatRoleId="dispute_coach"
      chatGoal="debt"
      chatRoleLabel="debt defense"
      chatSubline="Documenting a possible FDCPA violation? Ask what to log before you talk to an attorney."
      relatedLinks={[
        { label: 'Validation & cease-communication rights', to: '/resources/debt-defense-validation-letters' },
        { label: 'Post-judgment garnishment exemptions', to: '/resources/debt-defense-post-judgment' },
        { label: 'Discovery demands against a debt buyer', to: '/resources/debt-defense-discovery-demands' },
      ]}
    >
      <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
        <DoctrineSectionHeading
          Icon={Scale}
          title="FDCPA counter-suit playbooks by debt type"
          eyebrow={`${playbooks.length} debt types covered`}
        />
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Every entry lists the specific FDCPA sections most commonly implicated, the real case law interpreting them, and
          the evidence a genuine claim generally needs — expand a card for the full breakdown.
        </p>
        <div className="mt-4 space-y-3">
          {playbooks.map((p, i) => (
            <DebtLitigationPlaybookCard key={p.id} playbook={p} accent="emerald" defaultOpen={i === 0} />
          ))}
        </div>
      </section>

      {citations.length ? (
        <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
          <DoctrineSectionHeading title="Footnote-ready statutory citations" eyebrow="Debt-summons authority pack" />
          <div className="mt-3 space-y-3">
            {citations.map((c) => (
              <DoctrineAccordionCard key={c.id} accent="sky" eyebrow={c.statuteOrRegulation} title={c.topic}>
                <DoctrineProseBlock label="Plain-English summary" text={c.marketingSafeSummary} />
                <DoctrineProseBlock label="Full citation" text={c.footnoteText} />
                {c.casePrecedent ? <DoctrineProseBlock label="Case precedent" text={c.casePrecedent} /> : null}
              </DoctrineAccordionCard>
            ))}
          </div>
        </section>
      ) : null}
    </DoctrineArticleShell>
  );
}
