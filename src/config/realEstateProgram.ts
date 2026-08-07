/**
 * Real-estate Role OS — LOCKED: tagged affiliate (interest=real_estate), not a new auth role enum.
 */

import { AF } from './affiliateProgram';

export const RE_INTEREST = 'real_estate' as const;
export const RE_PROMO_TYPE = 'real_estate_affiliate' as const;

/** Affiliate signup with RE interest tag preserved through onboarding. */
export const RE_AFFILIATE_SIGNUP_PATH =
  `/signup?auth=signup&role=affiliate&skipRole=1&interest=${RE_INTEREST}&promoType=${RE_PROMO_TYPE}&promo_type=${RE_PROMO_TYPE}`;

export const RE = {
  programName: 'Real Estate Affiliate',
  hubName: 'Real Estate Hub',
  hubPath: '/real-estate/hub',
  publicPath: '/careers/real-estate',
  guidePath: '/real-estate-guide',
  guideReadPath: '/real-estate-guide/read',
  affiliateHubPath: AF.hubPath,
  interest: RE_INTEREST,
  promoType: RE_PROMO_TYPE,
  messagesDeepLink: '/portal/messages?hub=team&topic=affiliate_program',
  signupPath: RE_AFFILIATE_SIGNUP_PATH,
} as const;

/** Normalize interest / promo tags that mean RE affiliate. */
export function isRealEstateInterestTag(raw: string | null | undefined): boolean {
  const v = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
  if (!v) return false;
  return (
    v === RE_INTEREST ||
    v === 'real_estate_affiliation' ||
    v === RE_PROMO_TYPE ||
    v === 're' ||
    v.includes('real_estate')
  );
}
