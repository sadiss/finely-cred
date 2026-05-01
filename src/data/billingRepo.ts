import {
  Agreement,
  AgreementEvent,
  AgreementStatus,
  BillingAccount,
  BillingAccountStatus,
  BillingProduct,
  BillingRail,
  Entitlement,
  PriceOption,
  nowIso,
  FINELY_TENANT_ID,
} from '../domain/billing';
import { loadJson, saveJson } from './localJsonStore';
import { getPackageById, type PricingPackage } from '../config/pricingCatalog';

const KEY = 'finely.billing.v1';

type Store = {
  billingAccounts: BillingAccount[];
  /** @deprecated Use pricingCatalog.ts instead */
  products: BillingProduct[];
  /** @deprecated Use pricingCatalog.ts instead */
  priceOptions: PriceOption[];
  agreements: Agreement[];
  agreementEvents: AgreementEvent[];
  entitlements: Entitlement[];
};

/**
 * @deprecated Legacy products - use pricingCatalog.ts for new code
 */
const DEFAULT_PRODUCTS: BillingProduct[] = [
  {
    id: 'prod_personal_restore',
    name: 'Personal Credit Restore',
    category: 'personal',
    description: 'Disputes, evidence capture, bureau rounds, and compliance support.',
    isPublic: true,
  },
  {
    id: 'prod_business_foundation',
    name: 'Business Credit Foundation',
    category: 'business',
    description: 'Entity setup checklist, vendor sequencing, and fundability planning.',
    isPublic: true,
  },
  {
    id: 'prod_debt_legal',
    name: 'Debt & Summons Resolution',
    category: 'legal',
    description: 'Debt defense workflow, summons response, and escalation tracking.',
    isPublic: true,
  },
];

/**
 * @deprecated Legacy price options - use pricingCatalog.ts for new code
 */
const DEFAULT_PRICE_OPTIONS: PriceOption[] = [
  {
    id: 'price_personal_short',
    productId: 'prod_personal_restore',
    rail: 'stripe',
    label: '3-6 payments (standard)',
    amount: 2499,
    currency: 'USD',
    interval: 'month',
    termMonths: 6,
  },
  {
    id: 'price_personal_finance',
    productId: 'prod_personal_restore',
    rail: 'in_house',
    label: '12-24 month financing',
    amount: 399,
    currency: 'USD',
    interval: 'month',
    termMonths: 24,
  },
  {
    id: 'price_business_short',
    productId: 'prod_business_foundation',
    rail: 'stripe',
    label: '3-6 payments (standard)',
    amount: 2999,
    currency: 'USD',
    interval: 'month',
    termMonths: 6,
  },
  {
    id: 'price_business_finance',
    productId: 'prod_business_foundation',
    rail: 'in_house',
    label: '12-36 month financing',
    amount: 499,
    currency: 'USD',
    interval: 'month',
    termMonths: 36,
  },
  {
    id: 'price_debt_short',
    productId: 'prod_debt_legal',
    rail: 'stripe',
    label: 'Short-term service plan',
    amount: 1999,
    currency: 'USD',
    interval: 'month',
    termMonths: 6,
  },
  {
    id: 'price_debt_finance',
    productId: 'prod_debt_legal',
    rail: 'in_house',
    label: 'In-house financing',
    amount: 349,
    currency: 'USD',
    interval: 'month',
    termMonths: 24,
  },
];

