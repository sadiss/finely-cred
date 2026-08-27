/**
 * `/resources/diy-vs-traditional-vs-finely`
 *
 * Phase C3 — an honest, compliance-forward comparison of three ways to approach credit
 * disputes and debt defense: pure self-directed DIY, Finely Cred's done-for-you (DFY)
 * programs, and the traditional/legacy credit-repair-agency category.
 *
 * Every claim about Finely Cred below is pulled live from real platform data:
 * - Pricing and delivery mode come from `config/pricingCatalog.ts` (`getPackageById`) —
 *   never a made-up number.
 * - The "real results" section comes from `data/caseStudiesRepo.ts`'s documented personal-credit
 *   case studies, with the sample size shown honestly (same discipline as the C5 outcome wizard).
 * - Every claim about the "traditional agency" category is sourced from the Credit Repair
 *   Organizations Act (CROA), 15 U.S.C. § 1679 et seq., via `data/authorityCitationsRepo.ts` —
 *   a federal statute that regulates that category, not a claim about any named competitor.
 *   No specific competitor is named or disparaged anywhere on this page.
 *
 * Compliance: `ComplianceReviewRecord` seeded at `status: 'needs_review'`, `contentType:
 * 'public_article'` (standard 6-month cadence — this is comparative marketing content, not
 * state-specific legal doctrine, so it does not carry C0.3's `highestScrutiny` flag) — see
 * `complianceReviewRepo.ts`'s `ensureC3ComparisonPageComplianceRecordSeeded()`. Left
 * `needs_review`, not self-approved.
 */
import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, Info, Scale, Wrench } from 'lucide-react';
import { DoctrineArticleShell } from '../../components/resources/DoctrineArticleShell';
import { DoctrineSectionHeading } from '../../components/resources/DoctrineArticleParts';
import { getPackageById, formatPrice } from '../../config/pricingCatalog';
import { getCaseStudiesByCategory, getCaseStudyProofStats } from '../../data/caseStudiesRepo';
import { getCitationsForCategory } from '../../data/authorityCitationsRepo';
import { ensureC3ComparisonPageComplianceRecordSeeded } from '../../data/complianceReviewRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

const CONTENT_REF = '/resources/diy-vs-traditional-vs-finely';

type ApproachId = 'diy' | 'finely_dfy' | 'traditional_agency';

const APPROACH_META: Record<ApproachId, { label: string; sublabel: string; icon: React.ReactNode; accent: string }> = {
  diy: {
    label: 'Pure DIY',
    sublabel: 'You do it yourself',
    icon: <Wrench size={16} />,
    accent: 'text-sky-300',
  },
  finely_dfy: {
    label: 'Finely Cred DFY',
    sublabel: 'We do it with you',
    icon: <CheckCircle2 size={16} />,
    accent: 'text-emerald-300',
  },
  traditional_agency: {
    label: 'Traditional agency',
    sublabel: 'Legacy credit-repair companies',
    icon: <Building2 size={16} />,
    accent: 'text-rose-300',
  },
};

const APPROACH_ORDER: ApproachId[] = ['diy', 'finely_dfy', 'traditional_agency'];

type DimensionId = 'price_billing' | 'who_does_work' | 'legal_grounding' | 'real_results';

function priceCellFor(ids: string[], fallback: string): string {
  const prices = ids
    .map((id) => getPackageById(id))
    .filter((p): p is NonNullable<ReturnType<typeof getPackageById>> => Boolean(p))
    .map((p) => p.priceAmount);
  if (!prices.length) return fallback;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatPrice(min) : `${formatPrice(min)}\u2013${formatPrice(max)}`;
}

