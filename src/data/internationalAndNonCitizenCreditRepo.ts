/**
 * International & non-citizen credit/funding knowledge repository.
 *
 * IMPORTANT — GENERAL EDUCATIONAL GUIDANCE ONLY. This file is NOT legal, immigration, or
 * lending advice. It exists so Finely Cred's AI staff and knowledge base can speak
 * accurately and with appropriate hedging about (A) business funding paths for
 * non-U.S.-citizen business owners operating a U.S.-registered entity, and (B) how
 * consumer credit reporting works outside the United States (Canada + a European
 * overview). Actual eligibility, documentation, underwriting appetite, and reporting
 * rules vary by individual lender/bureau policy, visa/immigration status, province or
 * member state, and current regulations — all of which change over time. Always direct
 * partners to a qualified immigration attorney, accountant, and the specific lender's
 * current guidelines before they rely on any of this for a real application.
 */

export interface NonCitizenFundingRule {
  id: string;
  applicantType:
    | 'itin_holder'
    | 'foreign_national_e2_eb5'
    | 'non_resident_llc'
    | 'daca_recipient'
    | 'green_card_holder';
  loanType:
    | 'business_line_of_credit'
    | 'equipment_financing'
    | 'sba_7a'
    | 'merchant_cash_advance'
    | 'business_term_loan'
    | 'commercial_real_estate';
  ssnRequired: boolean;
  itinAccepted: boolean;
  keyRequirements: string[];
  /** How lenders actually view this applicant type in underwriting — realistic risk optics, not a promise. */
  lenderUnderwritingOptics: string;
  /** e.g. ITIN letter (CP565), Form W-7, foreign passport + visa, bank statements. */
  alternativeProofDocs: string[];
}

export interface InternationalCreditSystem {
  countryCode: 'CA' | 'UK' | 'DE' | 'EU_GENERAL';
  countryName: string;
  /** e.g. Equifax Canada, TransUnion Canada; Experian UK, Equifax UK, TransUnion UK; SCHUFA (Germany). */
  majorBureaus: string[];
  /** e.g. "300-900 (Equifax Canada Beacon)". */
  scoreRangeLabel: string;
  scoringModelNotes: string;
  /** e.g. PIPEDA (Canada), GDPR (EU). */
  dataProtectionRegime: string;
  /** Concrete comparative points vs. FCRA/the U.S. system. */
  keyDifferencesFromUS: string[];
  disputeRightsSummary: string;
  /** Typical negative-info retention, in years (approximate — varies by category/region). */
  reportingWindowYears: number;
}

const ITIN_CORE_DOCS = [
  'ITIN assignment letter (IRS CP565)',
  'Form W-7 (ITIN application) with IRS receipt if ITIN is pending',
  'Foreign passport with valid U.S. visa or I-94 arrival/departure record',
];

const EIN_ENTITY_DOCS = [
  'EIN confirmation letter (IRS CP 575 / 147C)',
  'Articles of Organization / Certificate of Formation',
  'Operating Agreement or Corporate Bylaws',
  'Certificate of Good Standing from the state of formation',
];

const BUSINESS_FINANCIALS_DOCS = [
  '6-12 months of U.S. business bank statements',
  'Year-to-date profit & loss statement and balance sheet',
  'Business tax returns (or 1040-NR / 1040 with ITIN for pass-through entities)',
];

