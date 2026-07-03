/**
 * Expanded letter catalog — 80+ scenario-specific workflows.
 * Entries marked `full` map to DebtLetterType bodies; `outline` uses generateCatalogLetterBody.
 */
import type { DebtLetterType } from '../domain/debtLegal';

export type LetterCatalogCategory =
  | 'validation'
  | 'court'
  | 'securitization'
  | 'repossession'
  | 'foreclosure'
  | 'negotiation'
  | 'reporting'
  | 'bureau';

export type DebtLetterCatalogEntry = {
  id: string;
  category: LetterCatalogCategory;
  title: string;
  shortDescription: string;
  whenToUse: string[];
  laws: string[];
  keyPrinciple: string;
  scenarios: string[];
  tier: 'full' | 'outline';
  letterType?: DebtLetterType;
};

function v(
  category: LetterCatalogCategory,
  slug: string,
  title: string,
  short: string,
  when: string[],
  laws: string[],
  principle: string,
  scenarios: string[],
  tier: 'full' | 'outline' = 'outline',
  letterType?: DebtLetterType,
): DebtLetterCatalogEntry {
  return {
    id: `${category}_${slug}`,
    category,
    title,
    shortDescription: short,
    whenToUse: when,
    laws,
    keyPrinciple: principle,
    scenarios,
    tier,
    letterType,
  };
}

const VALIDATION: DebtLetterCatalogEntry[] = [
  v('validation', 'initial_fdcpa', 'Initial validation (FDCPA § 809)', 'First written demand for debt validation within 30-day window.', ['First collector contact', 'Before paying'], ['15 U.S.C. § 1692g'], 'Stop collection until validated.', ['first_contact'], 'full', 'validation_request'),
  v('validation', 'round2_deficiency', 'Round 2 — deficient validation', 'Identify gaps after a weak validation packet.', ['Statement only response', 'No contract'], ['15 U.S.C. § 1692g'], 'Partial docs ≠ validation.', ['post_validation'], 'full', 'validation_round2_deficiency'),
  v('validation', 'round3_final', 'Round 3 — final validation demand', 'Escalate before CFPB/state AG.', ['Ignored round 2'], ['15 U.S.C. § 1692g'], 'Create paper trail.', ['post_validation'], 'full', 'validation_round3_final_demand'),
  v('validation', 'licensing_demand', 'Collector licensing demand', 'Demand state collection license and bond info.', ['Out-of-state collector'], ['State collection act'], 'Unlicensed collection may be unlawful.', ['licensing']),
  v('validation', 'accounting_ledger', 'Itemized accounting demand', 'Demand full ledger, fees, interest, credits.', ['Inflated balance'], ['TILA', 'FDCPA'], 'Prove every dollar.', ['accounting']),
  v('validation', 'chain_of_title', 'Chain-of-title validation', 'Demand assignments from originator to collector.', ['Debt buyer'], ['UCC § 9-330'], 'Account-level proof required.', ['debt_buyer'], 'full', 'assignment_chain_demand'),
  v('validation', 'medical_hipaa_adjacent', 'Medical debt validation', 'HIPAA-adjacent itemization + provider proof.', ['Hospital bill'], ['FDCPA', 'State medical debt'], 'Verify provider and itemization.', ['medical']),
  v('validation', 'student_loan', 'Private student loan validation', 'Demand note, disbursement, owner, servicer chain.', ['SLM/trust plaintiff'], ['FDCPA', 'UCC'], 'Trust must prove account match.', ['student_loan']),
  v('validation', 'auto_deficiency', 'Auto loan validation', 'Demand contract, repo notices, sale accounting.', ['Deficiency after repo'], ['UCC Art. 9', 'FDCPA'], 'Repo sale must be reasonable.', ['auto', 'repossession']),
  v('validation', 'credit_card', 'Credit card validation', 'Demand cardholder agreement bearing your signature.', ['Card sued without contract'], ['FDCPA', 'Best evidence'], 'Unsigned electronic form insufficient.', ['credit_card']),
  v('validation', 'payday_loan', 'Payday / online lender validation', 'Demand original agreement and tribal/lender identity.', ['Online lender'], ['FDCPA', 'TILA'], 'Identify real creditor.', ['payday']),
  v('validation', 'landlord_utility', 'Utility / landlord collection validation', 'Validate assignment from utility or housing debt.', ['Utility collection'], ['FDCPA'], 'Prove transfer to collector.', ['utility']),
  v('validation', 'insurance_subro', 'Insurance subrogation validation', 'Demand subrogation agreement and damages ledger.', ['Auto subrogation'], ['Contract law'], 'Subro must prove payment.', ['insurance']),
  v('validation', 'hoa_assessment', 'HOA assessment validation', 'Demand assessment roll, lien docs, standing.', ['HOA collections'], ['State HOA act'], 'Prove lien validity.', ['hoa']),
  v('validation', 'timeshare', 'Timeshare debt validation', 'Demand ownership records and default calculation.', ['Timeshare collector'], ['FDCPA'], 'Prove obligation and amount.', ['timeshare']),
  v('validation', 'business_debt_personal', 'Personal guarantee validation', 'Demand guarantee instrument and consideration.', ['Business debt on consumer'], ['Contract law'], 'Separate consumer guarantee.', ['business_guarantee']),
  v('validation', 'identity_theft', 'Identity theft validation block', 'Dispute debt as fraud; demand fraud investigation.', ['Not your account'], ['FDCPA', 'FCRA'], 'Do not validate fraud debt.', ['identity_theft']),
  v('validation', 'deceased_estate', 'Deceased borrower validation', 'Demand authority to collect from estate.', ['Estate collection'], ['FDCPA', 'Probate'], 'Collector must prove authority.', ['deceased']),
  v('validation', 'servicemember', 'SCRA validation addendum', 'Add SCRA status and rate/ stay questions.', ['Active duty'], ['SCRA', 'FDCPA'], 'Military protections apply.', ['scra']),
  v('validation', 'mini_miranda_suit', 'Post-suit validation (mini-Miranda)', 'Validation after lawsuit uses collector disclosure.', ['Sued with mini-Miranda'], ['15 U.S.C. § 1692e(11)'], 'Pleading status vs collector status.', ['summons_served'], 'full', 'post_suit_validation_demand'),
];

