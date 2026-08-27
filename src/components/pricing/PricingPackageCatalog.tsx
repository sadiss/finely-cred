import React, { useMemo, useState } from 'react';
import { ArrowRight, Info } from 'lucide-react';
import {
  FinelyOsCatalogBrowser,
  type FinelyOsCatalogCardSurface,
  type FinelyOsCatalogItem,
} from '../../features/os/FinelyOsCatalogBrowser';
import {
  formatBusinessCapitalOutlook,
  formatPrice,
  getPackageById,
  type PricingPackage,
} from '../../config/pricingCatalog';
import {
  FINELY_OS_GLOW_INCLUDES_BTN,
  FINELY_OS_INCLUDES_STANDALONE_BTN,
  FINELY_OS_INCLUDES_STANDALONE_BTN_ON_GOLD,
  FINELY_OS_PACKAGE_SELECT_BTN,
  FINELY_OS_PACKAGE_SELECT_BTN_ON_GOLD,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';
import type { FcAdminTone } from '../../features/os/finelyOsAdminSurface';
import { ServicePackageDetailModal } from './ServicePackageDetailModal';

/** Distinct solid tones per restore service family (not flattened to one color). */
function adminToneForPackage(pkg: PricingPackage): FcAdminTone {
  const id = pkg.id;
  if (id === 'personal_free') return 'emerald';
  if (id === 'personal_core') return 'sky';
  if (id === 'personal_starter') return 'teal';
  if (id.startsWith('letters_pack_')) {
    // Alternate gold / teal so letter packs stay visually distinct.
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 997;
    return h % 2 === 0 ? 'violet' : 'teal';
  }
  // Restore DFY ladder — each tier keeps its own tone in the adminSolid family.
  if (id === 'personal_restore_starter') return 'sky';
  if (id === 'personal_restore') return 'navy';
  if (id === 'personal_platinum' || id.includes('platinum')) return 'rose';
  if (id === 'personal_restore_5000') return 'violet';
  if (id === 'personal_restore_7000') return 'emerald';
  if (id === 'personal_restore_10000') return 'sky';
  if (id === 'personal_restore_custom' || id === 'debt_kill_custom') return 'rose';
  if (id.includes('restore')) return 'navy';
  return ADMIN_FALLBACK_TONES[Math.abs(id.length) % ADMIN_FALLBACK_TONES.length];
}

const ADMIN_FALLBACK_TONES: FcAdminTone[] = ['emerald', 'sky', 'violet', 'navy', 'teal', 'rose'];

/** Soft glow for non-solid catalogs; solid restore uses champagne gold standalone. */
const WHATS_INCLUDED_BTN_DEFAULT = `${FINELY_OS_GLOW_INCLUDES_BTN} !px-3 !py-2 text-[11px] sm:text-xs`;

/** Group keys for FinelyOsCatalogBrowser grouped view — avoids long flat tables. */
export const PRICING_CATALOG_GROUP_LABELS: Record<string, string> = {
  free_core: 'Free & membership',
  restore_dfy: 'Restore programs (done-for-you)',
  letter_packs: 'Specialty letter packs (DIY only)',
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
  if (u.includes('POPULAR')) return 'border-violet-500/30 bg-violet-500/10 text-violet-300';
  if (u.includes('LETTER')) return 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300';
  if (u.includes('CORE')) return 'border-violet-500/30 bg-violet-500/10 text-violet-300';
  return 'border-white/[0.08] bg-white/[0.07] text-white/60';
}

function deliveryMetaLabel(delivery?: PricingPackage['delivery']): string {
  if (delivery === 'DFY') return 'Done-for-you';
  if (delivery === 'HYBRID') return 'Hybrid partner tools';
  if (delivery === 'DIY') return 'DIY partner tools';
  return '';
}

/** Compact compare chips for personal credit (replaces wide comparison tables). */
export function personalCreditCompareMeta(pkg: PricingPackage): string[] {
  if (pkg.id.startsWith('letters_pack_')) {
    return ['Specialty disputes', 'Letter templates', 'One-time unlock', deliveryMetaLabel(pkg.delivery)].filter(Boolean);
  }
  const rounds = pkg.isCustomQuote
    ? 'Disputes: scoped after intake'
    : pkg.id === 'personal_starter'
      ? 'Disputes: templates only'
      : pkg.id === 'personal_free'
        ? 'Disputes: not included'
        : pkg.id.includes('restore') || pkg.id === 'personal_platinum' || pkg.id === 'personal_core'
          ? 'Disputes: unlimited'
          : 'Disputes: program plan';
  const access = pkg.isCustomQuote
    ? 'Access: program window (custom)'
    : pkg.id === 'personal_starter'
      ? 'Access: 30 days'
      : pkg.id === 'personal_restore' || pkg.id.includes('restore_starter')
        ? 'Access: 90 days'
        : pkg.id === 'personal_platinum'
          ? 'Access: 6 months'
          : pkg.id === 'personal_restore_5000' ||
              pkg.id === 'personal_restore_7000' ||
              pkg.id === 'personal_restore_10000'
            ? 'Access: extended window'
            : pkg.interval === 'month'
              ? 'Access: monthly'
              : pkg.priceAmount === 0
                ? 'Access: free tier'
                : 'Access: program window';
  const meta = [rounds, access];
  if (pkg.id === 'personal_platinum') meta.push('Case manager + strategy session');
  if (pkg.id === 'personal_restore_5000') meta.push('Higher-touch cadence');
  if (pkg.id === 'personal_restore_7000') meta.push('Enterprise execution');
  if (pkg.id === 'personal_restore_10000') meta.push('Maximum partner support');
  if (pkg.debtBalanceGuidance?.label) meta.push(`Fits: ${pkg.debtBalanceGuidance.label}`);
  const delivery = deliveryMetaLabel(pkg.delivery);
  if (delivery) meta.push(delivery);
  if (pkg.id.includes('restore') || pkg.id === 'personal_platinum') {
    meta.push('In-house financing option');
  }
  return meta;
}

/** Compact inclusion teasers — highlights first, then scope bullets as fill. */
function packageInclusionTeasers(pkg: PricingPackage, limit = 5): string[] {
  const fromHighlights = pkg.highlights ?? [];
  const fromScope = (pkg.scopeBullets ?? []).map((line) =>
    line.replace(/\s+/g, ' ').replace(/\.$/, '').slice(0, 72),
  );
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of [...fromHighlights, ...fromScope]) {
    const key = line.toLowerCase();
    if (!line || seen.has(key)) continue;
    seen.add(key);
    out.push(line);
    if (out.length >= limit) break;
  }
  return out;
}