export default function CreditRepairComparisonPage() {
  useEffect(() => {
    ensureC3ComparisonPageComplianceRecordSeeded();
  }, []);

  const [dimension, setDimension] = useState<DimensionId>('price_billing');

  const debtDiyPrice = formatPrice(getPackageById('debt_kill_diy')?.priceAmount ?? 0);
  const debtDfyRange = priceCellFor(['debt_kill_starter_dfy', 'debt_kill_pro'], 'Custom quote');
  const personalDiyPrice = formatPrice(getPackageById('personal_starter')?.priceAmount ?? 0);
  const personalDfyRange = priceCellFor(['personal_restore_starter', 'personal_platinum'], 'Custom quote');

  const croaCitations = getCitationsForCategory('agency');
  const croaScopeCitation = croaCitations.find((c) => c.id === 'croa-1679-scope-disclosures');
  const croaNoAdvanceFeeCitation = croaCitations.find((c) => c.id === 'croa-1679b-prohibited-practices');

  const personalCaseStudies = getCaseStudiesByCategory('personal_credit');
  const personalProofStats = getCaseStudyProofStats(personalCaseStudies);
  const featuredPersonalStudies = personalCaseStudies.slice(0, 3);

  const SNAPSHOT_ROWS: Array<{ label: string; cells: Record<ApproachId, string> }> = [
    {
      label: 'Typical price model',
      cells: {
        diy: `One-time fixed fee (e.g. ${personalDiyPrice} credit-restore starter, ${debtDiyPrice} debt-defense kit)`,
        finely_dfy: `One-time fixed-fee tiers, shown before you buy (e.g. ${personalDfyRange} personal restore, ${debtDfyRange} debt & legal)`,
        traditional_agency: 'Often a recurring monthly fee — confirm the exact schedule in the written contract CROA requires',
      },
    },
    {
      label: 'Who executes the work',
      cells: {
        diy: 'You — using templates, playbooks, and a deadline tracker inside the platform',
        finely_dfy: 'A case manager/specialist drafts and coordinates each step; you review and approve',
        traditional_agency: 'Varies by provider — CROA requires the contract to say who does what before you sign',
      },
    },
    {
      label: 'Legal grounding per letter/step',
      cells: {
        diy: 'Same federal rights apply (FCRA/FDCPA) — you are responsible for citing them correctly',
        finely_dfy: 'Every letter and doctrine article cites the underlying statute and passes an internal compliance review before publishing',
        traditional_agency: 'Ask any provider for their compliance process and citation sources in writing',
      },
    },
    {
      label: 'Real, documented outcomes shown',
      cells: {
        diy: 'No comparable public data set — results depend entirely on your own execution',
        finely_dfy: personalProofStats.avgScoreLift != null
          ? `Avg. ${personalProofStats.avgScoreLift >= 0 ? '+' : ''}${personalProofStats.avgScoreLift} pts across ${personalCaseStudies.length} documented personal-credit case studies`
          : 'Documented case studies published with real, unaveraged outcomes',
        traditional_agency: 'Finely Cred has no independent data on other providers — ask for verifiable, documented outcomes before signing',
      },
    },
    {
      label: 'Advance-fee & cancellation protection',
      cells: {
        diy: 'Pay once for tools — no ongoing contract to cancel',
        finely_dfy: 'Scope and price disclosed upfront on /pricing before checkout',
        traditional_agency: 'CROA (15 U.S.C. § 1679b) bars charging before work is performed and guarantees a 3-business-day right to cancel',
      },
    },
  ];

  const DIMENSIONS: Array<{
    id: DimensionId;
    label: string;
    icon: React.ReactNode;
    detail: Record<ApproachId, string>;
  }> = [
    {
      id: 'price_billing',
      label: 'Price & billing',
      icon: <Scale size={14} />,
      detail: {
        diy: `Pure DIY tools are sold as a single one-time fee — for example the Credit Starter kit (${personalDiyPrice}) or the Debt Kill DIY Kit (${debtDiyPrice}). You pay once and keep the templates, deadline tracker, and playbooks.`,
        finely_dfy: `Finely Cred's done-for-you tiers are also fixed, one-time fees shown in full on /pricing before checkout — personal restore runs ${personalDfyRange}, debt & legal DFY runs ${debtDfyRange}, scaling with case complexity, not open-ended monthly billing.`,
        traditional_agency: `${croaScopeCitation?.marketingSafeSummary ?? 'Credit repair services are governed by a federal law (CROA) that requires clear contracts, honest disclosures, and a right to cancel.'} ${croaNoAdvanceFeeCitation?.marketingSafeSummary ?? ''}`,
      },
    },
    {
      id: 'who_does_work',
      label: 'Who does the work',
      icon: <Wrench size={14} />,
      detail: {
        diy: 'You control every step: pulling reports, choosing dispute reasons, drafting letters from templates, and tracking deadlines yourself inside the portal.',
        finely_dfy: "A dedicated case manager or specialist drafts the strategy, packet, and letters, coordinates evidence, and tracks every deadline — you stay informed and approve, but don't have to draft anything yourself.",
        traditional_agency: 'This varies by provider and is exactly what CROA requires the written contract to spell out before you sign — ask any company for that contract in writing before paying anything.',
      },
    },
    {
      id: 'legal_grounding',
      label: 'Legal grounding',
      icon: <Info size={14} />,
      detail: {
        diy: 'The same federal statutes (FCRA, FDCPA) protect you either way — DIY just means you are personally responsible for citing the right section and following the right procedure.',
        finely_dfy: "Every Finely Cred doctrine article and dispute-letter footnote cites the actual statute (FCRA/FDCPA/ECOA) it relies on, and new public content passes an internal legal-compliance review — with a re-verification cadence — before it's treated as publish-ready.",
        traditional_agency: 'Federal law prohibits misleading statements about your file or the credit-repair process (CROA, 15 U.S.C. § 1679b) — but Finely Cred cannot verify any other specific provider\u2019s process. Ask directly.',
      },
    },
    {
      id: 'real_results',
      label: 'Real results (personal credit)',
      icon: <CheckCircle2 size={14} />,
      detail: {
        diy: "Finely Cred does not maintain a comparable outcome data set for pure self-directed DIY dispute work — those results depend entirely on the individual's own effort, documentation, and follow-through, and are not tracked on this platform.",
        finely_dfy: personalProofStats.avgScoreLift != null
          ? `Across ${personalCaseStudies.length} documented personal-credit case studies, the average score change is ${personalProofStats.avgScoreLift >= 0 ? '+' : ''}${personalProofStats.avgScoreLift} points. That is a small, disclosed sample — not a guarantee — see the individual case studies below.`
          : 'See the individual, documented case studies below for real (not hypothetical) outcomes.',
        traditional_agency: 'Finely Cred has no independent visibility into other providers\u2019 documented outcomes. A provider that cannot show real, verifiable case data on request is worth a second look.',
      },
    },
  ];

  const activeDimension = DIMENSIONS.find((d) => d.id === dimension) ?? DIMENSIONS[0];

  return (
    <DoctrineArticleShell
      seo={{
        title: 'DIY vs. Done-For-You vs. Traditional Credit Repair — An Honest Comparison',
        description:
          'A factual, feature-based comparison of pure self-directed DIY dispute work, Finely Cred\u2019s done-for-you programs, and the traditional credit-repair-agency category — price, who does the work, legal grounding, and real documented outcomes.',
        path: CONTENT_REF,
      }}
      badge="Comparison"
      kicker="Honest comparison · no disparagement"
      title="DIY, done-for-you, or a traditional agency —"
      accentWord="here's what actually differs."
      subtitle="Same federal rights apply no matter which path you pick. Here's a factual, feature-based look at price, who does the work, how deep the legal grounding goes, and what real results actually look like — sourced from our own pricing and case-study data, not marketing claims about any specific competitor."
      sourceNote="Finely Cred figures sourced from pricingCatalog.ts and caseStudiesRepo.ts. Traditional-agency figures sourced from the Credit Repair Organizations Act (CROA), 15 U.S.C. § 1679 et seq. — a federal statute, not a claim about any named company."
      accent="sky"
      chatRoleId="finely_advisor"
      chatGoal="not_sure"
      chatRoleLabel="which approach fits"
      chatSubline="Not sure whether DIY or done-for-you fits your situation? Ask before you decide."
      relatedLinks={[
        { label: 'Which program fits your situation? (free wizard)', to: '/resources/which-program-fits' },
        { label: 'See pricing & packages', to: '/pricing' },
        { label: 'Debt validation letters & cease-communication rights', to: '/resources/debt-defense-validation-letters' },
      ]}
    >
      {/* ── Always-visible snapshot grid ─────────────────────────────────── */}
      <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
        <DoctrineSectionHeading title="At a glance" eyebrow="Snapshot, not the full picture" />
        <div className="mt-3 overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[1.1fr_1fr_1fr_1fr] gap-2">
              <div />
              {APPROACH_ORDER.map((id) => (
                <div key={id} className={`flex items-center gap-1.5 px-2 pb-2 text-xs font-black uppercase tracking-wide ${APPROACH_META[id].accent}`}>
                  {APPROACH_META[id].icon} {APPROACH_META[id].label}
                </div>
              ))}
              {SNAPSHOT_ROWS.map((row) => (
                <React.Fragment key={row.label}>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} flex items-center border-t border-white/10 py-3`}>{row.label}</div>
                  {APPROACH_ORDER.map((id) => (
                    <div
                      key={id}
                      className="flex items-center border-t border-white/10 py-3 pr-2 text-xs leading-relaxed text-white/70"
                    >
                      {row.cells[id]}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Dimension deep-dive (chip toggle, no native <select>) ────────── */}
      <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
        <DoctrineSectionHeading title="Go deeper on one dimension" eyebrow="Pick a topic" />
        <div className="mt-3 flex flex-wrap gap-2">
          {DIMENSIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDimension(d.id)}
              className={`${finelyOsViewTab(dimension === d.id, 'sky')} inline-flex items-center gap-1.5`}
            >
              {d.icon} {d.label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {APPROACH_ORDER.map((id) => (
            <div key={id} className={finelyOsCatalogCard(id === 'finely_dfy' ? 'emerald' : id === 'diy' ? 'sky' : 'rose')} data-fc-accent={id === 'finely_dfy' ? 'emerald' : id === 'diy' ? 'sky' : 'rose'}>
              <div className={`flex items-center gap-1.5 text-sm font-black uppercase tracking-wide ${APPROACH_META[id].accent}`}>
                {APPROACH_META[id].icon} {APPROACH_META[id].label}
              </div>
              <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>{APPROACH_META[id].sublabel}</div>
              <p className={`mt-3 text-base leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>{activeDimension.detail[id]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Real, documented outcomes (never hypothetical) ───────────────── */}
      <section className="rounded-[1.25rem] border border-emerald-400/20 bg-emerald-500/[0.04] p-5">
        <DoctrineSectionHeading title="Real documented outcomes — Finely Cred DFY, personal credit" eyebrow="Not hypothetical" />
        <p className={`mt-2 text-sm leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>
          {personalProofStats.avgScoreLift != null ? (
            <>
              Across <span className={FINELY_OS_ENTITY_VALUE}>{personalCaseStudies.length}</span> documented personal-credit case
              studies below, the average score change is{' '}
              <span className={FINELY_OS_ENTITY_VALUE}>
                {personalProofStats.avgScoreLift >= 0 ? '+' : ''}
                {personalProofStats.avgScoreLift} points
              </span>
              . That is the full, disclosed sample size — not a marketing average pulled from a larger, unseen pool.
            </>
          ) : (
            'See the individual case studies below.'
          )}
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {featuredPersonalStudies.map((s) => (
            <div key={s.id} className="rounded-xl border border-white/10 bg-black/25 p-3.5">
              <div className="text-xs font-bold text-emerald-200">{s.partnerAlias}</div>
              <div className="mt-1 text-sm font-semibold text-white">{s.title}</div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide text-white/50">
                {typeof s.startingScore === 'number' && typeof s.endingScore === 'number' ? (
                  <span className={FINELY_OS_ENTITY_CHIP}>
                    {s.startingScore} → {s.endingScore}
                  </span>
                ) : null}
                <span className={FINELY_OS_ENTITY_CHIP}>{s.timeframeWeeks} weeks</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-white/40">
          Results vary. Individual outcomes depend on your unique credit profile, income, documentation, and cooperation with the
          process. This is not legal advice. Finely Cred does not maintain a comparable data set for pure DIY outcomes or for any
          other provider.
        </p>
      </section>
    </DoctrineArticleShell>
  );
}
