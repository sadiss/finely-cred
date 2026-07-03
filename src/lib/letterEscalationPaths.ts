/** Actionable complaint / escalation ladders when collectors or bureaus fail to comply. */

export type EscalationTrack = 'debt_validation' | 'debt_court' | 'bureau_dispute';

export type EscalationStep = {
  level: number;
  title: string;
  subtitle: string;
  when: string;
  actions: string[];
  escalateTo: string;
  externalUrl?: string;
  timing?: string;
  evidenceChecklist: string[];
};

export const DEBT_VALIDATION_ESCALATION: EscalationStep[] = [
  {
    level: 1,
    title: 'Round 1 — FDCPA validation demand',
    subtitle: 'Force proof before they collect',
    when: 'Within 30 days of the collector’s first written contact (or immediately if already collecting).',
    actions: [
      'Send your Debt Validation Request via certified mail with return receipt.',
      'Save the mailing receipt, tracking, and a PDF copy in Letters Vault.',
      'Do not admit the debt, promise payment, or negotiate until validation is complete.',
    ],
    escalateTo: 'Collector / debt buyer (CMRR)',
    timing: 'Day 0',
    evidenceChecklist: ['Certified mail receipt', 'Letter PDF', 'Collector’s first contact letter/screenshot'],
  },
  {
    level: 2,
    title: 'Round 2 — Deficiency notice',
    subtitle: 'Call out incomplete validation',
    when: 'They respond with a statement, generic bill of sale, or partial packet but skip licensing, ledger, chain of title, or authority.',
    actions: [
      'Send Round 2 Validation Deficiency listing every unanswered item.',
      'Demand they cease collection and credit reporting until deficiencies are cured.',
      'Attach your Round 1 letter and their inadequate response.',
    ],
    escalateTo: 'Collector + copy to compliance department',
    timing: 'Day 15–30 after Round 1',
    evidenceChecklist: ['Their validation response', 'Round 1 proof of mailing', 'Account screenshots'],
  },
  {
    level: 3,
    title: 'Round 3 — Final demand + reporting challenge',
    subtitle: 'Last written chance before regulators',
    when: 'They keep collecting, reporting, or threatening suit without full account-level proof.',
    actions: [
      'Send Final Validation Demand documenting each unresolved deficiency.',
      'Dispute furnisher reporting directly with the bureau if the account is on your credit report.',
      'Calendar your state SOL and licensing research for your jurisdiction.',
    ],
    escalateTo: 'Collector + bureau furnisher dispute (if reporting)',
    timing: 'Day 30–45 after Round 2',
    evidenceChecklist: ['Full letter chain', 'Credit report tradeline screenshot', 'Call log if harassing contact'],
  },
  {
    level: 4,
    title: 'CFPB consumer complaint',
    subtitle: 'Federal regulator — debt collection & credit reporting',
    when: 'Collector continues after your written validation chain, misreports, or refuses licensing/accounting proof.',
    actions: [
      'File at consumerfinance.gov/complaint — attach your letter chain PDFs.',
      'Select “Debt collection” and/or “Credit reporting” depending on what failed.',
      'Quote FDCPA § 1692g and FCRA § 1681s-2 in your narrative.',
    ],
    escalateTo: 'Consumer Financial Protection Bureau (CFPB)',
    externalUrl: 'https://www.consumerfinance.gov/complaint/',
    timing: 'After Round 3 or urgent harassment',
    evidenceChecklist: ['All validation letters', 'CMRR receipts', 'Collector communications', 'Credit report proof'],
  },
  {
    level: 5,
    title: 'State Attorney General + licensing board',
    subtitle: 'State-level enforcement & collection license',
    when: 'Collector is unlicensed in your state, uses deceptive practices, or ignores your written disputes.',
    actions: [
      'File with your state Attorney General consumer protection division.',
      'If your state requires debt collection licensing, file with the state financial regulator / DFI.',
      'Include license demand responses (or lack thereof) from your validation letters.',
    ],
    escalateTo: 'State AG + state collection licensing authority',
    timing: 'Parallel with or after CFPB',
    evidenceChecklist: ['State license search screenshot', 'Validation letter chain', 'Harassment log'],
  },
  {
    level: 6,
    title: 'FTC + attorney consult',
    subtitle: 'Maximum pressure & litigation readiness',
    when: 'Pattern of FDCPA violations, false reporting, identity issues, or active lawsuit threat.',
    actions: [
      'Report to reportfraud.ftc.gov for fraud/imposter collectors.',
      'Consult a consumer attorney (many FDCPA cases offer fee-shifting).',
      'If sued, calendar answer deadline and use affidavit / court defense path immediately.',
    ],
    escalateTo: 'FTC + licensed consumer attorney',
    externalUrl: 'https://reportfraud.ftc.gov/',
    timing: 'Urgent if sued or identity theft involved',
    evidenceChecklist: ['Summons (if any)', 'Complete evidence vault', 'Damages log (calls, stress, incorrect reporting)'],
  },
];

