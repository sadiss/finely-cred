/**
 * Legal grounds for disputing / correcting / removing bankruptcy-related credit reporting.
 * Court-clerk inquiry method: supportive evidence, not standalone deletion authority.
 */

export type BankruptcyRemovalGround = {
  id: string;
  title: string;
  statutes: string[];
  whenItApplies: string;
  bureauArgument: string;
  evidenceNeeded: string[];
  strength: 'strong' | 'moderate' | 'supporting_only';
};

export const COURT_INQUIRY_METHOD_ASSESSMENT = {
  summary:
    'Contacting the bankruptcy court clerk to ask whether the court furnishes data to credit bureaus is a useful **documentation step**, but it is usually **not sufficient alone** to force removal of a legitimate bankruptcy public record.',
  whyNotAlone: [
    'Federal bankruptcy courts generally do not directly furnish consumer reports to Equifax, Experian, or TransUnion.',
    'Public record data is typically obtained by bureaus through court record vendors (e.g., PACER-based aggregators) under programs like the Bankruptcy Notice and Electronic Claims Filing program.',
    'A clerk response that the court does not furnish data does not prove the bankruptcy is unreportable — only that the court is not the furnisher.',
    'Legitimate Chapter 7/13 filings are generally reportable public records for the FCRA reporting period.',
  ],
  howToStrengthen: [
    'Obtain certified docket, petition, and discharge/dismissal orders from the clerk.',
    'Dispute under FCRA § 611 with specific field-level inaccuracies (dates, chapter, case number, disposition).',
    'If tradelines: dispute under FCRA § 623 / § 1681s-2 with discharge order showing included accounts.',
    'Attach clerk letter as exhibit showing your diligence — not as sole proof of non-reportability.',
    'Escalate to CFPB if bureau reinvestigation is unreasonable under § 611(a)(6)(B)(iii).',
  ],
};

