export type CreditAnalysisReportRecord = {
  id: string;
  partnerId: string;
  reportId?: string;
  /** Human-readable title shown in UI */
  title: string;
  /** Download filename (spaces + dashes, not underscores) */
  filename: string;
  blobRef: string;
  mimeType: 'application/pdf';
  sizeBytes: number;
  pages: number;
  createdAt: string;
  /** Source credit report filename, if known */
  sourceReportFilename?: string;
  /** Renderer used when this PDF was generated. */
  engine?: 'paginated_text' | 'premium_spreads' | 'structured_premium';
  /** Snapshot of dynamic overlay fields (premium spreads). */
  payloadSnapshot?: Record<string, unknown>;
  /** When a specialist/admin delivered this report to the partner. */
  sentAt?: string;
  sentByEmail?: string;
  sentByRole?: 'admin' | 'partner' | 'credit_specialist';
  deliveryChannel?: 'email' | 'portal' | 'email_and_portal';
};
