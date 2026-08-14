/**
 * Business-credit tier matrix + corporate funding-instrument doctrine — Deep Marketing &
 * Proof Intelligence Sprint (Phase 3).
 *
 * DISCLAIMER: Vendor approval criteria, tier progression timelines, Paydex/Intelliscore
 * ranges, and funding ranges below are general market education compiled from widely
 * published business-credit-building practice — they are NOT guarantees. Actual approval,
 * limits, and terms always depend on the lender's or vendor's current underwriting
 * standards, which change over time without notice. Nothing here is legal, tax, or
 * financial advice; a business owner should verify current terms directly with each
 * vendor/lender/bureau before relying on any figure.
 *
 * This is the "extreme" companion to the 10-step roadmap in `src/domain/businessCredit.ts`
 * (`BUSINESS_ROADMAP_STEPS`) — that file covers the sequential foundation checklist; this
 * repo goes deep on the tiered vendor-credit matrix, bureau mechanics, personal-guarantee
 * (PG) release strategy, and the funding-instrument landscape a business graduates into
 * once a file is established. No UI is wired to this file yet — it is pure knowledge depth
 * for a later dedicated phase (AI copilot grounding, coach content, funding-readiness tools).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type BusinessCreditBureauKey = 'dnb' | 'experian_small_business' | 'equifax_business';

export interface BusinessCreditTierStrategy {
  tier: 1 | 2 | 3 | 4 | 5;
  /** e.g. "Tier 1: Net-30 Vendor Accounts (No PG, Easy Approval)" */
  tierName: string;
  targetBureaus: BusinessCreditBureauKey[];
  /** e.g. 80 for Paydex; treat as an Intelliscore/Equifax-equivalent target when the bureau differs */
  minimumPaydexOrScore: number;
  /** e.g. "Low 5 ($10,000-$39,999 avg daily balance)" — informal bank-rating shorthand used by underwriters/brokers */
  bankRatingRequired?: string;
  /** Industry codes/categories that face extra underwriting scrutiny, and how to position around it */
  naicsRiskBypass: string[];
  /** REAL, well-known net-30/vendor-credit companies commonly cited in business-credit-building education */
  vendorList: { name: string; reportingBureau: string; approvalCriteria: string }[];
  /** How businesses typically negotiate removal of a personal guarantee as tier/history improves */
  pgReleaseStrategy?: string;
  timeToNextTierWeeks: number;
  commonMistakes: string[];
}

export type BusinessFundingInstrumentType =
  | 'sba_7a'
  | 'sba_504'
  | 'business_line_of_credit'
  | 'equipment_financing'
  | 'invoice_factoring'
  | 'merchant_cash_advance'
  | 'term_loan'
  | 'commercial_real_estate'
  | 'business_credit_card_stacking';

export type BusinessStage = 'startup_0_6mo' | 'established_6_24mo' | 'mature_2yr_plus';

