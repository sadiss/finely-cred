import type { NowDoThisItem } from '../components/tours/FinelyNowDoThisStrip';

/** Shared "Now do this" steps for onboarding BureauSync — matches sop-onboarding-monitoring. */
export const ONBOARDING_MONITORING_NOW_DO_ITEMS: NowDoThisItem[] = [
  {
    label: 'Open a partner card',
    detail: 'Same affiliate links as Resources — all four partners including SmartCredit.',
    to: '/resources#monitoring',
  },
  {
    label: 'Prefer HTML export',
    detail: 'MyScoreIQ, IdentityIQ, and SmartCredit parse best in the portal.',
    to: '/resources#monitoring',
  },
  {
    label: 'Skip if not ready',
    detail: 'Connect monitoring later from Resources.',
    to: '/onboarding',
  },
];
