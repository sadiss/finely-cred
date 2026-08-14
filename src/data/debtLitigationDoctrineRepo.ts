/**
 * Debt collection law & civil litigation defense doctrine repository — Deep Marketing &
 * Proof Intelligence Sprint (Phase 2).
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * THIS IS GENERAL LEGAL EDUCATION CONTENT, NOT LEGAL ADVICE, AND FINELY CRED IS NOT A LAW
 * FIRM. Debt collection and civil-procedure law (answer deadlines, statutes of limitation,
 * garnishment exemptions, service-of-process rules, foreclosure procedure, tax collection
 * procedure, etc.) varies significantly from state to state, changes over time, and can
 * turn on facts not captured here. Nothing in this file should be presented to a partner
 * as a guarantee of any outcome, and it must never substitute for advice from a licensed
 * attorney in the partner's own jurisdiction — especially anywhere close to a court
 * deadline (e.g., an answer date on a summons, a garnishment-exemption filing window, or a
 * motion-to-vacate deadline). Only real, well-known, independently verifiable statutes and
 * case precedents are included below; where a rule is state-specific or unsettled, the
 * entry says so explicitly rather than asserting a single nationwide rule.
 *
 * This repository backs future AI-agent reasoning and Letter Studio grounding for
 * debt-defense scenarios (validation letters, summons answers, discovery demands,
 * post-judgment emergencies, and FDCPA counter-suits). UI wiring is intentionally out of
 * scope for this phase — this file is pure knowledge depth.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */

export interface DebtLitigationPlaybook {
  id: string;
  debtType:
    | 'credit_card'
    | 'medical'
    | 'auto_repossession'
    | 'mortgage_foreclosure'
    | 'student_loan'
    | 'bank_overdraft'
    | 'personal_loan'
    | 'tax_lien'
    | 'merchant_cash_advance'
    | 'payday_loan'
    | 'timeshare';
  phase: 'pre_suit_validation' | 'summons_answer' | 'discovery_motion' | 'post_judgment_emergency' | 'counter_suit';
  title: string;
  overview: string;
  /** Real citations only — state-specific rules are noted generically with a "varies — verify locally" caveat. */
  statutoryBasis: string[];
  /** ONLY real, well-known, verifiable precedents. If unsure a case is real or accurately described, it is omitted rather than fabricated. */
  caseLawPrecedents: string[];
  remedyAction: {
    actionType:
      | 'wage_garnishment_exemption'
      | 'bank_levy_quash'
      | 'motion_to_vacate'
      | 'fdcpa_counter_suit'
      | 'cfpb_ag_complaint'
      | 'answer_and_affirmative_defenses'
      | 'discovery_demand'
      | 'statute_of_limitations_defense';
    legalRequirements: string[];
    /** General federal exemption categories — not an exhaustive or state-specific list. */
    exemptFundTypes?: string[];
    /** Plain-English, general/educational step-by-step — not a substitute for counsel. */
    executionSteps: string[];
  };
  practicalWarnings: string[];
  disclaimer: string;
}

const DISCLAIMER =
  'General legal education only — not legal advice. Debt collection law varies significantly by state; consult a licensed attorney for your specific situation and jurisdiction.';

// ── Shared statutory-citation fragments (reused verbatim across entries for consistency) ──

const FDCPA_VALIDATION =
  '15 U.S.C. § 1692g (FDCPA § 809) — validation notice; consumer may dispute in writing within 30 days and demand verification';
const FDCPA_CEASE =
  '15 U.S.C. § 1692c(c) (FDCPA § 805(c)) — written cease-communication right, subject to limited statutory exceptions';
const FDCPA_FALSE = '15 U.S.C. § 1692e — bars false, deceptive, or misleading representations in debt collection';
const FDCPA_UNFAIR = '15 U.S.C. § 1692f — bars unfair or unconscionable collection means, including unauthorized fees';
const FDCPA_VENUE =
  '15 U.S.C. § 1692i — venue restrictions requiring a debt-collection suit to be filed where the contract was signed or where the consumer resides';
const FDCPA_LIABILITY =
  '15 U.S.C. § 1692k — actual damages, statutory damages up to $1,000, and attorney fees for FDCPA violations (generally a one-year statute of limitations under § 1692k(d))';
const REG_F_CALL_FREQUENCY =
  'Regulation F, 12 C.F.R. § 1006.14(b) — presumptive "7-in-7" limit on collector telephone-contact frequency';
const FCRA_FURNISHER = '15 U.S.C. § 1681s-2 (FCRA § 623) — furnisher duty to report accurately and investigate disputes';
const SOL_DEFENSE =
  'State statute of limitations for contract/open-account claims (commonly ~3–6 years; varies significantly by state and claim type) — generally an affirmative defense that must be raised, not an automatic bar';
const ANSWER_DEADLINE =
  'State rules of civil procedure governing the deadline to answer a summons (commonly 20–35 days after service; varies by state and case type) — verify local court rules and any deadline stated on the summons itself';
const STANDING_ASSIGNMENT =
  'General assignment/contract law and UCC § 3-308 (negotiable instruments) — a party suing on an assigned or negotiable debt generally bears the burden of proving standing and an unbroken chain of title';
const CCPA_GARNISHMENT =
  'Consumer Credit Protection Act wage-garnishment limits, 15 U.S.C. § 1673(a) — generally caps garnishment at the lesser of 25% of disposable weekly earnings or the amount by which disposable earnings exceed 30x the federal minimum wage';
const FED_BENEFITS_EXEMPT =
  'Social Security Act, 42 U.S.C. § 407(a) — Social Security/SSI benefits are generally exempt from garnishment by ordinary judgment creditors (narrow federal-debt exceptions apply)';
const VA_BENEFITS_EXEMPT = '38 U.S.C. § 5301 — VA disability and pension benefits are generally exempt from garnishment by creditors';
const BANKRUPTCY_STAY =
  '11 U.S.C. § 362(a) — filing bankruptcy generally imposes an automatic stay halting collection lawsuits, garnishment, and levies, subject to a creditor seeking court relief from the stay';
const RULE_60_VACATE =
  'State-court analog to FRCP 60(b) — motion to vacate/set aside a default judgment for excusable neglect, improper service, lack of jurisdiction, or fraud (grounds, names, and deadlines vary by state)';
const TCPA_CITE =
  '47 U.S.C. § 227(b) (Telephone Consumer Protection Act) — restricts autodialed or prerecorded calls/texts to cell phones without consent; often paired with FDCPA claims for repeated post-cease-and-desist contact';

// ── Shared, real case-law fragments (reused verbatim; omitted entirely where no confident fit exists) ──

const CASE_HEINTZ =
  'Heintz v. Jenkins, 514 U.S. 291 (1995) (attorneys who regularly collect debts through litigation are "debt collectors" subject to the FDCPA)';
const CASE_JERMAN =
  "Jerman v. Carlisle, McNellie, Rini, Kramer & Ulrich LPA, 559 U.S. 573 (2010) (the FDCPA's bona fide error defense does not cover a collector's mistaken interpretation of the law)";
const CASE_SPOKEO =
  'Spokeo, Inc. v. Robins, 578 U.S. 330 (2016) (a plaintiff must show a concrete, particularized injury — not a bare procedural violation — for Article III standing)';
const CASE_TRANSUNION =
  'TransUnion LLC v. Ramirez, 594 U.S. 413 (2021) (every class member must show concrete injury to recover damages, even in consumer-protection class actions)';
const CASE_MIDLAND =
  'Midland Funding, LLC v. Johnson, 581 U.S. 224 (2017) (filing a proof of claim in bankruptcy on a time-barred debt does not, by itself, violate the FDCPA)';
const CASE_OBDUSKEY =
  'Obduskey v. McCarthy & Holthus LLP, 586 U.S. 466 (2019) (a firm engaged only in nonjudicial foreclosure is generally not a "debt collector" under the FDCPA\'s main definition, though it remains subject to the narrower security-interest-enforcement provision, § 1692f(6))';
const CASE_HENSON =
  'Henson v. Santander Consumer USA Inc., 582 U.S. 79 (2017) (an entity that purchases defaulted debt and collects it for its own account may fall outside the FDCPA\'s "debt collector" definition, which is centered on collecting debts owed to another)';
const CASE_MARX =
  'Marx v. General Revenue Corp., 568 U.S. 371 (2013) (a prevailing FDCPA defendant may recover costs under Rule 54(d) without a separate finding that the suit was brought in bad faith)';
const CASE_BARTLETT =
  "Bartlett v. Heibl, 128 F.3d 497 (7th Cir. 1997) (a validation notice cannot be contradicted or overshadowed by other demanding language in the same collection letter)";
const CASE_CUSHMAN =
  'Cushman v. Trans Union Corp., 115 F.3d 220 (3d Cir. 1997) (FCRA reinvestigation duty may require going beyond the original furnisher when reliability is in question)';
const CASE_DUGUID =
  'Facebook, Inc. v. Duguid, 592 U.S. 395 (2021) (narrowing the statutory definition of "automatic telephone dialing system" under the TCPA)';

// ── IRS / tax-collection specific fragments ──

const IRS_CDP = '26 U.S.C. § 6330 — Collection Due Process right to a hearing before most IRS levies';
const IRS_LIEN_NOTICE = '26 U.S.C. § 6320 — right to a Collection Due Process hearing after a Notice of Federal Tax Lien is filed';
const IRS_INSTALLMENT = '26 U.S.C. § 6159 — right to request an installment agreement with the IRS';
const IRS_OIC = '26 U.S.C. § 7122 — Offer in Compromise process to potentially settle a tax debt for less than the full amount owed';
const IRS_CSED =
  '26 U.S.C. § 6502 — general 10-year collection statute of limitations after a tax assessment (the "CSED"), subject to suspension/extension for events like bankruptcy, an installment agreement, or a collection due process appeal';
const IRS_PCA =
  '26 U.S.C. § 6306 — authorizes IRS use of private collection agencies for certain inactive tax debts; those private collectors must identify themselves as IRS contractors and follow specific taxpayer-protection limits (note: government tax debt is generally excluded from the FDCPA\'s "debt" definition, 15 U.S.C. § 1692a(6)(C), so ordinary FDCPA claims usually do not apply to the IRS itself)';
const STATE_TAX_LIEN_SALE =
  'State property-tax lien-sale/tax-foreclosure statutes (vary widely — some states sell lien certificates with a redemption period, others proceed to a more direct tax foreclosure) — verify the specific state statute and redemption deadline';

// ── Mortgage/servicing specific fragments ──

const RESPA_QWR =
  '12 U.S.C. § 2605(e); Regulation X, 12 C.F.R. § 1024.35 — right to submit a written Notice of Error / Request for Information to a mortgage servicer, which must acknowledge and substantively respond within regulatory deadlines';
const TILA_RESCISSION =
  '15 U.S.C. § 1635 (Truth in Lending Act) — a limited right of rescission exists for certain refinances/home-equity loans on a principal dwelling, generally within 3 business days of consummation (potentially extended, in narrow circumstances, for material disclosure violations)';
const FORECLOSURE_NOTICE_CURE =
  'State foreclosure statutes generally require a pre-foreclosure notice of default/right to cure and, in judicial-foreclosure states, service of a summons and complaint (procedures, timelines, and judicial-vs-nonjudicial process vary widely by state)';

// ── Student loan specific fragments ──

const HEA_ADMIN_GARNISH =
  '20 U.S.C. § 1095a — Higher Education Act administrative wage garnishment for defaulted federal student loans (generally up to 15% of disposable pay, without a prior court judgment, subject to advance notice and a right to request a hearing)';
const PRIVATE_STUDENT_LOAN_FDCPA =
  'Private student loan collection (as opposed to federal loan collection) is generally treated as ordinary consumer debt collection and is subject to the FDCPA when handled by a third-party collector or collection law firm';

// ── Merchant cash advance specific fragments ──

const MCA_BUSINESS_DEBT_NOTE =
  'Merchant cash advances are generally structured as a purchase of future receivables for business purposes rather than a consumer loan — the FDCPA\'s consumer "debt" definition (15 U.S.C. § 1692a(5)) generally does not apply to purely commercial/business-purpose debt, which materially changes the available defenses compared to consumer debt';
const NY_COJ_LAW =
  'N.Y. C.P.L.R. § 3218, as amended 2019 — restricts New York courts from entering confessions of judgment against non-New-York-resident debtors in consumer-style transactions; several other states have separately restricted or scrutinized confession-of-judgment clauses used by MCA funders';
