import type { BookstoreProduct } from '../domain/bookstore';
import { listBookstoreProducts } from '../data/bookstoreRepo';
import { splitBookIntoChapters } from '../domain/libraryEntitlements';

export type BookstoreBundle = {
  id: string;
  slug: string;
  title: string;
  description: string;
  /** Product slugs included */
  bookSlugs: string[];
  /** Bundle price in cents (discounted vs sum of parts) */
  priceAmount: number;
  /** Badge e.g. "Read + Listen" */
  badge?: string;
  published: boolean;
};

export const BOOKSTORE_BUNDLES: BookstoreBundle[] = [
  {
    id: 'bundle_restore_stack',
    slug: 'credit-restore-stack',
    title: 'Credit Restore Stack',
    description: 'Blueprint + Administrative Remedy — read + neural listen bundle for dispute workflow mastery.',
    bookSlugs: ['sovereign-blueprint', 'administrative-remedy'],
    priceAmount: 129900,
    badge: 'Read + Listen',
    published: true,
  },
  {
    id: 'bundle_business_stack',
    slug: 'business-funding-stack',
    title: 'Business Funding Stack',
    description: 'Corporate Architect + Blueprint — entity hygiene plus personal file stabilization.',
    bookSlugs: ['corporate-architect', 'sovereign-blueprint'],
    priceAmount: 109900,
    badge: 'Bundle save 15%',
    published: true,
  },
  {
    id: 'bundle_technical_stack',
    slug: 'technical-dispute-stack',
    title: 'Technical Dispute Stack',
    description: 'Metro2 Field Forensics + e-OSCAR Protocols + Re-Aging & DOFD — the operator trilogy for field-level disputes.',
    bookSlugs: ['metro2-field-forensics', 'eoscar-furnisher-protocols', 'reaging-dofd-trap'],
    priceAmount: 189900,
    badge: 'Operator trilogy',
    published: true,
  },
  {
    id: 'bundle_business_bureau',
    slug: 'business-bureau-mastery',
    title: 'Business Bureau Mastery',
    description: 'Corporate Architect + Paydex vs Intelliscore Gap + Deposit Relationship Scorecards.',
    bookSlugs: ['corporate-architect', 'paydex-intelliscore-gap', 'deposit-relationship-scorecards'],
    priceAmount: 169900,
    badge: 'Business lane',
    published: true,
  },
];

export function listPublishedBundles(): BookstoreBundle[] {
  return BOOKSTORE_BUNDLES.filter((b) => b.published);
}

export function getBundleBySlug(slug: string): BookstoreBundle | null {
  const s = slug.trim().toLowerCase();
  return BOOKSTORE_BUNDLES.find((b) => b.slug.toLowerCase() === s && b.published) ?? null;
}

export function resolveBundleProducts(bundle: BookstoreBundle): BookstoreProduct[] {
  const all = listBookstoreProducts();
  return bundle.bookSlugs
    .map((slug) => all.find((p) => p.slug === slug))
    .filter((p): p is BookstoreProduct => Boolean(p));
}

export function bundleListPriceCents(bundle: BookstoreBundle): number {
  return resolveBundleProducts(bundle).reduce((sum, p) => sum + p.priceAmount, 0);
}

export function bundleSavingsCents(bundle: BookstoreBundle): number {
  return Math.max(0, bundleListPriceCents(bundle) - bundle.priceAmount);
}

/** First N chapters as public preview (Phase 16). */
export function previewChaptersForProduct(product: BookstoreProduct, maxChapters = 2) {
  const chapters = splitBookIntoChapters(product.contentMarkdown ?? '', product.slug);
  return chapters.slice(0, maxChapters).map((c) => ({
    ...c,
    body: c.body.slice(0, 1200) + (c.body.length > 1200 ? '…' : ''),
    isPreview: true as const,
  }));
}
