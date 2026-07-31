/**
 * Work/outcome quote engine for Business Credit — maturity, destination, named cards → tier.
 */
import { businessCreditPackages, formatPrice, type PricingPackage } from './pricingCatalog';

export type BusinessMaturity = 'startup' | 'early' | 'established';
export type BusinessDestination = 'G1_vendor' | 'G2_fundability' | 'G3_named_cards' | 'G4_scale';

export type BusinessCreditQuoteInput = {
  maturity: BusinessMaturity;
  destination: BusinessDestination;
  wantsNamedCards: boolean;
  namedProducts?: string;
  delivery: 'HYBRID' | 'DFY';
};

export type BusinessCreditQuoteResult = {
  packageId: string;
  pkg: PricingPackage;
  basePriceCents: number;
  establishedUpliftCents: number;
  namedCardAddOnCents: number;
  totalPriceCents: number;
  totalLabel: string;
  why: string[];
  hoursEstimate: string;
};

const BASE: Record<string, number> = {
  business_foundation: 299700,
  business_builder: 599700,
  business_elite: 1299700,
  business_empire: 2499700,
};

export function recommendBusinessCreditPackage(input: BusinessCreditQuoteInput): BusinessCreditQuoteResult {
  let packageId = 'business_foundation';

  if (input.destination === 'G4_scale' || (input.maturity === 'established' && input.wantsNamedCards)) {
    packageId = 'business_empire';
  } else if (input.destination === 'G3_named_cards' || input.wantsNamedCards) {
    packageId = 'business_elite';
  } else if (input.destination === 'G2_fundability' || input.delivery === 'DFY') {
    packageId = 'business_builder';
  } else {
    packageId = 'business_foundation';
  }

  if (input.maturity === 'established' && packageId === 'business_foundation') {
    packageId = 'business_builder';
  }
  if (input.maturity === 'established' && packageId === 'business_builder' && input.destination !== 'G1_vendor') {
    packageId = 'business_elite';
  }

  const pkg = businessCreditPackages.find((p) => p.id === packageId) ?? businessCreditPackages[0];
  const basePriceCents = BASE[packageId] ?? pkg.priceAmount;

  let establishedUpliftCents = 0;
  if (input.maturity === 'established') {
    if (packageId === 'business_foundation') establishedUpliftCents = 120000;
    else if (packageId === 'business_builder') establishedUpliftCents = 200000;
    else if (packageId === 'business_elite') establishedUpliftCents = 350000;
    else establishedUpliftCents = 500000; // empire custom band start
  }

  const namedCardAddOnCents =
    input.wantsNamedCards && packageId !== 'business_elite' && packageId !== 'business_empire' ? 199700 : 0;

  const totalPriceCents = basePriceCents + establishedUpliftCents + namedCardAddOnCents;

  const why: string[] = [];
  why.push(
    input.maturity === 'startup'
      ? 'Startup / new entity — sequencing-heavy, lighter historical cleanup.'
      : input.maturity === 'early'
        ? 'Early operator — mixed file; medium research + vendor depth.'
        : 'Established (3+ years) — often more specialist hours for cleanup, mismatches, and aged tradelines.',
  );
  why.push(
    {
      G1_vendor: 'Destination: vendor-ready / first reportables.',
      G2_fundability: 'Destination: funding-ready trade depth.',
      G3_named_cards: 'Destination: named cards / specific lender products (process tracking — not guaranteed approval).',
      G4_scale: 'Destination: scale / multi-entity / aggressive capital path.',
    }[input.destination],
  );
  if (input.wantsNamedCards) {
    why.push(
      input.namedProducts?.trim()
        ? `Named products requested: ${input.namedProducts.trim()}.`
        : 'Named card/product path requested — custom ladder + underwriting packaging.',
    );
  }
  why.push(`Delivery: ${input.delivery === 'DFY' ? 'done-for-you specialist cycles' : 'hybrid guided + specialist support'}.`);

  const hoursEstimate =
    packageId === 'business_empire'
      ? '40–80+ specialist hours across the engagement'
      : packageId === 'business_elite'
        ? '25–45 specialist hours'
        : packageId === 'business_builder'
          ? '15–30 specialist hours'
          : '8–16 specialist hours';

  return {
    packageId,
    pkg,
    basePriceCents,
    establishedUpliftCents,
    namedCardAddOnCents,
    totalPriceCents,
    totalLabel: formatPrice(totalPriceCents),
    why,
    hoursEstimate,
  };
}

export const MATURITY_OPTIONS: { id: BusinessMaturity; label: string; hint: string }[] = [
  { id: 'startup', label: 'Startup / new entity', hint: '0–18 months' },
  { id: 'early', label: 'Early operator', hint: '1–3 years' },
  { id: 'established', label: 'Established', hint: '3+ years — often more work' },
];

export const DESTINATION_OPTIONS: { id: BusinessDestination; label: string; hint: string }[] = [
  { id: 'G1_vendor', label: 'Vendor ready', hint: 'Net-30 / first reportables' },
  { id: 'G2_fundability', label: 'Fundability ready', hint: 'Trade depth for underwriting' },
  { id: 'G3_named_cards', label: 'Named cards / products', hint: 'Specific issuers you want' },
  { id: 'G4_scale', label: 'Scale / multi-entity', hint: 'Aggressive capital path' },
];