export const BANKRUPTCY_REMOVAL_GROUNDS: BankruptcyRemovalGround[] = [
  {
    id: 'not_my_bk',
    title: 'Bankruptcy does not belong to me (mixed file / identity)',
    statutes: ['15 U.S.C. § 1681i(a)(5)(A)', '15 U.S.C. § 1681e(b)'],
    whenItApplies: 'Another person’s case, wrong SSN fragment, or merged file.',
    bureauArgument:
      'Delete or correct — bureau failed maximum possible accuracy. Reinvestigation must verify association to my identity.',
    evidenceNeeded: ['Government ID', 'SSN verification', 'Affidavit of identity', 'Clerk search showing no case in my name'],
    strength: 'strong',
  },
  {
    id: 'wrong_dates_chapter',
    title: 'Incorrect filing date, disposition date, or chapter',
    statutes: ['15 U.S.C. § 1681i(a)(1)(A)', '15 U.S.C. § 1681s-2(a)(1)(A)', 'Metro 2 public record fields'],
    whenItApplies: 'Bureau shows wrong chapter, year, or status vs certified docket.',
    bureauArgument: 'Correct to match court record or delete if cannot verify after reasonable reinvestigation.',
    evidenceNeeded: ['Certified docket', 'Petition first page', 'Discharge or dismissal order'],
    strength: 'strong',
  },
  {
    id: 'dismissed_not_discharged',
    title: 'Dismissed case reported as discharged — or vice versa',
    statutes: ['15 U.S.C. § 1681i(a)(5)(A)', '15 U.S.C. § 1681e(b)'],
    whenItApplies: 'Disposition code or narrative contradicts court disposition.',
    bureauArgument: 'Update disposition accurately; misleading status violates accuracy standard.',
    evidenceNeeded: ['Dismissal order', 'Docket sheet', 'Certified clerk copy'],
    strength: 'strong',
  },
  {
    id: 'reporting_period_expired',
    title: 'Public record beyond allowable reporting period',
    statutes: ['15 U.S.C. § 1681c(a)(1)', 'FTC Commentary on FCRA'],
    whenItApplies:
      'Chapter 7 bankruptcy public record: generally 10 years from filing date. Chapter 13: 7 years from filing (verify current CRA policy and Metro 2).',
    bureauArgument: 'Obsolescent public record — must be deleted per § 1681c(a)(1).',
    evidenceNeeded: ['Petition date from docket', 'Bureau report showing reporting date'],
    strength: 'strong',
  },
  {
    id: 'post_discharge_balance',
    title: 'Discharged included debt still shows balance or collecting',
    statutes: ['11 U.S.C. § 524', '15 U.S.C. § 1681s-2(a)(1)(A)', '15 U.S.C. § 1681i(a)(5)(A)'],
    whenItApplies: 'Account included in bankruptcy still reports balance, past due, or collection status.',
    bureauArgument:
      'Correct to zero balance and appropriate bankruptcy compliance/status codes — or delete if furnisher cannot verify.',
    evidenceNeeded: ['Discharge order', 'Schedule D/E/F showing inclusion', 'Bureau tradeline screenshot'],
    strength: 'strong',
  },
  {
    id: 'not_included_tradeline',
    title: 'Tradeline marked included in BK but no bankruptcy on file',
    statutes: ['15 U.S.C. § 1681s-2(a)(1)(A)', '15 U.S.C. § 1681i(a)(1)(A)'],
    whenItApplies: 'Furnisher coded account as included in bankruptcy when no petition exists.',
    bureauArgument: 'Remove inaccurate bankruptcy remark and correct status — no permissible basis.',
    evidenceNeeded: ['Credit report', 'Clerk letter or search showing no case', 'Account statements'],
    strength: 'strong',
  },
  {
    id: 'duplicate_public_record',
    title: 'Duplicate bankruptcy public records',
    statutes: ['15 U.S.C. § 1681i(a)(5)(A)', '15 U.S.C. § 1681e(b)'],
    whenItApplies: 'Same case reported twice with different identifiers.',
    bureauArgument: 'Delete duplicate — one accurate entry only.',
    evidenceNeeded: ['Both bureau entries', 'Single certified docket'],
    strength: 'moderate',
  },
  {
    id: 'unverifiable_after_dispute',
    title: 'Unverifiable after reasonable reinvestigation',
    statutes: ['15 U.S.C. § 1681i(a)(5)(A)', '15 U.S.C. § 611(a)(6)(B)(iii)'],
    whenItApplies: 'Bureau cannot verify with court vendor after your dispute.',
    bureauArgument: 'Must delete — cannot verify accuracy.',
    evidenceNeeded: ['Dispute letter', 'Bureau response', 'Clerk certified copies'],
    strength: 'moderate',
  },
  {
    id: 'clerk_no_furnish',
    title: 'Clerk confirms court does not furnish (supporting only)',
    statutes: ['15 U.S.C. § 1681i(a)(1)(A)'],
    whenItApplies: 'Used with other grounds — not standalone for legitimate cases.',
    bureauArgument:
      'Supporting exhibit: bureau must independently verify through its vendor; if verification fails, delete.',
    evidenceNeeded: ['Clerk written response', 'Your § 611 dispute'],
    strength: 'supporting_only',
  },
];

export const BANKRUPTCY_WORKFLOW_STEPS = [
  { step: 1, title: 'Pull all three bureaus', detail: 'Identify public record block + affected tradelines.' },
  { step: 2, title: 'Order certified docket', detail: 'Petition, schedules, discharge/dismissal — from clerk or PACER with certification.' },
  { step: 3, title: 'Court furnishing inquiry (optional)', detail: 'Written clerk letter — attach response to bureau dispute.' },
  { step: 4, title: 'File FCRA § 611 dispute', detail: 'Use field-specific inaccuracies + statutory removal grounds — not emotional requests.' },
  { step: 5, title: 'Direct furnisher dispute § 623', detail: 'For tradelines — copy discharge order; demand Metro 2 compliance codes.' },
  { step: 6, title: 'CFPB / AG if verified incorrectly', detail: 'If bureau reaffirms without method-of-verification.' },
];