export const NON_CITIZEN_FUNDING_RULES: NonCitizenFundingRule[] = [
  // ---------- ITIN holder ----------
  {
    id: 'itin-holder-line-of-credit',
    applicantType: 'itin_holder',
    loanType: 'business_line_of_credit',
    ssnRequired: false,
    itinAccepted: true,
    keyRequirements: [
      'U.S.-registered entity (LLC or corporation) with its own EIN — financing is underwritten against the business, not a personal SSN',
      'Personal guarantee signed using ITIN in place of SSN',
      '6-12 months of consistent business bank deposits/revenue',
      'Established U.S. business bank account (often the biggest early hurdle)',
    ],
    lenderUnderwritingOptics:
      'Many regional banks, credit unions, and fintech lenders will underwrite a revolving line to the EIN/entity once there is real deposit history, treating the ITIN owner similarly to a thin-file borrower — expect a lower starting limit, higher scrutiny of cash-flow consistency, and possibly a relationship-banking requirement (checking/savings history with the same institution) before a line is approved.',
    alternativeProofDocs: [...ITIN_CORE_DOCS, ...EIN_ENTITY_DOCS, ...BUSINESS_FINANCIALS_DOCS],
  },
  {
    id: 'itin-holder-equipment-financing',
    applicantType: 'itin_holder',
    loanType: 'equipment_financing',
    ssnRequired: false,
    itinAccepted: true,
    keyRequirements: [
      'The equipment itself serves as primary collateral, which lowers the bar versus unsecured products',
      'Invoice or purchase agreement for the specific equipment being financed',
      'Down payment (often 10-20%) to offset thin personal credit file',
      'Business entity documents and, ideally, some operating history in the same trade',
    ],
    lenderUnderwritingOptics:
      'Equipment lenders are generally the most accessible category for ITIN holders because recoverable collateral (the equipment) reduces the lender\'s exposure — expect this to be one of the easier "yes" categories, but still with a higher rate or larger down payment than a similarly-situated SSN/US-citizen borrower would get.',
    alternativeProofDocs: [...ITIN_CORE_DOCS, ...EIN_ENTITY_DOCS, 'Vendor quote or invoice for the equipment'],
  },
  {
    id: 'itin-holder-merchant-cash-advance',
    applicantType: 'itin_holder',
    loanType: 'merchant_cash_advance',
    ssnRequired: false,
    itinAccepted: true,
    keyRequirements: [
      '3-6 months of business bank/merchant-processing statements showing consistent revenue',
      'No personal credit pull required by many MCA providers — approval is receivables-based',
      'Understanding that this is a purchase of future receivables, not a traditional loan (factor rate, not APR)',
    ],
    lenderUnderwritingOptics:
      'MCA providers are typically the fastest and least document-heavy path for an ITIN-only owner because underwriting leans almost entirely on bank/processing deposit history rather than personal credit — but this accessibility comes at a real cost. Effective APRs can run very high once the factor rate is annualized, and daily/weekly automatic debits can strain cash flow; this should generally be positioned as a bridge, not a primary growth-capital strategy.',
    alternativeProofDocs: [...ITIN_CORE_DOCS, 'Business bank statements', 'Merchant processing statements (if applicable)'],
  },
  {
    id: 'itin-holder-business-term-loan',
    applicantType: 'itin_holder',
    loanType: 'business_term_loan',
    ssnRequired: false,
    itinAccepted: true,
    keyRequirements: [
      'Community Development Financial Institutions (CDFIs) and some online lenders explicitly accept ITIN-based applications',
      '1-2 years of business operating history is commonly requested for the best rates/terms',
      'Clear use-of-funds narrative and business plan for larger amounts',
      'Personal guarantee via ITIN plus a co-signer or collateral may be requested for higher loan amounts',
    ],
    lenderUnderwritingOptics:
      'Mission-driven lenders (CDFIs, minority/immigrant-focused loan funds) are typically more willing to underwrite term debt for ITIN holders than mainstream banks, but amounts tend to be smaller and pricing higher than a comparable SSN-backed bank term loan; expect more manual underwriting and a longer approval timeline.',
    alternativeProofDocs: [...ITIN_CORE_DOCS, ...EIN_ENTITY_DOCS, ...BUSINESS_FINANCIALS_DOCS, 'Business plan / use-of-funds statement'],
  },
  {
    id: 'itin-holder-commercial-real-estate',
    applicantType: 'itin_holder',
    loanType: 'commercial_real_estate',
    ssnRequired: false,
    itinAccepted: true,
    keyRequirements: [
      'A niche "ITIN mortgage" or portfolio-lender program (not every bank offers these) — availability is regional and changes over time',
      'Substantially larger down payment than a conventional CRE loan, often 30-40%+',
      'Verifiable rental/business income and reserves (6-12 months of payments) to offset the lack of a U.S. credit score',
      'Property appraisal and clean title/entity ownership documentation',
    ],
    lenderUnderwritingOptics:
      'This is the hardest category for an ITIN-only borrower — most large banks decline outright, so realistic options are portfolio lenders, some credit unions, and specialty "foreign national"/ITIN mortgage programs that price in the lack of a credit score with a larger down payment and a somewhat higher rate rather than declining altogether. Shopping multiple portfolio lenders matters more here than in any other category.',
    alternativeProofDocs: [...ITIN_CORE_DOCS, ...EIN_ENTITY_DOCS, 'Proof of down payment / reserves (bank statements)', 'Property appraisal and purchase contract'],
  },
  {
    id: 'itin-holder-sba-7a',
    applicantType: 'itin_holder',
    loanType: 'sba_7a',
    ssnRequired: false,
    itinAccepted: true,
    keyRequirements: [
      'SBA policy generally requires the small business to be at least 51% owned and controlled by U.S. citizens or lawful permanent residents (LPRs) — an ITIN-only owner without LPR status typically cannot satisfy this test as the majority owner',
      'If a U.S. citizen or LPR co-owner holds 51%+ of the entity, the business may still qualify with the ITIN holder as a minority owner',
      'SBA immigration-status addenda (e.g., SBA Form 912/1919 series) are required regardless of ownership structure',
    ],
    lenderUnderwritingOptics:
      'SBA lenders will generally screen out an ITIN-only majority owner early in the process because of the citizenship/LPR ownership rule, so this is usually a "not currently eligible as sole/majority owner" scenario rather than a hard, permanent no for the business — a compliant ownership restructure (bringing on a qualifying co-owner) or pursuing non-SBA products above are the realistic paths. SBA rules and SOPs are updated periodically, so current guidance should always be confirmed with an SBA-approved lender before ruling anything out.',
    alternativeProofDocs: [...ITIN_CORE_DOCS, ...EIN_ENTITY_DOCS, 'SBA Form 413 (Personal Financial Statement)', 'SBA immigration-status addendum for each owner ≥20%'],
  },

  // ---------- Foreign national (E-2 / EB-5) ----------
  {
    id: 'e2-eb5-line-of-credit',
    applicantType: 'foreign_national_e2_eb5',
    loanType: 'business_line_of_credit',
    ssnRequired: false,
    itinAccepted: true,
    keyRequirements: [
      'Valid E-2 treaty-investor or EB-5 immigrant-investor visa/petition documentation',
      'Business entity that matches the investment described in the visa petition',
      'U.S. business bank account with operating history',
      'Personal guarantee (ITIN or SSN if already issued)',
    ],
    lenderUnderwritingOptics:
      'Lenders generally view E-2/EB-5 investors more favorably than an undocumented ITIN-only applicant because there is a documented, vetted capital investment behind the business — but E-2 status is temporary/renewable (not a green card), so some underwriters will factor in "visa renewal risk" and may want to see the current visa validity period cover a meaningful part of the loan term, or ask about a renewal history.',
    alternativeProofDocs: [...ITIN_CORE_DOCS, 'E-2 visa approval / EB-5 I-526 or I-829 petition documentation', ...EIN_ENTITY_DOCS, ...BUSINESS_FINANCIALS_DOCS],
  },
  {
    id: 'e2-eb5-equipment-financing',
    applicantType: 'foreign_national_e2_eb5',
    loanType: 'equipment_financing',
    ssnRequired: false,
    itinAccepted: true,
    keyRequirements: [
      'Collateralized by the equipment itself, which reduces reliance on visa-duration risk',
      'Business documentation consistent with the E-2/EB-5 investment plan',
      'Down payment expectations similar to other non-citizen applicants, though often smaller given the visible capital investment already in the business',
    ],
    lenderUnderwritingOptics:
      'Equipment lenders tend to be relatively comfortable here since the collateral limits downside even if the owner\'s visa status changes — this is usually one of the more approvable categories for E-2/EB-5 investors.',
    alternativeProofDocs: [...ITIN_CORE_DOCS, 'E-2/EB-5 petition or approval documentation', 'Vendor quote or invoice for the equipment'],
  },
  {
    id: 'e2-eb5-commercial-real-estate',
    applicantType: 'foreign_national_e2_eb5',
    loanType: 'commercial_real_estate',
    ssnRequired: false,
    itinAccepted: true,
    keyRequirements: [
      'Foreign-national CRE loan programs (portfolio lenders) that explicitly serve E-2/EB-5 investors',
      'Larger down payment (commonly 30%+) to offset thin/absent U.S. credit history',
      'Documentation of the source of investment funds (anti-money-laundering / source-of-funds review is typically more thorough for this group)',
    ],
    lenderUnderwritingOptics:
      'Because EB-5 in particular already requires proving a lawful, traceable source of investment capital to immigration authorities, CRE lenders often lean on that existing documentation during their own source-of-funds and AML review — but expect the underwriting timeline to be longer than a typical domestic CRE loan due to the extra verification layers.',
    alternativeProofDocs: ['E-2/EB-5 approval and source-of-funds documentation', ...ITIN_CORE_DOCS, 'Proof of down payment / reserves', 'Property appraisal and purchase contract'],
  },
  {
    id: 'e2-eb5-business-term-loan',
    applicantType: 'foreign_national_e2_eb5',
    loanType: 'business_term_loan',
    ssnRequired: false,
    itinAccepted: true,
    keyRequirements: [
      'Established U.S. operating history for the E-2/EB-5-backed business',
      'Clear use-of-funds plan tied to growth of the already-approved business',
      'Personal guarantee via ITIN (or SSN once issued)',
    ],
    lenderUnderwritingOptics:
      'Term lenders that already work with immigrant-investor businesses will typically underwrite primarily on the business\'s own financials, treating the visa documentation as supporting evidence of legitimacy rather than the central risk factor — pricing and terms should land closer to a standard small-business term loan than to a "high risk" specialty product.',
    alternativeProofDocs: [...ITIN_CORE_DOCS, ...EIN_ENTITY_DOCS, ...BUSINESS_FINANCIALS_DOCS],
  },
  {
    id: 'e2-eb5-sba-7a',
    applicantType: 'foreign_national_e2_eb5',
    loanType: 'sba_7a',
    ssnRequired: false,
    itinAccepted: true,
    keyRequirements: [
      'SBA\'s 51% U.S.-citizen-or-LPR ownership/control rule applies — an E-2 visa holder (a non-immigrant, temporary status) generally does not satisfy this on their own',
      'An EB-5 investor who has already obtained conditional or permanent lawful permanent resident (green card) status may satisfy the ownership test once that status is confirmed',
      'SBA immigration-status addenda required for all owners of 20%+',
    ],
    lenderUnderwritingOptics:
      'E-2 status alone is typically treated by SBA lenders as not meeting the citizenship/LPR ownership requirement, so this is usually framed as "not eligible while on E-2" rather than a case-by-case judgment call. EB-5 investors move into a genuinely different bucket once their conditional green card is approved — at that point they are usually evaluated like any other LPR-owned business (see green_card_holder rules below). SBA SOPs are revised periodically, so current eligibility should always be verified directly with an SBA-approved lender.',
    alternativeProofDocs: ['E-2 visa or EB-5 I-526/I-829/I-551 (conditional green card) documentation', ...EIN_ENTITY_DOCS, 'SBA Form 413 (Personal Financial Statement)', 'SBA immigration-status addendum for each owner ≥20%'],
  },

  // ---------- Non-resident-owned U.S. LLC ----------
  {
    id: 'non-resident-llc-line-of-credit',
    applicantType: 'non_resident_llc',
    loanType: 'business_line_of_credit',
    ssnRequired: false,
    itinAccepted: true,
    keyRequirements: [
      'EIN obtained without an SSN (IRS Form SS-4 filed by mail/fax/phone, or via a third-party designee)',
      'U.S. business bank account — often the hardest step for a non-resident owner, since many traditional banks require an in-person visit or a U.S.-resident signer',
      '6-12+ months of U.S. deposit/revenue history before most lenders will consider a line',
      'Registered agent and good-standing status in the formation state',
    ],
    lenderUnderwritingOptics:
      'Lenders generally treat a non-resident-owned LLC with no U.S. credit footprint as the highest-friction profile in this whole category — approval usually hinges entirely on demonstrated U.S. bank deposit history and relationship banking rather than any personal credit file, so the realistic first step is often 6-12 months of clean deposit history through a fintech-friendly business bank before a line of credit becomes attainable.',
    alternativeProofDocs: [...EIN_ENTITY_DOCS, 'Foreign passport (no U.S. visa required if the owner never enters the U.S. to operate the LLC)', ...BUSINESS_FINANCIALS_DOCS],
  },
  {
    id: 'non-resident-llc-merchant-cash-advance',
    applicantType: 'non_resident_llc',
    loanType: 'merchant_cash_advance',
    ssnRequired: false,
    itinAccepted: true,
    keyRequirements: [
      'U.S. business bank account or payment processor with recurring deposits',
      '3-6 months of transaction history',
      'No personal credit file required by most MCA providers',
    ],
    lenderUnderwritingOptics:
      'This is often the single most accessible financing product for a non-resident LLC with zero U.S. credit history, since underwriting is receivables-based — but the same cost caution applies as with any MCA: high effective annualized cost and frequent automatic debits, so it should be framed as short-term bridge capital, not a default first choice.',
    alternativeProofDocs: [...EIN_ENTITY_DOCS, 'Business bank statements', 'Payment processor statements'],
  },
  {
    id: 'non-resident-llc-equipment-financing',
    applicantType: 'non_resident_llc',
    loanType: 'equipment_financing',
    ssnRequired: false,
    itinAccepted: true,
    keyRequirements: [
      'U.S.-based equipment/vendor and delivery address',
      'Larger down payment (often 20%+) to compensate for no U.S. credit file',
      'Personal guarantee from the non-resident owner using foreign passport/ITIN in lieu of SSN, where the lender permits it',
    ],
    lenderUnderwritingOptics:
      'Some equipment finance companies will work with a non-resident-owned LLC purely because the equipment is recoverable collateral located in the U.S., but many mainstream lenders still decline non-resident owners outright — expect a shorter list of willing lenders than for any other applicant type in this table.',
    alternativeProofDocs: [...EIN_ENTITY_DOCS, 'Vendor quote or invoice for the equipment', 'Foreign passport'],
  },
  {
    id: 'non-resident-llc-commercial-real-estate',
    applicantType: 'non_resident_llc',
    loanType: 'commercial_real_estate',
    ssnRequired: false,
    itinAccepted: true,
    keyRequirements: [
      'Specialty "foreign national" commercial real estate loan programs — a narrow set of portfolio lenders',
      'Down payment commonly 35-50%',
      'Full source-of-funds documentation for the down payment (AML/KYC review is typically the most intensive of any category here)',
      'U.S. entity ownership structure with a registered agent in the property\'s state',
    ],
    lenderUnderwritingOptics:
      'This is realistically the most difficult financing scenario in the entire table: no U.S. credit file, no U.S. residency, and often no prior U.S. banking relationship. The handful of lenders that serve this niche price almost entirely on collateral value, down payment size, and verified liquidity/reserves rather than any personal credit signal — approval is possible but the pool of willing lenders is small and terms are conservative.',
    alternativeProofDocs: ['Foreign passport', ...EIN_ENTITY_DOCS, 'Source-of-funds documentation (bank reference letters, asset statements)', 'Property appraisal and purchase contract'],
  },

  // ---------- DACA recipient ----------
  {
    id: 'daca-line-of-credit',
    applicantType: 'daca_recipient',
    loanType: 'business_line_of_credit',
    ssnRequired: true,
    itinAccepted: false,
    keyRequirements: [
      'DACA recipients generally have a valid SSN issued alongside their Employment Authorization Document (EAD), so most lenders process the application like any other SSN-based small-business applicant',
      'Personal credit history (often well-established if the recipient grew up in the U.S.) is reviewed normally',
      'Current, unexpired EAD/DACA status documentation may still be requested by more conservative underwriters',
    ],
    lenderUnderwritingOptics:
      'Outside of SBA-guaranteed products, most business lenders treat a DACA recipient\'s SSN-based application the same as any U.S.-citizen applicant\'s, since the SSN and personal credit file function identically in the underwriting system — DACA status itself is rarely the deciding factor for conventional/fintech lending.',
    alternativeProofDocs: ['Employment Authorization Document (EAD, Form I-766)', 'Social Security card', ...EIN_ENTITY_DOCS, ...BUSINESS_FINANCIALS_DOCS],
  },
  {
    id: 'daca-merchant-cash-advance',
    applicantType: 'daca_recipient',
    loanType: 'merchant_cash_advance',
    ssnRequired: true,
    itinAccepted: false,
    keyRequirements: [
      'U.S. business bank account with consistent deposits',
      'SSN for identity verification (standard KYC), though approval is still primarily revenue-based',
    ],
    lenderUnderwritingOptics:
      'MCA underwriting for a DACA recipient is functionally identical to any other small-business owner\'s — the same cost-of-capital caution applies (factor rate vs. APR, frequent debits) regardless of immigration status.',
    alternativeProofDocs: ['EAD (Form I-766)', 'Business bank statements'],
  },
  {
    id: 'daca-sba-7a',
    applicantType: 'daca_recipient',
    loanType: 'sba_7a',
    ssnRequired: true,
    itinAccepted: false,
    keyRequirements: [
      'SBA\'s ownership rule requires 51%+ U.S.-citizen-or-LPR ownership; DACA status is neither U.S. citizenship nor lawful permanent residency, so eligibility has been genuinely contested and inconsistently applied in practice',
      'DACA-owned businesses have, at times, been denied 7(a) financing on this basis, and there has been legal and advocacy pushback (including litigation) arguing DACA recipients should qualify given their lawful presence and work authorization',
      'Because this area has shifted with agency guidance, administrations, and litigation, current SBA and individual SBA-lender policy must be confirmed at the time of application — do not assume either a blanket yes or blanket no',
    ],
    lenderUnderwritingOptics:
      'This is the one row in this table where the honest answer is "it depends on current SBA guidance and the individual lender\'s interpretation" rather than a settled rule — SBA-approved lenders vary in how they apply the citizenship/LPR test to DACA recipients, and the policy landscape has changed multiple times. Recommend the partner speak directly with an SBA-approved lender and, if useful, an immigration attorney, and treat non-SBA products above as the more reliably available near-term path.',
    alternativeProofDocs: ['EAD (Form I-766)', 'Social Security card', ...EIN_ENTITY_DOCS, 'SBA Form 413 (Personal Financial Statement)', 'SBA immigration-status addendum'],
  },

  // ---------- Green card holder (LPR) ----------
  {
    id: 'green-card-sba-7a',
    applicantType: 'green_card_holder',
    loanType: 'sba_7a',
    ssnRequired: true,
    itinAccepted: false,
    keyRequirements: [
      'Lawful permanent residents (green card holders) satisfy SBA\'s citizenship/LPR ownership requirement in the same way a U.S. citizen owner would',
      'Standard SBA 7(a) documentation applies: SBA Form 413, business tax returns, business plan, collateral discussion',
      'Green card (Form I-551) as immigration-status proof alongside the SSN',
    ],
    lenderUnderwritingOptics:
      'For SBA purposes, a green card holder is treated essentially the same as a U.S. citizen owner — the ownership/control test that trips up non-immigrant visa holders and undocumented applicants is satisfied. Underwriting focus shifts to the normal SBA criteria (creditworthiness, cash flow, collateral, industry) rather than immigration status.',
    alternativeProofDocs: ['Permanent Resident Card (Form I-551)', 'Social Security card', ...EIN_ENTITY_DOCS, ...BUSINESS_FINANCIALS_DOCS, 'SBA Form 413 (Personal Financial Statement)'],
  },
  {
    id: 'green-card-commercial-real-estate',
    applicantType: 'green_card_holder',
    loanType: 'commercial_real_estate',
    ssnRequired: true,
    itinAccepted: false,
    keyRequirements: [
      'Standard conventional/bank CRE underwriting applies (down payment, DSCR, appraisal, personal guarantee)',
      'U.S. credit history and SSN function normally in the credit-pull process',
      'Some larger banks may still request additional documentation on length of LPR history or country-of-origin AML/KYC review for very large loans',
    ],
    lenderUnderwritingOptics:
      'Green card holders generally access the same CRE lending market as U.S. citizens, priced on the deal (collateral, DSCR, credit score, reserves) rather than immigration status — the main exception is very large transactions where enhanced AML/KYC diligence may add a documentation step, not a different pricing tier.',
    alternativeProofDocs: ['Permanent Resident Card (Form I-551)', ...EIN_ENTITY_DOCS, 'Personal and business tax returns', 'Property appraisal and purchase contract'],
  },
  {
    id: 'green-card-business-term-loan',
    applicantType: 'green_card_holder',
    loanType: 'business_term_loan',
    ssnRequired: true,
    itinAccepted: false,
    keyRequirements: [
      'Business and personal financials reviewed exactly as they would be for a U.S.-citizen owner',
      'SSN-based personal credit report pulled normally',
      'Green card documentation is typically a formality confirming work/ownership authorization rather than a risk factor',
    ],
    lenderUnderwritingOptics:
      'Term lenders generally underwrite green card holders on the merits of the business and personal credit file with no meaningful risk premium tied to immigration status — this is functionally the same experience as a U.S.-citizen applicant.',
    alternativeProofDocs: ['Permanent Resident Card (Form I-551)', ...EIN_ENTITY_DOCS, ...BUSINESS_FINANCIALS_DOCS],
  },
];

