/**
 * `/resources/debt-defense-summons-answer`
 *
 * C1 doctrine article — answering a debt-collection lawsuit, by debt type. Sourced directly from
 * `debtLitigationDoctrineRepo.ts`'s `summons_answer` phase entries.
 */
import React from 'react';
import { Gavel } from 'lucide-react';
import { getPlaybooksByPhase } from '../../data/debtLitigationDoctrineRepo';
import { DoctrineArticleShell } from '../../components/resources/DoctrineArticleShell';
import { DoctrineSectionHeading } from '../../components/resources/DoctrineArticleParts';
import { DebtLitigationPlaybookCard } from '../../components/resources/DebtLitigationPlaybookCard';

export default function DebtDefenseSummonsAnswerPage() {
  const playbooks = getPlaybooksByPhase('summons_answer');

  return (
    <DoctrineArticleShell
      seo={{
        title: 'Answering a Debt Collection Lawsuit — Deadlines & Affirmative Defenses',
        description:
          'What to do when you are served a summons for credit card, medical, auto, mortgage, student loan, or other debt — answer deadlines, affirmative defenses like statute of limitations and lack of standing, and what happens if you miss the deadline.',
        path: '/resources/debt-defense-summons-answer',
      }}
      badge="Debt defense"
      kicker="Debt defense · summons & answer"
      title="Served with a lawsuit?"
      accentWord="The deadline is the whole game."
      subtitle="Missing the deadline to answer a debt-collection summons usually means an automatic default judgment. Here is what a timely, properly drafted answer generally needs to say — by debt type — and the affirmative defenses courts most often see raised successfully."
      sourceNote="Sourced from Finely Cred's debt-litigation doctrine repository — real, verifiable statutes and case law only. General legal education, not legal advice."
      accent="rose"
      chatRoleId="dispute_coach"
      chatGoal="debt"
      chatRoleLabel="debt defense"
      chatSubline="Not sure how many days you have left to answer? Ask before the clock runs out."
      relatedLinks={[
        { label: 'Validation & cease-communication rights', to: '/resources/debt-defense-validation-letters' },
        { label: 'Discovery demands against a debt buyer', to: '/resources/debt-defense-discovery-demands' },
        { label: 'Post-judgment garnishment exemptions', to: '/resources/debt-defense-post-judgment' },
      ]}
    >
      <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
        <DoctrineSectionHeading
          Icon={Gavel}
          title="Answer & affirmative-defense playbooks by debt type"
          eyebrow={`${playbooks.length} debt types covered`}
        />
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Every entry lists the answer-deadline rule, the affirmative defenses commonly available, and the real case law
          behind them — expand a card for the full breakdown.
        </p>
        <div className="mt-4 space-y-3">
          {playbooks.map((p, i) => (
            <DebtLitigationPlaybookCard key={p.id} playbook={p} accent="rose" defaultOpen={i === 0} />
          ))}
        </div>
      </section>
    </DoctrineArticleShell>
  );
}
