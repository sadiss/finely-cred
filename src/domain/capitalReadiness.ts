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

export function computeReadinessScore(plan: CapitalReadinessPlan): number {
  // Score: docs readiness heavy, relationships medium, entities light.
  const docPoints = plan.docs.length ? plan.docs.reduce((sum, d) => sum + (d.status === 'ready' ? 1 : d.status === 'draft' ? 0.5 : 0), 0) : 0;
  const docScore = plan.docs.length ? (docPoints / plan.docs.length) * 70 : 0;
  const relScore = Math.min(20, (plan.relationships.length / 10) * 20);
  const entScore = Math.min(10, (plan.entities.length / 3) * 10);
  return Math.round(Math.max(0, Math.min(100, docScore + relScore + entScore)));
}

