export type VendorTier = 1 | 2 | 3 | 4;

export type VendorReportingBureau = 'DNB' | 'EXP' | 'EQF' | 'OTHER' | 'UNKNOWN';

export type VendorCategory =
  | 'Office supplies'
  | 'Shipping'
  | 'Industrial'
  | 'Fuel'
  | 'Marketing'
  | 'Technology'
  | 'Banking'
  | 'General'
  | 'Other';

export type Vendor = {
  id: string;
  tenantId: string;
  name: string;
  website?: string;
  tier: VendorTier;
  category: VendorCategory;
  /** Not guaranteed — informational hint only. */
  reportsTo?: VendorReportingBureau[];
  /** Simple underwriting prerequisites shown in UI. */
  prerequisites?: string[];
  /** Short “why” / operator guidance. */
  notes?: string;
  /** Business types this vendor fits best (see businessVendorSequencing). */
  businessTypes?: string[];
  /** Search/filter tags. */
  tags?: string[];
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
};

export function nowIso() {
  return new Date().toISOString();
}

export function createVendor(args: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Vendor {
  const createdAt = nowIso();
  const id =
    args.id ??
    (crypto?.randomUUID ? crypto.randomUUID() : `vendor_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`);
  return {
    id,
    tenantId: args.tenantId,
    name: args.name,
    website: args.website,
    tier: args.tier,
    category: args.category,
    reportsTo: args.reportsTo ?? ['UNKNOWN'],
    prerequisites: args.prerequisites ?? [],
    notes: args.notes,
    tags: args.tags ?? [],
    businessTypes: args.businessTypes ?? ['general'],
    sortOrder: args.sortOrder ?? 0,
    createdAt,
    updatedAt: createdAt,
  };
}