const COURT: DebtLetterCatalogEntry[] = [
  v('court', 'answer_general', 'General answer outline', 'Deny allegations; demand proof; preserve defenses.', ['Sued on debt'], ['Civil procedure'], 'Do not admit debt in answer.', ['summons_served'], 'full', 'summons_response_affidavit'),
  v('court', 'affidavit_dispute', 'Affidavit of dispute', 'Sworn denial and burden shift.', ['Pre-trial', 'MSJ response'], ['Evidence rules'], 'Put facts under oath.', ['summons_served'], 'full', 'affidavit_of_dispute'),
  v('court', 'discovery_full', 'Defendant discovery set', 'RFAs, interrogatories, RFPs on standing.', ['After answer'], ['Discovery rules'], 'Force account-level docs.', ['summons_served'], 'full', 'defendant_discovery_requests'),
  v('court', 'motion_compel', 'Motion to compel', 'Compel supplemental discovery.', ['Evasive responses'], ['Discovery rules'], 'Court orders production.', ['summons_served'], 'full', 'motion_to_compel_discovery'),
  v('court', 'counterclaim_fdcpa', 'FDCPA counterclaim outline', 'Counterclaim when plaintiff is debt collector on pleadings.', ['Mini-Miranda on complaint'], ['15 U.S.C. § 1692k'], 'Strict liability FDCPA.', ['counterclaim'], 'outline'),
  v('court', 'affirmative_defenses_sol', 'SOL affirmative defenses', 'Plead limitations and revival issues.', ['Old debt sued'], ['State SOL'], 'Affirmative defense required.', ['time_barred']),
  v('court', 'affirmative_defenses_standing', 'Standing / real party defenses', 'Challenge assignee and trust ownership.', ['Debt buyer', 'Trust plaintiff'], ['Assignment cases'], 'No assignment = no case.', ['debt_buyer']),
  v('court', 'affirmative_defenses_account_stated', 'Anti-account-stated defenses', 'Deny payment history and agreement.', ['Account stated claim'], ['Contract law'], 'No payment = no account stated.', ['account_stated']),
  v('court', 'affirmative_defenses_hearsay', 'Hearsay / business records objection', 'Challenge affidavit of indebtedness.', ['Robo-affidavit'], ['Evidence rules'], 'Affiant must have personal knowledge.', ['affidavit_hearsay']),
  v('court', 'motion_dismiss_standing', 'Motion to dismiss — standing', 'Dismiss for lack of ownership proof.', ['No assignment attached'], ['Civil procedure'], 'Dismiss without prejudice.', ['standing']),
  v('court', 'motion_stay_arbitration', 'Motion to compel arbitration', 'If contract has arbitration clause.', ['Card agreement arbitration'], ['FAA'], 'Forum may shift.', ['arbitration']),
  v('court', 'request_jury', 'Jury demand', 'Preserve jury trial rights.', ['State court'], ['Civil procedure'], 'Timely demand required.', ['jury']),
  v('court', 'request_bench_trial', 'Bench trial statement', 'Elect bench if preferred.', ['Small claims appeal'], ['Civil procedure'], 'Strategy election.', ['trial']),
  v('court', 'subpoena_duces', 'Non-party subpoena outline', 'Subpoena originator or servicer records.', ['Plaintiff lacks records'], ['Discovery rules'], 'Third-party custodian docs.', ['discovery']),
  v('court', 'deposition_outline', 'Deposition outline — affiant', 'Question robo-signer foundation.', ['Affidavit signer'], ['Evidence'], 'Expose lack of knowledge.', ['deposition']),
  v('court', 'sanctions_bad_faith', 'Sanctions letter outline', 'Bad-faith discovery or false pleadings.', ['False affidavit date'], ['Discovery sanctions'], 'Document misconduct.', ['sanctions']),
  v('court', 'settlement_without_admission', 'Settlement without admission', 'Negotiate without admitting liability.', ['Pre-trial'], ['Contract law'], 'No admission language.', ['negotiation']),
  v('court', 'stipulated_dismissal', 'Stipulated dismissal request', 'Dismiss with prejudice after resolution.', ['Paid settlement'], ['Civil procedure'], 'Close case cleanly.', ['settlement']),
  v('court', 'appeal_notice', 'Notice of appeal outline', 'Preserve appeal from adverse judgment.', ['Lost trial'], ['Appellate rules'], 'Deadlines are short.', ['appeal']),
  v('court', 'vexatious_litigant', 'Protective order request', 'If collector harasses through repeated suits.', ['Serial filings'], ['Civil procedure'], 'Court protective orders.', ['harassment']),
];

