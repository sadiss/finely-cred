/** Debt or summons case tracked per partner (separate from bureau dispute cases). */
export type DebtOrSummonsType = 'debt' | 'summons';

export type DebtSenderSnapshot = {
  fullName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  capturedAt?: string;
};

export type DebtCase = {
  id: string;
  partnerId: string;
  type: DebtOrSummonsType;
  /** Creditor or plaintiff name */
  name: string;
  /** Original amount or amount claimed */
  amountCents: number;
  status: 'open' | 'in_review' | 'resolved' | 'disputed';
  dueDate?: string; // ISO date
  courtCaseNumber?: string;
  /** Court name from scrape / caption (e.g. 36th District Court) */
  courtName?: string;
  notes?: string;
  /** First written contact from collector (for 30-day validation window) */
  firstContactDate?: string;
  /** Last payment date (for SOL / time-barred analysis) */
  lastPaymentDate?: string;
  /** Date summons/complaint was served (for answer deadline, e.g. 35 days) */
  dateServed?: string;
  /** Next hearing / trial / return date (ISO yyyy-mm-dd preferred) */
  hearingDate?: string;
  /** State or jurisdiction for SOL and procedure */
  stateJurisdiction?: string;
  /** Collector / plaintiff mailing identity for letters */
  collectorName?: string;
  /** Plaintiff's collection law firm (if sued) */
  plaintiffLawFirm?: string;
  plaintiffLawFirmAddress?: string;
  /** Plaintiff's attorney of record */
  plaintiffAttorneyName?: string;
  plaintiffAttorneyBarNumber?: string;
  /** Affidavit caption county (defaults from profile state if blank) */
  affidavitCounty?: string;
  /** Loan / note identifiers from complaint or servicer records */
  loanId?: string;
  borrowerId?: string;
  originalCreditor?: string;
  recipientName?: string;
  recipientAddress?: string;
  recipientPhone?: string;
  accountNumberMasked?: string;
  /** Link back to parsed credit report tradeline when auto-detected */
  reportId?: string;
  tradelineIndex?: number;
  linkedEvidenceIds?: string[];
  processedDocumentIds?: string[];
  source?: 'manual' | 'tradeline' | 'document' | 'import';
  senderSnapshot?: DebtSenderSnapshot;
  createdAt: string;
  updatedAt: string;
};
