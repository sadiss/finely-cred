/**
 * `/resources/debt-defense-post-judgment`
 *
 * C1 doctrine article — post-judgment emergencies (wage garnishment, bank levy, motions to vacate),
 * by debt type. Sourced directly from `debtLitigationDoctrineRepo.ts`'s `post_judgment_emergency`
 * phase entries.
 */
import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { getPlaybooksByPhase } from '../../data/debtLitigationDoctrineRepo';
import { getCaseStudiesByCategory } from '../../data/caseStudiesRepo';
import { DoctrineArticleShell } from '../../components/resources/DoctrineArticleShell';
import { DoctrineSectionHeading, DoctrineProofStrip } from '../../components/resources/DoctrineArticleParts';
import { DebtLitigationPlaybookCard } from '../../components/resources/DebtLitigationPlaybookCard';

const STANDARD_DISCLAIMER =
  'Results vary. Individual outcomes depend on your unique credit profile, income, documentation, and cooperation with the process. This is not legal advice.';

export default function DebtDefensePostJudgmentPage() {
  const playbooks = getPlaybooksByPhase('post_judgment_emergency');
  const proofStudies = getCaseStudiesByCategory('debt_legal').slice(2, 5);

  return (
    <DoctrineArticleShell
      seo={{
        title: 'Post-Judgment Emergencies — Wage Garnishment & Bank Levy Exemptions',
        description:
          'A creditor won a judgment and is moving to garnish wages or levy a bank account — what federal and state law protects, how to claim an exemption, and the deadlines that matter, by debt type.',
        path: '/resources/debt-defense-post-judgment',
      }}
      badge="Debt defense"
      kicker="Debt defense · post-judgment emergency"
      title="A judgment is not"
      accentWord="the end of your options."
      subtitle="Once a judgment is entered, federal law — and often broader state law — still limits how much can be garnished and protects certain income categories outright. Acting fast on an exemption claim or a motion to vacate matters. Here is the doctrine, by debt type."
      sourceNote="Sourced from Finely Cred's debt-litigation doctrine repository — real, verifiable federal and state statutes only. General legal education, not legal advice."
      accent="rose"
      chatRoleId="dispute_coach"
      chatGoal="debt"
      chatRoleLabel="debt defense"
      chatSubline="Not sure if your income is exempt from garnishment? Ask before the exemption deadline passes."
      relatedLinks={[
        { label: 'Discovery demands against a debt buyer', to: '/resources/debt-defense-discovery-demands' },
        { label: 'FDCPA counter-suits', to: '/resources/fdcpa-collector-violations' },
        { label: 'Validation & cease-communication rights', to: '/resources/debt-defense-validation-letters' },
      ]}
    >
      <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
        <DoctrineSectionHeading
          Icon={ShieldAlert}
          title="Post-judgment emergency playbooks by debt type"
          eyebrow={`${playbooks.length} debt types covered`}
        />
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Every entry lists the exempt-fund categories, the legal requirements to claim them, and a general step-by-step —
          expand a card for the full breakdown.
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
