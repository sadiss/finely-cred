/**
 * Per-negative dispute reason → governing law citations.
 * Powers Letter Studio, dispute guide, and co-owner dispute law engine.
 */

export type DisputeLawBasis = {
  statutes: string[];
  principle: string;
  challengeAngle: string;
  neverDefaultTo: string[];
};

export const DISPUTE_REASON_LAW_MAP: Record<string, DisputeLawBasis> = {
  charge_off: {
    statutes: ['15 U.S.C. § 1681s-2(a)(1)(A)', '15 U.S.C. § 1681i(a)(1)(A)', 'Metro2 Field 17 Account Status'],
    principle: 'Charge-off status must be accurate and consistent with payment grid, DOFD, and balance fields.',
    challengeAngle: 'Internal Metro2 contradiction — not payment. Demand method of verification before any pay-for-delete conversation.',
    neverDefaultTo: ['settlement', 'pay for delete as first step', 'acknowledging debt owed without validation'],
  },
  collection: {
    statutes: ['15 U.S.C. § 1692g', '15 U.S.C. § 1681s-2', 'State debt collection licensing statutes'],
    principle: 'Collector must validate debt and prove chain of assignment before continuing collection.',
    challengeAngle: 'FDCPA §809 validation — cease collection activity until verification provided. Verify collector licensed in consumer state.',
    neverDefaultTo: ['payment without written validation', 'verbal promises', 'settlement before validation response'],
  },
  late_payment: {
    statutes: ['15 U.S.C. § 1681s-2(a)(1)(A)', 'Metro2 Payment History Profile'],
    principle: 'Late codes must match account status and reported dates.',
    challengeAngle: 'Grid shows late months while status claims current — inaccurate/incomplete reporting.',
    neverDefaultTo: ['paying to "fix" reporting without dispute'],
  },
  inquiry: {
    statutes: ['15 U.S.C. § 1681b', '15 U.S.C. § 1681i(a)(1)(A)'],
    principle: 'Inquiry requires permissible purpose; consumer may dispute unrecognized pulls.',
    challengeAngle: 'No recall of authorizing inquiry — demand permissible purpose documentation or deletion.',
    neverDefaultTo: [],
  },
  foreclosure: {
    statutes: ['State foreclosure procedure', 'TILA § 1639g', 'Bankruptcy Code Ch. 13 stay (if filed)'],
    principle: 'Foreclosure requires proper notice, right to cure where applicable, and accurate credit reporting post-sale.',
    challengeAngle: 'Challenge reporting inconsistencies; evaluate Ch. 13 vs Ch. 7 with licensed counsel for stay and lien treatment.',
    neverDefaultTo: ['ignoring summons', 'paying without chain-of-title review'],
  },
  repossession: {
    statutes: ['UCC Article 9', 'State repossession notice requirements', '15 U.S.C. § 1681s-2'],
    principle: 'Deficiency balances must be accurate; secured party must prove default and proper disposition.',
    challengeAngle: 'Demand accounting of sale proceeds and challenge inflated deficiency reporting.',
    neverDefaultTo: ['paying deficiency without validation'],
  },
  bankruptcy: {
    statutes: ['11 U.S.C. § 524', '15 U.S.C. § 1681c(a)(1)'],
    principle: 'Post-discharge reporting must reflect discharged status; included debts cannot report as active collections.',
    challengeAngle: 'Dispute post-discharge balances and re-aged dates — accuracy, not emotional deletion.',
    neverDefaultTo: ['disputing legitimately included debts as "not mine"'],
  },
  student_loan: {
    statutes: ['15 U.S.C. § 1681s-2', 'Higher Education Act servicing rules', 'Metro2 status/deferment codes'],
    principle: 'Servicer transfer duplicates and payment amount fields must be accurate for DTI.',
    challengeAngle: 'Field-level dispute on payment amount, status during deferment, duplicate tradelines.',
    neverDefaultTo: [],
  },
  tax_lien: {
    statutes: ['15 U.S.C. § 1681c(a)(3)', 'IRS lien release procedures'],
    principle: 'Paid liens must update; stale liens beyond reporting period must delete.',
    challengeAngle: 'Date and status accuracy; demand release documentation.',
    neverDefaultTo: [],
  },
  medical_collection: {
    statutes: ['No Surprises Act', '15 U.S.C. § 1692g', 'State balance billing laws'],
    principle: 'Medical debt validation requires itemized bills and assignment chain.',
    challengeAngle: 'Validation first — challenge unitemized medical collections.',
    neverDefaultTo: ['settlement before validation'],
  },
  reaging: {
    statutes: ['15 U.S.C. § 1681c(a)(4)', 'Metro2 Date of First Delinquency'],
    principle: 'DOFD anchors 7-year reporting; re-aging violates FCRA accuracy.',
    challengeAngle: 'DOFD newer than original delinquency without documented default event.',
    neverDefaultTo: [],
  },
  duplicate_tradeline: {
    statutes: ['15 U.S.C. § 1681i(a)(5)(A)', '15 U.S.C. § 1681s-2'],
    principle: 'Same debt must not report twice across original and collector without proper status.',
    challengeAngle: 'Delete duplicate; one claim per duplicate tradeline per bureau.',
    neverDefaultTo: [],
  },
};

export function getDisputeLawBasis(negativeType: string): DisputeLawBasis | undefined {
  const key = negativeType.toLowerCase().replace(/\s+/g, '_');
  return DISPUTE_REASON_LAW_MAP[key];
}

export function buildLawCitationBlock(negativeType: string): string {
  const basis = getDisputeLawBasis(negativeType);
  if (!basis) return '';
  return [
    'Applicable legal framework (educational reference — not legal advice):',
    ...basis.statutes.map((s) => `• ${s}`),
    `Principle: ${basis.principle}`,
    `Challenge angle: ${basis.challengeAngle}`,
    basis.neverDefaultTo.length ? `We do not default to: ${basis.neverDefaultTo.join('; ')}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
