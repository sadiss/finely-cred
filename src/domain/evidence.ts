export type EvidenceType = 'upload' | 'screenshot';

import type {
  Bureau,
  CreditReportFileType,
  CreditReportProvider,
  NormalizedReportRegion,
} from './creditReports';

export type EvidenceSource =
  | 'upload'
  | 'tradeline_screenshot'
  | 'section_screenshot'
  | 'source_report_crop'
  | 'manual_bureau_screenshot'
  | 'parsed_finely_exhibit'
  | 'demo_synthetic';

export type EvidenceProvenanceKind =
  | 'raw_upload'
  | 'source_faithful_report_crop'
  | 'manually_cropped_upload'
  | 'parsed_finely_exhibit'
  | 'demo_synthetic';

export type EvidenceRedactionProfile = {
  version: string;
  maskedFields: Array<'ssn' | 'dob' | 'full_account_number' | 'unrelated_address' | 'neighboring_tradeline' | 'other'>;
  keepAccountLast4?: boolean;
  reviewedByUser?: boolean;
};

export type EvidenceProvenance = {
  kind: EvidenceProvenanceKind;
  sourceReportId?: string;
  sourceBlobRef?: string;
  fileType?: CreditReportFileType;
  provider?: CreditReportProvider;
  reportDate?: string;
  bureau?: Bureau;
  page?: number;
  region?: NormalizedReportRegion;
  htmlLocator?: string;
  textFingerprint?: string;
  reportSha256?: string;
  contentSha256?: string;
  parseVersion?: string;
  redaction?: EvidenceRedactionProfile;
  generatedAt: string;
  /** Demo assets and unreviewed approximate crops must never be mailed. */
  mailEligible: boolean;
  demoOnly?: boolean;
  humanVerified?: boolean;
};

export type EvidenceItem = {
  id: string;
  partnerId: string;
  reportId?: string;
  type: EvidenceType;
  /**
   * Optional metadata used to reliably bind evidence to a dispute item.
   * Kept optional to preserve compatibility with older stored records.
   */
  source?: EvidenceSource;
  creditorName?: string; // for tradeline screenshots
  sectionKey?: string; // e.g. 'bankruptcy' | 'public_records'
  caption?: string;
  /** Optional tags for categorization (e.g. ['analysis_report']). */
  tags?: string[];
  /** Exact origin and redaction metadata for integrity, review, and mailing gates. */
  provenance?: EvidenceProvenance;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  blobRef: string;
  createdAt: string;
};

