/**
 * `/resources/debt-defense-discovery-demands`
 *
 * C1 doctrine article — discovery demands & motion practice against a debt buyer, by debt type.
 * Sourced directly from `debtLitigationDoctrineRepo.ts`'s `discovery_motion` phase entries.
 */
import React from 'react';
import { FileSearch } from 'lucide-react';
import { getPlaybooksByPhase } from '../../data/debtLitigationDoctrineRepo';
import { DoctrineArticleShell } from '../../components/resources/DoctrineArticleShell';
import { DoctrineSectionHeading } from '../../components/resources/DoctrineArticleParts';
import { DebtLitigationPlaybookCard } from '../../components/resources/DebtLitigationPlaybookCard';

export default function DebtDefenseDiscoveryDemandsPage() {
  const playbooks = getPlaybooksByPhase('discovery_motion');

  return (
    <DoctrineArticleShell
      seo={{
        title: 'Discovery Demands Against a Debt Buyer — Forcing Proof of the Debt',
        description:
          'Once an answer is filed, discovery is often where a debt-buyer lawsuit is won or lost. What to request — the original agreement, the full chain of assignment, and account records — and why many debt buyers cannot produce them.',
        path: '/resources/debt-defense-discovery-demands',
      }}
      badge="Debt defense"
      kicker="Debt defense · discovery & motion practice"
      title="Make the debt buyer"
      accentWord="prove it exists."
      subtitle="Most debt buyers hold a purchased-account spreadsheet, not the original signed agreement or a complete assignment history. Targeted discovery requests can force real proof — or a failure of proof. Here is what to request, by debt type."
      sourceNote="Sourced from Finely Cred's debt-litigation doctrine repository — real, verifiable statutes and case law only. General legal education, not legal advice."
      accent="sky"
      chatRoleId="dispute_coach"
      chatGoal="debt"
      chatRoleLabel="debt defense"
      chatSubline="Not sure what to request in discovery? Ask before your deadline to serve requests passes."
      relatedLinks={[
        { label: 'Answering a lawsuit summons', to: '/resources/debt-defense-summons-answer' },
        { label: 'FDCPA counter-suits', to: '/resources/fdcpa-collector-violations' },
        { label: 'Post-judgment garnishment exemptions', to: '/resources/debt-defense-post-judgment' },
      ]}
    >
      <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
        <DoctrineSectionHeading
          Icon={FileSearch}
          title="Discovery-demand playbooks by debt type"
          eyebrow={`${playbooks.length} debt types covered`}
        />
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Each entry lists what to request, the procedural rules that govern deadlines, and the practical risks of
          discovery cutting both ways — expand a card for the full breakdown.
        </p>
        <div className="mt-4 space-y-3">
          {playbooks.map((p, i) => (
            <DebtLitigationPlaybookCard key={p.id} playbook={p} accent="sky" defaultOpen={i === 0} />
          ))}
        </div>
      </section>
    </DoctrineArticleShell>
  );
}