const SECURITIZATION: DebtLetterCatalogEntry[] = [
  v('securitization', 'answer_discover', 'Securitization answer (Discover pattern)', 'Answer denying ownership after ABS pooling.', ['Discover Bank suit'], ['UCC', 'FDCPA'], 'Trust must re-assign to sue.', ['securitization'], 'outline'),
  v('securitization', 'answer_amex', 'Securitization answer (Amex pattern)', 'Answer + counter-affidavit for card securitization.', ['Amex suit'], ['UCC', 'FDCPA'], 'Pooling agreement controls.', ['securitization'], 'outline'),
  v('securitization', 'answer_boa', 'Securitization answer (BOA pattern)', 'Bank of America securitization defenses.', ['BOA suit'], ['UCC'], 'Prove re-purchase from trust.', ['securitization'], 'outline'),
  v('securitization', 'counter_affidavit', 'Counter-affidavit of dispute (securitization)', 'Sworn denial of trust ownership.', ['Securitized card debt'], ['Evidence'], 'Affidavit supports answer.', ['securitization'], 'outline'),
  v('securitization', 'rfa_pooled', 'RFA — debt was pooled', 'Admission request on securitization.', ['Discovery phase'], ['Discovery'], 'Lock in admissions.', ['securitization']),
  v('securitization', 'rfa_servicing', 'RFA — servicer vs owner', 'Who receives monthly payments.', ['Discovery'], ['Discovery'], 'Split servicing rights.', ['securitization']),
  v('securitization', 'rfp_trust_docs', 'RFP — pooling & servicing agreement', 'Demand PSA and transfer docs.', ['Standing challenge'], ['Discovery'], 'EDGAR + trust docs.', ['securitization']),
  v('securitization', 'rfp_payment_waterfall', 'RFP — payment waterfall', 'Where payments go after you pay.', ['Accounting dispute'], ['Discovery'], 'Trace payment application.', ['securitization']),
  v('securitization', 'interrogatory_owner', 'Interrogatory — beneficial owner', 'Identify certificateholders / trust.', ['Standing'], ['Discovery'], 'Real party in interest.', ['securitization']),
  v('securitization', 'mini_miranda_rfa', 'RFA — mini-Miranda authorized', 'Whether plaintiff authorized collector language.', ['FDCPA on pleading'], ['15 U.S.C. § 1692e'], 'Creditor vs collector.', ['mini_miranda']),
  v('securitization', 'supplement_demand', 'Supplemental discovery demand', 'After admission of securitization.', ['Partial responses'], ['Discovery'], 'Assignments to/from trust.', ['securitization']),
  v('securitization', 'edgar_research_request', 'EDGAR / SEC research demand', 'Ask plaintiff to identify SEC filings.', ['Public securitization'], ['Securities law'], 'Public filings as evidence.', ['securitization']),
  v('securitization', 'trustee_notice', 'Trustee / indenture trustee notice', 'Notice to trust administrator.', ['Trust plaintiff'], ['Trust law'], 'Third-party recordkeeper.', ['securitization']),
  v('securitization', 'rebuttal_account_stated', 'Rebut account stated after securitization', 'No direct dealing with plaintiff.', ['Account stated'], ['Contract'], 'No privity.', ['account_stated']),
  v('securitization', 'affidavit_litigation_bank', 'Bank plaintiff affidavit', 'Full sworn bank litigation affidavit.', ['Bank sues'], ['FDCPA', 'Evidence'], 'Neutral litigation affidavit.', ['summons_served'], 'full', 'affidavit_litigation_bank'),
];