function loadStore(): Store {
  const store = loadJson<Store>(
    KEY,
    {
      billingAccounts: [],
      products: DEFAULT_PRODUCTS,
      priceOptions: DEFAULT_PRICE_OPTIONS,
      agreements: [],
      agreementEvents: [],
      entitlements: [],
    },
    1,
  );
  if (store.products.length === 0) store.products = DEFAULT_PRODUCTS;
  if (store.priceOptions.length === 0) store.priceOptions = DEFAULT_PRICE_OPTIONS;
  return store;
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function newId(prefix: string) {
  return crypto?.randomUUID ? `${prefix}_${crypto.randomUUID()}` : `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

/**
 * @deprecated Use pricingCatalog.ts instead
 */
export function listBillingProducts(): BillingProduct[] {
  return loadStore().products;
}

/**
 * @deprecated Use pricingCatalog.ts instead
 */
export function listPriceOptions(productId?: string): PriceOption[] {
  const all = loadStore().priceOptions;
  return productId ? all.filter((p) => p.productId === productId) : all;
}

export function getBillingAccountForPartner(partnerId: string): BillingAccount | null {
  return loadStore().billingAccounts.find((b) => b.partnerId === partnerId) ?? null;
}

export function createBillingAccount(
  partnerId: string,
  tenantId: string = FINELY_TENANT_ID,
  status: BillingAccountStatus = 'active'
): BillingAccount {
  const store = loadStore();
  const existing = store.billingAccounts.find((b) => b.partnerId === partnerId);
  if (existing) return existing;
  const now = nowIso();
  const next: BillingAccount = {
    id: newId('bill'),
    tenantId,
    partnerId,
    status,
    createdAt: now,
    updatedAt: now,
  };
  store.billingAccounts.push(next);
  saveStore(store);
  return next;
}

export function listAgreementsByPartner(partnerId: string): Agreement[] {
  return loadStore()
    .agreements.filter((a) => a.partnerId === partnerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listAgreementsByTenant(tenantId: string): Agreement[] {
  return loadStore()
    .agreements.filter((a) => a.tenantId === tenantId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getAgreement(agreementId: string): Agreement | null {
  return loadStore().agreements.find((a) => a.id === agreementId) ?? null;
}

export function patchAgreement(agreementId: string, patch: Partial<Omit<Agreement, 'id' | 'createdAt' | 'partnerId' | 'tenantId'>>): Agreement | null {
  const store = loadStore();
  const idx = store.agreements.findIndex((a) => a.id === agreementId);
  if (idx < 0) return null;
  const now = nowIso();
  const updated: Agreement = {
    ...store.agreements[idx]!,
    ...patch,
    id: store.agreements[idx]!.id,
    tenantId: store.agreements[idx]!.tenantId,
    partnerId: store.agreements[idx]!.partnerId,
    createdAt: store.agreements[idx]!.createdAt,
    updatedAt: now,
  };
  store.agreements[idx] = updated;
  saveStore(store);
  return updated;
}

/**
 * @deprecated Use createAgreementFromPackage instead
 */
export function createAgreement(args: {
  partnerId: string;
  billingAccountId: string;
  productId: string;
  priceOptionId: string;
  rail: BillingRail;
  status?: AgreementStatus;
}): Agreement {
  const store = loadStore();
  const now = nowIso();
  const next: Agreement = {
    id: newId('agree'),
    tenantId: FINELY_TENANT_ID,
    billingAccountId: args.billingAccountId,
    partnerId: args.partnerId,
    packageId: args.productId, // Use productId as packageId for legacy
    productId: args.productId,
    priceOptionId: args.priceOptionId,
    rail: args.rail,
    amountCents: 0, // Legacy - unknown
    status: args.status ?? (args.rail === 'in_house' ? 'pending_review' : 'draft'),
    createdAt: now,
    updatedAt: now,
  };
  store.agreements.push(next);
  store.agreementEvents.push({
    id: newId('event'),
    agreementId: next.id,
    kind: 'agreement_created',
    createdAt: now,
  });
  saveStore(store);
  return next;
}

/**
 * Create an agreement from a pricing catalog package
 */
export function createAgreementFromPackage(args: {
  tenantId: string;
  partnerId: string;
  billingAccountId: string;
  packageId: string;
  rail: BillingRail;
  status?: AgreementStatus;
  denefitsContractUrl?: string;
  externalRef?: string;
}): Agreement | null {
  const pkg = getPackageById(args.packageId);
  if (!pkg) return null;

  const store = loadStore();
  const now = nowIso();
  const next: Agreement = {
    id: newId('agree'),
    tenantId: args.tenantId,
    billingAccountId: args.billingAccountId,
    partnerId: args.partnerId,
    packageId: args.packageId,
    rail: args.rail,
    amountCents: pkg.priceAmount,
    status: args.status ?? (args.rail === 'in_house' ? 'pending_review' : 'draft'),
    denefitsContractUrl: args.denefitsContractUrl,
    externalRef: args.externalRef,
    createdAt: now,
    updatedAt: now,
  };
  store.agreements.push(next);
  store.agreementEvents.push({
    id: newId('event'),
    agreementId: next.id,
    kind: 'agreement_created',
    createdAt: now,
  });
  saveStore(store);
  return next;
}

export function addAgreementEvent(args: { agreementId: string; kind: string; payload?: Record<string, any> }): AgreementEvent {
  const store = loadStore();
  const now = nowIso();
  const next: AgreementEvent = {
    id: newId('event'),
    agreementId: args.agreementId,
    kind: args.kind,
    createdAt: now,
    payload: args.payload,
  };
  store.agreementEvents.push(next);
  saveStore(store);
  return next;
}

export function updateAgreementStatus(agreementId: string, status: AgreementStatus) {
  const store = loadStore();
  const idx = store.agreements.findIndex((a) => a.id === agreementId);
  if (idx < 0) return null;
  const now = nowIso();
  const updated = { ...store.agreements[idx], status, updatedAt: now };
  store.agreements[idx] = updated;
  store.agreementEvents.push({
    id: newId('event'),
    agreementId,
    kind: `status_${status}`,
    createdAt: now,
  });
  saveStore(store);
  return updated;
}

export function listAgreementEvents(agreementId: string): AgreementEvent[] {
  return loadStore().agreementEvents.filter((e) => e.agreementId === agreementId);
}

export function listEntitlementsByPartner(partnerId: string): Entitlement[] {
  return loadStore().entitlements.filter((e) => e.partnerId === partnerId);
}

export function listEntitlementsByTenant(tenantId: string): Entitlement[] {
  return loadStore().entitlements.filter((e) => e.tenantId === tenantId);
}

/**
 * Replace local billing cache with a server snapshot (Supabase-backed).
 * This keeps the rest of the app (sync `hasEntitlement`) working without async plumbing.
 */
export function replaceBillingSnapshotForPartner(args: {
  partnerId: string;
  agreements?: Agreement[];
  entitlements?: Entitlement[];
  agreementEvents?: AgreementEvent[];
}) {
  const partnerId = String(args.partnerId || '').trim();
  if (!partnerId) return;
  const store = loadStore();
  const next: Store = { ...store };

  if (args.agreements) {
    next.agreements = [...next.agreements.filter((a) => a.partnerId !== partnerId), ...args.agreements];
  }
  if (args.entitlements) {
    next.entitlements = [...next.entitlements.filter((e) => e.partnerId !== partnerId), ...args.entitlements];
  }
  if (args.agreementEvents) {
    const keep = new Set((args.agreements ?? []).map((a) => a.id));
    next.agreementEvents = [
      ...next.agreementEvents.filter((e) => {
        // keep events for other partners; for this partner, keep events only for agreements not included in snapshot
        const isThisPartnerAgreement = store.agreements.some((a) => a.partnerId === partnerId && a.id === e.agreementId);
        if (!isThisPartnerAgreement) return true;
        return !keep.has(e.agreementId);
      }),
      ...args.agreementEvents,
    ];
  }

  saveStore(next);
}

export function grantEntitlement(args: {
  tenantId?: string;
  partnerId: string;
  key: string;
  sourceAgreementId?: string;
  status?: Entitlement['status'];
  endsAt?: string;
}): Entitlement {
  const store = loadStore();
  const now = nowIso();
  const next: Entitlement = {
    id: newId('ent'),
    tenantId: args.tenantId ?? FINELY_TENANT_ID,
    partnerId: args.partnerId,
    key: args.key,
    sourceAgreementId: args.sourceAgreementId,
    status: args.status ?? 'active',
    startsAt: now,
    endsAt: args.endsAt,
  };
  store.entitlements.push(next);
  saveStore(store);
  return next;
}

export function setEntitlementStatus(entitlementId: string, status: Entitlement['status']): Entitlement | null {
  const id = (entitlementId || '').trim();
  if (!id) return null;
  const store = loadStore();
  const idx = store.entitlements.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const next: Entitlement = { ...store.entitlements[idx]!, status };
  store.entitlements[idx] = next;
  saveStore(store);
  return next;
}

export function revokeEntitlementsByPartnerKey(args: { partnerId: string; key: string }): number {
  const partnerId = (args.partnerId || '').trim();
  const key = (args.key || '').trim();
  if (!partnerId || !key) return 0;
  const store = loadStore();
  let count = 0;
  store.entitlements = store.entitlements.map((e) => {
    if (e.partnerId !== partnerId) return e;
    if (e.key !== key) return e;
    if (e.status !== 'active') return e;
    count += 1;
    return { ...e, status: 'revoked' as const };
  });
  if (count) saveStore(store);
  return count;
}

/**
 * Grant all entitlements from a package to a partner
 */
export function grantEntitlementsFromPackage(args: {
  tenantId: string;
  partnerId: string;
  packageId: string;
  sourceAgreementId: string;
  /** When present, enables rail-specific package entitlements. */
  rail?: BillingRail;
  endsAt?: string;
}): Entitlement[] {
  const pkg = getPackageById(args.packageId);
  if (!pkg) return [];

  const derivedEndsAt = (() => {
    if (args.endsAt) return args.endsAt;
    // Lightweight “subscription” semantics: if a package is monthly, grant entitlements with an expiry.
    if (pkg.interval !== 'month') return undefined;
    const months = Math.max(1, Math.round(pkg.termMonths ?? 1));
    const ms = months * 30 * 24 * 60 * 60 * 1000;
    return new Date(Date.now() + ms).toISOString();
  })();

  // Module-level entitlements (portal access) — derived from package metadata.
  // This keeps purchases aligned with gating in Partner Portal (letters/disputes/debt/etc).
  const derivedModuleKeys = (() => {
    const base = ['portal.reports', 'portal.documents', 'portal.messages', 'portal.tasks', 'portal.courses'];
    if (pkg.category === 'business_credit') return [...base, 'portal.business.build'];
    if (pkg.category === 'debt_legal') return [...base, 'portal.debt', 'portal.letters', 'portal.escalations', 'portal.templates'];
    if (pkg.category === 'personal_credit') {
      // Personal credit: align gating with the pricing copy.
      const isRestore =
        pkg.id.startsWith('personal_restore') ||
        pkg.id === 'personal_platinum' ||
        pkg.id.startsWith('personal_restore_') ||
        pkg.id === 'personal_restore';
      const isCore = pkg.id === 'personal_core';
      const isFree = pkg.id === 'personal_free';
      const isStarter = pkg.id === 'personal_starter';
      const isBuild = pkg.id.startsWith('personal_build');
      const isLetterPack = pkg.id.startsWith('letters_pack_');
      // Free: analyzer + vaults + tasks, but no disputes/letters.
      if (isFree) return base;
      // Specialty packs require the core modules to be useful.
      if (isLetterPack) return [...base, 'portal.disputes', 'portal.letters', 'portal.templates'];
      // Core membership: ongoing access to dispute + letters.
      if (isCore) return [...base, 'portal.disputes', 'portal.letters', 'portal.templates'];
      // Starter DIY: include disputes + basic letters/templates access.
      if (isStarter) return [...base, 'portal.disputes', 'portal.letters', 'portal.templates'];
      // Build lane packages: keep tools + letters available for execution.
      if (isBuild) return [...base, 'portal.disputes', 'portal.letters', 'portal.templates'];
      if (isRestore) return [...base, 'portal.disputes', 'portal.letters', 'portal.identity_theft', 'portal.templates'];
      return base;
    }
    if (pkg.category === 'privacy_id') {
      return [...base, 'portal.identity_theft'];
    }
    if (pkg.category === 'bundle') {
      return [
        ...base,
        'portal.disputes',
        'portal.letters',
        'portal.identity_theft',
        'portal.templates',
        'portal.debt',
        'portal.escalations',
        'portal.business.build',
      ];
    }
    return base;
  })();

  const granted: Entitlement[] = [];
  const packageEntitlementKeys =
    args.rail && pkg.entitlementKeysByRail?.[args.rail]
      ? pkg.entitlementKeysByRail[args.rail]!
      : pkg.entitlementKeys || [];
  const keys = Array.from(new Set([...(packageEntitlementKeys || []), ...derivedModuleKeys]));
  for (const key of keys) {
    const ent = grantEntitlement({
      tenantId: args.tenantId,
      partnerId: args.partnerId,
      key,
      sourceAgreementId: args.sourceAgreementId,
      endsAt: derivedEndsAt,
    });
    granted.push(ent);
  }
  return granted;
}

/**
 * Check if a partner has a specific entitlement (active)
 */
export function hasEntitlement(partnerId: string, key: string): boolean {
  const now = new Date().toISOString();
  return loadStore().entitlements.some(
    (e) =>
      e.partnerId === partnerId &&
      e.key === key &&
      e.status === 'active' &&
      (!e.endsAt || e.endsAt > now)
  );
}
