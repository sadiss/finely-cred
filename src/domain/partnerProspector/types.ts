export const PARTNER_VERTICALS = [
  'tax',
  'bhph',
  'realtor',
  'mortgage',
  'immigration',
  'community',
] as const;

export type PartnerVertical = (typeof PARTNER_VERTICALS)[number];

export const ICP_FIT_VALUES = ['strong', 'maybe', 'skip'] as const;
export type IcpFit = (typeof ICP_FIT_VALUES)[number];

export const PROSPECT_STATUSES = ['new', 'reviewed', 'drafted', 'skipped', 'exported'] as const;
export type PartnerProspectStatus = (typeof PROSPECT_STATUSES)[number];

export const DEFAULT_PROSPECTOR_LIMIT = 50;
export const MAX_PROSPECTOR_LIMIT = 80;

export type PartnerProspect = {
  id: string;
  batchId: string;
  createdAt: string;
  updatedAt: string;
  businessName: string;
  personName: string;
  title: string;
  city: string;
  metro: string;
  category: string;
  vertical: PartnerVertical;
  geo: string;
  website: string;
  phone: string;
  email: string;
  icpFit: IcpFit;
  whyFit: string;
  sourceUrls: string[];
  sources: string[];
  status: PartnerProspectStatus;
  draftStub: string;
  dedupeKey: string;
  score: number;
  skipReason?: string;
  notes?: string;
};

export type RawProspectCandidate = {
  businessName: string;
  personName?: string;
  title?: string;
  city?: string;
  metro?: string;
  vertical: PartnerVertical;
  website?: string;
  phone?: string;
  email?: string;
  snippet?: string;
  sourceUrls?: string[];
  sources?: string[];
  /** When true, treat as a consumer/PII dump rather than a business. */
  consumerList?: boolean;
};

export type DedupeIdentity = {
  emails?: string[];
  phones?: string[];
  domains?: string[];
  names?: string[];
};

export type DedupeIndex = {
  emails: Set<string>;
  phones: Set<string>;
  domains: Set<string>;
  nameCities: Set<string>;
};

export type PageEnrichment = {
  emails: string[];
  phones: string[];
  title?: string;
  description?: string;
  h1?: string;
  robotsOk: boolean;
};

export type ProspectorRunParams = {
  metros?: string[];
  verticals?: PartnerVertical[];
  limit?: number;
  dedupe?: boolean;
  enrich?: boolean;
};

export type ProspectorRunStats = {
  discovered: number;
  enriched: number;
  strong: number;
  maybe: number;
  skipped: number;
  deduped: number;
  kept: number;
  byVertical: Record<string, number>;
};

export type ProspectorRunResult = {
  batchId: string;
  createdAt: string;
  params: Required<Pick<ProspectorRunParams, 'dedupe' | 'enrich'>> & {
    metros: string[];
    verticals: PartnerVertical[];
    limit: number;
  };
  prospects: PartnerProspect[];
  skipped: PartnerProspect[];
  stats: ProspectorRunStats;
  source: 'seed' | 'search+seed' | 'search';
  outreach: {
    autoSend: false;
    note: string;
  };
};

export type ProspectorSearchQuery = {
  vertical: PartnerVertical;
  metro: string;
  city: string;
  query: string;
  location: string;
};

export const BATCH_CSV_COLUMNS = [
  'business_name',
  'person_name',
  'title',
  'city',
  'category',
  'website',
  'phone',
  'email',
  'icp_fit',
  'why_fit',
  'source_urls',
  'status',
] as const;

export type BatchCsvColumn = (typeof BATCH_CSV_COLUMNS)[number];
