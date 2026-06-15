/** Authorized User (AU) seller / tradeline supply-side program config. */
export const AU_SELLER = {
  programName: 'AU Seller Program',
  hubName: 'AU Seller Hub',
  hubPath: '/seller/hub',
  marketplacePath: '/au/marketplace',
  dashboardPath: '/seller/dashboard',
  listingsPath: '/seller/listings',
  contractsPath: '/seller/contracts',
  payoutsPath: '/seller/payouts',
  messagesDeepLink: '/portal/messages?hub=team&topic=au',
  defaultCommissionPct: 15,
} as const;

export const AU_SELLER_OFFERINGS = [
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
    included: ['AU specialty training track', 'Marketplace policy guides', 'Seller support line'],
  },
  {
    title: 'Growth & marketing',
    description: 'Position your AU supply with clear pricing, profiles, and referral-ready marketplace links.',
    included: ['Public marketplace listing', 'Seller profile metrics', 'Shareable marketplace deep links'],
  },
] as const;