export const BUREAU_DISPUTE_ESCALATION: EscalationStep[] = [
  {
    level: 1,
    title: 'Round 1 — Bureau dispute letter',
    subtitle: 'Formal investigation request',
    when: 'Inaccurate, incomplete, or unverifiable tradeline on your report.',
    actions: [
      'Send dispute to the bureau that is reporting the error (Experian, Equifax, or TransUnion).',
      'Use certified mail or bureau online dispute — keep proof either way.',
      'Attach evidence screenshots that contradict the reporting.',
    ],
    escalateTo: 'Credit bureau dispute address',
    timing: 'Day 0',
    evidenceChecklist: ['Dispute letter PDF', 'Mailing proof', 'Report screenshot', 'Supporting evidence'],
  },
  {
    level: 2,
    title: 'Direct furnisher dispute (FCRA § 623)',
    subtitle: 'Hit the company that reported it',
    when: 'Bureau “verified” without real proof, or you know the furnisher/collector identity.',
    actions: [
      'Send a furnisher dispute to the creditor/collector demanding substantiation.',
      'Reference your bureau dispute date and case/reference number if you have one.',
      'Request deletion if they cannot produce account-level records.',
    ],
    escalateTo: 'Furnisher / original creditor / collector',
    timing: 'Day 15–30 or after weak bureau response',
    evidenceChecklist: ['Bureau response letter', 'Furnisher address', 'Account evidence'],
  },
  {
    level: 3,
    title: 'Round 2 — Escalated bureau reinvestigation',
    subtitle: 'Challenge superficial verification',
    when: 'Bureau replies “verified” based only on furnisher checkbox verification.',
    actions: [
      'Send Round 2 letter challenging the investigation quality under FCRA § 611.',
      'List specific factual errors and demand procedure description.',
      'Request the method of verification and furnisher contact details used.',
    ],
    escalateTo: 'Same bureau + CMRR',
    timing: 'Within 15 days of weak bureau result',
    evidenceChecklist: ['Bureau investigation result', 'Round 1 proof', 'New contradictory evidence'],
  },
  {
    level: 4,
    title: 'CFPB credit reporting complaint',
    subtitle: 'Federal oversight of bureaus & furnishers',
    when: 'Bureau fails to correct clearly inaccurate reporting after your dispute chain.',
    actions: [
      'File CFPB complaint naming the bureau and furnisher.',
      'Attach dispute letters, bureau responses, and credit report screenshots.',
      'Request deletion or correction with specific factual basis.',
    ],
    escalateTo: 'CFPB',
    externalUrl: 'https://www.consumerfinance.gov/complaint/',
    timing: 'After Round 2 bureau dispute',
    evidenceChecklist: ['Full dispute chain', 'Credit reports from all 3 bureaus if needed'],
  },
  {
    level: 5,
    title: 'State AG + CFPB follow-up',
    subtitle: 'State consumer protection pressure',
    when: 'Repeated inaccurate reporting harms funding, housing, or employment.',
    actions: [
      'File with your state Attorney General consumer division.',
      'Reference CFPB complaint number if already filed.',
      'Document financial harm (denied applications, higher rates) factually without exaggeration.',
    ],
    escalateTo: 'State Attorney General',
    timing: 'Parallel with CFPB',
    evidenceChecklist: ['Harm documentation', 'Complete dispute record', 'CFPB reference #'],
  },
  {
    level: 6,
    title: 'Attorney review / civil remedies',
    subtitle: 'FCRA private right of action',
    when: 'Willful or negligent noncompliance after ample written notice.',
    actions: [
      'Consult FCRA/FDCPA counsel about statutory damages and fee-shifting.',
      'Preserve complete mail tracking and bureau correspondence.',
      'Do not restart verbal negotiations that reset your paper trail.',
    ],
    escalateTo: 'Consumer protection attorney',
    timing: 'When regulatory path stalls or harm is substantial',
    evidenceChecklist: ['Complete vault export', 'Timeline of disputes', 'Damages evidence'],
  },
];

