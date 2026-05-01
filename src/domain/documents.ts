export type DocumentType =
  | 'articles_of_incorporation'
  | 'ein_letter'
  | 'id_document'
  | 'utility_bill'
  | 'bank_statement'
  | 'credit_report'
  | 'bureau_response'
  | 'contract'
  | 'other'
  | 'unknown';

export type ProcessedDocument = {
  id: string;
  partnerId: string;
  evidenceId?: string;
  blobRef: string;
  filename: string;
  mimeType: string;
  docType: DocumentType;
  /** Extracted entities (normalized keys). */
  entities: Record<string, string>;
  summary?: string;
  confidence?: number; // 0..1 best-effort
  createdAt: string;
  updatedAt: string;
};

