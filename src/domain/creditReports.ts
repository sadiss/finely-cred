export type CreditReportProvider = 'identityiq' | 'myscoreiq' | 'unknown';
export type CreditReportFileType = 'html' | 'pdf';
export type UploadActor = 'partner' | 'admin';

export type Bureau = 'TUC' | 'EXP' | 'EQF';

export type PdfTextMeta = {
  numPages?: number;
  nonEmptyPages?: number;
  extractedChars?: number;
  /** True when OCR was used to produce the text. */
  ocrUsed?: boolean;
  /** OCR engine identifier (demo/local). */
  ocrEngine?: string;
  /** Pages OCR’d (1-indexed), when available. */
  ocrPagesUsed?: number[];
};

export type PaymentHistoryCell = {
  code: string; // e.g. OK, 30, 60, 90, CO, etc (provider-dependent)
};

export type PaymentHistory2Y = {
  months: string[];
  years: string[];
  byBureau: Partial<Record<Bureau, PaymentHistoryCell[]>>;
};

export type TradelineRow = {
  label: string;
  byBureau: Partial<Record<Bureau, string>>;
};

export type ParsedTable = {
  columns: string[];
  rows: string[][];
};

export type ParsedSection = {
  key: string; // e.g. 'public_records', 'bankruptcy'
  title: string;
  rows?: TradelineRow[];
  table?: ParsedTable;
  /** Phase 1: structured items (one per row) when columns map to known fields (collections, inquiries). */
  items?: ParsedSectionItem[];
};

/** Structured personal information extracted from PI section (Phase 1). */
export type ParsedPersonalInfo = {
  fullName?: string;
  aka?: string[];
  ssnMasked?: string;
  dob?: string;
  addresses?: { raw?: string; line1?: string; city?: string; state?: string; zip?: string; type?: 'current' | 'previous' }[];
  phones?: { number: string; type?: string }[];
  employer?: string;
  /** Raw key-value pairs when we can't fully structure (e.g. from table rows). */
  raw?: { label: string; value: string }[];
};

/** Creditor/collector contact for letters and display (Phase 1). */
export type ParsedCreditorContact = {
  creditorName: string;
  accountNumberMasked?: string;
  address?: string;
  phone?: string;
  bureau?: Bureau;
  source: 'tradeline' | 'section';
  sectionKey?: string;
  tradelineIndex?: number;
};

/** One structured item in collections/inquiries (Phase 1). */
export type ParsedSectionItem = {
  /** Map column name (normalized) to value. */
  fields: Record<string, string>;
  /** Original row index for reference. */
  rowIndex?: number;
};

export type ParsedTradeline = {
  creditorName: string;
  originalCreditor?: string;
  fields: TradelineRow[];
  paymentHistory2y?: PaymentHistory2Y;
  /** Phase 1: structured values derived from fields where possible. */
  dateOpened?: string;
  dateClosed?: string;
  dofd?: string;
  balance?: number;
  creditLimit?: number;
  highBalance?: number;
  pastDue?: number;
  monthlyPayment?: number;
  accountType?: string;
  accountStatus?: string;
  responsibility?: string;
  accountNumberMasked?: string;
  creditorAddress?: string;
  creditorPhone?: string;
  /** Per-bureau utilization when balance + limit present. */
  utilizationPct?: Partial<Record<Bureau, number>>;
  /** Date of last activity (DLA) when present on bureau export. */
  dateLastActive?: string;
  /** Date last reported to bureau when distinct from DLA. */
  dateLastReported?: string;
};

export type ParsedScore = {
  model: string; // e.g. "FICO 8", "FICO 4", "VantageScore 3.0"
  bureau?: Bureau;
  value: number;
  providerHint?: string;
  sourceText?: string;
};

export type ParsedCreditReport = {
  provider: CreditReportProvider;
  reportDate?: string;
  tradelines: ParsedTradeline[];
  sections?: ParsedSection[];
  scores?: ParsedScore[];
  /** Phase 1: structured personal information from PI section. */
  personalInfo?: ParsedPersonalInfo;
  /** Phase 1: creditor/collector contacts derived from tradelines and sections. */
  creditorContacts?: ParsedCreditorContact[];
  /** Phase 1: tables we couldn't classify (still show in UI as "Other sections"). */
  unclassifiedSections?: ParsedSection[];
  debug?: {
    tablesFound: number;
    subHeadersFound: number;
    tradelinesParsed: number;
    /** True when we had to infer tradelines from tables (no reliable sub_header blocks). */
    fallbackTradelinesUsed?: boolean;
    /** Report date extracted from the export (best-effort). */
    reportDateDetected?: string;
    sectionsFound: { key: string; hasRows: boolean; hasTable: boolean; rows?: number; cols?: number }[];
    scoresFound: number;
  };
};

export type CreditReportRecord = {
  id: string;
  partnerId: string;
  provider: CreditReportProvider;
  fileType: CreditReportFileType;
  uploadedBy: UploadActor;
  receivedAt: string;
  reportDate?: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sha256?: string;
  rawBlobRef: string; // points to BlobStore
  parsed?: ParsedCreditReport;
  pdfText?: string;
  pdfMeta?: PdfTextMeta;
  /** Phase 8: identity validation snapshot for letter autofill readiness. */
  identityCheck?: ReportIdentityCheck;
};

export type IdentityFaultKind =
  | 'missing_report_personal_info'
  | 'name_mismatch'
  | 'address_mismatch'
  | 'missing_partner_mailing_address';

export type ReportIdentityFault = {
  kind: IdentityFaultKind;
  message: string;
  severity: 'info' | 'warn' | 'error';
};

export type ReportIdentityCheck = {
  checkedAt: string;
  canonical: {
    fullName?: string;
    addressLine1?: string;
    cityStateZip?: string;
  };
  report: {
    fullName?: string;
    addressRaw?: string;
    addressLine1?: string;
    cityStateZip?: string;
  };
  faults: ReportIdentityFault[];
};

export type DisputeCandidate = {
  id: string;
  bureau: Bureau;
  account: string;
  type: string;
  /** Optional subtype/category for display (e.g. "Bankruptcy", "Judgment", "Tax lien"). */
  subtype?: string;
  status: string;
  code: string;
  reportId?: string;
};

