export type EvidenceType = 'upload' | 'screenshot';

export type EvidenceSource = 'upload' | 'tradeline_screenshot' | 'section_screenshot';

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
  filename: string;
  mimeType: string;
  sizeBytes: number;
  blobRef: string;
  createdAt: string;
};