export interface BusinessFundingInstrument {
  id: string;
  instrumentType: BusinessFundingInstrumentType;
  typicalUnderwritingFactors: string[];
  /** e.g. "$5,000 - $150,000" — general market range, not a guarantee */
  fundingRangeLabel: string;
  documentationNeeded: string[];
  bestFitBusinessStage: BusinessStage;
  risksAndCautions: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Tier 1 — No-PG net-30 vendor accounts (foundation reporting)
// ─────────────────────────────────────────────────────────────────────────────

const TIER_1: BusinessCreditTierStrategy = {
  tier: 1,
  tierName: 'Tier 1: Net-30 Vendor Accounts (No PG, Easy Approval)',
  targetBureaus: ['dnb', 'experian_small_business'],
  minimumPaydexOrScore: 0,
  naicsRiskBypass: [
    'Construction/contracting NAICS codes (23xx) often face extra scrutiny at Tier 2+ — Tier 1 vendors are usually the only accessible path at month 0-3; keep invoices itemized as office/supply purchases where accurate to avoid "trade-specific" risk flags.',
    'Restaurant/food service (72xx) and trucking/transportation (48xx-49xx) are commonly treated as higher-risk by underwriters later on — build a longer Tier 1/Tier 2 runway before applying for fuel or fleet cards so the file shows depth, not just recency.',
    'Home-based or single-member LLC filings can trigger manual review — a business phone with a 411 directory listing and a business address matching Secretary of State filings reduces this friction at intake.',
  ],
  vendorList: [
    {
      name: 'Uline',
      reportingBureau: 'D&B',
      approvalCriteria: 'Generally approves new EIN-only businesses with a verifiable phone/address and no trade history required; first orders are often small and paid up front, with net-30 terms extended after an initial purchase.',
    },
    {
      name: 'Quill',
      reportingBureau: 'D&B',
      approvalCriteria: 'Office-supply account commonly cited as beginner-friendly; approval typically depends on a matching business name/address/phone and a modest first order, not existing credit history.',
    },
    {
      name: 'Grainger',
      reportingBureau: 'D&B',
      approvalCriteria: 'Industrial-supply account; business account application usually requires EIN, business address, and a completed credit application — approval commonly reported even with a thin file.',
    },
    {
      name: 'Summa Office Supplies',
      reportingBureau: 'D&B',
      approvalCriteria: 'Frequently cited as one of the easiest first tradelines to obtain; a small paid-in-advance order is often required before net-30 terms are reported.',
    },
    {
      name: 'Crown Office Supplies',
      reportingBureau: 'D&B',
      approvalCriteria: 'Similar profile to Summa — an established online storefront with a documented business-credit application process aimed at new EIN entities.',
    },
    {
      name: 'Strategic Network Solutions',
      reportingBureau: 'D&B',
      approvalCriteria: 'IT/telecom services vendor commonly referenced for reporting a trade line quickly after a first paid service order.',
    },
    {
      name: 'Wise Business Plans',
      reportingBureau: 'D&B',
      approvalCriteria: 'Business-plan writing service sometimes used as an early reporting vendor; approval generally tied to completing a paid engagement rather than a credit pull.',
    },
  ],
  pgReleaseStrategy: 'Tier 1 accounts are typically opened without a personal guarantee by design (small dollar exposure, EIN-only application) — there is usually nothing to release. The strategic value is purely in generating 3-5 reporting trade lines to establish a D&B PAYDEX file before attempting Tier 2.',
  timeToNextTierWeeks: 8,
  commonMistakes: [
    'Applying to 5+ vendors in the same week — spacing applications over several weeks looks more organic to underwriting systems.',
    'Letting the first invoice go past net-30 while waiting for it to "report automatically" — most vendors only report if the account is paid, so a missed or slow first payment can suppress the very trade line you are trying to build.',
    'Using a personal cell number or a residential address that does not match Secretary of State filings, D-U-N-S, and the business bank account.',
    'Assuming any single vendor order guarantees reporting — reporting frequency and thresholds vary by vendor and change without notice.',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Tier 2 — Store/retail credit lines (light PG, first real limits)
// ─────────────────────────────────────────────────────────────────────────────

const TIER_2: BusinessCreditTierStrategy = {
  tier: 2,
  tierName: 'Tier 2: Retail & Store Credit Lines (Light Underwriting, Modest Limits)',
  targetBureaus: ['dnb', 'experian_small_business', 'equifax_business'],
  minimumPaydexOrScore: 80,
  bankRatingRequired: 'Low 4 ($2,500-$9,999 avg daily balance) or better commonly referenced as a soft floor',
  naicsRiskBypass: [
    'Retail-adjacent NAICS codes generally clear Tier 2 more easily than construction/trucking codes — businesses in higher-scrutiny industries often route through Amazon Business or Office Depot/OfficeMax first since those accept a broader range of registered entities.',
    'Newer entities (under 6 months) sometimes get soft-denied for store cards even with clean Tier 1 history — waiting for at least one full reporting cycle (30-60 days) after Tier 1 accounts post commonly improves approval odds.',
  ],
  vendorList: [
    {
      name: 'Home Depot Commercial Revolving Card',
      reportingBureau: 'D&B / Equifax Business',
      approvalCriteria: 'Business application generally reviews EIN, time in business, and D&B file; approval and starting limit are commonly influenced by an established PAYDEX history from Tier 1 reporting.',
    },
    {
      name: "Lowe's Business Advantage / Commercial Account",
      reportingBureau: 'D&B',
      approvalCriteria: 'Similar profile to Home Depot; store-brand business credit typically underwritten with a light personal credit check alongside business file data.',
    },
    {
      name: 'Amazon Business (Pay by Invoice / Amazon Business Line of Credit)',
      reportingBureau: 'D&B (varies by product)',
      approvalCriteria: 'Amazon Business accounts are commonly opened with just an EIN and business verification; invoicing/net-terms features and the business line of credit have their own separate underwriting and are not guaranteed for every account.',
    },
    {
      name: 'Staples Business / Office Depot-OfficeMax Business Account',
      reportingBureau: 'D&B',
      approvalCriteria: 'Office-supply retailer business accounts are frequently cited as accessible after 2-3 reporting Tier 1 trade lines are established.',
    },
    {
      name: 'Wex Fleet Card / Fuelman',
      reportingBureau: 'D&B / Experian Business',
      approvalCriteria: 'Fuel-card programs generally require a completed business application and sometimes a light personal credit check for a personal guarantee at this tier; approval commonly scales with fleet size and time in business.',
    },
  ],
  pgReleaseStrategy: 'Some Tier 2 retail cards carry a soft or "light" personal guarantee. As the business PAYDEX/Intelliscore rises and the account ages 12+ months with on-time payments, businesses commonly request a credit-limit increase or account conversion; a small number of issuers will remove or reduce the PG requirement on request once the business file independently supports the exposure — this is issuer-specific and not guaranteed.',
  timeToNextTierWeeks: 10,
  commonMistakes: [
    'Applying for retail cards before any Tier 1 trade line has actually posted to D&B/Experian — the underwriting system sees a blank file and denies or requires a full personal guarantee.',
    'Maxing out a new retail card in the first billing cycle — utilization above roughly 30% commonly suppresses the score gains this tier is meant to produce.',
    'Ignoring the fine print on which accounts report to which bureau — some retail cards only report to one bureau, leaving the others thin.',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Tier 3 — Fleet/fuel + first business credit cards (moderate PG)
// ─────────────────────────────────────────────────────────────────────────────

const TIER_3: BusinessCreditTierStrategy = {
  tier: 3,
  tierName: 'Tier 3: Fleet Cards & First Business Credit Cards (Moderate Underwriting)',
  targetBureaus: ['dnb', 'experian_small_business', 'equifax_business'],
  minimumPaydexOrScore: 80,
  bankRatingRequired: 'Med 5 ($20,000-$29,999 avg daily balance) or better commonly referenced as a target',
  naicsRiskBypass: [
    'Cash-intensive or high-chargeback NAICS codes (e.g., certain retail, travel, and personal-services categories) often see issuers request additional bank statements or a co-signer at this tier — a clean 6-month bank-statement history with consistent deposits generally offsets this.',
    'Sole proprietors filing under an SSN rather than an EIN are frequently declined outright at Tier 3 — formal entity conversion (LLC/S-corp/C-corp) is commonly treated as a prerequisite by issuers before underwriting proceeds.',
  ],
  vendorList: [
    {
      name: 'Shell Fleet Plus / Shell Small Business Card',
      reportingBureau: 'Experian Business / D&B',
      approvalCriteria: 'Fleet-fuel programs typically require an EIN, time-in-business documentation, and a personal credit check that anchors a personal guarantee at this tier; limits commonly scale with fleet size.',
    },
    {
      name: 'BP Business Solutions Fuel Card',
      reportingBureau: 'D&B',
      approvalCriteria: 'Comparable underwriting to other major fleet-card programs; approval commonly depends on an established D&B file plus a personal credit review.',
    },
    {
      name: 'Chevron/Texaco Business Card',
      reportingBureau: 'D&B',
      approvalCriteria: 'Fuel-card underwriting generally weighs both the business file and an owner personal credit check for the guarantee.',
    },
    {
      name: 'Capital One Spark Classic for Business',
      reportingBureau: 'Experian Business / Equifax Business / personal bureaus',
      approvalCriteria: 'Entry-level business credit card commonly approved with fair-to-good personal credit alongside basic business documentation; reports to both business and (for the guarantor) personal files depending on card product.',
    },
    {
      name: 'U.S. Bank Business Platinum / Triple Cash Rewards',
      reportingBureau: 'Experian Business / Equifax Business',
      approvalCriteria: 'Underwriting commonly blends personal credit score, time in business, and annual revenue self-reported on the application.',
    },
  ],
  pgReleaseStrategy: 'Tier 3 cards are almost always PG-backed at issuance. The typical path to release: 18-24 months of on-time payment history, a business Intelliscore/PAYDEX in the "low risk" band, and 2+ years filed tax returns showing positive revenue — at that point a business can request an unsecured limit increase or a product conversion to a no-PG commercial card; issuers evaluate this case-by-case and may decline.',
  timeToNextTierWeeks: 16,
  commonMistakes: [
    'Treating a Tier 3 fuel or store card as "no PG" when the fine print discloses a personal guarantee — missed payments here hit the owner\'s personal credit file, not just the business file.',
    'Applying for multiple fleet/fuel cards in a short window, generating several personal credit inquiries that can temporarily depress the guarantor\'s personal score.',
    'Skipping bookkeeping cleanup — issuers at this tier increasingly ask for bank statements, and disorganized statements slow or sink approval.',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Tier 4 — Bank-issued business cards & small revolving lines (full PG typical)
// ─────────────────────────────────────────────────────────────────────────────

const TIER_4: BusinessCreditTierStrategy = {
  tier: 4,
  tierName: 'Tier 4: Bank-Issued Business Cards & Small Revolving Lines (Full PG Typical)',
  targetBureaus: ['dnb', 'experian_small_business', 'equifax_business'],
  minimumPaydexOrScore: 80,
  bankRatingRequired: 'High 5 ($40,000-$49,999 avg daily balance) or Low 6 commonly referenced as competitive',
  naicsRiskBypass: [
    'Businesses in industries banks classify as higher-risk (e.g., firearms, cannabis-adjacent, certain lending/financial-services NAICS codes) frequently cannot access Tier 4 bank products at all regardless of file strength — a business-friendly regional bank or credit union with an existing deposit relationship is commonly the realistic path.',
    'Businesses without at least 2 years of filed business tax returns are commonly steered toward the entry-level version of a Tier 4 product (lower limit, still full PG) rather than the flagship product.',
  ],
  vendorList: [
    {
      name: 'Chase Ink Business Preferred / Ink Business Cash',
      reportingBureau: 'Experian Business / Equifax Business / personal bureaus',
      approvalCriteria: 'Underwriting commonly weighs good-to-excellent personal credit, business revenue, and an existing Chase banking relationship as a favorable factor.',
    },
    {
      name: 'American Express Business Gold / Business Platinum',
      reportingBureau: 'Experian Business (varies) / personal bureaus for the guarantor',
      approvalCriteria: 'Approval commonly considers overall Amex relationship history, personal credit profile, and self-reported business revenue; charge-card products may not report a fixed limit.',
    },
    {
      name: 'Bank of America Business Advantage Unlimited Cash Rewards / Business Advantage Line of Credit',
      reportingBureau: 'Equifax Business / D&B',
      approvalCriteria: 'Existing Bank of America business-deposit relationship is frequently cited as improving approval odds and pricing; underwriting reviews personal credit, time in business, and revenue.',
    },
    {
      name: 'Wells Fargo Business Secured/Unsecured Line of Credit',
      reportingBureau: 'Equifax Business / D&B',
      approvalCriteria: 'Unsecured version generally requires 2+ years in business and supporting financials; secured version (cash-collateralized) is commonly used as a bridge for newer businesses.',
    },
  ],
  pgReleaseStrategy: 'Full PG release at Tier 4 is uncommon but not unheard of for card products once a business shows several years of strong revenue and an excellent business credit score; more realistically, businesses use Tier 4 accounts as the credit-history bridge to Tier 5 unsecured lines rather than expecting PG removal on the card itself.',
  timeToNextTierWeeks: 24,
  commonMistakes: [
    'Applying for a flagship bank card before the business has 2 full years of tax returns — many get default-declined regardless of personal credit strength.',
    'Not disclosing existing business debt accurately on the application — banks cross-check against bureau data and inconsistencies can trigger a decline or account closure later.',
    'Carrying high personal credit utilization while applying, since Tier 4 products still weigh the guarantor\'s personal file heavily.',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Tier 5 — Institutional unsecured lines & true corporate credit (minimal/negotiated PG)
// ─────────────────────────────────────────────────────────────────────────────

const TIER_5: BusinessCreditTierStrategy = {
  tier: 5,
  tierName: 'Tier 5: Institutional Unsecured Lines & Corporate Credit (Minimal / Negotiated PG)',
  targetBureaus: ['dnb', 'experian_small_business', 'equifax_business'],
  minimumPaydexOrScore: 80,
  bankRatingRequired: 'Low 6 ($60,000-$99,999 avg daily balance) or higher commonly referenced for larger unsecured facilities',
  naicsRiskBypass: [
    'Even a strong file will not overcome an industry banks treat as categorically excluded (certain high-risk lending, gambling, or cannabis-adjacent codes) — businesses in these categories typically pursue non-bank institutional lenders or alternative asset-backed structures instead.',
    'Holding-company or multi-entity structures are sometimes used to separate a higher-risk operating NAICS code from the entity that applies for credit, when done transparently and with proper legal/accounting guidance — this is a structural, not a concealment, strategy.',
  ],
  vendorList: [
    {
      name: 'Wells Fargo / US Bank / regional bank institutional revolving lines',
      reportingBureau: 'Equifax Business / D&B',
      approvalCriteria: 'Underwriting at this level generally requires audited or reviewed financial statements, 2-3 years of tax returns, strong business credit scores across bureaus, and often a banking relationship manager rather than an online application.',
    },
    {
      name: 'Corporate credit-card programs (e.g., large-issuer commercial card platforms)',
      reportingBureau: 'D&B / Equifax Business (business-only reporting on true corporate cards)',
      approvalCriteria: 'True corporate cards (as opposed to small-business cards) are commonly underwritten on business financials alone once revenue and credit-history thresholds are met, reducing or removing reliance on a single owner\'s personal guarantee.',
    },
  ],
  pgReleaseStrategy: 'This is the tier where PG removal is most realistically negotiated: strong multi-year financials, an excellent business credit score across all three bureaus, positive cash flow, and (often) an existing multi-product banking relationship give a business leverage to request an unsecured facility underwritten on the business alone. Lenders still retain discretion to require a PG for any given deal size or risk profile.',
  timeToNextTierWeeks: 0,
  commonMistakes: [
    'Assuming Tier 5 access is purely a function of "credit building" rather than actual revenue, profitability, and financial-statement quality — at this level, real financials matter more than trade-line count.',
    'Skipping a relationship banker/underwriter conversation and applying online for a product that is only originated through relationship channels.',
    'Over-leveraging across too many Tier 4 accounts before consolidating into a Tier 5 facility, which can hurt the debt-to-revenue ratios lenders evaluate here.',
  ],
};

export const BUSINESS_CREDIT_TIER_STRATEGIES: BusinessCreditTierStrategy[] = [
  TIER_1,
  TIER_2,
  TIER_3,
  TIER_4,
  TIER_5,
];

// ─────────────────────────────────────────────────────────────────────────────
// Funding instruments
// ─────────────────────────────────────────────────────────────────────────────

export const BUSINESS_FUNDING_INSTRUMENTS: BusinessFundingInstrument[] = [
  {
    id: 'sba-7a-general-purpose',
    instrumentType: 'sba_7a',
    typicalUnderwritingFactors: [
      'Personal credit score of the majority owner(s), typically expected in the good-to-excellent range by most participating lenders',
      'Business (and often personal) tax returns for the last 2-3 years',
      'Debt-service coverage ratio (DSCR) showing cash flow can support the new payment',
      'Collateral availability (SBA generally requires lenders to take available collateral but will not decline solely for lack of it on smaller loans)',
      'Use-of-funds narrative and business plan for startups or acquisitions',
    ],
    fundingRangeLabel: '$30,000 - $5,000,000 (general market range; SBA 7(a) program cap is $5M)',
    documentationNeeded: [
      'SBA Form 1919 (Borrower Information Form)',
      'Personal financial statement (SBA Form 413)',
      '2-3 years business and personal tax returns',
      'Business formation documents (Articles of Incorporation/Organization, EIN letter)',
      'Business debt schedule',
      'Year-to-date profit & loss and balance sheet',
      'Business bank statements (typically 6-12 months)',
    ],
    bestFitBusinessStage: 'established_6_24mo',
    risksAndCautions: [
      'Almost always requires a personal guarantee from owners with 20%+ equity stake, and sometimes a lien on personal residence for larger amounts.',
      'Approval timelines commonly run 30-90+ days, which can be a mismatch for urgent working-capital needs.',
      'SBA guaranty fees and closing costs add to the effective cost of the loan beyond the stated interest rate.',
    ],
  },
  {
    id: 'sba-504-fixed-asset',
    instrumentType: 'sba_504',
    typicalUnderwritingFactors: [
      'Owner-occupancy requirement for real estate (business must typically occupy 51%+ of an existing building or 60%+ of new construction)',
      'Job-creation or public-policy goal justification tied to the loan amount',
      'Combined loan-to-value across the bank first-lien and CDC second-lien portions',
      'Business net worth and net income ceilings set by the SBA 504 program',
    ],
    fundingRangeLabel: '$125,000 - $5,500,000 (CDC/SBA debenture portion; total project cost typically higher)',
    documentationNeeded: [
      'Purchase agreement or construction/renovation cost estimates',
      'Business and personal tax returns (2-3 years)',
      'Personal financial statements for all 20%+ owners',
      'Appraisal and environmental (Phase I) report for the real property',
      'Business plan / project description',
      'Corporate formation documents',
    ],
    bestFitBusinessStage: 'mature_2yr_plus',
    risksAndCautions: [
      'Structured specifically for real estate/major equipment — not usable for general working capital.',
      'Long closing timeline (often 60-120+ days) due to the two-lender (bank + CDC) structure.',
      'Prepayment penalties on the CDC debenture portion typically apply for roughly the first half of the loan term.',
    ],
  },
  {
    id: 'business-line-of-credit-standard',
    instrumentType: 'business_line_of_credit',
    typicalUnderwritingFactors: [
      'Time in business (many banks require 1-2+ years; some fintech lenders accept 6 months)',
      'Personal and business credit scores across D&B/Experian Business/Equifax Business',
      'Monthly/annual revenue and cash-flow consistency from bank statements',
      'Existing debt load relative to revenue',
    ],
    fundingRangeLabel: '$10,000 - $500,000 (bank/fintech revolving lines; larger institutional lines possible at Tier 5 relationships)',
    documentationNeeded: [
      'Business bank statements (typically 3-12 months)',
      'EIN letter and formation documents',
      'Business tax returns (for bank-tier lines)',
      'Personal guarantee and personal financial statement',
      'Accounts receivable/payable aging (for larger lines)',
    ],
    bestFitBusinessStage: 'established_6_24mo',
    risksAndCautions: [
      'Variable interest rates on many lines mean payment amounts can rise if the line is drawn during a rate increase.',
      'Some lenders charge maintenance/draw fees that erode the value of an unused line.',
      'Personal guarantee is standard below Tier 5-level relationships — a missed payment can affect the guarantor\'s personal credit.',
    ],
  },
  {
    id: 'equipment-financing-standard',
    instrumentType: 'equipment_financing',
    typicalUnderwritingFactors: [
      'The equipment itself generally serves as collateral, so underwriting weighs equipment type, useful life, and resale value alongside business credit',
      'Time in business and revenue, though startups can sometimes qualify with a larger down payment or stronger personal credit',
      'Vendor/equipment quote and total project cost',
    ],
    fundingRangeLabel: '$5,000 - $2,000,000+ (scales with equipment cost)',
    documentationNeeded: [
      'Equipment quote or purchase order from the vendor/seller',
      'Business bank statements (3-6 months)',
      'EIN letter and formation documents',
      'Personal guarantee (for most deals below institutional scale)',
      'Business/personal tax returns for larger transactions',
    ],
    bestFitBusinessStage: 'startup_0_6mo',
    risksAndCautions: [
      'Repossession risk on the financed equipment if payments are missed, in addition to any personal guarantee exposure.',
      'Some equipment lenders bundle add-on fees (documentation, UCC filing) that increase the effective APR beyond the quoted rate.',
      'Financing obsolescing equipment (e.g., fast-depreciating tech) on a long term can leave the business owing more than the equipment is worth.',
    ],
  },
  {
    id: 'invoice-factoring-standard',
    instrumentType: 'invoice_factoring',
    typicalUnderwritingFactors: [
      'Creditworthiness of the business\'s customers (the invoice debtors) matters more than the business\'s own credit profile',
      'Invoice aging and industry (factoring is common in staffing, trucking, construction subcontracting, and B2B services)',
      'Concentration risk — a factor may limit exposure to invoices from any single customer',
    ],
    fundingRangeLabel: '$10,000 - $10,000,000+ (scales with receivables volume; advance rates commonly 70-90% of invoice face value)',
    documentationNeeded: [
      'Accounts receivable aging report',
      'Sample outstanding invoices and the underlying customer contracts',
      'Business bank statements',
      'UCC lien search / payoff letters if receivables are already pledged elsewhere',
      'EIN letter and formation documents',
    ],
    bestFitBusinessStage: 'startup_0_6mo',
    risksAndCautions: [
      'Factoring fees (discount rate) are typically charged per invoice per period outstanding and can compound into a high effective annualized cost if invoices are slow to pay.',
      'Some factoring agreements are "notification" style, meaning the factor contacts the business\'s customers directly to collect — this can affect customer relationships if not disclosed upfront.',
      'Recourse factoring agreements can require the business to buy back an invoice its customer never pays, shifting the credit risk back to the business.',
    ],
  },
  {
    id: 'merchant-cash-advance-standard',
    instrumentType: 'merchant_cash_advance',
    typicalUnderwritingFactors: [
      'Daily/weekly credit-card or bank-deposit volume, reviewed via recent bank/processing statements',
      'Consistency of deposits rather than traditional credit score (approval is possible even with poor personal credit)',
      'Existing MCA "stacking" (multiple concurrent advances) is a major red flag to underwriters and increases decline risk or reduces offer size',
    ],
    fundingRangeLabel: '$5,000 - $500,000 (typically sized as a multiple of monthly revenue/deposits)',
    documentationNeeded: [
      'Business bank statements (typically 3-6 months)',
      'Merchant processing statements if repayment is card-split based',
      'Voided business check for ACH setup',
      'Basic business formation/EIN documentation',
    ],
    bestFitBusinessStage: 'startup_0_6mo',
    risksAndCautions: [
      'IMPORTANT COST WARNING: MCAs are priced with a factor rate (e.g., 1.2-1.5x the amount advanced), not a stated APR — when converted to an annualized rate, the effective cost is frequently far higher than a bank loan or line of credit, sometimes reaching triple-digit APR-equivalents depending on term length and factor rate.',
      'Daily or weekly automatic withdrawals from the business bank account can strain cash flow, especially in slower revenue periods, since payments do not flex down the way a percentage-of-sales product implies for every provider.',
      'Stacking multiple MCAs to cover payments on prior advances is a common debt spiral risk and should be treated as a serious warning sign, not a normal financing strategy.',
      'Because MCAs are structured as a "purchase of future receivables" rather than a loan in many states, some consumer/small-business lending protections may not apply the same way — read the contract\'s reconciliation and default clauses carefully.',
    ],
  },
  {
    id: 'term-loan-standard',
    instrumentType: 'term_loan',
    typicalUnderwritingFactors: [
      'Time in business, annual revenue, and business/personal credit scores',
      'Debt-service coverage ratio and existing debt load',
      'Purpose of funds (expansion, working capital, refinance) and repayment source',
    ],
    fundingRangeLabel: '$10,000 - $1,000,000+ (bank and online/fintech term loans; larger amounts at institutional scale)',
    documentationNeeded: [
      'Business bank statements (3-12 months)',
      'Business tax returns (1-3 years, more for bank-tier loans)',
      'Personal guarantee and personal financial statement',
      'Business debt schedule',
      'Formation documents and EIN letter',
    ],
    bestFitBusinessStage: 'established_6_24mo',
    risksAndCautions: [
      'Online/fintech term loans often carry higher effective rates than bank term loans in exchange for faster funding and lighter documentation — compare total repayment cost, not just the headline rate.',
      'Prepayment penalties or fixed total-interest structures on some fintech products mean paying early does not always reduce the total cost the way it would on a traditional amortizing bank loan.',
      'Personal guarantee is standard outside of Tier 5-level institutional relationships.',
    ],
  },
  {
    id: 'commercial-real-estate-standard',
    instrumentType: 'commercial_real_estate',
    typicalUnderwritingFactors: [
      'Loan-to-value (LTV) ratio on the property, commonly capped in the 65-80% range depending on lender and property type',
      'Debt-service coverage ratio based on the property\'s (or business\'s) net operating income',
      'Borrower/guarantor credit profile and real-estate experience for larger or investment-property deals',
      'Property appraisal, environmental review, and title/survey work',
    ],
    fundingRangeLabel: '$150,000 - $10,000,000+ (scales heavily with property value and market)',
    documentationNeeded: [
      'Purchase agreement or existing property financials (rent roll, operating statements) for refinances',
      'Appraisal and environmental (Phase I) report',
      'Business and personal tax returns (2-3 years)',
      'Personal financial statement for guarantors',
      'Entity formation documents and, for larger deals, an operating agreement showing ownership structure',
    ],
    bestFitBusinessStage: 'mature_2yr_plus',
    risksAndCautions: [
      'Long closing timelines (often 45-90+ days) due to appraisal, environmental, and title work.',
      'Balloon payment structures are common on commercial mortgages (e.g., 5- or 10-year balloon on a 25-year amortization) — refinancing risk at the balloon date should be planned for in advance.',
      'Personal guarantees are typical for owner-operated properties; non-recourse structures generally require stronger deals and institutional-quality sponsors.',
    ],
  },
  {
    id: 'business-credit-card-stacking-standard',
    instrumentType: 'business_credit_card_stacking',
    typicalUnderwritingFactors: [
      'Personal credit score and utilization of the guarantor(s) applying across multiple card issuers',
      'Number of recent hard inquiries and newly opened accounts (issuers watch for rapid multi-application patterns)',
      'Self-reported business revenue on each individual application',
      'Existing relationship/history with each specific issuer',
    ],
    fundingRangeLabel: '$10,000 - $250,000+ combined across multiple cards (varies widely by personal credit profile and number of cards)',
    documentationNeeded: [
      'EIN letter and business formation documents (for each application)',
      'Personal credit report review before applying (to sequence applications by issuer credit-pull policy)',
      'Estimated annual business revenue figures for each application',
      'Personal guarantee on each card',
    ],
    bestFitBusinessStage: 'startup_0_6mo',
    risksAndCautions: [
      'Every card in the stack typically carries a personal guarantee — this concentrates repayment risk on the guarantor\'s personal credit, not just the business.',
      'Rapid application velocity across issuers can trigger issuer-specific anti-gaming rules (e.g., "5/24"-style policies at some issuers) that lead to automatic declines or account shutdowns.',
      'Interest rates on unpaid revolving balances are typically much higher than a bank term loan or line of credit — stacking is generally best suited to funding that is repaid quickly, not carried long-term.',
      'Combined minimum payments across several cards can strain monthly cash flow faster than a single consolidated facility would.',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getTierStrategy(tier: 1 | 2 | 3 | 4 | 5): BusinessCreditTierStrategy | undefined {
  return BUSINESS_CREDIT_TIER_STRATEGIES.find((strategy) => strategy.tier === tier);
}

export function getAllTierStrategies(): BusinessCreditTierStrategy[] {
  return BUSINESS_CREDIT_TIER_STRATEGIES;
}

export function getFundingInstrumentsByStage(stage: BusinessStage): BusinessFundingInstrument[] {
  return BUSINESS_FUNDING_INSTRUMENTS.filter((instrument) => instrument.bestFitBusinessStage === stage);
}

export function getFundingInstrument(id: string): BusinessFundingInstrument | undefined {
  return BUSINESS_FUNDING_INSTRUMENTS.find((instrument) => instrument.id === id);
}

export function getAllFundingInstruments(): BusinessFundingInstrument[] {
  return BUSINESS_FUNDING_INSTRUMENTS;
}