const USURY_RECHARACTERIZATION =
  'State usury statutes and the recharacterization doctrine — some courts have scrutinized MCA agreements with fixed daily debits and limited true reconciliation/risk-of-non-repayment features as disguised loans potentially subject to state usury caps (outcomes vary significantly by state and by the specific contract language)';

// ── Payday loan specific fragments ──

const STATE_USURY_CAPS =
  'State small-dollar/payday-lending statutes and usury caps (vary enormously across states, from strict rate caps to permissive licensing regimes) — verify the specific state\'s current law';
const RENT_A_BANK =
  '"Rent-a-bank" / true-lender doctrine — some courts and regulators have scrutinized arrangements where a state-chartered bank originates a high-rate loan and immediately sells or assigns it to a non-bank payday lender to avoid state usury caps; legal treatment varies by court and jurisdiction and continues to evolve';
const MLA_CITE =
  '10 U.S.C. § 987 (Military Lending Act) — caps the "military annual percentage rate" at 36% and provides other protections on many consumer credit products, including payday-style loans, for active-duty servicemembers and covered dependents';

// ── Timeshare specific fragments ──

const TIMESHARE_RESCISSION =
  'State timeshare-purchase rescission ("cooling-off") statutes — typically allow cancellation within a short window after signing (commonly ranging from roughly 3 to 15 calendar days depending on the state) if exercised properly, in writing, and within the deadline';
const TIMESHARE_ASSESSMENT_LIEN =
  'State common-interest-community/timeshare-association statutes generally allow the association (or its collection agent) to record an assessment lien and, in some states, foreclose for unpaid maintenance fees or assessments — procedures and any redemption rights vary significantly by state';