const REPOSSESSION: DebtLetterCatalogEntry[] = [
  v('repossession', 'answer_claim_delivery', 'Answer — claim & delivery / replevin', 'Defend vehicle lease/repo lawsuit.', ['Sued for vehicle'], ['UCC Art. 9', 'FDCPA'], 'Prove ownership and peaceful repo rights.', ['repossession_suit'], 'outline'),
  v('repossession', 'wrongful_repo_demand', 'Wrongful repossession demand', 'Demand return after breach of peace / no default.', ['Repo at night', 'No default'], ['UCC § 9-609'], 'Breach of peace may void repo.', ['wrongful_repo']),
  v('repossession', 'reinstatement_demand', 'Reinstatement demand', 'Pay arrears + fees to get vehicle back.', ['Right to reinstate'], ['UCC', 'State repo law'], 'State statutes vary.', ['reinstatement']),
  v('repossession', 'redemption_demand', 'Redemption before sale', 'Redeem collateral before disposition.', ['Pre-sale'], ['UCC § 9-623'], 'Redeem with full payoff + expenses.', ['redemption']),
  v('repossession', 'notice_sale_demand', 'Notice of sale demand', 'Demand commercially reasonable sale notice.', ['Repo completed'], ['UCC § 9-610'], 'Sale must be reasonable.', ['repo_sale']),
  v('repossession', 'deficiency_dispute', 'Deficiency balance dispute', 'Challenge inflated deficiency after sale.', ['Deficiency letter'], ['UCC § 9-615'], 'Credit for sale price required.', ['deficiency'], 'outline'),
  v('repossession', 'personal_property_demand', 'Personal property in vehicle', 'Demand return of contents in car.', ['Wallet/items in car'], ['UCC', 'State law'], 'Secured party cannot keep personal items.', ['personal_property']),
  v('repossession', 'turn_in_refusal', 'Turn-in refusal / lessor breach', 'Document dealer refusal to accept lease return.', ['Lease end refused'], ['UCC', 'Lease law'], 'Mitigation and storage damages.', ['lease_turn_in']),
  v('repossession', 'lease_trust_standing', 'Lease trust standing challenge', 'Challenge lease trust ownership (Ally pattern).', ['Lease trust plaintiff'], ['Assignment cases'], 'Trust must prove vehicle title.', ['lease_trust']),
  v('repossession', 'fdcpa_repo_collector', 'FDCPA — repo deficiency collector', 'Validation on deficiency collector.', ['Deficiency collector'], ['FDCPA'], 'Separate obligation proof.', ['deficiency']),
  v('repossession', 'credit_report_repo', 'FCRA dispute — wrongful repo reporting', 'Dispute repo balance reporting.', ['Repo on credit report'], ['FCRA § 611'], 'Inaccurate balance dispute.', ['reporting'], 'outline'),
  v('repossession', 'gps_breach_privacy', 'GPS / privacy violation outline', 'If repo used improper tracking.', ['Hidden GPS'], ['State privacy'], 'Document improper methods.', ['privacy']),
  v('repossession', 'military_repo_stay', 'SCRA repo/lease stay', 'Stay repo during active duty.', ['Active duty'], ['SCRA'], 'Military stay rights.', ['scra']),
  v('repossession', 'title_brand_demand', 'Title / salvage brand demand', 'Demand title history after sale.', ['Salvage sale'], ['State DMV law'], 'Title affects deficiency.', ['title']),
  v('repossession', 'surplus_funds_demand', 'Surplus funds demand', 'If sale exceeds debt, demand surplus.', ['Sale over debt'], ['UCC § 9-615'], 'Surplus owed to debtor.', ['surplus']),
];