export const DEBT_COURT_ESCALATION: EscalationStep[] = [
  {
    level: 1,
    title: 'Calendar answer deadline',
    subtitle: 'Never miss court dates',
    when: 'Immediately after being served with summons/complaint.',
    actions: [
      'Record date served and calculate answer deadline (often 20–35 days depending on state).',
      'File answer or motion before deadline — default judgment is the biggest risk.',
      'Use affidavit path to document defenses and validation failures.',
    ],
    escalateTo: 'State civil court (your case)',
    timing: 'Day 1 after service',
    evidenceChecklist: ['Summons', 'Complaint', 'Date served proof'],
  },
  {
    level: 2,
    title: 'Answer + affirmative defenses',
    subtitle: 'Put them to proof in court',
    when: 'Before answer deadline expires.',
    actions: [
      'File Answer denying liability and asserting SOL, standing, contract formation, and validation failures.',
      'Attach Affidavit of Dispute / summons response affidavit from Letters Vault.',
      'Request discovery: contract, ledger, assignment chain, witness with personal knowledge.',
    ],
    escalateTo: 'Court clerk + plaintiff attorney',
    timing: 'Before answer deadline',
    evidenceChecklist: ['Filed answer stamp', 'Affidavit PDF', 'Validation letter chain'],
  },
  {
    level: 3,
    title: 'CFPB + state AG (parallel)',
    subtitle: 'Regulatory pressure while litigating',
    when: 'Plaintiff is debt buyer/collector with reporting or collection violations.',
    actions: [
      'File CFPB complaint for collection/reporting misconduct.',
      'File state AG complaint if unlicensed collector or deceptive court filings.',
      'Keep regulatory filings separate from court filings — do not confuse the forums.',
    ],
    escalateTo: 'CFPB + State AG',
    externalUrl: 'https://www.consumerfinance.gov/complaint/',
    timing: 'Any time during litigation',
    evidenceChecklist: ['Court filings', 'Validation failures', 'Reporting screenshots'],
  },
  {
    level: 4,
    title: 'Consumer attorney / legal aid',
    subtitle: 'Professional defense',
    when: 'High balance, wage garnishment risk, or complex ownership/assignment issues.',
    actions: [
      'Consult attorney before default or before agreeing to stipulated judgment.',
      'Bring complete Finely evidence vault and validation history.',
      'Ask about counterclaims for FDCPA/FCRA violations where supported.',
    ],
    escalateTo: 'Licensed attorney in your jurisdiction',
    timing: 'As early as possible after service',
    evidenceChecklist: ['All court papers', 'Evidence vault', 'Validation chain'],
  },
];

export function escalationStepsForTrack(track: EscalationTrack): EscalationStep[] {
  if (track === 'bureau_dispute') return BUREAU_DISPUTE_ESCALATION;
  if (track === 'debt_court') return DEBT_COURT_ESCALATION;
  return DEBT_VALIDATION_ESCALATION;
}
