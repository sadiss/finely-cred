import type { Vendor, VendorCategory, VendorReportingBureau, VendorTier } from '../domain/vendors';
import { nowIso } from '../domain/vendors';
import { loadJson, saveJson } from './localJsonStore';
import { FINELY_TENANT_ID } from '../domain/tenants';

const KEY = 'finely.vendors.v1';

type Store = {
  vendors: Vendor[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { vendors: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function slugify(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

function seedVendorId(tenantId: string, name: string) {
  return `seed_vendor_${tenantId}_${slugify(name)}`;
}

function mkVendor(args: {
  tenantId: string;
  name: string;
  website?: string;
  tier: VendorTier;
  category: VendorCategory;
  reportsTo?: VendorReportingBureau[];
  prerequisites?: string[];
  notes?: string;
  tags?: string[];
  sortOrder?: number;
}): Vendor {
  const createdAt = nowIso();
  return {
    id: seedVendorId(args.tenantId, args.name),
    tenantId: args.tenantId,
    name: args.name,
    website: args.website,
    tier: args.tier,
    category: args.category,
    reportsTo: args.reportsTo ?? ['UNKNOWN'],
    prerequisites: args.prerequisites ?? [],
    notes: args.notes,
    tags: args.tags ?? [],
    sortOrder: args.sortOrder ?? 0,
    createdAt,
    updatedAt: createdAt,
  };
}

export function listVendors(args?: { tenantId?: string; tier?: VendorTier }): Vendor[] {
  const tenantId = (args?.tenantId || '').trim() || FINELY_TENANT_ID;
  const tier = args?.tier;
  return loadStore()
    .vendors
    .filter((v) => v.tenantId === tenantId)
    .filter((v) => (tier ? v.tier === tier : true))
    .slice()
    .sort((a, b) => {
      const so = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (so) return so;
      if (a.tier !== b.tier) return a.tier - b.tier;
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    });
}

export function upsertVendor(vendor: Vendor): Vendor {
  const store = loadStore();
  const idx = store.vendors.findIndex((v) => v.id === vendor.id);
  const next: Vendor = { ...vendor, updatedAt: nowIso() };
  if (idx >= 0) store.vendors[idx] = next;
  else store.vendors.push(next);
  saveStore(store);
  return next;
}

export function deleteVendor(id: string) {
  const store = loadStore();
  store.vendors = store.vendors.filter((v) => v.id !== id);
  saveStore(store);
}

export function ensureVendorCatalogDefaults(args?: { tenantId?: string }) {
  const tenantId = (args?.tenantId || '').trim() || FINELY_TENANT_ID;
  const store = loadStore();
  const haveIds = new Set(store.vendors.filter((v) => v.tenantId === tenantId).map((v) => v.id));

  // NOTE: These are “starter” suggestions, not guarantees. Reporting/bureau behavior changes over time.
  // Tier 1 target: 30+ options so partners can pick based on fit and availability.
  const seed: Vendor[] = [
    // Tier 1 (starter, low-risk)
    mkVendor({ tenantId, tier: 1, category: 'Office supplies', name: 'Quill', website: 'https://www.quill.com', tags: ['net-30', 'starter'], sortOrder: 10 }),
    mkVendor({ tenantId, tier: 1, category: 'Office supplies', name: 'Uline', website: 'https://www.uline.com', tags: ['net-30', 'starter'], sortOrder: 11 }),
    mkVendor({ tenantId, tier: 1, category: 'Office supplies', name: 'Grainger', website: 'https://www.grainger.com', tags: ['industrial', 'starter'], sortOrder: 12 }),
    mkVendor({ tenantId, tier: 1, category: 'Office supplies', name: 'Staples Business', website: 'https://www.staples.com', tags: ['office'], sortOrder: 13 }),
    mkVendor({ tenantId, tier: 1, category: 'Office supplies', name: 'Office Depot Business', website: 'https://www.officedepot.com', tags: ['office'], sortOrder: 14 }),
    mkVendor({ tenantId, tier: 1, category: 'Shipping', name: 'FedEx', website: 'https://www.fedex.com', tags: ['shipping'], sortOrder: 20 }),
    mkVendor({ tenantId, tier: 1, category: 'Shipping', name: 'UPS', website: 'https://www.ups.com', tags: ['shipping'], sortOrder: 21 }),
    mkVendor({ tenantId, tier: 1, category: 'Shipping', name: 'USPS (Business)', website: 'https://www.usps.com/business/', tags: ['shipping'], sortOrder: 22 }),
    mkVendor({ tenantId, tier: 1, category: 'Marketing', name: 'Vistaprint', website: 'https://www.vistaprint.com', tags: ['marketing'], sortOrder: 30 }),
    mkVendor({ tenantId, tier: 1, category: 'Marketing', name: 'Canva', website: 'https://www.canva.com', tags: ['marketing', 'saas'], sortOrder: 31 }),
    mkVendor({ tenantId, tier: 1, category: 'Technology', name: 'Microsoft 365', website: 'https://www.microsoft.com/microsoft-365', tags: ['saas'], sortOrder: 40 }),
    mkVendor({ tenantId, tier: 1, category: 'Technology', name: 'Google Workspace', website: 'https://workspace.google.com', tags: ['saas'], sortOrder: 41 }),
    mkVendor({ tenantId, tier: 1, category: 'Technology', name: 'QuickBooks Online', website: 'https://quickbooks.intuit.com', tags: ['accounting', 'saas'], sortOrder: 42 }),
    mkVendor({ tenantId, tier: 1, category: 'Technology', name: 'FreshBooks', website: 'https://www.freshbooks.com', tags: ['accounting', 'saas'], sortOrder: 43 }),
    mkVendor({ tenantId, tier: 1, category: 'Technology', name: 'Slack', website: 'https://slack.com', tags: ['saas'], sortOrder: 44 }),
    mkVendor({ tenantId, tier: 1, category: 'Technology', name: 'Zoom', website: 'https://zoom.us', tags: ['saas'], sortOrder: 45 }),
    mkVendor({ tenantId, tier: 1, category: 'General', name: 'Amazon Business', website: 'https://www.amazon.com/business', tags: ['general'], sortOrder: 50 }),
    mkVendor({ tenantId, tier: 1, category: 'General', name: 'Walmart Business', website: 'https://business.walmart.com', tags: ['general'], sortOrder: 51 }),
    mkVendor({ tenantId, tier: 1, category: 'Industrial', name: 'Home Depot Pro', website: 'https://www.homedepot.com/c/pro_xtra', tags: ['supplies'], sortOrder: 60 }),
    mkVendor({ tenantId, tier: 1, category: 'Industrial', name: "Lowe's For Pros", website: 'https://www.lowes.com/l/pro/forpros', tags: ['supplies'], sortOrder: 61 }),
    mkVendor({ tenantId, tier: 1, category: 'Industrial', name: 'Harbor Freight', website: 'https://www.harborfreight.com', tags: ['tools'], sortOrder: 62 }),
    mkVendor({ tenantId, tier: 1, category: 'Industrial', name: 'Tractor Supply', website: 'https://www.tractorsupply.com', tags: ['supplies'], sortOrder: 63 }),
    mkVendor({ tenantId, tier: 1, category: 'Marketing', name: 'Mailchimp', website: 'https://mailchimp.com', tags: ['marketing', 'saas'], sortOrder: 70 }),
    mkVendor({ tenantId, tier: 1, category: 'Marketing', name: 'Hootsuite', website: 'https://www.hootsuite.com', tags: ['marketing', 'saas'], sortOrder: 71 }),
    mkVendor({ tenantId, tier: 1, category: 'Marketing', name: 'HubSpot CRM (starter)', website: 'https://www.hubspot.com', tags: ['crm', 'saas'], sortOrder: 72 }),
    mkVendor({ tenantId, tier: 1, category: 'General', name: 'Square', website: 'https://squareup.com', tags: ['payments'], sortOrder: 80 }),
    mkVendor({ tenantId, tier: 1, category: 'General', name: 'PayPal Business', website: 'https://www.paypal.com/business', tags: ['payments'], sortOrder: 81 }),
    mkVendor({ tenantId, tier: 1, category: 'Banking', name: 'Business checking (local bank/credit union)', website: undefined, tags: ['banking'], sortOrder: 90, notes: 'Open a dedicated business checking account and keep clean deposits + statements.' }),
    mkVendor({ tenantId, tier: 1, category: 'Banking', name: 'Business savings (optional)', website: undefined, tags: ['banking'], sortOrder: 91 }),
    mkVendor({ tenantId, tier: 1, category: 'Other', name: 'Business phone line (VoIP)', website: undefined, tags: ['profile'], sortOrder: 92, notes: 'Dedicated business number improves legitimacy signals.' }),
    mkVendor({ tenantId, tier: 1, category: 'Other', name: 'Domain + business email', website: undefined, tags: ['profile'], sortOrder: 93, notes: 'Use a custom domain email (not Gmail) for underwriting signals.' }),

    // Tier 2 (scaling)
    mkVendor({
      tenantId,
      tier: 2,
      category: 'Technology',
      name: 'Apple for Business',
      website: 'https://www.apple.com/business/',
      tags: ['hardware'],
      prerequisites: ['Tier 1 reporting established', 'Clean address + phone signals'],
      sortOrder: 200,
    }),
    mkVendor({
      tenantId,
      tier: 2,
      category: 'Industrial',
      name: 'Grainger (expanded credit)',
      website: 'https://www.grainger.com',
      tags: ['industrial'],
      prerequisites: ['Tier 1 reporting established'],
      sortOrder: 201,
    }),
    mkVendor({
      tenantId,
      tier: 2,
      category: 'Marketing',
      name: 'Google Ads (managed spend)',
      website: 'https://ads.google.com',
      tags: ['marketing'],
      prerequisites: ['Stable cashflow', 'Consistent billing history'],
      sortOrder: 202,
    }),
    mkVendor({
      tenantId,
      tier: 2,
      category: 'Fuel',
      name: 'Fuel card (starter fleet)',
      website: undefined,
      tags: ['fleet'],
      prerequisites: ['Tier 1 reporting established', 'Business address matches filings'],
      sortOrder: 203,
    }),

    // Tier 3 (mature profile)
    mkVendor({
      tenantId,
      tier: 3,
      category: 'Fuel',
      name: 'Fleet card (major brand)',
      website: undefined,
      tags: ['fleet'],
      prerequisites: ['Tier 2 accounts established', 'Higher bureau maturity', 'Bank relationship'],
      sortOrder: 300,
    }),
    mkVendor({
      tenantId,
      tier: 3,
      category: 'Banking',
      name: 'Business credit card (bank)',
      website: undefined,
      tags: ['card'],
      prerequisites: ['Tier 2 accounts established', 'Clean profile signals', 'Banking history'],
      sortOrder: 301,
    }),
    mkVendor({
      tenantId,
      tier: 3,
      category: 'General',
      name: 'Store card (high-limit)',
      website: undefined,
      tags: ['card'],
      prerequisites: ['Tier 2 accounts established'],
      sortOrder: 302,
    }),
  ];

  let changed = false;
  for (const v of seed) {
    if (haveIds.has(v.id)) continue;
    store.vendors.push(v);
    changed = true;
  }
  if (changed) saveStore(store);
}

let seededTenants: Set<string> | null = null;

export function ensureVendorCatalogDefaultsOnce(args?: { tenantId?: string }) {
  const tenantId = (args?.tenantId || '').trim() || FINELY_TENANT_ID;
  if (!seededTenants) seededTenants = new Set<string>();
  if (seededTenants.has(tenantId)) return;
  seededTenants.add(tenantId);
  ensureVendorCatalogDefaults({ tenantId });
}

