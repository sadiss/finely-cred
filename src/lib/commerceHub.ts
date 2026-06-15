import type { BookstoreProduct } from '../domain/bookstore';
import { emitPurchaseCompleted } from '../domain/platformEvents';
import { grantLibraryBook } from '../data/libraryRepo';
import {
  createAgreementFromPackage,
  createBillingAccount,
  getAgreement,
  getBillingAccountForPartner,
  grantEntitlement,
  grantEntitlementsFromPackage,
  updateAgreementStatus,
} from '../data/billingRepo';
import { libraryEntitlementKey } from '../domain/libraryEntitlements';
import { FINELY_TENANT_ID } from '../domain/tenants';
import { enrollLeadInNurtureSequence } from './nurtureEngine';
import { createInvoiceForPackage } from './invoiceEngine';
import { getPackageById } from '../config/pricingCatalog';
import { listPartnersLocal } from '../data/partnersRepo';
import { onTradelinePackagePurchased } from './tradelineMarketplaceHub';
import type { BookstoreBundle } from './bookstoreCommerce';
import { getBundleBySlug, resolveBundleProducts } from './bookstoreCommerce';

export type TradelinePurchaseResult = {
  ok: boolean;
  message: string;
  agreementId?: string;
  tasksCreated?: number;
};

export type BookPurchaseResult = {
  ok: boolean;
  message: string;
  agreementId?: string;
};

/** Local / demo book purchase — grants library + fires platform event. */
export function completeBookPurchase(args: {
  partnerId: string;
  product: BookstoreProduct;
  tenantId?: string;
  force?: boolean;
  leadId?: string;
}): BookPurchaseResult {
  const tenantId = args.tenantId ?? FINELY_TENANT_ID;
  const agreementId = `book_${args.product.slug}_${Date.now()}`;

  if (!getBillingAccountForPartner(args.partnerId)) {
    createBillingAccount(args.partnerId, tenantId);
  }

  grantEntitlement({
    tenantId,
    partnerId: args.partnerId,
    key: libraryEntitlementKey(args.product.slug),
    sourceAgreementId: agreementId,
    status: 'active',
  });

  grantLibraryBook({
    partnerId: args.partnerId,
    bookSlug: args.product.slug,
    source: args.force ? 'admin_grant' : 'purchase',
    agreementId,
  });

  emitPurchaseCompleted({
    tenantId,
    partnerId: args.partnerId,
    productType: 'book',
    productId: args.product.slug,
    amountCents: args.product.priceAmount,
    payload: { title: args.product.title },
  });

  const partner = listPartnersLocal().find((p) => p.id === args.partnerId);
  enrollLeadInNurtureSequence({
    leadId: args.leadId ?? args.partnerId,
    sequenceId: 'seq_ebook_purchase',
    tenantId,
    context: {
      bookSlug: args.product.slug,
      bookTitle: args.product.title,
      email: partner?.profile.email ?? '',
      fullName: partner?.profile.fullName ?? '',
      immediateWelcomeSent: true,
    },
  });

  void import('./funnelEmail').then(({ sendPurchaseWelcomeEmail }) =>
    sendPurchaseWelcomeEmail({
      partnerId: args.partnerId,
      productTitle: args.product.title,
      purchaseType: 'ebook',
      leadId: args.leadId,
    }).catch(() => {}),
  );

  return {
    ok: true,
    message: `"${args.product.title}" added to My Library.`,
    agreementId,
  };
}

/** Bundle purchase — grants every title in the pack (Phase 16). */
export function completeBundlePurchase(args: {
  partnerId: string;
  bundle: BookstoreBundle;
  tenantId?: string;
  force?: boolean;
  leadId?: string;
}): BookPurchaseResult {
  const products = resolveBundleProducts(args.bundle);
  if (!products.length) return { ok: false, message: 'Bundle has no published titles.' };

  const agreementId = `bundle_${args.bundle.slug}_${Date.now()}`;
  for (const product of products) {
    completeBookPurchase({
      partnerId: args.partnerId,
      product,
      tenantId: args.tenantId,
      force: args.force,
      leadId: args.leadId,
    });
  }

  emitPurchaseCompleted({
    tenantId: args.tenantId ?? FINELY_TENANT_ID,
    partnerId: args.partnerId,
    productType: 'book',
    productId: args.bundle.slug,
    amountCents: args.bundle.priceAmount,
    payload: { title: args.bundle.title, bundle: true, bookCount: products.length },
  });

  return {
    ok: true,
    message: `${args.bundle.title} unlocked — ${products.length} book(s) in My Library.`,
    agreementId,
  };
}

