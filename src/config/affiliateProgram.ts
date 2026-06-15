/** User-facing affiliate program config (internal role id stays `affiliate`). */
export const AF = {
  programName: 'Affiliate Program',
  hubName: 'Affiliate Hub',
  hubPath: '/affiliate/hub',
  publicPath: '/affiliate',
  defaultCommissionPct: 20,
  defaultRecurringCommissionPct: 15,
  defaultDenefitsSharePct: 8,
  messagesDeepLink: '/portal/messages?hub=team&topic=affiliate_program',
} as const;

export const AFFILIATE_OFFERINGS = [
  {
    title: 'Tracked referral links',
    description: 'Share Finely services with unique links — conversions attributed to your account.',
    included: ['Referral codes & UTM-ready links', 'Lead capture on applications', 'CRM pipeline visibility for admins'],
  },
  {
    title: 'Commission calculator',
    description: 'Model upfront payouts plus recurring share when your referrals stay on membership plans.',
    included: ['Upfront sale commission', 'Optional recurring months', 'Transparent percentage inputs'],
  },
  {
    title: 'Denefit referral stream',
    description: 'Refer in-house Denefit contracts — clients build credit on Equifax as they pay; you earn over the contract term.',
    included: ['Equifax reporting story for prospects', 'Denefit calculator in hub', 'Stacks with upfront package commission'],
  },
  {
    title: 'Marketing kit',
    description: 'Education library, ebooks, and Comms templates you can share with your audience.',
    included: ['Portal education resources', 'Affiliate agreement template', 'Co-branded assets as program expands'],
  },
  {
    title: 'Affiliate partnership line',
    description: 'Message Finely ops for payouts, compliance questions, and campaign support.',
    included: ['Portal messages thread', 'Application → lead workflow', 'Admin Support Inbox replies'],
  },
] as const;
