import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  FinelyOsCatalogBrowser,
  type FinelyOsCatalogItem,
} from '../../features/os/FinelyOsCatalogBrowser';
import { formatPrice, type PricingPackage } from '../../config/pricingCatalog';
import { FINELY_OS_SECONDARY_BTN } from '../../features/os/finelyOsLightUi';

/** Group keys for FinelyOsCatalogBrowser grouped view — avoids long flat tables. */
export const PRICING_CATALOG_GROUP_LABELS: Record<string, string> = {
  free_core: 'Free & membership',
  restore_dfy: 'Restore programs (done-for-you)',
  letter_packs: 'Specialty letter packs',
  diy_starter: 'DIY starter',
  build: 'Building & maintenance',
  tradeline: 'Tradeline packages',
  business: 'Business credit',
  debt_legal: 'Debt & legal',
  wealth: 'Wealth builder',
  privacy: 'Privacy & ID',
  bundle: 'Bundles',
  agency: 'Agency tiers',
  other: 'Other packages',
};

export function pricingPackageGroupKey(pkg: PricingPackage): string {
  const id = pkg.id;
  if (id.startsWith('letters_pack_')) return 'letter_packs';
  if (id === 'personal_free' || id === 'personal_core') return 'free_core';
  if (id.includes('restore') || id === 'personal_platinum') return 'restore_dfy';
  if (id.startsWith('personal_build') || id.includes('maintenance')) return 'build';
  if (id === 'personal_starter') return 'diy_starter';
  if (pkg.category === 'tradeline_promo') return 'tradeline';
  if (pkg.category === 'business_credit') return 'business';
  if (pkg.category === 'debt_legal') return 'debt_legal';
  if (pkg.category === 'wealth_builder') return 'wealth';
  if (pkg.category === 'privacy_id') return 'privacy';
  if (pkg.category === 'bundle') return 'bundle';
  if (pkg.category === 'agency') return 'agency';
  return 'other';
}

function badgeClass(label: string) {
  const u = label.toUpperCase();
  if (u.includes('FREE')) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  if (u.includes('POPULAR')) return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  if (u.includes('LETTER')) return 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300';
  if (u.includes('CORE')) return 'border-violet-500/30 bg-violet-500/10 text-violet-300';
  return 'border-white/[0.08] bg-white/[0.07] text-white/60';
}

/** Compact compare chips for personal credit (replaces wide comparison tables). */
export function personalCreditCompareMeta(pkg: PricingPackage): string[] {
  if (pkg.id.startsWith('letters_pack_')) {
    return ['Specialty disputes', 'Letter templates', 'One-time unlock'];
  }
  const rounds =
    pkg.id === 'personal_starter'
      ? 'Disputes: templates only'
      : pkg.id === 'personal_free'
        ? 'Disputes: not included'
        : 'Disputes: unlimited';
  const access =
    pkg.id === 'personal_starter'
      ? 'Access: 30 days'
      : pkg.id === 'personal_restore' || pkg.id.includes('restore_starter')
        ? 'Access: 90 days'
        : pkg.id === 'personal_platinum'
          ? 'Access: 6 months'
          : pkg.interval === 'month'
            ? 'Access: monthly'
            : pkg.priceAmount === 0
              ? 'Access: free tier'
              : 'Access: program window';
  const meta = [rounds, access];
  if (pkg.id === 'personal_platinum') meta.push('Case manager + strategy session');
  return meta;
}

export function pricingPackageToCatalogItem(
  pkg: PricingPackage,
  opts?: { includePersonalCompare?: boolean },
): FinelyOsCatalogItem {
  const priceLabel =
    pkg.priceAmount === 0
      ? 'Free'
      : `${formatPrice(pkg.priceAmount)}${pkg.interval === 'month' ? '/mo' : ''}`;

  const meta = opts?.includePersonalCompare
    ? [...personalCreditCompareMeta(pkg), priceLabel]
    : [priceLabel, pkg.delivery ? `${pkg.delivery}` : ''].filter(Boolean);

  return {
    id: pkg.id,
    title: pkg.name,
    subtitle: priceLabel,
    description: pkg.tagline || pkg.description,
    groupKey: pricingPackageGroupKey(pkg),
    badges: pkg.badge ? [{ label: pkg.badge, className: badgeClass(pkg.badge) }] : undefined,
    meta,
  };
}

export function pricingPackagesToCatalogItems(
  packages: PricingPackage[],
  opts?: { includePersonalCompare?: boolean },
): FinelyOsCatalogItem[] {
  return packages
    .slice()
    .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))
    .map((p) => pricingPackageToCatalogItem(p, opts));
}

type PricingPackageCatalogProps = {
  packages: PricingPackage[];
  pageSize?: number;
  searchPlaceholder?: string;
  includePersonalCompare?: boolean;
  onSelect?: (packageId: string) => void;
  selectLabel?: string;
  emptyMessage?: string;
};

/** Paginated, grouped package browser — no long comparison tables. */
export function PricingPackageCatalog({
  packages,
  pageSize = 6,
  searchPlaceholder = 'Search packages…',
  includePersonalCompare = false,
  onSelect,
  selectLabel = 'Select',
  emptyMessage = 'No packages match your search.',
}: PricingPackageCatalogProps) {
  const items = useMemo(
    () => pricingPackagesToCatalogItems(packages, { includePersonalCompare }),
    [packages, includePersonalCompare],
  );

  return (
    <FinelyOsCatalogBrowser
      items={items}
      pageSize={pageSize}
      initialView="grid"
      groupLabels={PRICING_CATALOG_GROUP_LABELS}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      showViewToggle
      renderTrailing={
        onSelect
          ? (item) => (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(item.id);
                }}
                className={FINELY_OS_SECONDARY_BTN}
              >
                {selectLabel} <ArrowRight size={12} />
              </button>
            )
          : undefined
      }
      onItemClick={onSelect}
    />
  );
}
