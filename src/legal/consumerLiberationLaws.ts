/**
 * Plain-language consumer protection & commercial law anchors.
 * Educational reference — verify citations in your jurisdiction. Not legal advice.
 */

export type LiberationLawAnchor = {
  id: string;
  cite: string;
  shortName: string;
  plainEnglish: string;
  consumerUse: string[];
  pairsWith: string[];
};

export const LIBERATION_LAW_ANCHORS: LiberationLawAnchor[] = [
  {
    id: 'fdcpa_809',
    cite: '15 U.S.C. § 1692g',
    shortName: 'FDCPA validation',
    plainEnglish: 'Within 30 days of first written contact, you can demand validation. Collectors must stop collection until they validate (with limited exceptions).',
    consumerUse: ['validation', 'debt_buyer', 'post_summons'],
    pairsWith: ['fdcpa_805', 'fcra_623', 'state_collection_act'],
  },
  {
    id: 'fdcpa_805',
    cite: '15 U.S.C. § 805(c)',
    shortName: 'Cease communication',
    plainEnglish: 'You can demand that a debt collector stop contacting you except for specific notices (e.g., lawsuit).',
    consumerUse: ['harassment', 'wrong_number', 'identity_theft'],
    pairsWith: ['fdcpa_809', 'fdcpa_1692e'],
  },
  {
    id: 'fdcpa_1692e',
    cite: '15 U.S.C. § 1692e',
    shortName: 'False/misleading collection',
    plainEnglish: 'Debt collectors cannot use false, deceptive, or misleading representations — including confusing creditor vs collector status.',
    consumerUse: ['mini_miranda_on_pleading', 'wrong_owner', 'securitization'],
    pairsWith: ['fdcpa_1692k', 'state_collection_act'],
  },
  {
    id: 'fdcpa_1692k',
    cite: '15 U.S.C. § 1692k',
    shortName: 'FDCPA damages',
    plainEnglish: 'Violations can yield actual damages, statutory damages up to $1,000 per action, attorney fees, and costs.',
    consumerUse: ['counterclaim', 'settlement_leverage'],
    pairsWith: ['fdcpa_1692e'],
  },
  {
    id: 'fcra_611',
    cite: '15 U.S.C. § 1681i',
    shortName: 'FCRA dispute investigation',
    plainEnglish: 'Bureaus must investigate disputes within 30 days (45 in some cases) and delete or correct unverifiable items.',
    consumerUse: ['bureau_dispute', 'post_bankruptcy', 'identity_theft'],
    pairsWith: ['fcra_623', 'fcra_605'],
  },
  {
    id: 'fcra_623',
    cite: '15 U.S.C. § 1681s-2',
    shortName: 'Furnisher accuracy duties',
    plainEnglish: 'Companies that report to bureaus must investigate disputes and report accurate, complete information.',
    consumerUse: ['furnisher_direct', 'validation_follow_up'],
    pairsWith: ['fcra_611'],
  },
  {
    id: 'fcra_605',
    cite: '15 U.S.C. § 1681c',
    shortName: 'Reporting time limits',
    plainEnglish: 'Most negative items age off after 7 years; bankruptcies up to 10 years; some events have shorter periods.',
    consumerUse: ['obsolete_reporting', 're-aging'],
    pairsWith: ['fcra_611'],
  },
  {
    id: 'tila_15usc',
    cite: '15 U.S.C. § 1638 et seq.',
    shortName: 'TILA disclosures',
    plainEnglish: 'Creditors must disclose key loan terms. Errors can support rescission or damages in some consumer credit contexts.',
    consumerUse: ['credit_card', 'auto_loan', 'mortgage'],
    pairsWith: ['tila_130', 'reg_z'],
  },
  {
    id: 'tila_130',
    cite: '15 U.S.C. § 1640',
    shortName: 'TILA remedies',
    plainEnglish: 'TILA violations may allow actual damages, statutory damages, attorney fees, and in some cases rescission rights.',
    consumerUse: ['undisclosed_fees', 'wrong_apr'],
    pairsWith: ['tila_15usc'],
  },
  {
    id: 'respa_6',
    cite: '12 U.S.C. § 2605',
    shortName: 'RESPA servicing',
    plainEnglish: 'Mortgage servicers must respond to qualified written requests about your loan within set deadlines and cannot impose unreasonable fees.',
    consumerUse: ['foreclosure', 'escrow', 'force_placed_insurance'],
    pairsWith: ['respa_10', 'cfpb_escalation'],
  },
  {
    id: 'respa_10',
    cite: '12 U.S.C. § 2609',
    shortName: 'Escrow accounting',
    plainEnglish: 'Servicers must properly account for escrow funds and provide annual statements.',
    consumerUse: ['foreclosure', 'payment_misapplication'],
    pairsWith: ['respa_6'],
  },
  {
    id: 'ucc_9_203',
    cite: 'UCC § 9-203 (adopted in most states)',
    shortName: 'Security interest attachment',
    plainEnglish: 'A lender must have a valid security agreement and value given to attach a security interest in your vehicle or goods.',
    consumerUse: ['repossession', 'deficiency'],
    pairsWith: ['ucc_9_609', 'ucc_9_610'],
  },
  {
    id: 'ucc_9_609',
    cite: 'UCC § 9-609',
    shortName: 'Repossession without judicial process',
    plainEnglish: 'After default, a secured party may repossess if it can do so without breach of peace — rules vary by state.',
    consumerUse: ['repossession', 'wrongful_repo'],
    pairsWith: ['ucc_9_610', 'ucc_9_623'],
  },
  {
    id: 'ucc_9_610',
    cite: 'UCC § 9-610',
    shortName: 'Commercially reasonable sale',
    plainEnglish: 'After repossession, sale/disposition must be commercially reasonable; you may have redemption and surplus rights.',
    consumerUse: ['deficiency_dispute', 'surplus_demand'],
    pairsWith: ['ucc_9_623', 'ucc_9_615'],
  },
  {
    id: 'ucc_9_623',
    cite: 'UCC § 9-623',
    shortName: 'Right to redeem',
    plainEnglish: 'Before disposition of collateral, you may redeem by paying the secured obligation plus reasonable expenses.',
    consumerUse: ['repossession', 'reinstatement'],
    pairsWith: ['ucc_9_610'],
  },
  {
    id: 'ucc_9_330',
    cite: 'UCC § 9-330',
    shortName: 'Priority of buyers',
    plainEnglish: 'Who holds superior rights in sold/assigned receivables depends on perfection and account-level identification.',
    consumerUse: ['securitization', 'debt_buyer_standing'],
    pairsWith: ['ucc_3_308', 'assignment_cases'],
  },
  {
    id: 'ucc_3_308',
    cite: 'UCC § 3-308',
    shortName: 'Enforcement of lost instrument',
    plainEnglish: 'Plaintiff suing on a negotiable instrument must prove entitlement to enforce when the original note is lost.',
    consumerUse: ['mortgage_foreclosure', 'promissory_note'],
    pairsWith: ['best_evidence'],
  },
  {
    id: 'scra',
    cite: '50 U.S.C. § 3931 et seq.',
    shortName: 'SCRA protections',
    plainEnglish: 'Active-duty servicemembers may stay foreclosure, reduce interest rates, and challenge default judgments.',
    consumerUse: ['foreclosure', 'repossession', 'default_judgment'],
    pairsWith: ['foreclosure_stay'],
  },
  {
    id: 'cfpb_escalation',
    cite: 'CFPB complaint process',
    shortName: 'CFPB complaint',
    plainEnglish: 'Federal consumer complaint portal puts servicers/collectors on record and often triggers internal review.',
    consumerUse: ['foreclosure', 'servicing', 'collection'],
    pairsWith: ['respa_6', 'state_ag'],
  },
  {
    id: 'state_collection_act',
    cite: 'State collection practices act (e.g. RMCPA Mich.)',
    shortName: 'State collection law',
    plainEnglish: 'Many states mirror or strengthen FDCPA — deceptive pleadings, false affidavits, and mislabeled creditor status may violate state law.',
    consumerUse: ['counterclaim', 'state_court'],
    pairsWith: ['fdcpa_1692e'],
  },
  {
    id: 'state_sol',
    cite: 'State statute of limitations',
    shortName: 'Time-barred debt',
    plainEnglish: 'Suit or revival after the limitations period may be barred; acknowledging debt or partial payment may reset clocks in some states.',
    consumerUse: ['time_barred', 'zombie_debt'],
    pairsWith: ['fdcpa_809'],
  },
  {
    id: 'assignment_cases',
    cite: 'Assignment / standing case law',
    shortName: 'Account-level assignment',
    plainEnglish: 'Pool bills of sale without account-level schedules often fail to prove the plaintiff owns your specific debt.',
    consumerUse: ['debt_buyer', 'securitization', 'standing'],
    pairsWith: ['ucc_9_330', 'best_evidence'],
  },
  {
    id: 'best_evidence',
    cite: 'Best evidence / business records rules',
    shortName: 'Prove the contract',
    plainEnglish: 'Suing on an agreement usually requires the agreement or admissible foundation — not a balance printout alone.',
    consumerUse: ['account_stated', 'breach_of_contract'],
    pairsWith: ['assignment_cases'],
  },
];

export function lawsForCategories(categories: string[]): LiberationLawAnchor[] {
  const set = new Set(categories);
  return LIBERATION_LAW_ANCHORS.filter((l) => l.consumerUse.some((u) => set.has(u)));
}
