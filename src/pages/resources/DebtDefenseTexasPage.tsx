/**
 * `/resources/debt-defense-texas`
 *
 * C4 — state-specific debt-defense landing page (highest compliance scrutiny in the plan, per
 * C0.3). Texas is named explicitly in `debtLitigationDoctrineRepo.ts`'s wage-garnishment
 * statutory-basis note (`credit_card-post_judgment_emergency` entry) as one of a small group of
 * states whose wage-garnishment protection for ordinary consumer debt is understood to be
 * broader than the federal CCPA floor — and one of our documented `caseStudiesRepo.ts` debt-legal
 * case studies (`cs_debt_high_balance_negotiated`) is a real Texas partner. Every other claim on
 * this page is general federal doctrine (FDCPA, CCPA garnishment cap, federal benefit exemptions),
 * not a Texas-specific procedural rule — this page does not invent Texas statute numbers, answer
 * deadlines, or SOL periods that are not already in the source repo.
 *
 * Compliance: `ComplianceReviewRecord` seeded at `status: 'needs_review'`,
 * `highestScrutiny: true`, 3-month re-verification cadence (C0.3) — see
 * `complianceReviewRepo.ts`'s `ensureC4StateDebtDefenseComplianceRecordsSeeded()`. Left
 * `needs_review`, not self-approved.
 */
import React from 'react';
import { ShieldAlert, Gavel, FileWarning } from 'lucide-react';
import { getPlaybook } from '../../data/debtLitigationDoctrineRepo';
import { getCaseStudiesByCategory } from '../../data/caseStudiesRepo';
import { DoctrineArticleShell } from '../../components/resources/DoctrineArticleShell';
import {
  DoctrineSectionHeading,
  DoctrineFieldList,
  DoctrineProseBlock,
  DoctrineProofStrip,
  StateLawScrutinyBanner,
} from '../../components/resources/DoctrineArticleParts';
import { DebtLitigationPlaybookCard } from '../../components/resources/DebtLitigationPlaybookCard';

const STANDARD_DISCLAIMER =
  'Results vary. Individual outcomes depend on your unique credit profile, income, documentation, and cooperation with the process. This is not legal advice.';

export default function DebtDefenseTexasPage() {
  const postJudgment = getPlaybook('credit_card', 'post_judgment_emergency');
  const summonsAnswer = getPlaybook('credit_card', 'summons_answer');
  const preSuit = getPlaybook('credit_card', 'pre_suit_validation');
  const texasProof = getCaseStudiesByCategory('debt_legal').filter((s) => s.partnerAlias.includes(', TX'));

  return (
    <DoctrineArticleShell
      seo={{
        title: 'Debt Defense in Texas — Federal Rights, Wage Garnishment, and What Actually Varies by State',
        description:
          'Debt collection defense for Texas residents: federal FDCPA and CCPA garnishment-cap protections, the one Texas-specific wage-garnishment note in our doctrine repository, and an explicit list of what varies by state and requires a Texas attorney to confirm.',
        path: '/resources/debt-defense-texas',
      }}
      badge="Debt defense · Texas"
      kicker="Debt defense · state-specific · highest compliance scrutiny"
      title="Debt defense in Texas —"
      accentWord="what's actually state-specific, and what isn't."
      subtitle="Most of the rights below are federal law that apply the same way in every state. This page is explicit about the one real, verifiable Texas-specific note in our doctrine records, and just as explicit about everything that still requires a Texas-licensed attorney to confirm."
      sourceNote="Sourced from Finely Cred's debt-litigation doctrine repository (debtLitigationDoctrineRepo.ts) and documented case studies (caseStudiesRepo.ts) — no fabricated Texas statute numbers or deadlines."
      accent="rose"
      chatRoleId="dispute_coach"
      chatGoal="debt"
      chatRoleLabel="debt defense"
      chatSubline="Have a Texas summons or garnishment deadline coming up? Ask before it passes."
      relatedLinks={[
        { label: 'Debt defense in New York', to: '/resources/debt-defense-new-york' },
        { label: 'Debt defense in Pennsylvania', to: '/resources/debt-defense-pennsylvania' },
        { label: 'Post-judgment garnishment exemptions (general)', to: '/resources/debt-defense-post-judgment' },
        { label: 'Answering a debt collection lawsuit (general)', to: '/resources/debt-defense-summons-answer' },
      ]}
      complianceNote="Texas law changes over time and this page is general information, not legal advice. Results vary · not a substitute for advice from a licensed attorney in Texas · individual eligibility, procedure, deadlines, and outcomes depend on your own circumstances, the specific court, and current Texas and federal law."
    >
      <StateLawScrutinyBanner stateName="Texas" />

      <section className="rounded-[1.25rem] border border-rose-400/25 bg-rose-500/[0.04] p-5">
        <DoctrineSectionHeading Icon={ShieldAlert} title="What's verified as Texas-specific in our records" eyebrow="1 citation" />
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Our doctrine repository names Texas once, specifically, in the wage-garnishment statutory basis for a
          post-judgment credit-card scenario:
        </p>
        <blockquote className="mt-3 rounded-xl border border-white/10 bg-black/30 p-4 text-sm italic leading-relaxed text-white/75">
          &ldquo;State wage-garnishment statutes (some states, e.g., Texas, Pennsylvania, North Carolina, and South
          Carolina, provide broader protection than federal law for ordinary consumer debts — verify the current state
          statute).&rdquo;
        </blockquote>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          That is the extent of what our records confirm about Texas specifically: Texas is understood to protect wages
          from garnishment for ordinary consumer debt (non-tax, non-support, non-student-loan) more broadly than the
          federal CCPA floor described below — but we do not have a verified current statute citation or exact scope in
          our system, so it is not reproduced here as a specific rule. Confirm the current Texas Finance Code provision
          and its exact scope with a Texas-licensed attorney before relying on it.
        </p>
      </section>

      <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
        <DoctrineSectionHeading
          Icon={Gavel}
          title="Federal protections that apply in Texas the same as everywhere else"
          eyebrow="General doctrine, not Texas-specific"
        />
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          These are federal statutes — they do not depend on Texas law and apply to every U.S. consumer. Expand a card
          for the full statutory basis, case law, and step-by-step.
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
          label="Confirm each of these with a Texas-licensed attorney or the current Texas statute — not this page"
          items={[
            'The exact statute of limitations for a specific debt type (contract/open-account claims are commonly 3–6 years nationally, but the current Texas period and any tolling rules are not in our records)',
            'The exact number of days to file a written answer after being served a Texas summons (commonly 20–35 days nationally as a general range, not a confirmed Texas-specific number)',
            'The precise scope and dollar/percentage limits of Texas wage-garnishment protection referenced above',
            'Texas rules of civil procedure for service of process, discovery deadlines, and motions to vacate a default judgment',
            'Any Texas-specific homestead, bank-account, or personal-property exemption beyond the federal benefit categories listed above',
          ]}
        />
      </section>

      {texasProof.length ? (
        <DoctrineProofStrip title="A documented Texas outcome" studies={texasProof} disclaimer={STANDARD_DISCLAIMER} />
      ) : null}

      <DoctrineProseBlock
        label="Why this page is built this way"
        text="Debt-collection civil procedure is set by each state's own legislature and courts, and it changes over time. Rather than presenting a full Texas-specific playbook we cannot currently verify, this page draws the line clearly: one real, cited Texas note, a full set of federal protections that apply regardless of state, and an explicit list of exactly what still needs local verification."
      />
    </DoctrineArticleShell>
  );
}
