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
  notes?: string;
  /** First written contact from collector (for 30-day validation window) */
  firstContactDate?: string;
  /** Last payment date (for SOL / time-barred analysis) */
  lastPaymentDate?: string;
  /** Date summons/complaint was served (for answer deadline, e.g. 35 days) */
  dateServed?: string;
  /** State or jurisdiction for SOL and procedure */
  stateJurisdiction?: string;
  /** Collector / plaintiff mailing identity for letters */
  collectorName?: string;
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
