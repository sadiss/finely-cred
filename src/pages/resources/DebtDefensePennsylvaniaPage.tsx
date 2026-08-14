/**
 * `/resources/debt-defense-pennsylvania`
 *
 * C4 — state-specific debt-defense landing page (highest compliance scrutiny in the plan, per
 * C0.3). Pennsylvania is named explicitly in `debtLitigationDoctrineRepo.ts`'s wage-garnishment
 * statutory-basis note (`credit_card-post_judgment_emergency` entry), alongside Texas, North
 * Carolina, and South Carolina, as one of a small group of states whose wage-garnishment
 * protection for ordinary consumer debt is understood to be broader than the federal CCPA floor.
 * Every other claim on this page is general federal doctrine (FDCPA, CCPA garnishment cap, federal
 * benefit exemptions), not a Pennsylvania-specific procedural rule — this page does not invent
 * Pennsylvania statute numbers, answer deadlines, or SOL periods that are not already in the
 * source repo.
 *
 * Note: North Carolina and South Carolina are named in the same repo citation but do not get a
 * separate landing page in this wave — building four near-identical single-fact state pages would
 * repeat the same one-sentence citation with only the state name changed, which is closer to thin
 * template-filling than genuinely distinct content. Texas and Pennsylvania (the two largest states
 * in the named group) represent that real fact; see the C4 delivery notes for the full reasoning.
 *
 * Compliance: `ComplianceReviewRecord` seeded at `status: 'needs_review'`,
 * `highestScrutiny: true`, 3-month re-verification cadence (C0.3) — see
 * `complianceReviewRepo.ts`'s `ensureC4StateDebtDefenseComplianceRecordsSeeded()`. Left
 * `needs_review`, not self-approved.
 */
import React from 'react';
import { ShieldAlert, Gavel, FileWarning } from 'lucide-react';
import { getPlaybook } from '../../data/debtLitigationDoctrineRepo';
import { DoctrineArticleShell } from '../../components/resources/DoctrineArticleShell';
import {
  DoctrineSectionHeading,
  DoctrineFieldList,
  DoctrineProseBlock,
  StateLawScrutinyBanner,
} from '../../components/resources/DoctrineArticleParts';
import { DebtLitigationPlaybookCard } from '../../components/resources/DebtLitigationPlaybookCard';

