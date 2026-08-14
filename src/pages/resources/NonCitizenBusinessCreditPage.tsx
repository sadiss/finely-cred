/**
 * `/resources/non-citizen-business-credit`
 *
 * C1 doctrine article resolving the B3/C1 overlap (round3_final_phases_C0_C_G_D.md §0.2) — this
 * IS B3's public surface, not a separate build. Content pulled from
 * `internationalAndNonCitizenCreditRepo.ts`'s `NON_CITIZEN_FUNDING_RULES`, the same structured
 * data the gated portal panel at `BusinessProfilePage.tsx` already renders (reused, not rebuilt),
 * presented here as static/SEO-readable prose + tables instead of the interactive chip-picker.
 */
import React from 'react';
import { Globe2 } from 'lucide-react';
import {
  getFundingRulesForApplicantType,
  type NonCitizenFundingRule,
} from '../../data/internationalAndNonCitizenCreditRepo';
import { DoctrineArticleShell } from '../../components/resources/DoctrineArticleShell';
import { DoctrineSectionHeading } from '../../components/resources/DoctrineArticleParts';
import { NonCitizenFundingRuleCard } from '../../components/resources/NonCitizenFundingRuleCard';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_CHIP, finelyOsCatalogCardCompact } from '../../features/os/finelyOsLightUi';

const APPLICANT_TYPES: Array<{ type: NonCitizenFundingRule['applicantType']; label: string; blurb: string }> = [
  {
    type: 'itin_holder',
    label: 'ITIN holder',
    blurb: 'Owns a U.S.-registered entity and files taxes with an ITIN rather than an SSN.',
  },
  {
    type: 'foreign_national_e2_eb5',
    label: 'E-2 / EB-5 foreign national investor',
    blurb: 'Holds a treaty-investor or immigrant-investor visa tied to a documented capital investment.',
  },
  {
    type: 'non_resident_llc',
    label: 'Non-resident-owned U.S. LLC',
    blurb: 'Never enters the U.S. to operate the business; owns a U.S. LLC remotely.',
  },
  {
    type: 'daca_recipient',
    label: 'DACA recipient',
    blurb: 'Has a valid SSN via Employment Authorization Document (EAD) — different underwriting posture than ITIN-only applicants.',
  },
  {
    type: 'green_card_holder',
    label: 'Green card holder (LPR)',
    blurb: 'Lawful permanent resident — generally satisfies the same ownership tests as a U.S. citizen owner.',
  },
];

const ACCENTS = ['violet', 'sky', 'amber', 'emerald', 'fuchsia'] as const;

export default function NonCitizenBusinessCreditPage() {
  return (
    <DoctrineArticleShell
      seo={{
        title: 'Non-Citizen & International Business Credit — Funding Paths by Applicant Type',
        description:
          'Business funding paths for ITIN holders, E-2/EB-5 investors, non-resident LLC owners, DACA recipients, and green card holders — real underwriting optics, SSN/ITIN requirements, and alternative proof documents for each loan type.',
        path: '/resources/non-citizen-business-credit',
      }}
      badge="Business credit"
      kicker="Business credit · non-citizen & international"
      title="Not a U.S. citizen?"
      accentWord="Here is what actually funds a business."
      subtitle="Eligibility, documentation, and underwriting appetite vary by visa/immigration status, lender policy, and current regulation — all of which change over time. Below is a realistic, honest breakdown by applicant type, sourced from Finely Cred's international & non-citizen credit repository — the same data our gated partner tool uses."
      sourceNote="Sourced from Finely Cred's international & non-citizen credit repository — general educational guidance only, not legal, immigration, or lending advice."
      accent="violet"
      chatRoleId="funding_strategist"
      chatGoal="business"
      chatRoleLabel="funding strategy"
      chatSubline="Not sure which applicant-type bucket fits your situation? Ask before you apply anywhere."
      relatedLinks={[
        { label: 'How credit reporting works abroad', to: '/resources/international-credit-systems-guide' },
        { label: 'Business credit tier matrix', to: '/resources/business-credit-tier-matrix' },
        { label: 'Business funding instruments landscape', to: '/resources/business-credit-funding-instruments' },
      ]}
    >
      <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
        <DoctrineSectionHeading Icon={Globe2} title="Funding paths by applicant type" eyebrow={`${APPLICANT_TYPES.length} applicant types`} />
        <div className="mt-4 space-y-4">
          {APPLICANT_TYPES.map((applicant, i) => {
            const rules = getFundingRulesForApplicantType(applicant.type);
            if (!rules.length) return null;
            return (
              <div key={applicant.type} className={finelyOsCatalogCardCompact(ACCENTS[i % ACCENTS.length])}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={FINELY_OS_ENTITY_CHIP}>{rules.length} loan types</span>
                  <span className="text-base font-bold text-white">{applicant.label}</span>
                </div>
                <p className={`mt-1.5 text-sm ${FINELY_OS_ENTITY_BODY}`}>{applicant.blurb}</p>
                <div className="mt-3 space-y-2.5">
                  {rules.map((rule, j) => (
                    <NonCitizenFundingRuleCard key={rule.id} rule={rule} accent={ACCENTS[i % ACCENTS.length]} defaultOpen={j === 0} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.25rem] border border-amber-400/25 bg-amber-500/[0.05] p-5">
        <h2 className="text-base font-bold text-amber-100">On the SBA's citizenship/LPR ownership rule</h2>
        <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
          Several applicant types above cannot satisfy SBA 7(a)'s requirement that the business be at least 51% owned and
          controlled by U.S. citizens or lawful permanent residents as a sole/majority owner — this shows up consistently
          across the ITIN, E-2, and DACA rows. Where the source data says this is unsettled or evolving (DACA in
          particular), this page carries the same hedge rather than asserting a single answer.
        </p>
      </section>
    </DoctrineArticleShell>
  );
}
