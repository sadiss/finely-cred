export type CreditReportProvider = 'identityiq' | 'myscoreiq' | 'unknown';
export type CreditReportFileType = 'html' | 'pdf';
export type UploadActor = 'partner' | 'admin';

export type Bureau = 'TUC' | 'EXP' | 'EQF';

export type NormalizedReportRegion = {
  /** Top-left normalized coordinates in the rendered source page (0–1). */
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ReportSourceAnchor = {
  fileType: CreditReportFileType;
  /** PDF page, 1-indexed. */
  page?: number;
  /** Tight or approximate region in top-left normalized page coordinates. */
  region?: NormalizedReportRegion;
  /** Sanitized HTML locator; never execute source scripts to resolve it. */
  htmlLocator?: string;
  /** Normalized source text used to recover an anchor if the locator changes. */
  textFingerprint?: string;
  bureau?: Bureau;
  parseVersion: string;
  reportSha256?: string;
  confidence?: 'exact' | 'approximate' | 'text_only';
};

export type PdfSourceTextRun = {
  text: string;
  region: NormalizedReportRegion;
};

export type ReportSourceMap = {
  version: string;
  fileType: CreditReportFileType;
  pdfPages?: Array<{
    page: number;
    width: number;
    height: number;
    /** Selected runs may be retained for audit; full page text stays in the protected report blob. */
    runs?: PdfSourceTextRun[];
  }>;
  html?: {
    sanitized: boolean;
    remoteResourcesRemoved: boolean;
  };
};

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
  /** Page dimensions retained for source-region rendering. */
  pageDimensions?: Array<{ page: number; width: number; height: number }>;
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
  sourceAnchor?: ReportSourceAnchor;
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
  sourceAnchor?: ReportSourceAnchor;
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
  /** Source location used for exact report comparison and derived exhibits. */
  sourceAnchor?: ReportSourceAnchor;
};

export type ParsedScore = {
  model: string; // e.g. "FICO 8", "FICO 4", "VantageScore 3.0"
  bureau?: Bureau;
  value: number;
  providerHint?: string;
  sourceText?: string;
  sourceAnchor?: ReportSourceAnchor;
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
  /** Spatial/text provenance captured during parsing. Optional for legacy reports. */
  sourceMap?: ReportSourceMap;
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
  | 'missing_partner_mailing_address'
  | 'ssn_mismatch'
  | 'employer_mismatch'
  | 'file_frozen'
  | 'fraud_alert';

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
    ssnLast4?: string;
    employer?: string;
  };
  report: {
    fullName?: string;
    addressRaw?: string;
    addressLine1?: string;
    cityStateZip?: string;
    ssnLast4?: string;
    employer?: string;
    fileFrozen?: boolean;
    fraudAlert?: boolean;
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

