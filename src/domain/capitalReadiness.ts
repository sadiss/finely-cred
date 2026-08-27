export type CapitalDocStatus = 'missing' | 'draft' | 'ready';

export type CapitalDocKey =
  | 'articles'
  | 'ein_letter'
  | 'operating_agreement'
  | 'bank_statements'
  | 'profit_loss'
  | 'balance_sheet'
  | 'tax_returns'
  | 'duns'
  | 'naics'
  | 'business_license'
  | 'website'
  | 'phone_411'
  | 'address_proof'
  | 'vendor_accounts';

export type CapitalDocItem = {
  key: CapitalDocKey;
  label: string;
  status: CapitalDocStatus;
  notes?: string;
  updatedAt: string; // ISO
};

export type EntityRole = 'holding' | 'operating' | 'ip' | 'real_estate' | 'services' | 'other';

export type CapitalEntity = {
  id: string;
  role: EntityRole;
  legalName: string;
  state?: string;
  einLast4?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type RelationshipStage =
  | 'research'
  | 'targeted'
  | 'intro_sent'
  | 'meeting_booked'
  | 'active_applications'
  | 'approved'
  | 'declined'
  | 'paused';

export type LenderRelationship = {
  id: string;
  lenderName: string;
  type: 'bank' | 'credit_union' | 'fintech' | 'vendor' | 'card_issuer' | 'private_lender' | 'broker' | 'other';
  stage: RelationshipStage;
  owner?: string; // internal rep / relationship manager
  lastContactAt?: string;
  nextAction?: string;
  notes?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type CapitalReadinessPlan = {
  partnerId: string;
  createdAt: string;
  updatedAt: string;
  targetBand: 'six_fig' | 'seven_fig' | 'eight_fig' | 'nine_fig' | 'ten_fig_plus';
  entities: CapitalEntity[];
  docs: CapitalDocItem[];
  relationships: LenderRelationship[];
};

export type ReadinessScoreExtras = {
  middleScore?: number | null;
  utilizationPct?: number | null;
  derogatoryCount?: number;
  inquiryCount?: number;
  oldestAccountYears?: number;
  vendorsReporting?: number;
  vendorsRequired?: number;
};

export type ReadinessFactorKey = 'personalCredit' | 'vendorReporting' | 'documents' | 'relationships' | 'entities';

export type ReadinessFactorScore = {
  key: ReadinessFactorKey;
  label: string;
  score: number;
  weight: number;
  weightedScore: number;
  nextAction: string;
  href?: string;
};

export type ReadinessNextAction = {
  action: string;
  href?: string;
  factorKey: ReadinessFactorKey;
  priority: number;
};

export type ReadinessScoreResult = {
  overall: number;
  factors: ReadinessFactorScore[];
  nextActions: ReadinessNextAction[];
};

/**
 * Fundability weights (Stage 4 live-data model):
 * - personal credit gate 35%
 * - vendor reporting 25%
 * - documents 20%
 * - relationships 10%
 * - entities 10%
 *
 * Legacy checkbox model (retired): documents 70%, relationships 20%, entities 10%.
 */
const READINESS_WEIGHTS: Record<ReadinessFactorKey, number> = {
  personalCredit: 35,
  vendorReporting: 25,
  documents: 20,
  relationships: 10,
  entities: 10,
};

const DEFAULT_VENDORS_REQUIRED = 5;
const PERSONAL_CREDIT_GATE = 680;

export function nowIso() {
  return new Date().toISOString();
}

export function defaultDocs(): CapitalDocItem[] {
  const now = nowIso();
  const mk = (key: CapitalDocKey, label: string): CapitalDocItem => ({ key, label, status: 'missing', updatedAt: now });
  return [
    mk('articles', 'Articles / Certificate of Formation'),
    mk('ein_letter', 'EIN Letter (CP 575)'),
    mk('operating_agreement', 'Operating Agreement / Corporate Bylaws'),
    mk('duns', 'D‑U‑N‑S / business bureau profile'),
    mk('naics', 'NAICS alignment + industry description'),
    mk('business_license', 'Business license(s) if applicable'),
    mk('website', 'Professional website + domain + email'),
    mk('phone_411', 'Business phone + 411 listing / directory consistency'),
    mk('address_proof', 'Proof of address / lease / utility (as needed)'),
    mk('bank_statements', 'Last 3–6 months bank statements'),
    mk('profit_loss', 'Profit & Loss statement (current + trailing)'),
    mk('balance_sheet', 'Balance sheet'),
    mk('tax_returns', 'Business tax returns (if applicable)'),
    mk('vendor_accounts', 'Tiered vendor accounts / reporting footprint'),
  ];
}

function isCapitalReadinessPlan(value: unknown): value is CapitalReadinessPlan {
  return Boolean(value && typeof value === 'object' && 'partnerId' in value && 'docs' in value);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function roundScore(value: number) {
  return Math.round(clampScore(value));
}

function scorePersonalCreditGate(extras?: ReadinessScoreExtras): Omit<ReadinessFactorScore, 'key' | 'label' | 'weight' | 'weightedScore'> {
  const middleScore = extras?.middleScore;
  if (middleScore == null || !Number.isFinite(middleScore)) {
    return {
      score: 0,
      nextAction: 'Upload a credit report to unlock your personal credit gate',
      href: '/portal/reports',
    };
  }

  let score: number;
  if (middleScore >= PERSONAL_CREDIT_GATE) score = 100;
  else if (middleScore >= 620) score = 50 + ((middleScore - 620) / (PERSONAL_CREDIT_GATE - 620)) * 50;
  else if (middleScore >= 580) score = 20 + ((middleScore - 580) / 40) * 30;
  else score = Math.max(0, ((middleScore - 300) / 280) * 20);

  const utilization = extras?.utilizationPct;
  if (utilization != null && utilization > 30) {
    score = Math.max(0, score - Math.min(25, (utilization - 30) * 0.6));
  }

  const derog = extras?.derogatoryCount ?? 0;
  if (derog > 0) score = Math.max(0, score - Math.min(20, derog * 4));

  const inquiries = extras?.inquiryCount ?? 0;
  if (inquiries > 6) score = Math.max(0, score - Math.min(12, (inquiries - 6) * 2));

  const ageYears = extras?.oldestAccountYears;
  if (ageYears != null && ageYears >= 2) score = Math.min(100, score + Math.min(8, ageYears));

  score = roundScore(score);

  let nextAction = `Raise your middle score to ${PERSONAL_CREDIT_GATE}+ for lender optics`;
  if (middleScore >= PERSONAL_CREDIT_GATE && utilization != null && utilization > 30) {
    nextAction = `Lower revolving utilization below 30% — currently ${Math.round(utilization)}%`;
  } else if (middleScore >= PERSONAL_CREDIT_GATE) {
    nextAction = 'Personal credit gate cleared — keep utilization low and disputes current';
  } else if (derog > 0) {
    nextAction = `Clear ${derog} derogatory flag${derog === 1 ? '' : 's'} on your personal file`;
  }

  return {
    score,
    nextAction,
    href: middleScore >= PERSONAL_CREDIT_GATE && utilization != null && utilization > 30 ? '/portal/disputes' : '/portal/reports',
  };
}

function scoreVendorReporting(extras?: ReadinessScoreExtras): Omit<ReadinessFactorScore, 'key' | 'label' | 'weight' | 'weightedScore'> {
  const required = extras?.vendorsRequired ?? DEFAULT_VENDORS_REQUIRED;
  const reporting =
    extras?.vendorsReporting != null && Number.isFinite(extras.vendorsReporting) ? Math.max(0, extras.vendorsReporting) : null;

  if (reporting == null) {
    return {
      score: 0,
      nextAction: 'Open your first Tier 1 vendors to start EIN reporting',
      href: '/business/vendors',
    };
  }

  const score = roundScore((reporting / Math.max(1, required)) * 100);
  const gap = Math.max(0, required - reporting);

  let nextAction = 'All required vendors are reporting on your EIN file';
  if (gap > 0 && reporting === 0) nextAction = 'Open your first Tier 1 vendors to start EIN reporting';
  else if (gap === 1) nextAction = 'Open one more Tier 1 vendor to complete your reporting footprint';
  else if (gap === 2) nextAction = 'Open these two Tier 1 vendors next';
  else if (gap > 2) nextAction = `Open ${gap} more Tier 1 vendors to reach your reporting target`;

  return { score, nextAction, href: '/business/vendors' };
}

function scoreDocuments(docs: CapitalDocItem[]): Omit<ReadinessFactorScore, 'key' | 'label' | 'weight' | 'weightedScore'> {
  if (!docs.length) {
    return {
      score: 0,
      nextAction: 'Add your formation and banking documents to the capital package',
      href: '/business/billion-path',
    };
  }

  const docPoints = docs.reduce((sum, d) => sum + (d.status === 'ready' ? 1 : d.status === 'draft' ? 0.5 : 0), 0);
  const score = roundScore((docPoints / docs.length) * 100);
  const missing = docs.filter((d) => d.status === 'missing');
  const drafts = docs.filter((d) => d.status === 'draft');

  let nextAction = 'Capital document package complete';
  if (missing.length) {
    const labels = missing.slice(0, 2).map((d) => d.label.split('(')[0].trim());
    const suffix = missing.length > 2 ? ` — ${missing.length} docs still missing` : '';
    nextAction = `Upload ${labels.join(' and ')}${suffix}`;
  } else if (drafts.length) {
    nextAction = `Finalize ${drafts.length} draft document${drafts.length === 1 ? '' : 's'} to ready status`;
  }

  return { score, nextAction, href: '/business/billion-path' };
}

function scoreRelationships(relationships: LenderRelationship[]): Omit<ReadinessFactorScore, 'key' | 'label' | 'weight' | 'weightedScore'> {
  const active = relationships.filter((r) => r.stage !== 'declined' && r.stage !== 'paused').length;
  const score = roundScore(Math.min(100, (active / 10) * 100));
  const gap = Math.max(0, 3 - active);

  let nextAction = 'Lender pipeline tracked — keep relationships warm';
  if (active === 0) nextAction = 'Add your first lender relationship to track capital outreach';
  else if (gap > 0) nextAction = `Add ${gap} more lender relationship${gap === 1 ? '' : 's'} to strengthen your pipeline`;

  return { score, nextAction, href: '/business/billion-path' };
}

function scoreEntities(entities: CapitalEntity[]): Omit<ReadinessFactorScore, 'key' | 'label' | 'weight' | 'weightedScore'> {
  const score = roundScore(Math.min(100, (entities.length / 3) * 100));
  const gap = Math.max(0, 1 - entities.length);

  let nextAction = 'Entity stack documented in your capital plan';
  if (entities.length === 0) nextAction = 'Register your operating entity in the capital plan';
  else if (gap > 0) nextAction = 'Add your operating entity details to the capital plan';

  return { score, nextAction, href: '/business/profile' };
}

function buildFactor(
  key: ReadinessFactorKey,
  label: string,
  partial: Omit<ReadinessFactorScore, 'key' | 'label' | 'weight' | 'weightedScore'>,
): ReadinessFactorScore {
  const weight = READINESS_WEIGHTS[key];
  return {
    key,
    label,
    weight,
    ...partial,
    weightedScore: (partial.score * weight) / 100,
  };
}

function rankNextActions(factors: ReadinessFactorScore[]): ReadinessNextAction[] {
  return factors
    .map((factor) => ({
      action: factor.nextAction,
      href: factor.href,
      factorKey: factor.key,
      priority: (100 - factor.score) * factor.weight,
    }))
    .filter((item) => item.priority > 0)
    .sort((a, b) => b.priority - a.priority);
}

function computeReadinessScoreDetailed(
  docs: CapitalDocItem[],
  relationships: LenderRelationship[],
  entities: CapitalEntity[],
  extras?: ReadinessScoreExtras,
): ReadinessScoreResult {
  const factors: ReadinessFactorScore[] = [
    buildFactor('personalCredit', 'Personal credit gate', scorePersonalCreditGate(extras)),
    buildFactor('vendorReporting', 'Vendor reporting', scoreVendorReporting(extras)),
    buildFactor('documents', 'Capital documents', scoreDocuments(docs)),
    buildFactor('relationships', 'Lender relationships', scoreRelationships(relationships)),
    buildFactor('entities', 'Entity stack', scoreEntities(entities)),
  ];

  const overall = roundScore(factors.reduce((sum, factor) => sum + factor.weightedScore, 0));

  return {
    overall,
    factors,
    nextActions: rankNextActions(factors),
  };
}

export function computeReadinessScore(plan: CapitalReadinessPlan, extras?: ReadinessScoreExtras): number;
export function computeReadinessScore(
  docs: CapitalDocItem[],
  relationships: LenderRelationship[],
  entities: CapitalEntity[],
  extras?: ReadinessScoreExtras,
): ReadinessScoreResult;
export function computeReadinessScore(
  planOrDocs: CapitalReadinessPlan | CapitalDocItem[],
  relationshipsOrExtras?: LenderRelationship[] | ReadinessScoreExtras,
  entities?: CapitalEntity[],
  extras?: ReadinessScoreExtras,
): number | ReadinessScoreResult {
  if (isCapitalReadinessPlan(planOrDocs)) {
    return computeReadinessScoreDetailed(
      planOrDocs.docs,
      planOrDocs.relationships,
      planOrDocs.entities,
      relationshipsOrExtras as ReadinessScoreExtras | undefined,
    ).overall;
  }

  return computeReadinessScoreDetailed(
    planOrDocs,
    (relationshipsOrExtras as LenderRelationship[]) ?? [],
    entities ?? [],
    extras,
  );
}
