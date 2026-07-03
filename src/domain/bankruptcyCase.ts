/** Bankruptcy case tracked per partner — filing + post-discharge credit repair. */
export type BankruptcyChapter = '7' | '11' | '12' | '13' | 'unknown';

export type BankruptcyCaseStatus =
  | 'considering'
  | 'pre_filing'
  | 'filed'
  | 'discharged'
  | 'dismissed'
  | 'closed';

export type BankruptcyCase = {
  id: string;
  partnerId: string;
  chapter: BankruptcyChapter;
  status: BankruptcyCaseStatus;
  district?: string;
  courtName?: string;
  caseNumber?: string;
  filingDate?: string;
  dischargeDate?: string;
  dismissalDate?: string;
  /** Foreclosure sale date if applicable */
  foreclosureSaleDate?: string;
  mortgageCreditor?: string;
  businessName?: string;
  notes?: string;
  linkedEvidenceIds?: string[];
  processedDocumentIds?: string[];
  createdAt: string;
  updatedAt: string;
};