export const INTERNATIONAL_CREDIT_SYSTEMS: InternationalCreditSystem[] = [
  {
    countryCode: 'CA',
    countryName: 'Canada',
    majorBureaus: ['Equifax Canada', 'TransUnion Canada'],
    scoreRangeLabel: '300-900 (Equifax Canada Beacon 9.0; TransUnion Canada CreditVision uses a comparable 300-900 range)',
    scoringModelNotes:
      'Both major Canadian bureaus use a 300-900 scale (vs. the familiar 300-850 FICO range in the U.S.), so a Canadian "750" is not directly the same risk tier as a U.S. "750" — always compare within the same bureau\'s scale. Roughly: 800+ is considered excellent, 720-799 very good, 660-719 good, 560-659 fair, and below 560 poor, though exact bands vary by lender and product.',
    dataProtectionRegime:
      'PIPEDA (Personal Information Protection and Electronic Documents Act) is the federal baseline; Quebec, British Columbia, and Alberta have their own "substantially similar" private-sector privacy laws that can apply instead of PIPEDA for organizations operating within those provinces (Quebec\'s modernized Law 25 in particular strengthened consumer rights).',
    keyDifferencesFromUS: [
      'No single statute plays the exact role of the U.S. FCRA — consumer reporting is governed by PIPEDA/provincial privacy law plus provincial consumer reporting acts (e.g., Ontario\'s Consumer Reporting Act, Quebec\'s private-sector privacy act).',
      'Two dominant national bureaus (Equifax Canada, TransUnion Canada) rather than the three-bureau structure (Equifax, Experian, TransUnion) most Americans are used to.',
      'No single federal regulator plays the exact role of the CFPB — oversight is split between the Financial Consumer Agency of Canada (FCAC), the Office of the Privacy Commissioner of Canada, and provincial regulators/privacy commissioners.',
      'Negative-information retention windows vary somewhat by province and bureau rather than being fixed by one uniform federal rule the way FCRA sets a 7-year standard nationally.',
      'Bankruptcy reporting can extend meaningfully longer for repeat filers (a second or subsequent bankruptcy can be reported for considerably longer than a first one) — a distinction less pronounced in standard U.S. reporting.',
    ],
    disputeRightsSummary:
      'Consumers can request their full file from each bureau, dispute inaccurate items directly with the bureau and the furnisher, and require correction/deletion of confirmed errors — similar in spirit to the FCRA dispute-and-reinvestigate cycle. Unresolved disputes can be escalated to the federal Privacy Commissioner of Canada or the relevant provincial privacy regulator (e.g., Quebec\'s CAI), rather than to a single national consumer-finance regulator.',
    reportingWindowYears: 6,
  },
  {
    countryCode: 'UK',
    countryName: 'United Kingdom',
    majorBureaus: ['Experian UK', 'Equifax UK', 'TransUnion UK'],
    scoreRangeLabel:
      'No shared scale — Experian typically 0-999, Equifax typically 0-1000, TransUnion typically 0-710 (each bureau uses its own proprietary range)',
    scoringModelNotes:
      'Unlike the U.S., where FICO/VantageScore provide a broadly shared 300-850-style convention across bureaus, each UK bureau publishes its own consumer-facing score on its own scale, and lenders frequently build bespoke internal scorecards from the underlying bureau data rather than relying on a single universal number — so a consumer\'s "score" is only meaningful relative to the specific bureau that produced it.',
    dataProtectionRegime:
      'UK GDPR (the retained, UK-specific version of EU GDPR post-Brexit) together with the Data Protection Act 2018, enforced by the Information Commissioner\'s Office (ICO); consumer lending conduct is separately regulated by the Financial Conduct Authority (FCA) under the Consumer Credit Act 1974 framework and FCA rules.',
    keyDifferencesFromUS: [
      'No FCRA-equivalent statute dedicated purely to credit reporting — protection comes from UK GDPR/DPA 2018 (data rights) plus FCA regulation of lender conduct and affordability assessment.',
      'Three bureaus operate with three different proprietary score scales, versus the shared FICO/VantageScore conventions common in the U.S.',
      'A "Notice of Correction" lets a consumer add up to roughly 200 words of explanatory context to a disputed file entry — broadly similar in purpose to the FCRA\'s 100-word consumer statement, but distinct in mechanics.',
      'County Court Judgments (CCJs) are a distinctly UK negative-record type with their own six-year reporting rule, including a "satisfied within one month" removal provision that has no direct FCRA parallel.',
      'GDPR-based rights (access, rectification, and in some circumstances erasure) sit alongside — rather than replacing — the credit-specific dispute process, giving UK consumers a broader baseline of data rights than FCRA alone provides.',
    ],
    disputeRightsSummary:
      'Consumers can dispute inaccurate entries directly with the credit reference agency and the organization that reported the data (the "data furnisher"), request a Notice of Correction where a dispute isn\'t fully resolved, and pursue subject access requests under UK GDPR. Unresolved lender-conduct complaints can escalate to the Financial Ombudsman Service (FOS); data-protection-specific complaints go to the ICO — there is no single equivalent to the U.S. CFPB.',
    reportingWindowYears: 6,
  },
  {
    countryCode: 'DE',
    countryName: 'Germany',
    majorBureaus: ['SCHUFA', 'Creditreform', 'CRIF Bürgel'],
    scoreRangeLabel:
      'Expressed as a probability/percentage (SCHUFA "Basisscore"), not a 300-850-style point range — e.g., roughly 97.5%+ is commonly cited as a very good score band',
    scoringModelNotes:
      'SCHUFA\'s score represents an estimated probability of reliable future payment behavior rather than a point total, which is a fundamentally different presentation from the U.S. three-digit convention. Reporting to SCHUFA is largely contractual/opt-in (banks, telecoms, and some landlords choose to participate under data-sharing agreements) rather than a mandatory nationwide furnishing regime. A landmark 2023 EU Court of Justice ruling (Schufa Holding AG, C-634/21) found that purely automated SCHUFA scoring feeding directly into a binary credit decision can itself constitute a regulated "automated decision" under GDPR Article 22, pushing German/EU practice toward requiring more human review of algorithmic credit decisions than is currently mandated in the U.S.',
    dataProtectionRegime:
      'GDPR (Regulation (EU) 2016/679) as the EU-wide baseline, implemented nationally through Germany\'s Federal Data Protection Act (Bundesdatenschutzgesetz, BDSG); SCHUFA and other German bureaus are supervised by German data protection authorities.',
    keyDifferencesFromUS: [
      'Score is a percentage-based probability rather than a fixed-range point score, reflecting a different underlying statistical presentation than FICO/VantageScore.',
      'Bureau reporting is largely contract/opt-in based rather than a mandatory, uniform nationwide furnishing system like the one FCRA effectively creates in the U.S.',
      'GDPR Article 22 restricts purely automated decision-making in ways that go beyond current U.S. federal regulation of algorithmic credit scoring — reinforced by the 2023 CJEU SCHUFA ruling.',
      'Protection flows from GDPR + national data protection law + civil/contract law rather than a dedicated consumer-reporting statute like FCRA.',
      'Post-2021/2023 reform pressure shortened typical retention for settled negative items (see below), moving German practice toward faster "clean slate" timelines than the traditional U.S. 7-year FCRA standard for most account-level derogatory items.',
    ],
    disputeRightsSummary:
      'Consumers are entitled to a free annual self-disclosure (Datenübersicht) of their SCHUFA file under GDPR Article 15, and can demand correction of inaccurate data (Article 16) or erasure of unlawfully retained data (Article 17) — a materially more rights-forward, erasure-capable model than the U.S. dispute-and-correct approach under FCRA. Unresolved disputes go to the relevant German data protection authority (the federal BfDI or a state-level Landesbeauftragte) rather than a credit-specific ombudsman.',
    reportingWindowYears: 3,
  },
  {
    countryCode: 'EU_GENERAL',
    countryName: 'European Union (general overview)',
    majorBureaus: [
      'SCHUFA (Germany)',
      'CRIF (Italy and multiple EU countries)',
      'Experian (operates in Ireland, Italy, Spain, and other member states)',
      'BKR — Bureau Krediet Registratie (Netherlands)',
      'Banque de France FICP (France — a public negative-only payment-incident register, not a private bureau)',
    ],
    scoreRangeLabel:
      'No unified EU-wide score — formats vary by member state (percentage-based, point-based, or file-only public registers with no consumer-facing "score" at all)',
    scoringModelNotes:
      'The EU has no single harmonized consumer credit-scoring system. Each member state runs its own ecosystem: some rely on private credit bureaus similar to the U.S./UK model, while others (notably France, via the Banque de France\'s FICP register) rely more on public, negative-only incident registers that record payment defaults rather than a full positive-and-negative credit history. This means the very concept of "your credit score" translates very differently depending on which EU country a partner is dealing with.',
    dataProtectionRegime:
      'GDPR (Regulation (EU) 2016/679) applies as the uniform baseline across all EU/EEA member states, with each country adding its own implementing legislation (as Germany does with the BDSG). The EU AI Act, phasing in through 2025-2027, increasingly treats credit-scoring algorithms as a "high-risk AI system" use case subject to additional transparency and oversight obligations layered on top of GDPR.',
    keyDifferencesFromUS: [
      'GDPR is fundamentally rights-based (access, rectification, erasure, restriction, objection, and protection from purely automated decisions under Article 22) rather than built around a fixed retention schedule the way FCRA is.',
      'No single EU-wide consumer reporting law or bureau — protection and infrastructure are fragmented by member state, unlike the U.S.\'s single national FCRA framework applied uniformly by three national bureaus.',
      'Several EU countries (e.g., France) rely on public credit registers for payment incidents rather than, or alongside, private commercial bureaus.',
      'The GDPR erasure ("right to be forgotten") mechanism can, in some circumstances, force deletion of data earlier than a U.S.-style fixed retention window would normally allow — though lenders can still often justify retaining risk-relevant data for a limited period under a "legitimate interest" basis.',
      'The EU is moving toward specific regulation of automated/AI-driven credit-scoring systems (the CJEU SCHUFA ruling plus the incoming AI Act) that currently has no direct U.S. federal counterpart.',
    ],
    disputeRightsSummary:
      'Baseline GDPR rights — access, rectification, erasure, and the right to object to purely automated decision-making — apply across every EU member state and are enforced by each country\'s national Data Protection Authority (DPA). Many member states also have their own financial ombudsman scheme for lender-conduct complaints, but there is no single EU-wide credit-dispute body equivalent to the U.S. CFPB.',
    reportingWindowYears: 5,
  },
];

export function getFundingRulesForApplicantType(
  applicantType: NonCitizenFundingRule['applicantType'],
): NonCitizenFundingRule[] {
  return NON_CITIZEN_FUNDING_RULES.filter((rule) => rule.applicantType === applicantType);
}

export function getFundingRulesForLoanType(
  loanType: NonCitizenFundingRule['loanType'],
): NonCitizenFundingRule[] {
  return NON_CITIZEN_FUNDING_RULES.filter((rule) => rule.loanType === loanType);
}

export function getInternationalCreditSystem(
  countryCode: InternationalCreditSystem['countryCode'],
): InternationalCreditSystem | null {
  return INTERNATIONAL_CREDIT_SYSTEMS.find((system) => system.countryCode === countryCode) ?? null;
}

export function getAllNonCitizenFundingRules(): NonCitizenFundingRule[] {
  return NON_CITIZEN_FUNDING_RULES;
}

export function getAllInternationalCreditSystems(): InternationalCreditSystem[] {
  return INTERNATIONAL_CREDIT_SYSTEMS;
}
