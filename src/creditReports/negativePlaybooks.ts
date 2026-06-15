import type { DisputeCandidate } from '../domain/creditReports';
import type { TaskKind, TaskPriority, TaskStage } from '../domain/tasks';

export type NegativeType =
  | 'bankruptcy'
  | 'repossession'
  | 'foreclosure'
  | 'student_loan'
  | 'inquiry'
  | 'collection'
  | 'charge_off'
  | 'public_record'
  | 'identity_theft'
  | 'personal_info'
  | 'unknown';

export type PlaybookTaskTemplate = {
  title: string;
  kind: TaskKind;
  stage: TaskStage;
  priority?: TaskPriority;
  assignedTo?: 'partner' | 'admin' | 'both';
  /** Optional “how to execute” notes shown in task details. */
  notes?: string;
  /** Optional tags used for dedupe / tracking. */
  tags?: string[];
};

export type NegativePlaybook = {
  key: NegativeType;
  label: string;
  /** Guidance to steer AI drafting (high-level, not legal advice). */
  aiHint: string;
  /** Optional clause snippets (copy/paste inserts) for narratives. */
  clauses?: string[];
  /** Default next actions to attach to a case (trackers). */
  tasks: PlaybookTaskTemplate[];
};

function norm(s: string) {
  return String(s || '').toLowerCase();
}

export function classifyCandidateNegativeType(c: DisputeCandidate): NegativeType {
  const t = norm(c.type);
  const a = norm(c.account);
  const code = norm(c.code);
  const joined = `${t} ${a} ${code}`.trim();

  if (/(bankruptcy|bk\b|chapter\s*7|chapter\s*11|chapter\s*13)/i.test(joined)) return 'bankruptcy';
  if (/(repo|repossession|re-?possession|voluntary\s*surrender|surrender)/i.test(joined)) return 'repossession';
  if (/(foreclosure|fc\b|mortgage\s*foreclosure|sheriff\s*sale)/i.test(joined)) return 'foreclosure';
  if (/(student\s*loan|edfinancial|nelnet|navient|mohela|aidvantage)/i.test(joined)) return 'student_loan';
  if (/(inquiry|hard\s*inquiry|hard\s*pull)/i.test(joined)) return 'inquiry';
  if (/(identity\s*theft|fraud|not\s*mine|imposter)/i.test(joined)) return 'identity_theft';
  if (/(public\s*record|judgment|lien|tax\s*lien|eviction)/i.test(joined)) return 'public_record';
  if (/(personal\s*info|name|address|ssn|dob|employer)/i.test(joined)) return 'personal_info';
  if (/(charge\s*off|charged\s*off|co\b)/i.test(joined)) return 'charge_off';
  if (/(collection|collections|collector|debt\s*collector|past\s*due)/i.test(joined)) return 'collection';

  return 'unknown';
}

