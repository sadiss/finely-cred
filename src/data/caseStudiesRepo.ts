import type { PricingCategory } from '../config/pricingCatalog';

/**
 * CASE STUDIES REPOSITORY
 *
 * Structured, compliant proof-of-results content for the public site (homepage
 * "Proven results" strip, /pricing category pages, and future case-study detail
 * views). Every entry uses an alias (first name + last initial + city/state) —
 * never a full name — and carries a standard disclaimer near any numbers.
 *
 * Legal citations are grounded in real federal law (FCRA, FDCPA, ECOA, UCC
 * Article 9, GLBA) and are short-form statutory references only — never
 * fabricated case numbers or court citations.
 */

export interface CaseStudy {
  id: string;
  category: PricingCategory | 'heta_society';
  title: string;
  /** First name + last initial + city/state only — never full names, for privacy/compliance. */
  partnerAlias: string;
  startingScore?: number;
  endingScore?: number;
  fundingSecured?: string;
  timeframeWeeks: number;
  summary: string;
  challenge: string;
  strategyApplied: string;
  statutoryBasis: string[];
  outcomes: string[];
  disclaimer: string;
}

const STANDARD_DISCLAIMER =
  'Results vary. Individual outcomes depend on your unique credit profile, income, documentation, and cooperation with the process. This is not legal advice.';

const FCRA_REINVESTIGATION = '15 U.S.C. § 1681i (reasonable reinvestigation)';
const FCRA_FURNISHER_ACCURACY = '15 U.S.C. § 1681s-2(a) (furnisher duty to report accurately)';
const FCRA_FURNISHER_DISPUTE_DUTY = '15 U.S.C. § 1681s-2(b) (furnisher duties after dispute notice)';
const FCRA_MAX_ACCURACY = '15 U.S.C. § 1681e(b) (reasonable procedures for max possible accuracy)';
const FCRA_OBSOLETE_INFO = '15 U.S.C. § 1681c (obsolete information / reporting time limits)';
const FCRA_PERMISSIBLE_PURPOSE = '15 U.S.C. § 1681b (permissible purpose for inquiries/reporting)';
const REG_V = 'Regulation V, 12 C.F.R. Part 1022 (FCRA implementing regulation)';
const FDCPA_VALIDATION = 'FDCPA 15 U.S.C. § 1692g (debt validation)';
const FDCPA_FALSE_REPS = 'FDCPA 15 U.S.C. § 1692e (false or misleading representations)';
const FDCPA_COMMUNICATION = 'FDCPA 15 U.S.C. § 1692c (communication restrictions)';
const FDCPA_UNFAIR_PRACTICES = 'FDCPA 15 U.S.C. § 1692f (unfair collection practices)';
const ECOA = 'ECOA 15 U.S.C. § 1691 (equal credit opportunity, incl. business credit)';
const UCC_ARTICLE_9 = 'UCC Article 9 (secured transactions / financing statement filings)';
const GLBA_PRIVACY = 'GLBA 15 U.S.C. § 6801 (financial privacy safeguards)';
const CFPB_GUIDANCE = 'CFPB Supervisory guidance on furnisher accuracy (Regulation V)';