export function pricingPackageToCatalogItem(
  pkg: PricingPackage,
  opts?: { includePersonalCompare?: boolean },
): FinelyOsCatalogItem {
  const priceLabel = pkg.isCustomQuote
    ? 'Custom quote'
    : pkg.priceAmount === 0
      ? 'Free'
      : `${formatPrice(pkg.priceAmount)}${pkg.interval === 'month' ? '/mo' : ''}`;

  const capital = formatBusinessCapitalOutlook(pkg);
  const meta = opts?.includePersonalCompare
    ? [...personalCreditCompareMeta(pkg), priceLabel]
    : [
        priceLabel,
        deliveryMetaLabel(pkg.delivery) || (pkg.delivery ? `${pkg.delivery}` : ''),
        capital ? `Program ${capital.programLabel}` : '',
        capital ? `Est. vendor/trade outlay ${capital.outlayLabel}` : '',
        capital ? `Potential capital (BC only) ${capital.potentialLabel}` : '',
      ].filter(Boolean);

  const highlightLimit = opts?.includePersonalCompare ? 5 : 4;
  const highlights = packageInclusionTeasers(pkg, highlightLimit);

  return {
    id: pkg.id,
    title: pkg.name,
    subtitle: capital
      ? `${priceLabel} · outlay ${capital.outlayLabel} · ${capital.potentialLabel} BC`
      : priceLabel,
    description: pkg.tagline || pkg.description,
    highlights: highlights.length ? highlights : undefined,
    groupKey: pricingPackageGroupKey(pkg),
    adminTone: adminToneForPackage(pkg),
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
  /** Admin solid/glow cards — per-service tones; pair with ivory restore shell. */
  cardSurface?: FinelyOsCatalogCardSurface;
  /** Solid black catalog panel — dark toolbar + full-color tier cards. */
  catalogDarkBed?: boolean;
  titleClassName?: string;
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
  cardSurface = 'default',
  catalogDarkBed = false,
  titleClassName,
}: PricingPackageCatalogProps) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailPkg = useMemo(
    () => (detailId ? packages.find((p) => p.id === detailId) ?? getPackageById(detailId) ?? null : null),
    [detailId, packages],
  );
  const adminSolid = cardSurface === 'adminSolid';

  const items = useMemo(
    () => pricingPackagesToCatalogItems(packages, { includePersonalCompare }),
    [packages, includePersonalCompare],
  );

  return (
    <>
      <FinelyOsCatalogBrowser
        items={items}
        pageSize={pageSize}
        initialView="grid"
        density="roomy"
        cardSurface={cardSurface}
        restorePricingChrome={adminSolid && !catalogDarkBed}
        catalogDarkBed={catalogDarkBed}
        groupLabels={PRICING_CATALOG_GROUP_LABELS}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        showViewToggle
        titleClassName={titleClassName ?? 'text-lg sm:text-xl font-semibold'}
        renderTrailing={(item) =>
          adminSolid ? (
            <div className="flex flex-col gap-2.5 w-full pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailId(item.id);
                }}
                className={
                  catalogDarkBed
                    ? FINELY_OS_INCLUDES_STANDALONE_BTN
                    : item.adminTone === 'gold'
                      ? FINELY_OS_INCLUDES_STANDALONE_BTN_ON_GOLD
                      : FINELY_OS_INCLUDES_STANDALONE_BTN
                }
                title="View full scope and deliverables"
              >
                <Info size={15} strokeWidth={2.6} /> What&apos;s included
              </button>
              {onSelect ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(item.id);
                  }}
                  className={
                    catalogDarkBed
                      ? `${FINELY_OS_PACKAGE_SELECT_BTN} w-full`
                      : item.adminTone === 'gold'
                        ? FINELY_OS_PACKAGE_SELECT_BTN_ON_GOLD
                        : FINELY_OS_PACKAGE_SELECT_BTN
                  }
                >
                  {selectLabel} <ArrowRight size={12} />
                </button>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailId(item.id);
                }}
                className={WHATS_INCLUDED_BTN_DEFAULT}
                title="View full scope and deliverables"
              >
                <Info size={13} /> What&apos;s included
              </button>
              {onSelect ? (
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
              ) : null}
            </div>
          )
        }
        onItemClick={(id) => setDetailId(id)}
      />
      <ServicePackageDetailModal
        pkg={detailPkg}
        onClose={() => setDetailId(null)}
        onSelect={onSelect}
        selectLabel={selectLabel}
      />
    </>
  );
}
