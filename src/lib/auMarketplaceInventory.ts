/**
 * Shared AU marketplace presentation helpers for `/tradelines` + `/au/marketplace`.
 * Inventory rows come from `listApprovedMarketplaceListingsAsync` (Supabase-first).
 */
import type { AuCardFinish, AuCardNetwork } from '../components/landing/AuMarketplaceCard';
import { networkFromPan } from '../components/landing/AuMarketplaceCard';
import type { ApprovedMarketplaceListing } from '../data/auSellerRepo';

export type AuInventorySource = 'seller' | 'demo';

export type AuShowcaseListing = {
  id: string;
  issuer: string;
  finish: AuCardFinish;
  network: AuCardNetwork;
  pan: string;
  limit: string;
  age: string;
  /** Card face slots label (e.g. "2 of 5 seats"). */
  slots: string;
  season: string;
  utilOptics: string;
  reportsTo: string;
  badge?: string;
  source: AuInventorySource;
  live: boolean;
  sellerId?: string;
  listingId?: string;
  priceCents?: number;
  slotsAvailable?: number;
};

const FINISHES: AuCardFinish[] = ['platinum', 'gold', 'obsidian', 'emerald', 'sapphire', 'titanium'];
const DEMO_PANS = ['3706', '4929', '4118', '5412', '4532', '6011', '5310'] as const;

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function finishForBank(bank: string, seed = ''): AuCardFinish {
  const b = String(bank || '').toLowerCase();
  if (b.includes('american express') || b.includes('amex') || b.includes('platinum')) return 'platinum';
  if (b.includes('chase') || b.includes('sapphire')) return 'sapphire';
  if (b.includes('td')) return 'emerald';
  if (b.includes('citi') || b.includes('discover') || b.includes('gold')) return 'gold';
  if (b.includes('wells') || b.includes('capital one')) return 'titanium';
  if (b.includes('navy') || b.includes('barclay') || b.includes('black')) return 'obsidian';
  if (b.includes('bank of america') || b.includes('bofa') || b.includes('boa')) return 'gold';
  return FINISHES[hashStr(`${bank}|${seed}`) % FINISHES.length];
}

/** Stable illustrative last-4 for card face — not a real PAN. */
export function panForListing(bank: string, listingId: string): string {
  const b = String(bank || '').toLowerCase();
  if (b.includes('american express') || b.includes('amex')) return '3706';
  if (b.includes('chase')) return '4929';
  if (b.includes('td')) return '4118';
  if (b.includes('citi')) return '5412';
  if (b.includes('wells')) return '4532';
  if (b.includes('discover') || b.includes('bank of america') || b.includes('bofa')) return '6011';
  if (b.includes('navy') || b.includes('capital one')) return '5310';
  return DEMO_PANS[hashStr(listingId || bank) % DEMO_PANS.length];
}

export function networkForBank(bank: string, pan: string): AuCardNetwork {
  const b = String(bank || '').toLowerCase();
  if (b.includes('american express') || b.includes('amex')) return 'amex';
  if (b.includes('discover')) return 'discover';
  if (b.includes('citi') || b.includes('navy') || b.includes('mastercard')) return 'mastercard';
  if (b.includes('chase') || b.includes('td') || b.includes('wells') || b.includes('visa')) return 'visa';
  return networkFromPan(pan);
}

export function formatReportsTo(bureau?: string): string {
  const b = String(bureau || '').toLowerCase();
  if (!b || b === 'all') return 'EX · EQ · TU';
  if (b.includes('experian') || b === 'ex') return 'EX';
  if (b.includes('equifax') || b === 'eq') return 'EQ';
  if (b.includes('transunion') || b === 'tu') return 'TU';
  if (b.includes('ex') && b.includes('eq') && b.includes('tu')) return 'EX · EQ · TU';
  return bureau!.toUpperCase();
}

export function formatSeason(listing: Pick<ApprovedMarketplaceListing, 'statementDate' | 'reportingHistoryMonths'>): string {
  if (listing.statementDate) {
    const d = new Date(`${listing.statementDate}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      const day = d.getDate();
      const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
      return `Statement cycle · posts by the ${day}${suffix}`;
    }
  }
  if (listing.reportingHistoryMonths != null && listing.reportingHistoryMonths > 0) {
    return `${listing.reportingHistoryMonths}-month reporting history on file`;
  }
  return 'Posting window confirmed after seat reserve';
}

export function formatSlotsLabel(slotsAvailable?: number): string {
  if (slotsAvailable == null) return 'Seats on request';
  if (slotsAvailable <= 0) return '0 seats open';
  if (slotsAvailable === 1) return '1 seat open';
  return `${slotsAvailable} seats open`;
}

export function formatUtilOptics(utilizationPct?: number): string {
  if (utilizationPct == null) {
    return 'Utilization and season details confirmed when a seat is reserved — results vary by profile.';
  }
  const pct = Math.max(0, Math.min(100, Math.round(utilizationPct)));
  if (pct <= 9) return `Sub-${pct + 1}% utilization on file keeps revolving mix optics clean.`;
  if (pct <= 29) return `Reported near ${pct}% utilization — mid-band revolving optics for this season.`;
  return `Reported near ${pct}% utilization — confirm fit before reserve; results vary.`;
}

export function mapApprovedListingToShowcase(row: ApprovedMarketplaceListing): AuShowcaseListing {
  const pan = panForListing(row.bank, row.id);
  const slotsAvailable = row.slotsAvailable;
  const lowSeats = slotsAvailable != null && slotsAvailable > 0 && slotsAvailable <= 2;
  return {
    id: `seller:${row.sellerId}:${row.id}`,
    issuer: row.bank,
    finish: finishForBank(row.bank, row.id),
    network: networkForBank(row.bank, pan),
    pan,
    limit: row.limit,
    age: row.age,
    slots: formatSlotsLabel(slotsAvailable),
    season: formatSeason(row),
    utilOptics: formatUtilOptics(row.utilizationPct),
    reportsTo: formatReportsTo(row.bureau),
    badge: slotsAvailable === 0 ? 'Sold out' : lowSeats ? 'Limited seats' : 'Live inventory',
    source: 'seller',
    live: true,
    sellerId: row.sellerId,
    listingId: row.id,
    priceCents: Math.max(0, Math.round(row.priceCents || 0)),
    slotsAvailable,
  };
}

/** Build `/au/request` query for reserve / buyer intake. */
export function auRequestSearchParams(listing: AuShowcaseListing): URLSearchParams {
  const p = new URLSearchParams();
  p.set('source', listing.source === 'seller' ? 'seller' : 'demo');
  p.set('bank', listing.issuer);
  p.set('limit', listing.limit);
  p.set('age', listing.age);
  if (listing.priceCents != null && listing.priceCents > 0) p.set('priceCents', String(listing.priceCents));
  if (listing.sellerId) p.set('sellerId', listing.sellerId);
  if (listing.listingId) p.set('listingId', listing.listingId);
  return p;
}