export default function DebtDefensePennsylvaniaPage() {
  const postJudgment = getPlaybook('credit_card', 'post_judgment_emergency');
  const summonsAnswer = getPlaybook('credit_card', 'summons_answer');
  const preSuit = getPlaybook('credit_card', 'pre_suit_validation');

  return (
    <DoctrineArticleShell
      seo={{
        title: 'Debt Defense in Pennsylvania — Federal Rights, Wage Garnishment, and What Actually Varies by State',
        description:
          'Debt collection defense for Pennsylvania residents: federal FDCPA and CCPA garnishment-cap protections, the one Pennsylvania-specific wage-garnishment note in our doctrine repository, and an explicit list of what varies by state and requires a Pennsylvania attorney to confirm.',
        path: '/resources/debt-defense-pennsylvania',
      }}
      badge="Debt defense · Pennsylvania"
      kicker="Debt defense · state-specific · highest compliance scrutiny"
      title="Debt defense in Pennsylvania —"
      accentWord="what's actually state-specific, and what isn't."
      subtitle="Most of the rights below are federal law that apply the same way in every state. This page is explicit about the one real, verifiable Pennsylvania-specific note in our doctrine records, and just as explicit about everything that still requires a Pennsylvania-licensed attorney to confirm."
      sourceNote="Sourced from Finely Cred's debt-litigation doctrine repository (debtLitigationDoctrineRepo.ts) — no fabricated Pennsylvania statute numbers or deadlines."
      accent="rose"
      chatRoleId="dispute_coach"
      chatGoal="debt"
      chatRoleLabel="debt defense"
      chatSubline="Have a Pennsylvania summons or garnishment deadline coming up? Ask before it passes."
      relatedLinks={[
        { label: 'Debt defense in New York', to: '/resources/debt-defense-new-york' },
        { label: 'Debt defense in Texas', to: '/resources/debt-defense-texas' },
        { label: 'Post-judgment garnishment exemptions (general)', to: '/resources/debt-defense-post-judgment' },
        { label: 'Answering a debt collection lawsuit (general)', to: '/resources/debt-defense-summons-answer' },
      ]}
      complianceNote="Pennsylvania law changes over time and this page is general information, not legal advice. Results vary · not a substitute for advice from a licensed attorney in Pennsylvania · individual eligibility, procedure, deadlines, and outcomes depend on your own circumstances, the specific court, and current Pennsylvania and federal law."
    >
      <StateLawScrutinyBanner stateName="Pennsylvania" />

      <section className="rounded-[1.25rem] border border-rose-400/25 bg-rose-500/[0.04] p-5">
        <DoctrineSectionHeading Icon={ShieldAlert} title="What's verified as Pennsylvania-specific in our records" eyebrow="1 citation" />
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Our doctrine repository names Pennsylvania once, specifically, in the wage-garnishment statutory basis for a
          post-judgment credit-card scenario:
        </p>
        <blockquote className="mt-3 rounded-xl border border-white/10 bg-black/30 p-4 text-sm italic leading-relaxed text-white/75">
          &ldquo;State wage-garnishment statutes (some states, e.g., Texas, Pennsylvania, North Carolina, and South
          Carolina, provide broader protection than federal law for ordinary consumer debts — verify the current state
          statute).&rdquo;
        </blockquote>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          That is the extent of what our records confirm about Pennsylvania specifically: Pennsylvania is understood to
          protect wages from garnishment for ordinary consumer debt (non-tax, non-support, non-student-loan) more
          broadly than the federal CCPA floor described below — but we do not have a verified current statute citation
          or exact scope in our system, so it is not reproduced here as a specific rule. Confirm the current
          Pennsylvania statute and its exact scope with a Pennsylvania-licensed attorney before relying on it.
        </p>
      </section>

      <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
        <DoctrineSectionHeading
          Icon={Gavel}
          title="Federal protections that apply in Pennsylvania the same as everywhere else"
          eyebrow="General doctrine, not Pennsylvania-specific"
        />
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          These are federal statutes — they do not depend on Pennsylvania law and apply to every U.S. consumer. Expand a
          card for the full statutory basis, case law, and step-by-step.
        </p>
        <div className="mt-4 space-y-3">
          {preSuit ? <DebtLitigationPlaybookCard playbook={preSuit} accent="rose" defaultOpen /> : null}
          {summonsAnswer ? <DebtLitigationPlaybookCard playbook={summonsAnswer} accent="rose" /> : null}
          {postJudgment ? <DebtLitigationPlaybookCard playbook={postJudgment} accent="rose" /> : null}
        </div>
      </section>

      <section className="rounded-[1.25rem] border border-amber-400/25 bg-amber-500/[0.04] p-5">
        <DoctrineSectionHeading Icon={FileWarning} title="What varies by state and is NOT covered here" eyebrow="Verify locally" />
        <DoctrineFieldList
          tone="warn"
          label="Confirm each of these with a Pennsylvania-licensed attorney or the current statute — not this page"
          items={[
            'The exact statute of limitations for a specific debt type (contract/open-account claims are commonly 3–6 years nationally, but the current Pennsylvania period and any tolling rules are not in our records)',
            'The exact number of days to file a written answer after being served a Pennsylvania complaint (commonly 20–35 days nationally as a general range, not a confirmed Pennsylvania-specific number)',
            'The precise scope and dollar/percentage limits of Pennsylvania wage-garnishment protection referenced above',
            'Pennsylvania rules of civil procedure for service of process, discovery deadlines, and opening/striking a default judgment',
            'Any Pennsylvania-specific bank-account or personal-property exemption beyond the federal benefit categories listed above',
          ]}
        />
      </section>

      <DoctrineProseBlock
        label="Why this page is built this way"
        text="Debt-collection civil procedure is set by each state's own legislature and courts, and it changes over time. Rather than presenting a full Pennsylvania-specific playbook we cannot currently verify, this page draws the line clearly: one real, cited Pennsylvania note, a full set of federal protections that apply regardless of state, and an explicit list of exactly what still needs local verification."
      />
    </DoctrineArticleShell>
  );
}