/** Local / demo tradeline package purchase — entitlements + Work OS + nurture. */
export function completeTradelinePurchase(args: {
  partnerId: string;
  packageId: string;
  tenantId?: string;
  leadId?: string;
  rail?: 'stripe' | 'in_house';
}): TradelinePurchaseResult {
  const tenantId = args.tenantId ?? FINELY_TENANT_ID;
  const pkg = getPackageById(args.packageId);
  if (!pkg || pkg.category !== 'tradeline_promo') {
    return { ok: false, message: 'Tradeline package not found.' };
  }

  let billingAccount = getBillingAccountForPartner(args.partnerId);
  if (!billingAccount) {
    billingAccount = createBillingAccount(args.partnerId, tenantId);
  }

  const agreement = createAgreementFromPackage({
    tenantId,
    partnerId: args.partnerId,
    billingAccountId: billingAccount.id,
    packageId: args.packageId,
    rail: args.rail ?? 'in_house',
    status: 'active',
  });
  if (!agreement) return { ok: false, message: 'Could not create agreement.' };

  updateAgreementStatus(agreement.id, 'active');
  grantEntitlementsFromPackage({
    tenantId,
    partnerId: args.partnerId,
    packageId: args.packageId,
    sourceAgreementId: agreement.id,
    rail: args.rail ?? 'in_house',
  });

  const { tasksCreated } = onTradelinePackagePurchased({
    partnerId: args.partnerId,
    packageId: args.packageId,
    package: pkg,
    leadId: args.leadId,
  });

  return {
    ok: true,
    message: `${pkg.name} activated — ${tasksCreated} onboarding task(s) created.`,
    agreementId: agreement.id,
    tasksCreated,
  };
}

export type PackagePurchaseResult = {
  ok: boolean;
  message: string;
  agreementId?: string;
  productType?: 'package' | 'tradeline';
  tasksCreated?: number;
};

/** Activate a package after Stripe webhook or local checkout verify (Phase 15). */
export function completePackagePurchase(args: {
  partnerId: string;
  packageId: string;
  agreementId: string;
  tenantId?: string;
  rail?: 'stripe' | 'in_house';
  amountCents?: number;
  leadId?: string;
  skipIfAlreadyActive?: boolean;
}): PackagePurchaseResult {
  const tenantId = args.tenantId ?? FINELY_TENANT_ID;
  const pkg = getPackageById(args.packageId);
  if (!pkg) return { ok: false, message: 'Package not found.' };

  const existing = getBillingAccountForPartner(args.partnerId);
  if (!existing) createBillingAccount(args.partnerId, tenantId);

  const agreement = getAgreement(args.agreementId);
  if (args.skipIfAlreadyActive && agreement?.status === 'active') {
    return { ok: true, message: 'Plan already active.', agreementId: args.agreementId, productType: 'package' };
  }

  if (pkg.category === 'tradeline_promo') {
    updateAgreementStatus(args.agreementId, 'active');
    grantEntitlementsFromPackage({
      tenantId,
      partnerId: args.partnerId,
      packageId: args.packageId,
      sourceAgreementId: args.agreementId,
      rail: args.rail ?? 'stripe',
    });
    const { tasksCreated } = onTradelinePackagePurchased({
      partnerId: args.partnerId,
      packageId: args.packageId,
      package: pkg,
      leadId: args.leadId,
    });
    emitPurchaseCompleted({
      tenantId,
      partnerId: args.partnerId,
      productType: 'tradeline',
      productId: args.packageId,
      amountCents: args.amountCents ?? pkg.priceAmount,
      payload: { agreementId: args.agreementId, title: pkg.name, rail: args.rail ?? 'stripe' },
    });
    return {
      ok: true,
      message: `${pkg.name} activated — ${tasksCreated} onboarding task(s).`,
      agreementId: args.agreementId,
      productType: 'tradeline',
      tasksCreated,
    };
  }

  updateAgreementStatus(args.agreementId, 'active');
  grantEntitlementsFromPackage({
    tenantId,
    partnerId: args.partnerId,
    packageId: args.packageId,
    sourceAgreementId: args.agreementId,
    rail: args.rail ?? 'stripe',
  });

  emitPurchaseCompleted({
    tenantId,
    partnerId: args.partnerId,
    productType: 'package',
    productId: args.packageId,
    amountCents: args.amountCents ?? pkg.priceAmount,
    payload: { agreementId: args.agreementId, title: pkg.name, rail: args.rail ?? 'stripe' },
  });

  if (args.leadId) {
    enrollLeadInNurtureSequence({
      leadId: args.leadId,
      sequenceId: 'seq_ebook_purchase',
      tenantId,
      context: { packageId: args.packageId, packageName: pkg.name },
    });
  }

  try {
    createInvoiceForPackage({
      partnerId: args.partnerId,
      packageId: args.packageId,
      agreementId: args.agreementId,
      sendEmail: true,
    });
  } catch {
    /* invoice optional if package price zero */
  }

  return {
    ok: true,
    message: `${pkg.name} is now active — portal modules unlocked.`,
    agreementId: args.agreementId,
    productType: 'package',
  };
}
