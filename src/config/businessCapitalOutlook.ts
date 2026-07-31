/**
 * Business Credit capital outlook display — program fee + vendor/trade outlay + potential BC capital.
 * Prefers `businessCapitalOutlook` on packages in pricingCatalog; mirrors owner bands when fields lag.
 */
import {
  businessCreditPackages,
  formatBusinessCapitalOutlook,
  formatPrice,
  type PricingPackage,
} from './pricingCatalog';

/** Public one-sheet + page compliance line (every BC capital surface). */
export const BC_CAPITAL_OUTLOOK_COMPLIANCE =
  'Results vary · not guaranteed · business credit only · funding subject to underwriting · outlay varies by vendors';

const BASIS_NOTE =
  'Approximate potential capital from business credit channels only (vendor trades, store cards, commercial products) — not personal credit, SBA, or other non-BC funding.';
const OUTLAY_NOTE =
  'Estimated partner cash for vendor accounts, trades, and deposits while building — varies by vendors chosen; not included in the Finely Cred program fee.';

/** Sheet id → catalog package id for the four BC tiers. */
export const BC_TIER_SHEET_TO_PACKAGE: Record<
  'foundation' | 'builder' | 'elite' | 'empire',
  string
> = {
  foundation: 'business_foundation',
  builder: 'business_builder',
  elite: 'business_elite',
  empire: 'business_empire',
};

/** Normalized three-figure outlook for one-sheets and cards. */
export type BusinessCapitalOutlookDisplay = {
  programFeeCents: number;
  programFeeLabel: string;
  vendorOutlayLabel: string;
  potentialLabel: string;
  basisNote: string;
  outlayNote: string;
  complianceNote: string;
};

type OutlookFallback = {
  programFeeCents: number;
  vendorOutlayLabel: string;
  potentialLabel: string;
};

/** Owner bands — used when catalog omits fields. */
const FALLBACK_BY_PACKAGE_ID: Record<string, OutlookFallback> = {
  business_foundation: {
    programFeeCents: 299_700,
    vendorOutlayLabel: '$500–$2,500',
    potentialLabel: '$15K–$50K',
  },
  business_builder: {
    programFeeCents: 599_700,
    vendorOutlayLabel: '$2,000–$8,000',
    potentialLabel: '$50K–$150K',
  },
  business_elite: {
    programFeeCents: 1_299_700,
    vendorOutlayLabel: '$5,000–$20,000',
    potentialLabel: '$150K–$350K',
  },
  business_empire: {
    programFeeCents: 2_499_700,
    vendorOutlayLabel: '$15,000–$50,000',
    potentialLabel: '$350K–$750K+',
  },
};

export function getBusinessCapitalOutlookDisplay(
  packageId: string,
): BusinessCapitalOutlookDisplay | undefined {
  const fallback = FALLBACK_BY_PACKAGE_ID[packageId];
  if (!fallback) return undefined;
  const pkg = businessCreditPackages.find((p) => p.id === packageId);
  const formatted = pkg ? formatBusinessCapitalOutlook(pkg) : null;
  const o = pkg?.businessCapitalOutlook;

  const programFeeCents = o?.programFeeCents ?? pkg?.priceAmount ?? fallback.programFeeCents;

  return {
    programFeeCents,
    programFeeLabel: formatted?.programLabel ?? formatPrice(programFeeCents),
    vendorOutlayLabel: formatted?.outlayLabel ?? o?.outlayLabel ?? fallback.vendorOutlayLabel,
    potentialLabel: formatted?.potentialLabel ?? o?.potentialLabel ?? fallback.potentialLabel,
    basisNote: formatted?.basisNote ?? o?.basisNote ?? BASIS_NOTE,
    outlayNote: formatted?.outlayNote ?? o?.outlayNote ?? OUTLAY_NOTE,
    complianceNote: BC_CAPITAL_OUTLOOK_COMPLIANCE,
  };
}

export function getBusinessCapitalOutlookForTierSheet(
  sheetId: 'foundation' | 'builder' | 'elite' | 'empire',
): BusinessCapitalOutlookDisplay | undefined {
  return getBusinessCapitalOutlookDisplay(BC_TIER_SHEET_TO_PACKAGE[sheetId]);
}

export function getBusinessCapitalOutlookFromPackage(
  pkg: PricingPackage,
): BusinessCapitalOutlookDisplay | undefined {
  return getBusinessCapitalOutlookDisplay(pkg.id);
}

export type BusinessCreditCapitalTierRow = {
  packageId: string;
  sheetId: 'foundation' | 'builder' | 'elite' | 'empire';
  name: string;
  outlook: BusinessCapitalOutlookDisplay;
  programFeeLabel: string;
  vendorOutlayLabel: string;
  potentialLabel: string;
};

/** All four tiers with program → outlay → potential (catalog-first). */
export function listBusinessCreditCapitalTiers(): BusinessCreditCapitalTierRow[] {
  return (Object.keys(BC_TIER_SHEET_TO_PACKAGE) as Array<keyof typeof BC_TIER_SHEET_TO_PACKAGE>).map(
    (sheetId) => {
      const packageId = BC_TIER_SHEET_TO_PACKAGE[sheetId];
      const outlook = getBusinessCapitalOutlookDisplay(packageId)!;
      const pkg = businessCreditPackages.find((p) => p.id === packageId);
      return {
        packageId,
        sheetId,
        name: pkg?.name?.replace(/^Business\s+/i, '') ?? sheetId,
        outlook,
        programFeeLabel: outlook.programFeeLabel,
        vendorOutlayLabel: outlook.vendorOutlayLabel,
        potentialLabel: outlook.potentialLabel,
      };
    },
  );
}