export const NEGATIVE_PLAYBOOKS: Record<NegativeType, NegativePlaybook> = {
  bankruptcy: {
    key: 'bankruptcy',
    label: 'Bankruptcy verification',
    aiHint:
      'Bankruptcy items: focus on case identifier, chapter, filing date, and disposition as shown on the file versus any court record the partner has. Narratives should state what the bureau reports, not command verification.',
    clauses: [
      'As you can see here on the bureau report, the bankruptcy public-record entry lists case details (chapter, filing date, or disposition) that do not match the court docket I have for this case.',
      'Tradelines linked to this bankruptcy still show balance or delinquency fields inconsistent with a discharged or included account on the same report.',
    ],
    tasks: [
      {
        title: 'Bankruptcy: verify docket details (case number, chapter, dates)',
        kind: 'review_results',
        stage: 'disputes',
        priority: 'high',
        notes:
          'Confirm any available docket/case metadata. If the report item lacks key facts, capture that gap as a question and request method-of-verification in the dispute letter.',
      },
      {
        title: 'Bankruptcy: request furnisher verification details (method of verification)',
        kind: 'follow_up',
        stage: 'disputes',
        priority: 'normal',
        notes: 'Track and upload bureau/furnisher responses. Escalate if verification details are not provided.',
      },
    ],
  },
  repossession: {
    key: 'repossession',
    label: 'Repossession accounting',
    aiHint:
      'Repossession items: state reported disposition dates, balance, and status as shown on the tradeline and contrast with sale/accounting records when available.',
    clauses: [
      'This account is reporting repossession-related status and a balance that does not match the disposition and sale accounting in my records.',
      'The date of first delinquency and closed date on this repossession tradeline conflict with the timeline on my servicer notices.',
    ],
    tasks: [
      {
        title: 'Repo: request disposition + accounting details (sale date/amount, deficiency)',
        kind: 'upload_document',
        stage: 'disputes',
        priority: 'high',
        notes:
          'Gather/ask for: sale/disposition notice, itemized accounting, auction/sale proof, and any deficiency calculation support. Upload anything received to Documents Vault.',
      },
      {
        title: 'Repo: verify reported balance/dates match documentation',
        kind: 'review_results',
        stage: 'disputes',
        priority: 'normal',
      },
    ],
  },
  foreclosure: {
    key: 'foreclosure',
    label: 'Foreclosure verification',
    aiHint:
      'Foreclosure items: cite the exact status, dates, and balance fields reporting on the file and any mismatch with servicer or court records.',
    clauses: [
      'The foreclosure status and timeline reported for this mortgage tradeline do not match my loan servicer records for the same account.',
      'As you can see here on the bureau report, balance and past-due fields still report on this account after the foreclosure disposition date shown.',
    ],
    tasks: [
      {
        title: 'Foreclosure: verify timeline (default, sale, reinstatement/modification if any)',
        kind: 'review_results',
        stage: 'disputes',
        priority: 'high',
      },
      {
        title: 'Foreclosure: collect/attach key docs (notices, statements, filings)',
        kind: 'upload_document',
        stage: 'disputes',
        priority: 'normal',
      },
    ],
  },
  student_loan: {
    key: 'student_loan',
    label: 'Student loan servicing accuracy',
    aiHint:
      'Student loans: note servicer name, status, and balance as reported; flag transfer or rehabilitation coding that conflicts with statements.',
    clauses: [
      'The student-loan tradeline reports a servicer, balance, or status that does not match my current loan statements after a servicer transfer.',
      'Payment-history codes show delinquency on months where my bank records show on-time payments to the listed servicer.',
    ],
    tasks: [
      { title: 'Student loan: confirm servicer/owner and reporting continuity', kind: 'review_results', stage: 'disputes', priority: 'high' },
      { title: 'Student loan: attach statements / transfer notices if available', kind: 'upload_document', stage: 'disputes', priority: 'normal' },
    ],
  },
  inquiry: {
    key: 'inquiry',
    label: 'Inquiry permissible purpose',
    aiHint:
      'Inquiry disputes: state creditor name, inquiry date, and that no application or transaction was initiated — factual, not accusatory.',
    clauses: [
      'As you can see here on the bureau report, a hard inquiry from this creditor on the date shown does not correspond to any credit application or transaction I initiated.',
      'This inquiry appears without a matching new account or permissible purpose evident from my records for that date.',
    ],
    tasks: [
      {
        title: 'Inquiry: list which inquiries are unauthorized (by date/creditor)',
        kind: 'review_results',
        stage: 'disputes',
        priority: 'high',
      },
      {
        title: 'Inquiry: request permissible purpose verification documentation',
        kind: 'follow_up',
        stage: 'disputes',
        priority: 'normal',
      },
    ],
  },
  collection: {
    key: 'collection',
    label: 'Collection verification',
    aiHint:
      'Collections: describe how the account is characterized (collector, balance, DOFD) and why it does not match validated statements or ownership records.',
    tasks: [
      { title: 'Collection: verify furnisher/collector reporting fields (dates/balance/status)', kind: 'review_results', stage: 'disputes', priority: 'normal' },
    ],
  },
  charge_off: {
    key: 'charge_off',
    label: 'Charge-off accuracy',
    aiHint:
      'Charge-offs: point to status line, charged-off balance, and payment grid contradictions on the same tradeline.',
    tasks: [
      { title: 'Charge-off: verify status and dates are consistent across bureaus', kind: 'review_results', stage: 'disputes', priority: 'normal' },
    ],
  },
  public_record: {
    key: 'public_record',
    label: 'Public record verification',
    aiHint:
      'Public records: state the record type, dates, and identity fields as reported and note any mismatch with court or county records.',
    tasks: [
      { title: 'Public record: validate identity match (name/address) and record details', kind: 'review_results', stage: 'disputes', priority: 'high' },
    ],
  },
  identity_theft: {
    key: 'identity_theft',
    label: 'Identity theft workflow',
    aiHint:
      'Identity theft: state the account or inquiry is not yours and cite mixed-file identifiers when present; prompt for FTC/affidavit evidence as tasks, not command language in reasons.',
    clauses: [
      'As you can see here on the bureau report, this tradeline or inquiry does not belong to me — it was opened or placed without my authorization.',
      'Personal identifier data shown (name, address, or employer) associated with this item is not mine and may be causing mixed-file reporting.',
    ],
    tasks: [
      { title: 'ID theft: collect FTC report / affidavit / police report if available', kind: 'upload_document', stage: 'identity', priority: 'urgent' },
      { title: 'ID theft: place fraud alert/freeze checklist', kind: 'general', stage: 'identity', priority: 'high' },
    ],
  },
  personal_info: {
    key: 'personal_info',
    label: 'Personal info accuracy',
    aiHint:
      'Personal info: list the incorrect name, address, or employer entry exactly as it appears on the file and state it is not associated with you.',
    tasks: [{ title: 'Personal info: capture proof-of-address / ID for disputes', kind: 'upload_document', stage: 'evidence', priority: 'normal' }],
  },
  unknown: {
    key: 'unknown',
    label: 'General verification',
    aiHint:
      'When type is unknown, lead with the factual negative summary and any field-level contradictions detected on the tradeline.',
    clauses: [
      'The status, balance, and date fields reported for this account are inconsistent with each other and with my records for the same obligation.',
      'The negative information reporting on this tradeline does not accurately reflect the payment history or disposition of the account.',
    ],
    tasks: [{ title: 'Review: identify missing facts needed to strengthen disputes', kind: 'review_results', stage: 'disputes', priority: 'normal' }],
  },
};