const FORECLOSURE: DebtLetterCatalogEntry[] = [
  v('foreclosure', 'loss_mitigation_request', 'Loss mitigation / workout request', 'Request modification, forbearance, repayment plan.', ['Behind on mortgage'], ['RESPA', 'Investor guidelines'], 'Servicer must consider options.', ['foreclosure_notice']),
  v('foreclosure', 'qualified_written_request', 'RESPA QWR — loan history', 'Qualified written request for payment history.', ['Escrow errors'], ['12 U.S.C. § 2605'], 'Servicer must respond timely.', ['foreclosure'], 'outline'),
  v('foreclosure', 'cease_dual_track', 'Cease dual-tracking demand', 'Stop foreclosure while modification reviewed.', ['Mod pending', 'Foreclosure filed'], ['CFPB servicing rules'], 'Dual tracking prohibited.', ['dual_track']),
  v('foreclosure', 'answer_foreclosure', 'Foreclosure answer outline', 'Deny note/mortgage allegations; raise defenses.', ['Foreclosure complaint'], ['Civil procedure', 'UCC 3-308'], 'Prove lost note foundation.', ['foreclosure_suit']),
  v('foreclosure', 'standing_chain_mortgage', 'Mortgage assignment chain demand', 'Demand recorded assignments and endorsements.', ['MERS', 'Missing assignment'], ['UCC', 'Recording acts'], 'Chain must be complete.', ['standing']),
  v('foreclosure', 'note_possession_demand', 'Produce the note demand', 'Demand original promissory note.', ['Lost note affidavit'], ['UCC § 3-308'], 'Enforcement foundation.', ['note']),
  v('foreclosure', 'force_placed_insurance', 'Force-placed insurance dispute', 'Challenge inflated force-placed premiums.', ['FPI on escrow'], ['RESPA', 'TILA'], 'Servicer must have reasonable basis.', ['fpi']),
  v('foreclosure', 'escrow_analysis_dispute', 'Escrow analysis dispute', 'Challenge escrow shortage calculations.', ['Escrow increase'], ['RESPA § 10'], 'Proper accounting required.', ['escrow']),
  v('foreclosure', 'bankruptcy_stay_notice', 'Bankruptcy stay notice to counsel', 'Notify of automatic stay.', ['Ch 13 filed'], ['11 U.S.C. § 362'], 'Stay stops collection.', ['bankruptcy_stay']),
  v('foreclosure', 'scra_foreclosure_stay', 'SCRA foreclosure stay', 'Military stay of foreclosure.', ['Active duty'], ['SCRA'], 'Stay up to 9 months possible.', ['scra']),
  v('foreclosure', 'wrongful_acceleration', 'Wrongful acceleration dispute', 'Challenge default/acceleration notice defects.', ['Acceleration letter'], ['Mortgage contract'], 'Follow deed of trust terms.', ['acceleration']),
  v('foreclosure', 'hurricane_disaster_forbearance', 'Disaster forbearance request', 'Request disaster forbearance.', ['Natural disaster'], ['Fannie/Freddie guides'], 'Document hardship.', ['disaster']),
  v('foreclosure', 'mediation_request', 'Foreclosure mediation request', 'Request court/state mediation program.', ['Mediation available'], ['State foreclosure mediation'], 'Neutral workout forum.', ['mediation']),
  v('foreclosure', 'cfpb_servicer_complaint', 'CFPB servicer complaint cover', 'Cover letter for CFPB complaint.', ['Servicer errors'], ['CFPB'], 'Federal complaint record.', ['escalation']),
  v('foreclosure', 'post_foreclosure_fcr', 'Post-foreclosure FCRA dispute', 'Dispute credit reporting after foreclosure.', ['Foreclosure on report'], ['FCRA'], 'Accuracy and date disputes.', ['reporting'], 'outline'),
];

