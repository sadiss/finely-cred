/** Authorized User (AU) seller / tradeline supply-side program config. */
export const AU_SELLER = {
  programName: 'AU Seller Program',
  hubName: 'AU Seller Hub',
  hubPath: '/seller/hub',
  publicPath: '/au-sellers',
  marketplacePath: '/au/marketplace',
  dashboardPath: '/seller/dashboard',
  listingsPath: '/seller/listings',
  contractsPath: '/seller/contracts',
  payoutsPath: '/seller/payouts',
  messagesDeepLink: '/portal/messages?hub=team&topic=au',
  defaultCommissionPct: 35,
  /** One-time seller activation (Stripe checkout package `au_seller_activation`). */
  startupFeeCents: 5000,
  startupFeeLabel: '$50 activation',
  checkoutPackageId: 'au_seller_activation',
  /** Managed listing cycle length (days) — sellers rotate cards after each season. */
  listingSeasonDays: 60,
  maxConcurrentSlotsPerCard: 2,
} as const;

export const AU_SELLER_MARKETING_HEADLINE = 'We market your tradelines. You supply the cards.';

export type AuSellerPayoutTier = {
  id: 'starter' | 'growth' | 'pro' | 'elite';
  name: string;
  payoutPct: number;
  /** Plain-English requirement — shown as a single line, not a dense table. */
  requirement: string;
  badge?: string;
};

/** Simple payout ladder — floor is `AU_SELLER.defaultCommissionPct` (35%). Advancement is by
 * inventory strength (card count + quality/reliability), reviewed automatically as sellers list
 * and fulfill placements. Keep this list short and readable — no dense requirement tables. */
export const AU_SELLER_PAYOUT_TIERS: AuSellerPayoutTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    payoutPct: 35,
    requirement: '1–2 verified cards, basic issuer requirements met.',
  },
  {
    id: 'growth',
    name: 'Growth',
    payoutPct: 45,
    requirement: '3+ cards, clean utilization, on-time season rotations.',
    badge: 'Most sellers land here',
  },
  {
    id: 'pro',
    name: 'Pro',
    payoutPct: 55,
    requirement: 'Higher limits, multi-bureau reporting, dependable fulfillment.',
  },
  {
    id: 'elite',
    name: 'Elite',
    payoutPct: 65,
    requirement: 'Volume inventory + perfect season compliance.',
    badge: 'Top sellers',
  },
];

export const AU_SELLER_OFFERINGS = [
  {
    title: 'Done-for-you buyer marketing',
    description:
      'Finely lists your verified inventory on our buyer marketplace, runs intake, and routes qualified orders — no ads, no DMs, no chasing buyers.',
    included: ['Public marketplace placement', 'Buyer intake & document flow', '60-day managed listing seasons', 'Seller support line'],
  },
  {
    title: 'List & fulfill AU slots',
    description: 'Publish tradeline inventory, manage contracts, and track buyer orders from one seller workspace.',
    included: ['Listing editor with bureau limits', 'Contract lifecycle tracking', 'Buyer order queue'],
  },
  {
    title: 'Payout visibility',
    description: 'See pending and completed payouts tied to fulfilled AU placements.',
    included: ['Payout history', 'Contract-linked earnings', 'Admin AU seller oversight'],
  },
  {
    title: 'Compliance & education',
    description: 'Training on AU best practices, buyer expectations, and Finely marketplace rules.',
    included: ['AU specialty training track', 'Marketplace policy guides', 'Rotation & removal best practices'],
  },
] as const;

export const AU_SELLER_ACTIVATION_BULLETS = [
  '$50 one-time activation includes your first 60-day marketing season',
  'Finely brings buyers — you fulfill placements and get paid',
  'Rotate cards every ~60 days to protect issuer risk and keep inventory fresh',
  'Optional re-list seasons after your first included cycle',
] as const;
