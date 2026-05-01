/** Debt or summons case tracked per partner (separate from bureau dispute cases). */
export type DebtOrSummonsType = 'debt' | 'summons';

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
  createdAt: string;
  updatedAt: string;
};
