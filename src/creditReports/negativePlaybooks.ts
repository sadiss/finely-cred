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
      'Bankruptcy items typically require careful verification of court docket details and furnisher reporting accuracy. Ask for the method of verification and clarify any mismatched case details (dates, chapter, status, disposition). Keep it factual and avoid making legal claims.',
    clauses: [
      'Please provide the method of verification and the source record used to verify this bankruptcy item (including case identifier details, chapter, filing date, and disposition/status as reported).',
      'If any key bankruptcy details do not match the source record, please correct or delete the item and provide written results.',
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
      'Repossession items often hinge on accuracy of dates, balance, disposition, and accounting details. Draft narratives that request itemized accounting and verification method without inventing amounts or dates.',
    clauses: [
      'Please provide the method of verification and supporting documentation for the reported repossession/disposition details (dates, status, and any balance information).',
      'If this item cannot be verified with competent documentation, please delete or correct it and provide written results.',
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
      'Foreclosure items should focus on verification of the reported timeline and accuracy of the tradeline/public record details. Ask for verification method and supporting documentation for any critical reporting fields.',
    clauses: [
      'Please provide the method of verification and the source record used to verify the reported foreclosure timeline and status fields.',
      'If the reporting cannot be verified as accurate, please correct or delete the item and provide written results.',
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
      'Student loans often involve servicer transfers and reporting inconsistencies. Ask for verification method, ownership/servicer history if relevant, and ensure narratives do not invent balances/dates.',
    clauses: [
      'Please provide the method of verification and identify the reporting furnisher/servicer responsible for the data as reported on my file.',
      'If ownership/servicer history or reporting fields are inconsistent, please correct or delete the inaccurate information and provide written results.',
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
      'Inquiry disputes should request verification of permissible purpose and supporting documentation. Avoid accusing; ask for the specific basis and documentation for the inquiry.',
    clauses: [
      'Please provide the method of verification and documentation supporting the permissible purpose for this inquiry.',
      'If you cannot provide documentation establishing permissible purpose, please delete the inquiry and provide written results.',
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
      'Collections should request competent verification and method of verification. Keep narratives specific to the reasons selected, and avoid inventing account numbers, amounts, or dates.',
    tasks: [
      { title: 'Collection: verify furnisher/collector reporting fields (dates/balance/status)', kind: 'review_results', stage: 'disputes', priority: 'normal' },
    ],
  },
  charge_off: {
    key: 'charge_off',
    label: 'Charge-off accuracy',
    aiHint:
      'Charge-offs require accuracy checks across dates, status, and balances. Ask for verification method and ensure all narratives stay grounded in provided reasons.',
    tasks: [
      { title: 'Charge-off: verify status and dates are consistent across bureaus', kind: 'review_results', stage: 'disputes', priority: 'normal' },
    ],
  },
  public_record: {
    key: 'public_record',
    label: 'Public record verification',
    aiHint:
      'Public records should focus on identity match and record accuracy. Ask for verification method and source record details.',
    tasks: [
      { title: 'Public record: validate identity match (name/address) and record details', kind: 'review_results', stage: 'disputes', priority: 'high' },
    ],
  },
  identity_theft: {
    key: 'identity_theft',
    label: 'Identity theft workflow',
    aiHint:
      'Identity theft items should be handled carefully: request reinvestigation, accuracy verification, and ensure the letter avoids invented facts. If needed, prompt for FTC report/fraud affidavit evidence.',
    clauses: [
      'This item may be related to identity theft. Please reinvestigate and provide the method of verification used to determine accuracy.',
      'If you cannot verify the item with supporting documentation, please delete or block the information as required and provide written results.',
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
      'Personal info disputes (name/address/employer) should be direct and precise. Ask for correction/deletion of inaccurate identifiers.',
    tasks: [{ title: 'Personal info: capture proof-of-address / ID for disputes', kind: 'upload_document', stage: 'evidence', priority: 'normal' }],
  },
  unknown: {
    key: 'unknown',
    label: 'General verification',
    aiHint:
      'Use general verification language: request reinvestigation, method of verification, and correction/deletion if not verifiable. Stay strictly within the provided reasons and facts.',
    clauses: [
      'Please reinvestigate and provide the results in writing. If you verify the item, please provide the method of verification used to determine accuracy.',
      'If the item cannot be verified, please delete or correct it and provide written results.',
    ],
    tasks: [{ title: 'Review: identify missing facts needed to strengthen disputes', kind: 'review_results', stage: 'disputes', priority: 'normal' }],
  },
};