export const DEBT_LITIGATION_PLAYBOOKS: DebtLitigationPlaybook[] = [
  // ══════════════════════════════════════════════════════════════════════
  // CREDIT CARD
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'credit_card-pre_suit_validation',
    debtType: 'credit_card',
    phase: 'pre_suit_validation',
    title: 'Credit card debt-buyer pre-suit validation and cease-communication rights',
    overview:
      "Most credit card lawsuits are filed by third-party debt buyers who purchased charged-off accounts for a fraction of face value, often years after the original default. Before responding to any collection call or letter, a consumer generally has the right to demand written validation of the debt and to send a written cease-communication demand — and should check whether the state's statute of limitations may already have run before taking any action that could revive an old debt.",
    statutoryBasis: [
      FDCPA_VALIDATION,
      FDCPA_CEASE,
      REG_F_CALL_FREQUENCY,
      'Fair Credit Billing Act, 15 U.S.C. § 1666 — billing-error dispute rights, generally while the account is still with the original card issuer',
      SOL_DEFENSE,
      STANDING_ASSIGNMENT,
    ],
    caseLawPrecedents: [CASE_BARTLETT, CASE_JERMAN],
    remedyAction: {
      actionType: 'statute_of_limitations_defense',
      legalRequirements: [
        "Identify the last-payment or default date to estimate whether the state's contract/open-account statute of limitations may already have run",
        'Send any validation or cease-communication demand in writing (certified mail with return receipt is common practice for a paper trail)',
        'Avoid any payment or written/verbal acknowledgment of the debt before confirming SOL status — a partial payment or written promise can restart the clock in many states',
      ],
      executionSteps: [
        'Pull (or request) the account history to pin down the charge-off date and the last payment date',
        'Send a written validation request within 30 days of the first collection communication, and a separate cease-communication letter if unwanted contact continues',
        "Research the specific state's statute of limitations for credit card/open-account claims (commonly 3–6 years, but varies) rather than assuming a nationwide rule",
        'Keep copies of all correspondence and delivery confirmation in case a lawsuit is later filed',
        'If the debt appears time-barred, avoid any action that could revive it and consult a consumer-law attorney about asserting the defense if sued',
      ],
    },
    practicalWarnings: [
      'A validation request pauses collection but does not erase the debt or prevent a lawsuit from being filed',
      'Never ignore a later summons just because validation was requested — appearing and answering is generally still required',
      'Making a "good faith" payment on an old debt can restart the statute-of-limitations clock in many states',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'credit_card-summons_answer',
    debtType: 'credit_card',
    phase: 'summons_answer',
    title: 'Answering a credit card debt-buyer lawsuit — affirmative defenses',
    overview:
      "When a debt buyer sues on a charged-off credit card account, the single most important early step is filing a timely written answer, because missing the deadline usually results in an automatic default judgment. A properly drafted answer generally responds to each numbered allegation and raises applicable affirmative defenses — most commonly lack of standing from a broken chain of assignment, the statute of limitations, and failure to properly itemize the amount claimed.",
    statutoryBasis: [
      ANSWER_DEADLINE,
      STANDING_ASSIGNMENT,
      SOL_DEFENSE,
      FDCPA_VENUE,
      'State pleading rules generally requiring a plaintiff debt buyer to attach or later prove the underlying account agreement and a complete chain of assignment',
    ],
    caseLawPrecedents: [CASE_HENSON, CASE_HEINTZ],
    remedyAction: {
      actionType: 'answer_and_affirmative_defenses',
      legalRequirements: [
        "File a written answer with the court clerk (and typically serve a copy on plaintiff's counsel) before the deadline stated on the summons",
        'Respond to each numbered paragraph of the complaint — admit, deny, or state insufficient knowledge to form a belief',
        "Affirmatively assert applicable defenses — courts generally treat un-raised defenses like the statute of limitations as waived if omitted",
      ],
      executionSteps: [
        'Calendar the exact answer deadline from the date of service (not the date the mail was received)',
        "Use the court clerk's self-help resources, or a local attorney, to confirm the required answer format if the summons is unclear",
        'Draft admit/deny responses and list affirmative defenses: lack of standing/chain of title, statute of limitations, improper amount/failure to itemize, and improper service if applicable',
        "File the answer with the court and serve plaintiff's counsel using the method local rules require",
        'Keep a filed/stamped copy and proof of service for the file',
      ],
    },
    practicalWarnings: [
      'A missed answer deadline commonly results in a default judgment that is much harder to undo than answering on time',
      'Some courts require a filing fee for the answer — confirm with the clerk in advance',
      'Debt buyers frequently cannot produce the original signed agreement or a complete assignment chain, but that must be tested through the case, not assumed away',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'credit_card-discovery_motion',
    debtType: 'credit_card',
    phase: 'discovery_motion',
    title: 'Discovery demands against a credit card debt buyer — chain of assignment and account records',
    overview:
      'Once an answer is on file, discovery is often where credit card debt-buyer cases are decided, because many buyers hold only a purchased-account spreadsheet rather than the original signed cardholder agreement or a complete assignment history. Well-targeted requests for production and admissions can force the plaintiff to either produce genuine proof of the debt and its standing, or fail to meet its burden of proof.',
    statutoryBasis: [
      'State rules of civil procedure governing requests for production, interrogatories, and requests for admission (state analogs to FRCP 26/33/34/36)',
      STANDING_ASSIGNMENT,
      'Best-evidence and burden-of-proof principles placing the burden on the party asserting the claim',
    ],
    caseLawPrecedents: [CASE_HENSON],
    remedyAction: {
      actionType: 'discovery_demand',
      legalRequirements: [
        "Serve discovery requests within the time limits set by local rules (often tied to the case's discovery cutoff)",
        'Request the original signed cardholder agreement, the complete bill-of-sale/assignment chain from the original issuer to the current plaintiff, and account-level statements',
        'Request the basis of personal knowledge for any "records custodian" affidavit the plaintiff intends to rely on',
      ],
      executionSteps: [
        'Draft requests for production seeking the signed card agreement, all assignment/bill-of-sale documents, and the full account statement history',
        'Draft requests for admission asking the plaintiff to admit or deny specific facts (e.g., that it does not possess the original signed agreement)',
        'Draft interrogatories asking how the plaintiff calculated the amount claimed and the basis for any supporting affidavit',
        "Track the plaintiff's response deadline and consider a motion to compel if responses are incomplete or evasive",
        'If the plaintiff cannot substantiate standing or the amount owed, consider a motion for summary judgment or dismissal for failure of proof, per local procedure',
      ],
    },
    practicalWarnings: [
      'Discovery deadlines are strict — missing them can waive the right to compel better answers',
      'Debt buyers sometimes respond with boilerplate objections; a motion to compel (or local equivalent) may be needed to get real answers',
      'Discovery obligations run both ways — the consumer-defendant may also have to respond to the plaintiff\'s discovery requests',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'credit_card-post_judgment_emergency',
    debtType: 'credit_card',
    phase: 'post_judgment_emergency',
    title: 'Protecting exempt income after a credit card judgment — wage garnishment exemptions',
    overview:
      'If a debt buyer wins a credit card judgment and moves to garnish wages, federal law — and often broader state law — limits how much can be taken and protects certain income categories entirely. Acting quickly to claim an exemption or object to the garnishment matters, because garnishment orders are typically enforced automatically by the employer once served.',
    statutoryBasis: [
      CCPA_GARNISHMENT,
      FED_BENEFITS_EXEMPT,
      VA_BENEFITS_EXEMPT,
      'State wage-garnishment statutes (some states, e.g., Texas, Pennsylvania, North Carolina, and South Carolina, provide broader protection than federal law for ordinary consumer debts — verify the current state statute)',
      BANKRUPTCY_STAY,
    ],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'wage_garnishment_exemption',
      legalRequirements: [
        'File the exemption claim or objection within the deadline stated on the garnishment/writ paperwork (often a short window of days to a few weeks)',
        "Document the source and amount of any exempt income (Social Security, SSI, VA benefits, unemployment, child support, workers' compensation, and much retirement/pension income)",
        'Confirm the amount actually withheld does not exceed the applicable federal (or, if lower, state) cap',
      ],
      executionSteps: [
        'Read the garnishment notice carefully for the exact deadline and the court/office where an exemption claim must be filed',
        'Gather proof of income sources and amounts (benefit award letters, pay stubs, bank statements showing direct deposits)',
        'File the exemption claim or objection with the court and serve the creditor as required',
        'Attend any scheduled hearing prepared to show which income is exempt and, if applicable, that the garnished amount exceeds the legal cap',
        'If income is largely exempt and the debt burden is severe, consider consulting an attorney about bankruptcy, since filing generally triggers an automatic stay',
      ],
      exemptFundTypes: [
        'Social Security retirement/disability/SSI',
        'VA disability and pension benefits',
        'Federal civil service and railroad retirement benefits',
        'Unemployment compensation (state rules vary)',
        'Child support received',
        "Workers' compensation (state rules vary)",
        'Most public assistance/TANF benefits',
      ],
    },
    practicalWarnings: [
      'Exempt funds can lose protection if commingled with non-exempt money in a bank account for too long — many states have specific tracing rules',
      'A garnishment already in progress does not stop automatically just because income later becomes exempt — the exemption generally must be actively claimed',
      'Garnishment caps and available exemptions vary significantly by state — confirm current limits before assuming a percentage applies',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'credit_card-counter_suit',
    debtType: 'credit_card',
    phase: 'counter_suit',
    title: 'FDCPA counter-suit against a credit card collector for genuine violations',
    overview:
      "When a collector or debt buyer's own conduct crosses legal lines — repeated calls after a written cease-and-desist, misrepresenting the amount owed, or threatening action it cannot legally take — the consumer may have an independent FDCPA claim that can be raised as a counterclaim or filed separately. This is a genuine legal remedy for the collector's misconduct, not a way to avoid an otherwise valid debt.",
    statutoryBasis: [FDCPA_FALSE, FDCPA_UNFAIR, FDCPA_CEASE, REG_F_CALL_FREQUENCY, FDCPA_LIABILITY, TCPA_CITE],
    caseLawPrecedents: [CASE_JERMAN, CASE_MARX, CASE_DUGUID],
    remedyAction: {
      actionType: 'fdcpa_counter_suit',
      legalRequirements: [
        'Identify a specific, well-documented violation (e.g., calls after a written cease-and-desist, a false statement about the amount or legal status of the debt, threats of action not actually intended or legally available)',
        'Preserve evidence: call logs, voicemails, letters, text screenshots, and dates/times of contact',
        "Generally file within the FDCPA's one-year statute of limitations from the date of the violation (15 U.S.C. § 1692k(d))",
      ],
      executionSteps: [
        'Log every contact with dates, times, and what was said or written, and save all physical/digital evidence',
        "Compare the collector's conduct against specific FDCPA sections (false statements under § 1692e, unfair practices under § 1692f, contact after cease-and-desist under § 1692c(c))",
        'File complaints with the CFPB and state Attorney General in parallel — these do not require an attorney and can support a later claim',
        'Consult a consumer-law attorney about raising the violation as a counterclaim in a pending collection suit, or filing a separate FDCPA suit within the one-year window',
        'Many consumer attorneys take strong FDCPA cases on contingency, since the statute provides for fee-shifting to a prevailing consumer',
      ],
    },
    practicalWarnings: [
      "A genuine FDCPA violation by the collector does not automatically erase an otherwise valid underlying debt",
      'The FDCPA claim has its own one-year filing deadline that runs separately from the collection case timeline',
      'Isolated rudeness or a single mistaken call is unlikely to be a violation — the strongest claims involve clear, documented conduct crossing a specific statutory line',
    ],
    disclaimer: DISCLAIMER,
  },

  // ══════════════════════════════════════════════════════════════════════
  // MEDICAL
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'medical-pre_suit_validation',
    debtType: 'medical',
    phase: 'pre_suit_validation',
    title: 'Medical debt validation and billing-accuracy check before a collection lawsuit',
    overview:
      "Medical debt is frequently placed with, or sold to, third-party collection agencies after insurance-processing disputes, coding errors, or balance-billing issues — all of which should be checked before assuming the billed amount is accurate. A consumer can request an itemized bill from the provider and formal validation from any third-party collector, and should confirm the state's statute of limitations before responding.",
    statutoryBasis: [
      FDCPA_VALIDATION,
      FDCPA_CEASE,
      'No Surprises Act, 42 U.S.C. § 300gg-111 et seq. — bars many surprise out-of-network balance bills for emergency care and certain facility-based services',
      SOL_DEFENSE,
      'General right to request an itemized bill directly from the healthcare provider before or alongside any collector validation request',
    ],
    caseLawPrecedents: [CASE_BARTLETT],
    remedyAction: {
      actionType: 'statute_of_limitations_defense',
      legalRequirements: [
        'Request an itemized bill from the provider and, separately, written validation from any third-party collector',
        'Compare the itemized bill against the insurance Explanation of Benefits (EOB) for coding errors, duplicate charges, or improper balance billing',
        "Confirm the last-billed or default date to assess the state's statute of limitations for medical debt (often treated as an open-account or contract claim)",
      ],
      executionSteps: [
        'Request the itemized bill and EOB and compare them line by line for errors or duplicate charges',
        'Send a written validation request to any third-party collector within 30 days of first contact',
        'Check whether the charge involves emergency or facility-based out-of-network care potentially covered by No Surprises Act balance-billing protections',
        "Research the state's statute of limitations for medical/open-account debt",
        'Keep all correspondence and billing records organized in case a lawsuit is later filed',
      ],
    },
    practicalWarnings: [
      'Insurance-processing delays and coding errors are a common source of inflated or duplicate medical bills — request an itemized statement before paying anything',
      'Credit-reporting treatment of medical debt has changed multiple times in recent years and remains subject to ongoing legal and regulatory developments — do not assume a specific reporting rule is currently in effect without checking its status',
      'Never ignore a summons over disputed medical debt just because the bill seems wrong — the error generally must be raised as a defense within the case',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'medical-summons_answer',
    debtType: 'medical',
    phase: 'summons_answer',
    title: 'Answering a medical debt collection lawsuit',
    overview:
      'A medical debt lawsuit is typically filed by the original provider, a hospital-affiliated collection entity, or a third-party debt buyer. The answer should address standing (was the account actually assigned/sold, and to whom), the statute of limitations, and whether the billed amount was ever properly itemized or verified against insurance processing.',
    statutoryBasis: [
      ANSWER_DEADLINE,
      SOL_DEFENSE,
      STANDING_ASSIGNMENT,
      'No Surprises Act balance-billing protections as a potential defense where part of the underlying charge may itself be legally barred',
    ],
    caseLawPrecedents: [CASE_HEINTZ],
    remedyAction: {
      actionType: 'answer_and_affirmative_defenses',
      legalRequirements: [
        'File a timely written answer responding to each numbered allegation in the complaint',
        'Raise the statute of limitations and lack-of-standing defenses affirmatively if applicable',
        'Request or independently obtain the itemized billing and insurance processing history to assess the accuracy of the amount claimed',
      ],
      executionSteps: [
        'Calendar the answer deadline from the date of service',
        'Draft admit/deny responses and affirmative defenses (statute of limitations, standing/chain of assignment, improper itemization, possible No Surprises Act issues)',
        'File the answer and serve the plaintiff or its counsel as required by local rules',
        'Request the underlying itemized bill and EOB if not already obtained, to evaluate the accuracy of the claimed balance',
        'Keep a filed/stamped copy and proof of service',
      ],
    },
    practicalWarnings: [
      'Medical debt lawsuits still follow ordinary civil procedure — a missed answer deadline can still result in default judgment',
      'A dispute over billing accuracy is a defense to be proven in the case, not a reason to ignore the lawsuit',
      'If the account was sold to a debt buyer, verify the buyer can actually prove the assignment and the underlying charge',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'medical-discovery_motion',
    debtType: 'medical',
    phase: 'discovery_motion',
    title: 'Discovery demands in a medical debt lawsuit — itemized records and assignment history',
    overview:
      'Discovery in a medical debt case should target the itemized billing and insurance-processing records that support the amount claimed, along with the full assignment/sale chain if a third-party debt buyer is suing. Requests should generally be scoped to billing and account information rather than full clinical records.',
    statutoryBasis: [
      'State rules of civil procedure governing requests for production and admission (state analogs to FRCP 26/34/36)',
      STANDING_ASSIGNMENT,
      'HIPAA Privacy Rule, 45 C.F.R. Parts 160 & 164 — clinical records are more protected than billing/account records; discovery in a billing dispute should generally be scoped to the billing and account information relevant to the amount claimed',
    ],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'discovery_demand',
      legalRequirements: [
        'Serve discovery requests within the applicable deadlines set by local rules',
        'Request the itemized bill, insurance EOB/processing records, and (if applicable) the full assignment/bill-of-sale chain to the current plaintiff',
        'Scope requests to billing/account information rather than broader clinical records to avoid unnecessary privacy disputes',
      ],
      executionSteps: [
        'Draft requests for production seeking the itemized bill, EOB, account ledger, and any assignment documents',
        'Draft requests for admission on specific billing facts (e.g., whether the provider billed insurance before pursuing the patient balance)',
        'Track response deadlines and consider a motion to compel for incomplete responses',
        'Compare the produced records against the amount claimed in the complaint for discrepancies',
        'Raise any material discrepancy as part of the defense or a basis to challenge the claimed amount',
      ],
    },
    practicalWarnings: [
      'Overly broad discovery requests for full medical records can trigger unnecessary privacy objections — keep requests focused on billing',
      'Discovery deadlines are strict on both sides',
      'A billing discrepancy found in discovery still needs to be properly presented to the court, not just asserted informally',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'medical-post_judgment_emergency',
    debtType: 'medical',
    phase: 'post_judgment_emergency',
    title: 'Quashing a bank account levy after a medical debt judgment',
    overview:
      "After a medical debt judgment, a collector may seek to levy the debtor's bank account. If the account holds exempt funds — Social Security, disability, or other protected benefits — the consumer generally can move to quash the levy or claim an exemption, but must usually act within a short deadline after the bank is served.",
    statutoryBasis: [
      FED_BENEFITS_EXEMPT,
      VA_BENEFITS_EXEMPT,
      'State bank-levy/exemption-claim procedures (a written exemption claim is typically required within a short deadline after the bank is served with the levy/writ) — verify the specific state process',
      BANKRUPTCY_STAY,
    ],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'bank_levy_quash',
      legalRequirements: [
        'File the exemption claim or motion to quash within the deadline stated on the levy notice',
        'Document that the frozen funds derive from an exempt source (award letters, direct-deposit statements)',
        'Notify the bank and court promptly, since funds may otherwise be released to the creditor after a short waiting period',
      ],
      executionSteps: [
        'Obtain the levy notice and confirm the exact deadline to object or claim an exemption',
        'Gather proof that the account holds exempt funds (benefit award letters, statements showing direct-deposit source and timing)',
        'File the exemption claim/motion to quash with the court and serve the creditor',
        'Request an expedited hearing if the funds are needed for immediate living expenses',
        'If the exemption is denied or only partially granted, consult an attorney promptly about further options, including bankruptcy if the broader debt load warrants it',
      ],
      exemptFundTypes: [
        'Social Security retirement/disability/SSI',
        'VA disability and pension benefits',
        'Federal civil service and railroad retirement benefits',
        "Unemployment compensation and workers' compensation (state rules vary)",
        'Child support received',
      ],
    },
    practicalWarnings: [
      'Bank levies often freeze the entire account first, even funds that will later be found exempt — speed matters',
      'Commingling exempt and non-exempt funds for too long can make it harder to trace and protect the exempt portion',
      'Some banks apply their own hold periods before releasing funds to a creditor — use that window to file the exemption claim',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'medical-counter_suit',
    debtType: 'medical',
    phase: 'counter_suit',
    title: 'FDCPA counter-suit for medical debt collector harassment or false statements',
    overview:
      'Medical debt collectors are subject to the same FDCPA rules as any other third-party collector when they are collecting a debt owed to another (as opposed to the original provider collecting in its own name in many states). Genuine violations — repeated calls after a written cease-and-desist, misrepresenting insurance status, or falsely threatening legal action — can support an independent claim.',
    statutoryBasis: [FDCPA_FALSE, FDCPA_UNFAIR, FDCPA_CEASE, REG_F_CALL_FREQUENCY, FDCPA_LIABILITY],
    caseLawPrecedents: [CASE_JERMAN, CASE_MARX],
    remedyAction: {
      actionType: 'fdcpa_counter_suit',
      legalRequirements: [
        'Identify a specific, documented violation and preserve evidence (call logs, letters, voicemails)',
        "Confirm the entity contacting the consumer is a third-party collector or debt buyer, since some FDCPA provisions apply differently to an original medical provider collecting its own debt in its own name",
        "File generally within the FDCPA's one-year statute of limitations",
      ],
      executionSteps: [
        'Document every contact, including date, time, and substance',
        'Identify which entity is calling (original provider vs. a placed/sold third-party collector) since that affects which FDCPA provisions apply',
        'File CFPB and state Attorney General complaints in parallel with pursuing a private claim',
        'Consult a consumer-law attorney about a counterclaim or a separate FDCPA suit',
      ],
    },
    practicalWarnings: [
      'The FDCPA generally applies to third-party medical debt collectors and debt buyers, but its application to an original medical provider collecting its own debt directly can differ by circuit and fact pattern',
      'A genuine violation does not erase a legitimate underlying medical bill',
      'Keep the counter-suit claim and the underlying billing-accuracy dispute organized separately, since they involve different legal theories',
    ],
    disclaimer: DISCLAIMER,
  },

  // ══════════════════════════════════════════════════════════════════════
  // PERSONAL LOAN
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'personal_loan-pre_suit_validation',
    debtType: 'personal_loan',
    phase: 'pre_suit_validation',
    title: 'Personal loan validation and statute-of-limitations check before suit',
    overview:
      'Unsecured personal loans (from a bank, credit union, or online lender) that default are frequently sold to debt buyers or placed with collection agencies, just like credit card debt. The same pre-suit toolkit applies: written validation, a cease-communication demand if desired, and confirming the applicable statute of limitations before any payment or acknowledgment.',
    statutoryBasis: [FDCPA_VALIDATION, FDCPA_CEASE, SOL_DEFENSE, STANDING_ASSIGNMENT],
    caseLawPrecedents: [CASE_BARTLETT],
    remedyAction: {
      actionType: 'statute_of_limitations_defense',
      legalRequirements: [
        'Confirm whether the loan is a written or oral/open-account obligation, since some states apply different limitations periods to each',
        'Send a written validation request within 30 days of first collector contact',
        'Avoid payment or written acknowledgment before confirming SOL status',
      ],
      executionSteps: [
        'Locate or request the original loan agreement to determine whether it is a signed written contract',
        "Research the state's statute of limitations for written contracts versus open accounts, since they can differ",
        'Send the validation request and, if desired, a cease-communication letter, by certified mail',
        'Keep records of all correspondence and delivery confirmation',
      ],
    },
    practicalWarnings: [
      'Written-contract and open-account limitations periods can differ within the same state — confirm which applies',
      'A verbal promise to pay, made to stop harassment, can still count as an acknowledgment in some states',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'personal_loan-summons_answer',
    debtType: 'personal_loan',
    phase: 'summons_answer',
    title: 'Answering a personal loan collection lawsuit',
    overview:
      'A personal loan lawsuit answer should test whether the plaintiff is the original lender or a downstream buyer, and if a buyer, whether it can prove the assignment. Standard affirmative defenses (statute of limitations, lack of standing, improper amount) apply alongside verification of the original loan terms and payment history.',
    statutoryBasis: [ANSWER_DEADLINE, STANDING_ASSIGNMENT, SOL_DEFENSE, FDCPA_VENUE],
    caseLawPrecedents: [CASE_HENSON, CASE_HEINTZ],
    remedyAction: {
      actionType: 'answer_and_affirmative_defenses',
      legalRequirements: [
        'File a timely written answer addressing each numbered allegation',
        'Raise applicable affirmative defenses (SOL, standing/chain of title, improper amount) affirmatively',
        'Determine whether the plaintiff is the original lender or a debt buyer, since that affects the standing analysis',
      ],
      executionSteps: [
        'Calendar the answer deadline from the date of service',
        'Draft admit/deny responses and list defenses including SOL, lack of standing, and improper itemization',
        'File and serve the answer per local rules',
        'Request the original loan agreement and payment history if not already available',
      ],
    },
    practicalWarnings: [
      'A missed answer deadline commonly results in default judgment',
      'Original lenders suing directly generally have an easier time proving standing than a downstream debt buyer',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'personal_loan-discovery_motion',
    debtType: 'personal_loan',
    phase: 'discovery_motion',
    title: 'Discovery demands in a personal loan lawsuit',
    overview:
      'Discovery should target the signed loan agreement, complete payment history, and (if applicable) the assignment chain to the current plaintiff, to test both the accuracy of the amount claimed and the plaintiff\'s standing to sue.',
    statutoryBasis: [
      'State rules of civil procedure governing requests for production and admission',
      STANDING_ASSIGNMENT,
      'Best-evidence and burden-of-proof principles placing the burden on the party asserting the claim',
    ],
    caseLawPrecedents: [CASE_HENSON],
    remedyAction: {
      actionType: 'discovery_demand',
      legalRequirements: [
        'Serve discovery within local-rule deadlines',
        'Request the signed loan agreement, full payment/account history, and any assignment documentation',
        'Request the basis of personal knowledge for any supporting affidavit',
      ],
      executionSteps: [
        'Draft requests for production for the loan agreement, payment ledger, and assignment chain',
        'Draft requests for admission and interrogatories on the calculation of the amount claimed',
        'Move to compel if responses are incomplete',
        'Evaluate whether the plaintiff can actually substantiate standing and the claimed balance',
      ],
    },
    practicalWarnings: [
      'Discovery deadlines are strict on both sides',
      'A plaintiff unable to produce the signed agreement or assignment chain still must be challenged formally through the case, not assumed to lose automatically',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'personal_loan-post_judgment_emergency',
    debtType: 'personal_loan',
    phase: 'post_judgment_emergency',
    title: 'Motion to vacate a default judgment on a personal loan for improper service',
    overview:
      'A significant share of default judgments on personal loans (and other consumer debts) trace back to defective service of process — the consumer never actually received the summons. Most states allow a motion to vacate a default judgment where service was improper, though strict deadlines and evidentiary requirements generally apply.',
    statutoryBasis: [
      RULE_60_VACATE,
      'State rules of civil procedure governing proper methods of service of process (personal service, substituted service, and, in limited circumstances, service by publication) — requirements vary by state',
      ANSWER_DEADLINE,
    ],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'motion_to_vacate',
      legalRequirements: [
        'File the motion to vacate within the applicable deadline (varies by state and by the ground asserted, e.g., often longer for lack of jurisdiction/improper service than for excusable neglect)',
        'Present evidence contradicting the process server\'s affidavit of service (e.g., proof of being elsewhere, an incorrect address, or no actual delivery)',
        'Show a meritorious defense exists to the underlying claim, which many states require alongside the service defect',
      ],
      executionSteps: [
        'Obtain the court file and review the affidavit/proof of service for the claimed date, time, location, and method',
        'Gather contradicting evidence (work records, travel records, lease/address history, neighbor or witness statements)',
        'Draft and file the motion to vacate, citing the specific service defect and any applicable meritorious defense',
        'Request a hearing and be prepared to testify or submit a sworn declaration',
        'If vacated, promptly file a proper answer to avoid a second default',
      ],
    },
    practicalWarnings: [
      'Deadlines to challenge a default judgment can be short — some states require action within weeks to a few months for ordinary excusable neglect, though jurisdictional/void-judgment challenges may have longer or no fixed deadline',
      'Simply disagreeing with the amount owed is generally not enough — a genuine service or procedural defect (or another recognized ground) is usually required',
      'Vacating the judgment reopens the case; it does not resolve the underlying debt dispute by itself',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'personal_loan-counter_suit',
    debtType: 'personal_loan',
    phase: 'counter_suit',
    title: 'FDCPA counter-suit for personal loan collection misconduct',
    overview:
      'Third-party collectors and debt buyers pursuing defaulted personal loans are fully subject to the FDCPA. Documented misconduct — false statements about the balance, threats of legal action not actually taken, or contact after a written cease-and-desist — can support a genuine counterclaim or standalone suit.',
    statutoryBasis: [FDCPA_FALSE, FDCPA_UNFAIR, FDCPA_CEASE, FDCPA_LIABILITY, TCPA_CITE],
    caseLawPrecedents: [CASE_JERMAN, CASE_MARX],
    remedyAction: {
      actionType: 'fdcpa_counter_suit',
      legalRequirements: [
        'Identify and document a specific statutory violation',
        'Preserve all evidence of the contact (recordings where legally permitted, logs, letters)',
        "File within the FDCPA's one-year statute of limitations",
      ],
      executionSteps: [
        'Compile a timeline of every contact with dates, times, and content',
        'Match the conduct to a specific FDCPA section',
        'File CFPB/AG complaints and consult a consumer-law attorney about a counterclaim or separate suit',
      ],
    },
    practicalWarnings: [
      'A counter-suit for collector misconduct is independent from — and does not automatically resolve — the underlying loan default',
      'The one-year FDCPA filing window is strict',
    ],
    disclaimer: DISCLAIMER,
  },

  // ══════════════════════════════════════════════════════════════════════
  // AUTO REPOSSESSION
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'auto_repossession-pre_suit_validation',
    debtType: 'auto_repossession',
    phase: 'pre_suit_validation',
    title: 'Auto deficiency balance validation after repossession',
    overview:
      "After a vehicle is repossessed and resold, the lender (or its collection agent/assignee) may pursue the consumer for a 'deficiency balance' — the shortfall between the sale price and the amount owed. Before treating that balance as final, a consumer generally has the right to demand an accounting of the resale and, if the account was placed with or sold to a third-party collector, written validation.",
    statutoryBasis: [
      FDCPA_VALIDATION,
      FDCPA_CEASE,
      'UCC Article 9, §§ 9-610, 9-611, 9-615 — secured party must dispose of repossessed collateral in a commercially reasonable manner and provide notice; the deficiency is generally calculated from actual sale proceeds, and a failure to give required notice or to sell commercially reasonably can reduce or bar the deficiency in many states',
      SOL_DEFENSE,
    ],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'statute_of_limitations_defense',
      legalRequirements: [
        'Request a full accounting of the repossession sale: sale date, sale price, buyer, and how the deficiency was calculated',
        'Confirm the lender sent the pre-sale and post-sale notices required under UCC Article 9 in the applicable state',
        "Confirm the state's statute of limitations for a deficiency claim before responding or paying",
      ],
      executionSteps: [
        'Request the repossession and resale file, including any notice of sale sent before the vehicle was sold',
        'Compare the claimed deficiency against the actual resale price and any fees added',
        'Send a written validation request to any third-party collector handling the deficiency',
        "Research the state's UCC-based commercial-reasonableness requirements and statute of limitations for deficiency claims",
      ],
    },
    practicalWarnings: [
      "A lender's failure to sell the vehicle in a commercially reasonable manner, or to give required notice, can reduce or eliminate the deficiency in many states — this must generally be raised affirmatively",
      'Never assume the deficiency figure quoted by a collector is accurate without requesting the underlying sale documentation',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'auto_repossession-summons_answer',
    debtType: 'auto_repossession',
    phase: 'summons_answer',
    title: 'Answering an auto deficiency-balance lawsuit',
    overview:
      'When a lender or debt buyer sues over a deficiency balance, the answer should test both ordinary standing/SOL defenses and repossession-specific defenses: whether the sale was commercially reasonable and whether required pre- and post-sale notices were actually given under UCC Article 9.',
    statutoryBasis: [
      ANSWER_DEADLINE,
      STANDING_ASSIGNMENT,
      SOL_DEFENSE,
      'UCC Article 9, §§ 9-610–9-616 — commercially reasonable disposition and notice requirements for repossessed collateral, with state-specific remedies for noncompliance',
    ],
    caseLawPrecedents: [CASE_HEINTZ],
    remedyAction: {
      actionType: 'answer_and_affirmative_defenses',
      legalRequirements: [
        'File a timely written answer addressing each allegation',
        'Raise commercial-reasonableness and notice defects as affirmative defenses where the sale documentation supports them',
        'Raise standard defenses (SOL, standing) where applicable',
      ],
      executionSteps: [
        'Calendar and meet the answer deadline',
        'Draft admit/deny responses and affirmative defenses, including any UCC Article 9 notice/commercial-reasonableness defects',
        'File and serve the answer per local rules',
        'Request the full repossession and sale file in discovery if not already produced',
      ],
    },
    practicalWarnings: [
      'Missing the answer deadline risks default judgment for the full deficiency amount claimed',
      'UCC-based defenses generally must be supported by the actual sale records, not just an assumption the sale was unfair',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'auto_repossession-discovery_motion',
    debtType: 'auto_repossession',
    phase: 'discovery_motion',
    title: 'Discovery demands for the repossession sale file',
    overview:
      'Discovery in a deficiency case should focus on obtaining the full repossession and resale record — condition reports, the notice of sale, bids received, the sale price, and how fees were added — to test whether the sale was commercially reasonable and the deficiency accurately calculated.',
    statutoryBasis: [
      'State rules of civil procedure governing requests for production and admission',
      'UCC Article 9 commercial-reasonableness and notice standards',
      STANDING_ASSIGNMENT,
    ],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'discovery_demand',
      legalRequirements: [
        'Serve discovery within local-rule deadlines',
        'Request the repossession condition report, notice of sale, advertising records, bids received, and sale documentation',
        'Request the itemized deficiency calculation and any assignment documents if a debt buyer is suing',
      ],
      executionSteps: [
        'Draft requests for production for the full repossession/sale file and deficiency calculation worksheet',
        'Draft requests for admission on notice timing and sale method',
        'Compare the produced sale price and fees against industry norms or comparable sale data where feasible',
        'Move to compel if the plaintiff withholds the sale file',
      ],
    },
    practicalWarnings: [
      'A plaintiff that cannot produce a proper notice of sale or commercially reasonable sale record may face a reduced or barred deficiency in many states',
      'Discovery obligations run both ways',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'auto_repossession-post_judgment_emergency',
    debtType: 'auto_repossession',
    phase: 'post_judgment_emergency',
    title: 'Wage garnishment exemptions after an auto deficiency judgment',
    overview:
      'A deficiency-balance judgment is collected like any other money judgment, most often through wage garnishment or a bank levy. The same federal garnishment cap and benefit exemptions that apply to other consumer judgments apply here.',
    statutoryBasis: [CCPA_GARNISHMENT, FED_BENEFITS_EXEMPT, VA_BENEFITS_EXEMPT, BANKRUPTCY_STAY],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'wage_garnishment_exemption',
      legalRequirements: [
        'File any exemption claim or objection within the deadline on the garnishment notice',
        'Document exempt income sources if applicable',
        'Confirm the withheld amount does not exceed the applicable cap',
      ],
      executionSteps: [
        'Review the garnishment notice for the filing deadline and required form',
        'Gather proof of income and, if applicable, exempt-benefit sources',
        'File the exemption claim/objection and serve the creditor',
        'Attend any hearing prepared with documentation',
      ],
      exemptFundTypes: [
        'Social Security retirement/disability/SSI',
        'VA disability and pension benefits',
        'Unemployment compensation (state rules vary)',
        'Child support received',
      ],
    },
    practicalWarnings: [
      'A deficiency judgment does not disappear just because the vehicle was already repossessed and sold — the debt is the shortfall, not the whole original loan',
      'Garnishment exemption deadlines are typically short and strictly enforced',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'auto_repossession-counter_suit',
    debtType: 'auto_repossession',
    phase: 'counter_suit',
    title: 'FDCPA and UCC-based counter-suit for repossession/deficiency collection misconduct',
    overview:
      'Beyond ordinary FDCPA violations by a third-party collector pursuing the deficiency, a lender or its agent that violates UCC Article 9 notice and commercial-reasonableness requirements, or engages in a wrongful/breach-of-the-peace repossession, may face additional statutory or common-law claims specific to secured transactions.',
    statutoryBasis: [
      FDCPA_FALSE,
      FDCPA_UNFAIR,
      FDCPA_LIABILITY,
      'UCC § 9-609(b)(2) — a secured party may repossess collateral without judicial process only if it can be done "without breach of the peace"; a repossession involving a breach of the peace can create separate liability',
      'UCC § 9-625 — statutory damages and remedies for a secured party\'s failure to comply with Article 9\'s repossession/disposition rules, in addition to any deficiency reduction',
    ],
    caseLawPrecedents: [CASE_JERMAN],
    remedyAction: {
      actionType: 'fdcpa_counter_suit',
      legalRequirements: [
        'Document any FDCPA violations by the collector pursuing the deficiency',
        'Separately document any breach-of-the-peace conduct during the repossession itself (physical confrontation, disabling a locked gate, entering a closed garage, etc.), which is a distinct legal issue from the FDCPA',
        'Preserve the repossession and sale records for both claims',
      ],
      executionSteps: [
        'Separate the analysis into (a) FDCPA violations in post-repossession collection and (b) UCC/breach-of-the-peace issues in the repossession itself',
        'Document all evidence for both potential claims',
        'Consult a consumer-law attorney, since these theories are frequently litigated together in repossession cases',
      ],
    },
    practicalWarnings: [
      'Breach-of-the-peace and UCC-based repossession claims are governed by state law and vary significantly in scope and remedy',
      'A genuine repossession-process violation does not necessarily erase the underlying loan default',
    ],
    disclaimer: DISCLAIMER,
  },

  // ══════════════════════════════════════════════════════════════════════
  // STUDENT LOAN
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'student_loan-pre_suit_validation',
    debtType: 'student_loan',
    phase: 'pre_suit_validation',
    title: 'Student loan default validation — federal vs. private loan distinction',
    overview:
      "The very first step in any student loan collection scenario is determining whether the loan is federal or private, because the two follow completely different legal tracks. Federal loans in default generally proceed through administrative remedies (including administrative wage garnishment) rather than an ordinary lawsuit, while private loans in default are collected like other consumer debt and are subject to the FDCPA when placed with a third-party collector.",
    statutoryBasis: [HEA_ADMIN_GARNISH, PRIVATE_STUDENT_LOAN_FDCPA, FDCPA_VALIDATION, SOL_DEFENSE],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'statute_of_limitations_defense',
      legalRequirements: [
        'Confirm whether the loan is federal (Direct Loan, FFEL, Perkins) or private by checking the National Student Loan Data System (for federal loans) or the original loan documents',
        'For a private loan, send a written validation request to any third-party collector and evaluate the statute of limitations, since private loans are subject to ordinary state contract-claim SOL rules',
        'For a federal loan, understand that administrative wage garnishment under 20 U.S.C. § 1095a generally does not require a court judgment or a state SOL analysis in the same way',
      ],
      executionSteps: [
        'Determine federal-vs-private status first, since it changes the entire legal path',
        "For federal loans, review options like loan rehabilitation or consolidation and any notice of intent to garnish (which carries a right to request a hearing)",
        'For private loans, send a validation request and research the applicable state SOL for the written loan agreement',
        'Keep records of all communications either way',
      ],
    },
    practicalWarnings: [
      'Federal student loan default has its own administrative process (including a right to request a hearing before administrative wage garnishment) that is different from a state-court lawsuit',
      'Confusing federal and private student loan rules is one of the most common and costly mistakes in this area',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'student_loan-summons_answer',
    debtType: 'student_loan',
    phase: 'summons_answer',
    title: 'Answering a private student loan lawsuit',
    overview:
      'A private student loan lawsuit (as opposed to federal administrative collection) proceeds through ordinary state civil procedure. The answer should evaluate standing (was the loan securitized/sold, and can the current plaintiff prove it), the statute of limitations, and any co-signer-specific issues.',
    statutoryBasis: [ANSWER_DEADLINE, STANDING_ASSIGNMENT, SOL_DEFENSE, PRIVATE_STUDENT_LOAN_FDCPA],
    caseLawPrecedents: [CASE_HEINTZ],
    remedyAction: {
      actionType: 'answer_and_affirmative_defenses',
      legalRequirements: [
        'File a timely written answer to each allegation',
        'Raise standing/chain-of-title defenses where the loan appears to have been securitized or sold to a trust or debt buyer',
        'Raise the statute of limitations and any co-signer-specific defenses where applicable',
      ],
      executionSteps: [
        'Calendar and meet the answer deadline',
        'Draft admit/deny responses and applicable affirmative defenses',
        'File and serve the answer per local rules',
        'Request the original promissory note and full assignment/securitization history in discovery',
      ],
    },
    practicalWarnings: [
      'Private student loan trusts have frequently faced standing challenges in litigation over missing or incomplete assignment documentation — but this must be tested through the case record, not assumed',
      'A missed answer deadline risks default judgment, including against a co-signer',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'student_loan-discovery_motion',
    debtType: 'student_loan',
    phase: 'discovery_motion',
    title: 'Discovery demands in a private student loan lawsuit',
    overview:
      'Discovery should focus on the original promissory note, the complete chain of any sale or securitization to the current plaintiff (including trust documents where a securitization trust is the named plaintiff), and the full payment/account history.',
    statutoryBasis: [
      'State rules of civil procedure governing requests for production and admission',
      STANDING_ASSIGNMENT,
      'Best-evidence and burden-of-proof principles placing the burden on the party asserting the claim',
    ],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'discovery_demand',
      legalRequirements: [
        'Serve discovery within local-rule deadlines',
        'Request the original signed promissory note, complete assignment/securitization documentation, and full payment history',
        'Request the basis of personal knowledge for any supporting affidavit or trust-custodian declaration',
      ],
      executionSteps: [
        'Draft requests for production for the note, pooling-and-servicing/assignment documents, and payment ledger',
        'Draft requests for admission and interrogatories on chain of title and balance calculation',
        'Move to compel if responses are incomplete',
        'Assess whether the plaintiff can substantiate standing and the claimed balance',
      ],
    },
    practicalWarnings: [
      'Securitized student loan trusts can involve complex, multi-party assignment chains — documentation gaps are common but must be raised properly through discovery, not assumed to automatically defeat the claim',
      'Discovery obligations run both ways',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'student_loan-post_judgment_emergency',
    debtType: 'student_loan',
    phase: 'post_judgment_emergency',
    title: 'Garnishment exemptions and hardship options for defaulted student loans',
    overview:
      "Federal student loan default can lead to administrative wage garnishment (without a prior court judgment) and Treasury offset of federal benefit payments in limited circumstances, while a private-loan court judgment is collected like other civil judgments. Both paths generally provide some hardship/exemption process, and the source of the underlying income still matters.",
    statutoryBasis: [
      HEA_ADMIN_GARNISH,
      CCPA_GARNISHMENT,
      FED_BENEFITS_EXEMPT,
      'Treasury Offset Program, 31 U.S.C. § 3720A — allows offset of certain federal payments for defaulted federal student loans, subject to specific protections for very low-income recipients of certain federal benefits',
    ],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'wage_garnishment_exemption',
      legalRequirements: [
        'For federal loans, respond to the notice of intent to garnish and timely request a hearing if disputing the debt or the garnishment amount, or asserting a financial-hardship exemption',
        'For private loans, file any wage-garnishment exemption/objection within the deadline in the judgment enforcement paperwork',
        'Document income sources and amounts either way',
      ],
      executionSteps: [
        'Identify whether the collection is the federal administrative process or a private-loan court judgment enforcement',
        'For federal loans, submit the required hearing request and financial disclosure forms before the stated deadline',
        'For private loans, file the exemption claim/objection with the enforcing court',
        'Explore loan rehabilitation or income-driven options (federal loans) as a longer-term alternative to garnishment',
      ],
      exemptFundTypes: [
        'Social Security retirement/disability/SSI (with narrow exceptions for certain federal debts)',
        'VA disability and pension benefits',
        "Certain other means-tested federal benefits, subject to specific program rules",
      ],
    },
    practicalWarnings: [
      'Federal loan administrative garnishment can begin without a lawsuit or court judgment — the notice-and-hearing process is the main procedural protection and has its own deadlines',
      'Federal and private student loan debt follow different rules for bankruptcy discharge as well — both are generally harder to discharge than most other unsecured debt, and this should be confirmed with an attorney before assuming otherwise',
    ],
    disclaimer: DISCLAIMER,
  },

  // ══════════════════════════════════════════════════════════════════════
  // BANK OVERDRAFT
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'bank_overdraft-pre_suit_validation',
    debtType: 'bank_overdraft',
    phase: 'pre_suit_validation',
    title: 'Overdraft debt validation and account-closure record check',
    overview:
      'An unpaid negative bank balance is typically charged off by the bank and either pursued internally or sold to a collection agency, and it is also commonly reported to specialty consumer reporting agencies that track bank-account history. Before responding, request the account closure statement and any collector validation, and check the deposit-account agreement for the applicable claim type.',
    statutoryBasis: [
      FDCPA_VALIDATION,
      FDCPA_CEASE,
      SOL_DEFENSE,
      'Fair Credit Reporting Act, 15 U.S.C. § 1681 et seq. — governs reporting of unpaid bank-account balances to specialty consumer reporting agencies (e.g., account-screening bureaus), including dispute rights',
    ],
    caseLawPrecedents: [CASE_CUSHMAN],
    remedyAction: {
      actionType: 'statute_of_limitations_defense',
      legalRequirements: [
        'Request the final account statement showing the closing negative balance and any fees added after closure',
        'Send a written validation request to any third-party collector',
        "Confirm the state's statute of limitations for a deposit-account/contract claim",
      ],
      executionSteps: [
        'Request the final account statement and any post-closure fee history from the bank',
        'Send the validation request to the collector within 30 days of first contact',
        'Check whether the debt is being reported to a specialty consumer reporting agency and dispute any inaccuracies there separately under the FCRA',
        "Research the state's SOL for deposit-account/contract claims",
      ],
    },
    practicalWarnings: [
      'Unpaid overdrafts can affect the ability to open a new bank account for years through specialty consumer reporting agencies — this is a separate issue from any lawsuit risk',
      'Confirm all post-closure fees were properly disclosed under the account agreement before assuming the balance is accurate',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'bank_overdraft-summons_answer',
    debtType: 'bank_overdraft',
    phase: 'summons_answer',
    title: 'Answering an overdraft/negative-balance collection lawsuit',
    overview:
      'Lawsuits over unpaid bank overdrafts are less common than credit card suits but follow the same procedural rules. The answer should test standing (bank suing directly vs. an assignee), the statute of limitations, and whether post-closure fees were properly calculated under the deposit-account agreement.',
    statutoryBasis: [ANSWER_DEADLINE, STANDING_ASSIGNMENT, SOL_DEFENSE],
    caseLawPrecedents: [CASE_HEINTZ],
    remedyAction: {
      actionType: 'answer_and_affirmative_defenses',
      legalRequirements: [
        'File a timely written answer to each allegation',
        'Raise applicable affirmative defenses (SOL, standing, improper fee calculation)',
      ],
      executionSteps: [
        'Calendar and meet the answer deadline',
        'Draft admit/deny responses and affirmative defenses',
        'File and serve the answer per local rules',
        'Request the original deposit-account agreement and full transaction/fee history in discovery',
      ],
    },
    practicalWarnings: [
      'A missed answer deadline still risks default judgment even for a relatively small overdraft balance',
      'Confirm whether the plaintiff is the original bank or an assignee/collector, since that affects the standing analysis',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'bank_overdraft-post_judgment_emergency',
    debtType: 'bank_overdraft',
    phase: 'post_judgment_emergency',
    title: 'Quashing a bank levy after an overdraft judgment',
    overview:
      'If a judgment on an old overdraft balance leads to a levy against a different bank account, the same federal-benefit exemptions and state levy-objection procedures apply as with any other judgment. This scenario also raises a practical concern about consolidating banking relationships while unresolved debts exist.',
    statutoryBasis: [FED_BENEFITS_EXEMPT, VA_BENEFITS_EXEMPT, 'State bank-levy exemption-claim procedures (deadlines and forms vary by state)', BANKRUPTCY_STAY],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'bank_levy_quash',
      legalRequirements: [
        'File the exemption claim or motion to quash within the stated deadline',
        'Document exempt-fund sources in the levied account',
      ],
      executionSteps: [
        'Review the levy notice for the exact deadline and required form',
        'Gather proof of exempt income sources',
        'File the exemption claim/motion to quash and serve the creditor',
        'Consider using a different bank for exempt-benefit deposits going forward, since accounts with open judgments are more exposed to future levies',
      ],
      exemptFundTypes: [
        'Social Security retirement/disability/SSI',
        'VA disability and pension benefits',
        "Unemployment and workers' compensation (state rules vary)",
      ],
    },
    practicalWarnings: [
      'Levy notices often have very short response windows — act immediately upon receipt',
      'A bank may also attempt to set off a judgment debt it holds directly against funds in the debtor\'s own account with that same bank, which follows separate contractual and state-law rules from a third-party judgment levy',
    ],
    disclaimer: DISCLAIMER,
  },

  // ══════════════════════════════════════════════════════════════════════
  // MORTGAGE FORECLOSURE
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'mortgage_foreclosure-pre_suit_validation',
    debtType: 'mortgage_foreclosure',
    phase: 'pre_suit_validation',
    title: 'Pre-foreclosure servicer dispute rights — Notice of Error / RFI and right to cure',
    overview:
      'Before a mortgage servicer refers a loan to foreclosure, the borrower generally has a right to a pre-foreclosure notice of default and, in many cases, an opportunity to cure. Separately, at essentially any point in servicing, a borrower can submit a written Notice of Error or Request for Information under Regulation X, which triggers servicer response deadlines and can surface accounting or escrow errors before litigation begins.',
    statutoryBasis: [
      RESPA_QWR,
      TILA_RESCISSION,
      FORECLOSURE_NOTICE_CURE,
      SOL_DEFENSE,
    ],
    caseLawPrecedents: [CASE_OBDUSKEY],
    remedyAction: {
      actionType: 'statute_of_limitations_defense',
      legalRequirements: [
        'Submit any Notice of Error or Request for Information in writing to the address the servicer designates for such requests, since sending it elsewhere may not trigger the regulatory deadlines',
        'Track the servicer\'s required acknowledgment and substantive-response deadlines under Regulation X',
        'Confirm whether the loan is in a judicial or non-judicial foreclosure state, since the procedure and timeline differ substantially',
      ],
      executionSteps: [
        'Request the full payment and escrow history and compare it against the servicer\'s claimed default amount',
        'Submit a written Notice of Error / Request for Information addressed to the servicer\'s designated RESPA address',
        'Confirm the applicable state\'s pre-foreclosure notice and right-to-cure requirements',
        "Research the applicable statute of limitations on the underlying mortgage debt, which varies significantly by state and can differ from the foreclosure-action limitations period",
        'Consult a foreclosure-defense or housing-counseling resource (e.g., a HUD-approved housing counselor) early, since options like loss mitigation review often have their own deadlines tied to the foreclosure timeline',
      ],
    },
    practicalWarnings: [
      'Foreclosure timelines and required notices vary enormously between judicial and non-judicial foreclosure states — do not assume one state\'s process applies elsewhere',
      'Missing a right-to-cure deadline can accelerate the loss of options that exist earlier in the process',
      'A servicer error dispute does not, by itself, stop a foreclosure from proceeding unless a court or the servicer specifically pauses it',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'mortgage_foreclosure-summons_answer',
    debtType: 'mortgage_foreclosure',
    phase: 'summons_answer',
    title: 'Answering a judicial foreclosure complaint',
    overview:
      'In judicial-foreclosure states, the lender/servicer must file a lawsuit and serve a summons and complaint, and the borrower generally must file a timely answer to avoid a default judgment of foreclosure. The answer typically addresses standing (does the plaintiff hold the note and mortgage, and can it prove the assignment chain), proper acceleration, and compliance with any required pre-suit notices.',
    statutoryBasis: [
      ANSWER_DEADLINE,
      STANDING_ASSIGNMENT,
      FORECLOSURE_NOTICE_CURE,
      RESPA_QWR,
    ],
    caseLawPrecedents: [CASE_OBDUSKEY],
    remedyAction: {
      actionType: 'answer_and_affirmative_defenses',
      legalRequirements: [
        'File a timely written answer in judicial-foreclosure states (non-judicial states have a different process without a summons/complaint in the same way — verify which applies)',
        'Raise standing/chain-of-title (note and mortgage/deed of trust) defenses where the plaintiff appears to be a securitization trust or assignee',
        'Raise any failure to send the required pre-suit notice of default/right to cure as an affirmative defense where applicable',
      ],
      executionSteps: [
        'Confirm whether the state uses judicial or non-judicial foreclosure and identify the applicable response process and deadline',
        'Draft admit/deny responses and affirmative defenses (standing, notice compliance, accounting accuracy)',
        'File and serve the answer per local rules',
        'Request the note, mortgage/deed of trust, and full assignment chain in discovery',
        'Engage with any court-supervised mediation/settlement conference programs the state or court offers, where available',
      ],
    },
    practicalWarnings: [
      'Missing a judicial-foreclosure answer deadline can result in a default judgment of foreclosure, which is generally much harder to undo than answering timely',
      'In many non-judicial foreclosure states, there is no "summons and complaint" to answer in the same way — the available legal challenges (e.g., seeking a court injunction) work differently, so confirm the correct process for the specific state',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'mortgage_foreclosure-discovery_motion',
    debtType: 'mortgage_foreclosure',
    phase: 'discovery_motion',
    title: 'Discovery demands in a judicial foreclosure case — note, assignment, and accounting',
    overview:
      'Discovery in a foreclosure case should focus on the original note (including any allonges/endorsements), the complete assignment chain, the payment and escrow history, and the servicer\'s default and acceleration calculations. Because many foreclosure plaintiffs are securitization trusts, standing and possession-of-the-note issues are frequently contested.',
    statutoryBasis: [
      'State rules of civil procedure governing requests for production and admission',
      STANDING_ASSIGNMENT,
      RESPA_QWR,
    ],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'discovery_demand',
      legalRequirements: [
        'Serve discovery within local-rule and any foreclosure-specific procedural deadlines',
        'Request the original note with all endorsements/allonges, the recorded assignment(s) of mortgage/deed of trust, and the full payment/escrow ledger',
        'Request the servicer\'s default and acceleration calculation worksheet and any loss-mitigation review records',
      ],
      executionSteps: [
        'Draft requests for production for the note, assignments, payment history, and loss-mitigation file',
        'Draft requests for admission on note possession and assignment timing',
        'Move to compel if the plaintiff withholds the original note or assignment documentation',
        'Compare the servicer\'s accounting against the borrower\'s own payment records for discrepancies',
      ],
    },
    practicalWarnings: [
      'Note and assignment disputes in foreclosure litigation are fact-intensive and outcome varies significantly by state and by the specific documentation produced',
      'Discovery deadlines in foreclosure cases can move faster than in ordinary debt-collection cases in some jurisdictions — confirm the local timeline',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'mortgage_foreclosure-post_judgment_emergency',
    debtType: 'mortgage_foreclosure',
    phase: 'post_judgment_emergency',
    title: 'Motion to vacate a foreclosure judgment or stay a sale/eviction for procedural defects',
    overview:
      'After a foreclosure judgment or non-judicial sale, options narrow quickly but are not always closed — a motion to vacate for improper service or a clear procedural defect, an emergency motion to stay a scheduled sale or post-sale eviction, and any statutory redemption period are the main emergency tools, and each has strict, often very short, deadlines.',
    statutoryBasis: [
      RULE_60_VACATE,
      'State post-sale redemption-period statutes (some states provide a statutory right to redeem the property for a period after a foreclosure sale; many do not, or provide only a very short period) — verify the specific state rule',
      'State rules governing service of process in foreclosure actions',
      BANKRUPTCY_STAY,
    ],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'motion_to_vacate',
      legalRequirements: [
        'File the motion to vacate or emergency stay request as soon as possible — foreclosure post-judgment deadlines are often measured in days',
        'Present concrete evidence of the specific defect (improper service, lack of standing not corrected during the case, failure to comply with a required notice)',
        'Confirm whether the state provides any statutory redemption period and its exact deadline',
      ],
      executionSteps: [
        'Immediately obtain the case file and sale/eviction schedule',
        'Identify the specific legal defect being asserted (service, standing, notice) and gather supporting evidence',
        'File an emergency motion to vacate the judgment or stay the sale/eviction with the court, and consider whether a bankruptcy filing\'s automatic stay is a genuinely appropriate option given the borrower\'s full financial picture',
        'If a statutory redemption period applies, calculate the exact deadline and required redemption amount',
        'Engage a foreclosure-defense attorney or HUD-approved housing counselor immediately given the compressed timeline',
      ],
    },
    practicalWarnings: [
      'Post-judgment and post-sale foreclosure deadlines are often extremely short (sometimes days) — delay can eliminate options entirely',
      'A bankruptcy filing\'s automatic stay can pause a foreclosure sale but is a major financial decision that should be evaluated with an attorney, not used reflexively',
      'Not all states provide a post-sale redemption period, and among those that do, the amount and deadline vary significantly',
    ],
    disclaimer: DISCLAIMER,
  },

  // ══════════════════════════════════════════════════════════════════════
  // TAX LIEN
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'tax_lien-pre_suit_validation',
    debtType: 'tax_lien',
    phase: 'pre_suit_validation',
    title: 'Verifying a tax lien or tax debt before any payment or response',
    overview:
      "Tax debt (whether IRS or state/local property tax) follows an administrative collection process rather than an ordinary consumer-debt validation letter, and it is generally exempt from the FDCPA when the government itself is collecting. The first step is verifying the debt is accurate and confirming the applicable collection statute of limitations, since federal tax debt has a general 10-year collection window.",
    statutoryBasis: [IRS_CSED, IRS_LIEN_NOTICE, IRS_PCA, STATE_TAX_LIEN_SALE],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'statute_of_limitations_defense',
      legalRequirements: [
        'For an IRS debt, request an account transcript to confirm the assessment date and calculate the 10-year Collection Statute Expiration Date (CSED), accounting for any suspension events (bankruptcy, installment agreement, collection due process appeal, offer in compromise)',
        'For a state/local property tax lien, verify the amount, the applicable redemption period, and whether proper notice of the lien/pending sale was given under the state statute',
        'Confirm whether the entity contacting the taxpayer is the government agency itself or a private collection agency operating under an authorized program',
      ],
      executionSteps: [
        'Request an IRS account transcript (or the state/local equivalent) to verify the debt and assessment date',
        'Calculate the CSED for federal tax debt, noting any events that would have paused the 10-year clock',
        'For a property tax lien, check the county/municipal record for notice compliance and the redemption deadline',
        'If a private collection agency is involved, confirm it is operating under the authorized federal program and identify itself accordingly',
      ],
    },
    practicalWarnings: [
      "Ordinary FDCPA consumer-debt-collector rules generally do not apply to a government agency collecting its own tax debt, so pre-suit strategy here differs materially from consumer debt",
      'Tax lien priority, redemption periods, and required notices for property tax sales vary enormously by state and even by county — verify locally',
      'Ignoring IRS collection notices can lead to a levy without further court process in many circumstances — timely response to notices matters even without a "lawsuit" in the traditional sense',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'tax_lien-discovery_motion',
    debtType: 'tax_lien',
    phase: 'discovery_motion',
    title: "Requesting the administrative collection file — IRS transcripts and Collection Due Process records",
    overview:
      'Rather than court-style discovery, disputing a tax lien or levy generally means requesting the IRS (or state) administrative record: account transcripts, the Collection Due Process hearing file, and any prior notices sent. A timely Collection Due Process hearing request is the main procedural tool to challenge a lien filing or a proposed levy before it takes effect.',
    statutoryBasis: [IRS_CDP, IRS_LIEN_NOTICE, IRS_INSTALLMENT, IRS_OIC],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'discovery_demand',
      legalRequirements: [
        'File the Collection Due Process hearing request (IRS Form 12153 or the state equivalent) within the deadline stated on the lien/levy notice — generally a short, fixed window',
        'Request account transcripts and the underlying assessment/notice history to verify the government followed its own notice requirements',
        'Prepare any collection alternative (installment agreement, offer in compromise, currently-not-collectible status) to present at the hearing if disputing the amount is not viable',
      ],
      executionSteps: [
        'Identify the exact deadline on the Notice of Federal Tax Lien or Notice of Intent to Levy for requesting a Collection Due Process hearing',
        'Request account transcripts and any prior notice history to confirm the government\'s procedural compliance',
        'Prepare and submit the hearing request along with any supporting financial information for a proposed collection alternative',
        'For state/local property tax liens, request the county/municipal collection file and confirm compliance with the state\'s notice and redemption procedures',
      ],
    },
    practicalWarnings: [
      'Collection Due Process hearing deadlines are short and largely non-negotiable — missing the window can forfeit certain appeal rights (though other administrative remedies, like an equivalent hearing or a later collection alternative request, may still be available)',
      'A Collection Due Process request generally suspends IRS levy action while pending, but this protection has specific conditions and exceptions',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'tax_lien-post_judgment_emergency',
    debtType: 'tax_lien',
    phase: 'post_judgment_emergency',
    title: 'Releasing or quashing an IRS or state tax levy',
    overview:
      'An active IRS or state tax levy against wages or a bank account can often be released or modified through an installment agreement, a hardship (currently-not-collectible) determination, or proof of an error in the underlying assessment — but the process and required forms differ from a private-creditor bank levy and generally move through the tax agency itself rather than a state court.',
    statutoryBasis: [IRS_CDP, IRS_INSTALLMENT, IRS_OIC, FED_BENEFITS_EXEMPT],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'bank_levy_quash',
      legalRequirements: [
        'Contact the IRS (or state tax agency) promptly upon receiving a levy notice, since a levy can often be released faster through direct agency engagement than through court action',
        'Provide current financial information to support an installment agreement, hardship status, or offer in compromise where the amount genuinely cannot be paid',
        'Identify and document any specific assessment error supporting a request to release the levy',
      ],
      executionSteps: [
        'Contact the IRS Automated Collection System or the assigned revenue officer (or the state tax agency equivalent) immediately upon receiving the levy',
        'Submit the required financial disclosure forms to support an installment agreement or hardship request',
        'Request a Collection Due Process or Collection Appeals Program hearing if the levy was issued without proper notice or in error',
        'For a bank levy specifically, act quickly, since funds are typically held for a short statutory period before being remitted to the government',
      ],
      exemptFundTypes: [
        'A statutorily protected minimum amount of wages is generally exempt from IRS levy based on filing status and dependents (calculated using IRS Publication 1494 or the state equivalent), unlike the flat percentage cap used for ordinary private-creditor garnishment',
      ],
    },
    practicalWarnings: [
      'IRS levies follow different exemption rules than ordinary private-creditor garnishment — the exempt amount is calculated using IRS tables, not the CCPA percentage cap',
      'A tax levy can often be released faster through direct communication and a payment arrangement with the agency than through a formal legal challenge',
      'State tax levies and property tax lien foreclosure follow separate state-specific procedures from IRS levies — do not assume the same rules apply to both',
    ],
    disclaimer: DISCLAIMER,
  },

  // ══════════════════════════════════════════════════════════════════════
  // MERCHANT CASH ADVANCE
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'merchant_cash_advance-pre_suit_validation',
    debtType: 'merchant_cash_advance',
    phase: 'pre_suit_validation',
    title: 'Merchant cash advance pre-suit review — business debt status and confession-of-judgment risk',
    overview:
      "Merchant cash advances are structured as a purchase of future receivables rather than a consumer loan, which generally removes them from FDCPA and other consumer-protection coverage and places disputes squarely in commercial-contract and, in some states, usury-recharacterization law. The single most urgent pre-suit issue is checking whether the contract contains a confession-of-judgment (COJ) clause, because a COJ can result in a judgment being entered against the business (or a personal guarantor) without any notice or opportunity to be heard.",
    statutoryBasis: [MCA_BUSINESS_DEBT_NOTE, NY_COJ_LAW, USURY_RECHARACTERIZATION, SOL_DEFENSE],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'statute_of_limitations_defense',
      legalRequirements: [
        'Review the MCA agreement immediately for a confession-of-judgment or cognovit clause and identify which state\'s courts it designates',
        'Determine whether the daily/weekly debit structure and fixed payment amount, regardless of the business\'s actual receivables, could support a usury-recharacterization argument under the applicable state\'s law',
        'Confirm whether a personal guaranty was signed, since that can expose personal (not just business) assets',
      ],
      executionSteps: [
        'Obtain and carefully review the full MCA agreement and any personal guaranty for a confession-of-judgment clause',
        'If a COJ clause exists, consult an attorney immediately, since a judgment can potentially be entered without prior notice in some jurisdictions',
        'Evaluate whether the specific state where judgment could be entered has restricted or banned COJs for this type of transaction (several states, including New York, have restricted their use against non-resident or consumer-style debtors)',
        'Document the actual receivables structure (fixed daily debits vs. true percentage-of-sales reconciliation) to assess a possible usury/recharacterization argument',
      ],
    },
    practicalWarnings: [
      'MCA transactions are generally treated as business/commercial debt, so standard consumer protections like the FDCPA typically do not apply — the legal toolkit here is materially different from consumer-debt defense',
      'A confession-of-judgment clause can allow a judgment to be entered extremely quickly with little or no advance notice — this deserves immediate attorney attention, not a wait-and-see approach',
      'A personal guaranty attached to an MCA can put personal assets at risk even though the underlying advance was for the business',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'merchant_cash_advance-summons_answer',
    debtType: 'merchant_cash_advance',
    phase: 'summons_answer',
    title: 'Responding to an MCA collection suit or a filed confession of judgment',
    overview:
      "If an MCA funder sues in the ordinary way (rather than filing a pre-signed confession of judgment), the response should raise usury-recharacterization and contract-formation defenses where supported by the facts. If a confession of judgment has already been entered, the available response is typically a post-judgment motion to vacate, not an ordinary answer, because a COJ generally bypasses the normal complaint-and-answer process entirely.",
    statutoryBasis: [ANSWER_DEADLINE, MCA_BUSINESS_DEBT_NOTE, USURY_RECHARACTERIZATION, NY_COJ_LAW],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'answer_and_affirmative_defenses',
      legalRequirements: [
        'If served with an ordinary summons and complaint, file a timely written answer raising applicable business-debt and usury-recharacterization defenses',
        'If a confession of judgment has already been entered without prior notice, immediately consult an attorney about a motion to vacate rather than attempting to file a standard answer',
        'Identify whether personal guarantors are also named and whether they have independent defenses',
      ],
      executionSteps: [
        'Determine immediately whether a lawsuit summons was served or whether a confession of judgment has already been filed and entered',
        'If summoned in the ordinary way, calendar the answer deadline and draft a response addressing usury-recharacterization and contract defenses where supported',
        'If a COJ was already entered, treat this as an emergency and consult an attorney about a motion to vacate based on the specific COJ statute\'s requirements (e.g., defects in the affidavit of confession, lack of proper venue, or the state\'s COJ restrictions)',
        'Review any personal guaranty separately for its own defenses',
      ],
    },
    practicalWarnings: [
      'A confession of judgment can result in wage garnishment or a bank levy against the business (or guarantor) with essentially no advance warning — speed is critical once discovered',
      'Business-debt cases generally do not carry the same consumer protections (like FDCPA validation rights) that apply to personal debt',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'merchant_cash_advance-post_judgment_emergency',
    debtType: 'merchant_cash_advance',
    phase: 'post_judgment_emergency',
    title: 'Vacating a confession-of-judgment and stopping an MCA bank levy',
    overview:
      "Because a confession of judgment can be entered without the business ever appearing in court, a motion to vacate is often the first opportunity the business has to actually contest the debt. Many funders move immediately to levy the business's bank account once judgment is entered, so this is typically a genuine emergency requiring rapid legal action.",
    statutoryBasis: [NY_COJ_LAW, RULE_60_VACATE, USURY_RECHARACTERIZATION, MCA_BUSINESS_DEBT_NOTE],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'motion_to_vacate',
      legalRequirements: [
        'File the motion to vacate the confession of judgment as quickly as possible, citing defects such as improper venue, an invalid or improperly executed affidavit of confession, lack of proper notice where required, or the state\'s specific restrictions on COJs in this context',
        'Simultaneously seek an emergency stay of any pending bank levy or garnishment while the motion is pending',
        'Present the usury-recharacterization or contract-formation defense as part of the substantive challenge to the underlying debt',
      ],
      executionSteps: [
        'Retain a business-litigation or commercial-finance attorney immediately upon learning a judgment has been entered',
        'Identify the specific procedural or substantive defect in the confession-of-judgment filing',
        'File the motion to vacate and, in parallel, an emergency motion to stay enforcement (levy/garnishment) pending the outcome',
        'Gather the full MCA contract, payment history, and any personal guaranty for the underlying merits challenge',
      ],
    },
    practicalWarnings: [
      'This is one of the most time-sensitive scenarios in this repository — funds can be levied from a business bank account within days of judgment entry in some jurisdictions',
      'Some states have banned or sharply restricted confessions of judgment against out-of-state or small-business debtors — whether that protection applies depends heavily on the specific facts and forum state',
      'A successful motion to vacate reopens the case; it does not resolve whether the underlying MCA debt is valid',
    ],
    disclaimer: DISCLAIMER,
  },

  // ══════════════════════════════════════════════════════════════════════
  // PAYDAY LOAN
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'payday_loan-pre_suit_validation',
    debtType: 'payday_loan',
    phase: 'pre_suit_validation',
    title: "Payday loan validation and usury/licensing check before responding to a collector",
    overview:
      'Payday loans are heavily regulated at the state level, with enormous variation in permitted rates, terms, and even whether the loan is legal at all in the consumer\'s state. Before responding to a collector, it is worth checking whether the original lender was properly licensed in the consumer\'s state and whether the loan structure (including any "rent-a-bank" arrangement) may run afoul of the state\'s usury cap, in addition to standard FDCPA validation rights.',
    statutoryBasis: [FDCPA_VALIDATION, FDCPA_CEASE, STATE_USURY_CAPS, RENT_A_BANK, MLA_CITE, SOL_DEFENSE],
    caseLawPrecedents: [CASE_BARTLETT],
    remedyAction: {
      actionType: 'statute_of_limitations_defense',
      legalRequirements: [
        "Confirm whether the original lender was licensed to make loans in the borrower's state, since some online payday lenders operate outside state licensing frameworks (including some claiming tribal or offshore-bank affiliation)",
        'Send a written validation request to any third-party collector',
        "Check the state's small-dollar-loan/payday usury cap and licensing requirements against the loan's actual terms",
      ],
      executionSteps: [
        "Research the borrower's state payday-lending statute (or confirm if the state bans payday loans outright) and the lender's licensing status",
        'Send the validation request and, if desired, a cease-communication letter, in writing',
        'If the loan involves a bank-partner or tribal-lending structure, note this for further legal review, since "true lender" and usury-evasion challenges are fact-intensive and evolving areas of law',
        'If the borrower is an active-duty servicemember or covered dependent, check whether the Military Lending Act rate cap and protections were properly applied',
      ],
    },
    practicalWarnings: [
      'Payday loan legality and rate caps vary dramatically by state — a loan legal in one state may be void or unenforceable if made to a resident of a state that prohibits or caps such loans',
      '"Rent-a-bank" and tribal-lending usury-evasion theories are genuinely unsettled and fact-specific — do not assume a loan is automatically void without a proper legal review',
      'Rolling over or reborrowing to cover a payday loan can trigger new fees and restart timing issues — get independent advice before doing so',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'payday_loan-summons_answer',
    debtType: 'payday_loan',
    phase: 'summons_answer',
    title: 'Answering a payday loan collection lawsuit',
    overview:
      'A payday loan lawsuit answer should test the lender\'s licensing status in the state, the loan\'s compliance with the state usury cap, and (if applicable) whether an arbitration clause was properly waived by filing in court, in addition to the standard SOL and standing defenses.',
    statutoryBasis: [ANSWER_DEADLINE, STATE_USURY_CAPS, SOL_DEFENSE, STANDING_ASSIGNMENT],
    caseLawPrecedents: [CASE_HEINTZ],
    remedyAction: {
      actionType: 'answer_and_affirmative_defenses',
      legalRequirements: [
        'File a timely written answer to each allegation',
        "Raise licensing/usury defenses where the lender's state licensing or rate appears noncompliant",
        'Raise SOL and standing defenses where applicable',
      ],
      executionSteps: [
        'Calendar and meet the answer deadline',
        "Research the lender's licensing status in the relevant state and compare the loan's APR/fees against the state cap",
        'Draft admit/deny responses and applicable affirmative defenses',
        'File and serve the answer per local rules',
      ],
    },
    practicalWarnings: [
      'An unlicensed or usurious loan may be void or unenforceable under some states\' laws, but this is a defense that must be raised and proven, not assumed',
      'A missed answer deadline risks default judgment regardless of any underlying licensing issue',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'payday_loan-discovery_motion',
    debtType: 'payday_loan',
    phase: 'discovery_motion',
    title: "Discovery demands targeting a payday lender's licensing and bank-partner structure",
    overview:
      'Discovery should seek the lender\'s state licensing records, the loan agreement showing the actual APR and fee structure, and — where a bank-partner or tribal-lending arrangement is suspected — documents showing who actually funded, underwrote, and retained the economic risk of the loan, since that can be central to a usury-evasion challenge.',
    statutoryBasis: [
      'State rules of civil procedure governing requests for production and admission',
      STATE_USURY_CAPS,
      RENT_A_BANK,
    ],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'discovery_demand',
      legalRequirements: [
        'Serve discovery within local-rule deadlines',
        'Request the loan agreement, the lender\'s state licensing documentation, and (where applicable) the bank-partnership or loan-purchase agreement showing who funded and retained the credit risk',
        'Request the full fee and interest calculation supporting the amount claimed',
      ],
      executionSteps: [
        'Draft requests for production for licensing records, the loan agreement, and any bank-partner/assignment agreements',
        'Draft requests for admission on licensing status and the actual APR charged',
        'Move to compel if the plaintiff withholds bank-partner or funding-source documentation',
        'Compare the loan\'s actual cost against the state usury cap using the produced records',
      ],
    },
    practicalWarnings: [
      'Bank-partner and tribal-lending arrangements can be structured specifically to resist discovery into the underlying funding source — a motion to compel may be necessary',
      'Discovery obligations run both ways',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'payday_loan-post_judgment_emergency',
    debtType: 'payday_loan',
    phase: 'post_judgment_emergency',
    title: 'Wage garnishment exemptions after a payday loan judgment',
    overview:
      'A payday loan judgment is collected like any other small-dollar civil judgment, most often through wage garnishment. Federal garnishment caps and benefit exemptions apply, and some states impose additional, stricter limits or outright bans on wage garnishment for this category of consumer debt.',
    statutoryBasis: [CCPA_GARNISHMENT, FED_BENEFITS_EXEMPT, 'State garnishment limits and, in some states, specific restrictions on payday-loan enforcement (varies by state)', BANKRUPTCY_STAY],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'wage_garnishment_exemption',
      legalRequirements: [
        'File the exemption claim/objection within the deadline on the garnishment notice',
        'Document exempt income sources',
        'Confirm the withheld amount respects the applicable federal or (if lower/stricter) state cap',
      ],
      executionSteps: [
        'Review the garnishment notice for the filing deadline',
        'Gather proof of income sources and amounts',
        'File the exemption claim/objection and serve the creditor',
        'Attend any hearing prepared with documentation',
      ],
      exemptFundTypes: [
        'Social Security retirement/disability/SSI',
        'VA disability and pension benefits',
        'Unemployment compensation (state rules vary)',
        'Child support received',
      ],
    },
    practicalWarnings: [
      'Small original loan amounts can balloon significantly with accrued fees and interest by the time of judgment — verify the judgment amount against the original loan and any usury issues that may have already been (or still could be) raised',
      'Garnishment exemption deadlines are typically short',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'payday_loan-counter_suit',
    debtType: 'payday_loan',
    phase: 'counter_suit',
    title: 'FDCPA counter-suit for payday loan collection misconduct',
    overview:
      'Payday loan collection is a frequent source of aggressive tactics — repeated calls, threats of criminal prosecution (which is generally improper for an unpaid civil debt), and contact with employers or family members beyond what the law allows. Where a third-party collector or debt buyer engages in this conduct, an FDCPA claim can be a genuine remedy.',
    statutoryBasis: [FDCPA_FALSE, FDCPA_UNFAIR, FDCPA_CEASE, REG_F_CALL_FREQUENCY, FDCPA_LIABILITY, TCPA_CITE],
    caseLawPrecedents: [CASE_JERMAN, CASE_MARX, CASE_DUGUID],
    remedyAction: {
      actionType: 'fdcpa_counter_suit',
      legalRequirements: [
        'Document specific violations, including any threat of criminal charges or arrest for an unpaid payday loan, which is generally improper collection conduct absent an actual, separate criminal referral',
        'Preserve call logs, voicemails, and any written threats',
        "File within the FDCPA's one-year statute of limitations",
      ],
      executionSteps: [
        'Log every contact, including any threats of criminal action or unauthorized contact with employers/family',
        'File CFPB and state Attorney General complaints, since payday lending is heavily regulated at the state level and AG offices are often active in this space',
        'Consult a consumer-law attorney about a counterclaim or standalone FDCPA suit',
      ],
    },
    practicalWarnings: [
      'Threatening criminal prosecution or arrest over an unpaid payday loan is generally improper collection conduct in the ordinary civil-debt context and should be documented carefully',
      'A genuine FDCPA violation is independent from — and does not automatically resolve — any separate usury or licensing challenge to the underlying loan',
    ],
    disclaimer: DISCLAIMER,
  },

  // ══════════════════════════════════════════════════════════════════════
  // TIMESHARE
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'timeshare-pre_suit_validation',
    debtType: 'timeshare',
    phase: 'pre_suit_validation',
    title: 'Timeshare rescission window and maintenance-fee dispute before collection escalates',
    overview:
      "Timeshare disputes generally start in one of two ways: a missed rescission ('cooling-off') deadline shortly after purchase, or a later default on ongoing maintenance fees/special assessments. Checking whether the original purchase rescission window was ever properly exercised, and requesting a full accounting of the fees claimed, are the key steps before responding to a collector.",
    statutoryBasis: [TIMESHARE_RESCISSION, FDCPA_VALIDATION, TIMESHARE_ASSESSMENT_LIEN, SOL_DEFENSE],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'statute_of_limitations_defense',
      legalRequirements: [
        "Confirm the purchase date and whether the state's rescission window was ever exercised in writing within the required deadline (this window is typically very short and long since expired for most existing owners)",
        'Request a full accounting of the maintenance fees, special assessments, interest, and any collection fees claimed',
        "Confirm the state's statute of limitations for the underlying contract or assessment-lien claim",
      ],
      executionSteps: [
        'Locate the original purchase contract and confirm the state and rescission deadline that applied at signing',
        'Request an itemized accounting of all fees, assessments, and charges from the resort/HOA or its collection agent',
        'Send a written validation request to any third-party collector',
        "Research the state's SOL for the underlying contract/assessment-lien claim",
        'Be skeptical of "timeshare exit" companies that demand large up-front fees with vague promises — verify any such company\'s track record and complaint history before paying anything',
      ],
    },
    practicalWarnings: [
      'The original rescission window is typically only a matter of days and, once expired, generally cannot be revived — most existing owners are past this window',
      'Timeshare "exit companies" charging large upfront fees are a common source of complaints and additional financial harm — research thoroughly before engaging one',
      'Assessment liens can sometimes lead to foreclosure of the timeshare interest itself, separate from any personal money judgment for the fees owed',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'timeshare-summons_answer',
    debtType: 'timeshare',
    phase: 'summons_answer',
    title: 'Answering a timeshare maintenance-fee or assessment-lien collection lawsuit',
    overview:
      "A timeshare collection lawsuit answer should address the accuracy of the fees/assessments claimed, whether the plaintiff (often a collection agency for the resort HOA) can prove the assessment was properly levied and noticed under the association's governing documents and state law, and standard SOL and standing defenses.",
    statutoryBasis: [ANSWER_DEADLINE, TIMESHARE_ASSESSMENT_LIEN, SOL_DEFENSE, STANDING_ASSIGNMENT],
    caseLawPrecedents: [CASE_HEINTZ],
    remedyAction: {
      actionType: 'answer_and_affirmative_defenses',
      legalRequirements: [
        'File a timely written answer to each allegation',
        "Raise defenses regarding the accuracy of the assessment and compliance with the association's governing documents and state common-interest-community law where applicable",
        'Raise SOL and standing defenses where applicable',
      ],
      executionSteps: [
        'Calendar and meet the answer deadline',
        "Request the association's governing documents (CC&Rs/bylaws) and the specific assessment resolution/notice",
        'Draft admit/deny responses and applicable affirmative defenses',
        'File and serve the answer per local rules',
      ],
    },
    practicalWarnings: [
      'A missed answer deadline risks default judgment, which in some states can also support foreclosure of the timeshare interest',
      'Timeshare association assessment procedures and required notices are governed by state common-interest-community law, which varies significantly',
    ],
    disclaimer: DISCLAIMER,
  },
  {
    id: 'timeshare-post_judgment_emergency',
    debtType: 'timeshare',
    phase: 'post_judgment_emergency',
    title: 'Vacating a default judgment or addressing a timeshare assessment-lien foreclosure',
    overview:
      "Post-judgment options in a timeshare case depend heavily on whether the judgment is a personal money judgment (collectible like any other civil judgment) or the association is instead pursuing foreclosure of the timeshare interest itself under an assessment lien. A motion to vacate for improper service remains available under the same general standards as other consumer-debt judgments where applicable.",
    statutoryBasis: [RULE_60_VACATE, TIMESHARE_ASSESSMENT_LIEN, CCPA_GARNISHMENT, BANKRUPTCY_STAY],
    caseLawPrecedents: [],
    remedyAction: {
      actionType: 'motion_to_vacate',
      legalRequirements: [
        'File the motion to vacate within the applicable state deadline if service was improper or another recognized procedural defect exists',
        'If the association is foreclosing the timeshare interest itself rather than pursuing a personal money judgment, confirm the specific state procedure and any right to cure or redeem before the foreclosure is finalized',
        'Show a meritorious defense where the state requires one alongside the procedural defect',
      ],
      executionSteps: [
        'Obtain the court file and review the proof of service and the type of relief the plaintiff obtained (money judgment vs. lien foreclosure of the timeshare interest)',
        'Gather evidence contradicting improper service if applicable',
        'File the motion to vacate, citing the specific defect',
        'If facing lien foreclosure, confirm any state-provided right to cure/redeem and its deadline immediately',
      ],
    },
    practicalWarnings: [
      'Losing the timeshare interest to lien foreclosure does not necessarily eliminate a separate personal deficiency judgment for unpaid fees in every state — confirm how the specific state treats this',
      'Deadlines to challenge a default judgment or a pending lien foreclosure can be short — act promptly upon discovering either',
    ],
    disclaimer: DISCLAIMER,
  },
];

export function getAllDebtLitigationPlaybooks(): DebtLitigationPlaybook[] {
  return DEBT_LITIGATION_PLAYBOOKS;
}

export function getPlaybooksByDebtType(
  debtType: DebtLitigationPlaybook['debtType'],
): DebtLitigationPlaybook[] {
  return DEBT_LITIGATION_PLAYBOOKS.filter((playbook) => playbook.debtType === debtType);
}

export function getPlaybooksByPhase(
  phase: DebtLitigationPlaybook['phase'],
): DebtLitigationPlaybook[] {
  return DEBT_LITIGATION_PLAYBOOKS.filter((playbook) => playbook.phase === phase);
}

export function getPlaybook(
  debtType: DebtLitigationPlaybook['debtType'],
  phase: DebtLitigationPlaybook['phase'],
): DebtLitigationPlaybook | undefined {
  return DEBT_LITIGATION_PLAYBOOKS.find(
    (playbook) => playbook.debtType === debtType && playbook.phase === phase,
  );
}
