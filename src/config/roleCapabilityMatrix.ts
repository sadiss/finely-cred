/** Role × route × entitlement reference for Role OS 2.0 (Admin Role Preview + docs). */

import type { RoleWorkflowId } from './roleWorkflows';

export type RoleCapabilityRole = 'partner' | 'business' | 'agent' | 'affiliate' | 'au_seller' | 'au_buyer' | 'heta_society' | 'admin';


export type RoleCapabilityRow = {
  role: RoleCapabilityRole;
  label: string;
  primaryRoutes: string[];
  entitlements: string[];
  earnModel: string;
};

export const ROLE_CAPABILITY_MATRIX: RoleCapabilityRow[] = [
  {
    role: 'partner',
    label: 'Partner (customer)',
    primaryRoutes: ['/portal/dashboard', '/portal/reports', '/portal/disputes', '/portal/billing'],
    entitlements: ['reports', 'disputes', 'letters', 'documents', 'tasks'],
    earnModel: 'Pays Finely — no outbound payouts',
  },
  {
    role: 'business',
    label: 'Business credit',
    primaryRoutes: ['/business/dashboard', '/portal/build', '/portal/billing'],
    entitlements: ['businessBuild', 'reports', 'documents'],
    earnModel: 'Customer pays business foundation / stacking packages',
  },
  {
    role: 'agent',
    label: 'Credit Specialist',
    primaryRoutes: ['/credit-specialist/hub', '/portal/dashboard', '/admin/partners'],
    entitlements: ['reports', 'disputes', 'letters', 'tasks', 'messages'],
    earnModel: 'Revenue share — % keep on customer files',
  },
  {
    role: 'affiliate',
    label: 'Affiliate',
    primaryRoutes: ['/affiliate/hub', '/affiliate/signup'],
    entitlements: ['affiliate tracking (referral_attributions)'],
    earnModel: 'Tiered commissions on referred conversions',
  },
  {
    role: 'au_seller',
    label: 'AU Seller',
    primaryRoutes: ['/au-seller/hub', '/tradelines?focus=au'],
    entitlements: ['auMarketplace supply listings'],
    earnModel: 'Payout on fulfilled AU contract lifecycle',
  },
  {
    role: 'au_buyer',
    label: 'AU Buyer',
    primaryRoutes: ['/au/marketplace', '/au/request', '/au/orders'],
    entitlements: ['auMarketplace browse + order intake'],
    earnModel: 'Pays for tradeline placement — no outbound payouts',
  },
  {
    role: 'heta_society',
    label: 'Head of Society (HOS)',
    primaryRoutes: ['/head-of-society', '/portal/hos', '/free-guide'],
    entitlements: ['disputes (5 slots)', 'letters', 'businessBuild', 'reports', 'free guide'],
    earnModel: 'Free member program — optional career path upsell to specialist/agent',
  },
  {
    role: 'admin',
    label: 'Platform admin',
    primaryRoutes: ['/admin', '/admin/partners', '/admin/leads-os', '/admin/settings'],
    entitlements: ['all modules + ops caps'],
    earnModel: 'Internal — no customer payouts',
  },
];

export function capabilitiesForRole(role: RoleCapabilityRole): RoleCapabilityRow | undefined {
  return ROLE_CAPABILITY_MATRIX.find((r) => r.role === role);
}

/** Map admin role preview tabs to end-to-end workflow panels. */
export function workflowIdForCapabilityRole(role: RoleCapabilityRole): RoleWorkflowId | null {
  switch (role) {
    case 'partner':
      return 'client';
    case 'business':
      return 'business';
    case 'agent':
      return 'agent';
    case 'affiliate':
      return 'affiliate';
    case 'au_seller':
      return 'au_seller';
    case 'au_buyer':
      return 'au_buyer';
    case 'heta_society':
      return 'client';
    default:
      return null;
  }
}
