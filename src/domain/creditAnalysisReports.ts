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
};
