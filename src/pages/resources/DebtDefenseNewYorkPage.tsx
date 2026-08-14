/**
 * `/resources/debt-defense-new-york`
 *
 * C4 — state-specific debt-defense landing page (highest compliance scrutiny in the plan, per
 * C0.3). New York carries the single most distinct, well-documented state-specific civil-procedure
 * citation in `debtLitigationDoctrineRepo.ts`: N.Y. C.P.L.R. § 3218, as amended 2019, restricting
 * confessions of judgment against non-New-York-resident debtors in consumer-style transactions —
 * cited across all three merchant-cash-advance-phase entries (`pre_suit_validation`,
 * `summons_answer`, `post_judgment_emergency`). Every other claim on this page is general federal
 * doctrine — this page does not invent additional New York-specific statute numbers, answer
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
import { DoctrineArticleShell } from '../../components/resources/DoctrineArticleShell';
import {
  DoctrineSectionHeading,
  DoctrineFieldList,
  DoctrineProseBlock,
  StateLawScrutinyBanner,
} from '../../components/resources/DoctrineArticleParts';
import { DebtLitigationPlaybookCard } from '../../components/resources/DebtLitigationPlaybookCard';

export default function DebtDefenseNewYorkPage() {
  const mcaPreSuit = getPlaybook('merchant_cash_advance', 'pre_suit_validation');
  const mcaSummonsAnswer = getPlaybook('merchant_cash_advance', 'summons_answer');
  const mcaPostJudgment = getPlaybook('merchant_cash_advance', 'post_judgment_emergency');
  const consumerSummonsAnswer = getPlaybook('credit_card', 'summons_answer');
  const consumerPostJudgment = getPlaybook('credit_card', 'post_judgment_emergency');

  return (
    <DoctrineArticleShell
      seo={{
        title: 'Debt Defense in New York — Confession-of-Judgment Protections & Federal Rights',
        description:
          "New York is one of the few states with a documented, specific civil-procedure protection against confessions of judgment (N.Y. C.P.L.R. § 3218) — plus the federal FDCPA, garnishment-cap, and post-judgment rights every state shares. What's New York-specific here, and what still requires a New York attorney to confirm.",
        path: '/resources/debt-defense-new-york',
      }}
      badge="Debt defense · New York"
      kicker="Debt defense · state-specific · highest compliance scrutiny"
      title="Debt defense in New York —"
      accentWord="a real, documented state-specific protection."
      subtitle="New York has one of the clearest state-specific civil-procedure rules in our doctrine records: a 2019 amendment restricting confessions of judgment against non-New-York-resident debtors. This page is explicit about that citation, the federal rights every state shares, and what still requires a New York attorney to confirm."
      sourceNote="Sourced from Finely Cred's debt-litigation doctrine repository (debtLitigationDoctrineRepo.ts), merchant-cash-advance entries — no fabricated New York statute numbers or deadlines beyond what is cited below."
      accent="rose"
      chatRoleId="dispute_coach"
      chatGoal="debt"
      chatRoleLabel="debt defense"
      chatSubline="Found out a confession of judgment was entered against your business? Ask before you lose more time."
      relatedLinks={[
        { label: 'Debt defense in Texas', to: '/resources/debt-defense-texas' },
        { label: 'Debt defense in Pennsylvania', to: '/resources/debt-defense-pennsylvania' },
        { label: 'Post-judgment garnishment exemptions (general)', to: '/resources/debt-defense-post-judgment' },
        { label: 'Answering a debt collection lawsuit (general)', to: '/resources/debt-defense-summons-answer' },
      ]}
      complianceNote="New York law changes over time and this page is general information, not legal advice. Results vary · not a substitute for advice from a licensed attorney in New York · individual eligibility, procedure, deadlines, and outcomes depend on your own circumstances, the specific court, and current New York and federal law."
    >
      <StateLawScrutinyBanner stateName="New York" />

      <section className="rounded-[1.25rem] border border-rose-400/25 bg-rose-500/[0.04] p-5">
        <DoctrineSectionHeading Icon={ShieldAlert} title="What's verified as New York-specific in our records" eyebrow="1 statute, cited 3×" />
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Our doctrine repository cites this specific New York statute across every merchant-cash-advance-debt phase
          (pre-suit review, summons/answer, and post-judgment):
        </p>
        <blockquote className="mt-3 rounded-xl border border-white/10 bg-black/30 p-4 text-sm italic leading-relaxed text-white/75">
          &ldquo;N.Y. C.P.L.R. § 3218, as amended 2019 — restricts New York courts from entering confessions of judgment
          against non-New-York-resident debtors in consumer-style transactions; several other states have separately
          restricted or scrutinized confession-of-judgment clauses used by MCA funders.&rdquo;
        </blockquote>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          A confession of judgment (COJ) is a clause where a borrower pre-signs an agreement letting a creditor enter a
          judgment against them without a lawsuit or a hearing — historically used heavily by merchant-cash-advance
          funders and often filed in New York courts regardless of where the borrower actually operates. This 2019
          amendment is real, specific, and directly relevant if a New York COJ has been (or could be) filed against a
          non-New-York business or guarantor. It does not eliminate every COJ risk, and other states have separately
          restricted COJ use in ways not detailed in our records — confirm the current statute and how it applies to
          your specific contract with a New York-licensed attorney.
        </p>
      </section>

      <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
        <DoctrineSectionHeading
          Icon={Gavel}
          title="Confession-of-judgment doctrine, by phase"
          eyebrow="Merchant cash advance / business debt"
        />
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          If a confession of judgment is a live risk or has already been entered, timing is the whole game — expand a
          card for the full statutory basis and step-by-step.
        </p>
        <div className="mt-4 space-y-3">
          {mcaPreSuit ? <DebtLitigationPlaybookCard playbook={mcaPreSuit} accent="rose" defaultOpen /> : null}
          {mcaSummonsAnswer ? <DebtLitigationPlaybookCard playbook={mcaSummonsAnswer} accent="rose" /> : null}
          {mcaPostJudgment ? <DebtLitigationPlaybookCard playbook={mcaPostJudgment} accent="rose" /> : null}
        </div>
      </section>

      <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
        <DoctrineSectionHeading
          Icon={Gavel}
          title="Federal protections that apply in New York the same as everywhere else"
          eyebrow="General doctrine, not New York-specific"
        />
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          For ordinary consumer debt (not a business MCA), these federal statutes apply regardless of state.
        </p>
        <div className="mt-4 space-y-3">
          {consumerSummonsAnswer ? <DebtLitigationPlaybookCard playbook={consumerSummonsAnswer} accent="fuchsia" /> : null}
          {consumerPostJudgment ? <DebtLitigationPlaybookCard playbook={consumerPostJudgment} accent="fuchsia" /> : null}
        </div>
      </section>

      <section className="rounded-[1.25rem] border border-amber-400/25 bg-amber-500/[0.04] p-5">
        <DoctrineSectionHeading Icon={FileWarning} title="What varies by state and is NOT covered here" eyebrow="Verify locally" />
        <DoctrineFieldList
          tone="warn"
          label="Confirm each of these with a New York-licensed attorney or the current statute — not this page"
          items={[
            'Whether a specific COJ clause and forum-selection provision in your contract is actually subject to C.P.L.R. § 3218\'s restriction, versus a different state\'s COJ rules',
            'New York-specific statutes of limitation for contract/open-account consumer claims',
            'New York rules of civil procedure for service of process, answer deadlines, and discovery on ordinary (non-COJ) debt lawsuits',
            'Any New York-specific wage-garnishment percentage or bank-levy exemption procedure beyond the federal categories listed above',
          ]}
        />
      </section>

      <DoctrineProseBlock
        label="Why this page is built this way"
        text="Confession-of-judgment law is genuinely state-specific and New York's 2019 restriction is real and well-documented — but that does not make every other New York civil-procedure rule something we can responsibly assert without a verified citation. This page keeps the one real state-specific rule clearly separated from the general federal doctrine and from what still needs local verification."
      />
    </DoctrineArticleShell>
  );
}