const NEGOTIATION: DebtLetterCatalogEntry[] = [
  v('negotiation', 'cease_contact', 'Cease & desist', 'Stop collector contact.', ['Harassment'], ['15 U.S.C. § 805(c)'], 'Limited contact after cease.', ['harassment'], 'full', 'cease_and_desist'),
  v('negotiation', 'time_barred_refusal', 'Time-barred debt refusal', 'Refuse to pay SOL-barred debt.', ['Zombie debt'], ['State SOL', 'FDCPA'], 'Do not revive debt.', ['time_barred'], 'full', 'time_barred_response'),
  v('negotiation', 'pay_for_delete', 'Pay-for-delete proposal', 'Offer payment for deletion.', ['Settlement'], ['FCRA'], 'Get deletion in writing first.', ['settlement']),
  v('negotiation', 'settlement_lump_sum', 'Lump-sum settlement offer', 'Offer reduced lump sum.', ['Cash available'], ['Contract'], 'No admission clause.', ['settlement']),
  v('negotiation', 'attorney_call_protocol', 'Attorney call protocol letter', 'Document no admissions on calls.', ['Collector calls'], ['FDCPA'], 'Do not admit on recorded lines.', ['calls']),
  v('negotiation', 'dispute_general', 'General debt dispute', 'Dispute accuracy to collector.', ['Reporting + collection'], ['FDCPA', 'FCRA'], 'Dispute in writing.', ['first_contact'], 'full', 'debt_dispute_letter'),
  v('negotiation', '1099_c_dispute', '1099-C dispute outline', 'Dispute cancellation of debt tax form.', ['1099-C received'], ['IRC', 'IRS'], 'Verify COD accuracy.', ['tax']),
  v('negotiation', 'wage_garnishment_exempt', 'Garnishment exemption notice', 'Claim exempt wages/benefits.', ['Garnishment'], ['State exemption'], 'Protect exempt income.', ['garnishment']),
  v('negotiation', 'bank_levy_exempt', 'Bank levy exemption', 'Claim exempt funds in account.', ['Levy'], ['State exemption'], 'Social security etc.', ['levy']),
  v('negotiation', 'mediation_request_debt', 'Debt mediation request', 'Neutral mediation before trial.', ['Pre-trial'], ['Court programs'], 'Structured negotiation.', ['mediation']),
];

const REPORTING: DebtLetterCatalogEntry[] = [
  v('reporting', 'bureau_direct_dispute', 'Direct bureau dispute', 'Dispute tradeline with bureau.', ['Credit report error'], ['FCRA § 611'], '30-day investigation.', ['bureau'], 'outline'),
  v('reporting', 'furnisher_direct', 'Direct furnisher dispute', 'Dispute to company reporting data.', ['Furnisher continues reporting'], ['FCRA § 623'], 'Furnisher must investigate.', ['furnisher']),
  v('reporting', 'method_of_verification', 'Method of verification demand', 'After bureau verification.', ['Verified without proof'], ['FCRA'], 'Demand MOFV.', ['bureau']),
  v('reporting', 'obsolete_tradeline', 'Obsolete reporting dispute', 'Item exceeds reporting period.', ['>7 years'], ['FCRA § 605'], 'Must delete obsolete.', ['obsolete']),
  v('reporting', 'identity_theft_block', 'Identity theft block request', 'Block fraudulent tradelines.', ['Fraud accounts'], ['FCRA § 605B'], 'Block upon police report.', ['identity_theft']),
];

/** Full catalog — 80+ entries */
export const DEBT_LETTER_CATALOG: DebtLetterCatalogEntry[] = [
  ...VALIDATION,
  ...COURT,
  ...SECURITIZATION,
  ...REPOSSESSION,
  ...FORECLOSURE,
  ...NEGOTIATION,
  ...REPORTING,
];

export function catalogForCategory(category: LetterCatalogCategory): DebtLetterCatalogEntry[] {
  return DEBT_LETTER_CATALOG.filter((e) => e.category === category);
}

export function catalogEntryById(id: string): DebtLetterCatalogEntry | undefined {
  return DEBT_LETTER_CATALOG.find((e) => e.id === id);
}

export function catalogCounts(): Record<LetterCatalogCategory, number> {
  const out = {} as Record<LetterCatalogCategory, number>;
  for (const e of DEBT_LETTER_CATALOG) {
    out[e.category] = (out[e.category] ?? 0) + 1;
  }
  return out;
}