export const CASE_STUDIES: CaseStudy[] = [
  // ── PERSONAL CREDIT (5) ─────────────────────────────────────────────────
  {
    id: 'cs_personal_marcus_miami',
    category: 'personal_credit',
    title: 'From charged-off chaos to a 671 in four months',
    partnerAlias: 'Marcus T. — Miami, FL',
    startingScore: 528,
    endingScore: 671,
    timeframeWeeks: 16,
    summary: 'Three charged-off accounts and mismatched late-payment histories across all three bureaus were quietly capping every application Marcus submitted.',
    challenge:
      'Marcus arrived with three charged-off accounts reporting inconsistent balances between Equifax, Experian, and TransUnion, plus a cluster of 30/60/90-day lates that did not match his own bank records.',
    strategyApplied:
      'Round-one factual disputes were filed against each furnisher, citing the exact field-level mismatches (balance, date of first delinquency, payment history) rather than generic "not mine" language. Evidence packets included his statements as the factual basis for each finding.',
    statutoryBasis: [FCRA_REINVESTIGATION, FCRA_FURNISHER_ACCURACY, FCRA_MAX_ACCURACY],
    outcomes: [
      'Two of three charged-off accounts corrected to accurate balances; one removed for unverifiable reporting',
      'Score moved 528 → 671 across four dispute rounds',
      'Qualified for a standard auto loan at a mainstream rate for the first time in three years',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },
  {
    id: 'cs_personal_renee_columbus',
    category: 'personal_credit',
    title: 'Untangling identity-theft accounts bureau by bureau',
    partnerAlias: 'Renee K. — Columbus, OH',
    startingScore: 542,
    endingScore: 698,
    timeframeWeeks: 20,
    summary: 'A prior identity-theft incident had left four fraudulent accounts and two collections still reporting years later.',
    challenge:
      'Renee had filed an FTC identity theft report years earlier, but four fraudulent tradelines and two related collection accounts were still live on her file, dragging her score down and blocking a mortgage pre-approval.',
    strategyApplied:
      'Built an evidence-first fraud packet (FTC report, police report, sworn statement) and filed block requests with each bureau alongside furnisher-level disputes, tracking each 30-day reinvestigation window.',
    statutoryBasis: [FCRA_REINVESTIGATION, FCRA_FURNISHER_DISPUTE_DUTY, FCRA_OBSOLETE_INFO],
    outcomes: [
      'All four fraudulent tradelines blocked/removed; two collections deleted',
      'Score moved 542 → 698 over five months',
      'Cleared underwriting conditions for a mortgage pre-approval',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },
  {
    id: 'cs_personal_david_phoenix',
    category: 'personal_credit',
    title: 'Medical collections cleared, score up 144 points',
    partnerAlias: 'David O. — Phoenix, AZ',
    startingScore: 561,
    endingScore: 705,
    timeframeWeeks: 12,
    summary: 'Five small-dollar medical collections and a stack of hard inquiries were the entire story holding David back.',
    challenge:
      'David had five medical collection accounts under $500 each and eleven inquiries from a short shopping spree two years prior — no other negative history.',
    strategyApplied:
      'Filed direct furnisher disputes on each medical collection citing missing itemized billing documentation, and permissible-purpose challenges on inquiries older than the applicable review window.',
    statutoryBasis: [FCRA_FURNISHER_DISPUTE_DUTY, FCRA_PERMISSIBLE_PURPOSE, REG_V],
    outcomes: [
      'All five medical collections deleted for lack of verifiable documentation',
      'Seven of eleven inquiries removed',
      'Score moved 561 → 705 in twelve weeks',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },
  {
    id: 'cs_personal_priya_charlotte',
    category: 'personal_credit',
    title: 'Student loan servicer errors corrected in ten weeks',
    partnerAlias: 'Priya S. — Charlotte, NC',
    startingScore: 580,
    endingScore: 714,
    timeframeWeeks: 10,
    summary: 'A student loan servicer transfer created duplicate accounts and phantom late payments that never should have posted.',
    challenge:
      'When Priya\'s loan servicer changed, the new servicer reported the account as a fresh tradeline with 90-day lates during a period she was actually in an approved forbearance.',
    strategyApplied:
      'Used the Letter Pack — Student Loans workflow to compile forbearance approval letters and dispute the duplicate tradeline and phantom lates directly with the new servicer and all three bureaus.',
    statutoryBasis: [FCRA_FURNISHER_ACCURACY, FCRA_REINVESTIGATION],
    outcomes: [
      'Duplicate tradeline removed; forbearance-period lates corrected to current',
      'Score moved 580 → 714 in ten weeks',
      'Approved for a rental lease without a co-signer',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },
  {
    id: 'cs_personal_latoya_atlanta',
    category: 'personal_credit',
    title: 'A heavy file — charge-offs, repo, and a stale bankruptcy — rebuilt from 515',
    partnerAlias: 'Latoya B. — Atlanta, GA',
    startingScore: 515,
    endingScore: 662,
    timeframeWeeks: 24,
    summary: 'Multiple charge-offs, a repossession, and remnants of a discharged bankruptcy made this one of the heavier files in the portal.',
    challenge:
      'Latoya\'s file included four charge-off accounts, a vehicle repossession still showing a balance after the deficiency was resolved, and a discharged bankruptcy where two accounts still reported as active/past due.',
    strategyApplied:
      'Sequenced disputes over six structured rounds: post-discharge accounts first (citing the discharge order and reporting-status rules), then the repossession deficiency balance, then the charge-offs with documentation gaps.',
    statutoryBasis: [FCRA_FURNISHER_ACCURACY, FCRA_REINVESTIGATION, FCRA_OBSOLETE_INFO],
    outcomes: [
      'Both post-discharge accounts corrected to $0 balance / discharged status',
      'Repossession balance corrected to reflect deficiency resolution',
      'Score moved 515 → 662 across six months of sequenced rounds',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },

  // ── BUSINESS CREDIT (5) ─────────────────────────────────────────────────
  {
    id: 'cs_business_new_llc_foundation',
    category: 'business_credit',
    title: 'New LLC to $22,000 in reporting vendor lines in 8 weeks',
    partnerAlias: 'Jordan A. — Tampa, FL',
    fundingSecured: '$22,000',
    timeframeWeeks: 8,
    summary: 'A brand-new LLC with no trade history went from zero fundability signals to a working net-30 vendor stack.',
    challenge:
      'Jordan\'s LLC was six weeks old with no D-U-N-S alignment, an inconsistent business address across directories, and zero reporting trade history — a fundability profile lenders and vendors could not underwrite.',
    strategyApplied:
      'Ran the Business Foundation sequence: entity/EIN/address/domain hygiene, D-U-N-S and commercial bureau alignment, then a Tier-1 net-30 vendor path chosen for fast, reliable reporting.',
    statutoryBasis: [ECOA, UCC_ARTICLE_9],
    outcomes: [
      'Fundability scorecard cleared for lender-visible reporting within three weeks',
      'Three Tier-1 vendor accounts opened and reporting on schedule',
      'Approximately $22,000 in aggregate vendor lines secured within eight weeks',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },
  {
    id: 'cs_business_established_builder',
    category: 'business_credit',
    title: 'Full Tier 1–4 sequencing lands $85,000 in funding-ready capacity',
    partnerAlias: 'Coleman R. — Denver, CO',
    fundingSecured: '$85,000',
    timeframeWeeks: 16,
    summary: 'An established two-year-old business with thin trade depth needed a full sequencing plan to reach funding-ready status.',
    challenge:
      'Coleman\'s business had revenue but almost no reporting trade depth — a single vendor account and no store or fleet cards — leaving it invisible to most business lenders.',
    strategyApplied:
      'Executed the full Business Builder sequence across Tier 1–4 vendors and store cards, with a monitoring cadence to confirm on-time reporting before layering in the next tier.',
    statutoryBasis: [ECOA, UCC_ARTICLE_9],
    outcomes: [
      'Trade lines expanded from 1 to 11 reporting accounts',
      'Funding readiness assessment cleared for business term-loan applications',
      'Approximately $85,000 in aggregate business credit capacity secured',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },
  {
    id: 'cs_business_elite_named_lender',
    category: 'business_credit',
    title: 'Named-lender product ladder delivers $210,000 in five months',
    partnerAlias: 'Anthony V. — Dallas, TX',
    fundingSecured: '$210,000',
    timeframeWeeks: 20,
    summary: 'A dedicated funding strategist and underwriting-ready packaging turned a mid-size contracting business into a six-figure funding story.',
    challenge:
      'Anthony\'s contracting business had decent revenue and a clean two-year history, but disorganized financial documentation was causing named-lender declines before underwriting even began.',
    strategyApplied:
      'Used the Business Elite lender-ready packaging process — reconciled financials, a named card/lender product ladder sequenced by approval likelihood, and a dedicated strategist cadence.',
    statutoryBasis: [ECOA, UCC_ARTICLE_9],
    outcomes: [
      'Approved across four named business credit products in sequence',
      'Approximately $210,000 in aggregate funding secured within five months',
      'Underwriting-ready documentation packet reused for a follow-on equipment loan',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },
  {
    id: 'cs_business_empire_multi_entity',
    category: 'business_credit',
    title: 'Multi-entity operator reaches $475,000 in aggregate capacity',
    partnerAlias: 'Whitfield & Co. principal — Houston, TX',
    fundingSecured: '$475,000',
    timeframeWeeks: 24,
    summary: 'A three-entity operation needed war-room-level coordination to avoid cross-entity underwriting conflicts while scaling capital access.',
    challenge:
      'Managing fundability across three related entities meant any misstep — shared addresses, overlapping guarantors, inconsistent EIN records — could trigger declines across the whole structure at once.',
    strategyApplied:
      'Ran the Business Empire executive cadence: weekly war-room reviews, custom capital packaging per entity, and priority sequencing on named products to avoid simultaneous hard-pull collisions.',
    statutoryBasis: [ECOA, UCC_ARTICLE_9],
    outcomes: [
      'All three entities reached independent fundability status',
      'Approximately $475,000 in aggregate business credit capacity secured across the structure',
      'Zero cross-entity underwriting conflicts during the sequencing window',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },
  {
    id: 'cs_business_service_llc_foundation',
    category: 'business_credit',
    title: 'Service-based LLC builds $31,000 in vendor capacity in ten weeks',
    partnerAlias: 'Simone D. — Raleigh, NC',
    fundingSecured: '$31,000',
    timeframeWeeks: 10,
    summary: 'A solo consulting LLC used the Foundation sequence to move from personal-guarantee dependence to standalone business credit.',
    challenge:
      'Simone was funding her consulting practice entirely on personal credit cards, with no separation between personal and business liability.',
    strategyApplied:
      'Foundation-tier entity hygiene followed by a Tier-1 vendor path selected for consulting-industry relevance (software, supplies, professional services net-30s).',
    statutoryBasis: [ECOA, UCC_ARTICLE_9],
    outcomes: [
      'Four vendor accounts opened and reporting under the business EIN only',
      'Approximately $31,000 in vendor credit capacity secured',
      'Personal credit utilization dropped as business spend shifted off personal cards',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },

  // ── DEBT & LEGAL (5) ────────────────────────────────────────────────────
  {
    id: 'cs_debt_pro_fdcpa_violation',
    category: 'debt_legal',
    title: 'Validation packet exposes an FDCPA violation, $18,400 collection removed',
    partnerAlias: 'Reginald P. — Detroit, MI',
    fundingSecured: '$18,400',
    timeframeWeeks: 8,
    summary: 'A validation request went unanswered within the required window, and the collector kept reporting anyway.',
    challenge:
      'A third-party collector was reporting an $18,400 charged-off account without ever furnishing proof of the debt after Reginald requested validation in writing.',
    strategyApplied:
      'Used the Debt Kill Pro workflow to send a formal validation request, document the collector\'s non-response window, and file a furnisher dispute citing the unresolved validation status.',
    statutoryBasis: [FDCPA_VALIDATION, FDCPA_FALSE_REPS, FCRA_FURNISHER_DISPUTE_DUTY],
    outcomes: [
      'Collector failed to validate within the required window',
      'Account removed from all three credit reports',
      '$18,400 collection balance no longer reporting or being pursued',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },
  {
    id: 'cs_debt_plus_multi_account',
    category: 'debt_legal',
    title: 'Multi-account collector activity resolved: $52,000 across four accounts',
    partnerAlias: 'Carla N. — Las Vegas, NV',
    fundingSecured: '$52,000',
    timeframeWeeks: 14,
    summary: 'Four separate collectors were pursuing overlapping accounts, some with conflicting balances for the same underlying debt.',
    challenge:
      'Carla had four collection accounts totaling roughly $52,000, two of which appeared to be duplicate placements of the same original debt sold to different agencies.',
    strategyApplied:
      'Sequenced validation requests across all four collectors simultaneously, cross-referenced original creditor statements to identify the duplicate placement, and disputed the duplicate directly.',
    statutoryBasis: [FDCPA_VALIDATION, FDCPA_UNFAIR_PRACTICES, FCRA_FURNISHER_ACCURACY],
    outcomes: [
      'Duplicate placement removed after original-creditor cross-reference',
      'Remaining balances resolved through negotiated settlement and reporting cleanup',
      '$52,000 in collection activity fully resolved across four accounts',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },
  {
    id: 'cs_debt_high_balance_negotiated',
    category: 'debt_legal',
    title: 'High-balance collector activity negotiated down and off the credit file',
    partnerAlias: 'Terrence H. — San Antonio, TX',
    fundingSecured: '$76,000',
    timeframeWeeks: 18,
    summary: 'A $76,000 charged-off business-guarantee debt needed a validation-first strategy before any negotiation began.',
    challenge:
      'Terrence had personally guaranteed a $76,000 business line that charged off after the business closed, and an aggressive collector was calling daily in violation of standard communication limits.',
    strategyApplied:
      'Sent a cease-and-desist-style communication restriction request, ran full validation, then moved into a documented settlement negotiation only after the debt was validated and communication was brought into compliance.',
    statutoryBasis: [FDCPA_COMMUNICATION, FDCPA_VALIDATION, FDCPA_UNFAIR_PRACTICES],
    outcomes: [
      'Collector communication brought into compliance within one week of the restriction request',
      'Debt settled below the reported balance with a documented pay-for-delete agreement',
      'Account removed from all three credit reports upon settlement completion',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },
  {
    id: 'cs_debt_starter_early_stage',
    category: 'debt_legal',
    title: 'Early-stage collector activity stopped before it ever hit the credit file',
    partnerAlias: 'Michael G. — Portland, OR',
    timeframeWeeks: 6,
    summary: 'Catching a new collection letter early meant Michael never had to deal with the credit-report side of a dispute at all.',
    challenge:
      'Michael received his first collection letter for a $2,900 balance he believed was already paid, and wanted to resolve it before it could post to his credit file.',
    strategyApplied:
      'Used the Debt Kill Starter workflow to send an immediate validation request and payment-history documentation within the response window, tracked on the platform\'s deadline calendar.',
    statutoryBasis: [FDCPA_VALIDATION, FDCPA_FALSE_REPS],
    outcomes: [
      'Collector confirmed the balance had already been satisfied and closed the file',
      'No negative account ever appeared on the credit report',
      'Resolved in six weeks with no negotiation required',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },
  {
    id: 'cs_debt_institutional_medical',
    category: 'debt_legal',
    title: 'Institutional-tier support resolves an $89,000 medical debt dispute',
    partnerAlias: 'Sandra L. — Sacramento, CA',
    fundingSecured: '$89,000',
    timeframeWeeks: 22,
    summary: 'A complex hospital billing dispute with insurance-coordination issues needed deep documentation work before any resolution was possible.',
    challenge:
      'Sandra faced an $89,000 medical collection stemming from a billing dispute where her insurer had partially paid, but the hospital\'s billing office never reconciled the account before sending it to collections.',
    strategyApplied:
      'Assembled a full documentation timeline (EOBs, itemized billing, insurer correspondence) under the Debt Kill Institutional workflow, validated the remaining balance, and disputed the unreconciled portion directly with the furnisher.',
    statutoryBasis: [FDCPA_VALIDATION, FCRA_FURNISHER_DISPUTE_DUTY, CFPB_GUIDANCE],
    outcomes: [
      'Balance corrected downward after insurer reconciliation was documented',
      'Remaining verified balance resolved through a structured payment agreement',
      'Collection account removed from the credit file upon resolution',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },

  // ── WEALTH BUILDER (2) ──────────────────────────────────────────────────
  {
    id: 'cs_wealth_starter_llc_and_funding',
    category: 'wealth_builder',
    title: 'From credit stability to a $125,000 funding pathway',
    partnerAlias: 'Andre F. — Nashville, TN',
    fundingSecured: '$125,000',
    timeframeWeeks: 20,
    summary: 'After stabilizing his personal credit, Andre used the Wealth Builder Starter program to stand up an LLC and a funding-ready structure from scratch.',
    challenge:
      'Andre had a stable personal credit profile but no business entity, no business credit history, and no clear plan for translating personal stability into capital access.',
    strategyApplied:
      'Registered the LLC, ran business credit foundations sequencing in parallel, and used weekly strategy calls to keep execution on pace toward the $100K–$150K funding target.',
    statutoryBasis: [ECOA, UCC_ARTICLE_9, FCRA_MAX_ACCURACY],
    outcomes: [
      'LLC formed and fundability-ready within six weeks',
      'Business credit sequencing completed on schedule',
      'Approximately $125,000 in funding pathway milestones reached within five months',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },
  {
    id: 'cs_wealth_growth_accelerated',
    category: 'wealth_builder',
    title: 'Accelerated Growth-tier execution reaches $185,000 in funding pathway',
    partnerAlias: 'Bianca W. — Orlando, FL',
    fundingSecured: '$185,000',
    timeframeWeeks: 24,
    summary: 'A mid-tier Wealth Builder Growth engagement bridged Bianca from personal credit repair into a structured six-figure capital plan.',
    challenge:
      'Bianca wanted to move faster than the Starter track but did not yet have the business structure or compliance documentation in place to access premium funding lanes.',
    strategyApplied:
      'Ran expanded business structure and compliance guidance alongside business credit execution support, unlocking select premium Wealth Paths lanes earlier than the standard track.',
    statutoryBasis: [ECOA, UCC_ARTICLE_9],
    outcomes: [
      'Business structure and compliance documentation completed within eight weeks',
      'Premium Wealth Paths lane access unlocked ahead of the standard timeline',
      'Approximately $185,000 in funding pathway milestones reached within six months',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },

  // ── PRIVACY & IDENTITY (2) ──────────────────────────────────────────────
  {
    id: 'cs_privacy_pro_broker_removal',
    category: 'privacy_id',
    title: 'Advanced data broker removal locks down a public-facing profile',
    partnerAlias: 'Kenji M. — Seattle, WA',
    timeframeWeeks: 6,
    summary: 'A public-facing career had left Kenji\'s home address and phone number scattered across dozens of data broker sites.',
    challenge:
      'Kenji\'s personal information — home address, phone number, and family details — was listed on over 40 data broker sites, creating both privacy and safety concerns.',
    strategyApplied:
      'Executed the Privacy Pro advanced data broker removal workflow, submitted opt-out requests across all identified brokers, and set up an annual privacy audit checklist for ongoing monitoring.',
    statutoryBasis: [GLBA_PRIVACY, FCRA_PERMISSIBLE_PURPOSE],
    outcomes: [
      'Removed from 38 of 41 identified data broker listings within six weeks',
      'Address confidentiality guidance implemented for remaining public records',
      'Annual audit cadence established to catch new listings',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },
  {
    id: 'cs_privacy_essentials_post_breach',
    category: 'privacy_id',
    title: 'Post-breach identity lockdown in under a month',
    partnerAlias: 'Olivia R. — Minneapolis, MN',
    timeframeWeeks: 4,
    summary: 'A retailer data breach put Olivia\'s SSN and card numbers at risk, and she needed a fast, structured lockdown plan.',
    challenge:
      'Olivia received a breach notification letter listing her SSN, name, and card details among the exposed data, with no clear next steps provided by the retailer.',
    strategyApplied:
      'Walked the Privacy Essentials freeze/thaw guides for all three bureaus, set fraud alerts, and applied SSN best-practice guidance to reduce ongoing exposure.',
    statutoryBasis: [FCRA_PERMISSIBLE_PURPOSE, GLBA_PRIVACY],
    outcomes: [
      'Credit freezes placed at all three bureaus within 48 hours',
      'Fraud alerts active before any fraudulent applications were attempted',
      'No unauthorized accounts opened during the monitoring window',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },

  // ── TRADELINE PROMO (1) ─────────────────────────────────────────────────
  {
    id: 'cs_tradeline_max_thin_file',
    category: 'tradeline_promo',
    title: 'Thin file to 674 with authorized-user placements and primary reporting',
    partnerAlias: 'Devon C. — Kansas City, MO',
    startingScore: 592,
    endingScore: 674,
    timeframeWeeks: 10,
    summary: 'Three authorized-user placements plus a reporting installment tradeline gave Devon\'s thin file the depth it needed.',
    challenge:
      'Devon had a thin file with only one open account and no history long enough to satisfy most lenders\' scoring models.',
    strategyApplied:
      'Enrolled in Tradeline Max: three authorized-user placements selected for age and utilization profile, plus the in-house financing installment tradeline reporting to Equifax as a primary account.',
    statutoryBasis: [FCRA_MAX_ACCURACY, ECOA],
    outcomes: [
      'Average account age and utilization profile both improved within one reporting cycle',
      'Score moved 592 → 674 in ten weeks',
      'Qualified for a standard unsecured card for the first time',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },

  // ── HETA SOCIETY (2) ────────────────────────────────────────────────────
  {
    id: 'cs_heta_restore_and_build_1',
    category: 'heta_society',
    title: 'Restoration and business build, side by side, inside the Society',
    partnerAlias: 'Elijah W. — Baton Rouge, LA',
    startingScore: 553,
    endingScore: 689,
    fundingSecured: '$28,000',
    timeframeWeeks: 16,
    summary: 'Five tracked disputes and a business credit starter ran in parallel inside the private member file — restoration and building, at the same time.',
    challenge:
      'Elijah had five negative items dragging his personal score down and no business entity at all, wanting to build both tracks together rather than sequentially.',
    strategyApplied:
      'Used the member file\'s round-one dispute workflow on all five tracked items while running the business credit starter checklist and vendor sequencing in parallel.',
    statutoryBasis: [FCRA_REINVESTIGATION, FCRA_FURNISHER_DISPUTE_DUTY, ECOA],
    outcomes: [
      'Four of five tracked disputes resolved in the partner\'s favor',
      'Score moved 553 → 689 across sixteen weeks',
      'New LLC opened three reporting vendor accounts totaling approximately $28,000',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },
  {
    id: 'cs_heta_restore_and_build_2',
    category: 'heta_society',
    title: 'Disciplined sequencing takes a member from restoration to funded vendor lines',
    partnerAlias: 'Marcus D. — Shreveport, LA',
    startingScore: 601,
    endingScore: 722,
    fundingSecured: '$46,000',
    timeframeWeeks: 20,
    summary: 'A disciplined, evidence-first approach to both personal restoration and vendor sequencing produced results on both fronts within five months.',
    challenge:
      'Marcus had moderate negative history (collections and one repossession) plus an existing business with no reporting trade lines at all.',
    strategyApplied:
      'Ran the personal restoration track first to clear the highest-impact items, then shifted focus to the four-tier vendor sequencing ladder for the business once the personal file stabilized.',
    statutoryBasis: [FCRA_FURNISHER_ACCURACY, FCRA_REINVESTIGATION, UCC_ARTICLE_9],
    outcomes: [
      'Collections resolved and repossession balance corrected',
      'Score moved 601 → 722 across the restoration phase',
      'Business vendor sequencing produced approximately $46,000 in reporting credit lines',
    ],
    disclaimer: STANDARD_DISCLAIMER,
  },
];

export function getAllCaseStudies(): CaseStudy[] {
  return CASE_STUDIES;
}

export function getCaseStudiesByCategory(category: PricingCategory | 'heta_society'): CaseStudy[] {
  return CASE_STUDIES.filter((cs) => cs.category === category);
}

export function getCaseStudyById(id: string): CaseStudy | undefined {
  return CASE_STUDIES.find((cs) => cs.id === id);
}

export interface CaseStudyProofStats {
  /** Total documented case studies in the set. */
  totalCount: number;
  /** Distinct practice-area categories represented. */
  categoryCount: number;
  /** Average ending-minus-starting score across studies that report both. Null if none do. */
  avgScoreLift: number | null;
  /** Sum of parsed `fundingSecured` dollar amounts across the set. */
  totalFundingSecured: number;
}

function parseFundingSecuredAmount(value?: string): number {
  if (!value) return 0;
  const n = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Real, computed proof numbers for public trust surfaces (homepage proof
 * strip, /results page) — never fabricated/hardcoded. Pass a subset (e.g.
 * from `getFeaturedCaseStudies()`) to scope the stats to what's on screen,
 * or omit to compute across the full documented set.
 */
export function getCaseStudyProofStats(studies: CaseStudy[] = CASE_STUDIES): CaseStudyProofStats {
  const scoreLifts = studies
    .filter((cs) => cs.startingScore != null && cs.endingScore != null)
    .map((cs) => (cs.endingScore as number) - (cs.startingScore as number));
  const avgScoreLift = scoreLifts.length
    ? Math.round(scoreLifts.reduce((sum, n) => sum + n, 0) / scoreLifts.length)
    : null;
  const totalFundingSecured = studies.reduce((sum, cs) => sum + parseFundingSecuredAmount(cs.fundingSecured), 0);
  const categoryCount = new Set(studies.map((cs) => cs.category)).size;
  return { totalCount: studies.length, categoryCount, avgScoreLift, totalFundingSecured };
}

/**
 * Stable, varied subset for homepage/marketing surfaces: takes the first
 * (i.e. flagship) case study from each category in round-robin order so the
 * strip never shows five entries from the same category back-to-back.
 * Deterministic by array order — not random — so it renders identically on
 * every load/server render.
 */
export function getFeaturedCaseStudies(limit = 6): CaseStudy[] {
  const byCategory = new Map<CaseStudy['category'], CaseStudy[]>();
  for (const cs of CASE_STUDIES) {
    const list = byCategory.get(cs.category);
    if (list) list.push(cs);
    else byCategory.set(cs.category, [cs]);
  }
  const categories = Array.from(byCategory.keys());
  const featured: CaseStudy[] = [];
  let round = 0;
  while (featured.length < limit && round < CASE_STUDIES.length) {
    let addedInRound = false;
    for (const category of categories) {
      const list = byCategory.get(category)!;
      const candidate = list[round];
      if (candidate) {
        featured.push(candidate);
        addedInRound = true;
        if (featured.length >= limit) break;
      }
    }
    if (!addedInRound) break;
    round += 1;
  }
  return featured;
}
